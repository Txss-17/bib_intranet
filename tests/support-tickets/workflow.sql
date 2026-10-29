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
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
\ir ../../drizzle/migrations/0044_intranet_identity_and_test_isolation.sql
\ir ../../drizzle/migrations/0045_work_module_lifecycle.sql
ALTER POLICY original_tickets_read ON public.support_tickets USING(public.is_leadership(auth.uid())OR public.has_any_pole(auth.uid(),ARRAY['lifecycle','tech','ops']));
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','customer_success_manager','{support}','mid',false),
 ('10000000-0000-4000-8000-000000000002','customer_success_manager','{support}','mid',false),
 ('10000000-0000-4000-8000-000000000003','customer_success_manager','{support}','lead',false),
 ('10000000-0000-4000-8000-000000000004','finance_manager','{finance}','lead',false),
 ('10000000-0000-4000-8000-000000000005','customer_success_manager','{support}','lead',true),
 ('10000000-0000-4000-8000-000000000006','customer_success_manager','{support}','junior',false);
INSERT INTO public.user_roles(user_id,role)VALUES('10000000-0000-4000-8000-000000000001','manager');
INSERT INTO public.user_accounts(id,company_name,test_account)VALUES('20000000-0000-4000-8000-000000000001','Real merchant',false),('20000000-0000-4000-8000-000000000002','Sandbox merchant',true);
INSERT INTO public.support_tickets(subject,description,assigned_to,created_by)VALUES('Existing sandbox ticket','Synthetic','10000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005');
\ir ../../drizzle/migrations/0047_support_ticket_workflow.sql
DO $$BEGIN IF NOT EXISTS(SELECT 1 FROM public.support_tickets WHERE test_account)THEN RAISE EXCEPTION 'existing sandbox ticket classified as real';END IF;END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE r jsonb;key uuid:=gen_random_uuid();BEGIN
 IF NOT public.can_intranet_table_action('user_accounts','read')OR public.can_intranet_table_action('user_accounts','update')THEN RAISE EXCEPTION 'customer context widened commercial writes';END IF;
 IF(SELECT count(*)FROM public.user_accounts)<>1 THEN RAISE EXCEPTION 'support customer context missing or sandbox leaked';END IF;
 UPDATE public.user_accounts SET company_name='Forbidden commercial edit';IF FOUND THEN RAISE EXCEPTION 'support reader changed commercial data through manager policy';END IF;
 r:=public.create_support_ticket(key,'{"subject":"Delivery delay","description":"Investigate parcel","category":"delivery","assigned_to":"10000000-0000-4000-8000-000000000002","user_account_id":"20000000-0000-4000-8000-000000000001"}');PERFORM set_config('test.ticket',r->>'id',true);
 IF r->>'created_by'<>auth.uid()::text OR(r->>'revision')::int<>1 OR(r->>'test_account')::boolean THEN RAISE EXCEPTION 'ticket identity not bound';END IF;
 IF public.create_support_ticket(key,'{"subject":"Delivery delay","description":"Investigate parcel","category":"delivery","assigned_to":"10000000-0000-4000-8000-000000000002","user_account_id":"20000000-0000-4000-8000-000000000001"}')->>'id'<>r->>'id'THEN RAISE EXCEPTION 'retry duplicated ticket';END IF;
 BEGIN PERFORM public.create_support_ticket(key,'{"subject":"Different","description":"Changed"}');RAISE EXCEPTION 'conflicting retry accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.create_support_ticket(gen_random_uuid(),'{"subject":"Fake","description":"Initial decision","status":"resolved"}');RAISE EXCEPTION 'forged creation field accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN INSERT INTO public.support_tickets(subject,description,platform_id)VALUES('Forged source','Invalid','forged-platform-id');RAISE EXCEPTION 'staff creation forged platform binding';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN PERFORM public.create_support_ticket(gen_random_uuid(),'{"subject":"Wrong assignee","description":"No scope","assigned_to":"10000000-0000-4000-8000-000000000004"}');RAISE EXCEPTION 'non-support assignee accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_support_ticket(gen_random_uuid(),'{"subject":"Wrong mode","description":"No scope","assigned_to":"10000000-0000-4000-8000-000000000005"}');RAISE EXCEPTION 'sandbox assignee accepted for real ticket';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.create_support_ticket(gen_random_uuid(),'{"subject":"Wrong account","description":"No scope","user_account_id":"20000000-0000-4000-8000-000000000002"}');RAISE EXCEPTION 'sandbox account linked to real ticket';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.update_support_ticket((r->>'id')::uuid,1,'{"status":"resolved","resolution":"Creator shortcut"}');RAISE EXCEPTION 'creator resolved another agent work';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.update_support_ticket((r->>'id')::uuid,1,'{"description":"Evidence attached"}');
 BEGIN PERFORM public.update_support_ticket((r->>'id')::uuid,1,'{"description":"Lost update"}');RAISE EXCEPTION 'stale edit accepted';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN UPDATE public.support_tickets SET platform_id='forged',revision=revision+1 WHERE id=(r->>'id')::uuid;RAISE EXCEPTION 'platform identity forged';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM public.add_support_ticket_note((r->>'id')::uuid,'  Internal follow-up  ');
 IF public.get_support_ticket_stats()->>'avgResolutionHours'IS NOT NULL THEN RAISE EXCEPTION 'missing resolution invented zero duration';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE r jsonb;BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE user_id=auth.uid()AND metadata->>'source'='support_ticket')THEN RAISE EXCEPTION 'assignment notification missing';END IF;
 BEGIN PERFORM public.update_support_ticket(current_setting('test.ticket')::uuid,2,'{"status":"resolved"}');RAISE EXCEPTION 'empty resolution accepted';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 r:=public.update_support_ticket(current_setting('test.ticket')::uuid,2,'{"status":"resolved","resolution":"Parcel delivered"}');
 IF r->>'resolved_at'IS NULL OR r->>'resolution'<>'Parcel delivered'THEN RAISE EXCEPTION 'resolution metadata missing';END IF;
 BEGIN UPDATE public.support_tickets SET resolved_at='1999-01-01',revision=revision+1 WHERE id=current_setting('test.ticket')::uuid;RAISE EXCEPTION 'completed timestamp editable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN PERFORM public.add_support_ticket_note(current_setting('test.ticket')::uuid,'Rewrite completed discussion');RAISE EXCEPTION 'resolved discussion mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.update_support_ticket(current_setting('test.ticket')::uuid,3,'{"status":"closed"}');IF r->>'closed_at'IS NULL THEN RAISE EXCEPTION 'close timestamp missing';END IF;
 BEGIN PERFORM public.update_support_ticket(current_setting('test.ticket')::uuid,4,'{"status":"open","change_note":"Issue recurred"}');RAISE EXCEPTION 'ordinary agent reopened closed ticket';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 IF jsonb_array_length(public.list_support_ticket_notes(current_setting('test.ticket')::uuid)->'rows')<>1 OR jsonb_array_length(public.list_support_ticket_history(current_setting('test.ticket')::uuid)->'rows')<>4 THEN RAISE EXCEPTION 'discussion or history missing';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE r jsonb;BEGIN
 BEGIN PERFORM public.update_support_ticket(current_setting('test.ticket')::uuid,4,'{"status":"open"}');RAISE EXCEPTION 'reopen lacked reason';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 r:=public.update_support_ticket(current_setting('test.ticket')::uuid,4,'{"status":"open","change_note":"Issue reproduced"}');
 IF r->>'resolution'IS NOT NULL OR r->>'resolved_at'IS NOT NULL OR r->>'closed_at'IS NOT NULL THEN RAISE EXCEPTION 'reopened ticket retained completed metadata';END IF;
 PERFORM public.archive_support_ticket(current_setting('test.ticket')::uuid,5);
 IF public.get_support_ticket_stats()->>'totalTickets'<>'0'THEN RAISE EXCEPTION 'archive counted in active dashboard';END IF;
 DELETE FROM public.support_tickets WHERE id=current_setting('test.ticket')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.support_tickets WHERE id=current_setting('test.ticket')::uuid)THEN RAISE EXCEPTION 'ticket physically deleted';END IF;
 BEGIN PERFORM public.update_support_ticket(current_setting('test.ticket')::uuid,6,'{"subject":"Rewrite archive"}');RAISE EXCEPTION 'archive mutable';EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL;END;
 BEGIN UPDATE public.support_ticket_notes SET body='Forged';RAISE EXCEPTION 'internal notes mutable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.support_tickets)THEN RAISE EXCEPTION 'unrelated department saw tickets';END IF;
 BEGIN PERFORM public.get_support_ticket_stats();RAISE EXCEPTION 'unrelated department read statistics';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
