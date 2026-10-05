-- ============================================================
-- BIB Intranet — Marketplace customer favorites bridge
-- ============================================================
-- Platform remains the source of truth.
-- Intranet stores a read-only operational snapshot for
-- Marketplace & Customer / Customer Success.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_customer_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  platform_user_id uuid NOT NULL,

  favorite_type text NOT NULL
    CHECK (favorite_type IN ('product', 'boutique')),

  platform_target_id uuid NOT NULL,

  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  platform_synced_at timestamptz NOT NULL DEFAULT now(),

  source text NOT NULL DEFAULT 'platform'
    CHECK (source IN ('platform')),

  CONSTRAINT marketplace_customer_favorites_unique
    UNIQUE (
      platform_user_id,
      favorite_type,
      platform_target_id
    )
);

CREATE INDEX IF NOT EXISTS idx_marketplace_customer_favorites_user
  ON public.marketplace_customer_favorites(platform_user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_customer_favorites_type
  ON public.marketplace_customer_favorites(favorite_type);

CREATE INDEX IF NOT EXISTS idx_marketplace_customer_favorites_target
  ON public.marketplace_customer_favorites(platform_target_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_customer_favorites_shop
  ON public.marketplace_customer_favorites(shop_id);

ALTER TABLE public.marketplace_customer_favorites
  ENABLE ROW LEVEL SECURITY;

GRANT SELECT
ON public.marketplace_customer_favorites
TO authenticated;

GRANT ALL
ON public.marketplace_customer_favorites
TO service_role;

CREATE POLICY "Marketplace favorites staff can view"
ON public.marketplace_customer_favorites
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace', 'support', 'tech']
  )
);

COMMENT ON TABLE public.marketplace_customer_favorites IS
  'Read-only operational snapshot of BIB Platform customer product and boutique favorites. Platform is the source of truth.';
