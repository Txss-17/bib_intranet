\set ON_ERROR_STOP on
\ir fixture.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','ops_logistics_manager','{ops}','mid',false),
 ('10000000-0000-4000-8000-000000000002','ops_logistics_manager','{ops}','mid',false),
 ('10000000-0000-4000-8000-000000000003','ops_logistics_manager','{ops}','lead',false),
 ('10000000-0000-4000-8000-000000000004','ops_logistics_manager','{ops}','lead',false),
 ('10000000-0000-4000-8000-000000000005','finance_manager','{finance}','lead',false),
 ('10000000-0000-4000-8000-000000000006','marketing_communication_manager','{marketing}','lead',false),
 ('10000000-0000-4000-8000-000000000007','ops_logistics_manager','{ops}','mid',true),
 ('10000000-0000-4000-8000-000000000008','audit_compliance_lead','{audit}','lead',false),
 ('10000000-0000-4000-8000-000000000009','audit_compliance_lead','{audit}','lead',false),
 ('10000000-0000-4000-8000-000000000010','audit_compliance_lead','{audit}','lead',false);
INSERT INTO auth.users(id)SELECT id FROM public.profiles;
INSERT INTO public.access_roles(role_key)VALUES('ops_reporter'),('ops_worker'),('ops_validator'),('ops_manager'),('ops_denied');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT p.id,r.id,'active'FROM public.profiles p,public.access_roles r WHERE r.role_key=CASE right(p.id::text,1)WHEN '1'THEN 'ops_reporter'WHEN '2'THEN 'ops_worker'WHEN '3'THEN 'ops_validator'WHEN '4'THEN 'ops_manager'WHEN '7'THEN 'ops_reporter'ELSE 'ops_denied'END;
INSERT INTO public.access_interfaces(interface_key)VALUES('ops.anomalies');
INSERT INTO public.access_actions(action_key)VALUES('read'),('create'),('update'),('validate'),('delete');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,CASE r.role_key WHEN 'ops_reporter'THEN a.action_key IN('read','create','update')WHEN 'ops_worker'THEN a.action_key IN('read','update')WHEN 'ops_validator'THEN a.action_key IN('read','validate','delete')WHEN 'ops_manager'THEN true ELSE false END FROM public.access_roles r,public.access_interfaces i,public.access_actions a;
INSERT INTO public.anomalies(id,source,type,title,status,created_by,created_at,resolved_at,closed_at)VALUES
 ('20000000-0000-4000-8000-000000000001','orders','Legacy','Historical closure','closed','10000000-0000-4000-8000-000000000001',now()-interval '2 days',now()-interval '1 day',now()-interval '1 day'),
 ('20000000-0000-4000-8000-000000000002','orders','Legacy','Historical test anomaly','open','10000000-0000-4000-8000-000000000007',now(),NULL,NULL);
INSERT INTO public.anomalies(id,source,type,title,status,owner_id,created_by,resolved_at)VALUES('20000000-0000-4000-8000-000000000003','orders','Legacy','Unverified former resolution','resolved','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',now());
INSERT INTO public.intranet_drive_documents(id,file_id,owner_id,page_id,name,mime_type,classification,test_account)VALUES
 ('30000000-0000-4000-8000-000000000001','ops_evidence_001','10000000-0000-4000-8000-000000000001','work.projects','Private finding','application/pdf','confidential',false),
 ('30000000-0000-4000-8000-000000000002','ops_other_file_002','10000000-0000-4000-8000-000000000004','ops.anomalies','Other owner','application/pdf','internal',false),
 ('30000000-0000-4000-8000-000000000003','ops_test_file_003','10000000-0000-4000-8000-000000000007','ops.anomalies','Synthetic','application/pdf','confidential',true);
