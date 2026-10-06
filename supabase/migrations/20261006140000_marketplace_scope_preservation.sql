-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — PRÉSERVATION DES PÉRIMÈTRES EXISTANTS
--
-- OBJECTIFS
--
-- 1. Restaurer les accès historiques des pôles non-Marketplace
--    qui ont été retirés par la migration de scope Marketplace.
--
-- 2. Ajouter l'accès Marketplace aux produits, mais uniquement
--    pour les boutiques appartenant aux marchands du portefeuille
--    du collaborateur.
--
-- 3. Ne jamais donner à Marketplace un accès global aux produits.
--
-- Architecture :
--
--   collaborateur
--        ↓
--   portefeuille Marketplace
--        ↓
--   marchand
--        ↓
--   boutique
--        ↓
--   produit
--
-- Identité :
--
--   auth.users.id = profiles.id
--
-- ============================================================


-- ============================================================
-- 1. FONCTION :
--    LE COLLABORATEUR A-T-IL ACCÈS À UNE BOUTIQUE MARKETPLACE ?
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_shop(
  p_user_id UUID,
  p_shop_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.is_leadership(p_user_id)

    OR public.has_role(
      p_user_id,
      'admin'::public.app_role
    )

    OR EXISTS (
      SELECT 1
      FROM public.shops s

      WHERE s.id = p_shop_id

        AND s.merchant_id IS NOT NULL

        AND public.user_has_marketplace_merchant(
          p_user_id,
          s.merchant_id
        )
    );
$$;


-- ============================================================
-- 2. SÉCURISATION DE LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
FROM anon;


GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_shop(
  UUID,
  UUID
)
IS
'Détermine si un collaborateur peut accéder à une boutique Marketplace selon le portefeuille marchand auquel il est affecté.';


-- ============================================================
-- 3. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_shops_merchant_id
ON public.shops(merchant_id);


CREATE INDEX IF NOT EXISTS
  idx_products_shop_id
ON public.products(shop_id);


-- ============================================================
-- 4. SHOPS — PRÉSERVER LES AUTRES PÔLES
-- ============================================================
--
-- La migration Marketplace précédente avait supprimé la
-- politique historique :
--
--   Shop supervision staff can view shops
--
-- Nous la recréons avec son périmètre métier initial.
--
-- Marketplace dispose parallèlement de sa propre politique
-- scoped dans 20261006110000.
--
-- Les politiques SELECT étant permissives, les deux périmètres
-- peuvent coexister.
-- ============================================================

DROP POLICY IF EXISTS
  "Shop supervision staff can view shops"
ON public.shops;


CREATE POLICY
  "Shop supervision staff can view shops"
ON public.shops

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle',
      'finance',
      'audit',
      'compliance'
    ]
  )

);


-- ============================================================
-- 5. SHOPS — PRÉSERVER LA MODIFICATION OPS / LIFECYCLE
-- ============================================================
--
-- Marketplace possède sa propre politique UPDATE.
--
-- Cette politique restaure uniquement le périmètre historique
-- Ops / Lifecycle.
-- ============================================================

DROP POLICY IF EXISTS
  "Ops and leadership can update shops"
ON public.shops;


CREATE POLICY
  "Ops and leadership can update shops"
ON public.shops

FOR UPDATE

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle'
    ]
  )

)
WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle'
    ]
  )

);


-- ============================================================
-- 6. PRODUITS — ACCÈS MARKETPLACE SCOPÉ
-- ============================================================
--
-- IMPORTANT :
--
-- Marketplace ne reçoit PAS un accès global aux produits.
--
-- Un produit est accessible seulement si :
--
--   produit.shop_id
--          ↓
--   boutique
--          ↓
--   marchand
--          ↓
--   portefeuille Marketplace du collaborateur
--
-- Les autres pôles conservent leurs propres politiques.
-- ============================================================

DROP POLICY IF EXISTS
  "Marketplace users can view assigned products"
ON public.products;


CREATE POLICY
  "Marketplace users can view assigned products"
ON public.products

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    products.shop_id IS NOT NULL

    AND public.user_has_marketplace_shop(
      auth.uid(),
      products.shop_id
    )
  )

);


-- ============================================================
-- 7. DOCUMENTATION
-- ============================================================

COMMENT ON POLICY
  "Marketplace users can view assigned products"
ON public.products
IS
'Marketplace peut consulter les produits uniquement lorsqu’ils appartiennent à une boutique rattachée à un marchand de son portefeuille. La conformité produit reste hors du périmètre Marketplace.';


-- ============================================================
-- FIN
-- ============================================================
