\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO authenticated;
CREATE TABLE public.profiles(id uuid PRIMARY KEY,poles text[],seniority text,subsidiary text,position text DEFAULT 'rh_manager',first_name text,staff boolean DEFAULT true,admin boolean DEFAULT false,leadership boolean DEFAULT false);
CREATE FUNCTION public.is_intranet_staff(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT coalesce((SELECT staff FROM public.profiles WHERE id=p_uid),false) $$;
CREATE FUNCTION public.has_role(p_uid uuid,p_role text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT p_role='admin' AND coalesce((SELECT admin FROM public.profiles WHERE id=p_uid),false) $$;
CREATE FUNCTION public.is_leadership(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT coalesce((SELECT leadership FROM public.profiles WHERE id=p_uid),false) $$;
CREATE FUNCTION public.can_access_rh_profiles(p_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT public.has_role(p_uid,'admin') OR public.is_leadership(p_uid) OR coalesce((SELECT 'rh'=ANY(poles) FROM public.profiles WHERE id=p_uid),false) $$;
GRANT SELECT,UPDATE ON public.profiles TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legacy broad profile read" ON public.profiles FOR SELECT TO authenticated USING(true);
CREATE POLICY "legacy broad profile update" ON public.profiles FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE TABLE public.access_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_key text,status text DEFAULT 'active',read_only boolean DEFAULT false);
CREATE TABLE public.access_assignments(id uuid DEFAULT gen_random_uuid(),employee_id uuid,role_id uuid,status text DEFAULT 'active',starts_at timestamptz,ends_at timestamptz);
CREATE TABLE public.access_interfaces(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),interface_key text UNIQUE,label text,module text,pole text,path text,status text DEFAULT 'active');
CREATE TABLE public.access_actions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),action_key text UNIQUE,label text);
CREATE TABLE public.access_permissions(id uuid DEFAULT gen_random_uuid(),role_id uuid,interface_id uuid,action_id uuid,allowed boolean DEFAULT false);
-- Original publication columns and deliberately permissive legacy policies.
CREATE TABLE public.publications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,summary text,body text,type text NOT NULL,subtype text,version text NOT NULL DEFAULT 'v1.0',
  visibility_scope text NOT NULL DEFAULT 'all',visibility_targets text[] NOT NULL DEFAULT '{}',status text NOT NULL DEFAULT 'draft',
  publish_at timestamptz,available_at timestamptz,archive_at timestamptz,author_id uuid,author_pole text,related_kpi_id uuid,
  metadata jsonb DEFAULT '{}',app_origin text NOT NULL DEFAULT 'connect',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.publications TO authenticated;
