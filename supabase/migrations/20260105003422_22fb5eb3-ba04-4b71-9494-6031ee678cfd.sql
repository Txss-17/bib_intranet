-- Add employee_position enum to profiles
CREATE TYPE public.employee_position AS ENUM (
  'supplier_manager',
  'user_success_manager',
  'ops_logistics_manager',
  'finance_manager',
  'audit_compliance_lead',
  'rse_packaging_manager',
  'tech_platform_manager',
  'ceo'
);

-- Add position column to profiles
ALTER TABLE public.profiles 
ADD COLUMN position employee_position;

-- Create user_accounts table for User Success & Risk module
CREATE TABLE public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  contact_name text,
  revenue numeric DEFAULT 0,
  stock_engaged numeric DEFAULT 0,
  subscription_status text DEFAULT 'active',
  payment_status text DEFAULT 'ok',
  risk_level text DEFAULT 'low',
  last_order_date timestamp with time zone,
  trustpilot_rating numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view user accounts"
ON public.user_accounts FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage user accounts"
ON public.user_accounts FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create orders table for Ops module
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  total_amount numeric,
  currency text DEFAULT 'EUR',
  shipping_address text,
  shipping_method text,
  tracking_number text,
  ordered_at timestamp with time zone DEFAULT now(),
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders"
ON public.orders FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create logistics_incidents table for Ops module
CREATE TABLE public.logistics_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  incident_type text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  reported_by uuid,
  assigned_to uuid,
  resolution_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.logistics_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view logistics incidents"
ON public.logistics_incidents FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage logistics incidents"
ON public.logistics_incidents FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create logistics_partners table for Ops module
CREATE TABLE public.logistics_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'carrier',
  contact_name text,
  contact_email text,
  contact_phone text,
  api_integrated boolean DEFAULT false,
  status text DEFAULT 'active',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.logistics_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view logistics partners"
ON public.logistics_partners FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage logistics partners"
ON public.logistics_partners FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create cashflows table for Finance module
CREATE TABLE public.cashflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'income' or 'expense'
  category text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  description text,
  reference text,
  transaction_date date NOT NULL,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cashflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cashflows"
ON public.cashflows FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage cashflows"
ON public.cashflows FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create field_audits table for Audit module
CREATE TABLE public.field_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type text NOT NULL,
  target_type text NOT NULL, -- 'supplier', 'ops', 'internal'
  target_id uuid,
  target_name text,
  auditor_id uuid,
  scheduled_date date,
  completed_date date,
  status text DEFAULT 'scheduled',
  findings text,
  recommendations text,
  score integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.field_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view field audits"
ON public.field_audits FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage field audits"
ON public.field_audits FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create packaging_submissions table for RSE module
CREATE TABLE public.packaging_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  packaging_type text NOT NULL,
  material text,
  recyclable boolean DEFAULT false,
  recycling_percentage integer DEFAULT 0,
  co2_footprint numeric,
  submitted_by uuid,
  validated_by uuid,
  status text DEFAULT 'pending',
  validation_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.packaging_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view packaging submissions"
ON public.packaging_submissions FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage packaging submissions"
ON public.packaging_submissions FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create support_tickets table for User Success module
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id uuid REFERENCES public.user_accounts(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  assigned_to uuid,
  resolution text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view support tickets"
ON public.support_tickets FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers and admins can manage support tickets"
ON public.support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create deployments table for Tech module
CREATE TABLE public.deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  environment text NOT NULL, -- 'production', 'staging', 'development'
  status text DEFAULT 'pending',
  deployed_by uuid,
  deployed_at timestamp with time zone,
  rollback_at timestamp with time zone,
  changelog text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deployments"
ON public.deployments FOR SELECT
USING (true);

CREATE POLICY "Managers and admins can manage deployments"
ON public.deployments FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Create bugs table for Tech module
CREATE TABLE public.bugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium',
  status text DEFAULT 'open',
  reported_by uuid,
  assigned_to uuid,
  environment text,
  steps_to_reproduce text,
  resolution text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bugs"
ON public.bugs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create bugs"
ON public.bugs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Managers and admins can manage bugs"
ON public.bugs FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Add triggers for updated_at
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_logistics_incidents_updated_at
  BEFORE UPDATE ON public.logistics_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_logistics_partners_updated_at
  BEFORE UPDATE ON public.logistics_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cashflows_updated_at
  BEFORE UPDATE ON public.cashflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_field_audits_updated_at
  BEFORE UPDATE ON public.field_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_packaging_submissions_updated_at
  BEFORE UPDATE ON public.packaging_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bugs_updated_at
  BEFORE UPDATE ON public.bugs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();