-- BIB Intranet: global, read-only migration/schema audit.
-- Execute against STAGING first. SELECT-only: no schema/data changes.
-- Drizzle and Supabase use separate migration journals. Do not backfill
-- either journal manually to make counts match.
BEGIN READ ONLY;

SELECT 'drizzle_history' AS section, count(*)::text AS observed,
       max(created_at)::text AS latest
FROM drizzle.__drizzle_migrations
UNION ALL
SELECT 'supabase_history', count(*)::text, max(version)
FROM supabase_migrations.schema_migrations
UNION ALL
SELECT 'intranet_modules',count(*)::text,count(DISTINCT page_id)::text
FROM public.intranet_modules
UNION ALL
SELECT 'public_tables_with_rls',count(*) FILTER (WHERE c.relrowsecurity)::text,
       count(*)::text
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p');

-- Critical runtime objects, including Finance and staff access.
SELECT 'required_object' AS section, name,
       CASE WHEN kind='table' THEN to_regclass('public.'||name) IS NOT NULL
            ELSE to_regprocedure('public.'||name) IS NOT NULL END AS present
FROM (VALUES
 ('table','intranet_modules'), ('table','intranet_records'),
 ('table','intranet_record_events'), ('table','platform_sync_runs'),
 ('table','cashflows'), ('table','finance_invoice_register'),
 ('table','work_tasks'), ('table','sav_escalation_queue'),
 ('function','can_intranet_action(text,text)'),
 ('function','get_intranet_permissions()'),
 ('function','get_hr_onboarding_permissions()'),
 ('function','guard_finance_manual_cashflows()'),
 ('function','guard_finance_invoice_register()')
) v(kind,name) ORDER BY kind,name;

-- Catalog entries can represent old/renamed models.
-- Inspect rather than creating missing tables indiscriminately.
SELECT 'catalog_reference_not_found' AS section, table_name, page_ids
FROM public.intranet_business_tables
WHERE to_regclass('public.'||table_name) IS NULL
ORDER BY table_name;

-- RLS without explicit policies is usually fail-closed; verify intended access.
SELECT 'rls_without_policy' AS section,c.relname AS table_name
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
AND c.relrowsecurity
AND NOT EXISTS (
 SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname
)
ORDER BY c.relname;

-- The presence of a table alone does not prove end-to-end Platform sync.
SELECT 'platform_sync' AS section, status,
       count(*) AS run_count,max(started_at) AS most_recent
FROM public.platform_sync_runs GROUP BY status ORDER BY status;

ROLLBACK;
