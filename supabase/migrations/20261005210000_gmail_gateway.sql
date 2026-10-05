-- ============================================================
-- BIB Gateway — Google Gmail synchronization
-- Migration: 20261005210000_gmail_gateway.sql
--
-- Purpose:
--   - Link external_messages to Gmail messages
--   - Prevent duplicate Gmail imports
--   - Preserve Gmail threading information
--   - Track synchronization state
--
-- Important:
--   This migration does NOT send or receive emails by itself.
--   The Gmail Edge Functions will use these fields.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Gmail metadata on external_messages
-- ============================================================

ALTER TABLE public.external_messages
  ADD COLUMN IF NOT EXISTS gmail_message_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_history_id TEXT,
  ADD COLUMN IF NOT EXISTS gmail_message_id_header TEXT,
  ADD COLUMN IF NOT EXISTS gmail_in_reply_to TEXT,
  ADD COLUMN IF NOT EXISTS gmail_references TEXT,
  ADD COLUMN IF NOT EXISTS gmail_label_ids TEXT[],
  ADD COLUMN IF NOT EXISTS gmail_internal_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmail_synced_at TIMESTAMPTZ;

-- ============================================================
-- 2. Gmail message identifiers
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
  external_messages_gmail_message_id_uidx
ON public.external_messages (gmail_message_id)
WHERE gmail_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  external_messages_gmail_thread_id_idx
ON public.external_messages (gmail_thread_id)
WHERE gmail_thread_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  external_messages_gmail_history_id_idx
ON public.external_messages (gmail_history_id)
WHERE gmail_history_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  external_messages_gmail_synced_at_idx
ON public.external_messages (gmail_synced_at)
WHERE gmail_synced_at IS NOT NULL;

-- ============================================================
-- 3. Gmail synchronization state
--
-- One row represents the synchronization state of the
-- BIB Gateway Gmail mailbox.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gmail_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  mailbox_email TEXT NOT NULL,

  history_id TEXT,

  last_sync_started_at TIMESTAMPTZ,

  last_sync_completed_at TIMESTAMPTZ,

  last_sync_status TEXT NOT NULL DEFAULT 'never_run'
    CHECK (
      last_sync_status IN (
        'never_run',
        'running',
        'success',
        'partial',
        'failed'
      )
    ),

  last_sync_error TEXT,

  messages_imported INTEGER NOT NULL DEFAULT 0,

  messages_skipped INTEGER NOT NULL DEFAULT 0,

  messages_failed INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT gmail_sync_state_mailbox_unique
    UNIQUE (mailbox_email)
);

-- ============================================================
-- 4. Automatic updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_gmail_sync_state_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  gmail_sync_state_updated_at
ON public.gmail_sync_state;

CREATE TRIGGER
  gmail_sync_state_updated_at
BEFORE UPDATE ON public.gmail_sync_state
FOR EACH ROW
EXECUTE FUNCTION public.update_gmail_sync_state_updated_at();

-- ============================================================
-- 5. Security
--
-- Synchronization state is an internal technical object.
-- It must not be writable by normal Intranet users.
--
-- Edge Functions using the Supabase service role can access it.
-- ============================================================

ALTER TABLE public.gmail_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  "Gmail sync state service role only"
ON public.gmail_sync_state;

CREATE POLICY
  "Gmail sync state service role only"
ON public.gmail_sync_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 6. Documentation comments
-- ============================================================

COMMENT ON COLUMN public.external_messages.gmail_message_id IS
  'Google Gmail API message ID used to identify the synchronized message.';

COMMENT ON COLUMN public.external_messages.gmail_thread_id IS
  'Google Gmail API thread ID used to preserve conversation threading.';

COMMENT ON COLUMN public.external_messages.gmail_history_id IS
  'Google Gmail history ID associated with the synchronized message.';

COMMENT ON COLUMN public.external_messages.gmail_message_id_header IS
  'RFC Message-ID header from the original email.';

COMMENT ON COLUMN public.external_messages.gmail_in_reply_to IS
  'RFC In-Reply-To header from the original email.';

COMMENT ON COLUMN public.external_messages.gmail_references IS
  'RFC References header from the original email.';

COMMENT ON COLUMN public.external_messages.gmail_label_ids IS
  'Gmail labels associated with the synchronized message.';

COMMENT ON COLUMN public.external_messages.gmail_internal_date IS
  'Original Gmail internal timestamp of the message.';

COMMENT ON COLUMN public.external_messages.gmail_synced_at IS
  'Timestamp at which BIB Gateway synchronized the message from Gmail.';

COMMENT ON TABLE public.gmail_sync_state IS
  'Technical synchronization state for the BIB Gateway Google Gmail mailbox.';

COMMIT;
