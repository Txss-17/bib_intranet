-- =====================================================
-- 1. PRODUCT CATALOG (référentiel OPS enrichi)
-- =====================================================
CREATE TABLE public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  shop_sku TEXT NOT NULL UNIQUE,
  internal_sku TEXT UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  category TEXT,
  weight_gross_g NUMERIC,
  weight_net_g NUMERIC,
  packaging_type TEXT,
  dimensions TEXT,
  moq INTEGER DEFAULT 1,
  reorder_threshold INTEGER DEFAULT 10,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view product catalog (no internal_sku)"
ON public.product_catalog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and admins can manage product catalog"
ON public.product_catalog FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER trg_product_catalog_updated
BEFORE UPDATE ON public.product_catalog
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 2. PARTNER STOCKS (stocks distribués)
-- =====================================================
CREATE TABLE public.partner_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.logistics_partners(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  rupture_threshold INTEGER DEFAULT 5,
  reorder_threshold INTEGER DEFAULT 20,
  location TEXT,
  region TEXT,
  last_inventory_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (catalog_id, partner_id)
);

ALTER TABLE public.partner_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view partner stocks"
ON public.partner_stocks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers and admins can manage partner stocks"
ON public.partner_stocks FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER trg_partner_stocks_updated
BEFORE UPDATE ON public.partner_stocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 3. STOCK MOVEMENTS (historique)
-- =====================================================
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound','outbound','transfer','adjustment','reservation','release')),
  quantity INTEGER NOT NULL,
  source_partner_id UUID REFERENCES public.logistics_partners(id),
  target_partner_id UUID REFERENCES public.logistics_partners(id),
  reason TEXT,
  reference TEXT,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view stock movements"
