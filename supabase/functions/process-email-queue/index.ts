import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  getImpersonatedGmailUser,
  sendGmailMessage,
} from '../_shared/google-gmail.ts'

const MAX_RETRIES = 5
const DEFAULT_BATCH_SIZE = 10
const DEFAULT_SEND_DELAY_MS = 200
const DEFAULT_AUTH_TTL_MINUTES = 15
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60

function isRateLimited(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 429
  }

  return error instanceof Error && error.message.includes('(429)')
}

function isForbidden(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 403
  }

  return error instanceof Error && error.message.includes('(403)')
}

function getRetryAfterSeconds(error: unknown): number {
  if (
    error &&
    typeof error === 'object' &&
    'retryAfterSeconds' in error
  ) {
    const value = (error as { retryAfterSeconds: number | null })
      .retryAfterSeconds

    if (typeof value === 'number' && value > 0) {
      return value
    }
  }

  return 60
}

function getPayloadString(
  payload: Record<string, unknown>,
  key: string
): string | undefined {
  const value = payload[key]

  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined
}

async function moveToDlq(
  supabase: ReturnType<typeof createClient>,
  queue: string,
  msg: {
    msg_id: number
    message: Record<string, unknown>
  },
  reason: string
): Promise<void> {
  const payload = msg.message

  await supabase.from('email_send_log').insert({
    message_id:
      typeof payload.message_id === 'string'
        ? payload.message_id
        : null,
    template_name:
      typeof payload.label === 'string'
        ? payload.label
        : queue,
    recipient_email:
      typeof payload.to === 'string'
        ? payload.to
        : null,
    status: 'dlq',
    error_message: reason,
  })

  const { error } = await supabase.rpc('move_to_dlq', {
    source_queue: queue,
    dlq_name: `${queue}_dlq`,
    message_id: msg.msg_id,
    payload,
  })

  if (error) {
    console.error('Failed to move message to DLQ', {
      queue,
      msg_id: msg.msg_id,
      reason,
      error,
    })
  }
}

