CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text NOT NULL,email_confirmed_at timestamptz,invited_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
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
 avatar_url text,app_origin text DEFAULT 'connect',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
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
\ir ../../drizzle/migrations/0037_hr_mutation_destination_validity.sql

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
