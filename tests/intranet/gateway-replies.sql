\set ON_ERROR_STOP on
\ir fixture.sql
ALTER TABLE public.profiles ADD COLUMN position_key text;
ALTER TABLE public.access_assignments ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN assigned_by uuid;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,invited_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.hr_employee_requests(id uuid PRIMARY KEY,request_kind text,status text,hr_validated_by uuid,created_user_id uuid,work_email text,personal_email text);
CREATE TABLE public.hr_onboarding_invitation_claims(nonce uuid,request_id uuid,email text,expires_at timestamptz,consumed_user_id uuid,consumed_at timestamptz);
CREATE TABLE public.external_messages(id uuid PRIMARY KEY,sender_email text,subject text,routed_to_pole public.pole_id,gmail_thread_id text,gmail_message_id_header text,gmail_references text);
GRANT SELECT ON public.external_messages TO authenticated;
ALTER TABLE public.external_messages ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.enqueue_email(queue_name text,payload jsonb)RETURNS void LANGUAGE plpgsql AS $$BEGIN RETURN;END;$$;
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
\ir ../../drizzle/migrations/0043_intranet_gateway_outbox.sql
\ir ../../drizzle/migrations/0044_intranet_identity_and_test_isolation.sql
\ir ../../drizzle/migrations/0046_intranet_gateway_replies.sql
CREATE POLICY original_gateway_scope ON public.external_messages FOR SELECT TO authenticated USING(
 public.is_leadership(auth.uid())OR public.has_role(auth.uid(),'admin')OR public.has_role(auth.uid(),'manager')OR(routed_to_pole IS NOT NULL AND public.has_pole(auth.uid(),routed_to_pole::text)));
INSERT INTO public.profiles(id,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','ops_logistics_manager','{ops}','mid',false),
 ('10000000-0000-4000-8000-000000000002','finance_manager','{finance}','mid',false),
 ('10000000-0000-4000-8000-000000000003','ops_logistics_manager','{ops}','lead',true),
 ('10000000-0000-4000-8000-000000000004','finance_manager','{finance}','lead',false);
INSERT INTO public.user_roles(user_id,role)VALUES('10000000-0000-4000-8000-000000000003','manager'),('10000000-0000-4000-8000-000000000004','manager');
INSERT INTO public.external_messages(id,sender_email,subject,routed_to_pole,gmail_thread_id,gmail_message_id_header,gmail_references)VALUES
 ('20000000-0000-4000-8000-000000000001','Sender@EXAMPLE.test','Delivery request','ops','thread-123','<source@bib.test>','<prior@bib.test>'),
 ('20000000-0000-4000-8000-000000000002','unrouted@example.test','Unrouted',NULL,'thread-456','<unrouted@bib.test>',NULL),
 ('20000000-0000-4000-8000-000000000003','unsafe@example.test',E'Invalid\r\nBcc: other@example.test','ops',NULL,NULL,NULL);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$DECLARE r jsonb;key uuid:=gen_random_uuid();BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.external_messages WHERE id='20000000-0000-4000-8000-000000000001')THEN RAISE EXCEPTION 'own-pole inbox unavailable';END IF;
 r:=public.submit_intranet_outbox(key,'20000000-0000-4000-8000-000000000001',ARRAY['sender@example.test'],'Forged subject','Reply content');
 IF r->>'subject'<>'Re: Delivery request'OR r->>'gmail_thread_id'<>'thread-123'OR r->>'in_reply_to'<>'<source@bib.test>'OR r->>'gmail_references'<>'<prior@bib.test> <source@bib.test>'THEN RAISE EXCEPTION 'reply did not freeze authoritative thread metadata';END IF;
 IF public.submit_intranet_outbox(key,'20000000-0000-4000-8000-000000000001',ARRAY['sender@example.test'],'Other client subject','Reply content')->>'id'<>r->>'id'THEN RAISE EXCEPTION 'reply retry duplicated';END IF;
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000001',ARRAY['other@example.test'],'Reply','Content');RAISE EXCEPTION 'reply redirected to another recipient';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000002',ARRAY['unrouted@example.test'],'Reply','Content');RAISE EXCEPTION 'unrouted message bypassed inbox scope';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000003',ARRAY['unsafe@example.test'],'Reply','Content');RAISE EXCEPTION 'source subject injected a header';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$BEGIN
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000001',ARRAY['sender@example.test'],'Reply','Content');RAISE EXCEPTION 'cross-pole reply accepted';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM public.external_messages)THEN RAISE EXCEPTION 'real inbox visible in sandbox';END IF;
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000001',ARRAY['sender@example.test'],'Reply','Content');RAISE EXCEPTION 'sandbox reply leaked real source through definer';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.external_messages WHERE id='20000000-0000-4000-8000-000000000002')THEN RAISE EXCEPTION 'manager inbox scope lost';END IF;
 PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000002',ARRAY['unrouted@example.test'],'Reply','Content');
END $$;
RESET ROLE;
INSERT INTO public.access_roles(role_key)VALUES('reply_limited');
INSERT INTO public.access_assignments(employee_id,role_id,status)SELECT '10000000-0000-4000-8000-000000000001',id,'active'FROM public.access_roles WHERE role_key='reply_limited';
INSERT INTO public.access_interfaces(interface_key)VALUES('gateway.inbox');
INSERT INTO public.access_actions(action_key)VALUES('read');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)SELECT r.id,i.id,a.id,false FROM public.access_roles r,public.access_interfaces i,public.access_actions a WHERE r.role_key='reply_limited'AND i.interface_key='gateway.inbox';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$BEGIN
 IF NOT public.can_intranet_action('gateway.compose','create')THEN RAISE EXCEPTION 'compose test prerequisite missing';END IF;
 BEGIN PERFORM public.submit_intranet_outbox(gen_random_uuid(),'20000000-0000-4000-8000-000000000001',ARRAY['sender@example.test'],'Reply','Content');RAISE EXCEPTION 'revoked inbox right still allowed a reply';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
