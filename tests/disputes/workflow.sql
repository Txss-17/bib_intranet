\set ON_ERROR_STOP on
\ir ../ops/fixture.sql
\ir ../../drizzle/migrations/0050_ops_anomaly_workflow.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','audit_compliance_lead','{compliance}','mid',false),
 ('10000000-0000-4000-8000-000000000002','audit_compliance_lead','{compliance}','mid',false),
 ('10000000-0000-4000-8000-000000000003','audit_compliance_lead','{compliance}','lead',false),
 ('10000000-0000-4000-8000-000000000004','audit_compliance_lead','{compliance}','lead',false),
 ('10000000-0000-4000-8000-000000000005','audit_compliance_lead','{compliance}','junior',false),
 ('10000000-0000-4000-8000-000000000006','ops_logistics_manager','{ops}','lead',false),
 ('10000000-0000-4000-8000-000000000007','audit_compliance_lead','{compliance}','mid',true),
 ('10000000-0000-4000-8000-000000000008','audit_compliance_lead','{compliance}','lead',false),
 ('10000000-0000-4000-8000-000000000009','audit_compliance_lead','{compliance}','mid',false);
INSERT INTO auth.users(id)SELECT id FROM public.profiles;
INSERT INTO public.access_roles(role_key)VALUES('dispute_editor'),('dispute_worker'),('dispute_reviewer'),('dispute_manager'),('dispute_reader'),('dispute_denied');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT p.id,r.id,'active'FROM public.profiles p,public.access_roles r WHERE r.role_key=CASE right(p.id::text,1)WHEN '1'THEN 'dispute_editor'WHEN '2'THEN 'dispute_worker'WHEN '3'THEN 'dispute_reviewer'WHEN '4'THEN 'dispute_reviewer'WHEN '5'THEN 'dispute_reader'WHEN '7'THEN 'dispute_editor'WHEN '8'THEN 'dispute_manager'WHEN '9'THEN 'dispute_worker'ELSE 'dispute_denied'END;
INSERT INTO public.access_interfaces(interface_key)VALUES('compliance.disputes');
INSERT INTO public.access_actions(action_key)VALUES('read'),('create'),('update'),('validate'),('delete');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,CASE r.role_key WHEN 'dispute_editor'THEN a.action_key IN('read','create','update')WHEN 'dispute_worker'THEN a.action_key IN('read','update')WHEN 'dispute_reviewer'THEN a.action_key IN('read','validate','delete')WHEN 'dispute_manager'THEN true WHEN 'dispute_reader'THEN a.action_key='read'ELSE false END FROM public.access_roles r,public.access_interfaces i,public.access_actions a;
-- Existing canonical dossiers survive schema enrichment with their actual content and history.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SELECT public.save_intranet_record(NULL,'compliance.disputes',NULL,'20000000-0000-4000-8000-000000000001','Historical legal dossier','{"entity":"Supplier A","requirement":"Invoice disagreement","assessment":"Under examination","mitigation":"Request source records"}',NULL,NULL,'medium','restricted');
RESET ROLE;
INSERT INTO public.intranet_records(page_id,title,payload,status,created_by,test_account,creation_key,creation_request,visibility)VALUES('compliance.disputes','Historical unstructured amount','{"entity":"Supplier C","requirement":"Historical claim","assessment":"Prior analysis","amount":"15 000 €"}','approved','10000000-0000-4000-8000-000000000001',false,'20000000-0000-4000-8000-000000000002','{}','restricted');
\ir ../../drizzle/migrations/0051_compliance_dispute_workflow.sql
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.intranet_records WHERE title='Historical unstructured amount'AND payload->>'amount_raw'='15 000 €'AND NOT payload?'amount'AND dispute_approved_at IS NULL AND approved_by IS NULL)THEN RAISE EXCEPTION 'historical amount or missing approval was fabricated';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.intranet_records WHERE page_id='compliance.disputes'AND dispute_legacy AND payload->>'party'='Supplier A'AND payload->>'description'='Invoice disagreement'AND payload->>'proposal'='Request source records'AND dispute_approved_at IS NULL)THEN RAISE EXCEPTION 'canonical history lost or signature fabricated';END IF;
END $$;
INSERT INTO public.intranet_drive_documents(id,file_id,owner_id,page_id,name,mime_type,classification,test_account)VALUES
 ('30000000-0000-4000-8000-000000000001','legal_evidence_001','10000000-0000-4000-8000-000000000001','work.projects','Private evidence','application/pdf','confidential',false),
 ('30000000-0000-4000-8000-000000000002','legal_other_002','10000000-0000-4000-8000-000000000008','compliance.disputes','Other owner','application/pdf','internal',false),
 ('30000000-0000-4000-8000-000000000003','legal_test_003','10000000-0000-4000-8000-000000000007','compliance.disputes','Test evidence','application/pdf','confidential',true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE d jsonb;again jsonb;k uuid:=gen_random_uuid();payload jsonb:='{"party":"Supplier B","type":"Paiement","description":"Unmatched payment","stage":"open","amount":"0.00","currency":"EUR","outcome":"settlement"}';BEGIN
 d:=public.save_compliance_dispute(NULL,NULL,k,'Payment dispute',payload,'10000000-0000-4000-8000-000000000002',current_date+7,'high','restricted',ARRAY['30000000-0000-4000-8000-000000000001']::uuid[]);
 again:=public.save_compliance_dispute(NULL,NULL,k,'Payment dispute',payload,'10000000-0000-4000-8000-000000000002',current_date+7,'high','restricted',ARRAY['30000000-0000-4000-8000-000000000001']::uuid[]);
 IF d->>'id'<>again->>'id'OR d->>'created_by'<>auth.uid()::text OR d->>'dispute_reference'IS NULL OR(d->>'dispute_required_reviews')::int<>2 THEN RAISE EXCEPTION 'creation identity, reference, reviews or retry lost';END IF;
 PERFORM set_config('test.dispute',d->>'id',true);
 BEGIN PERFORM public.transition_compliance_dispute((d->>'id')::uuid,1,'archive','Hide unresolved case');RAISE EXCEPTION 'open dispute archived';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.transition_intranet_record((d->>'id')::uuid,1,'archived','Bypass domain workflow');RAISE EXCEPTION 'generic archive bypassed dispute policy';EXCEPTION WHEN invalid_parameter_value OR insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Shared foreign evidence',payload,NULL,NULL,'medium','pole',ARRAY['30000000-0000-4000-8000-000000000002']::uuid[]);RAISE EXCEPTION 'readable foreign evidence repartaged';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Wrong environment',payload,'10000000-0000-4000-8000-000000000007',NULL,'medium','restricted');RAISE EXCEPTION 'owner crossed environments';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Bad amount',payload||'{"amount":"1e9"}',NULL,NULL,'medium','restricted');RAISE EXCEPTION 'nondecimal amount accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Missing currency',payload- 'currency',NULL,NULL,'medium','restricted');RAISE EXCEPTION 'amount acquired invented currency';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.intranet_records WHERE id=current_setting('test.dispute')::uuid)THEN RAISE EXCEPTION 'restricted dispute leaked to read-only colleague';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE d jsonb;payload jsonb;BEGIN
 PERFORM public.get_intranet_document_access('30000000-0000-4000-8000-000000000001');
 d:=public.get_compliance_dispute(current_setting('test.dispute')::uuid);payload:=d->'payload';
 BEGIN PERFORM public.transition_compliance_dispute((d->>'id')::uuid,1,'submit','Need validation');RAISE EXCEPTION 'empty proposal submitted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 payload:=payload||'{"stage":"analysis","assessment":"Payment proof compared","proposal":"Correct the account entry","evidence":"Ledger reconciliation checked"}';
 d:=public.save_compliance_dispute((d->>'id')::uuid,1,gen_random_uuid(),d->>'title',payload,auth.uid(),current_date+7,'high','restricted',ARRAY['30000000-0000-4000-8000-000000000001']::uuid[]);
 BEGIN PERFORM public.save_compliance_dispute((d->>'id')::uuid,1,gen_random_uuid(),d->>'title',payload,auth.uid(),NULL,'high','restricted');RAISE EXCEPTION 'stale case updated';EXCEPTION WHEN serialization_failure THEN NULL;END;
 d:=public.transition_compliance_dispute((d->>'id')::uuid,2,'submit','Proposal and evidence ready');
 IF d->>'dispute_submitted_by'<>auth.uid()::text OR d->>'dispute_submitted_at'IS NULL THEN RAISE EXCEPTION 'submission signature missing';END IF;
 BEGIN PERFORM public.transition_compliance_dispute((d->>'id')::uuid,3,'approve','Self approval');RAISE EXCEPTION 'submitter approved own case';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.save_compliance_dispute((d->>'id')::uuid,3,gen_random_uuid(),'Rewrite submitted case',payload,auth.uid(),NULL,'high','restricted');RAISE EXCEPTION 'submitted content editable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE d jsonb;BEGIN
 BEGIN PERFORM public.transition_intranet_record(current_setting('test.dispute')::uuid,3,'reviewed','Generic bypass');RAISE EXCEPTION 'generic endpoint bypassed dispute decision guard';EXCEPTION WHEN insufficient_privilege OR invalid_parameter_value THEN NULL;END;
 IF public.can_intranet_action('compliance.disputes','update')OR NOT public.can_intranet_action('compliance.disputes','validate')THEN RAISE EXCEPTION 'reviewer inherited edit permission';END IF;
 BEGIN PERFORM public.transition_compliance_dispute(current_setting('test.dispute')::uuid,3,'approve','');RAISE EXCEPTION 'review lacked reason';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 d:=public.transition_compliance_dispute(current_setting('test.dispute')::uuid,3,'approve','First independent check');
 IF d->>'status'<>'reviewed'OR d->>'first_reviewer'<>auth.uid()::text OR d->>'dispute_reviewed_at'IS NULL THEN RAISE EXCEPTION 'first review missing';END IF;
 BEGIN PERFORM public.transition_compliance_dispute(current_setting('test.dispute')::uuid,4,'approve','Second self review');RAISE EXCEPTION 'same reviewer approved twice';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.comment_compliance_dispute(current_setting('test.dispute')::uuid,'First review complete');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.transition_compliance_dispute(current_setting('test.dispute')::uuid,4,'approve','Final independent check');
 IF d->>'status'<>'approved'OR d->>'approved_by'<>auth.uid()::text OR d->>'dispute_approved_at'IS NULL THEN RAISE EXCEPTION 'final closure missing';END IF;
 BEGIN PERFORM public.comment_intranet_record(current_setting('test.dispute')::uuid,'Generic closed comment');RAISE EXCEPTION 'generic comment bypassed closed lock';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 d:=public.transition_compliance_dispute(current_setting('test.dispute')::uuid,5,'reopen','New supporting evidence');
 IF d->>'first_reviewer'IS NOT NULL OR d->>'approved_by'IS NOT NULL OR d->>'dispute_submitted_by'IS NOT NULL THEN RAISE EXCEPTION 'reopen retained current signatures';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,6,'submit','Evidence reviewed again');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,7,'return','Request another reconciliation');
