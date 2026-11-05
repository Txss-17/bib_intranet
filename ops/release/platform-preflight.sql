-- BIB Platform: STAGING-ONLY, nonmutating release gate.
-- Execute with psql -v ON_ERROR_STOP=1 -f ops/release/platform-preflight.sql
\set ON_ERROR_STOP on
BEGIN READ ONLY;
DO $preflight$
DECLARE missing text[];
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing
 FROM (VALUES
  ('verified_supply_sample',to_regprocedure('public.verified_supply_sample(uuid,uuid,text,text)') IS NOT NULL),
  ('supply_payment_configuration',to_regclass('public.supply_payment_configuration') IS NOT NULL),
  ('supply_destination_routes',to_regclass('public.supply_destination_routes') IS NOT NULL),
  ('merchant_supply_payments',to_regclass('public.merchant_supply_payments') IS NOT NULL),
  ('merchant_supply_payment_events',to_regclass('public.merchant_supply_payment_events') IS NOT NULL),
  ('merchant_supply_payment_outbox',to_regclass('public.merchant_supply_payment_outbox') IS NOT NULL),
  ('sample_purchases',to_regclass('public.sample_purchases') IS NOT NULL),
  ('sample_validations',to_regclass('public.sample_validations') IS NOT NULL),
  ('get_supply_destination_route',to_regprocedure('public.get_supply_destination_route(uuid,text,text)') IS NOT NULL),
  ('get_storefront_destination_route',to_regprocedure('public.get_storefront_destination_route(uuid,text)') IS NOT NULL),
  ('reserve_merchant_supply_payment',to_regprocedure('public.reserve_merchant_supply_payment(jsonb,uuid,uuid,text,uuid)') IS NOT NULL),
  ('attach_merchant_supply_session',to_regprocedure('public.attach_merchant_supply_session(uuid,uuid,text,text)') IS NOT NULL),
  ('record_merchant_supply_payment',to_regprocedure('public.record_merchant_supply_payment(jsonb,jsonb,text,text)') IS NOT NULL),
  ('adjust_merchant_supply_payment',to_regprocedure('public.adjust_merchant_supply_payment(text,text,text,text,bigint,jsonb)') IS NOT NULL),
  ('fail_merchant_supply_checkout',to_regprocedure('public.fail_merchant_supply_checkout(text,text)') IS NOT NULL),
  ('boutiques',to_regclass('public.boutiques') IS NOT NULL),
  ('orders',to_regclass('public.orders') IS NOT NULL),
  ('legal_governance_configuration',to_regclass('public.legal_governance_configuration') IS NOT NULL),
  ('legal_governance_mirror',to_regclass('public.legal_governance_mirror') IS NOT NULL),
  ('store_order_legal_snapshots',to_regclass('public.store_order_legal_snapshots') IS NOT NULL),
  ('get_store_legal_bundle',to_regprocedure('public.get_store_legal_bundle(uuid)') IS NOT NULL),
  ('compose_store_legal_bundle',to_regprocedure('public.compose_store_legal_bundle(uuid,boolean)') IS NOT NULL),
  ('read_store_legal_identity_for_review',to_regprocedure('public.read_store_legal_identity_for_review(uuid)') IS NOT NULL),
  ('track_order_legal_snapshot',to_regprocedure('public.track_order_legal_snapshot(text,text)') IS NOT NULL),
  ('create_storefront_legal_orders',to_regprocedure('public.create_storefront_legal_orders(uuid,uuid,text,boolean,text,text,text,jsonb)') IS NOT NULL),
  ('import_legal_governance_record',to_regprocedure('public.import_legal_governance_record(jsonb,text,text)') IS NOT NULL),
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
   'public.sav_escalation_events'::regclass,
   'public.legal_governance_configuration'::regclass,
   'public.legal_governance_mirror'::regclass,
   'public.store_order_legal_snapshots'::regclass,
   'public.supply_payment_configuration'::regclass,
   'public.supply_destination_routes'::regclass,
   'public.merchant_supply_payments'::regclass,
   'public.merchant_supply_payment_events'::regclass,
   'public.merchant_supply_payment_outbox'::regclass,
   'public.sample_purchases'::regclass,
   'public.sample_validations'::regclass
  ) AND c.relrowsecurity IS NOT TRUE
 ) THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: critical table without RLS' USING ERRCODE='42501';
 END IF;
 IF EXISTS (
  SELECT 1 FROM (VALUES
   ('public.create_storefront_legal_orders(uuid,uuid,text,boolean,text,text,text,jsonb)'),
   ('public.import_legal_governance_record(jsonb,text,text)'),
   ('public.compose_store_legal_bundle(uuid,boolean)'),
   ('public.read_store_legal_identity_for_review(uuid)')
  ) private_functions(signature)
  WHERE has_function_privilege('anon',signature,'EXECUTE') OR has_function_privilege('authenticated',signature,'EXECUTE')
 ) THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: private legal function exposed' USING ERRCODE='42501'; END IF;
 IF EXISTS (
  SELECT 1 FROM (VALUES
   ('public.stock_restock_requests'::regclass,'supplier_restock_requires_validated_sample'),
   ('public.boutiques'::regclass,'guard_store_legal_publication'),
   ('public.orders'::regclass,'guard_order_legal_snapshot'),
   ('public.store_order_legal_snapshots'::regclass,'immutable_store_legal_evidence')
  ) expected(relation_id,trigger_name)
  WHERE NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid=expected.relation_id AND tgname=expected.trigger_name AND tgenabled='O')
 ) THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: legal guard not active' USING ERRCODE='42501'; END IF;
 IF has_function_privilege('anon','public.escalate_unanswered_order_issues(integer,text)','EXECUTE')
    OR has_function_privilege('authenticated','public.escalate_unanswered_order_issues(integer,text)','EXECUTE')
 THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: SAV worker executable outside service_role' USING ERRCODE='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM (VALUES
  ('public.verified_supply_sample(uuid,uuid,text,text)'),
  ('public.get_supply_destination_route(uuid,text,text)'),
  ('public.get_storefront_destination_route(uuid,text)'),
  ('public.reserve_merchant_supply_payment(jsonb,uuid,uuid,text,uuid)'),
  ('public.attach_merchant_supply_session(uuid,uuid,text,text)'),
  ('public.record_merchant_supply_payment(jsonb,jsonb,text,text)'),
  ('public.adjust_merchant_supply_payment(text,text,text,text,bigint,jsonb)'),
  ('public.fail_merchant_supply_checkout(text,text)')
 ) private_supply(signature) WHERE has_function_privilege('anon',signature,'EXECUTE') OR has_function_privilege('authenticated',signature,'EXECUTE'))
 THEN RAISE EXCEPTION 'BIB_PLATFORM_STAGING_NOT_READY: private supply function exposed' USING ERRCODE='42501'; END IF;
END;
$security$;
SELECT 'BIB_PLATFORM_STAGING_PRECHECK_OK' AS check_result;
ROLLBACK;
