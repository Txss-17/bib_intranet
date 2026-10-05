import {
  createClient,
} from "npm:@supabase/supabase-js@2";

import {
  getGmailHeader,
  getGmailMessage,
  getGmailMessageDate,
  getGmailProfile,
  getGmailMessageText,
  listGmailMessages,
} from "../_shared/google-gmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SyncState = {
  id: string;
  mailbox_email: string;
  history_id: string | null;
  last_sync_started_at: string | null;
  last_sync_completed_at: string | null;
  last_sync_status:
    | "never_run"
    | "running"
    | "success"
    | "partial"
    | "failed";
  last_sync_error: string | null;
  messages_imported: number;
  messages_skipped: number;
  messages_failed: number;
};

type SyncResult = {
  success: boolean;
  mailbox: string;
  imported: number;
  skipped: number;
  failed: number;
  totalFound: number;
  message?: string;
};

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function parseSender(
  value: string | null,
): {
  email: string;
  name: string | null;
} {
  if (!value) {
    return {
      email: "",
      name: null,
    };
  }

  const normalized = value.trim();

  const angleMatch = normalized.match(
    /^(.*?)\s*<([^<>]+)>$/,
  );

  if (angleMatch) {
    const name = angleMatch[1]
      .trim()
      .replace(/^["']|["']$/g, "");

    return {
      email: angleMatch[2].trim(),
      name: name || null,
    };
  }

  return {
    email: normalized,
    name: null,
  };
}

function extractSubject(
  value: string | null,
): string {
  return value?.trim() || "(Sans objet)";
}

function isBIBSentMessage(
  from: string,
  mailbox: string,
): boolean {
  const normalizedFrom = from
    .trim()
    .toLowerCase();

  const normalizedMailbox = mailbox
    .trim()
    .toLowerCase();

  return normalizedFrom === normalizedMailbox;
}

function buildMessageContent(
  messageText: string,
  snippet: string | undefined,
): string {
  const content = messageText.trim();

  if (content) {
    return content;
  }

  return snippet?.trim() ?? "";
}

async function getOrCreateSyncState(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  mailboxEmail: string,
): Promise<SyncState> {
  const { data: existing, error: existingError } =
    await supabase
      .from("gmail_sync_state")
      .select("*")
      .eq("mailbox_email", mailboxEmail)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `Unable to read Gmail sync state: ${existingError.message}`,
    );
  }

  if (existing) {
    return existing as SyncState;
  }

  const { data: created, error: createError } =
    await supabase
      .from("gmail_sync_state")
      .insert({
        mailbox_email: mailboxEmail,
        last_sync_status: "never_run",
      })
      .select("*")
      .single();

  if (createError || !created) {
    throw new Error(
      `Unable to create Gmail sync state: ${
        createError?.message ?? "unknown error"
      }`,
    );
  }

  return created as SyncState;
}

async function markSyncStarted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  state: SyncState,
): Promise<void> {
  const { error } = await supabase
    .from("gmail_sync_state")
    .update({
      last_sync_started_at:
        new Date().toISOString(),
      last_sync_status: "running",
      last_sync_error: null,
    })
    .eq("id", state.id);

  if (error) {
    throw new Error(
      `Unable to mark Gmail sync as running: ${error.message}`,
    );
  }
}

async function markSyncCompleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  state: SyncState,
  result: {
    status:
      | "success"
      | "partial"
      | "failed";
    historyId: string | null;
    imported: number;
    skipped: number;
    failed: number;
    error?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("gmail_sync_state")
    .update({
      history_id:
        result.historyId ?? state.history_id,
      last_sync_completed_at:
        new Date().toISOString(),
      last_sync_status: result.status,
      last_sync_error:
        result.error ?? null,
      messages_imported:
        result.imported,
      messages_skipped:
        result.skipped,
      messages_failed:
        result.failed,
    })
    .eq("id", state.id);

  if (error) {
    throw new Error(
      `Unable to update Gmail sync state: ${error.message}`,
    );
  }
}