\ir ../../drizzle/migrations/0050_ops_anomaly_workflow.sql
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.anomalies WHERE id='20000000-0000-4000-8000-000000000001'AND legacy_record AND closed_by IS NULL)THEN RAISE EXCEPTION 'legacy closure received a fabricated signature';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.anomalies WHERE id='20000000-0000-4000-8000-000000000002'AND test_account)THEN RAISE EXCEPTION 'historical test data became real';END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$BEGIN
 BEGIN PERFORM public.get_intranet_document_access('30000000-0000-4000-8000-000000000001');RAISE EXCEPTION 'unattached confidential evidence leaked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE a jsonb;b jsonb;k uuid:=gen_random_uuid();payload jsonb:='{"title":"Parcel damage","description":"Damaged seal","type":"Delivery damage","source":"logistics","severity":"high","team":"Qualité","checks":["Inspect parcel","Check seal"],"owner_id":"10000000-0000-4000-8000-000000000002","document_ids":["30000000-0000-4000-8000-000000000001"]}';BEGIN
 a:=public.create_ops_anomaly(k,payload);b:=public.create_ops_anomaly(k,payload);
 IF a->>'id'<>b->>'id'OR a->>'created_by'<>auth.uid()::text OR(a->>'test_account')::boolean OR a->>'team'<>'Qualité'OR(a->>'revision')::int<>1 THEN RAISE EXCEPTION 'creation lost actor, team, environment or retry';END IF;
 PERFORM set_config('test.anomaly',a->>'id',true);
 BEGIN PERFORM public.create_ops_anomaly(k,payload||'{"title":"Changed retry"}');RAISE EXCEPTION 'creation retry accepted another payload';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),payload||'{"document_ids":["30000000-0000-4000-8000-000000000002"]}');RAISE EXCEPTION 'readable foreign evidence was repartaged';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),payload||'{"document_ids":["30000000-0000-4000-8000-000000000003"]}');RAISE EXCEPTION 'test evidence attached to real case';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),payload||'{"owner_id":"10000000-0000-4000-8000-000000000005"}');RAISE EXCEPTION 'unqualified owner assigned';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),payload||'{"owner_id":"10000000-0000-4000-8000-000000000007"}');RAISE EXCEPTION 'owner crossed environments';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.anomalies(source,type,title,status,closed_by,closed_at)VALUES('orders','Forged','Fake closure','closed',auth.uid(),now());RAISE EXCEPTION 'direct creation forged closure';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.transition_ops_anomaly((a->>'id')::uuid,1,'investigate');RAISE EXCEPTION 'reporter handled a case assigned to another agent';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE a jsonb;BEGIN
 PERFORM public.get_intranet_document_access('30000000-0000-4000-8000-000000000001');
 a:=public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,1,'investigate');
 BEGIN PERFORM public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,2,'resolve','Handled');RAISE EXCEPTION 'resolution missing action and verification';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.update_ops_anomaly(current_setting('test.anomaly')::uuid,2,'{"corrective_action":"Replace seal","evidence":"Parcel reinspected","completed_checks":["Inspect parcel"]}');
 BEGIN PERFORM public.update_ops_anomaly(current_setting('test.anomaly')::uuid,2,'{"title":"Stale edit"}');RAISE EXCEPTION 'stale update accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,3,'resolve','Handled');RAISE EXCEPTION 'unfinished checks skipped';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.update_ops_anomaly(current_setting('test.anomaly')::uuid,3,'{"completed_checks":["Inspect parcel","Check seal"]}');
 a:=public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,4,'resolve','Replaced and verified');
 IF a->>'resolved_by'<>auth.uid()::text OR a->>'resolved_at'IS NULL THEN RAISE EXCEPTION 'resolution author/date missing';END IF;
 BEGIN PERFORM public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,5,'approve','Self review');RAISE EXCEPTION 'worker closed own correction';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.update_ops_anomaly(current_setting('test.anomaly')::uuid,5,'{"evidence":"Rewrite submitted proof"}');RAISE EXCEPTION 'resolved content mutable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN INSERT INTO public.anomaly_events(anomaly_id,kind,to_status,message)VALUES(current_setting('test.anomaly')::uuid,'status','closed','Forged validation');RAISE EXCEPTION 'client forged journal';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE a jsonb;BEGIN
 IF public.can_intranet_action('ops.anomalies','update')OR NOT public.can_intranet_action('ops.anomalies','validate')THEN RAISE EXCEPTION 'validator inherited a general update permission';END IF;
 BEGIN UPDATE public.anomalies SET status='closed',severity='low',change_note='Hidden modification',revision=revision+1 WHERE id=current_setting('test.anomaly')::uuid;RAISE EXCEPTION 'validator changed submitted content';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,5,'approve','Independent parcel check');
 IF a->>'closed_by'<>auth.uid()::text OR a->>'closed_at'IS NULL OR a->>'closure_kind'<>'resolved'THEN RAISE EXCEPTION 'closure signature/kind missing';END IF;
 IF(public.get_ops_anomaly_stats()->>'duration_samples')::int<>1 THEN RAISE EXCEPTION 'unverified legacy closure polluted resolution average';END IF;
 BEGIN PERFORM public.add_ops_anomaly_comment(current_setting('test.anomaly')::uuid,'Rewrite closed case');RAISE EXCEPTION 'closed case accepted comments';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 a:=public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,6,'reopen','Damage reproduced');
 IF a->>'closed_by'IS NOT NULL OR a->>'resolved_by'IS NOT NULL OR a->>'resolution'IS NOT NULL THEN RAISE EXCEPTION 'reopen retained current signatures';END IF;
 BEGIN PERFORM public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,7,'archive');RAISE EXCEPTION 'active anomaly archived';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 PERFORM public.add_ops_anomaly_comment(current_setting('test.anomaly')::uuid,'Repeat inspection');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,7,'resolve','Resealed and checked again');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,8,'return','Inspect another sample');
