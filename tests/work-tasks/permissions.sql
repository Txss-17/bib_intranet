\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT 'authenticated'::text $$;
GRANT USAGE ON SCHEMA public,auth TO authenticated,service_role;
CREATE TYPE public.pole_id AS ENUM ('ops','finance','direction','rh');
CREATE TABLE public.profiles(id uuid PRIMARY KEY,position text,poles public.pole_id[],seniority text,test_account boolean DEFAULT false,hr_status text DEFAULT 'active',app_origin text DEFAULT 'connect');
CREATE TABLE public.user_roles(user_id uuid,role text);
CREATE FUNCTION public.has_role(u uuid,r text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=u AND role=r) $$;
CREATE FUNCTION public.is_leadership(u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT public.has_role(u,'admin') OR EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND 'direction'=ANY(poles)) $$;
CREATE FUNCTION public.is_intranet_staff(u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND cardinality(poles)>0 AND hr_status='active') $$;
CREATE TABLE public.access_roles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),role_key text,status text DEFAULT 'active',read_only boolean DEFAULT false);
CREATE TABLE public.access_assignments(employee_id uuid,role_id uuid,status text,starts_at timestamptz,ends_at timestamptz);
CREATE TABLE public.access_interfaces(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),interface_key text,status text DEFAULT 'active');
CREATE TABLE public.access_actions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),action_key text);
CREATE TABLE public.access_permissions(role_id uuid,interface_id uuid,action_id uuid,allowed boolean);
-- Load the real legacy role resolver without replacing it with a permissive stub.
CREATE OR REPLACE FUNCTION public.legacy_hr_publication_role(p_position text,p_poles text[])
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT item->>'id'
  FROM jsonb_array_elements($roles$[{"id":"ceo","position":"ceo","poles":["direction","finance","ops","supplier","marketplace","support","marketing","rh","audit","compliance","rse","product","data","security"]},{"id":"coo","position":"ops_logistics_manager","poles":["direction","ops","supplier","marketplace","support"]},{"id":"cto","position":"product_engineering_manager","poles":["direction","product","data","security"]},{"id":"cfo","position":"finance_manager","poles":["direction","finance","compliance"]},{"id":"cdo","position":"data_bi_manager","poles":["direction","data","product"]},{"id":"directeur_rh","position":"rh_manager","poles":["direction","rh"]},{"id":"directeur_qualite","position":"audit_compliance_lead","poles":["direction","audit","compliance","supplier"]},{"id":"directeur_marketplace","position":"customer_success_manager","poles":["direction","marketplace","support","marketing"]},{"id":"comptable","position":"finance_manager","poles":["finance"]},{"id":"controleur_gestion","position":"finance_manager","poles":["finance","data"]},{"id":"analyste_financier","position":"finance_manager","poles":["finance","data"]},{"id":"tresorier","position":"finance_manager","poles":["finance"]},{"id":"gestionnaire_facturation","position":"finance_manager","poles":["finance"]},{"id":"gestionnaire_remboursements","position":"finance_manager","poles":["finance","support","marketplace"]},{"id":"gestionnaire_paiements","position":"finance_manager","poles":["finance"]},{"id":"responsable_rh","position":"rh_manager","poles":["rh"]},{"id":"charge_recrutement","position":"rh_manager","poles":["rh"]},{"id":"gestionnaire_paie","position":"rh_manager","poles":["rh","finance"]},{"id":"gestionnaire_admin_rh","position":"rh_manager","poles":["rh"]},{"id":"responsable_formation","position":"rh_manager","poles":["rh"]},{"id":"responsable_fournisseurs","position":"supplier_manager","poles":["supplier"]},{"id":"gestionnaire_fournisseurs","position":"supplier_manager","poles":["supplier","ops"]},{"id":"responsable_catalogue","position":"supplier_manager","poles":["supplier","product"]},{"id":"gestionnaire_catalogue","position":"supplier_manager","poles":["supplier"]},{"id":"conformite_fournisseurs","position":"audit_compliance_lead","poles":["supplier","compliance","audit"]},{"id":"acheteur","position":"supplier_manager","poles":["supplier","ops"]},{"id":"responsable_marketplace","position":"customer_success_manager","poles":["marketplace","ops","marketing"]},{"id":"gestionnaire_boutiques","position":"customer_success_manager","poles":["marketplace"]},{"id":"gestionnaire_vendeurs","position":"customer_success_manager","poles":["marketplace","supplier"]},{"id":"gestionnaire_commandes","position":"ops_logistics_manager","poles":["marketplace","ops"]},{"id":"gestionnaire_litiges","position":"audit_compliance_lead","poles":["marketplace","support","compliance"]},{"id":"gestionnaire_avis","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"responsable_qualite","position":"audit_compliance_lead","poles":["audit","compliance","supplier"]},{"id":"auditeur_qualite","position":"audit_compliance_lead","poles":["audit"]},{"id":"auditeur_terrain","position":"audit_compliance_lead","poles":["audit","supplier","ops"]},{"id":"responsable_conformite","position":"audit_compliance_lead","poles":["compliance","audit"]},{"id":"gestionnaire_nc","position":"audit_compliance_lead","poles":["audit"]},{"id":"gestionnaire_certifications","position":"audit_compliance_lead","poles":["audit","supplier"]},{"id":"responsable_logistique","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_transport","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_entrepots","position":"ops_logistics_manager","poles":["ops"]},{"id":"gestionnaire_stocks","position":"ops_logistics_manager","poles":["ops","supplier"]},{"id":"coordinateur_expeditions","position":"ops_logistics_manager","poles":["ops"]},{"id":"responsable_support","position":"customer_success_manager","poles":["support","marketplace"]},{"id":"technicien_support","position":"customer_success_manager","poles":["support","product"]},{"id":"conseiller_client","position":"customer_success_manager","poles":["support"]},{"id":"gestionnaire_tickets","position":"customer_success_manager","poles":["support"]},{"id":"community_support","position":"customer_success_manager","poles":["support","marketing"]},{"id":"juriste","position":"audit_compliance_lead","poles":["compliance"]},{"id":"conformite_juridique","position":"audit_compliance_lead","poles":["compliance","audit"]},{"id":"gestionnaire_contrats","position":"audit_compliance_lead","poles":["compliance"]},{"id":"gestionnaire_docusign","position":"audit_compliance_lead","poles":["compliance","product"]},{"id":"responsable_marketing","position":"marketing_communication_manager","poles":["marketing"]},{"id":"growth_manager","position":"marketing_communication_manager","poles":["marketing","data"]},{"id":"content_manager","position":"marketing_communication_manager","poles":["marketing"]},{"id":"seo_manager","position":"marketing_communication_manager","poles":["marketing","data"]},{"id":"social_media_manager","position":"marketing_communication_manager","poles":["marketing"]},{"id":"crm_manager","position":"marketing_communication_manager","poles":["marketing","marketplace","support"]},{"id":"responsable_commercial","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"business_developer","position":"customer_success_manager","poles":["marketplace","marketing"]},{"id":"account_manager","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"customer_success_manager","position":"customer_success_manager","poles":["support","marketplace"]},{"id":"responsable_tech","position":"product_engineering_manager","poles":["product","data","security"]},{"id":"product_manager","position":"product_engineering_manager","poles":["product","data","marketing"]},{"id":"product_owner","position":"product_engineering_manager","poles":["product","data"]},{"id":"scrum_master","position":"product_engineering_manager","poles":["product"]},{"id":"dev_frontend","position":"product_engineering_manager","poles":["product"]},{"id":"dev_backend","position":"product_engineering_manager","poles":["product"]},{"id":"dev_fullstack","position":"product_engineering_manager","poles":["product"]},{"id":"dev_mobile","position":"product_engineering_manager","poles":["product"]},{"id":"ux_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"ui_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"product_designer","position":"product_engineering_manager","poles":["product","marketing"]},{"id":"qa_engineer","position":"product_engineering_manager","poles":["product","audit"]},{"id":"testeur_logiciel","position":"product_engineering_manager","poles":["product"]},{"id":"devops_engineer","position":"product_engineering_manager","poles":["product","security"]},{"id":"sre","position":"product_engineering_manager","poles":["product","security"]},{"id":"admin_systeme","position":"product_engineering_manager","poles":["security"]},{"id":"dba","position":"product_engineering_manager","poles":["product","data","security"]},{"id":"architecte_logiciel","position":"product_engineering_manager","poles":["product","security"]},{"id":"architecte_cloud","position":"product_engineering_manager","poles":["product","security"]},{"id":"ingenieur_cybersecurite","position":"product_engineering_manager","poles":["security","compliance","product"]},{"id":"responsable_data","position":"data_bi_manager","poles":["data","product"]},{"id":"data_bi_manager","position":"data_bi_manager","poles":["data"]},{"id":"business_analyst","position":"data_bi_manager","poles":["data","finance","marketplace"]},{"id":"data_engineer","position":"data_bi_manager","poles":["data","product"]},{"id":"analytics_engineer","position":"data_bi_manager","poles":["data","product"]},{"id":"data_scientist","position":"data_bi_manager","poles":["data"]},{"id":"bi_developer","position":"data_bi_manager","poles":["data"]},{"id":"data_steward","position":"data_bi_manager","poles":["data","compliance"]},{"id":"data_quality_manager","position":"data_bi_manager","poles":["data","audit"]},{"id":"rssi","position":"security_it_manager","poles":["security","product","compliance"]},{"id":"analyste_cyber","position":"security_it_manager","poles":["security"]},{"id":"gestionnaire_iam","position":"product_engineering_manager","poles":["security"]},{"id":"analyste_rgpd","position":"audit_compliance_lead","poles":["compliance","security"]},{"id":"office_manager","position":"rh_manager","poles":["rh"]},{"id":"assistant_administratif","position":"rh_manager","poles":["rh"]},{"id":"responsable_communication","position":"marketing_communication_manager","poles":["marketing"]},{"id":"relations_presse","position":"marketing_communication_manager","poles":["marketing"]},{"id":"responsable_innovation","position":"product_engineering_manager","poles":["product","supplier","data"]},{"id":"chef_projet_innovation","position":"product_engineering_manager","poles":["product"]},{"id":"ext_fournisseur","position":"supplier_manager","poles":["supplier"]},{"id":"ext_vendeur","position":"customer_success_manager","poles":["marketplace"]},{"id":"ext_client_entreprise","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"ext_client_particulier","position":"customer_success_manager","poles":["marketplace","support"]},{"id":"ext_auditeur","position":"audit_compliance_lead","poles":["audit"]},{"id":"ext_prestataire","position":"ops_logistics_manager","poles":["ops"]},{"id":"ext_investisseur","position":"ceo","poles":["direction","finance","data"]},{"id":"svc_api","position":"product_engineering_manager","poles":["product","security"]},{"id":"svc_webhook","position":"product_engineering_manager","poles":["product","security"]},{"id":"svc_robot","position":"product_engineering_manager","poles":["product","ops"]},{"id":"svc_stripe","position":"finance_manager","poles":["finance","product","security"]},{"id":"svc_google","position":"product_engineering_manager","poles":["product","security","rh"]},{"id":"svc_supabase","position":"product_engineering_manager","poles":["product","data","security"]}]$roles$::jsonb) WITH ORDINALITY AS roles(item,ordinal)
  WHERE item->>'position'=p_position
    AND cardinality(coalesce(p_poles,'{}'::text[]))>0
    AND coalesce(p_poles,'{}'::text[])<@ARRAY(SELECT jsonb_array_elements_text(item->'poles'))
  ORDER BY ordinal
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.legacy_hr_publication_role(text,text[]) FROM PUBLIC,anon,authenticated;