DO $$DECLARE d jsonb;history jsonb;BEGIN
 d:=public.get_compliance_dispute(current_setting('test.dispute')::uuid);
 IF d->>'status'<>'rejected'OR d->>'dispute_submitted_by'IS NOT NULL THEN RAISE EXCEPTION 'rework kept stale submission';END IF;
 history:=public.list_compliance_dispute_events((d->>'id')::uuid);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(history->'rows')e WHERE e->'after_state'->>'status'='approved')THEN RAISE EXCEPTION 'rework erased previous approval';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,8,'submit','Additional verification completed');
-- A lowered registry setting cannot remove an existing dossier's second review.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.intranet_modules SET definition=jsonb_set(definition,'{approvalLevels}','1')WHERE page_id='compliance.disputes';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,9,'approve','First preserved review');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,10,'approve','Second preserved review');
SELECT public.transition_compliance_dispute(current_setting('test.dispute')::uuid,11,'archive','Retain the completed file');
DO $$BEGIN
 BEGIN DELETE FROM public.intranet_records WHERE id=current_setting('test.dispute')::uuid;RAISE EXCEPTION 'case physically deleted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.intranet_record_events(record_id,actor_id,kind)VALUES(current_setting('test.dispute')::uuid,auth.uid(),'approved');RAISE EXCEPTION 'client forged event';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.intranet_record_events SET note='Forged';RAISE EXCEPTION 'journal mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.intranet_records WHERE page_id='compliance.disputes')THEN RAISE EXCEPTION 'unrelated department read legal case';END IF;
 BEGIN PERFORM public.get_compliance_dispute_stats();RAISE EXCEPTION 'denied role read legal totals';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$DECLARE d jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.intranet_records WHERE page_id='compliance.disputes'AND NOT test_account)THEN RAISE EXCEPTION 'test user read real legal records';END IF;
 d:=public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Synthetic legal case','{"party":"Test party","type":"Autre","description":"Synthetic case","stage":"open","outcome":"settlement"}',auth.uid(),NULL,'medium','restricted');
 IF NOT(d->>'test_account')::boolean THEN RAISE EXCEPTION 'synthetic case became real';END IF;
