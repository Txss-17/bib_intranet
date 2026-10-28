\set ON_ERROR_STOP on
BEGIN;
\ir fixture.sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE target jsonb; request jsonb; retry jsonb; applied jsonb; payload jsonb:=current_setting('test.mutation.payload')::jsonb;
BEGIN
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000003';
 IF target IS NULL OR jsonb_array_length(target->'assignments')<>3 THEN RAISE EXCEPTION 'target snapshot omitted orphan or secondary assignment'; END IF;
 request:=public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000001',target->>'revision',
   ARRAY['40000000-0000-4000-8000-000000000003']::uuid[],payload);
 IF request->>'status'<>'submitted' OR request->>'created_user_id' IS NOT NULL THEN RAISE EXCEPTION 'submission applied authority prematurely'; END IF;
 retry:=public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000001',target->>'revision',
   ARRAY['40000000-0000-4000-8000-000000000003']::uuid[],payload);
 IF retry->>'id'<>request->>'id' THEN RAISE EXCEPTION 'creation retry duplicated request'; END IF;
 BEGIN
   PERFORM public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000001',target->>'revision',
     ARRAY['40000000-0000-4000-8000-000000000003']::uuid[],payload||'{"subsidiary":"Changed"}');
   RAISE EXCEPTION 'same nonce accepted a different payload';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN PERFORM public.apply_hr_employee_mutation((request->>'id')::uuid); RAISE EXCEPTION 'unvalidated mutation applied';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 PERFORM public.set_hr_employee_mutation_status((request->>'id')::uuid,'hr_validated');
 applied:=public.apply_hr_employee_mutation((request->>'id')::uuid);
 IF applied->>'userId'<>target->>'id' OR applied->>'invitationSent'<>'false' THEN RAISE EXCEPTION 'wrong account or invitation result'; END IF;
 IF public.apply_hr_employee_mutation((request->>'id')::uuid)<>applied THEN RAISE EXCEPTION 'application replay did not return same result'; END IF;
 IF (SELECT count(*) FROM public.access_assignments WHERE employee_id=(target->>'id')::uuid AND role_id='30000000-0000-4000-8000-000000000004' AND status='active')<>1 THEN RAISE EXCEPTION 'duplicate or missing new assignment'; END IF;
 IF (SELECT status FROM public.access_assignments WHERE id='40000000-0000-4000-8000-000000000003')<>'revoked' THEN RAISE EXCEPTION 'selected old assignment survived'; END IF;
 IF (SELECT count(*) FROM public.access_assignments WHERE id IN ('40000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000005') AND status='active')<>2 THEN RAISE EXCEPTION 'unselected assignments changed'; END IF;
 IF (SELECT position IS NOT NULL OR position_key<>'custom_ops_job' OR work_mode<>'hybrid' OR subsidiary<>'BIB FR' FROM public.profiles WHERE id=(target->>'id')::uuid) THEN RAISE EXCEPTION 'custom catalogue position/profile not applied'; END IF;
 IF (SELECT role FROM public.user_roles WHERE user_id=(target->>'id')::uuid)<>'viewer' THEN RAISE EXCEPTION 'technical role changed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.hr_account_audit_log WHERE request_id=(request->>'id')::uuid AND action='collaborator_mutated') THEN RAISE EXCEPTION 'mutation audit missing'; END IF;
 IF (SELECT status FROM public.rh_employee_documents WHERE name='Ancienne charte')<>'archived'
   OR (SELECT status FROM public.rh_employee_documents WHERE name='Document manuel')<>'active'
   OR (SELECT count(*) FROM public.rh_employee_documents WHERE name='Nouvelle charte' AND status='active')<>1 THEN RAISE EXCEPTION 'document update incorrect'; END IF;
 PERFORM set_config('test.completed.mutation',request->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
DO $$
DECLARE details jsonb;
BEGIN
 details:=public.my_hr_professional_details();
 IF details->>'contract_type'<>'CDI' OR details->>'position_key'<>'custom_ops_job' OR details->>'subsidiary'<>'BIB FR'
   OR details ? 'notes' OR details ? 'mutation_snapshot' THEN RAISE EXCEPTION 'professional details wrong or private HR data leaked'; END IF;
 BEGIN
   UPDATE public.profiles SET work_mode='remote' WHERE id=auth.uid();
   RAISE EXCEPTION 'staff self-edited HR work mode';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   UPDATE public.profiles SET position_key='ceo' WHERE id=auth.uid();
   RAISE EXCEPTION 'staff self-edited catalogue position authority';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.profiles SET first_name='Personnel',avatar_url='https://bib.test/avatar' WHERE id=auth.uid();
 BEGIN PERFORM public.list_hr_mutation_targets(); RAISE EXCEPTION 'nonHR listed mutation targets';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE target jsonb; payload jsonb:=current_setting('test.mutation.payload')::jsonb;
BEGIN
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000004';
 BEGIN
   PERFORM public.submit_hr_employee_mutation(auth.uid(),'50000000-0000-4000-8000-000000000002',target->>'revision','{}',payload);
   RAISE EXCEPTION 'self mutation accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   PERFORM public.submit_hr_employee_mutation('20000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000002',target->>'revision','{}',payload);
   RAISE EXCEPTION 'admin target accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   PERFORM public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000002',target->>'revision',
    ARRAY['40000000-0000-4000-8000-000000000006']::uuid[],payload||'{"position":"ceo","primary_pole":"direction","poles":["direction"],"seniority":"executive","requested_role":"ceo"}');
   RAISE EXCEPTION 'nonadmin HR granted global direction authority';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
   INSERT INTO public.hr_employee_requests(first_name,last_name,request_kind,target_user_id) VALUES('Forged','Mutation','mutation',(target->>'id')::uuid);
   RAISE EXCEPTION 'direct client forged mutation';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN IF public.can_hr_employee_mutation_action('validate') OR public.can_hr_employee_mutation_action('apply') THEN RAISE EXCEPTION 'mid creator may validate or apply'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000011',true);
