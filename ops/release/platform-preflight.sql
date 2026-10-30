-- BIB Platform: STAGING-ONLY, nonmutating release gate.
-- Execute with psql -v ON_ERROR_STOP=1 -f ops/release/platform-preflight.sql
\set ON_ERROR_STOP on
BEGIN READ ONLY;
DO $preflight$
DECLARE missing text[];
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing
 FROM (VALUES
  ('boutiques',to_regclass('public.boutiques') IS NOT NULL),
  ('orders',to_regclass('public.orders') IS NOT NULL),
  ('order_refunds',to_regclass('public.order_refunds') IS NOT NULL),
  ('order_issues',to_regclass('public.order_issues') IS NOT NULL),
  ('subscriptions',to_regclass('public.subscriptions') IS NOT NULL),
  ('customer_product_favorites',to_regclass('public.customer_product_favorites') IS NOT NULL),
  ('customer_boutique_favorites',to_regclass('public.customer_boutique_favorites') IS NOT NULL),
  ('product_customization_dossiers',to_regclass('public.product_customization_dossiers') IS NOT NULL),
  ('stock_restock_requests',to_regclass('public.stock_restock_requests') IS NOT NULL),
  ('sav_escalation_events',to_regclass('public.sav_escalation_events') IS NOT NULL),
  ('respond_to_order_issue',to_regprocedure('public.respond_to_order_issue(uuid,public.issue_action,text,public.issue_status)') IS NOT NULL),
  ('escalate_unanswered_order_issues',to_regprocedure('public.escalate_unanswered_order_issues(integer,text)') IS NOT NULL)
 ) AS requirements(name,present)
 WHERE present IS NOT TRUE;
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: missing %',array_to_string(missing,', ')
   USING ERRCODE='55000';
 END IF;
END;
$preflight$;
DO $security$
BEGIN
 IF EXISTS (
  SELECT 1 FROM pg_class c WHERE c.oid IN (
   'public.customer_product_favorites'::regclass,
   'public.customer_boutique_favorites'::regclass,
   'public.product_customization_dossiers'::regclass,
   'public.stock_restock_requests'::regclass,
   'public.sav_escalation_events'::regclass
  ) AND c.relrowsecurity IS NOT TRUE
 ) THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: critical table without RLS' USING ERRCODE='42501';
 END IF;
 IF has_function_privilege('anon','public.escalate_unanswered_order_issues(integer,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.escalate_unanswered_order_issues(integer,text)','EXECUTE')
 THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: SAV worker executable outside service_role' USING ERRCODE='42501';
 END IF;
END;
$security$;
SELECT 'BIB_PLATFORM_STAGING_PRECHECK_OK' AS check_result;
ROLLBACK;
