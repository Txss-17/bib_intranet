-- Canonical bridge table, including the enriched fields consumed by Platform sync.
CREATE TABLE IF NOT EXISTS public.marketplace_customer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id uuid NOT NULL,
  favorite_type text NOT NULL CHECK (favorite_type IN ('product','boutique')),
  platform_target_id uuid NOT NULL,
  platform_boutique_id uuid,
  target_name text,
  target_sku text,
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  platform_synced_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'platform' CHECK (source = 'platform'),
  UNIQUE (platform_user_id, favorite_type, platform_target_id)
);
-- Compatible with an earlier, narrower table if that schema was already applied.
ALTER TABLE public.marketplace_customer_favorites ADD COLUMN IF NOT EXISTS platform_boutique_id uuid;
ALTER TABLE public.marketplace_customer_favorites ADD COLUMN IF NOT EXISTS target_name text;
ALTER TABLE public.marketplace_customer_favorites ADD COLUMN IF NOT EXISTS target_sku text;
ALTER TABLE public.marketplace_customer_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketplace_customer_favorites FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.marketplace_customer_favorites TO authenticated;
GRANT ALL ON public.marketplace_customer_favorites TO service_role;
DROP POLICY IF EXISTS "Marketplace favorites staff can view" ON public.marketplace_customer_favorites;
CREATE POLICY "Marketplace favorites staff can view" ON public.marketplace_customer_favorites
FOR SELECT TO authenticated USING (
  public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['marketplace','support','tech'])
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public.platform_bridge_state (
  name text PRIMARY KEY,
  snapshot_at timestamptz NOT NULL
);
ALTER TABLE public.platform_bridge_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_bridge_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_bridge_state TO service_role;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.replace_platform_favorites(p_rows jsonb, p_snapshot_at timestamptz)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE previous_snapshot timestamptz; replaced_count integer;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) > 50000
     OR p_snapshot_at IS NULL OR p_snapshot_at > clock_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'invalid_favorites_snapshot' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(19244834, 1);
  SELECT snapshot_at INTO previous_snapshot FROM public.platform_bridge_state WHERE name = 'favorites';
  IF previous_snapshot IS NOT NULL AND previous_snapshot >= p_snapshot_at THEN RETURN 0; END IF;
  DELETE FROM public.marketplace_customer_favorites WHERE source = 'platform';
  INSERT INTO public.marketplace_customer_favorites (
    platform_user_id, favorite_type, platform_target_id, platform_boutique_id,
    target_name, target_sku, shop_id, created_at, platform_synced_at, source
  )
  SELECT platform_user_id, favorite_type, platform_target_id, platform_boutique_id,
    target_name, target_sku, shop_id, coalesce(created_at, p_snapshot_at), p_snapshot_at, 'platform'
  FROM jsonb_to_recordset(p_rows) AS row_data (
    platform_user_id uuid, favorite_type text, platform_target_id uuid, platform_boutique_id uuid,
    target_name text, target_sku text, shop_id uuid, created_at timestamptz
  );
  GET DIAGNOSTICS replaced_count = ROW_COUNT;
  INSERT INTO public.platform_bridge_state (name, snapshot_at) VALUES ('favorites', p_snapshot_at)
  ON CONFLICT (name) DO UPDATE SET snapshot_at = EXCLUDED.snapshot_at;
  RETURN replaced_count;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.replace_platform_favorites(jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_platform_favorites(jsonb, timestamptz) TO service_role;
--> statement-breakpoint
-- A catalog product may appear in many boutiques. Never store that one-to-many
-- relationship in operational products.platform_id or an invented products.shop_id.
CREATE TABLE IF NOT EXISTS public.platform_boutique_products (
  platform_product_id uuid PRIMARY KEY,
  platform_supplier_product_id uuid NOT NULL,
  intranet_product_id uuid NOT NULL REFERENCES public.products(id),
  shop_id uuid NOT NULL REFERENCES public.shops(id),
  platform_boutique_id uuid NOT NULL,
  public_status text,
  public_price numeric,
  platform_synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS platform_boutique_products_intranet_product_idx ON public.platform_boutique_products(intranet_product_id);
ALTER TABLE public.platform_boutique_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_boutique_products FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.platform_boutique_products TO authenticated;
GRANT ALL ON public.platform_boutique_products TO service_role;
DROP POLICY IF EXISTS "Staff view visible catalog links" ON public.platform_boutique_products;
CREATE POLICY "Staff view visible catalog links" ON public.platform_boutique_products FOR SELECT TO authenticated
USING ((public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['marketplace','supplier','ops','tech']))
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = intranet_product_id));
