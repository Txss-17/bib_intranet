\set ON_ERROR_STOP on
\ir fixture.sql
ALTER TABLE public.profiles ADD COLUMN position_key text;
ALTER TABLE public.access_assignments ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ADD COLUMN assigned_by uuid;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,invited_at timestamptz,raw_user_meta_data jsonb DEFAULT '{}');
CREATE TABLE public.hr_employee_requests(id uuid PRIMARY KEY,request_kind text,status text,hr_validated_by uuid,created_user_id uuid,work_email text,personal_email text);
CREATE TABLE public.hr_onboarding_invitation_claims(nonce uuid,request_id uuid,email text,expires_at timestamptz,consumed_user_id uuid,consumed_at timestamptz);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_profile_read ON public.profiles FOR SELECT TO authenticated USING(true);
CREATE POLICY old_profile_update ON public.profiles FOR UPDATE TO authenticated USING(true)WITH CHECK(true);
CREATE POLICY old_profile_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK(true);
GRANT ALL ON public.profiles,public.user_roles TO authenticated;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_role_all ON public.user_roles FOR ALL TO authenticated USING(true)WITH CHECK(true);
CREATE TABLE public.cashflows(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),amount numeric,created_by uuid);
CREATE TABLE public.salaries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),amount numeric,test_account boolean DEFAULT false);
GRANT ALL ON public.cashflows,public.salaries TO authenticated;
ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_cashflows ON public.cashflows FOR ALL TO authenticated USING(true)WITH CHECK(true);
CREATE POLICY old_salaries ON public.salaries FOR ALL TO authenticated USING(true)WITH CHECK(true);
\ir ../../drizzle/migrations/0042_intranet_business_boundaries.sql
INSERT INTO public.profiles(id,email,position,poles,seniority,test_account)VALUES
 ('10000000-0000-4000-8000-000000000001','admin@bib.test','ceo','{direction,finance,rh,ops,supplier,marketplace,support,marketing,audit,compliance,rse,product,data,security}','executive',false),
 ('10000000-0000-4000-8000-000000000002','staff@bib.test','finance_manager','{finance}','senior',false),
 ('10000000-0000-4000-8000-000000000003','ceo.test@brand-in-a-box.space','ceo','{direction,finance,rh,ops,supplier,marketplace,support,marketing,audit,compliance,rse,product,data,security}','executive',true);
INSERT INTO public.user_roles(user_id,role)VALUES('10000000-0000-4000-8000-000000000001','admin');
INSERT INTO public.cashflows(amount)VALUES(100);
INSERT INTO public.salaries(amount,test_account)VALUES(200,false),(300,true);
\ir ../../drizzle/migrations/0044_intranet_identity_and_test_isolation.sql
INSERT INTO public.access_roles(role_key)VALUES('ceo');
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)VALUES('10000000-0000-4000-8000-000000000003','ceo.test@brand-in-a-box.space',now(),'{"test_account":true,"job_role":"ceo"}');
SELECT set_config('request.jwt.claim.role','service_role',true);
SELECT public.configure_intranet_test_identity('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','ceo');
SELECT public.configure_intranet_test_identity('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','ceo');
DO $$BEGIN IF(SELECT count(*)FROM public.access_assignments WHERE employee_id='10000000-0000-4000-8000-000000000003'AND status='active')<>1 THEN RAISE EXCEPTION 'test identity configuration duplicated role';END IF;END $$;
CREATE TRIGGER create_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)VALUES('10000000-0000-4000-8000-000000000004','verified@bib.test',now(),'{"app_origin":"connect"}');
DO $$BEGIN IF(SELECT app_origin FROM public.profiles WHERE id='10000000-0000-4000-8000-000000000004')<>'connect'THEN RAISE EXCEPTION 'new Auth origin lost';END IF;END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
DO $$BEGIN
 IF(SELECT count(*)FROM public.cashflows)<>1 THEN RAISE EXCEPTION 'real ledger inaccessible';END IF;
 IF(SELECT sum(amount)FROM public.salaries)<>200 THEN RAISE EXCEPTION 'test payroll leaked into real ledger';END IF;
 BEGIN UPDATE public.profiles SET email='other@bib.test'WHERE id=auth.uid();RAISE EXCEPTION 'delegation address can be forged';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.profiles SET app_origin='bos'WHERE id=auth.uid();RAISE EXCEPTION 'origin can be forged';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 UPDATE public.profiles SET first_name='Contact edit'WHERE id=auth.uid();
 IF(SELECT first_name FROM public.profiles WHERE id=auth.uid())<>'Contact edit'THEN RAISE EXCEPTION 'ordinary profile edit broken';END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$DECLARE r jsonb;BEGIN
 IF EXISTS(SELECT 1 FROM public.cashflows)THEN RAISE EXCEPTION 'unpartitioned real ledger leaked to sandbox';END IF;
 IF(SELECT sum(amount)FROM public.salaries)<>300 THEN RAISE EXCEPTION 'real payroll leaked into sandbox';END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE NOT test_account)THEN RAISE EXCEPTION 'real employee directory leaked';END IF;
 IF public.is_leadership(auth.uid())OR public.has_pole(auth.uid(),'rh')OR public.can_access_rh_profiles(auth.uid())OR public.can_hr_publication_action('read')THEN RAISE EXCEPTION 'sandbox can use real HR definer paths';END IF;
 IF NOT public.can_intranet_action('finance.transactions','create')THEN RAISE EXCEPTION 'sandbox module workflow disabled';END IF;
 r:=public.save_intranet_record(NULL,'finance.transactions',NULL,'20000000-0000-4000-8000-000000000099','Sandbox review','{"counterparty":"Supplier","reference":"TEST","amount":1,"currency":"EUR"}',NULL,NULL,'medium','pole');
 IF(r->>'test_account')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'sandbox record not partitioned';END IF;
 BEGIN INSERT INTO public.user_roles(user_id,role)VALUES(auth.uid(),'admin');RAISE EXCEPTION 'sandbox granted technical admin';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.profiles SET test_account=false WHERE id=auth.uid();RAISE EXCEPTION 'sandbox escaped mode';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.profiles(id,email)VALUES(gen_random_uuid(),'forged@bib.test');RAISE EXCEPTION 'direct profile insertion allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE test_account)THEN RAISE EXCEPTION 'real administrator cannot inspect sandbox identities';END IF;
 IF EXISTS(SELECT 1 FROM public.intranet_records)THEN RAISE EXCEPTION 'sandbox dossiers leaked to real admin environment';END IF;
END $$;
ROLLBACK;
