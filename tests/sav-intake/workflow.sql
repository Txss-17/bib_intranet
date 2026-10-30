\set ON_ERROR_STOP on
\ir ../intranet/fixture.sql
CREATE OR REPLACE FUNCTION public.intranet_is_test_mode()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=auth.uid()),false)
$$;
\ir ../../drizzle/migrations/0054_sav_escalation_intake.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account,email) VALUES
 ('10000000-0000-4000-8000-000000000001','ceo','{direction,support}','executive',false,'operator@bib.test'),
 ('10000000-0000-4000-8000-000000000002','ceo','{direction,support}','executive',true,'sandbox@bib.test'),
 ('10000000-0000-4000-8000-000000000003','customer_success_manager','{support}','junior',false,'junior@bib.test');
INSERT INTO public.user_roles(user_id,role) VALUES ('10000000-0000-4000-8000-000000000001','admin');
INSERT INTO public.sav_escalation_queue
 (issue_id,platform_order_id,platform_boutique_id,platform_merchant_id,due_at,escalated_at,environment)
 VALUES
 ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000021','20000000-0000-4000-8000-000000000031',now()-interval '49 hours',now()-interval '1 hour','live'),
 ('20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000022','20000000-0000-4000-8000-000000000032',now()-interval '49 hours',now()-interval '1 hour','sandbox');
-- Migration 0054 commits its own transaction. Start a new one so SET LOCAL
-- ROLE and JWT settings remain effective throughout the RLS tests.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $tests$
DECLARE result jsonb; count_events integer;
BEGIN
 IF (SELECT count(*) FROM public.sav_escalation_queue)<>1 THEN
  RAISE EXCEPTION 'Live operator can read sandbox handoff'; END IF;
 result:=public.acknowledge_sav_escalation('20000000-0000-4000-8000-000000000001');
 IF result->>'status'<>'acknowledged' THEN RAISE EXCEPTION 'Claim failed'; END IF;
 result:=public.acknowledge_sav_escalation('20000000-0000-4000-8000-000000000001');
 SELECT count(*) INTO count_events FROM public.sav_escalation_queue_events;
 IF count_events<>1 THEN RAISE EXCEPTION 'Claim replay created duplicate event'; END IF;
 BEGIN
  PERFORM public.close_sav_escalation('20000000-0000-4000-8000-000000000001','short');
  RAISE EXCEPTION 'Short closure note accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 result:=public.close_sav_escalation('20000000-0000-4000-8000-000000000001','Dossier repris et vérification terminée');
 IF result->>'status'<>'closed' THEN RAISE EXCEPTION 'Close failed'; END IF;
 SELECT count(*) INTO count_events FROM public.sav_escalation_queue_events;
 IF count_events<>2 THEN RAISE EXCEPTION 'Missing audit events'; END IF;
 BEGIN
  UPDATE public.sav_escalation_queue SET status='awaiting_intake'
   WHERE issue_id='20000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'Direct write permitted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $tests$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $tests$
BEGIN
 IF (SELECT count(*) FROM public.sav_escalation_queue)<>1 THEN RAISE EXCEPTION 'Test account can read live handoff';END IF;
 BEGIN
  PERFORM public.acknowledge_sav_escalation('20000000-0000-4000-8000-000000000001');
  RAISE EXCEPTION 'Sandbox account claimed live record';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $tests$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $tests$
BEGIN
 BEGIN
  PERFORM public.acknowledge_sav_escalation('20000000-0000-4000-8000-000000000002');
  RAISE EXCEPTION 'Unprivileged account claimed sandbox';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $tests$;
RESET ROLE;
ROLLBACK;
