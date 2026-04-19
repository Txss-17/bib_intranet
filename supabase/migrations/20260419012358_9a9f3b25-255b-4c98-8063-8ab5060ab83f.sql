-- 1. Enrichir partner_stocks avec seuils prédictifs
ALTER TABLE public.partner_stocks
  ADD COLUMN IF NOT EXISTS min_threshold integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS ideal_stock integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS supplier_lead_time_days integer DEFAULT 7;

-- 2. Enrichir orders avec région pour l'allocation géographique
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS region text;

-- 3. Enrichir replenishment_suggestions
ALTER TABLE public.replenishment_suggestions
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_executable boolean DEFAULT false;

-- 4. Nouvelle table : supplier_lead_times (fournisseurs logistiques pour réappro)
CREATE TABLE IF NOT EXISTS public.supplier_lead_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_contact text,
  lead_time_days integer NOT NULL DEFAULT 7,
  moq integer NOT NULL DEFAULT 1,
  unit_price numeric,
  currency text DEFAULT 'EUR',
  reliability_score numeric DEFAULT 80 CHECK (reliability_score BETWEEN 0 AND 100),
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_lead_times ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view supplier lead times"
  ON public.supplier_lead_times FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Managers can manage supplier lead times"
  ON public.supplier_lead_times FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER trg_supplier_lead_times_updated
  BEFORE UPDATE ON public.supplier_lead_times
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_supplier_lead_times_catalog ON public.supplier_lead_times(catalog_id);
CREATE INDEX idx_supplier_lead_times_primary ON public.supplier_lead_times(catalog_id, is_primary) WHERE is_primary = true;

-- 5. Nouvelle table : demand_forecasts (prévisions par produit × région)
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id uuid NOT NULL REFERENCES public.product_catalog(id) ON DELETE CASCADE,
  region text,
  avg_daily_sales_7d numeric NOT NULL DEFAULT 0,
  projected_sales_7d numeric NOT NULL DEFAULT 0,
  trend_percent numeric NOT NULL DEFAULT 0,
  confidence_level text DEFAULT 'low' CHECK (confidence_level IN ('low','medium','high')),
  sample_size integer DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view demand forecasts"
  ON public.demand_forecasts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Managers can manage demand forecasts"
  ON public.demand_forecasts FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE INDEX idx_demand_forecasts_catalog_region ON public.demand_forecasts(catalog_id, region);
CREATE INDEX idx_demand_forecasts_computed ON public.demand_forecasts(computed_at DESC);

-- 6. Fonction : calcul des prévisions de demande par région
CREATE OR REPLACE FUNCTION public.calculate_demand_forecast()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  rec RECORD;
  v_avg7 numeric;
  v_avg14prev numeric;
  v_trend numeric;
  v_conf text;
  v_samples integer;
BEGIN
  -- Pour chaque combinaison catalog × region présente dans les commandes des 14 derniers jours
  FOR rec IN
    SELECT DISTINCT o.catalog_id, COALESCE(o.region, 'unknown') AS region
    FROM public.orders o
    WHERE o.catalog_id IS NOT NULL
      AND o.created_at >= now() - interval '14 days'
  LOOP
    -- Moyenne quotidienne sur 7 derniers jours
    SELECT COALESCE(SUM(1)::numeric / 7, 0), COUNT(*)
    INTO v_avg7, v_samples
    FROM public.orders
    WHERE catalog_id = rec.catalog_id
      AND COALESCE(region, 'unknown') = rec.region
      AND created_at >= now() - interval '7 days';

    -- Moyenne quotidienne 7-14j (période précédente)
    SELECT COALESCE(SUM(1)::numeric / 7, 0)
    INTO v_avg14prev
    FROM public.orders
    WHERE catalog_id = rec.catalog_id
      AND COALESCE(region, 'unknown') = rec.region
      AND created_at >= now() - interval '14 days'
      AND created_at < now() - interval '7 days';

    v_trend := CASE
      WHEN v_avg14prev = 0 AND v_avg7 > 0 THEN 100
      WHEN v_avg14prev = 0 THEN 0
      ELSE round(((v_avg7 - v_avg14prev) / v_avg14prev) * 100, 2)
    END;

    v_conf := CASE
      WHEN v_samples >= 30 THEN 'high'
      WHEN v_samples >= 10 THEN 'medium'
      ELSE 'low'
    END;

    -- Upsert
    DELETE FROM public.demand_forecasts
    WHERE catalog_id = rec.catalog_id AND COALESCE(region, 'unknown') = rec.region;

    INSERT INTO public.demand_forecasts
      (catalog_id, region, avg_daily_sales_7d, projected_sales_7d, trend_percent, confidence_level, sample_size)
    VALUES
      (rec.catalog_id, rec.region, v_avg7, v_avg7 * 7, v_trend, v_conf, v_samples);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 7. Fonction : détection automatique des besoins de réapprovisionnement