CREATE TABLE public.work_tasks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,description text,pole text,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','review','completed')),
 priority text NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
 created_by uuid REFERENCES public.profiles(id),assignee_id uuid REFERENCES public.profiles(id),due_date date,completed_at timestamptz,created_at timestamptz DEFAULT now());
ALTER TABLE public.work_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY legacy_all ON public.work_tasks FOR ALL TO authenticated USING(true) WITH CHECK(true);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.work_tasks TO authenticated;
CREATE TABLE public.notifications(id uuid DEFAULT gen_random_uuid(),user_id uuid,title text,message text,type text,action_url text,metadata jsonb);
\ir ../../drizzle/migrations/0038_work_task_collaboration.sql
INSERT INTO public.profiles(id,position,poles,seniority,test_account) VALUES
 ('10000000-0000-4000-8000-000000000001','ops_logistics_manager','{ops}','senior',false),
 ('10000000-0000-4000-8000-000000000002','finance_manager','{finance}','mid',false),
 ('10000000-0000-4000-8000-000000000003','ops_logistics_manager','{ops}','junior',false),
 ('10000000-0000-4000-8000-000000000004','ops_logistics_manager','{ops}','senior',true);
INSERT INTO public.work_tasks(id,title,created_by,task_poles,test_account) VALUES
 ('20000000-0000-4000-8000-000000000001','Ops task','10000000-0000-4000-8000-000000000001','{ops}',false),
 ('20000000-0000-4000-8000-000000000002','Finance task','10000000-0000-4000-8000-000000000002','{finance}',false),
 ('20000000-0000-4000-8000-000000000003','General task','10000000-0000-4000-8000-000000000001','{}',false),
 ('20000000-0000-4000-8000-000000000004','Test task','10000000-0000-4000-8000-000000000004','{ops}',true),
 ('20000000-0000-4000-8000-000000000005','Shared task','10000000-0000-4000-8000-000000000002','{ops,finance}',false);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$
