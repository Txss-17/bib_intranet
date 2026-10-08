
CREATE TABLE public.access_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  department TEXT,
  business_pole TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_roles TO authenticated;
GRANT ALL ON public.access_roles TO service_role;
ALTER TABLE public.access_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read access_roles" ON public.access_roles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  scope_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_scopes TO authenticated;
GRANT ALL ON public.access_scopes TO service_role;
ALTER TABLE public.access_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read access_scopes" ON public.access_scopes FOR SELECT TO authenticated USING (true);

CREATE TABLE public.access_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  role_id UUID REFERENCES public.access_roles(id) ON DELETE SET NULL,
  scope_id UUID REFERENCES public.access_scopes(id) ON DELETE SET NULL,
  scope_value TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.access_assignments TO authenticated;
GRANT ALL ON public.access_assignments TO service_role;
ALTER TABLE public.access_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read access_assignments" ON public.access_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and RH manage access_assignments" ON public.access_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_pole(auth.uid(), 'rh') OR public.has_pole(auth.uid(), 'direction')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_pole(auth.uid(), 'rh') OR public.has_pole(auth.uid(), 'direction'));

CREATE TABLE public.access_portfolio_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_type_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  business_pole TEXT,
  source_table TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.access_portfolio_types TO authenticated;
GRANT ALL ON public.access_portfolio_types TO service_role;
ALTER TABLE public.access_portfolio_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read access_portfolio_types" ON public.access_portfolio_types FOR SELECT TO authenticated USING (true);

CREATE TABLE public.access_business_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_type_id UUID NOT NULL REFERENCES public.access_portfolio_types(id) ON DELETE CASCADE,
  source_id UUID NOT NULL,
  label_snapshot TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (portfolio_type_id, source_id)
);
GRANT SELECT, INSERT, UPDATE ON public.access_business_portfolios TO authenticated;
GRANT ALL ON public.access_business_portfolios TO service_role;
ALTER TABLE public.access_business_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read access_business_portfolios" ON public.access_business_portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers manage access_business_portfolios" ON public.access_business_portfolios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction'));

CREATE TABLE public.access_portfolio_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.access_business_portfolios(id) ON DELETE CASCADE,
  access_assignment_id UUID REFERENCES public.access_assignments(id) ON DELETE SET NULL,
  assignment_status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  assigned_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.access_portfolio_assignments TO authenticated;
GRANT ALL ON public.access_portfolio_assignments TO service_role;
ALTER TABLE public.access_portfolio_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees read own access_portfolio_assignments" ON public.access_portfolio_assignments FOR SELECT TO authenticated USING (employee_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction') OR public.has_pole(auth.uid(), 'rh'));
CREATE POLICY "Admins and managers manage access_portfolio_assignments" ON public.access_portfolio_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction'));

CREATE TABLE public.merchant_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID,
  role_scope TEXT NOT NULL DEFAULT 'marketplace',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.merchant_portfolios TO authenticated;
GRANT ALL ON public.merchant_portfolios TO service_role;
ALTER TABLE public.merchant_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read merchant_portfolios" ON public.merchant_portfolios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers manage merchant_portfolios" ON public.merchant_portfolios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction'));

CREATE TABLE public.merchant_portfolio_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.merchant_portfolios(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  reason TEXT
);
GRANT SELECT, INSERT, UPDATE ON public.merchant_portfolio_assignments TO authenticated;
GRANT ALL ON public.merchant_portfolio_assignments TO service_role;
ALTER TABLE public.merchant_portfolio_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read merchant_portfolio_assignments" ON public.merchant_portfolio_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and managers manage merchant_portfolio_assignments" ON public.merchant_portfolio_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_pole(auth.uid(), 'direction'));
