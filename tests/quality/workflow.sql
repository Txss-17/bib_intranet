\set ON_ERROR_STOP on
\ir ../intranet/fixture.sql
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,invited_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.hr_employee_requests(id uuid PRIMARY KEY,request_kind text,status text,hr_validated_by uuid,created_user_id uuid,work_email text,personal_email text);
CREATE TABLE public.hr_onboarding_invitation_claims(nonce uuid,request_id uuid,email text,expires_at timestamptz,consumed_user_id uuid,consumed_at timestamptz);
ALTER TABLE public.profiles ADD COLUMN position_key text;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_profile_names ON public.profiles FOR SELECT TO authenticated USING(true);
GRANT SELECT ON public.notifications TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_notification_read ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
ALTER TABLE public.access_assignments ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN assigned_by uuid;
CREATE TABLE public.user_accounts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_name text,user_id uuid,test_account boolean DEFAULT false);
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_accounts ON public.user_accounts FOR ALL TO authenticated USING(public.has_role(auth.uid(),'manager')OR public.is_leadership(auth.uid())OR id::text=current_setting('test.visible_account',true))WITH CHECK(public.has_role(auth.uid(),'manager'));
GRANT ALL ON public.user_accounts TO authenticated;
CREATE TABLE public.support_tickets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_account_id uuid REFERENCES public.user_accounts(id),subject text NOT NULL,description text NOT NULL,category text DEFAULT 'general',priority text DEFAULT 'medium',status text DEFAULT 'open',assigned_to uuid,resolution text,resolved_at timestamptz,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),created_by uuid REFERENCES public.profiles(id),platform_id text,platform_synced_at timestamptz);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_tickets_read ON public.support_tickets FOR SELECT TO authenticated USING(public.is_leadership(auth.uid()));
CREATE POLICY original_tickets_create ON public.support_tickets FOR INSERT TO authenticated WITH CHECK(auth.uid()IS NOT NULL);
CREATE POLICY original_tickets_update ON public.support_tickets FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'manager'));
GRANT ALL ON public.support_tickets TO authenticated;
\ir ../../drizzle/migrations/0009_work_module_tables.sql
\ir ../../drizzle/migrations/0038_work_task_collaboration.sql
CREATE TABLE public.suppliers(id uuid PRIMARY KEY,name text,owner_id uuid,test_account boolean DEFAULT false);
CREATE TABLE public.products(id uuid PRIMARY KEY,name text,supplier_id uuid REFERENCES public.suppliers(id),test_account boolean DEFAULT false);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_supplier_portfolio ON public.suppliers FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE POLICY original_product_portfolio ON public.products FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.suppliers s WHERE s.id=products.supplier_id));
GRANT SELECT ON public.suppliers,public.products TO authenticated;
CREATE TABLE public.quality_alerts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),supplier_id uuid REFERENCES public.suppliers(id),product_id uuid REFERENCES public.products(id),title text NOT NULL,description text NOT NULL,severity text NOT NULL CHECK(severity IN('low','medium','high','critical')),status text NOT NULL DEFAULT 'open'CHECK(status IN('open','investigating','resolved','closed')),reported_by uuid REFERENCES auth.users(id),assigned_to uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz,resolution_notes text);
ALTER TABLE public.quality_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_quality_read ON public.quality_alerts FOR SELECT TO authenticated USING(true);
CREATE POLICY original_quality_create ON public.quality_alerts FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY original_quality_update ON public.quality_alerts FOR UPDATE TO authenticated USING(public.has_role(auth.uid(),'manager'));
GRANT ALL ON public.quality_alerts TO authenticated;
CREATE TABLE public.field_audits(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),audit_type text NOT NULL,target_type text NOT NULL,target_id uuid,target_name text,auditor_id uuid,scheduled_date date,completed_date date,status text DEFAULT 'scheduled',findings text,recommendations text,score integer,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),app_origin text NOT NULL DEFAULT 'connect');
ALTER TABLE public.notifications ADD COLUMN pole_id public.pole_id;
CREATE FUNCTION public.has_any_pole(_user_id uuid,_poles text[])RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=$1 AND p.poles::text[]&&$2);$$;
\ir ../../drizzle/migrations/0005_create_anomalies.sql
\ir ../../drizzle/migrations/0006_audit_mission_workflow.sql
ALTER TABLE public.field_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY original_field_audits_read ON public.field_audits FOR SELECT TO authenticated USING(true);
CREATE POLICY original_field_audits_manage ON public.field_audits FOR ALL TO authenticated USING(public.has_role(auth.uid(),'manager'));
GRANT ALL ON public.field_audits TO authenticated;
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
\ir ../../drizzle/migrations/0044_intranet_identity_and_test_isolation.sql
\ir ../../drizzle/migrations/0045_work_module_lifecycle.sql
ALTER POLICY original_tickets_read ON public.support_tickets USING(public.is_leadership(auth.uid())OR public.has_any_pole(auth.uid(),ARRAY['lifecycle','tech','ops']));
\ir ../../drizzle/migrations/0047_support_ticket_workflow.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','supplier_manager','{supplier}','mid',false),
 ('10000000-0000-4000-8000-000000000002','audit_compliance_lead','{audit}','lead',false),
 ('10000000-0000-4000-8000-000000000003','audit_compliance_lead','{audit}','lead',false),
 ('10000000-0000-4000-8000-000000000004','audit_compliance_lead','{audit}','lead',false),
 ('10000000-0000-4000-8000-000000000005','supplier_manager','{supplier}','lead',false),
 ('10000000-0000-4000-8000-000000000006','finance_manager','{finance}','lead',false),
 ('10000000-0000-4000-8000-000000000007','supplier_manager','{supplier}','lead',true);