DECLARE total integer; stamp timestamptz;
BEGIN
 IF public.can_work_task_action(NULL) THEN RAISE EXCEPTION 'null action allowed'; END IF;
 BEGIN UPDATE public.work_tasks SET status='unknown' WHERE id='20000000-0000-4000-8000-000000000001'; RAISE EXCEPTION 'unknown status accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 IF NOT public.can_work_task_action('update') THEN RAISE EXCEPTION 'senior cannot update'; END IF;
 SELECT count(*) INTO total FROM public.work_tasks;
 IF total<>3 THEN RAISE EXCEPTION 'scope or test isolation leak: %',total; END IF;
 UPDATE public.work_tasks SET assignee_id='10000000-0000-4000-8000-000000000003' WHERE id='20000000-0000-4000-8000-000000000001';
 UPDATE public.work_tasks SET status='completed' WHERE id='20000000-0000-4000-8000-000000000001';
 IF NOT EXISTS(SELECT 1 FROM public.work_tasks WHERE completed_at IS NOT NULL AND status='completed') THEN RAISE EXCEPTION 'completion timestamp absent'; END IF;
 UPDATE public.work_tasks SET status='in_progress' WHERE id='20000000-0000-4000-8000-000000000001';
 IF EXISTS(SELECT 1 FROM public.work_tasks WHERE completed_at IS NOT NULL) THEN RAISE EXCEPTION 'reopening keeps completion'; END IF;
 SELECT updated_at INTO stamp FROM public.work_tasks WHERE id='20000000-0000-4000-8000-000000000001';
 UPDATE public.work_tasks SET title='Changed' WHERE id='20000000-0000-4000-8000-000000000001';
 UPDATE public.work_tasks SET title='Lost update' WHERE id='20000000-0000-4000-8000-000000000001' AND updated_at=stamp;
 IF FOUND THEN RAISE EXCEPTION 'stale revision accepted'; END IF;
 INSERT INTO public.work_task_comments(task_id,body) VALUES('20000000-0000-4000-8000-000000000001','Progress');
 BEGIN INSERT INTO public.work_task_comments(task_id,author_id,body) VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','Impersonation'); RAISE EXCEPTION 'forged author accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.work_task_comments(task_id,body) VALUES('20000000-0000-4000-8000-000000000002','Leak'); RAISE EXCEPTION 'foreign comment accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.work_task_history SET action='tampered'; RAISE EXCEPTION 'history mutable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN UPDATE public.work_tasks SET created_by='10000000-0000-4000-8000-000000000002' WHERE id='20000000-0000-4000-8000-000000000001'; RAISE EXCEPTION 'creator mutable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN INSERT INTO public.work_tasks(title,created_by,task_poles) VALUES('Foreign','10000000-0000-4000-8000-000000000001','{finance}'); RAISE EXCEPTION 'foreign scope created'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 DELETE FROM public.work_tasks WHERE id='20000000-0000-4000-8000-000000000001';
 IF FOUND THEN RAISE EXCEPTION 'physical deletion allowed'; END IF;
 UPDATE public.work_tasks SET archived_at=now() WHERE id='20000000-0000-4000-8000-000000000001';
 IF NOT EXISTS(SELECT 1 FROM public.work_task_history WHERE action='archived') THEN RAISE EXCEPTION 'archive not logged'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