DO $$DECLARE r jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.support_tickets WHERE NOT test_account)OR EXISTS(SELECT 1 FROM public.support_ticket_notes)THEN RAISE EXCEPTION 'real work leaked to test mode';END IF;
 r:=public.create_support_ticket(gen_random_uuid(),'{"subject":"Sandbox case","description":"Synthetic","assigned_to":"10000000-0000-4000-8000-000000000005"}');
 IF(r->>'test_account')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'sandbox creation entered real environment';END IF;
 PERFORM public.add_support_ticket_note((r->>'id')::uuid,'Synthetic note');
 BEGIN PERFORM public.list_support_ticket_history(current_setting('test.ticket')::uuid);RAISE EXCEPTION 'test mode read real history';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
-- Histories and internal notes retain more than one API page.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE r jsonb;i integer;BEGIN
 r:=public.create_support_ticket(gen_random_uuid(),'{"subject":"Paged case","description":"Initial","assigned_to":"10000000-0000-4000-8000-000000000003"}');PERFORM set_config('test.paged_ticket',r->>'id',true);
 FOR i IN 1..60 LOOP
  PERFORM public.update_support_ticket((r->>'id')::uuid,i,jsonb_build_object('description','Revision '||i));
  PERFORM public.add_support_ticket_note((r->>'id')::uuid,'Note '||i);
 END LOOP;
 IF jsonb_array_length(public.list_support_ticket_history((r->>'id')::uuid)->'rows')<>50 OR jsonb_array_length(public.list_support_ticket_history((r->>'id')::uuid,50)->'rows')<>11 THEN RAISE EXCEPTION 'history pagination truncated later pages';END IF;
 IF jsonb_array_length(public.list_support_ticket_notes((r->>'id')::uuid)->'rows')<>50 OR jsonb_array_length(public.list_support_ticket_notes((r->>'id')::uuid,50)->'rows')<>10 THEN RAISE EXCEPTION 'notes pagination truncated later pages';END IF;
 INSERT INTO public.support_ticket_notes(ticket_id,body,created_at)VALUES((r->>'id')::uuid,'Stamped note','1999-01-01');
 IF EXISTS(SELECT 1 FROM public.support_ticket_notes WHERE body='Stamped note'AND created_at<'2000-01-01')THEN RAISE EXCEPTION 'note timestamp forged';END IF;
