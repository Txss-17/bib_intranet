-- ============================================================
-- Marketplace — liaison produit ↔ boutique
-- ============================================================
--
-- Architecture :
--
-- BIB Platform
--   products.boutique_id
--          ↓
-- Intranet shops.platform_id
--          ↓
-- Intranet shops.id
--          ↓
-- Intranet products.shop_id
--
-- IMPORTANT :
-- Ne pas utiliser products.platform_id = shops.platform_id.
-- platform_id identifie respectivement le produit et la boutique
-- côté plateforme ; ce ne sont pas les mêmes identifiants métier.
-- ============================================================


-- ============================================================
-- 1. AJOUT DE LA BOUTIQUE SUR LE PRODUIT
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shop_id UUID;


-- ============================================================
-- 2. CONTRAINTE DE RÉFÉRENCE
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

CREATE INDEX IF NOT EXISTS idx_products_shop_id
  ON public.products(shop_id);


-- ============================================================
-- 4. DOCUMENTATION DU CHAMP
-- ============================================================

COMMENT ON COLUMN public.products.shop_id IS
  'Boutique Intranet associée au produit. '
  'La relation est résolue depuis products.boutique_id côté BIB Platform '
  'vers shops.platform_id, puis vers shops.id.';


-- ============================================================
-- 5. CONTRÔLE DE COHÉRENCE
-- ============================================================
--
-- Cette migration ne renseigne volontairement PAS shop_id
-- pour les produits existants.
--
-- Le remplissage doit être effectué par platform-bridge à partir
-- de la véritable relation BIB Platform products.boutique_id.
--
-- Cela évite une association incorrecte entre :
--   products.platform_id
-- et
--   shops.platform_id.
-- ============================================================