DO $$ BEGIN
 IF public.can_work_task_action('create') OR public.can_work_task_action('update') THEN RAISE EXCEPTION 'junior can write'; END IF;
 BEGIN INSERT INTO public.work_tasks(title,created_by) VALUES('Denied','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'junior inserted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
DO $$ BEGIN IF (SELECT count(*) FROM public.notifications)<>1 THEN RAISE EXCEPTION 'assignment notification absent or duplicated'; END IF; END $$;
INSERT INTO public.access_roles(role_key) VALUES('restricted');
INSERT INTO public.access_assignments(employee_id,role_id,status) SELECT '10000000-0000-4000-8000-000000000001',id,'active' FROM public.access_roles WHERE role_key='restricted';
INSERT INTO public.access_interfaces(interface_key) VALUES('work.tasks');
INSERT INTO public.access_actions(action_key) VALUES('read'),('update');
INSERT INTO public.access_permissions SELECT r.id,i.id,a.id,a.action_key='read' FROM public.access_roles r,public.access_interfaces i,public.access_actions a;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
 IF NOT public.can_work_task_action('read') OR public.can_work_task_action('update') OR public.can_work_task_action('create') THEN RAISE EXCEPTION 'saved restrictions ignored'; END IF;
 UPDATE public.work_tasks SET title='Forbidden' WHERE id='20000000-0000-4000-8000-000000000001';
 IF FOUND THEN RAISE EXCEPTION 'saved denial bypassed'; END IF;
END $$;
RESET ROLE;
UPDATE public.access_assignments SET status='revoked';
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF public.can_work_task_action('read') THEN RAISE EXCEPTION 'revoked assignment retained access'; END IF; END $$;
ROLLBACK;
