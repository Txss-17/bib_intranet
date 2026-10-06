-- ============================================================
-- BIB INTRANET
-- MARKETPLACE — PORTEFEUILLES MARCHANDS / RLS
-- ============================================================
--
-- OBJECTIF
--
-- 1. Direction / administrateurs :
--      accès global.
--
-- 2. Responsable Marketplace :
--      administration des portefeuilles Marketplace.
--
-- 3. Collaborateurs Marketplace :
--      accès aux marchands rattachés à leurs portefeuilles.
--
-- 4. Un portefeuille métier ne donne PAS de permission.
--      Il limite le périmètre sur lequel les permissions du rôle
--      peuvent s'exercer.
--
-- 5. merchant_portfolios.owner_id reste une information métier.
--      Il ne constitue PAS le périmètre RBAC.
--
-- 6. L'identité collaborateur repose sur :
--
--      auth.users.id
--           =
--      profiles.id
--           =
--      access_portfolio_assignments.employee_id
--
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
SET search_path = public
AS $$
  SELECT
    public.is_leadership(p_user_id)
    OR public.has_role(
      p_user_id,
      'admin'::app_role
    )
    OR EXISTS (
      SELECT 1
      FROM public.access_portfolio_assignments apa
      INNER JOIN public.access_business_portfolios abp
        ON abp.id = apa.portfolio_id
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
        AND abp.pole = 'marketplace'
        AND abp.source_type = 'merchant_portfolio'
        AND abp.source_id = p_portfolio_id
    );
$$;


-- ============================================================
-- 2. UTILISATEUR AUTORISÉ À ADMINISTRER LES PORTEFEUILLES
-- ============================================================
--
-- L'administration des portefeuilles ne doit pas être accordée
-- automatiquement à tous les collaborateurs Marketplace.
--
-- Direction / administrateurs :
--      accès global.
--
-- Responsable / manager Marketplace :
--      administration métier.
--
-- Les permissions RBAC fines restent complémentaires.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_can_manage_marketplace_portfolios(
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_leadership(p_user_id)
    OR public.has_role(
      p_user_id,
      'admin'::app_role
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


REVOKE ALL
ON FUNCTION public.user_has_marketplace_portfolio(uuid)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.user_has_marketplace_portfolio(uuid)
TO authenticated;


REVOKE ALL
ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
TO authenticated;


-- ============================================================
-- 3. merchant_portfolios
-- ============================================================
--
-- AVANT :
--
--     tout collaborateur Marketplace
--             ↓
--     tous les portefeuilles
--
-- APRÈS :
--
--     collaborateur
--             ↓
--     access_portfolio_assignments
--             ↓
--     access_business_portfolios
--             ↓
--     merchant_portfolios
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
    'admin'::app_role
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
-- 4. merchant_portfolio_assignments
-- ============================================================
--
-- Une affectation signifie :
--
--     marchand → portefeuille
--
-- et NON :
--
--     collaborateur → portefeuille
--
-- L'affectation collaborateur → portefeuille est portée par :
--
--     access_portfolio_assignments
--
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
    'admin'::app_role
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
-- 5. COMMUNICATIONS MARCHANDS
-- ============================================================
--
-- Une communication liée à un portefeuille doit être visible
-- uniquement par :
--
--     - Direction
--     - administrateur
--     - collaborateur affecté au portefeuille
--
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
    'admin'::app_role
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
-- 6. owner_id ≠ périmètre RBAC
-- ============================================================
--
-- owner_id peut identifier le responsable métier du portefeuille.
--
-- Il ne doit jamais être utilisé comme mécanisme d'autorisation.
--
-- Le périmètre collaborateur est déterminé par :
--
--     access_portfolio_assignments
--
-- ============================================================

COMMENT ON COLUMN public.merchant_portfolios.owner_id IS
'Responsable métier éventuel du portefeuille. Ne constitue pas le périmètre RBAC collaborateur.';


COMMENT ON FUNCTION public.user_has_marketplace_portfolio(uuid)
IS
'Vérifie si un collaborateur dispose d''une affectation active au portefeuille métier Marketplace demandé.';


COMMENT ON FUNCTION public.user_can_manage_marketplace_portfolios(uuid)
IS
'Vérifie si un utilisateur peut administrer les portefeuilles Marketplace. Les permissions RBAC fines restent complémentaires.';


-- ============================================================
-- FIN
-- ============================================================
