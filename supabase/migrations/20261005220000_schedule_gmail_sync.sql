-- ============================================================================
-- BIB GATEWAY — AUTOMATIC GOOGLE GMAIL INBOX SYNCHRONIZATION
-- ============================================================================
--
-- Synchronizes the BIB Google Workspace mailbox with the internal Gateway.
--
-- Architecture:
--
--   Google Workspace / Gmail
--             ↓
--      sync-gmail-inbox
--             ↓
--      external_messages
--             ↓
--          Gateway
--
-- The Gateway never opens Gmail.
-- Gmail remains the actual transport layer.
--
-- The function is executed automatically every minute by pg_cron.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- --------------------------------------------------------------------------
-- Remove an existing job with the same name.
-- This makes the migration idempotent.
-- --------------------------------------------------------------------------

SELECT cron.unschedule('sync-gmail-inbox')
WHERE EXISTS (
  SELECT 1
  FROM cron.job
  WHERE jobname = 'sync-gmail-inbox'
);

-- --------------------------------------------------------------------------
-- Schedule Gmail synchronization every minute.
--
-- The existing email infrastructure stores the Supabase service-role
-- credential in Vault under:
--
--   email_queue_service_role_key
--
-- The sync-gmail-inbox Edge Function keeps verify_jwt enabled by default.
-- Therefore the cron request uses the service-role JWT in Authorization.
--
-- --------------------------------------------------------------------------

SELECT cron.schedule(
  'sync-gmail-inbox',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://cxguhlssztinaxrgeuku.supabase.co/functions/v1/sync-gmail-inbox',

      headers := jsonb_build_object(
        'Content-Type',
        'application/json',

        'Authorization',
        'Bearer ' ||
        (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'email_queue_service_role_key'
          LIMIT 1
        )
      ),

      body := jsonb_build_object(
        'source',
        'pg_cron',

        'trigger',
        'scheduled',

        'triggered_at',
        now()
      ),

      timeout_milliseconds := 55000
    ) AS request_id;
  $$
);