INSERT INTO auth.users(id)SELECT id FROM public.profiles;
INSERT INTO public.suppliers(id,name,owner_id)VALUES('20000000-0000-4000-8000-000000000001','Visible supplier','10000000-0000-4000-8000-000000000001'),('20000000-0000-4000-8000-000000000002','Hidden supplier','10000000-0000-4000-8000-000000000006');
INSERT INTO public.products(id,name,supplier_id)VALUES('30000000-0000-4000-8000-000000000001','Visible product','20000000-0000-4000-8000-000000000001');
INSERT INTO public.quality_alerts(title,description,severity,status,reported_by)VALUES('Legacy closed finding','Historical state','low','closed','10000000-0000-4000-8000-000000000001'),('Legacy sandbox finding','Synthetic','low','open','10000000-0000-4000-8000-000000000007');
INSERT INTO public.intranet_drive_documents(id,file_id,owner_id,page_id,name,mime_type,classification,test_account)VALUES
 ('40000000-0000-4000-8000-000000000001','evidence_file_001','10000000-0000-4000-8000-000000000001','supplier.alerts','Evidence','application/pdf','confidential',false),
 ('40000000-0000-4000-8000-000000000002','internal_file_002','10000000-0000-4000-8000-000000000005','supplier.alerts','Other owner','application/pdf','internal',false),
 ('40000000-0000-4000-8000-000000000003','sandbox_file_003','10000000-0000-4000-8000-000000000007','supplier.alerts','Synthetic','application/pdf','confidential',true);
