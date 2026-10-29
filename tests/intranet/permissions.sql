\set ON_ERROR_STOP on
\ir fixture.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account,email)VALUES
 ('10000000-0000-4000-8000-000000000001','ceo','{direction,finance,ops,supplier,marketplace,support,marketing,rh,audit,compliance,rse,product,data,security}','executive',false,'author@bib.test'),
 ('10000000-0000-4000-8000-000000000002','ceo','{direction,finance,ops,supplier,marketplace,support,marketing,rh,audit,compliance,rse,product,data,security}','executive',false,'reviewer@bib.test'),
 ('10000000-0000-4000-8000-000000000003','ceo','{direction,finance,ops,supplier,marketplace,support,marketing,rh,audit,compliance,rse,product,data,security}','executive',false,'second@bib.test'),
 ('10000000-0000-4000-8000-000000000004','ops_logistics_manager','{ops}','junior',false,'junior@bib.test'),
 ('10000000-0000-4000-8000-000000000005','ceo','{direction,finance,ops}','executive',true,'test@bib.test');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE r jsonb; retry jsonb; BEGIN
 IF NOT public.can_intranet_action('marketing.content','create')OR public.can_intranet_action('missing','read')OR public.can_intranet_action('finance.transactions',NULL)THEN RAISE EXCEPTION 'module permission mismatch';END IF;
 r:=public.save_intranet_record(NULL,'finance.transactions',NULL,'20000000-0000-4000-8000-000000000001','Invoice review','{"counterparty":"Supplier","reference":"INV-1","amount":150,"currency":"EUR","lines":[{"label":"Item","quantity":1,"amount":150}]}',NULL,'2026-12-01','high','restricted');
 PERFORM set_config('test.record',r->>'id',true);
 retry:=public.save_intranet_record(NULL,'finance.transactions',NULL,'20000000-0000-4000-8000-000000000001','Invoice review','{"counterparty":"Supplier","reference":"INV-1","amount":150,"currency":"EUR","lines":[{"label":"Item","quantity":1,"amount":150}]}',NULL,'2026-12-01','high','restricted');
 IF retry->>'id'<>r->>'id'THEN RAISE EXCEPTION 'creation retry duplicated';END IF;
 BEGIN PERFORM public.save_intranet_record(NULL,'finance.transactions',NULL,'20000000-0000-4000-8000-000000000001','Changed','{}',NULL,NULL,'medium','pole');RAISE EXCEPTION 'invalid payload accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 PERFORM public.transition_intranet_record((r->>'id')::uuid,1,'submitted');
 BEGIN PERFORM public.transition_intranet_record((r->>'id')::uuid,2,'reviewed');RAISE EXCEPTION 'self approval accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.save_intranet_record((r->>'id')::uuid,'finance.transactions',1,'20000000-0000-4000-8000-000000000002','Stale','{"counterparty":"Supplier","reference":"INV-1","amount":1,"currency":"EUR"}',NULL,NULL,'medium','restricted');RAISE EXCEPTION 'stale revision accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.save_intranet_record((r->>'id')::uuid,'finance.transactions',2,'20000000-0000-4000-8000-000000000002','Locked','{"counterparty":"Supplier","reference":"INV-1","amount":1,"currency":"EUR"}',NULL,NULL,'medium','restricted');RAISE EXCEPTION 'submitted record editable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$BEGIN
 BEGIN PERFORM public.transition_intranet_record(current_setting('test.record')::uuid,2,'approved');RAISE EXCEPTION 'skipped first review';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.transition_intranet_record(current_setting('test.record')::uuid,2,'reviewed');
 BEGIN PERFORM public.transition_intranet_record(current_setting('test.record')::uuid,3,'approved');RAISE EXCEPTION 'one reviewer approved twice';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_intranet_record(current_setting('test.record')::uuid,3,'approved');
DO $$BEGIN
 BEGIN UPDATE public.intranet_record_events SET kind='forged';RAISE EXCEPTION 'history mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.intranet_records(page_id,title,created_by,test_account,creation_key,creation_request)VALUES('finance.transactions','Forged',auth.uid(),false,gen_random_uuid(),'{}');RAISE EXCEPTION 'direct write accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 IF public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'cross-pole finance leak';END IF;
 IF NOT public.can_intranet_action('ops.incidents','read')OR public.can_intranet_action('ops.incidents','create')THEN RAISE EXCEPTION 'junior rights incorrect';END IF;
 IF EXISTS(SELECT 1 FROM public.intranet_records)THEN RAISE EXCEPTION 'records leaked';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$BEGIN IF EXISTS(SELECT 1 FROM public.intranet_records)THEN RAISE EXCEPTION 'test environment leaked';END IF;END $$;
RESET ROLE;
INSERT INTO public.access_roles(id,role_key)VALUES('30000000-0000-4000-8000-000000000001','custom_operations');
INSERT INTO public.access_assignments(employee_id,role_id,status)VALUES('10000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','active');
INSERT INTO public.access_actions(id,action_key)VALUES('40000000-0000-4000-8000-000000000001','read');
INSERT INTO public.access_interfaces(id,interface_key)VALUES('50000000-0000-4000-8000-000000000001','finance.transactions'),('50000000-0000-4000-8000-000000000002','permissions.roles');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)VALUES('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',true),('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001',true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 IF NOT public.can_intranet_action('finance.transactions','read')OR public.can_intranet_action('finance.transactions','create')THEN RAISE EXCEPTION 'saved custom-role rights ignored';END IF;
 IF NOT public.can_intranet_action('admin.roles','read')OR NOT public.can_intranet_action('permissions.roles','read')THEN RAISE EXCEPTION 'legacy alias grant lost';END IF;
END $$;
RESET ROLE;
INSERT INTO public.access_interfaces(id,interface_key)VALUES('50000000-0000-4000-8000-000000000003','admin.roles');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)VALUES('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001',false);
SET LOCAL ROLE authenticated;
DO $$BEGIN IF public.can_intranet_action('admin.roles','read')OR public.can_intranet_action('permissions.roles','read')THEN RAISE EXCEPTION 'canonical denial bypassed by alias';END IF;END $$;
RESET ROLE;
UPDATE public.profiles SET hr_status='suspended'WHERE id='10000000-0000-4000-8000-000000000004';
SET LOCAL ROLE authenticated;
DO $$BEGIN IF public.can_intranet_action('finance.transactions','read')THEN RAISE EXCEPTION 'inactive account kept saved grants';END IF;END $$;
RESET ROLE;
UPDATE public.profiles SET hr_status='active'WHERE id='10000000-0000-4000-8000-000000000004';
UPDATE public.access_assignments SET ends_at=now()-interval '1 day'WHERE employee_id='10000000-0000-4000-8000-000000000004';
SET LOCAL ROLE authenticated;
DO $$BEGIN IF public.can_intranet_action('ops.incidents','read')THEN RAISE EXCEPTION 'expired assignment fell back to legacy role';END IF;END $$;
ROLLBACK;
