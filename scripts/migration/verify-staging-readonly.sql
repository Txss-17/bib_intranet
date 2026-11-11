-- BIB Intranet: read-only staging parity gate against 2026-11-11 source snapshot.
-- TARGET PROJECT: hjquaokkcpnwnvpdfmyj. DO NOT run against production.
-- Run after pg_restore and independent Storage binary migration.
-- Never output user IDs, email, customer or document contents.
WITH metrics AS (
 SELECT 'public_tables' AS metric, (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p')) AS observed, 207 AS minimum
 UNION ALL SELECT 'public_routines', (SELECT count(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'), 307
 UNION ALL SELECT 'public_rls_policies', (SELECT count(*)::int FROM pg_policies WHERE schemaname='public'), 1046
 UNION ALL SELECT 'public_triggers', (SELECT count(*)::int FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname='public'), 276
 UNION ALL SELECT 'auth_users', (SELECT count(*)::int FROM auth.users), 116
 UNION ALL SELECT 'storage_buckets', (SELECT count(*)::int FROM storage.buckets), 3
 UNION ALL SELECT 'storage_object_metadata', (SELECT count(*)::int FROM storage.objects), 6
 UNION ALL SELECT 'extensions_pg_cron_pg_net_pgmq', (SELECT count(*)::int FROM pg_extension WHERE extname IN ('pg_cron','pg_net','pgmq')), 3
)
SELECT metric, observed, minimum AS source_snapshot_minimum, (observed>=minimum) AS pass FROM metrics ORDER BY metric;

-- No writes and no hidden session changes.
-- Important: storage.objects counts metadata ONLY, not actual binary object availability.
-- A green result does not prove identities, JWT settings, RLS behavior, private file access,
-- Stripe/Connect or bridge integrations; execute separate authenticated tests.