CREATE POLICY "legacy read all" ON public.publications FOR SELECT TO authenticated USING (true);
CREATE POLICY "legacy manage all" ON public.publications FOR ALL TO authenticated USING (true) WITH CHECK(true);
CREATE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at:=now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_publications_updated BEFORE UPDATE ON public.publications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
\ir ../../drizzle/migrations/0031_hr_publications.sql
\ir ../../drizzle/migrations/0032_protect_profile_authorization_fields.sql
-- Emulate an already-applied earlier 0031 before the forward repair.
CREATE OR REPLACE FUNCTION public.legacy_hr_publication_role(p_position text,p_poles text[])
RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT CASE WHEN p_position='rh_manager' THEN 'directeur_rh' ELSE NULL END $$;
DROP POLICY IF EXISTS "HR released audience read" ON public.publications;
\ir ../../drizzle/migrations/0033_hr_publication_access_repair.sql
INSERT INTO public.profiles(id,poles,seniority,subsidiary,staff,admin,leadership) VALUES
('20000000-0000-4000-8000-000000000001',ARRAY['rh'],'lead','BIB',true,false,false),
('20000000-0000-4000-8000-000000000002',ARRAY['rh'],'mid','BIB',true,false,false),
('20000000-0000-4000-8000-000000000003',ARRAY['ops'],'junior','BIB',true,false,false),
('20000000-0000-4000-8000-000000000004',ARRAY['rh'],'junior','BIB',true,false,false),
('20000000-0000-4000-8000-000000000005',ARRAY['ops'],'executive','BIB',false,false,false),
('20000000-0000-4000-8000-000000000006',ARRAY['rh'],'lead','BIB',true,false,false),
('20000000-0000-4000-8000-000000000007',ARRAY['rh'],'lead','BIB',true,false,false),
('20000000-0000-4000-8000-000000000008',ARRAY['ops'],'junior','BIB',true,false,false),
('20000000-0000-4000-8000-000000000009',ARRAY['rh'],'lead','BIB',true,false,false);
INSERT INTO public.access_roles(id,role_key) VALUES
('30000000-0000-4000-8000-000000000001','saved_reader'),('30000000-0000-4000-8000-000000000002','revoked'),
('30000000-0000-4000-8000-000000000003','explicit_editor'),
('30000000-0000-4000-8000-000000000004','directeur_rh'),
('30000000-0000-4000-8000-000000000005','test_default_lead'),
('30000000-0000-4000-8000-000000000006','test_default_mid');
INSERT INTO public.access_assignments(employee_id,role_id,status,starts_at,ends_at) VALUES
('20000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','active',now()-interval '1 day',null),
('20000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000002','revoked',now()-interval '1 day',null),
('20000000-0000-4000-8000-000000000008','30000000-0000-4000-8000-000000000003','active',now()-interval '1 day',null),
('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000005','active',now()-interval '1 day',null),
('20000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000006','active',now()-interval '1 day',null);
INSERT INTO public.access_actions(action_key,label) VALUES ('read','Lire'),('create','Créer'),('update','Modifier'),('publish','Publier');
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)
SELECT '30000000-0000-4000-8000-000000000001',ai.id,ac.id,ac.action_key='read'
FROM public.access_interfaces ai CROSS JOIN public.access_actions ac WHERE ai.interface_key='rh.publications';
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)
SELECT '30000000-0000-4000-8000-000000000003',ai.id,ac.id,ac.action_key IN ('read','create','update')
FROM public.access_interfaces ai CROSS JOIN public.access_actions ac WHERE ai.interface_key='rh.publications';
INSERT INTO public.access_permissions(role_id,interface_id,action_id,allowed)
SELECT '30000000-0000-4000-8000-000000000004',ai.id,ac.id,ac.action_key='read'
FROM public.access_interfaces ai CROSS JOIN public.access_actions ac WHERE ai.interface_key='rh.publications';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE draft jsonb; replay jsonb; publication jsonb; token timestamptz;
BEGIN
  IF NOT public.can_hr_publication_action('publish') THEN RAISE EXCEPTION 'lead fallback denied'; END IF;
  draft:=public.save_hr_publication(null,null,' Test ',' Résumé ','','announcement','draft','all','{}','40000000-0000-4000-8000-000000000001');
  IF draft->>'title'<>'Test' OR draft->>'body' IS NOT NULL OR draft->>'type'<>'hr' THEN RAISE EXCEPTION 'normalization invalid'; END IF;
  replay:=public.save_hr_publication(null,null,' Test ',' Résumé ','','announcement','draft','all','{}','40000000-0000-4000-8000-000000000001');
  IF replay->>'id'<>draft->>'id' THEN RAISE EXCEPTION 'creation retry duplicated publication'; END IF;
  BEGIN
    PERFORM public.save_hr_publication(null,null,'Different','Résumé','','announcement','draft','all','{}','40000000-0000-4000-8000-000000000001');
    RAISE EXCEPTION 'different creation replay accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  token:=(draft->>'updated_at')::timestamptz;
  publication:=public.save_hr_publication((draft->>'id')::uuid,token,'Published','Résumé','Corps','announcement','published','pole',ARRAY['ops'],null);
  IF (publication->>'updated_at')::timestamptz<=token THEN RAISE EXCEPTION 'edit timestamp failed to advance after legacy trigger'; END IF;
  IF publication->>'publish_at' IS NULL OR publication->>'available_at' IS NULL THEN RAISE EXCEPTION 'published dates missing'; END IF;
  PERFORM set_config('test.publication.id',publication->>'id',true);
  PERFORM set_config('test.publication.updated_at',publication->>'updated_at',true);
  BEGIN
    PERFORM public.save_hr_publication((draft->>'id')::uuid,token,'Stale','Résumé','Corps','announcement','draft','all','{}',null);
    RAISE EXCEPTION 'stale editor overwrote publication';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  BEGIN
    PERFORM public.save_hr_publication(null,null,'Blank',null,U&'\00A0\2000','announcement','published','all','{}','40000000-0000-4000-8000-000000000002');
    RAISE EXCEPTION 'unicode whitespace published';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.save_hr_publication(null,null,'Invalid',null,'Body','announcement','draft','pole',ARRAY['unknown'],'40000000-0000-4000-8000-000000000002');
    RAISE EXCEPTION 'invalid audience accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    INSERT INTO public.publications(title,type,status) VALUES('Bypass','hr','published');
    RAISE EXCEPTION 'direct HR insert bypassed RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
