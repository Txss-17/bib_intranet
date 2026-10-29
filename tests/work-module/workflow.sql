\set ON_ERROR_STOP on
\ir ../intranet/fixture.sql
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,invited_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.hr_employee_requests(id uuid PRIMARY KEY,request_kind text,status text,hr_validated_by uuid,created_user_id uuid,work_email text,personal_email text);
CREATE TABLE public.hr_onboarding_invitation_claims(nonce uuid,request_id uuid,email text,expires_at timestamptz,consumed_user_id uuid,consumed_at timestamptz);
ALTER TABLE public.profiles ADD COLUMN position_key text;
ALTER TABLE public.access_assignments ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN assigned_by uuid;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_profile_read ON public.profiles FOR SELECT TO authenticated USING(true);
GRANT SELECT ON public.notifications TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_notification_read ON public.notifications FOR SELECT TO authenticated USING(true);
\ir ../../drizzle/migrations/0009_work_module_tables.sql
\ir ../../drizzle/migrations/0038_work_task_collaboration.sql
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
\ir ../../drizzle/migrations/0044_intranet_identity_and_test_isolation.sql
INSERT INTO auth.users(id)VALUES('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002'),('10000000-0000-4000-8000-000000000003'),('10000000-0000-4000-8000-000000000004'),('10000000-0000-4000-8000-000000000005');
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','ops_logistics_manager','{ops}','mid',false),
 ('10000000-0000-4000-8000-000000000002','ops_logistics_manager','{ops}','lead',false),
 ('10000000-0000-4000-8000-000000000003','finance_manager','{finance}','lead',false),
 ('10000000-0000-4000-8000-000000000004','ops_logistics_manager','{ops}','junior',false),
 ('10000000-0000-4000-8000-000000000005','ops_logistics_manager','{ops}','lead',true);
-- Existing rows must be classified by their creator and gain an honest baseline, not invented past events.
INSERT INTO public.work_projects(name,pole,created_by)VALUES('Existing sandbox project','ops','10000000-0000-4000-8000-000000000005');
INSERT INTO public.work_processes(name,pole,status,steps,created_by)VALUES('Existing real procedure','ops','active','[{"label":"Existing step"}]','10000000-0000-4000-8000-000000000001');
INSERT INTO public.work_tasks(title,created_by,task_poles)VALUES('Existing task','10000000-0000-4000-8000-000000000001','{ops}');
DELETE FROM public.work_task_history;
\ir ../../drizzle/migrations/0045_work_module_lifecycle.sql
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.work_projects WHERE test_account)THEN RAISE EXCEPTION 'existing sandbox project classified as real';END IF;
 IF(SELECT count(*)FROM public.work_module_events WHERE action='imported')<>2 OR(SELECT count(*)FROM public.work_task_history WHERE action='imported')<>1 THEN RAISE EXCEPTION 'existing work baseline missing';END IF;
