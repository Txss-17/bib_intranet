-- ============================================================
-- MARKETPLACE — LIAISON PRODUIT ↔ BOUTIQUE
-- ============================================================
--
-- BIB Platform reste la source de vérité commerciale.
--
-- Platform :
--   products.boutique_id
--
-- Intranet :
--   shops.platform_id = identifiant boutique Platform
--   products.shop_id  = identifiant interne shops.id
--
-- Marketplace peut ainsi afficher :
--   Produit → Boutique → Marchand
--
-- Marketplace ne valide PAS les produits.
-- La validation produit reste portée par les pôles compétents.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Ajouter la boutique interne au produit
-- ------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shop_id UUID;


-- ------------------------------------------------------------
-- 2. Relation vers la boutique Intranet
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_shop_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_shop_id_fkey
      FOREIGN KEY (shop_id)
      REFERENCES public.shops(id)
      ON DELETE SET NULL;
  END IF;
END
$$;


-- ------------------------------------------------------------
-- 3. Index
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_shop_id
  ON public.products(shop_id);


-- ------------------------------------------------------------
-- 4. Commentaire documentaire
-- ------------------------------------------------------------

COMMENT ON COLUMN public.products.shop_id IS
  'Boutique Intranet associée au produit. Résolue depuis products.boutique_id côté BIB Platform via shops.platform_id.';


-- ------------------------------------------------------------
-- 5. Synchronisation des produits déjà présents
-- ------------------------------------------------------------
--
-- Lorsque le produit possède déjà platform_id et que la boutique
-- correspondante existe dans shops, on peut reconstruire la
-- relation sans dépendre d''une nouvelle synchronisation.
--
-- Aucun produit non identifiable n''est artificiellement rattaché.
-- ------------------------------------------------------------

UPDATE public.products p
SET shop_id = s.id
FROM public.shops s
WHERE p.shop_id IS NULL
  AND p.platform_id IS NOT NULL
  AND s.platform_id IS NOT NULL
  AND p.platform_id = s.platform_id;


-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
--
-- Aucun nouveau droit d''écriture n''est accordé à Marketplace.
-- La politique SELECT existante sur products reste utilisée.
--
-- Marketplace ne reçoit donc aucune capacité de validation,
-- modification ou publication du produit.
-- ------------------------------------------------------------