\ir ../../drizzle/migrations/0048_quality_alert_workflow.sql
\ir ../../drizzle/migrations/0049_audit_mission_authority.sql
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.quality_alerts WHERE title='Legacy closed finding'AND legacy_record AND is_nonconformity AND approval_levels=2 AND closed_by IS NULL)THEN RAISE EXCEPTION 'legacy decision reclassified or fabricated';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.quality_alerts WHERE title='Legacy sandbox finding'AND test_account)THEN RAISE EXCEPTION 'historical sandbox data became real';END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 BEGIN PERFORM public.get_intranet_document_access('40000000-0000-4000-8000-000000000001');RAISE EXCEPTION 'unattached evidence crossed departments';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE a jsonb;key uuid:=gen_random_uuid();payload jsonb:='{"title":"Delivery quality","description":"Observed issue","severity":"high","is_nonconformity":true,"supplier_id":"20000000-0000-4000-8000-000000000001","product_id":"30000000-0000-4000-8000-000000000001","assigned_to":"10000000-0000-4000-8000-000000000002","document_ids":["40000000-0000-4000-8000-000000000001"]}';BEGIN
 a:=public.create_quality_alert('supplier.alerts',key,payload);PERFORM set_config('test.quality',(a->>'id'),true);
 IF(a->>'approval_levels')::int<>2 OR a->>'reported_by'<>auth.uid()::text OR(a->>'legacy_record')::boolean THEN RAISE EXCEPTION 'quality metadata or review policy forged';END IF;
 IF public.create_quality_alert('supplier.alerts',key,payload)->>'id'<>a->>'id'THEN RAISE EXCEPTION 'uncertain creation duplicated quality alert';END IF;
 BEGIN PERFORM public.create_quality_alert('supplier.alerts',key,payload||'{"title":"Changed"}');RAISE EXCEPTION 'conflicting retry accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Other owner attachment","description":"Invalid","document_ids":["40000000-0000-4000-8000-000000000002"]}');RAISE EXCEPTION 'readable document delegated without ownership';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Wrong environment attachment","description":"Invalid","document_ids":["40000000-0000-4000-8000-000000000003"]}');RAISE EXCEPTION 'test evidence attached to real case';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Hidden supplier","description":"Invalid","supplier_id":"20000000-0000-4000-8000-000000000002"}');RAISE EXCEPTION 'hidden supplier linked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Foreign assignee","description":"Invalid","assigned_to":"10000000-0000-4000-8000-000000000006"}');RAISE EXCEPTION 'unqualified agent assigned';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.transition_quality_alert('supplier.alerts',(a->>'id')::uuid,1,'investigate');RAISE EXCEPTION 'reporter started another agent investigation';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.add_quality_comment('supplier.alerts',(a->>'id')::uuid,'Initial context');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE a jsonb;BEGIN
 PERFORM public.get_intranet_document_access('40000000-0000-4000-8000-000000000001');
 PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,1,'investigate');
 BEGIN PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,2,'resolve','Fixed');RAISE EXCEPTION 'formal finding resolved without corrective evidence';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.update_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,2,'{"corrective_action":"Replace damaged goods","evidence":"Reinspection performed"}');
 BEGIN PERFORM public.update_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,2,'{"description":"Stale edit"}');RAISE EXCEPTION 'lost update accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,3,'resolve','Goods replaced and checked');
 BEGIN PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,4,'approve','Self approve');RAISE EXCEPTION 'solver approved own correction';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.update_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,4,'{"description":"Rewrite submitted proof"}');RAISE EXCEPTION 'submitted content mutable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN PERFORM public.update_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,4,'{"is_nonconformity":false}');RAISE EXCEPTION 'review policy downgraded';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
