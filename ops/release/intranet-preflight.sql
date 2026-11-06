-- BIB Intranet: STAGING-ONLY, nonmutating release gate.
-- Execute with psql -v ON_ERROR_STOP=1 -f ops/release/intranet-preflight.sql
\set ON_ERROR_STOP on
BEGIN READ ONLY;
DO $preflight$
DECLARE missing text[];
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing
 FROM (VALUES
  ('catalogue_publication_by_mode',to_regprocedure('public.get_catalog_acquisition_publication(uuid,boolean)') IS NOT NULL),
  ('merchant_supply_quotes',to_regclass('public.merchant_supply_quotes') IS NOT NULL),
  ('merchant_supply_events',to_regclass('public.merchant_supply_events') IS NOT NULL),
  ('merchant_supply_requests',to_regclass('public.merchant_supply_requests') IS NOT NULL),
  ('merchant_supply_settlements',to_regclass('public.merchant_supply_settlements') IS NOT NULL),
  ('merchant_supply_invoice_refs',to_regclass('public.merchant_supply_invoice_refs') IS NOT NULL),
  ('catalog_acquisition_prices',to_regclass('public.catalog_acquisition_prices') IS NOT NULL),
  ('supply_operator_configuration',to_regclass('public.supply_operator_configuration') IS NOT NULL),
  ('merchant_supply_portal',to_regprocedure('public.merchant_supply_portal(uuid,uuid,uuid,text,text,uuid,jsonb)') IS NOT NULL),
  ('receive_merchant_supply_settlement',to_regprocedure('public.receive_merchant_supply_settlement(uuid,text,jsonb)') IS NOT NULL),
  ('create_merchant_supply_request',to_regprocedure('public.create_merchant_supply_request(uuid,uuid,uuid,text,uuid,jsonb)') IS NOT NULL),
  ('intranet_modules',to_regclass('public.intranet_modules') IS NOT NULL),
  ('intranet_records',to_regclass('public.intranet_records') IS NOT NULL),
  ('intranet_record_events',to_regclass('public.intranet_record_events') IS NOT NULL),
  ('legal_governance_records',to_regclass('public.legal_governance_records') IS NOT NULL),
  ('legal_governance_events',to_regclass('public.legal_governance_events') IS NOT NULL),
  ('legal_governance_deliveries',to_regclass('public.legal_governance_deliveries') IS NOT NULL),
  ('supplier_audit_cases',to_regclass('public.supplier_audit_cases') IS NOT NULL),
  ('create_legal_governance_record',to_regprocedure('public.create_legal_governance_record(uuid,text,jsonb)') IS NOT NULL),
  ('advance_legal_governance_record',to_regprocedure('public.advance_legal_governance_record(uuid,integer,uuid,text,jsonb)') IS NOT NULL),
  ('export_legal_governance_record',to_regprocedure('public.export_legal_governance_record(uuid)') IS NOT NULL),
  ('acknowledge_legal_governance_delivery',to_regprocedure('public.acknowledge_legal_governance_delivery(uuid,bigint)') IS NOT NULL),
  ('get_supplier_reference_admission',to_regprocedure('public.get_supplier_reference_admission(uuid,text,boolean)') IS NOT NULL),
  ('platform_sync_runs',to_regclass('public.platform_sync_runs') IS NOT NULL),
  ('finance_invoice_register',to_regclass('public.finance_invoice_register') IS NOT NULL),
  ('cashflows',to_regclass('public.cashflows') IS NOT NULL),
  ('intranet_business_tables',to_regclass('public.intranet_business_tables') IS NOT NULL),
  ('support_tickets',to_regclass('public.support_tickets') IS NOT NULL),
  ('work_tasks',to_regclass('public.work_tasks') IS NOT NULL),
  ('cashflows',to_regclass('public.cashflows') IS NOT NULL),
  ('finance_invoice_register',to_regclass('public.finance_invoice_register') IS NOT NULL),
  ('sav_escalation_queue',to_regclass('public.sav_escalation_queue') IS NOT NULL),
  ('sav_escalation_queue_events',to_regclass('public.sav_escalation_queue_events') IS NOT NULL),
  ('can_intranet_action',to_regprocedure('public.can_intranet_action(text,text)') IS NOT NULL),
  ('get_intranet_permissions',to_regprocedure('public.get_intranet_permissions()') IS NOT NULL),
  ('get_hr_onboarding_permissions',to_regprocedure('public.get_hr_onboarding_permissions()') IS NOT NULL),
  ('guard_finance_manual_cashflows',to_regprocedure('public.guard_finance_manual_cashflows()') IS NOT NULL),
  ('guard_finance_invoice_register',to_regprocedure('public.guard_finance_invoice_register()') IS NOT NULL),
  ('get_hr_onboarding_permissions',to_regprocedure('public.get_hr_onboarding_permissions()') IS NOT NULL),
  ('guard_finance_manual_cashflows',to_regprocedure('public.guard_finance_manual_cashflows()') IS NOT NULL),
  ('guard_finance_invoice_register',to_regprocedure('public.guard_finance_invoice_register()') IS NOT NULL),
  ('acknowledge_sav_escalation',to_regprocedure('public.acknowledge_sav_escalation(uuid)') IS NOT NULL),
  ('close_sav_escalation',to_regprocedure('public.close_sav_escalation(uuid,text)') IS NOT NULL)
 ) AS requirements(name,present)
 WHERE present IS NOT TRUE;
 IF missing IS NOT NULL THEN
  RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: missing %',array_to_string(missing,', ')
   USING ERRCODE='55000';
 END IF;
