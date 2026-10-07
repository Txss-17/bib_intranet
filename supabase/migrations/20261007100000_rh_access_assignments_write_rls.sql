-- ============================================================
-- BIB INTRANET
-- RH — GESTION DES AFFECTATIONS D'ACCÈS
--
-- Gouvernance :
--
-- RH
--   -> affecte un rôle à un collaborateur
--   -> affecte un périmètre métier à un collaborateur
--
-- Security & IT
--   -> définit les rôles
--   -> définit les permissions
--   -> définit les interfaces
--   -> définit les actions
--   -> définit les scopes techniques
--
-- Les pôles métier restent propriétaires de leurs données métier.
-- ============================================================


-- ============================================================
-- 1. LECTURE DES PORTEFEUILLES MÉTIER PAR RH
-- ============================================================

DROP POLICY IF EXISTS
  "access_business_portfolios_select_rh"
ON public.access_business_portfolios;

CREATE POLICY
  "access_business_portfolios_select_rh"
ON public.access_business_portfolios
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
  OR EXISTS (
    SELECT 1
    FROM public.access_portfolio_assignments apa
    WHERE apa.portfolio_id = access_business_portfolios.id
      AND apa.employee_id = auth.uid()
  )
);


-- ============================================================
-- 2. CRÉATION D'UNE AFFECTATION DE RÔLE
-- ============================================================

DROP POLICY IF EXISTS
  "access_assignments_insert_rh"
ON public.access_assignments;

CREATE POLICY
  "access_assignments_insert_rh"
ON public.access_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = employee_id
        AND COALESCE(p.hr_status, 'active') IN (
          'active',
          'onboarding'
        )
    )
  )
);


-- ============================================================
-- 3. MODIFICATION D'UNE AFFECTATION DE RÔLE
-- ============================================================

DROP POLICY IF EXISTS
  "access_assignments_update_rh"
ON public.access_assignments;

CREATE POLICY
  "access_assignments_update_rh"
ON public.access_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = employee_id
        AND COALESCE(p.hr_status, 'active') IN (
          'active',
          'onboarding'
        )
    )
  )
);


-- ============================================================
-- 4. CRÉATION D'UNE AFFECTATION DE PORTEFEUILLE
-- ============================================================

DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_rh"
ON public.access_portfolio_assignments;

CREATE POLICY
  "access_portfolio_assignments_insert_rh"
ON public.access_portfolio_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = employee_id
        AND COALESCE(p.hr_status, 'active') IN (
          'active',
          'onboarding'
        )
    )
  )
);


-- ============================================================
-- 5. MODIFICATION D'UNE AFFECTATION DE PORTEFEUILLE
-- ============================================================

DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_rh"
ON public.access_portfolio_assignments;

CREATE POLICY
  "access_portfolio_assignments_update_rh"
ON public.access_portfolio_assignments
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
);


-- ============================================================
-- 6. AUDIT
--
-- Pas de DELETE.
-- Une révocation doit être matérialisée par :
--
--   status = 'revoked'
--
-- ou :
--
--   assignment_status = 'revoked'
--
-- afin de conserver l'historique.
-- ============================================================

COMMENT ON POLICY
  "access_assignments_insert_rh"
ON public.access_assignments IS
'RH peut affecter un rôle d''accès à un collaborateur actif ou en onboarding.';

COMMENT ON POLICY
  "access_portfolio_assignments_insert_rh"
ON public.access_portfolio_assignments IS
'RH peut affecter un collaborateur à un portefeuille métier sans devenir propriétaire du portefeuille.';


-- ============================================================
-- FIN
-- ============================================================