ON public.stock_movements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert stock movements"
ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- 4. ORDER LIFECYCLE EVENTS (pipeline commandes)
-- =====================================================
CREATE TABLE public.order_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('created','confirmed','transmitted','accepted','prepared','shipped','delivered','cancelled','returned')),
  partner_id UUID REFERENCES public.logistics_partners(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view order events"
ON public.order_lifecycle_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert order events"
ON public.order_lifecycle_events FOR INSERT TO authenticated WITH CHECK (true);

-- Enrichir orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.logistics_partners(id),
  ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'created',
  ADD COLUMN IF NOT EXISTS shop_sku TEXT,
  ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES public.product_catalog(id);

-- =====================================================
-- 5. PARTNER SYNC EVENTS (flux aller/retour)
-- =====================================================
CREATE TABLE public.partner_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.logistics_partners(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success','pending','error','timeout')),
  reference_id UUID,
  reference_type TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view sync events"
ON public.partner_sync_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert sync events"
ON public.partner_sync_events FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- 6. REPLENISHMENT SUGGESTIONS
-- =====================================================
CREATE TABLE public.replenishment_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  source_partner_id UUID REFERENCES public.logistics_partners(id),
  target_partner_id UUID REFERENCES public.logistics_partners(id),
  suggested_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.replenishment_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view replenishment"
ON public.replenishment_suggestions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage replenishment"
ON public.replenishment_suggestions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER trg_replenishment_updated
BEFORE UPDATE ON public.replenishment_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 7. ENRICH logistics_partners
-- =====================================================
ALTER TABLE public.logistics_partners
  ADD COLUMN IF NOT EXISTS volume_processed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_lead_time_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region TEXT;

-- =====================================================
-- 8. ENRICH logistics_incidents
-- =====================================================
ALTER TABLE public.logistics_incidents
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('order_blocked','stock_inconsistency','partner_unresponsive','shipping_error','sync_failure','other')),
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.logistics_partners(id),
  ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES public.product_catalog(id);

-- =====================================================
-- 9. REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_stocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_lifecycle_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_sync_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replenishment_suggestions;

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Partenaires (mise à jour des existants + nouveaux)
INSERT INTO public.logistics_partners (id, name, type, contact_email, status, region, volume_processed, avg_lead_time_hours, error_rate)
VALUES
  (gen_random_uuid(), 'LogiNord Hub', 'fulfillment', 'ops@loginord.fr', 'active', 'Île-de-France', 1240, 18.5, 1.2),
  (gen_random_uuid(), 'SudExpress Logistics', 'carrier', 'contact@sudexpress.fr', 'active', 'PACA', 890, 22.0, 2.8),
  (gen_random_uuid(), 'AtlanticWare', 'warehouse', 'hello@atlanticware.fr', 'active', 'Nouvelle-Aquitaine', 650, 26.5, 1.9),
  (gen_random_uuid(), 'EuropaFlow', 'fulfillment', 'service@europaflow.eu', 'active', 'Grand Est', 1580, 16.0, 0.8),
  (gen_random_uuid(), 'RhoneAlpes Stock', 'warehouse', 'team@rastock.fr', 'active', 'Auvergne-Rhône-Alpes', 720, 20.0, 1.5)
ON CONFLICT DO NOTHING;

-- Catalogue produits (12 SKU)
INSERT INTO public.product_catalog (shop_sku, internal_sku, barcode, name, category, weight_gross_g, weight_net_g, packaging_type, dimensions, moq, reorder_threshold)
VALUES
  ('SHOP-001','INT-A001','3760000000011','Sérum Vitamine C 30ml','cosmetic',180,30,'glass_bottle','5x5x12cm',24,30),
  ('SHOP-002','INT-A002','3760000000028','Crème Hydratante Bio 50ml','cosmetic',220,50,'jar','7x7x6cm',24,25),
  ('SHOP-003','INT-A003','3760000000035','Huile Argan Pure 100ml','cosmetic',280,100,'glass_bottle','6x6x14cm',12,20),
  ('SHOP-004','INT-B001','3760000000042','Tisane Détox 50g','food',120,50,'kraft_pouch','12x18x3cm',36,40),
  ('SHOP-005','INT-B002','3760000000059','Miel Lavande 250g','food',380,250,'glass_jar','7x7x9cm',12,15),
  ('SHOP-006','INT-C001','3760000000066','Bougie Vanille 200g','home',420,200,'tin_box','8x8x9cm',12,18),
  ('SHOP-007','INT-C002','3760000000073','Diffuseur Bambou','home',560,400,'cardboard_box','10x10x18cm',6,10),
  ('SHOP-008','INT-D001','3760000000080','Compléments Magnésium 60gel','health',150,40,'plastic_jar','6x6x10cm',24,35),
  ('SHOP-009','INT-D002','3760000000097','Probiotiques 30gel','health',120,25,'plastic_jar','5x5x9cm',24,30),
  ('SHOP-010','INT-E001','3760000000103','Savon Marseille Cube','cosmetic',310,300,'paper_wrap','7x7x7cm',24,50),
  ('SHOP-011','INT-E002','3760000000110','Shampoing Solide 80g','cosmetic',110,80,'kraft_box','7x7x4cm',24,40),
  ('SHOP-012','INT-F001','3760000000127','Carnet Recyclé A5','accessory',180,150,'paper_sleeve','15x21x1cm',12,25)
ON CONFLICT DO NOTHING;

-- Stocks distribués
WITH p AS (SELECT id, name FROM public.logistics_partners WHERE name IN ('LogiNord Hub','SudExpress Logistics','AtlanticWare','EuropaFlow','RhoneAlpes Stock')),
c AS (SELECT id, shop_sku FROM public.product_catalog)
INSERT INTO public.partner_stocks (catalog_id, partner_id, quantity, reserved_quantity, rupture_threshold, reorder_threshold, location, region)
SELECT c.id, p.id,
  (CASE WHEN random()<0.15 THEN 2 ELSE (20 + (random()*180)::int) END),
  (random()*8)::int, 5, 20,
  p.name||' - Allée '||((random()*9+1)::int), 'FR'
FROM c CROSS JOIN p
ON CONFLICT (catalog_id, partner_id) DO NOTHING;

-- Commandes démo enrichies
INSERT INTO public.orders (order_number, status, total_amount, shop_sku, current_stage, partner_id, catalog_id)
SELECT
  'OPS-'||to_char(now(),'YYYYMMDD')||'-'||lpad(g::text,4,'0'),
  CASE g%5 WHEN 0 THEN 'pending' WHEN 1 THEN 'processing' WHEN 2 THEN 'shipped' WHEN 3 THEN 'delivered' ELSE 'pending' END,
  (50 + random()*450)::numeric(10,2),
  c.shop_sku,
  (ARRAY['created','confirmed','transmitted','accepted','prepared','shipped','delivered'])[1+(g%7)],
  (SELECT id FROM public.logistics_partners ORDER BY random() LIMIT 1),
  c.id
FROM generate_series(1,8) g
CROSS JOIN LATERAL (SELECT id, shop_sku FROM public.product_catalog ORDER BY random() LIMIT 1) c;

-- Sync events
INSERT INTO public.partner_sync_events (partner_id, direction, event_type, status, error_message, duration_ms)
SELECT
  p.id,
  (ARRAY['outbound','inbound'])[1+(g%2)],
  (ARRAY['order_push','stock_pull','tracking_update','inventory_sync','shipment_confirm'])[1+(g%5)],
  (ARRAY['success','success','success','error','pending'])[1+(g%5)],
  CASE WHEN g%5=3 THEN 'Timeout connecting to partner API' ELSE NULL END,
  (100 + random()*2000)::int
FROM generate_series(1,15) g
CROSS JOIN LATERAL (SELECT id FROM public.logistics_partners ORDER BY random() LIMIT 1) p;

-- Suggestions de réappro
WITH low AS (
  SELECT ps.catalog_id, ps.partner_id, ps.quantity
  FROM public.partner_stocks ps
  WHERE ps.quantity <= ps.rupture_threshold
  LIMIT 3
)
INSERT INTO public.replenishment_suggestions (catalog_id, source_partner_id, target_partner_id, suggested_quantity, reason, priority)
SELECT
  low.catalog_id,
  (SELECT id FROM public.logistics_partners WHERE id <> low.partner_id ORDER BY random() LIMIT 1),
  low.partner_id,
  50,
  'Stock sous seuil de rupture détecté',
  'high'
FROM low;