END $$;
-- Preserve original customer row policies while permitting an agent to handle an unchanged client link.
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$DECLARE r jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.user_accounts)THEN RAISE EXCEPTION 'customer context bypassed original portfolio policy';END IF;
 BEGIN PERFORM public.create_support_ticket(gen_random_uuid(),'{"subject":"Hidden client","description":"No scope","user_account_id":"20000000-0000-4000-8000-000000000001"}');RAISE EXCEPTION 'unreadable customer linked';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
-- Background imports retain their trusted synchronization path; invalid legacy durations are excluded.
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.support_tickets(subject,description,status,resolution,created_at,resolved_at)VALUES
 ('Timed case','Imported','resolved','Done',now()-interval '4 hours',now()-interval '2 hours'),
 ('Unknown duration','Imported','closed','Done',NULL,NULL),
 ('Negative duration','Imported','resolved','Done',now(),now()-interval '1 hour'),
 ('Future duration','Imported','resolved','Done',now(),now()+interval '1 day');
UPDATE public.support_tickets SET platform_id='trusted-platform-id'WHERE subject='Timed case';
DO $$BEGIN IF(SELECT revision FROM public.support_tickets WHERE subject='Timed case')<>2 THEN RAISE EXCEPTION 'synchronization did not advance revision';END IF;END $$;
INSERT INTO public.support_tickets(subject,description,status,assigned_to,test_account)VALUES('Real case with invalid test attribution','Imported','open','10000000-0000-4000-8000-000000000005',false);
DO $$BEGIN IF EXISTS(SELECT 1 FROM public.notifications WHERE user_id='10000000-0000-4000-8000-000000000005'AND message='Real case with invalid test attribution')THEN RAISE EXCEPTION 'service attribution leaked a real subject into test notifications';END IF;END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE stats jsonb:=public.get_support_ticket_stats();BEGIN
 IF(stats->>'avgResolutionHours')::numeric<>2 OR(stats->>'resolutionSamples')::int<>1 THEN RAISE EXCEPTION 'invalid or absent durations contaminated resolution metric';END IF;