async function messageAlreadyImported(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  gmailMessageId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("external_messages")
    .select("id")
    .eq(
      "gmail_message_id",
      gmailMessageId,
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to check existing Gmail message: ${error.message}`,
    );
  }

  return Boolean(data);
}

async function importGmailMessage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  messageId: string,
  mailboxEmail: string,
): Promise<
  "imported" | "skipped"
> {
  if (
    await messageAlreadyImported(
      supabase,
      messageId,
    )
  ) {
    return "skipped";
  }

  const message =
    await getGmailMessage(messageId);

  const fromHeader =
    getGmailHeader(message, "From");

  const sender =
    parseSender(fromHeader);

  if (!sender.email) {
    throw new Error(
      `Gmail message ${messageId} has no valid sender.`,
    );
  }

  /*
   * Messages sent by the BIB mailbox itself must not be
   * imported as new incoming messages.
   */
  if (
    isBIBSentMessage(
      sender.email,
      mailboxEmail,
    )
  ) {
    return "skipped";
  }

  const subject = extractSubject(
    getGmailHeader(
      message,
      "Subject",
    ),
  );

  const content =
    buildMessageContent(
      getGmailMessageText(message),
      message.snippet,
    );

  const messageIdHeader =
    getGmailHeader(
      message,
      "Message-ID",
    );

  const inReplyTo =
    getGmailHeader(
      message,
      "In-Reply-To",
    );

  const references =
    getGmailHeader(
      message,
      "References",
    );

  const labelIds =
    message.labelIds ?? [];

  const gmailDate =
    getGmailMessageDate(message);

  /*
   * New messages are intentionally created without a pole
   * assignment.
   *
   * This allows Gateway Inbox to receive the message first,
   * then attribute it to the correct pole/responsible.
   */
  const insertPayload = {
    sender_email: sender.email,
    sender_name: sender.name,
    subject,
    content,

    status: "pending",

    routed_to_pole: null,

    validated_by: null,
    validation_notes: null,

    response_content: null,
    responded_by: null,
    responded_at: null,

    gmail_message_id: message.id,
    gmail_thread_id:
      message.threadId ?? null,
    gmail_history_id:
      message.historyId ?? null,

    gmail_message_id_header:
      messageIdHeader,
    gmail_in_reply_to:
      inReplyTo,
    gmail_references:
      references,

    gmail_label_ids:
      labelIds,

    gmail_internal_date:
      gmailDate,

    gmail_synced_at:
      new Date().toISOString(),
  };

  const { error } = await supabase
    .from("external_messages")
    .insert(insertPayload);

  if (error) {
    /*
     * The unique Gmail message ID protects against concurrent
     * synchronization attempts.
     *
     * If another sync imported it first, consider it skipped.
     */
    if (
      error.code === "23505"
    ) {
      return "skipped";
    }

    throw new Error(
      `Unable to insert Gmail message ${messageId}: ${error.message}`,
    );
  }

  return "imported";
}

async function syncMailbox(): Promise<SyncResult> {
  const supabase =
    getSupabaseAdmin();

  const profile =
    await getGmailProfile();

  const mailboxEmail =
    profile.emailAddress;

  if (!mailboxEmail) {
    throw new Error(
      "Google Gmail profile did not return an email address.",
    );
  }

  const state =
    await getOrCreateSyncState(
      supabase,
      mailboxEmail,
    );

  await markSyncStarted(
    supabase,
    state,
  );

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  let totalFound = 0;

  let latestHistoryId =
    profile.historyId ??
    state.history_id ??
    null;

  try {
    /*
     * First implementation intentionally uses Gmail search
     * rather than Gmail History API.
     *
     * This is easier to validate during the first Gateway
     * rollout and is safe because gmail_message_id has a
     * unique index in external_messages.
     *
     * Later we can move to incremental History API sync.
     */
    let pageToken:
      | string
      | undefined;

    do {
      const page =
        await listGmailMessages({
          query:
            "in:inbox -from:me",
          maxResults: 100,
          pageToken,
        });

      const messages =
        page.messages ?? [];

      totalFound +=
        messages.length;

      for (const message of messages) {
        try {
          const result =
            await importGmailMessage(
              supabase,
              message.id,
              mailboxEmail,
            );

          if (
            result === "imported"
          ) {
            imported++;
          } else {
            skipped++;
          }
        } catch (error) {
          failed++;

          console.error(
            "Gmail message import failed",
            {
              messageId:
                message.id,
              error:
                error instanceof Error
                  ? error.message
                  : String(error),
            },
          );
        }
      }

      pageToken =
        page.nextPageToken;

      /*
       * The profile history ID represents the latest known
       * mailbox state after this synchronization.
       */
      if (pageToken) {
        /*
         * Continue pagination.
         */
      }
    } while (pageToken);

    latestHistoryId =
      profile.historyId ??
      latestHistoryId;

    const status =
      failed > 0
        ? imported > 0
          ? "partial"
          : "failed"
        : "success";

    await markSyncCompleted(
      supabase,
      state,
      {
        status,
        historyId:
          latestHistoryId,
        imported,
        skipped,
        failed,
      },
    );

    return {
      success:
        status !== "failed",
      mailbox: mailboxEmail,
      imported,
      skipped,
      failed,
      totalFound,
      message:
        "Gmail synchronization completed.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    await markSyncCompleted(
      supabase,
      state,
      {
        status: "failed",
        historyId:
          latestHistoryId,
        imported,
        skipped,
        failed,
        error: errorMessage,
      },
    );

    throw error;
  }
}

Deno.serve(
  async (req: Request) => {
    if (
      req.method === "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      req.method !== "POST"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Method not allowed.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    try {
      const result =
        await syncMailbox();

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    } catch (error) {
      console.error(
        "Gmail synchronization failed",
        error,
      );

      return new Response(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }
  },
);