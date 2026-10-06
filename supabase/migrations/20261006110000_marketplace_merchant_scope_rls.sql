-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — RLS DES MARCHANDS ET BOUTIQUES
--
-- OBJECTIF
--
-- Le portefeuille Marketplace doit réellement limiter les
-- données accessibles au collaborateur.
--
-- Architecture :
--
--   collaborateur
--        ↓
--   access_portfolio_assignments
--        ↓
--   access_business_portfolios
--        ↓
--   merchant_portfolios
--        ↓
--   merchant_portfolio_assignments
--        ↓
--   user_accounts (marchand)
--        ↓
--   shops (boutiques)
--
-- IMPORTANT :
--
-- merchant_portfolio_assignments
--     = marchand -> portefeuille
--
-- access_portfolio_assignments
--     = collaborateur -> portefeuille
--
-- Ces deux relations restent distinctes.
--
-- IMPORTANT :
--
-- La création d'une boutique ne se fait PAS dans l'Intranet.
-- Le marchand crée sa boutique depuis BIB Platform.
--
-- Marketplace peut donc consulter et gérer les boutiques
-- qui lui sont attribuées, mais cette migration ne lui donne
-- pas le droit de créer une boutique.
--
-- ============================================================


-- ============================================================
-- 1. FONCTION :
--    LE COLLABORATEUR A-T-IL ACCÈS À CE MARCHAND ?
-- ============================================================
--
-- p_user_id      = auth.users.id = profiles.id
-- p_merchant_id  = user_accounts.id
--
-- Le marchand est visible si :
--
--   - Direction/Admin
--   OU
--   - le collaborateur possède une affectation active vers
--     un portefeuille Marketplace
--   ET
--   - le marchand est actuellement affecté à ce portefeuille.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_merchant(
  p_user_id UUID,
  p_merchant_id UUID
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

      FROM public.access_portfolio_assignments apa

      INNER JOIN public.access_business_portfolios abp
        ON abp.id = apa.portfolio_id

      INNER JOIN public.access_portfolio_types apt
        ON apt.id = abp.portfolio_type_id

      INNER JOIN public.merchant_portfolio_assignments mpa
        ON mpa.portfolio_id = abp.source_id

      WHERE apa.employee_id = p_user_id

        AND apa.assignment_status = 'active'

        AND (
          apa.starts_at IS NULL
          OR apa.starts_at <= now()
        )

        AND (
          apa.ends_at IS NULL
          OR apa.ends_at >= now()
        )

        AND abp.status = 'active'

        AND apt.status = 'active'

        AND apt.business_pole = 'marketplace'

        AND apt.portfolio_type_key = 'marketplace_merchant'

        AND mpa.merchant_id = p_merchant_id

        AND mpa.ended_at IS NULL
    );
$$;


-- ============================================================
-- 2. SÉCURISATION DE LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_merchant(
  UUID,
  UUID
)
FROM PUBLIC;


REVOKE ALL
ON FUNCTION public.user_has_marketplace_merchant(
  UUID,
  UUID
)
FROM anon;


GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_merchant(
  UUID,
  UUID
)
TO authenticated;


COMMENT ON FUNCTION public.user_has_marketplace_merchant(
  UUID,
  UUID
)
IS
'Détermine si un collaborateur peut accéder à un marchand Marketplace selon son affectation active à un portefeuille métier.';


-- ============================================================
-- 3. INDEX DE PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_merchant_portfolio_assignments_active_merchant_portfolio
ON public.merchant_portfolio_assignments(
  merchant_id,
  portfolio_id
)
WHERE ended_at IS NULL;


CREATE INDEX IF NOT EXISTS
  idx_access_portfolio_assignments_active_employee_portfolio
ON public.access_portfolio_assignments(
  employee_id,
  portfolio_id
)
WHERE assignment_status = 'active';


CREATE INDEX IF NOT EXISTS
  idx_access_business_portfolios_type_source
ON public.access_business_portfolios(
  portfolio_type_id,
  source_id
);


-- ============================================================
-- 4. USER_ACCOUNTS
--
-- user_accounts contient les marchands.
--
-- AVANT :
--   tout utilisateur authentifié pouvait lire tous les
--   user_accounts.
--
-- APRÈS :
--   Direction/Admin -> tous
--   Marketplace     -> uniquement ses marchands
--   autres pôles    -> pas d'accès par cette politique
--
-- ============================================================

ALTER TABLE public.user_accounts
  ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- Suppression des anciennes politiques générales
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Authenticated users can view user accounts"
ON public.user_accounts;


DROP POLICY IF EXISTS
  "Managers and admins can manage user accounts"
ON public.user_accounts;


-- ------------------------------------------------------------
-- Lecture des marchands
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can view assigned merchants"
ON public.user_accounts

FOR SELECT

TO authenticated

USING (

  public.user_has_marketplace_merchant(
    auth.uid(),
    user_accounts.id
  )

);


-- ------------------------------------------------------------
-- Gestion des marchands
--
-- Cette politique conserve un accès de gestion pour :
--
--   - Direction
--   - Admin
--   - collaborateurs Marketplace
--     sur leurs marchands uniquement
--
-- La logique fine rôle/action sera ensuite portée par le RBAC
-- central. Ici, on garantit d'abord le périmètre de données.
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can manage assigned merchants"
ON public.user_accounts