DO $$DECLARE a jsonb;t jsonb;BEGIN
 a:=public.get_ops_anomaly(current_setting('test.anomaly')::uuid);
 IF a->>'status'<>'investigating'OR a->>'resolved_at'IS NOT NULL THEN RAISE EXCEPTION 'rework did not clear submission signature';END IF;
 t:=public.list_ops_anomaly_events(current_setting('test.anomaly')::uuid);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(t->'rows')e WHERE e->'after_state'->>'closure_kind'='resolved')THEN RAISE EXCEPTION 'rework erased former closure';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,9,'resolve','New sample verified');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,10,'approve','Independent recheck');
SELECT public.transition_ops_anomaly(current_setting('test.anomaly')::uuid,11,'archive');
DO $$BEGIN
 DELETE FROM public.anomalies WHERE id=current_setting('test.anomaly')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.anomalies WHERE id=current_setting('test.anomaly')::uuid)THEN RAISE EXCEPTION 'anomaly physically deleted';END IF;
 BEGIN UPDATE public.anomaly_events SET message='Forged';RAISE EXCEPTION 'event journal mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.anomaly_notifications(anomaly_id,kind)VALUES(current_setting('test.anomaly')::uuid,'reminder');RAISE EXCEPTION 'user forged reminder log';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.send_anomaly_reminders();RAISE EXCEPTION 'authenticated user ran global reminders';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.anomalies)OR EXISTS(SELECT 1 FROM public.anomaly_events)OR EXISTS(SELECT 1 FROM public.anomaly_notifications)THEN RAISE EXCEPTION 'saved read denial bypassed through legacy finance membership';END IF;
 BEGIN PERFORM public.get_ops_anomaly_stats('ops.anomalies');RAISE EXCEPTION 'denied reader retrieved aggregates';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$DECLARE a jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.anomalies WHERE NOT test_account)OR EXISTS(SELECT 1 FROM public.anomaly_events e JOIN public.anomalies a ON a.id=e.anomaly_id WHERE NOT a.test_account)THEN RAISE EXCEPTION 'sandbox read real cases/events';END IF;
 a:=public.create_ops_anomaly(gen_random_uuid(),'{"title":"Synthetic Ops case","type":"Test","source":"orders","owner_id":"10000000-0000-4000-8000-000000000007"}');
 IF NOT(a->>'test_account')::boolean THEN RAISE EXCEPTION 'test creation became real';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.anomaly_events WHERE anomaly_id=(a->>'id')::uuid)THEN RAISE EXCEPTION 'test user cannot read own journal';END IF;