function normalizeRecipient(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Missing recipient email')
  }

  const recipient = value.trim()

  if (!recipient) {
    throw new Error('Missing recipient email')
  }

  return recipient
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY'
  )

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required Supabase environment variables')

    return new Response(
      JSON.stringify({
        error: 'Server configuration error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const authHeader = req.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  /*
   * process-email-queue is an internal worker.
   *
   * Only a service-role JWT is allowed to execute it.
   * This prevents a normal authenticated browser session from
   * directly consuming the email queues.
   */
  const token = authHeader.slice('Bearer '.length).trim()

  const parts = token.split('.')

  if (parts.length < 2) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  let claims: Record<string, unknown> | null = null

  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(
        Math.ceil(parts[1].length / 4) * 4,
        '='
      )

    claims = JSON.parse(
      atob(payload)
    ) as Record<string, unknown>
  } catch {
    claims = null
  }

  if (claims?.role !== 'service_role') {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey
  )

  /*
   * Verify that the Google Workspace mailbox is configured
   * before consuming the queue.
   *
   * The mailbox is the actual BIB Gmail identity used for
   * external communication.
   */
  let gmailSender: string

  try {
    gmailSender = getImpersonatedGmailUser()
  } catch (error) {
    console.error(
      'Google Workspace Gmail configuration is missing',
      error
    )

    return new Response(
      JSON.stringify({
        error: 'Google Workspace Gmail is not configured',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const { data: state, error: stateError } = await supabase
    .from('email_send_state')
    .select(
      `
        retry_after_until,
        batch_size,
        send_delay_ms,
        auth_email_ttl_minutes,
        transactional_email_ttl_minutes
      `
    )
    .single()

  if (stateError) {
    console.error(
      'Failed to load email send state',
      stateError
    )
  }

  if (
    state?.retry_after_until &&
    new Date(state.retry_after_until) > new Date()
  ) {
    return new Response(
      JSON.stringify({
        skipped: true,
        reason: 'rate_limited',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  const batchSize =
    state?.batch_size ?? DEFAULT_BATCH_SIZE

  const sendDelayMs =
    state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS

  const ttlMinutes: Record<string, number> = {
    auth_emails:
      state?.auth_email_ttl_minutes ??
      DEFAULT_AUTH_TTL_MINUTES,

    transactional_emails:
      state?.transactional_email_ttl_minutes ??
      DEFAULT_TRANSACTIONAL_TTL_MINUTES,
  }

  let totalProcessed = 0

  for (
    const queue of [
      'auth_emails',
      'transactional_emails',
    ]
  ) {
    const { data: messages, error: readError } =
      await supabase.rpc('read_email_batch', {
        queue_name: queue,
        batch_size: batchSize,
        vt: 30,
      })

    if (readError) {
      console.error(
        'Failed to read email batch',
        {
          queue,
          error: readError,
        }
      )

      continue
    }

    if (!messages?.length) {
      continue
    }

    /*
     * Load previous failed attempts so retry behaviour remains
     * compatible with the existing queue implementation.
     */
    const messageIds = Array.from(
      new Set(
        messages
          .map((msg) =>
            msg?.message?.message_id &&
            typeof msg.message.message_id === 'string'
              ? msg.message.message_id
              : null
          )
          .filter(
            (id): id is string =>
              Boolean(id)
          )
      )
    )

    const failedAttemptsByMessageId =
      new Map<string, number>()

    if (messageIds.length > 0) {
      const {
        data: failedRows,
        error: failedRowsError,
      } = await supabase
        .from('email_send_log')
        .select('message_id')
        .in('message_id', messageIds)
        .eq('status', 'failed')

      if (failedRowsError) {
        console.error(
          'Failed to load failed-attempt counters',
          {
            queue,
            error: failedRowsError,
          }
        )
      } else {
        for (const row of failedRows ?? []) {
          const messageId = row?.message_id

          if (
            typeof messageId !== 'string' ||
            !messageId
          ) {
            continue
          }

          failedAttemptsByMessageId.set(
            messageId,
            (failedAttemptsByMessageId.get(
              messageId
            ) ?? 0) + 1
          )
        }
      }
    }

    for (
      let i = 0;
      i < messages.length;
      i++
    ) {
      const msg = messages[i]
      const payload =
        msg.message as Record<string, unknown>

      const failedAttempts =
        typeof payload.message_id === 'string'
          ? (
              failedAttemptsByMessageId.get(
                payload.message_id
              ) ?? 0
            )
          : msg.read_ct ?? 0

      /*
       * TTL protection.
       */
      const queuedAt =
        payload.queued_at ??
        msg.enqueued_at

      if (queuedAt) {
        const queuedDate =
          new Date(String(queuedAt))

        if (!Number.isNaN(queuedDate.getTime())) {
          const ageMs =
            Date.now() -
            queuedDate.getTime()

          const maxAgeMs =
            ttlMinutes[queue] *
            60 *
            1000

          if (ageMs > maxAgeMs) {
            console.warn(
              'Email expired (TTL exceeded)',
              {
                queue,
                msg_id: msg.msg_id,
                queued_at: queuedAt,
                ttl_minutes:
                  ttlMinutes[queue],
              }
            )

            await moveToDlq(
              supabase,
              queue,
              msg,
              `TTL exceeded (${ttlMinutes[queue]} minutes)`
            )

            continue
          }
        }
      }

      /*
       * Maximum retry protection.
       */
      if (failedAttempts >= MAX_RETRIES) {
        await moveToDlq(
          supabase,
          queue,
          msg,
          `Max retries (${MAX_RETRIES}) exceeded (attempted ${failedAttempts} times)`
        )

        continue
      }

      /*
       * Idempotency protection.
       *
       * If the message was already successfully transmitted,
       * remove the duplicate queue entry instead of sending it
       * again.
       */
      if (
        typeof payload.message_id === 'string' &&
        payload.message_id
      ) {
        const {
          data: alreadySent,
        } = await supabase
          .from('email_send_log')
          .select('id')
          .eq(
            'message_id',
            payload.message_id
          )
          .eq('status', 'sent')
          .maybeSingle()

        if (alreadySent) {
          console.warn(
            'Skipping duplicate send (already sent)',
            {
              queue,
              msg_id: msg.msg_id,
              message_id:
                payload.message_id,
            }
          )

          const {
            error: dupDelError,
          } = await supabase.rpc(
            'delete_email',
            {
              queue_name: queue,
              message_id: msg.msg_id,
            }
          )

          if (dupDelError) {
            console.error(
              'Failed to delete duplicate message from queue',
              {
                queue,
                msg_id: msg.msg_id,
                error: dupDelError,
              }
            )
          }

          continue
        }
      }

      try {
        const recipient =
          normalizeRecipient(
            payload.to
          )

        const subject =
          getPayloadString(
            payload,
            'subject'
          ) ?? ''

        const text =
          getPayloadString(
            payload,
            'text'
          ) ?? ''

        const html =
          getPayloadString(
            payload,
            'html'
          )

        /*
         * Google Workspace is now the actual transport.
         *
         * We intentionally do NOT use the `from` value stored by
         * the old Lovable email infrastructure.
         *
         * Gmail sends through the Workspace account configured by
         * domain-wide delegation:
         *
         * GOOGLE_WORKSPACE_IMPERSONATED_USER
         */
        const requestedFrom =
          getPayloadString(
            payload,
            'from'
          )

        /*
         * The current transactional-email function still puts
         * the former Lovable sender in `from`.
         *
         * Do not forward that address to Gmail.
         *
         * The delegated Workspace mailbox remains the authoritative
         * BIB sender until an approved Workspace alias system is
         * implemented.
         */
        const from =
          requestedFrom &&
          requestedFrom
            .toLowerCase()
            .includes(
              gmailSender.toLowerCase()
            )
            ? gmailSender
            : gmailSender

        const replyTo =
          getPayloadString(
            payload,
            'reply_to'
          )

        const inReplyTo =
          getPayloadString(
            payload,
            'in_reply_to'
          )

        const references =
          getPayloadString(
            payload,
            'references'
          )

        const threadId =
          getPayloadString(
            payload,
            'gmail_thread_id'
          )

        console.log(
          'Sending email through Google Workspace Gmail',
          {
            queue,
            msg_id: msg.msg_id,
            message_id:
              payload.message_id,
            recipient,
            subject,
            from,
            has_html: Boolean(html),
            has_thread_id:
              Boolean(threadId),
            has_in_reply_to:
              Boolean(inReplyTo),
          }
        )

        await sendGmailMessage({
          to: recipient,
          subject,
          text,
          html,
          from,
          replyTo,
          inReplyTo,
          references,
          threadId,
        })

        /*
         * The message reached Gmail successfully.
         */
        await supabase
          .from('email_send_log')
          .insert({
            message_id:
              typeof payload.message_id ===
              'string'
                ? payload.message_id
                : null,
            template_name:
              typeof payload.label ===
              'string'
                ? payload.label
                : queue,
            recipient_email:
              recipient,
            status: 'sent',
          })

        /*
         * Only delete the queue item AFTER Gmail accepted it.
         */
        const {
          error: delError,
        } = await supabase.rpc(
          'delete_email',
          {
            queue_name: queue,
            message_id: msg.msg_id,
          }
        )

        if (delError) {
          console.error(
            'Failed to delete sent message from queue',
            {
              queue,
              msg_id: msg.msg_id,
              error: delError,
            }
          )
        }

        totalProcessed++
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : String(error)

        console.error(
          'Google Workspace Gmail send failed',
          {
            queue,
            msg_id: msg.msg_id,
            read_ct: msg.read_ct,
            failed_attempts:
              failedAttempts,
            error: errorMsg,
          }
        )

        /*
         * Gmail quota / rate-limit.
         */
        if (isRateLimited(error)) {
          await supabase
            .from('email_send_log')
            .insert({
              message_id:
                typeof payload.message_id ===
                'string'
                  ? payload.message_id
                  : null,
              template_name:
                typeof payload.label ===
                'string'
                  ? payload.label
                  : queue,
              recipient_email:
                typeof payload.to ===
                'string'
                  ? payload.to
                  : null,
              status: 'rate_limited',
              error_message:
                errorMsg.slice(0, 1000),
            })

          const retryAfterSecs =
            getRetryAfterSeconds(
              error
            )

          await supabase
            .from('email_send_state')
            .update({
              retry_after_until:
                new Date(
                  Date.now() +
                    retryAfterSecs *
                      1000
                ).toISOString(),
              updated_at:
                new Date().toISOString(),
            })
            .eq('id', 1)

          return new Response(
            JSON.stringify({
              processed:
                totalProcessed,
              stopped:
                'rate_limited',
            }),
            {
              headers: {
                'Content-Type':
                  'application/json',
              },
            }
          )
        }

        /*
         * A Gmail 403 normally means a configuration /
         * authorization / Workspace delegation problem.
         *
         * Do not endlessly retry such a message.
         */
        if (isForbidden(error)) {
          await moveToDlq(
            supabase,
            queue,
            msg,
            'Google Workspace Gmail authorization/configuration error'
          )

          return new Response(
            JSON.stringify({
              processed:
                totalProcessed,
              stopped:
                'gmail_authorization_error',
            }),
            {
              headers: {
                'Content-Type':
                  'application/json',
              },
            }
          )
        }

        /*
         * Normal failure: keep the message in the queue so
         * the next worker execution can retry it.
         */
        await supabase
          .from('email_send_log')
          .insert({
            message_id:
              typeof payload.message_id ===
              'string'
                ? payload.message_id
                : null,
            template_name:
              typeof payload.label ===
              'string'
                ? payload.label
                : queue,
            recipient_email:
              typeof payload.to ===
              'string'
                ? payload.to
                : null,
            status: 'failed',
            error_message:
              errorMsg.slice(0, 1000),
          })

        if (
          typeof payload.message_id ===
          'string'
        ) {
          failedAttemptsByMessageId.set(
            payload.message_id,
            failedAttempts + 1
          )
        }
      }

      if (
        i <
        messages.length - 1
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              sendDelayMs
            )
        )
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed: totalProcessed,
      transport: 'google-workspace-gmail',
      sender: gmailSender,
    }),
    {
      headers: {
        'Content-Type':
          'application/json',
      },
    }
  )
})
