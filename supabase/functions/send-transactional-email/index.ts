import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getStringValue(
  value: unknown
): string | undefined {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : undefined
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing required Supabase environment variables'
    )

    return new Response(
      JSON.stringify({
        error: 'Server configuration error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  let templateName: string
  let recipientEmail: string | undefined
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}

  /*
   * Optional Gmail threading metadata.
   *
   * These values are supplied by Gateway when responding to
   * an existing Gmail message.
   */
  let gmailThreadId: string | undefined
  let inReplyTo: string | undefined
  let references: string | undefined
  let replyTo: string | undefined

  try {
    const body = await req.json()

    templateName =
      body.templateName ||
      body.template_name

    recipientEmail =
      body.recipientEmail ||
      body.recipient_email

    messageId = crypto.randomUUID()

    idempotencyKey =
      body.idempotencyKey ||
      body.idempotency_key ||
      messageId

    if (
      body.templateData &&
      typeof body.templateData === 'object'
    ) {
      templateData = body.templateData
    }

    gmailThreadId =
      getStringValue(
        body.gmailThreadId
      ) ||
      getStringValue(
        body.gmail_thread_id
      ) ||
      getStringValue(
        templateData.gmailThreadId
      ) ||
      getStringValue(
        templateData.gmail_thread_id
      )

    inReplyTo =
      getStringValue(
        body.inReplyTo
      ) ||
      getStringValue(
        body.in_reply_to
      ) ||
      getStringValue(
        templateData.inReplyTo
      ) ||
      getStringValue(
        templateData.in_reply_to
      )

    references =
      getStringValue(
        body.references
      ) ||
      getStringValue(
        templateData.references
      )

    replyTo =
      getStringValue(
        body.replyTo
      ) ||
      getStringValue(
        body.reply_to
      ) ||
      getStringValue(
        templateData.replyTo
      ) ||
      getStringValue(
        templateData.reply_to
      )
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON in request body',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({
        error: 'templateName is required',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  /*
   * 1. Resolve template.
   */
  const template = TEMPLATES[templateName]

  if (!template) {
    console.error(
      'Template not found in registry',
      {
        templateName,
      }
    )

    return new Response(
      JSON.stringify({
        error:
          `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  /*
   * Template-level recipient takes precedence over the
   * caller-provided recipient.
   */
  const effectiveRecipient =
    template.to ||
    recipientEmail

  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error:
          'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
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
   * 2. Suppression list.
   *
   * This remains before queue insertion so a suppressed
   * recipient never reaches Gmail.
   */
  const normalizedEmail =
    effectiveRecipient.toLowerCase()

  const {
    data: suppressed,
    error: suppressionError,
  } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (suppressionError) {
    console.error(
      'Suppression check failed — refusing to send',
      {
        error: suppressionError,
        effectiveRecipient,
      }
    )

    return new Response(
      JSON.stringify({
        error:
          'Failed to verify suppression status',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  if (suppressed) {
    await supabase
      .from('email_send_log')
      .insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email:
          effectiveRecipient,
        status: 'suppressed',
      })

    console.log(
      'Email suppressed',
      {
        effectiveRecipient,
        templateName,
      }
    )

    return new Response(
      JSON.stringify({
        success: false,
        reason: 'email_suppressed',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  /*
   * 3. Unsubscribe token.
   *
   * Kept for compatibility with the existing transactional
   * email system.
   */
  let unsubscribeToken: string

  const {
    data: existingToken,
    error: tokenLookupError,
  } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error(
      'Token lookup failed',
      {
        error: tokenLookupError,
        email: normalizedEmail,
      }
    )

    await supabase
      .from('email_send_log')
      .insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email:
          effectiveRecipient,
        status: 'failed',
        error_message:
          'Failed to look up unsubscribe token',
      })

    return new Response(
      JSON.stringify({
        error:
          'Failed to prepare email',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }

  if (
    existingToken &&
    !existingToken.used_at
  ) {
    unsubscribeToken =
      existingToken.token
  } else if (!existingToken) {
    unsubscribeToken =
      generateToken()

    const {
      error: tokenError,
    } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        {
          token: unsubscribeToken,
          email: normalizedEmail,
        },
        {
          onConflict: 'email',
          ignoreDuplicates: true,
        }
      )

    if (tokenError) {
      console.error(
        'Failed to create unsubscribe token',
        {
          error: tokenError,
        }
      )

      await supabase
        .from('email_send_log')
        .insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email:
            effectiveRecipient,
          status: 'failed',
          error_message:
            'Failed to create unsubscribe token',
        })

      return new Response(
        JSON.stringify({
          error:
            'Failed to prepare email',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    const {
      data: storedToken,
      error: reReadError,
    } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (
      reReadError ||
      !storedToken
    ) {
      console.error(
        'Failed to read back unsubscribe token',
        {
          error: reReadError,
          email: normalizedEmail,
        }
      )

      await supabase
        .from('email_send_log')
        .insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email:
            effectiveRecipient,
          status: 'failed',
          error_message:
            'Failed to confirm unsubscribe token storage',
        })

      return new Response(
        JSON.stringify({
          error:
            'Failed to prepare email',
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type':
              'application/json',
          },
        }
      )
    }

    unsubscribeToken =
      storedToken.token
  } else {
    console.warn(
      'Unsubscribe token already used but email not suppressed',
      {
        email: normalizedEmail,
      }
    )

    await supabase
      .from('email_send_log')
      .insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email:
          effectiveRecipient,
        status: 'suppressed',
        error_message:
          'Unsubscribe token used but email missing from suppressed list',
      })

    return new Response(
      JSON.stringify({
        success: false,
        reason: 'email_suppressed',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    )
  }

  /*
   * 4. Render the React Email template.
   */
  const html = await renderAsync(
    React.createElement(
      template.component,
      templateData
    )
  )

  const plainText =
    await renderAsync(
      React.createElement(
        template.component,
        templateData
      ),
      {
        plainText: true,
      }
    )

  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(
          templateData
        )
      : template.subject

  /*
   * 5. Queue the email.
   *
   * IMPORTANT:
   *
   * There is intentionally no Lovable sender domain here.
   *
   * Google Workspace/Gmail is now the transport.
   *
   * The actual sender is selected by process-email-queue
   * from GOOGLE_WORKSPACE_IMPERSONATED_USER.
   */
  await supabase
    .from('email_send_log')
    .insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email:
        effectiveRecipient,
      status: 'pending',
    })

  const queuePayload: Record<
    string,
    unknown
  > = {
    message_id: messageId,
    to: effectiveRecipient,
    subject: resolvedSubject,
    html,
    text: plainText,
    purpose: 'transactional',
    label: templateName,
    idempotency_key:
      idempotencyKey,
    unsubscribe_token:
      unsubscribeToken,
    queued_at:
      new Date().toISOString(),
  }

  /*
   * Preserve Gmail threading metadata when supplied.
   */
  if (gmailThreadId) {
    queuePayload.gmail_thread_id =
      gmailThreadId
  }

  if (inReplyTo) {
    queuePayload.in_reply_to =
      inReplyTo
  }

  if (references) {
    queuePayload.references =
      references
  }

  if (replyTo) {
    queuePayload.reply_to =
      replyTo
  }

  const {
    error: enqueueError,
  } = await supabase.rpc(
    'enqueue_email',
    {
      queue_name:
        'transactional_emails',
      payload: queuePayload,
    }
  )

  if (enqueueError) {
    console.error(
      'Failed to enqueue email',
      {
        error: enqueueError,
        templateName,
        effectiveRecipient,
      }
    )

    await supabase
      .from('email_send_log')
      .insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email:
          effectiveRecipient,
        status: 'failed',
        error_message:
          'Failed to enqueue email',
      })

    return new Response(
      JSON.stringify({
        error:
          'Failed to enqueue email',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type':
            'application/json',
        },
      }
    )
  }

  console.log(
    'Transactional email enqueued for Google Workspace Gmail',
    {
      templateName,
      effectiveRecipient,
      gmailThreadId:
        gmailThreadId ?? null,
      inReplyTo:
        inReplyTo ?? null,
    }
  )

  return new Response(
    JSON.stringify({
      success: true,
      queued: true,
      transport:
        'google-workspace-gmail',
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type':
          'application/json',
      },
    }
  )
})
