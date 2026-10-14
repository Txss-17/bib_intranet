CREATE TABLE IF NOT EXISTS public.supplier_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'supplier',
  company_name text NOT NULL,
  contact_name text, contact_email text NOT NULL, contact_phone text,
  country text, category text, lead_time_days integer, moq integer,
  audit_accepted boolean NOT NULL DEFAULT false,
  certifications jsonb NOT NULL DEFAULT '[]', documents jsonb NOT NULL DEFAULT '[]', raw_payload jsonb NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0, priority text NOT NULL DEFAULT 'standard', status text NOT NULL DEFAULT 'new',
  blocking_criteria text[] NOT NULL DEFAULT '{}',
  assigned_to_id uuid, assigned_to_name text, assigned_at timestamptz,
  decision_notes text, decision_by uuid, decision_at timestamptz,
  source text NOT NULL DEFAULT 'platform',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_applications TO authenticated;
GRANT ALL ON public.supplier_applications TO service_role;
ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier team reads applications" ON public.supplier_applications FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'));
CREATE POLICY "Supplier team updates applications" ON public.supplier_applications FOR UPDATE TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'))
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'));
CREATE TRIGGER trg_supplier_applications_updated BEFORE UPDATE ON public.supplier_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.supplier_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL, from_status text, to_status text, notes text,
  performed_by uuid, metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.supplier_application_events TO authenticated;
GRANT ALL ON public.supplier_application_events TO service_role;
ALTER TABLE public.supplier_application_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier team reads application events" ON public.supplier_application_events FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'));
CREATE POLICY "Supplier team logs application events" ON public.supplier_application_events FOR INSERT TO authenticated
  WITH CHECK (performed_by = auth.uid() AND (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier')));

CREATE TABLE IF NOT EXISTS public.supplier_restock_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.product_catalog(id) ON DELETE SET NULL,
  product_name text NOT NULL, quantity integer NOT NULL CHECK (quantity > 0),
  destination_type text NOT NULL CHECK (destination_type IN ('warehouse','logistics_partner')),
  destination_id uuid, destination_name text NOT NULL, customization_notes text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','acknowledged','in_production','shipped','received','cancelled')),
  priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('high','standard','low')),
  due_date date, sent_at timestamptz, acknowledged_at timestamptz, received_at timestamptz,
  created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.supplier_restock_orders TO authenticated;
GRANT ALL ON public.supplier_restock_orders TO service_role;
ALTER TABLE public.supplier_restock_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier/ops read restock" ON public.supplier_restock_orders FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']));
CREATE POLICY "Supplier/ops create restock" ON public.supplier_restock_orders FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops'])));
CREATE POLICY "Supplier/ops update restock" ON public.supplier_restock_orders FOR UPDATE TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']))
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']));
CREATE TRIGGER trg_supplier_restock_updated BEFORE UPDATE ON public.supplier_restock_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.supplier_catalog_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  submitted_by_email text, file_name text NOT NULL, file_url text NOT NULL, file_size bigint, mime_type text,
  version text, notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  review_notes text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.supplier_catalog_uploads TO authenticated;
GRANT ALL ON public.supplier_catalog_uploads TO service_role;
ALTER TABLE public.supplier_catalog_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier team reads catalog uploads" ON public.supplier_catalog_uploads FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'));
CREATE POLICY "Supplier team reviews catalog uploads" ON public.supplier_catalog_uploads FOR UPDATE TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'))
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'supplier'));
CREATE TRIGGER trg_supplier_catalog_uploads_updated BEFORE UPDATE ON public.supplier_catalog_uploads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.supplier_portal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  type text NOT NULL, title text NOT NULL, body text,
  reference_table text, reference_id uuid, read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.supplier_portal_notifications TO authenticated;
GRANT ALL ON public.supplier_portal_notifications TO service_role;
ALTER TABLE public.supplier_portal_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supplier/ops read portal notifications" ON public.supplier_portal_notifications FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']));
CREATE POLICY "Supplier/ops send portal notifications" ON public.supplier_portal_notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['supplier','ops']));