DO $ BEGIN
 IF NOT public.can_hr_employee_mutation_action('apply') THEN RAISE EXCEPTION 'RH senior enum-array fallback without assignments denied'; END IF;
 IF NOT public.can_hr_publication_action('read') OR public.can_hr_publication_action(NULL) THEN RAISE EXCEPTION 'publication enum-array or null action repair invalid'; END IF;
END $;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000008',true);
DO $$ BEGIN IF public.can_hr_employee_mutation_action('create') OR public.can_hr_employee_mutation_action('apply') THEN RAISE EXCEPTION 'legacy saved deny bypassed'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000009',true);
DO $$ BEGIN IF public.can_hr_employee_mutation_action('create') OR public.can_hr_employee_mutation_action('apply') THEN RAISE EXCEPTION 'assigned saved deny bypassed'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE target jsonb; request jsonb; payload jsonb:=current_setting('test.mutation.payload')::jsonb;
BEGIN
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000004';
 UPDATE public.profiles SET subsidiary='Concurrent pre-submit change' WHERE id=(target->>'id')::uuid;
 BEGIN
   PERFORM public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000003',target->>'revision',
     ARRAY['40000000-0000-4000-8000-000000000006']::uuid[],payload);
   RAISE EXCEPTION 'stale form was blessed at submission';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000004';
 request:=public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000003',target->>'revision',
   ARRAY['40000000-0000-4000-8000-000000000006']::uuid[],payload);
 PERFORM public.set_hr_employee_mutation_status((request->>'id')::uuid,'hr_validated');
 UPDATE public.profiles SET subsidiary='Concurrent post-validation change' WHERE id=(target->>'id')::uuid;
 BEGIN PERFORM public.apply_hr_employee_mutation((request->>'id')::uuid); RAISE EXCEPTION 'stale mutation overwrote newer profile';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 IF (SELECT status FROM public.access_assignments WHERE id='40000000-0000-4000-8000-000000000006')<>'active' THEN RAISE EXCEPTION 'failed mutation partially revoked access'; END IF;
 PERFORM set_config('test.stale.mutation',request->>'id',true);
