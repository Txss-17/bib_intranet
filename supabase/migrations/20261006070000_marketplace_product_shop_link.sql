-- ============================================================
-- Marketplace — liaison produit ↔ boutique
-- ============================================================
--
-- Architecture :
--
-- BIB Platform
--   products.boutique_id
--          ↓
--   boutiques.id
--          ↓
--   shops.platform_id
--          ↓
--   shops.id
--          ↓
--   products.shop_id
--
-- IMPORTANT :
-- ------------------------------------------------------------
-- Ne PAS utiliser :
--
--   products.platform_id = shops.platform_id
--
-- car :
--
--   products.platform_id = identifiant du produit BIB Platform
--   shops.platform_id    = identifiant de la boutique BIB Platform
--
-- Ce sont deux identifiants métier différents.
--
-- Le bridge résout donc :
--
--   Platform products.boutique_id
--          ↓
--   Intranet shops.platform_id
--          ↓
--   Intranet shops.id
--
-- puis renseigne :
--
--   Intranet products.shop_id
--
-- IMPORTANT :
-- ------------------------------------------------------------
-- Cette migration ne fait volontairement AUCUN backfill.
--
-- Le platform-bridge ne crée pas non plus de produit Intranet.
-- Il ne fait que rattacher un produit Intranet déjà existant
-- à sa boutique lorsqu'il retrouve products.platform_id.
--
-- La validation / conformité du produit reste dans le périmètre
-- produit / fournisseur / audit et n'est pas déplacée vers
-- Marketplace.
-- ============================================================


-- ============================================================
-- 1. COLONNE DE LIAISON
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shop_id UUID;


-- ============================================================
-- 2. CLÉ ÉTRANGÈRE
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_shop_id_fkey'
      AND conrelid = 'public.products'::regclass
  ) THEN

    ALTER TABLE public.products
      ADD CONSTRAINT products_shop_id_fkey
      FOREIGN KEY (shop_id)
      REFERENCES public.shops(id)
      ON DELETE SET NULL;

  END IF;
END
$$;


-- ============================================================
-- 3. INDEX
-- ============================================================
--
-- MarketplaceProducts et les requêtes de rattachement
-- rechercheront régulièrement les produits par boutique.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_shop_id
  ON public.products(shop_id);


-- ============================================================
-- 4. DOCUMENTATION DE LA COLONNE
-- ============================================================

COMMENT ON COLUMN public.products.shop_id IS
  'Boutique Intranet associée au produit. '
  'La relation est résolue depuis products.boutique_id côté '
  'BIB Platform vers shops.platform_id, puis vers shops.id. '
  'La liaison est effectuée par platform-bridge.';


-- ============================================================
-- 5. AUCUN BACKFILL
-- ============================================================
--
-- Ne pas ajouter ici de UPDATE du type :
--
--   UPDATE products
--   SET shop_id = ...
--
-- à partir de products.platform_id.
--
-- Le platform_id du produit et celui de la boutique ne désignent
-- pas le même objet.
--
-- Le rattachement sera réalisé par platform-bridge après
-- synchronisation des boutiques.
-- ============================================================