DO $$
DECLARE saved jsonb;
BEGIN
  IF NOT public.can_hr_publication_action('create') OR public.can_hr_publication_action('publish') THEN RAISE EXCEPTION 'mid seniority fallback invalid'; END IF;
  saved:=public.save_hr_publication(null,null,'Mid draft',null,null,'information','draft','all','{}','40000000-0000-4000-8000-000000000003');
  BEGIN
    PERFORM public.save_hr_publication((saved->>'id')::uuid,(saved->>'updated_at')::timestamptz,'Mid draft',null,'Body','information','published','all','{}',null);
    RAISE EXCEPTION 'draft writer published';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.save_hr_publication(current_setting('test.publication.id')::uuid,current_setting('test.publication.updated_at')::timestamptz,'Published',null,'Body','information','draft','all','{}',null);
    RAISE EXCEPTION 'update-only writer unpublished';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000006',true);
DO $$
BEGIN
  IF NOT public.can_hr_publication_action('read') OR public.can_hr_publication_action('create') OR public.can_hr_publication_action('publish') THEN RAISE EXCEPTION 'saved deny did not override lead fallback'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000009',true);
DO $$ BEGIN IF NOT public.can_hr_publication_action('read') OR public.can_hr_publication_action('create') OR public.can_hr_publication_action('publish') THEN RAISE EXCEPTION 'legacy inferred-role saved denial bypassed'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000007',true);
DO $$ BEGIN IF public.can_hr_publication_action('read') THEN RAISE EXCEPTION 'revoked role fell back to HR lead'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000008',true);
DO $$ BEGIN IF NOT public.can_hr_publication_action('create') OR public.can_hr_publication_action('publish') THEN RAISE EXCEPTION 'explicit saved editor permissions ignored'; END IF; END $$;
RESET ROLE;
INSERT INTO public.publications(title,body,type,status,visibility_scope,visibility_targets,publish_at,available_at,archive_at) VALUES
('Visible all','Body','hr','published','all','{}',now()-interval '1 day',now()-interval '1 day',null),
('Hidden other pole','Body','hr','published','pole',ARRAY['finance'],now()-interval '1 day',null,null),
('Hidden draft','Body','hr','draft','all','{}',null,null,null),
('Hidden archived','Body','hr','archived','all','{}',now()-interval '1 day',null,now()),
('Hidden scheduled','Body','hr','scheduled','all','{}',now()+interval '1 day',null,null),
('Hidden future','Body','hr','published','all','{}',now()+interval '1 day',null,null),
('Hidden unavailable','Body','hr','published','all','{}',now()-interval '1 day',now()+interval '1 day',null),
('Hidden expired','Body','hr','published','all','{}',now()-interval '1 day',null,now()-interval '1 hour'),
('Visible own user','Body','hr','published','user',ARRAY['20000000-0000-4000-8000-000000000003'],now()-interval '1 day',null,null),
('Hidden other user','Body','hr','published','user',ARRAY['20000000-0000-4000-8000-000000000004'],now()-interval '1 day',null,null),
('Unchanged news draft','Body','news','draft','all','{}',null,null,null);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
DO $$
DECLARE affected integer;
BEGIN
  IF EXISTS(SELECT 1 FROM public.publications WHERE title LIKE 'Hidden%') THEN RAISE EXCEPTION 'unreleased or unrelated HR content leaked'; END IF;
  IF (SELECT count(*) FROM public.publications WHERE title LIKE 'Visible%')<>2 THEN RAISE EXCEPTION 'released audience inaccessible'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.publications WHERE title='Unchanged news draft') THEN RAISE EXCEPTION 'other publication type changed'; END IF;
  BEGIN PERFORM public.list_hr_publications(); RAISE EXCEPTION 'recipient can list HR drafts'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.publications SET status='draft' WHERE type='hr';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'direct client changed HR data'; END IF;
  BEGIN
    UPDATE public.publications SET type='hr' WHERE title='Unchanged news draft';
    RAISE EXCEPTION 'nonHR to HR bypass accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  INSERT INTO public.publications(title,type,status) VALUES('Normal news write','news','draft');
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000005',true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM public.publications WHERE type='hr') THEN RAISE EXCEPTION 'nonstaff recipient saw HR content'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE archived jsonb; drafted jsonb;
BEGIN
  archived:=public.save_hr_publication(current_setting('test.publication.id')::uuid,current_setting('test.publication.updated_at')::timestamptz,
    'Archived',null,'Body','announcement','archived','pole',ARRAY['ops'],null);
  IF archived->>'archive_at' IS NULL THEN RAISE EXCEPTION 'archive timestamp missing'; END IF;
  drafted:=public.save_hr_publication((archived->>'id')::uuid,(archived->>'updated_at')::timestamptz,
    'Redrafted',null,'Body','announcement','draft','all','{}',null);
  IF drafted->>'publish_at' IS NOT NULL OR drafted->>'available_at' IS NOT NULL OR drafted->>'archive_at' IS NOT NULL THEN RAISE EXCEPTION 'redraft retained release schedule'; END IF;
