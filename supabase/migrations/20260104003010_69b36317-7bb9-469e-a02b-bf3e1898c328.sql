-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  contact_name TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'suspended')),
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  category TEXT,
  description TEXT,
  moq INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'archived')),
  packaging_status TEXT DEFAULT 'pending' CHECK (packaging_status IN ('pending', 'rse_validated', 'rse_rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('iso', 'organic', 'fair_trade', 'eco_label', 'quality', 'safety', 'other')),
  issuer TEXT,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending_renewal', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT certification_entity_check CHECK (supplier_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Create product decisions (validation history)
CREATE TABLE public.product_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('validation', 'rejection', 'archive', 'reactivation', 'price_change', 'moq_change')),
  previous_status TEXT,
  new_status TEXT,
  decision_by UUID NOT NULL REFERENCES auth.users(id),
  decision_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb
);

-- Create quality alerts
CREATE TABLE public.quality_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage suppliers"
  ON public.suppliers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for certifications
CREATE POLICY "Authenticated users can view certifications"
  ON public.certifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage certifications"
  ON public.certifications FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for product_decisions
CREATE POLICY "Authenticated users can view decisions"
  ON public.product_decisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can create decisions"
  ON public.product_decisions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- RLS Policies for quality_alerts
CREATE POLICY "Authenticated users can view quality alerts"
  ON public.quality_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create quality alerts"
  ON public.quality_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers and admins can manage quality alerts"
  ON public.quality_alerts FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Add triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quality_alerts_updated_at
  BEFORE UPDATE ON public.quality_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_certifications_supplier_id ON public.certifications(supplier_id);
CREATE INDEX idx_certifications_product_id ON public.certifications(product_id);
CREATE INDEX idx_product_decisions_product_id ON public.product_decisions(product_id);
CREATE INDEX idx_quality_alerts_severity ON public.quality_alerts(severity);
CREATE INDEX idx_quality_alerts_status ON public.quality_alerts(status);