CREATE OR REPLACE FUNCTION public.detect_replenishment_needs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created integer := 0;
  rec RECORD;
  v_supplier RECORD;
  v_qty integer;
  v_priority text;
  v_auto boolean;
  v_existing uuid;
BEGIN
  FOR rec IN
    SELECT ps.id, ps.catalog_id, ps.partner_id, ps.quantity,
           ps.min_threshold, ps.ideal_stock, ps.supplier_lead_time_days,
           pc.name AS product_name
    FROM public.partner_stocks ps
    JOIN public.product_catalog pc ON pc.id = ps.catalog_id
    WHERE ps.quantity <= COALESCE(ps.min_threshold, 10)
  LOOP
    -- Vérifier qu'il n'y a pas déjà une suggestion pending pour ce stock
    SELECT id INTO v_existing
    FROM public.replenishment_suggestions
    WHERE catalog_id = rec.catalog_id
      AND target_partner_id = rec.partner_id
      AND status IN ('pending','approved')
    LIMIT 1;

    IF v_existing IS NOT NULL THEN CONTINUE; END IF;

    -- Trouver le fournisseur principal
    SELECT * INTO v_supplier
    FROM public.supplier_lead_times
    WHERE catalog_id = rec.catalog_id
    ORDER BY is_primary DESC, reliability_score DESC
    LIMIT 1;

    -- Quantité = stock idéal - stock actuel, au moins MOQ
    v_qty := GREATEST(
      COALESCE(rec.ideal_stock, 100) - rec.quantity,
      COALESCE(v_supplier.moq, 1)
    );

    v_priority := CASE
      WHEN rec.quantity = 0 THEN 'critical'
      WHEN rec.quantity <= COALESCE(rec.min_threshold, 10) / 2 THEN 'high'
      ELSE 'medium'
    END;

    -- Auto-exécutable si fiabilité ≥ 90 et fournisseur existe
    v_auto := (v_supplier.id IS NOT NULL AND COALESCE(v_supplier.reliability_score, 0) >= 90);

    INSERT INTO public.replenishment_suggestions
      (catalog_id, target_partner_id, suggested_quantity, reason, priority,
       status, source, confidence_score, auto_executable, notes)
    VALUES (
      rec.catalog_id,
      rec.partner_id,
      v_qty,
      format('Stock %s ≤ seuil min %s', rec.quantity, COALESCE(rec.min_threshold, 10)),
      v_priority,
      CASE WHEN v_auto THEN 'approved' ELSE 'pending' END,
      CASE WHEN v_auto THEN 'auto_executed' ELSE 'auto_detected' END,
      COALESCE(v_supplier.reliability_score, 50),
      v_auto,
      CASE WHEN v_supplier.id IS NOT NULL
           THEN format('Fournisseur: %s (lead %s j, fiab %s%%)', v_supplier.supplier_name, v_supplier.lead_time_days, v_supplier.reliability_score)
           ELSE 'Aucun fournisseur configuré'
      END
    );

    v_created := v_created + 1;
  END LOOP;

  RETURN v_created;
END;
$$;

-- 8. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_lead_times;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_forecasts;