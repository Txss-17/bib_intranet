-- Supplier portal bidirectional: status token, restock orders, portal notifications, catalog uploads inbox

ALTER TABLE public.supplier_applications
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_supplier_applications_public_token
  ON public.supplier_applications(public_token);

CREATE TABLE IF NOT EXISTS public.supplier_restock_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  catalog_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  destination_type text NOT NULL CHECK (destination_type IN ('warehouse','logistics_partner')),
  destination_id uuid,
  destination_name text NOT NULL,
  customization_notes text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','acknowledged','in_production','shipped','received','cancelled')),
  priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('high','standard','low')),
  due_date date,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  received_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restock_supplier ON public.supplier_restock_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_restock_status ON public.supplier_restock_orders(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_restock_orders TO authenticated;
GRANT ALL ON public.supplier_restock_orders TO service_role;
ALTER TABLE public.supplier_restock_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view restock orders" ON public.supplier_restock_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage restock orders" ON public.supplier_restock_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE TRIGGER trg_restock_updated_at BEFORE UPDATE ON public.supplier_restock_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.supplier_portal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('audit_scheduled','restock_order','catalog_review','application_update','generic')),
  title text NOT NULL,
  body text,
  reference_table text,
  reference_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_portal_notif_supplier ON public.supplier_portal_notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_portal_notif_type ON public.supplier_portal_notifications(type);
GRANT SELECT, INSERT ON public.supplier_portal_notifications TO authenticated;
GRANT ALL ON public.supplier_portal_notifications TO service_role;
ALTER TABLE public.supplier_portal_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view portal notifications" ON public.supplier_portal_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert portal notifications" ON public.supplier_portal_notifications FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TABLE IF NOT EXISTS public.supplier_catalog_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  submitted_by_email text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  version text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected')),
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_catalog_upload_supplier ON public.supplier_catalog_uploads(supplier_id);
CREATE INDEX IF NOT EXISTS idx_catalog_upload_status ON public.supplier_catalog_uploads(status);
GRANT SELECT, UPDATE ON public.supplier_catalog_uploads TO authenticated;
GRANT ALL ON public.supplier_catalog_uploads TO service_role;
ALTER TABLE public.supplier_catalog_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view catalog uploads" ON public.supplier_catalog_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage catalog uploads" ON public.supplier_catalog_uploads FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
CREATE TRIGGER trg_catalog_upload_updated_at BEFORE UPDATE ON public.supplier_catalog_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