END $$;
DELETE FROM public.work_projects;
DELETE FROM public.work_processes;
DELETE FROM public.work_task_history;
DELETE FROM public.work_tasks;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE r jsonb;BEGIN
 r:=public.create_work_module_record('projects','20000000-0000-4000-8000-000000000001','{"name":"Launch","pole":"ops","owner_id":"10000000-0000-4000-8000-000000000002"}');PERFORM set_config('test.project',r->>'id',true);
 IF public.create_work_module_record('projects','20000000-0000-4000-8000-000000000001','{"name":"Launch","pole":"ops","owner_id":"10000000-0000-4000-8000-000000000002"}')->>'id'<>r->>'id'THEN RAISE EXCEPTION 'creation retry duplicated project';END IF;
 BEGIN PERFORM public.create_work_module_record('projects','20000000-0000-4000-8000-000000000001','{"name":"Changed"}');RAISE EXCEPTION 'changed retry accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.transition_work_module_record('projects',(r->>'id')::uuid,1,'completed');RAISE EXCEPTION 'project skipped activation';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN INSERT INTO public.work_projects(name,created_by,archived_at)VALUES('Archive bypass',auth.uid(),now());RAISE EXCEPTION 'creation bypassed archive permissions';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN INSERT INTO public.work_validations(title,requester_id,validator_id,decided_at)VALUES('Forged decision',auth.uid(),'10000000-0000-4000-8000-000000000002',now());RAISE EXCEPTION 'initial decision metadata forged';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN UPDATE public.work_projects SET name='No revision'WHERE id=(r->>'id')::uuid;RAISE EXCEPTION 'unversioned update accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 UPDATE public.work_projects SET description='First version',revision=revision+1 WHERE id=(r->>'id')::uuid;
 BEGIN UPDATE public.work_projects SET description='Stale',revision=2 WHERE id=(r->>'id')::uuid;RAISE EXCEPTION 'stale update accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.create_work_module_record('projects',gen_random_uuid(),'{"name":"Wrong scope","pole":"finance"}');RAISE EXCEPTION 'cross-pole creation accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.create_work_module_record('processes',gen_random_uuid(),'{"name":"Procedure","pole":"ops","owner_id":"10000000-0000-4000-8000-000000000002","steps":[]}');PERFORM set_config('test.process',r->>'id',true);
 BEGIN PERFORM public.transition_work_module_record('processes',(r->>'id')::uuid,1,'active');RAISE EXCEPTION 'unqualified author published';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_work_module_record('validations',gen_random_uuid(),'{"title":"Self","pole":"ops","validator_id":"10000000-0000-4000-8000-000000000001"}');RAISE EXCEPTION 'self validator accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_work_module_record('validations',gen_random_uuid(),'{"title":"Junior","pole":"ops","validator_id":"10000000-0000-4000-8000-000000000004"}');RAISE EXCEPTION 'unqualified validator accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_work_module_record('validations',gen_random_uuid(),'{"title":"Wrong mode","pole":"ops","validator_id":"10000000-0000-4000-8000-000000000005"}');RAISE EXCEPTION 'cross-environment validator accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.create_work_module_record('validations',gen_random_uuid(),'{"title":"Decision","pole":"ops","validator_id":"10000000-0000-4000-8000-000000000002"}');PERFORM set_config('test.validation',r->>'id',true);
 BEGIN PERFORM public.transition_work_module_record('validations',(r->>'id')::uuid,1,'approved');RAISE EXCEPTION 'self approval accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.work_validations SET description='Changed after submission',revision=revision+1 WHERE id=(r->>'id')::uuid;RAISE EXCEPTION 'submitted request content changed';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 r:=public.create_work_module_record('escalations',gen_random_uuid(),'{"title":"Blocker","pole":"ops","assigned_to":"10000000-0000-4000-8000-000000000002"}');PERFORM set_config('test.escalation',r->>'id',true);
 BEGIN PERFORM public.transition_work_module_record('escalations',(r->>'id')::uuid,1,'acknowledged');RAISE EXCEPTION 'requester claimed another assignee work';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 INSERT INTO public.work_tasks(title,created_by,task_poles)VALUES('Related activity',auth.uid(),'{ops}');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.work_projects)OR jsonb_array_length(public.list_work_activity()->'rows')<>0 THEN RAISE EXCEPTION 'unrelated pole saw private work';END IF;
 BEGIN PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,2,'active');RAISE EXCEPTION 'unrelated manager changed project';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE r jsonb;BEGIN
 IF(SELECT count(*)FROM public.notifications WHERE user_id=auth.uid())<4 THEN RAISE EXCEPTION 'responsibility notifications missing';END IF;
 PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,2,'active');
 PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,3,'completed');
 BEGIN UPDATE public.work_projects SET description='Rewrite completed project',revision=revision+1 WHERE id=current_setting('test.project')::uuid;RAISE EXCEPTION 'completed project changed';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,4,'planning','Revised scope');
 PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,5,'archived');
 IF NOT EXISTS(SELECT 1 FROM public.work_projects WHERE archived_at IS NOT NULL)THEN RAISE EXCEPTION 'project archive missing';END IF;
 DELETE FROM public.work_projects WHERE id=current_setting('test.project')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.work_projects WHERE id=current_setting('test.project')::uuid)THEN RAISE EXCEPTION 'project physically deleted';END IF;
 BEGIN PERFORM public.transition_work_module_record('processes',current_setting('test.process')::uuid,1,'active');RAISE EXCEPTION 'empty procedure published';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 UPDATE public.work_processes SET steps='[{"label":"Check evidence"}]',revision=revision+1 WHERE id=current_setting('test.process')::uuid;
 PERFORM public.transition_work_module_record('processes',current_setting('test.process')::uuid,2,'active');
 BEGIN UPDATE public.work_processes SET steps='[{"label":"Changed published version"}]',revision=revision+1 WHERE id=current_setting('test.process')::uuid;RAISE EXCEPTION 'published procedure changed';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN PERFORM public.transition_work_module_record('processes',current_setting('test.process')::uuid,3,'deprecated');RAISE EXCEPTION 'procedure withdrawn without reason';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 PERFORM public.transition_work_module_record('processes',current_setting('test.process')::uuid,3,'deprecated','Superseded');
 BEGIN PERFORM public.transition_work_module_record('validations',current_setting('test.validation')::uuid,1,'rejected');RAISE EXCEPTION 'rejection lacked reason';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 UPDATE public.work_validations SET status='approved',decided_at='1999-01-01',decided_by='10000000-0000-4000-8000-000000000003',revision=revision+1 WHERE id=current_setting('test.validation')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.work_validations WHERE decided_by=auth.uid()AND decided_at>'2000-01-01')THEN RAISE EXCEPTION 'decision metadata forged';END IF;
 BEGIN PERFORM public.transition_work_module_record('validations',current_setting('test.validation')::uuid,1,'rejected','Stale');RAISE EXCEPTION 'duplicate decision accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 PERFORM public.transition_work_module_record('validations',current_setting('test.validation')::uuid,2,'archived');
 PERFORM public.transition_work_module_record('escalations',current_setting('test.escalation')::uuid,1,'acknowledged');
 BEGIN PERFORM public.transition_work_module_record('escalations',current_setting('test.escalation')::uuid,2,'resolved');RAISE EXCEPTION 'empty resolution accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 r:=public.transition_work_module_record('escalations',current_setting('test.escalation')::uuid,2,'resolved','Evidence checked');
 IF r->>'resolution_note'<>'Evidence checked'OR r->>'resolved_at'IS NULL THEN RAISE EXCEPTION 'resolution missing';END IF;
 IF jsonb_array_length(public.list_work_module_events('escalations',current_setting('test.escalation')::uuid))<>3 THEN RAISE EXCEPTION 'work history incomplete';END IF;
 IF jsonb_array_length(public.list_work_activity('processes')->'rows')<4 THEN RAISE EXCEPTION 'activity lists only creations';END IF;
 BEGIN UPDATE public.work_module_events SET note='Forged';RAISE EXCEPTION 'work history mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$BEGIN
 BEGIN PERFORM public.transition_work_module_record('escalations',current_setting('test.escalation')::uuid,3,'open');RAISE EXCEPTION 'reopen lacked reason';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 PERFORM public.transition_work_module_record('escalations',current_setting('test.escalation')::uuid,3,'open','Issue reproduced');
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$DECLARE r jsonb;BEGIN
 IF jsonb_array_length(public.list_work_activity()->'rows')<>0 THEN RAISE EXCEPTION 'real activity leaked to sandbox';END IF;
 BEGIN PERFORM public.transition_work_module_record('projects',current_setting('test.project')::uuid,6,'active');RAISE EXCEPTION 'sandbox modified real work';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.create_work_module_record('projects',gen_random_uuid(),'{"name":"Sandbox project","pole":"ops","owner_id":"10000000-0000-4000-8000-000000000005"}');
 IF(r->>'test_account')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'test project saved in real environment';END IF;
 IF jsonb_array_length(public.list_work_activity()->'rows')<>1 THEN RAISE EXCEPTION 'sandbox own activity unavailable';END IF;