END $$;
-- Classifications and comments do not manufacture resolved cases or signatures.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.create_ops_anomaly(gen_random_uuid(),'{"title":"Duplicate finding","type":"Duplicate","source":"orders","owner_id":"10000000-0000-4000-8000-000000000002"}');
 PERFORM set_config('test.dismiss',a->>'id',true);
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),'{"title":"Invalid reminder","type":"Date","source":"orders","reminder_at":"2026-10-29T10:00:00Z"}');RAISE EXCEPTION 'reminder accepted without deadline';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.create_ops_anomaly(gen_random_uuid(),'{"title":"Invalid time","type":"Date","source":"orders","due_at":"infinity"}');RAISE EXCEPTION 'infinite deadline accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.create_ops_anomaly(gen_random_uuid(),'{"title":"Unassigned finding","type":"Handling","source":"orders"}');PERFORM set_config('test.claim',a->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE a jsonb;t jsonb;BEGIN
 a:=public.update_ops_anomaly(current_setting('test.claim')::uuid,1,jsonb_build_object('owner_id',auth.uid()));
 IF a->>'owner_id'<>auth.uid()::text THEN RAISE EXCEPTION 'unassigned case could not be claimed';END IF;
 PERFORM public.add_ops_anomaly_comment((a->>'id')::uuid,'Inspection comment '||n)FROM generate_series(1,52)n;
 t:=public.list_ops_anomaly_events((a->>'id')::uuid);
 IF jsonb_array_length(t->'rows')<>50 OR NOT(t->>'has_more')::boolean OR jsonb_array_length(public.list_ops_anomaly_events((a->>'id')::uuid,50)->'rows')<3 THEN RAISE EXCEPTION 'event pagination lost old comments';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE a jsonb;BEGIN
 BEGIN PERFORM public.transition_ops_anomaly(current_setting('test.dismiss')::uuid,1,'dismiss',' ');RAISE EXCEPTION 'case dismissed without reason';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.transition_ops_anomaly('20000000-0000-4000-8000-000000000003',1,'approve','Close historical resolution');RAISE EXCEPTION 'unverified legacy resolution received new closure';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.transition_ops_anomaly('20000000-0000-4000-8000-000000000003',1,'return','Document and verify the former correction');
 IF a->>'status'<>'investigating'OR a->>'resolved_at'IS NOT NULL THEN RAISE EXCEPTION 'legacy rework not cleared';END IF;
 a:=public.transition_ops_anomaly(current_setting('test.dismiss')::uuid,1,'dismiss','Duplicate of the main finding');
 IF a->>'closure_kind'<>'dismissed'OR a->>'resolved_by'IS NOT NULL OR a->>'resolution'IS NOT NULL THEN RAISE EXCEPTION 'dismissal fabricated a correction';END IF;
 IF(public.get_ops_anomaly_stats()->>'duration_samples')::int<>0 THEN RAISE EXCEPTION 'dismissals included in resolution average';END IF;
END $$;
-- Reminders are internal, serialized, fresh-authorized and do not invalidate an editor's revision.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.anomalies(id,source,type,title,owner_id,due_at,created_by,test_account)VALUES
 ('40000000-0000-4000-8000-000000000001','orders','Reminder','Real overdue','10000000-0000-4000-8000-000000000002',now()-interval '1 hour','10000000-0000-4000-8000-000000000001',false),
 ('40000000-0000-4000-8000-000000000002','orders','Reminder','Test overdue','10000000-0000-4000-8000-000000000007',now()-interval '1 hour','10000000-0000-4000-8000-000000000007',true),
 ('40000000-0000-4000-8000-000000000003','orders','Reminder','Inactive owner','10000000-0000-4000-8000-000000000004',now()-interval '1 hour','10000000-0000-4000-8000-000000000001',false);