END $$;
-- Exact amounts stay grouped by their stated currency; missing data does not become zero.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SELECT public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Zero EUR claim','{"party":"A","type":"Autre","description":"Known zero","amount":"0.00","currency":"EUR"}',NULL,NULL,'medium','pole');
SELECT public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'EUR claim','{"party":"B","type":"Autre","description":"Known value","amount":"1.50","currency":"EUR"}',NULL,NULL,'medium','pole');
SELECT public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'USD claim','{"party":"C","type":"Autre","description":"Separate currency","amount":"10.20","currency":"USD"}',NULL,NULL,'medium','pole');
DO $$DECLARE s jsonb;BEGIN
 s:=public.get_compliance_dispute_stats();
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s->'amounts')v WHERE v->>'currency'='EUR'AND(v->>'amount')::numeric=1.50 AND(v->>'samples')::int=2)OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s->'amounts')v WHERE v->>'currency'='USD'AND(v->>'amount')::numeric=10.20 AND(v->>'samples')::int=1)THEN RAISE EXCEPTION 'amount totals mixed currencies or lost zero';END IF;
 IF(s->>'unknown_amounts')::int<>2 THEN RAISE EXCEPTION 'missing/unstructured amounts became confirmed zeros';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$BEGIN
 IF(public.get_compliance_dispute_stats()->>'unknown_amounts')::int<>0 OR(public.get_compliance_dispute_stats()->>'closed')::int<>0 THEN RAISE EXCEPTION 'overview counted inaccessible restricted cases';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE d jsonb;BEGIN
 FOR n IN 1..52 LOOP
 d:=public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Paged legal case '||n,'{"party":"Paging party","type":"Autre","description":"Fixture","stage":"open"}',NULL,NULL,'medium','pole');
 END LOOP;
 PERFORM set_config('test.paged_case',d->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE a jsonb;b jsonb;BEGIN
 a:=public.list_compliance_disputes('Paged legal case','all');b:=public.list_compliance_disputes('Paged legal case','all','all',50);
 IF jsonb_array_length(a->'rows')<>50 OR NOT(a->>'has_more')::boolean OR jsonb_array_length(b->'rows')<>2 OR(b->>'has_more')::boolean THEN RAISE EXCEPTION 'legal case pagination incomplete';END IF;
 PERFORM public.comment_compliance_dispute(current_setting('test.paged_case')::uuid,'Review comment '||n)FROM generate_series(1,52)n;
 a:=public.list_compliance_dispute_events(current_setting('test.paged_case')::uuid);b:=public.list_compliance_dispute_events(current_setting('test.paged_case')::uuid,50);
 IF jsonb_array_length(a->'rows')<>50 OR NOT(a->>'has_more')::boolean OR jsonb_array_length(b->'rows')<>3 THEN RAISE EXCEPTION 'legal history pagination incomplete';END IF;
END $$;
-- A manager who submits another person's dossier still cannot review their own proposal.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Manager proposal','{"party":"M","type":"Autre","description":"Manager assisted case","stage":"analysis","assessment":"Checked","proposal":"Correction","evidence":"Source records"}','10000000-0000-4000-8000-000000000002',NULL,'medium','restricted');
 PERFORM set_config('test.manager_case',d->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.transition_compliance_dispute(current_setting('test.manager_case')::uuid,1,'submit','Manager prepares proposal');
 IF d->>'dispute_submitted_by'<>auth.uid()::text THEN RAISE EXCEPTION 'third-party submitter not recorded';END IF;
 BEGIN PERFORM public.transition_compliance_dispute(current_setting('test.manager_case')::uuid,2,'approve','Approve my own work');RAISE EXCEPTION 'non-owner submitter reviewed themselves';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_compliance_dispute(current_setting('test.manager_case')::uuid,2,'approve','Single review under the configured policy');
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.intranet_modules SET definition=jsonb_set(definition,'{approvalLevels}','2')WHERE page_id='compliance.disputes';
UPDATE public.access_permissions p SET allowed=true FROM public.access_roles r,public.access_actions a WHERE p.role_id=r.id AND p.action_id=a.id AND r.role_key='dispute_editor'AND a.action_key='delete';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.transition_compliance_dispute(current_setting('test.manager_case')::uuid,3,'archive','Retain the approved dossier');
 IF(d->>'dispute_required_reviews')::int<>1 THEN RAISE EXCEPTION 'archive retroactively changed an approved policy snapshot';END IF;
END $$;
-- Handoff is authorized against the previous private dossier, without retaining access afterward.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.save_compliance_dispute(NULL,NULL,gen_random_uuid(),'Restricted handoff','{"party":"H","type":"Autre","description":"Transfer case"}','10000000-0000-4000-8000-000000000002',NULL,'medium','restricted');PERFORM set_config('test.handoff',d->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE d jsonb;BEGIN
 d:=public.get_compliance_dispute(current_setting('test.handoff')::uuid);
 d:=public.save_compliance_dispute((d->>'id')::uuid,1,gen_random_uuid(),d->>'title',d->'payload','10000000-0000-4000-8000-000000000009',NULL,'medium','restricted');
 IF d->>'owner_id'<>'10000000-0000-4000-8000-000000000009'THEN RAISE EXCEPTION 'private handoff failed';END IF;
 BEGIN PERFORM public.get_compliance_dispute((d->>'id')::uuid);RAISE EXCEPTION 'former owner retained private access';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000009',true);
DO $$DECLARE e jsonb;BEGIN
 PERFORM public.get_compliance_dispute(current_setting('test.handoff')::uuid);
 e:=public.list_compliance_dispute_events(current_setting('test.handoff')::uuid);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(e->'rows')v WHERE v->>'kind'='updated'AND v->'before_state'->>'owner_id'='10000000-0000-4000-8000-000000000002'AND v->'after_state'->>'owner_id'=auth.uid()::text)THEN RAISE EXCEPTION 'handoff journal lost';END IF;
END $$;
-- Permission revocation applies immediately, rather than falling back to the legacy role.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.access_permissions p SET allowed=false FROM public.access_roles r,public.access_actions a WHERE p.role_id=r.id AND p.action_id=a.id AND r.role_key='dispute_reviewer'AND a.action_key='read';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.intranet_records WHERE page_id='compliance.disputes')OR EXISTS(SELECT 1 FROM public.intranet_record_events e JOIN public.intranet_records r ON r.id=e.record_id WHERE r.page_id='compliance.disputes')THEN RAISE EXCEPTION 'revoked role retained case or history';END IF;
 BEGIN PERFORM public.comment_compliance_dispute(current_setting('test.paged_case')::uuid,'After revocation');RAISE EXCEPTION 'revoked reader commented';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