END $$;
SELECT public.set_hr_employee_mutation_status(current_setting('test.stale.mutation')::uuid,'rejected','Dossier obsolète après modification de la fiche.');
DO $$
DECLARE target jsonb; request jsonb; payload jsonb:=current_setting('test.mutation.payload')::jsonb; before_profile jsonb; before_assignments jsonb;
BEGIN
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000004';
 payload:=payload||'{"attached_documents":[{"name":"FAIL-DOCUMENT","document_type":"charter","document_url":null}]}';
 request:=public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000004',target->>'revision',
   ARRAY['40000000-0000-4000-8000-000000000006']::uuid[],payload);
 PERFORM public.set_hr_employee_mutation_status((request->>'id')::uuid,'hr_validated');
 SELECT to_jsonb(p) INTO before_profile FROM public.profiles p WHERE id=(target->>'id')::uuid;
 SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) INTO before_assignments FROM public.access_assignments a WHERE employee_id=(target->>'id')::uuid;
 BEGIN PERFORM public.apply_hr_employee_mutation((request->>'id')::uuid); RAISE EXCEPTION 'document failure unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN NULL; END;
 IF (SELECT to_jsonb(p) FROM public.profiles p WHERE id=(target->>'id')::uuid)<>before_profile
   OR (SELECT jsonb_agg(to_jsonb(a) ORDER BY a.id) FROM public.access_assignments a WHERE employee_id=(target->>'id')::uuid)<>before_assignments
   OR EXISTS(SELECT 1 FROM public.hr_account_audit_log WHERE request_id=(request->>'id')::uuid AND action='collaborator_mutated')
   OR (SELECT status FROM public.hr_employee_requests WHERE id=(request->>'id')::uuid)<>'hr_validated' THEN RAISE EXCEPTION 'failed document update left partial authority or success audit'; END IF;
END $$;

DO $
DECLARE target jsonb; payload jsonb:=current_setting('test.mutation.payload')::jsonb; request jsonb;
BEGIN
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000005';
 UPDATE public.profiles SET hr_status=NULL WHERE id=(target->>'id')::uuid;
 BEGIN
  PERFORM public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000005',target->>'revision','{}',payload);
  RAISE EXCEPTION 'NULL HR status passed target validation';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.profiles SET hr_status='active' WHERE id=(target->>'id')::uuid;
 SELECT x INTO target FROM jsonb_array_elements(public.list_hr_mutation_targets())x WHERE x->>'id'='20000000-0000-4000-8000-000000000005';
 BEGIN
  PERFORM public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000005',target->>'revision','{}',
   payload||'{"attached_documents":[{"name":"Missing URL field","document_type":"other"}]}');
  RAISE EXCEPTION 'missing document_url field accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 request:=public.submit_hr_employee_mutation((target->>'id')::uuid,'50000000-0000-4000-8000-000000000005',target->>'revision','{}',
   payload||jsonb_build_object('start_date',(current_date+1)::text));
 PERFORM public.set_hr_employee_mutation_status((request->>'id')::uuid,'hr_validated');
 BEGIN PERFORM public.apply_hr_employee_mutation((request->>'id')::uuid); RAISE EXCEPTION 'future mutation applied before its effective date';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $;

RESET ROLE;
SET LOCAL ROLE service_role;
DO $$ BEGIN
 IF NOT public.hr_account_email_exists('PERSON10@BIB.TEST') THEN RAISE EXCEPTION 'unconfirmed Auth account missed'; END IF;
 IF public.hr_account_email_exists('new@bib.test') THEN RAISE EXCEPTION 'new address falsely occupied'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('authenticated','public.hr_account_email_exists(text)','EXECUTE') THEN RAISE EXCEPTION 'Auth email lookup exposed to client'; END IF;
 IF has_function_privilege('anon','public.apply_hr_employee_mutation(uuid)','EXECUTE') THEN RAISE EXCEPTION 'anonymous mutation granted'; END IF;
END $$;
ROLLBACK;
