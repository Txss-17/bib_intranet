-- BIB Intranet: STAGING-ONLY, nonmutating release gate.
-- Execute with psql -v ON_ERROR_STOP=1 -f ops/release/intranet-preflight.sql
\set ON_ERROR_STOP on
BEGIN READ ONLY;
DO $preflight$
DECLARE missing text[];
BEGIN
 SELECT array_agg(name ORDER BY name) INTO missing
 FROM (VALUES
  ('intranet_modules',to_regclass('public.intranet_modules') IS NOT NULL),
  ('intranet_records',to_regclass('public.intranet_records') IS NOT NULL),
  ('intranet_record_events',to_regclass('public.intranet_record_events') IS NOT NULL),
  ('platform_sync_runs',to_regclass('public.platform_sync_runs') IS NOT NULL),
  ('support_tickets',to_regclass('public.support_tickets') IS NOT NULL),
  ('work_tasks',to_regclass('public.work_tasks') IS NOT NULL),
  ('sav_escalation_queue',to_regclass('public.sav_escalation_queue') IS NOT NULL),
  ('sav_escalation_queue_events',to_regclass('public.sav_escalation_queue_events') IS NOT NULL),
  ('can_intranet_action',to_regprocedure('public.can_intranet_action(text,text)') IS NOT NULL),
  ('get_intranet_permissions',to_regprocedure('public.get_intranet_permissions()') IS NOT NULL),
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
   'public.sav_escalation_queue_events'::regclass
  ) AND c.relrowsecurity IS NOT TRUE
 ) THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: critical table without RLS' USING ERRCODE='42501';
 END IF;
 IF has_function_privilege('anon','public.acknowledge_sav_escalation(uuid)','EXECUTE')
    OR has_function_privilege('anon','public.close_sav_escalation(uuid,text)','EXECUTE')
 THEN RAISE EXCEPTION 'BIB_INTRANET_STAGING_NOT_READY: anonymous SAV mutation allowed' USING ERRCODE='42501';
 END IF;
END;
$security$;
SELECT 'BIB_INTRANET_STAGING_PRECHECK_OK' AS check_result;
ROLLBACK;