-- A reviewer can decide without receiving a general content-editing permission.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.access_roles(role_key)VALUES('quality_reviewer');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT '10000000-0000-4000-8000-000000000003',id,'active'FROM public.access_roles WHERE role_key='quality_reviewer';
INSERT INTO public.access_interfaces(interface_key)VALUES('audit.nonconformities');
INSERT INTO public.access_actions(action_key)VALUES('read'),('validate');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,ac.id,true FROM public.access_roles r,public.access_interfaces i,public.access_actions ac WHERE r.role_key='quality_reviewer'AND i.interface_key='audit.nonconformities';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE a jsonb;BEGIN
 IF public.can_intranet_action('audit.nonconformities','update')THEN RAISE EXCEPTION 'reviewer inherited an unsaved edit right';END IF;
 BEGIN UPDATE public.quality_alerts SET status='reviewed',severity='low',change_note='Hidden change',revision=revision+1 WHERE id=current_setting('test.quality')::uuid;RAISE EXCEPTION 'review changed frozen correction';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 a:=public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,4,'approve','Evidence verified');
 IF a->>'status'<>'reviewed'OR a->>'first_reviewer'<>auth.uid()::text OR a->>'reviewed_at'IS NULL THEN RAISE EXCEPTION 'first review did not bind reviewer and date';END IF;
 BEGIN PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,5,'approve','Second self review');RAISE EXCEPTION 'same person supplied both reviews';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,5,'approve','Independent closure check');
 IF a->>'status'<>'closed'OR a->>'closed_by'<>auth.uid()::text OR a->>'closed_at'IS NULL THEN RAISE EXCEPTION 'independent closure missing';END IF;
 IF(public.get_quality_stats('audit.nonconformities','formal')->>'duration_samples')::int<>1 THEN RAISE EXCEPTION 'unverified legacy closure polluted duration metric';END IF;
 BEGIN PERFORM public.add_quality_comment('audit.nonconformities',current_setting('test.quality')::uuid,'Rewrite closed case');RAISE EXCEPTION 'closed discussion editable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,6,'reopen','Defect reproduced');
 a:=public.get_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid);
 IF a->>'first_reviewer'IS NOT NULL OR a->>'closed_by'IS NOT NULL OR a->>'resolution_notes'IS NOT NULL THEN RAISE EXCEPTION 'reopen retained current approvals';END IF;
 BEGIN PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,7,'archive');RAISE EXCEPTION 'archiving bypassed unresolved non-conformity';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,7,'resolve','Rechecked correction');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,8,'approve','First recheck');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,9,'approve','Independent recheck');
 PERFORM public.transition_quality_alert('audit.nonconformities',current_setting('test.quality')::uuid,10,'archive');
 DELETE FROM public.quality_alerts WHERE id=current_setting('test.quality')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.quality_alerts WHERE id=current_setting('test.quality')::uuid)THEN RAISE EXCEPTION 'quality history physically deleted';END IF;
 BEGIN UPDATE public.quality_alert_comments SET body='Forged';RAISE EXCEPTION 'comment journal mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.quality_alerts)THEN RAISE EXCEPTION 'unrelated department read quality details';END IF;
 BEGIN PERFORM public.get_quality_stats('audit.overview');RAISE EXCEPTION 'unrelated department read aggregates';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
DO $$DECLARE a jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.quality_alerts WHERE NOT test_account)OR EXISTS(SELECT 1 FROM public.quality_alert_comments)THEN RAISE EXCEPTION 'real quality data leaked to sandbox';END IF;
 a:=public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Synthetic case","description":"Test only","assigned_to":"10000000-0000-4000-8000-000000000007"}');
 IF(a->>'test_account')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'sandbox creation saved as real';END IF;
 BEGIN PERFORM public.get_intranet_document_access('40000000-0000-4000-8000-000000000001');RAISE EXCEPTION 'real evidence visible to sandbox';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
-- Audit mission authority, Compare-and-set writes, trustworthy events and real/test boundaries.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000008','audit_compliance_lead','{audit}','mid',false),
 ('10000000-0000-4000-8000-000000000009','audit_compliance_lead','{audit}','mid',true);
