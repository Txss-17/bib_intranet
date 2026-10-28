\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text NOT NULL,email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.role',true),'') $$;
GRANT USAGE ON SCHEMA public,auth TO authenticated,service_role;
CREATE TYPE public.pole_id AS ENUM ('direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security');
CREATE TYPE public.employee_position AS ENUM ('rh_manager','ops_logistics_manager','finance_manager','ceo','product_engineering_manager','supplier_manager');
CREATE TYPE public.app_role AS ENUM ('admin','manager','executive','viewer','operator');
CREATE TABLE public.profiles(
 id uuid PRIMARY KEY REFERENCES auth.users(id),first_name text NOT NULL DEFAULT 'Prénom',last_name text NOT NULL DEFAULT 'Nom',email text,
 position public.employee_position,position_key text,poles public.pole_id[] NOT NULL DEFAULT '{}',seniority text NOT NULL DEFAULT 'mid',
 collaborator_type text NOT NULL DEFAULT 'internal',hr_status text DEFAULT 'active',manager_id uuid REFERENCES public.profiles(id),
 work_mode text DEFAULT 'office',subsidiary text DEFAULT 'BIB',test_account boolean NOT NULL DEFAULT false,staff boolean DEFAULT true,
 avatar_url text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.user_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id),role public.app_role);
CREATE FUNCTION public.has_role(p_uid uuid,p_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_uid AND role=p_role) $$;
CREATE FUNCTION public.has_pole(p_uid uuid,p_pole public.pole_id) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT coalesce((SELECT p_pole=ANY(poles) FROM public.profiles WHERE id=p_uid),false) $$;
CREATE FUNCTION public.is_intranet_staff(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT coalesce((SELECT staff FROM public.profiles WHERE id=p_uid),false) $$;
CREATE FUNCTION public.is_leadership(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT public.has_role(p_uid,'admin') OR public.has_role(p_uid,'executive') OR public.has_pole(p_uid,'direction') $$;
CREATE FUNCTION public.can_access_rh_profiles(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT public.has_pole(p_uid,'rh') OR public.is_leadership(p_uid) $$;
CREATE FUNCTION public.legacy_hr_publication_role(p_position text,p_poles text[]) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT 'legacy_hr'::text WHERE p_position='rh_manager' AND p_poles<@ARRAY['rh']::text[] $$;
CREATE TABLE public.access_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_key text UNIQUE,label text,business_pole text,department text,
 status text DEFAULT 'active',seniority text,poles text[] DEFAULT '{}',is_external boolean DEFAULT false,read_only boolean DEFAULT false,
 created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.access_interfaces(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),interface_key text UNIQUE,label text,status text DEFAULT 'active');
CREATE TABLE public.access_actions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),action_key text UNIQUE,label text);
CREATE TABLE public.access_permissions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_id uuid REFERENCES public.access_roles(id),interface_id uuid REFERENCES public.access_interfaces(id),
 action_id uuid REFERENCES public.access_actions(id),allowed boolean DEFAULT false,updated_at timestamptz DEFAULT now());
CREATE TABLE public.access_scopes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),scope_key text);
CREATE TABLE public.access_role_scopes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_id uuid REFERENCES public.access_roles(id),scope_id uuid REFERENCES public.access_scopes(id),scope_value text);
-- Current production FK identity is profiles.id, not a separate employees row.
-- role_id is nullable ON DELETE SET NULL, so orphan assignments must remain in the reviewed snapshot.
CREATE TABLE public.access_assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),employee_id uuid REFERENCES public.profiles(id),
 role_id uuid REFERENCES public.access_roles(id) ON DELETE SET NULL,scope_id uuid REFERENCES public.access_scopes(id),scope_value text,
 status text DEFAULT 'active',starts_at timestamptz DEFAULT now(),ends_at timestamptz,assigned_by uuid REFERENCES auth.users(id),
 created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.access_change_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid,employee_id uuid,role_id uuid,assignment_id uuid,
 change_type text,previous_value jsonb,new_value jsonb,reason text,created_at timestamptz DEFAULT now());
