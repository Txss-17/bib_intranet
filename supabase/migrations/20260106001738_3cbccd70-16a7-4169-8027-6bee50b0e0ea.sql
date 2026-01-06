-- Create supplier_payments table
CREATE TABLE public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  invoice_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  validated_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create salaries table
CREATE TABLE public.salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.profiles(id),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  gross_amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  bonuses NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  paid_date DATE,
  validated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fundraising_rounds table
CREATE TABLE public.fundraising_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  raised_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planning',
  start_date DATE,
  close_date DATE,
  lead_investor TEXT,
  valuation NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create guarantee_fund table
CREATE TABLE public.guarantee_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  related_user_id UUID REFERENCES public.user_accounts(id),
  processed_by UUID,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantee_fund ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_payments
CREATE POLICY "Authenticated users can view supplier payments" ON public.supplier_payments
  FOR SELECT USING (true);

CREATE POLICY "Managers and admins can manage supplier payments" ON public.supplier_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS policies for salaries
CREATE POLICY "Managers and admins can view salaries" ON public.salaries
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins can manage salaries" ON public.salaries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for fundraising_rounds
CREATE POLICY "Authenticated users can view fundraising rounds" ON public.fundraising_rounds
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fundraising rounds" ON public.fundraising_rounds
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for guarantee_fund
CREATE POLICY "Authenticated users can view guarantee fund" ON public.guarantee_fund
  FOR SELECT USING (true);

CREATE POLICY "Managers and admins can manage guarantee fund" ON public.guarantee_fund
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_supplier_payments_updated_at
  BEFORE UPDATE ON public.supplier_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_salaries_updated_at
  BEFORE UPDATE ON public.salaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fundraising_rounds_updated_at
  BEFORE UPDATE ON public.fundraising_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();