INSERT INTO public.access_roles(role_key)VALUES('audit_worker');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT p.id,r.id,'active'FROM public.profiles p,public.access_roles r WHERE r.role_key='audit_worker'AND p.id IN('10000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000009');
INSERT INTO public.access_interfaces(interface_key)VALUES('audit.missions');
INSERT INTO public.access_actions(action_key)VALUES('create'),('update');
INSERT INTO public.access_interfaces(interface_key)VALUES('audit.field');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,false FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE r.role_key='quality_reviewer'AND i.interface_key='audit.field'AND a.action_key IN('read','update','validate');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,true FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE i.interface_key='audit.missions'AND(r.role_key='audit_worker'AND a.action_key IN('read','create','update')OR r.role_key='quality_reviewer'AND a.action_key IN('read','validate'));
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$DECLARE m public.field_audits;n public.field_audits;k uuid:=gen_random_uuid();payload jsonb:='{"target_name":"Supplier inspection","target_type":"supplier","audit_type":"quality","scheduled_date":"2026-10-29","auditor_id":"10000000-0000-4000-8000-000000000008","workflow_status":"assigned"}';BEGIN
 BEGIN PERFORM public.create_audit_mission(gen_random_uuid(),'{"target_name":"Forged","target_type":"supplier","audit_type":"quality","workflow_status":"compliant"}');RAISE EXCEPTION 'created an already validated mission';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 m:=public.create_audit_mission(k,payload);n:=public.create_audit_mission(k,payload);
 IF m.id<>n.id OR m.created_by<>auth.uid()OR m.assigned_at IS NULL OR m.test_account OR m.revision<>1 THEN RAISE EXCEPTION 'mission creation did not bind identity/time/retry';END IF;
 PERFORM set_config('test.mission',m.id::text,true);
 BEGIN PERFORM public.update_audit_mission(m.id,1,'{"workflow_status":"compliant","decision_reason":"Skip stages"}');RAISE EXCEPTION 'creator validated own mission';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.update_audit_mission(m.id,1,'{"auditor_id":"10000000-0000-4000-8000-000000000009"}');RAISE EXCEPTION 'cross-environment auditor assigned';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
DO $$DECLARE m public.field_audits;BEGIN
 IF public.audit_mission_action('validate')THEN RAISE EXCEPTION 'worker inherited unsaved validation';END IF;
 BEGIN UPDATE public.field_audits SET workflow_status='compliant',decision_reason='Forged decision',revision=revision+1 WHERE id=current_setting('test.mission')::uuid;RAISE EXCEPTION 'direct worker validation bypassed RPC';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 m:=public.update_audit_mission(current_setting('test.mission')::uuid,1,'{"workflow_status":"in_field"}');
 IF m.field_started_at IS NULL OR m.status<>'in_progress'THEN RAISE EXCEPTION 'field transition did not stamp state';END IF;
 BEGIN PERFORM public.update_audit_mission(m.id,1,'{"findings":"Stale results"}');RAISE EXCEPTION 'stale mission write overwrote new stage';EXCEPTION WHEN serialization_failure THEN NULL;END;
 m:=public.update_audit_mission(m.id,2,'{"findings":"Seal damaged on arrival","score":55}');
 BEGIN PERFORM public.update_audit_mission(m.id,3,'{"score":101}');RAISE EXCEPTION 'invalid score accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 m:=public.update_audit_mission(m.id,3,'{"workflow_status":"synced"}');
 m:=public.update_audit_mission(m.id,4,'{"workflow_status":"analysis"}');
 BEGIN INSERT INTO public.audit_mission_events(audit_id,to_status,message)VALUES(m.id,'compliant','Fabricated signature');RAISE EXCEPTION 'client forged mission events';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE m public.field_audits;BEGIN
 IF public.audit_mission_action('update')OR NOT public.audit_mission_action('validate')THEN RAISE EXCEPTION 'saved decision/edit permissions not separated';END IF;
 BEGIN PERFORM public.update_audit_mission(current_setting('test.mission')::uuid,5,'{"workflow_status":"non_compliant","decision_reason":"Repair seals","findings":"Rewritten by reviewer"}');RAISE EXCEPTION 'reviewer rewrote submitted evidence';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 m:=public.update_audit_mission(current_setting('test.mission')::uuid,5,'{"workflow_status":"non_compliant","decision_reason":"Seal damage requires corrective action","change_note":"Request corrective action"}');
 IF m.decided_by<>auth.uid()OR m.decided_at IS NULL OR m.anomaly_id IS NULL THEN RAISE EXCEPTION 'decision identity/date/Ops finding missing';END IF;
 BEGIN INSERT INTO public.anomalies(source,type,title,object_type,object_id)VALUES('audits','Direct unrelated write','Bypass','field_audit',m.id::text);RAISE EXCEPTION 'Audit permission widened to arbitrary Ops creation';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