UPDATE public.profiles SET hr_status='inactive'WHERE id='10000000-0000-4000-8000-000000000004';
DO $$DECLARE n integer;BEGIN
 n:=public.send_anomaly_reminders();IF n<>2 THEN RAISE EXCEPTION 'reminders did not respect active owners and environments: %',n;END IF;
 IF public.send_anomaly_reminders()<>0 THEN RAISE EXCEPTION 'immediate retry duplicated reminders';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.anomalies WHERE id='40000000-0000-4000-8000-000000000001'AND revision=1 AND last_reminded_at IS NOT NULL)THEN RAISE EXCEPTION 'background reminders invalidated human revision';END IF;
 IF EXISTS(SELECT 1 FROM public.notifications n JOIN public.anomalies a ON n.metadata->>'anomaly_id'=a.id::text JOIN public.profiles p ON p.id=n.user_id WHERE a.test_account IS DISTINCT FROM p.test_account)THEN RAISE EXCEPTION 'notification crossed environments';END IF;
 IF EXISTS(SELECT 1 FROM public.intranet_business_history WHERE table_name='anomalies'AND row_id='40000000-0000-4000-8000-000000000001'AND action='update')THEN RAISE EXCEPTION 'reminder produced false general business activity';END IF;
 IF EXISTS(SELECT 1 FROM public.anomaly_events WHERE anomaly_id='40000000-0000-4000-8000-000000000001'AND kind='update')THEN RAISE EXCEPTION 'reminder produced false business edits';END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE a jsonb;BEGIN
 BEGIN UPDATE public.anomalies SET last_reminded_at=now()+interval '1 hour',revision=revision+1 WHERE id='40000000-0000-4000-8000-000000000001';RAISE EXCEPTION 'client forged reminder stamp';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 a:=public.update_ops_anomaly('40000000-0000-4000-8000-000000000001',1,jsonb_build_object('due_at',now()+interval '5 days'));
 IF a->>'last_reminded_at'IS NOT NULL THEN RAISE EXCEPTION 'rescheduling did not reset reminder cycle';END IF;
 IF EXISTS(SELECT 1 FROM public.anomaly_notifications n WHERE anomaly_id='40000000-0000-4000-8000-000000000002')THEN RAISE EXCEPTION 'real agent read synthetic reminder history';END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.anomalies SET last_reminded_at=now()-interval '2 days'WHERE id='40000000-0000-4000-8000-000000000002';
UPDATE public.access_permissions p SET allowed=false FROM public.access_roles r,public.access_actions a WHERE p.role_id=r.id AND p.action_id=a.id AND r.role_key='ops_reporter'AND a.action_key='read';
DO $$BEGIN
 IF public.send_anomaly_reminders()<>0 THEN RAISE EXCEPTION 'revoked reader still received reminder';END IF;
END $$;
UPDATE public.access_permissions p SET allowed=true FROM public.access_roles r,public.access_actions a WHERE p.role_id=r.id AND p.action_id=a.id AND r.role_key='ops_reporter'AND a.action_key='read';
-- Overview access yields only aggregates and never overrides a detail-read denial.
INSERT INTO public.access_roles(role_key)VALUES('direction_aggregate_reader');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT '10000000-0000-4000-8000-000000000005',id,'active'FROM public.access_roles WHERE role_key='direction_aggregate_reader';
INSERT INTO public.access_interfaces(interface_key)VALUES('direction.overview');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,true FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE r.role_key='direction_aggregate_reader'AND i.interface_key='direction.overview'AND a.action_key='read';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$BEGIN
 PERFORM public.get_ops_anomaly_stats('direction.overview');
 IF EXISTS(SELECT 1 FROM public.anomalies)THEN RAISE EXCEPTION 'overview aggregate grant bypassed denied detail';END IF;