END $$;
-- Saved decisions override the code matrix and are rechecked at the moment of transition.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE r jsonb;BEGIN
 r:=public.create_work_module_record('validations',gen_random_uuid(),'{"title":"Revocable review","pole":"ops","validator_id":"10000000-0000-4000-8000-000000000002"}');
 PERFORM set_config('test.revocable_validation',r->>'id',true);
END $$;
RESET ROLE;
INSERT INTO public.access_roles(role_key)VALUES('work_reviewer');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT '10000000-0000-4000-8000-000000000002',id,'active'FROM public.access_roles WHERE role_key='work_reviewer';
INSERT INTO public.access_interfaces(interface_key)VALUES('work.validations');
INSERT INTO public.access_actions(action_key)VALUES('read'),('validate');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,a.action_key='read'FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE r.role_key='work_reviewer'AND i.interface_key='work.validations';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$BEGIN
 BEGIN PERFORM public.transition_work_module_record('validations',current_setting('test.revocable_validation')::uuid,1,'approved');RAISE EXCEPTION 'revoked reviewer decided';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
UPDATE public.access_permissions SET allowed=true WHERE action_id=(SELECT id FROM public.access_actions WHERE action_key='validate');
SET LOCAL ROLE authenticated;
DO $$DECLARE r jsonb;BEGIN
 IF public.can_intranet_action('work.validations','update')THEN RAISE EXCEPTION 'unsaved update right inherited';END IF;
 r:=public.transition_work_module_record('validations',current_setting('test.revocable_validation')::uuid,1,'approved','Reviewed');
 IF r->>'decided_by'<>auth.uid()::text THEN RAISE EXCEPTION 'validate-only reviewer could not decide';END IF;
END $$;
ROLLBACK;