DO $$DECLARE m public.field_audits;BEGIN
 m:=public.update_audit_mission(current_setting('test.mission')::uuid,6,'{"workflow_status":"corrective_action","corrective_action":"Replace and inspect seals","corrective_due_date":"2026-11-05"}');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 BEGIN PERFORM public.update_audit_mission(current_setting('test.mission')::uuid,7,'{"workflow_status":"closed","change_note":"Close without proof"}');RAISE EXCEPTION 'corrective case closed without proof';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000008',true);
SELECT public.update_audit_mission(current_setting('test.mission')::uuid,7,'{"correction_evidence":"Photos reviewed and seals reinspected"}');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE m public.field_audits;BEGIN
 m:=public.update_audit_mission(current_setting('test.mission')::uuid,8,'{"workflow_status":"closed","change_note":"Independent verification complete"}');
 IF m.closed_by<>auth.uid()OR m.closed_at IS NULL OR m.status<>'completed'THEN RAISE EXCEPTION 'closure did not bind validator and date';END IF;
 BEGIN PERFORM public.update_audit_mission(m.id,9,'{"workflow_status":"analysis"}');RAISE EXCEPTION 'closed mission reopened without policy';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 DELETE FROM public.field_audits WHERE id=m.id;
 IF NOT EXISTS(SELECT 1 FROM public.field_audits WHERE id=m.id)THEN RAISE EXCEPTION 'mission history physically deleted';END IF;
 IF(SELECT count(*)FROM public.audit_mission_events WHERE audit_id=m.id)<>7 THEN RAISE EXCEPTION 'workflow journal incomplete';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.field_audits)OR EXISTS(SELECT 1 FROM public.audit_mission_events)THEN RAISE EXCEPTION 'unrelated department read missions/events';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000009',true);
DO $$DECLARE m public.field_audits;BEGIN
 IF EXISTS(SELECT 1 FROM public.field_audits WHERE NOT test_account)OR EXISTS(SELECT 1 FROM public.audit_mission_events)THEN RAISE EXCEPTION 'sandbox read real missions/events';END IF;
 m:=public.create_audit_mission(gen_random_uuid(),'{"target_name":"Synthetic inspection","target_type":"supplier","audit_type":"quality","scheduled_date":"2026-10-29","auditor_id":"10000000-0000-4000-8000-000000000009","workflow_status":"assigned"}');
 IF NOT m.test_account THEN RAISE EXCEPTION 'synthetic mission became real';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.audit_mission_events WHERE audit_id=m.id)THEN RAISE EXCEPTION 'sandbox cannot read its own journal';END IF;
END $$;
-- Trusted Audit Hub ingestion keeps its existing workflow adaptation and does not broadcast synthetic findings.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
DO $$DECLARE m public.field_audits;before_count bigint;BEGIN
 SELECT count(*)INTO before_count FROM public.anomalies;
 INSERT INTO public.field_audits(target_name,target_type,audit_type,app_origin,auditor_id,test_account,findings)VALUES('Synthetic hub finding','supplier','quality','audit_hub','10000000-0000-4000-8000-000000000009',true,'Synthetic evidence')RETURNING * INTO m;
 IF m.workflow_status<>'synced'OR m.synced_at IS NULL THEN RAISE EXCEPTION 'trusted Audit Hub ingestion broken';END IF;
 UPDATE public.field_audits SET workflow_status='non_compliant',decision_reason='Synthetic decision'WHERE id=m.id;
 IF(SELECT count(*)FROM public.anomalies)<>before_count THEN RAISE EXCEPTION 'synthetic mission created real Ops finding';END IF;
