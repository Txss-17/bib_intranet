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
CREATE TYPE public.notification_type AS ENUM('info','warning','critical');
CREATE TABLE public.shops(id uuid PRIMARY KEY,commission_rate numeric);
CREATE TABLE public.orders(id uuid PRIMARY KEY,shop_id uuid REFERENCES public.shops(id),total_amount numeric,status text);
CREATE SCHEMA cron;
CREATE FUNCTION cron.schedule(text,text,text)RETURNS bigint LANGUAGE sql AS $$SELECT 1::bigint;$$;
\ir ../../drizzle/migrations/0007_finance_reconciliation_and_anomaly_deadlines.sql
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
\ir ../../drizzle/migrations/0048_quality_alert_workflow.sql
\ir ../../drizzle/migrations/0049_audit_mission_authority.sql