END $$;
-- Audit decisions retain their trusted Ops handoff without receiving general Ops access.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
DO $$DECLARE m public.field_audits;BEGIN
 m:=public.create_audit_mission(gen_random_uuid(),'{"target_name":"Ops linked inspection","target_type":"supplier","audit_type":"quality","scheduled_date":"2026-10-29","auditor_id":"10000000-0000-4000-8000-000000000009","workflow_status":"assigned"}');
 PERFORM set_config('test.audit',m.id::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000009',true);
SELECT public.update_audit_mission(current_setting('test.audit')::uuid,1,'{"workflow_status":"in_field"}');
SELECT public.update_audit_mission(current_setting('test.audit')::uuid,2,'{"findings":"Damaged goods"}');
SELECT public.update_audit_mission(current_setting('test.audit')::uuid,3,'{"workflow_status":"synced"}');
SELECT public.update_audit_mission(current_setting('test.audit')::uuid,4,'{"workflow_status":"analysis"}');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000010',true);
DO $$DECLARE m public.field_audits;BEGIN
 m:=public.update_audit_mission(current_setting('test.audit')::uuid,5,'{"workflow_status":"non_compliant","decision_reason":"Goods need replacement"}');
 IF m.anomaly_id IS NULL THEN RAISE EXCEPTION 'new Ops guard broke Audit handoff';END IF;
 PERFORM set_config('test.audit_anomaly',m.anomaly_id::text,true);
 IF EXISTS(SELECT 1 FROM public.anomalies)THEN RAISE EXCEPTION 'Audit handoff granted broad Ops visibility';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.get_ops_anomaly(current_setting('test.audit_anomaly')::uuid);
 IF a->>'team'<>'Qualité'OR a->>'object_id'<>current_setting('test.audit')THEN RAISE EXCEPTION 'Audit provenance lost';END IF;
END $$;
-- Full pages, history and notification pages remain reachable beyond the initial result set.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.anomalies(source,type,title,owner_id)SELECT 'stock','Paging','Paged Ops finding '||n,'10000000-0000-4000-8000-000000000002'FROM generate_series(1,52)n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE a jsonb;b jsonb;BEGIN
 a:=public.list_ops_anomalies('Paged Ops finding','all');b:=public.list_ops_anomalies('Paged Ops finding','all','all','all','all',50);
 IF jsonb_array_length(a->'rows')<>50 OR NOT(a->>'has_more')::boolean OR jsonb_array_length(b->'rows')<>2 THEN RAISE EXCEPTION 'case pagination incomplete';END IF;
 a:=public.list_ops_anomaly_notifications();b:=public.list_ops_anomaly_notifications(NULL,50);
 IF jsonb_array_length(a->'rows')<>50 OR NOT(a->>'has_more')::boolean OR jsonb_array_length(b->'rows')<2 THEN RAISE EXCEPTION 'notification pagination truncated';END IF;
 a:=public.update_ops_anomaly(current_setting('test.audit_anomaly')::uuid,1,jsonb_build_object('owner_id',auth.uid()));
 BEGIN PERFORM public.update_ops_anomaly((a->>'id')::uuid,2,'{"object_id":"another mission"}');RAISE EXCEPTION 'Audit link rewritten';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
-- A right revoked during a batch suppresses subsequent deliveries and their stamps.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.anomalies SET last_reminded_at=now()WHERE status NOT IN('resolved','closed')AND due_at IS NOT NULL;
INSERT INTO public.anomalies(id,source,type,title,owner_id,due_at,created_by)VALUES
 ('50000000-0000-4000-8000-000000000001','orders','Reminder','First batch reminder','10000000-0000-4000-8000-000000000002',now()-interval '2 hours','10000000-0000-4000-8000-000000000001'),
 ('50000000-0000-4000-8000-000000000002','orders','Reminder','After permission revocation','10000000-0000-4000-8000-000000000002',now()-interval '1 hour','10000000-0000-4000-8000-000000000001');
CREATE FUNCTION public.test_revoke_after_reminder()RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
 IF NEW.anomaly_id='50000000-0000-4000-8000-000000000001'AND NEW.kind='overdue'THEN
  UPDATE public.access_permissions p SET allowed=false FROM public.access_roles r,public.access_actions a WHERE p.role_id=r.id AND p.action_id=a.id AND r.role_key='ops_worker'AND a.action_key='read';
 END IF;RETURN NEW;
END;$$;
CREATE TRIGGER test_mid_batch_revocation AFTER INSERT ON public.anomaly_notifications FOR EACH ROW EXECUTE FUNCTION public.test_revoke_after_reminder();
DO $$BEGIN
 IF public.send_anomaly_reminders()<>1 THEN RAISE EXCEPTION 'batch counted a delivery skipped after revocation';END IF;
 IF EXISTS(SELECT 1 FROM public.anomaly_notifications WHERE anomaly_id='50000000-0000-4000-8000-000000000002'AND kind='overdue')OR EXISTS(SELECT 1 FROM public.anomalies WHERE id='50000000-0000-4000-8000-000000000002'AND last_reminded_at IS NOT NULL)THEN RAISE EXCEPTION 'undelivered reminder was logged or stamped';END IF;
END $$;
ROLLBACK;