FOR UPDATE

TO authenticated

USING (

  public.user_has_marketplace_merchant(
    auth.uid(),
    user_accounts.id
  )

)

WITH CHECK (

  public.user_has_marketplace_merchant(
    auth.uid(),
    user_accounts.id
  )

);


-- ------------------------------------------------------------
-- INSERT
--
-- Un marchand n'est pas créé depuis cette interface.
-- Le marchand est issu du parcours BIB Platform.
--
-- Les créations backend restent réservées aux processus
-- serveur / service_role.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can create merchants"
ON public.user_accounts;


-- ------------------------------------------------------------
-- DELETE
--
-- Suppression physique d'un marchand :
-- uniquement processus administratifs/backend.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Marketplace users can delete merchants"
ON public.user_accounts;


-- ============================================================
-- 5. SHOPS
--
-- Une boutique appartient à un marchand via :
--
--   shops.merchant_id -> user_accounts.id
--
-- Le collaborateur Marketplace voit donc uniquement les
-- boutiques appartenant à ses marchands.
--
-- ============================================================

ALTER TABLE public.shops
  ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- Ancienne politique Marketplace / supervision
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "Shop supervision staff can view shops"
ON public.shops;


-- ------------------------------------------------------------
-- Lecture des boutiques
--
-- Direction/Admin :
--   toutes les boutiques.
--
-- Marketplace :
--   uniquement les boutiques des marchands de son portefeuille.
--
-- Ops / autres pôles :
--   leurs politiques existantes peuvent continuer à s'appliquer
--   si elles sont conservées par d'autres règles RLS.
--
-- IMPORTANT :
-- on ne retire pas ici les politiques Ops existantes.
-- ------------------------------------------------------------

CREATE POLICY
  "Marketplace users can view assigned shops"
ON public.shops

FOR SELECT

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    shops.merchant_id IS NOT NULL

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      shops.merchant_id
    )
  )

);


-- ============================================================
-- 6. MARKETPLACE : MODIFICATION DES BOUTIQUES
--
-- Marketplace peut gérer les boutiques déjà existantes
-- de son portefeuille.
--
-- Cela couvre notamment :
--
--   - validation / suivi du statut
--   - informations d'activité
--   - catégorie
--   - abonnement
--   - informations de suivi Marketplace
--
-- La création initiale de la boutique ne passe PAS par cette
-- politique.
-- ============================================================

DROP POLICY IF EXISTS
  "Ops and leadership can update shops"
ON public.shops;


CREATE POLICY
  "Marketplace users can update assigned shops"
ON public.shops

FOR UPDATE

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    shops.merchant_id IS NOT NULL

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      shops.merchant_id
    )
  )

)

WITH CHECK (

  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    shops.merchant_id IS NOT NULL

    AND public.user_has_marketplace_merchant(
      auth.uid(),
      shops.merchant_id
    )
  )

);


-- ============================================================
-- 7. CRÉATION DES BOUTIQUES
--
-- IMPORTANT :
--
-- Marketplace Intranet NE crée PAS les boutiques.
--
-- Le marchand crée sa boutique dans BIB Platform.
--
-- Ops / lifecycle conserve son mécanisme existant de création
-- si celui-ci est encore utilisé pour des flux internes.
--
-- Aucun INSERT Marketplace n'est ajouté.
-- ============================================================


-- ============================================================
-- 8. SUPPRESSION DES BOUTIQUES
--
-- Marketplace ne supprime pas physiquement les boutiques.
--
-- Le cycle de vie utilise les statuts :
--
--   active
--   inactive
--   suspended
--   closed
--
-- La suppression physique reste réservée aux rôles déjà
-- autorisés par le système existant.
-- ============================================================


-- ============================================================
-- 9. GARANTIE :
--    UNE BOUTIQUE SANS MARCHAND N'EST PAS VISIBLE PAR
--    UN COLLABORATEUR MARKETPLACE
-- ============================================================
--
-- user_has_marketplace_merchant() exige :
--
--   shops.merchant_id IS NOT NULL
--
-- dans la politique Marketplace.
--
-- Une boutique orpheline peut donc continuer à exister pour
-- les traitements administratifs/OPS autorisés, mais elle ne
-- fuit pas dans le portefeuille Marketplace.
--
-- ============================================================


-- ============================================================
-- 10. DOCUMENTATION
-- ============================================================

COMMENT ON POLICY
  "Marketplace users can view assigned merchants"
ON public.user_accounts
IS
'Le pôle Marketplace ne consulte que les marchands appartenant aux portefeuilles auxquels le collaborateur est activement affecté.';


COMMENT ON POLICY
  "Marketplace users can view assigned shops"
ON public.shops
IS
'Le pôle Marketplace ne consulte que les boutiques rattachées à ses marchands affectés.';


COMMENT ON POLICY
  "Marketplace users can update assigned shops"
ON public.shops
IS
'Marketplace peut gérer les boutiques existantes de son périmètre. La création de boutique reste hors Intranet Marketplace.';


-- ============================================================
-- FIN
-- ============================================================