END;
$preflight$;
DO $security$
DECLARE count_modules integer;
BEGIN
 SELECT count(*) INTO count_modules FROM public.intranet_modules;
 IF count_modules < 177 THEN
  RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: % registry modules, expected >=177',count_modules
   USING ERRCODE='55000';
 END IF;
 IF EXISTS (
  SELECT 1 FROM pg_class c WHERE c.oid IN (
   'public.intranet_modules'::regclass,
   'public.intranet_records'::regclass,
   'public.intranet_record_events'::regclass,
   'public.sav_escalation_queue'::regclass,
   'public.sav_escalation_queue_events'::regclass,
   'public.cashflows'::regclass,
   'public.finance_invoice_register'::regclass,
   'public.cashflows'::regclass,
   'public.finance_invoice_register'::regclass,
   'public.legal_governance_records'::regclass,
   'public.legal_governance_events'::regclass,
   'public.legal_governance_deliveries'::regclass,
   'public.supplier_audit_cases'::regclass,
   'public.merchant_supply_quotes'::regclass,
   'public.merchant_supply_events'::regclass,
   'public.merchant_supply_requests'::regclass,
   'public.merchant_supply_settlements'::regclass,
   'public.merchant_supply_invoice_refs'::regclass,
   'public.catalog_acquisition_prices'::regclass,
   'public.supply_operator_configuration'::regclass
  ) AND c.relrowsecurity IS NOT TRUE
 ) THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: critical table without RLS' USING ERRCODE='42501';
 END IF;
 IF has_function_privilege('anon','public.acknowledge_legal_governance_delivery(uuid,bigint)','EXECUTE')
  OR has_function_privilege('authenticated','public.acknowledge_legal_governance_delivery(uuid,bigint)','EXECUTE')
  OR has_function_privilege('anon','public.create_legal_governance_record(uuid,text,jsonb)','EXECUTE')
  OR has_function_privilege('anon','public.advance_legal_governance_record(uuid,integer,uuid,text,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: legal write privileges exposed' USING ERRCODE='42501'; END IF;
 IF EXISTS (
  SELECT 1 FROM (VALUES('legal_governance_record_guard'),('legal_governance_event')) expected(trigger_name)
  WHERE NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.legal_governance_records'::regclass AND tgname=expected.trigger_name AND tgenabled='O')
 ) THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: legal governance guard not active' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgrelid='public.cashflows'::regclass
    AND tgname='a_finance_manual_cashflow_guard' AND tgenabled='O'
 ) THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: finance cashflow guard not active' USING ERRCODE='42501';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgrelid='public.finance_invoice_register'::regclass
    AND tgname='finance_invoice_guard' AND tgenabled='O'
 ) THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: finance invoice guard not active' USING ERRCODE='42501';
 END IF;
 IF has_function_privilege('anon','public.acknowledge_sav_escalation(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.close_sav_escalation(uuid,text)','EXECUTE')
 THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: anonymous SAV mutation allowed' USING ERRCODE='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM (VALUES
  ('public.get_catalog_acquisition_publication(uuid,boolean)'),
  ('public.merchant_supply_portal(uuid,uuid,uuid,text,text,uuid,jsonb)'),
  ('public.receive_merchant_supply_settlement(uuid,text,jsonb)'),
  ('public.create_merchant_supply_request(uuid,uuid,uuid,text,uuid,jsonb)')
 ) private_supply(signature) WHERE has_function_privilege('anon',signature,'EXECUTE') OR has_function_privilege('authenticated',signature,'EXECUTE'))
 THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: private supply function exposed' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.merchant_supply_quotes'::regclass AND tgname='merchant_supply_quote_guard' AND tgenabled='O') OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.supplier_restock_orders'::regclass AND tgname='supply_restock_guard' AND tgenabled='O') THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: supply guard not active' USING ERRCODE='42501'; END IF;
END;
$security$;
SELECT 'BIB_INTRANET_STAGING_PRECHECK_OK' AS check_result;
ROLLBACK;