CREATE TABLE public.hr_employee_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text DEFAULT 'HR-TEST',
 first_name text NOT NULL,last_name text NOT NULL,personal_email text,work_email text,collaborator_type text DEFAULT 'internal',
 position public.employee_position,position_key text,primary_pole text,poles text[] NOT NULL DEFAULT '{}',seniority text NOT NULL DEFAULT 'junior',
 requested_role text NOT NULL DEFAULT 'viewer',contract_type text,start_date date,manager_id uuid REFERENCES public.profiles(id),
 status text DEFAULT 'draft',hr_validated_by uuid,hr_validated_at timestamptz,account_created_by uuid,account_created_at timestamptz,
 created_user_id uuid REFERENCES auth.users(id),rejection_reason text,notes text,created_by uuid REFERENCES auth.users(id),
 work_mode text,subsidiary text,attached_documents jsonb NOT NULL DEFAULT '[]',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.hr_employee_request_events(id uuid DEFAULT gen_random_uuid(),request_id uuid REFERENCES public.hr_employee_requests(id),
 actor_id uuid,actor_name text,action text,from_status text,to_status text,note text,created_at timestamptz DEFAULT now());
CREATE TABLE public.hr_account_audit_log(id uuid DEFAULT gen_random_uuid(),actor_id uuid,actor_name text,target_user_id uuid,target_email text,
 request_id uuid,action text,role_key text,details jsonb,created_at timestamptz DEFAULT now());
CREATE TABLE public.rh_employee_documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),employee_id uuid NOT NULL,name text NOT NULL CHECK(name<>'FAIL-DOCUMENT'),
 document_type text NOT NULL DEFAULT 'other',source text NOT NULL DEFAULT 'manual',document_url text,description text,document_date date,
 status text DEFAULT 'valid',created_by uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.rh_position_catalog(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),position_key text UNIQUE,label text,pole_id text,active boolean DEFAULT true);
CREATE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at:=clock_timestamp(); RETURN NEW; END $$;
CREATE TRIGGER hr_requests_updated BEFORE UPDATE ON public.hr_employee_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
ALTER TABLE public.hr_employee_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY legacy_hr_read ON public.hr_employee_requests FOR SELECT TO authenticated USING(true);
CREATE POLICY legacy_hr_manage ON public.hr_employee_requests FOR ALL TO authenticated USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hr_employee_requests,public.profiles TO authenticated;
GRANT SELECT ON public.rh_employee_documents,public.access_assignments,public.access_change_history,public.hr_account_audit_log,public.user_roles TO authenticated;
\ir ../../supabase/migrations/20261010100000_rh_onboarding_catalog_keys.sql
\ir ../../drizzle/migrations/0032_protect_profile_authorization_fields.sql
\ir ../../drizzle/migrations/0034_hr_employee_mutations.sql
\ir ../../drizzle/migrations/0035_hr_employee_mutation_compatibility.sql

