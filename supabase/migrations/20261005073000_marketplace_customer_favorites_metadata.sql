-- ============================================================
-- BIB Intranet — Marketplace customer favorites metadata
-- ============================================================
-- Les favoris restent un snapshot de BIB Platform.
--
-- Les métadonnées produit/boutique sont conservées afin que
-- l'Intranet puisse afficher correctement les favoris sans
-- transformer les produits BIB Platform en produits
-- opérationnels BIB Intranet.
-- ============================================================

ALTER TABLE public.marketplace_customer_favorites
  ADD COLUMN IF NOT EXISTS platform_boutique_id uuid,
  ADD COLUMN IF NOT EXISTS target_name text,
  ADD COLUMN IF NOT EXISTS target_sku text;


-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_marketplace_customer_favorites_platform_boutique
  ON public.marketplace_customer_favorites(platform_boutique_id);

CREATE INDEX IF NOT EXISTS
  idx_marketplace_customer_favorites_target_name
  ON public.marketplace_customer_favorites(target_name);


-- ============================================================
-- DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN public.marketplace_customer_favorites.platform_boutique_id IS
  'BIB Platform boutique ID associated with the favorite target. For product favorites, this is products.boutique_id.';

COMMENT ON COLUMN public.marketplace_customer_favorites.target_name IS
  'Display name exported from BIB Platform. For product favorites, resolved from supplier_products.name.';

COMMENT ON COLUMN public.marketplace_customer_favorites.target_sku IS
  'Optional product SKU exported from BIB Platform when available.';