END;
$$;
-- Role inputs stay server-owned even when legacy profile RLS permits arbitrary UPDATE.
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET position='rh_manager',poles=ARRAY['rh'],seniority='lead' WHERE id=auth.uid();
    RAISE EXCEPTION 'self promotion allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF public.can_hr_publication_action('publish') OR public.can_hr_publication_action('read') THEN
    RAISE EXCEPTION 'profile editing elevated publication access';
  END IF;
  UPDATE public.profiles SET first_name='Prénom' WHERE id=auth.uid();
  IF (SELECT first_name FROM public.profiles WHERE id=auth.uid())<>'Prénom' THEN RAISE EXCEPTION 'ordinary profile edit blocked'; END IF;
END;
$$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
DO $$
BEGIN
  BEGIN
    UPDATE public.profiles SET seniority='executive' WHERE id=auth.uid();
    RAISE EXCEPTION 'HR self promotion allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  UPDATE public.profiles SET seniority='senior' WHERE id='20000000-0000-4000-8000-000000000002';
  IF (SELECT seniority FROM public.profiles WHERE id='20000000-0000-4000-8000-000000000002')<>'senior' THEN
    RAISE EXCEPTION 'authorized HR colleague management blocked';
  END IF;
END;
$$;
RESET ROLE;
INSERT INTO public.access_roles(id,role_key) VALUES
('30000000-0000-4000-8000-000000000007','publication_recipient');
INSERT INTO public.access_assignments(employee_id,role_id,status,starts_at,ends_at) VALUES
('20000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000007','active',now()-interval '1 day',null);
INSERT INTO public.publications(title,body,type,status,visibility_scope,visibility_targets,publish_at) VALUES
('Visible own subsidiary','Body','hr','published','subsidiary',ARRAY['BIB'],now()-interval '1 day'),
('Hidden other subsidiary','Body','hr','published','subsidiary',ARRAY['Other company'],now()-interval '1 day'),
('Visible own role','Body','hr','published','role',ARRAY['publication_recipient'],now()-interval '1 day'),
('Hidden other role','Body','hr','published','role',ARRAY['different_role'],now()-interval '1 day');
-- Also exercise the legacy scoped SELECT policy, not only a permissive adversarial fixture.
DROP POLICY "legacy read all" ON public.publications;
DROP POLICY "legacy manage all" ON public.publications;
CREATE POLICY "legacy scoped read" ON public.publications FOR SELECT TO authenticated
USING(author_id=auth.uid() OR visibility_scope='all'
  OR visibility_targets && coalesce((SELECT poles FROM public.profiles WHERE id=auth.uid()),'{}'::text[]));
CREATE POLICY "legacy scoped manage" ON public.publications FOR ALL TO authenticated
USING(author_id=auth.uid() OR public.can_access_rh_profiles(auth.uid()))
WITH CHECK(author_id=auth.uid() OR public.can_access_rh_profiles(auth.uid()));
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
DO $$
BEGIN
  IF public.can_hr_publication_action('read') THEN RAISE EXCEPTION 'ordinary recipient became an HR manager'; END IF;
  IF (SELECT count(*) FROM public.publications WHERE title IN ('Visible own user','Visible own subsidiary','Visible own role'))<>3 THEN
    RAISE EXCEPTION 'legitimate audience blocked by legacy SELECT policy';
  END IF;
  IF EXISTS(SELECT 1 FROM public.publications WHERE title LIKE 'Hidden%') THEN
    RAISE EXCEPTION 'legacy scoped policy leaked unreleased HR content';
  END IF;
END;
$$;
RESET ROLE;
DO $$ BEGIN
  IF has_function_privilege('anon','public.save_hr_publication(uuid,timestamptz,text,text,text,text,text,text,text[],uuid)','EXECUTE') THEN RAISE EXCEPTION 'anonymous save granted'; END IF;
END $$;
ROLLBACK;
