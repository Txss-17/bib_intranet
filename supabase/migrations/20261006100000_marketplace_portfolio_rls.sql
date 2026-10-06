-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — PORTEFEUILLES MARCHANDS / RLS
-- ============================================================
--
-- OBJECTIF
--
-- Direction / administrateurs :
--   accès global.
--
-- Responsable Marketplace :
--   administration des portefeuilles Marketplace.
--
-- Collaborateur Marketplace :
--   accès uniquement aux ressources des portefeuilles auxquels
--   il est effectivement affecté.
--
-- Architecture :
--
--   auth.users.id
--        =
--   profiles.id
--        =
--   access_portfolio_assignments.employee_id
--
--   access_portfolio_assignments
--        ↓
--   access_business_portfolios
--        ↓
--   access_portfolio_types
--        ↓
--   merchant_portfolios
--
-- IMPORTANT :
--
-- merchant_portfolio_assignments
--   = marchand → portefeuille
--
-- access_portfolio_assignments
--   = collaborateur → portefeuille
--
-- Ces deux relations restent distinctes.
-- ============================================================


-- ============================================================
-- 1. VÉRIFICATION D'APPARTENANCE À UN PORTEFEUILLE MARKETPLACE
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_marketplace_portfolio(
  p_user_id uuid,
  p_portfolio_id uuid
)
RETURNS boolean
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

        AND apt.business_pole = 'marketplace'

        AND apt.portfolio_type_key = 'marketplace_merchant'

        AND abp.source_id = p_portfolio_id

        AND abp.status = 'active'
    );
$$;


-- ============================================================
-- 2. ADMINISTRATION DES PORTEFEUILLES MARKETPLACE
-- ============================================================
--
-- Cette fonction est volontairement isolée.
--
-- Elle permet actuellement :
--   - Direction
--   - administrateurs
--   - responsable / manager Marketplace
--
-- La logique métier du rôle sera progressivement centralisée
-- dans le moteur RBAC.
--
-- Pour l'instant, on conserve la compatibilité avec le modèle
-- de profils existant.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_can_manage_marketplace_portfolios(
  p_user_id uuid
)
RETURNS boolean
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
      FROM public.profiles p

      WHERE p.id = p_user_id

        AND 'marketplace' = ANY(
          COALESCE(
            p.poles,
            ARRAY[]::text[]
          )
        )

        AND (
          p.position ILIKE '%responsable%'
          OR p.position ILIKE '%manager%'
          OR p.position ILIKE '%direction%'
        )
    );
$$;


-- ============================================================
-- 3. SÉCURISATION DES FONCTIONS
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_marketplace_portfolio(uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_marketplace_portfolio(uuid)
FROM anon;


GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_portfolio(uuid)
TO authenticated;


REVOKE ALL
ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
FROM anon;


GRANT EXECUTE
ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
TO authenticated;


-- ============================================================
-- 4. merchant_portfolios
-- ============================================================
--
-- Lecture :
--   Direction / admin
--   OU collaborateur affecté au portefeuille.
--
-- Administration :
--   Direction / admin / responsable Marketplace.
--
-- ============================================================

DROP POLICY IF EXISTS
  "Marketplace portfolios read"
ON public.merchant_portfolios;

DROP POLICY IF EXISTS
  "Marketplace portfolios manage"
ON public.merchant_portfolios;

DROP POLICY IF EXISTS
  "Marketplace portfolios read scoped"
ON public.merchant_portfolios;

DROP POLICY IF EXISTS
  "Marketplace portfolios manage scoped"
ON public.merchant_portfolios;


CREATE POLICY
  "Marketplace portfolios read scoped"
ON public.merchant_portfolios
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.user_has_marketplace_portfolio(
    auth.uid(),
    id
  )
);


CREATE POLICY
  "Marketplace portfolios manage scoped"
ON public.merchant_portfolios
FOR ALL
TO authenticated
USING (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )
)
WITH CHECK (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )
);


-- ============================================================
-- 5. merchant_portfolio_assignments
-- ============================================================
--
-- Cette table représente :
--
--   marchand → portefeuille
--
-- Un collaborateur ne peut consulter que les affectations
-- des portefeuilles auxquels il est affecté.
--
-- Seuls les responsables autorisés peuvent modifier ces
-- affectations.
-- ============================================================

DROP POLICY IF EXISTS
  "Marketplace portfolio assignments read"
ON public.merchant_portfolio_assignments;

DROP POLICY IF EXISTS
  "Marketplace portfolio assignments manage"
ON public.merchant_portfolio_assignments;

DROP POLICY IF EXISTS
  "Marketplace portfolio assignments read scoped"
ON public.merchant_portfolio_assignments;

DROP POLICY IF EXISTS
  "Marketplace portfolio assignments manage scoped"
ON public.merchant_portfolio_assignments;


CREATE POLICY
  "Marketplace portfolio assignments read scoped"
ON public.merchant_portfolio_assignments
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR public.user_has_marketplace_portfolio(
    auth.uid(),
    portfolio_id
  )
);


CREATE POLICY
  "Marketplace portfolio assignments manage scoped"
ON public.merchant_portfolio_assignments
FOR ALL
TO authenticated
USING (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )
)
WITH CHECK (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )
);


-- ============================================================
-- 6. COMMUNICATIONS MARCHANDS
-- ============================================================
--
-- Les communications rattachées à un portefeuille suivent
-- le même périmètre que le portefeuille.
--
-- Une communication sans portfolio_id n'est PAS accessible
-- par un simple collaborateur Marketplace.
--
-- Direction / admin conservent l'accès global.
-- ============================================================

DROP POLICY IF EXISTS
  "Merchant communications read"
ON public.merchant_communications;

DROP POLICY IF EXISTS
  "Merchant communications manage"
ON public.merchant_communications;

DROP POLICY IF EXISTS
  "Merchant communications read scoped"
ON public.merchant_communications;

DROP POLICY IF EXISTS
  "Merchant communications manage scoped"
ON public.merchant_communications;


CREATE POLICY
  "Merchant communications read scoped"
ON public.merchant_communications
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::public.app_role
  )

  OR (
    portfolio_id IS NOT NULL

    AND public.user_has_marketplace_portfolio(
      auth.uid(),
      portfolio_id
    )
  )
);


CREATE POLICY
  "Merchant communications manage scoped"
ON public.merchant_communications
FOR ALL
TO authenticated
USING (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )

  OR (
    portfolio_id IS NOT NULL

    AND public.user_has_marketplace_portfolio(
      auth.uid(),
      portfolio_id
    )
  )
)
WITH CHECK (
  public.user_can_manage_marketplace_portfolios(
    auth.uid()
  )

  OR (
    portfolio_id IS NOT NULL

    AND public.user_has_marketplace_portfolio(
      auth.uid(),
      portfolio_id
    )
  )
);


-- ============================================================
-- 7. DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN public.merchant_portfolios.owner_id IS
'Responsable métier éventuel du portefeuille. Ne constitue pas le périmètre RBAC collaborateur.';


COMMENT ON FUNCTION public.user_has_marketplace_portfolio(uuid)
IS
'Vérifie si un collaborateur possède une affectation active au portefeuille métier Marketplace demandé.';


COMMENT ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
IS
'Vérifie si un utilisateur peut administrer les portefeuilles Marketplace. Les permissions RBAC fines restent complémentaires.';


-- ============================================================
-- FIN
-- ============================================================