INSERT INTO auth.users(id,email,email_confirmed_at) SELECT
 ('20000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'person'||n||'@bib.test',CASE WHEN n<>10 THEN now() ELSE NULL END FROM generate_series(1,11)n;
INSERT INTO public.profiles(id,email,position,position_key,poles,seniority,manager_id)
SELECT id,email,CASE WHEN right(id::text,1) IN ('1','2','8','9') THEN 'rh_manager'::public.employee_position ELSE 'ops_logistics_manager'::public.employee_position END,
 CASE WHEN right(id::text,1) IN ('1','2','8','9') THEN 'rh_manager' ELSE 'ops_logistics_manager' END,
 CASE WHEN right(id::text,1) IN ('1','2','8','9') THEN ARRAY['rh']::public.pole_id[] ELSE ARRAY['ops','data']::public.pole_id[] END,
 CASE WHEN right(id::text,1) IN ('1','8','9') THEN 'lead' ELSE 'mid' END,NULL FROM auth.users;
UPDATE public.profiles SET manager_id='20000000-0000-4000-8000-000000000001' WHERE id<>'20000000-0000-4000-8000-000000000001';
UPDATE public.profiles SET poles=ARRAY['direction']::public.pole_id[],position='ceo',position_key='ceo' WHERE id='20000000-0000-4000-8000-000000000007';
UPDATE public.profiles SET poles=ARRAY['rh']::public.pole_id[],position='rh_manager',position_key='rh_manager',seniority='executive' WHERE id='20000000-0000-4000-8000-000000000006';
UPDATE public.profiles SET poles=ARRAY['rh','ops']::public.pole_id[],position='rh_manager',position_key='rh_manager',seniority='senior' WHERE id='20000000-0000-4000-8000-000000000011';
INSERT INTO public.user_roles(user_id,role) SELECT id,CASE WHEN id='20000000-0000-4000-8000-000000000006' THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END FROM public.profiles;
INSERT INTO public.access_roles(id,role_key,label,business_pole,department,seniority,poles) VALUES
 ('30000000-0000-4000-8000-000000000001','hr_default','RH défaut','rh','rh','lead',ARRAY['rh']),
 ('30000000-0000-4000-8000-000000000002','old_ops','Ancien rôle Ops','ops','logistics','mid',ARRAY['ops']),
 ('30000000-0000-4000-8000-000000000003','secondary_data','Rôle secondaire Data','data','data','mid',ARRAY['data']),
 ('30000000-0000-4000-8000-000000000004','new_ops','Nouveau rôle Ops','ops','logistics','mid',ARRAY['ops']),
 ('30000000-0000-4000-8000-000000000005','legacy_hr','RH historique','rh','rh','lead',ARRAY['rh']),
 ('30000000-0000-4000-8000-000000000006','saved_hr','RH explicite','rh','rh','lead',ARRAY['rh']),
 ('30000000-0000-4000-8000-000000000007','ceo','Direction','direction','direction','executive',ARRAY['direction']);
INSERT INTO public.access_assignments(id,employee_id,role_id,status) VALUES
 ('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','active'),
 ('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','active'),
 ('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','active'),
 ('40000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000003','active'),
 ('40000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000003',NULL,'active'),
 ('40000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','active'),
 ('40000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000006','active');
INSERT INTO public.access_interfaces(interface_key,label) VALUES('rh.onboarding','Onboarding RH');
INSERT INTO public.access_actions(action_key,label) VALUES('read','Lire'),('create','Créer'),('validate','Valider'),('update','Modifier');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)
SELECT ar.id,ai.id,ac.id,ac.action_key='read' FROM public.access_roles ar CROSS JOIN public.access_interfaces ai CROSS JOIN public.access_actions ac
WHERE ar.role_key IN ('legacy_hr','saved_hr');
INSERT INTO public.rh_position_catalog(position_key,label,pole_id) VALUES
 ('rh_manager','Responsable RH','rh'),('ops_logistics_manager','Responsable Ops','ops'),('custom_ops_job','Poste catalogue spécifique','ops'),('ceo','Direction','direction');
INSERT INTO public.rh_employee_documents(employee_id,name,document_type,document_url,source,status) VALUES
 ('20000000-0000-4000-8000-000000000003','Ancienne charte','charter','https://bib.test/old','onboarding','active'),
 ('20000000-0000-4000-8000-000000000003','Document manuel','other','https://bib.test/manual','manual','active');
SELECT set_config('test.mutation.payload','{"position":"custom_ops_job","primary_pole":"ops","poles":["ops","data"],"seniority":"mid","requested_role":"new_ops","contract_type":"CDI","start_date":"'||current_date::text||'","manager_id":"20000000-0000-4000-8000-000000000001","work_mode":"hybrid","subsidiary":"BIB FR","notes":"Note RH privée","attached_documents":[{"name":"Nouvelle charte","document_type":"charter","document_url":"https://bib.test/new"}]}',true);
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