END $$;
-- A delete-only grant can archive, but cannot be reused to edit content.
RESET ROLE;
INSERT INTO public.access_roles(role_key)VALUES('support_archivist');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT '10000000-0000-4000-8000-000000000003',id,'active'FROM public.access_roles WHERE role_key='support_archivist';
INSERT INTO public.access_interfaces(interface_key)VALUES('support.tickets');
INSERT INTO public.access_actions(action_key)VALUES('read'),('delete');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,true FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE r.role_key='support_archivist'AND i.interface_key='support.tickets';
SET LOCAL ROLE authenticated;
DO $$BEGIN
 IF public.can_intranet_action('support.tickets','update')THEN RAISE EXCEPTION 'archivist inherited unsaved edit right';END IF;
 PERFORM public.archive_support_ticket(current_setting('test.paged_ticket')::uuid,61);
 BEGIN PERFORM public.update_support_ticket(current_setting('test.paged_ticket')::uuid,62,'{"description":"Forbidden"}');RAISE EXCEPTION 'archive grant permitted content edit';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
UPDATE public.access_permissions SET allowed=false WHERE action_id=(SELECT id FROM public.access_actions WHERE action_key='read');
SET LOCAL ROLE authenticated;
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.support_tickets)OR EXISTS(SELECT 1 FROM public.support_ticket_notes)OR EXISTS(SELECT 1 FROM public.intranet_business_history WHERE table_name='support_tickets')THEN RAISE EXCEPTION 'other support pages bypassed explicit ticket read denial';END IF;
 BEGIN PERFORM public.get_support_ticket_stats();RAISE EXCEPTION 'revoked read right still exposed statistics';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.list_support_ticket_history(current_setting('test.paged_ticket')::uuid);RAISE EXCEPTION 'revoked read right still exposed history';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
-- A platform customer can open an owned case, but cannot forge a resolution or a staff attribution.
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT set_config('request.jwt.claim.sub','',true);
INSERT INTO public.profiles(id,app_origin,poles,test_account)VALUES('10000000-0000-4000-8000-000000000007','bos','{}',false);
INSERT INTO public.user_accounts(id,company_name,user_id)VALUES('20000000-0000-4000-8000-000000000003','Customer-owned account','10000000-0000-4000-8000-000000000007');
CREATE POLICY original_customer_own_case ON public.support_tickets FOR SELECT TO authenticated USING(created_by=auth.uid());
INSERT INTO public.user_roles(user_id,role)VALUES('10000000-0000-4000-8000-000000000007','manager');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000007',true);
INSERT INTO public.support_tickets(id,subject,description,user_account_id,created_by,created_at,test_account,revision)VALUES('30000000-0000-4000-8000-000000000007','Customer case','Own request','20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','1999-01-01',true,999);
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.support_tickets WHERE id='30000000-0000-4000-8000-000000000007'AND created_by=auth.uid()AND created_at>'2000-01-01'AND revision=1 AND NOT test_account)THEN RAISE EXCEPTION 'customer creation metadata not bound';END IF;
 BEGIN INSERT INTO public.support_tickets(subject,description,status,resolution,resolved_at)VALUES('Forged resolution','Invalid','resolved','Fake',now());RAISE EXCEPTION 'customer forged staff resolution';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 BEGIN INSERT INTO public.support_tickets(subject,description,user_account_id)VALUES('Wrong owner','Invalid','20000000-0000-4000-8000-000000000001');RAISE EXCEPTION 'customer linked another account';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.support_tickets SET status='resolved',resolution='Fake'WHERE id='30000000-0000-4000-8000-000000000007';RAISE EXCEPTION 'platform role updated support workflow';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.list_support_ticket_notes('30000000-0000-4000-8000-000000000007');RAISE EXCEPTION 'customer read internal discussion';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