END $$;
-- Normal supplier alerts need one independent review; formal findings retain both reviews.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.create_quality_alert('supplier.alerts',gen_random_uuid(),'{"title":"Minor quality alert","description":"Label discrepancy","assigned_to":"10000000-0000-4000-8000-000000000002"}');
 IF(a->>'approval_levels')::int<>1 OR(a->>'is_nonconformity')::boolean THEN RAISE EXCEPTION 'ordinary alert forced into formal audit workflow';END IF;
 PERFORM set_config('test.minor_quality',a->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.minor_quality')::uuid,1,'investigate');
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.minor_quality')::uuid,2,'resolve','Label corrected');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.transition_quality_alert('supplier.alerts',current_setting('test.minor_quality')::uuid,3,'approve','Independent sample checked');
 IF a->>'status'<>'closed'OR a->>'closed_by'<>auth.uid()::text THEN RAISE EXCEPTION 'single-level independent closure failed';END IF;
END $$;
-- Rework after the first review clears current signatures while preserving their journal.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$DECLARE a jsonb;BEGIN
 a:=public.create_quality_alert('audit.nonconformities',gen_random_uuid(),'{"title":"Formal rework case","description":"Audit finding","assigned_to":"10000000-0000-4000-8000-000000000002","corrective_action":"Replace component","evidence":"Inspection"}');
 PERFORM set_config('test.rework_quality',a->>'id',true);
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.rework_quality')::uuid,1,'investigate');
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.rework_quality')::uuid,2,'resolve','Replaced component');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT public.transition_quality_alert('audit.nonconformities',current_setting('test.rework_quality')::uuid,3,'approve','First check');
DO $$DECLARE a jsonb;timeline jsonb;BEGIN
 a:=public.transition_quality_alert('audit.nonconformities',current_setting('test.rework_quality')::uuid,4,'return','Need another sample');
 IF a->>'status'<>'investigating'OR a->>'first_reviewer'IS NOT NULL OR a->>'resolved_by'IS NOT NULL OR a->>'closed_by'IS NOT NULL THEN RAISE EXCEPTION 'rework preserved current signatures';END IF;
 timeline:=public.list_quality_timeline('audit.nonconformities',current_setting('test.rework_quality')::uuid);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(timeline->'rows')e WHERE e->'after_state'->>'status'='reviewed')THEN RAISE EXCEPTION 'rework erased prior approval evidence';END IF;
 PERFORM public.add_quality_comment('audit.nonconformities',current_setting('test.rework_quality')::uuid,'Comment '||n)FROM generate_series(1,52)n;
 timeline:=public.list_quality_timeline('audit.nonconformities',current_setting('test.rework_quality')::uuid);
 IF jsonb_array_length(timeline->'rows')<>50 OR NOT(timeline->>'has_more')::boolean OR jsonb_array_length(public.list_quality_timeline('audit.nonconformities',current_setting('test.rework_quality')::uuid,50)->'rows')<3 THEN RAISE EXCEPTION 'quality journal pagination lost comments';END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.quality_alerts(title,description,severity,reported_by)SELECT 'Paged finding '||n,'Synthetic fixture in real-mode transaction','low','10000000-0000-4000-8000-000000000004'FROM generate_series(1,52)n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$DECLARE first_page jsonb;second_page jsonb;BEGIN
 first_page:=public.list_quality_alerts('audit.nonconformities','all','Paged finding','all',0);
 second_page:=public.list_quality_alerts('audit.nonconformities','all','Paged finding','all',50);
 IF jsonb_array_length(first_page->'rows')<>50 OR NOT(first_page->>'has_more')::boolean OR jsonb_array_length(second_page->'rows')<>2 OR(second_page->>'has_more')::boolean THEN RAISE EXCEPTION 'quality queue pagination incomplete';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(first_page->'rows')a,jsonb_array_elements(second_page->'rows')b WHERE a->>'id'=b->>'id')THEN RAISE EXCEPTION 'quality pagination repeats records';END IF;
END $$;
ROLLBACK;
