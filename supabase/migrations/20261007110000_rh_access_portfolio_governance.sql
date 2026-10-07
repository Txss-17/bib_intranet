-- ============================================================
-- BIB INTRANET
-- RH — GOUVERNANCE DES AFFECTATIONS DE PORTEFEUILLES
-- ============================================================
--
-- Objectif :
--
--   Sécuriser au niveau PostgreSQL l'affectation d'un
--   collaborateur à un portefeuille métier.
--
-- Architecture :
--
--   RH
--    ↓
--   profiles
--    ↓
--   access_portfolio_assignments
--    ↓
--   access_business_portfolios
--    ↓
--   access_portfolio_types
--
-- Règles :
--
--   1. Collaborateur cible :
--        hr_status = active
--        OU
--        hr_status = onboarding
--
--   2. Supplier :
--        pôle supplier
--        +
--        position supplier_manager
--
--   3. Marketplace :
--        pôle marketplace
--
--   4. Direction / admin :
--        accès global
--
--   5. Aucun DELETE :
--        révocation par changement de statut.
--
-- IMPORTANT :
-- Les policies PostgreSQL étant cumulatives (OR entre policies
-- permissives), les anciennes policies trop larges doivent être
-- supprimées avant de recréer les policies gouvernées.
-- ============================================================


-- ============================================================
-- 1. FONCTION CENTRALE DE VALIDATION
-- ============================================================
--
-- Cette fonction valide le COLLABORATEUR CIBLE et le TYPE
-- DE PORTEFEUILLE.
--
-- Elle ne détermine pas qui a le droit d'effectuer l'opération.
-- Cette responsabilité reste dans les policies.
--
-- ============================================================

CREATE OR REPLACE FUNCTION public.rh_can_assign_employee_portfolio(
  p_employee_id uuid,
  p_portfolio_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p

    INNER JOIN public.access_business_portfolios abp
      ON abp.id = p_portfolio_id

    INNER JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id

    WHERE p.id = p_employee_id

      -- ------------------------------------------------------
      -- Le collaborateur doit être exploitable par RH.
      -- ------------------------------------------------------
      AND p.hr_status IN (
        'active',
        'onboarding'
      )

      -- ------------------------------------------------------
      -- Le portefeuille doit être actif.
      -- ------------------------------------------------------
      AND abp.status = 'active'

      AND apt.status = 'active'

      -- ------------------------------------------------------
      -- SUPPLIER
      --
      -- Le portefeuille fournisseur n'est attribuable qu'à un
      -- collaborateur appartenant au pôle supplier ET occupant
      -- le poste supplier_manager.
      -- ------------------------------------------------------
      AND (
        (
          apt.portfolio_type_key = 'supplier'

          AND 'supplier' = ANY(
            COALESCE(
              p.poles,
              ARRAY[]::text[]
            )
          )

          AND p.position = 'supplier_manager'
        )

        OR

        -- ----------------------------------------------------
        -- MARKETPLACE
        --
        -- Aucun marketplace_manager n'est inventé ici :
        -- ce poste n'existe pas actuellement dans le catalogue
        -- des positions BIB.
        --
        -- Pour le MVP, l'appartenance au pôle Marketplace
        -- constitue le périmètre métier.
        -- ----------------------------------------------------
        (
          apt.portfolio_type_key = 'marketplace_merchant'

          AND 'marketplace' = ANY(
            COALESCE(
              p.poles,
              ARRAY[]::text[]
            )
          )
        )

        OR

        -- ----------------------------------------------------
        -- Futurs types de portefeuille transversaux.
        --
        -- Aucun autre type n'est autorisé implicitement.
        -- ----------------------------------------------------
        false
      )
  );
$$;


-- ============================================================
-- 2. SÉCURISATION DE LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.rh_can_assign_employee_portfolio(uuid, uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.rh_can_assign_employee_portfolio(uuid, uuid)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.rh_can_assign_employee_portfolio(uuid, uuid)
TO authenticated;


-- ============================================================
-- 3. SUPPRESSION DES POLICIES TROP LARGES
-- ============================================================
--
-- Les policies précédentes pouvaient autoriser :
--
--   RH actif/onboarding → n'importe quel portefeuille
--
-- ou :
--
--   utilisateur du pôle supplier → n'importe quel collaborateur
--
-- Elles sont supprimées afin que la validation métier
-- ci-dessus devienne obligatoire.
-- ============================================================


-- ------------------------------------------------------------
-- access_portfolio_assignments
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_rh"
ON public.access_portfolio_assignments;

DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_rh"
ON public.access_portfolio_assignments;

DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_supplier"
ON public.access_portfolio_assignments;

DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_supplier"
ON public.access_portfolio_assignments;


-- ------------------------------------------------------------
-- access_business_portfolios
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
  "access_business_portfolios_insert_supplier"
ON public.access_business_portfolios;

DROP POLICY IF EXISTS
  "access_business_portfolios_update_supplier"
ON public.access_business_portfolios;


-- ============================================================
-- 4. NOUVELLE POLICY RH — INSERT
-- ============================================================
--
-- RH peut créer une affectation uniquement si :
--
--   - RH possède les droits d'administration des accès
--   - OU Direction
--   - ET la combinaison collaborateur + portefeuille est valide.
--
-- ============================================================

CREATE POLICY
  "access_portfolio_assignments_insert_rh_governed"
ON public.access_portfolio_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.is_leadership(auth.uid())

    OR public.has_role(
      auth.uid(),
      'admin'::public.app_role
    )

    OR public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
  )

  AND public.rh_can_assign_employee_portfolio(
    employee_id,
    portfolio_id
  )
);


-- ============================================================
-- 5. NOUVELLE POLICY RH — UPDATE
-- ============================================================
--
-- L'UPDATE sert notamment à :
--
--   - révoquer ;
--   - suspendre ;
--   - modifier les dates ;
--   - modifier le motif.
--
-- Aucun DELETE n'est nécessaire.
--
-- La combinaison cible + portefeuille reste contrôlée.
--
-- ============================================================

CREATE POLICY
  "access_portfolio_assignments_update_rh_governed"
ON public.access_portfolio_assignments
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
    ARRAY['rh']
  )
)
WITH CHECK (
  (
    public.is_leadership(auth.uid())

    OR public.has_role(
      auth.uid(),
      'admin'::public.app_role
    )

    OR public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
  )

  AND public.rh_can_assign_employee_portfolio(
    employee_id,
    portfolio_id
  )
);


-- ============================================================
-- 6. ACCESS_BUSINESS_PORTFOLIOS — INSERT
-- ============================================================
--
-- La création du registre transversal reste possible pour :
--
--   - Direction
--   - admin
--   - pôle Supplier pour les portefeuilles Supplier
--
-- Mais jamais pour créer arbitrairement un autre type de
-- portefeuille depuis le périmètre Supplier.
-- ============================================================

CREATE POLICY
  "access_business_portfolios_insert_supplier_governed"
ON public.access_business_portfolios
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['supplier']
    )

    AND EXISTS (
      SELECT 1
      FROM public.access_portfolio_types apt
      WHERE apt.id = portfolio_type_id
        AND apt.portfolio_type_key = 'supplier'
        AND apt.status = 'active'
    )
  )
);


-- ============================================================
-- 7. ACCESS_BUSINESS_PORTFOLIOS — UPDATE
-- ============================================================

CREATE POLICY
  "access_business_portfolios_update_supplier_governed"
ON public.access_business_portfolios
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['supplier']
    )

    AND EXISTS (
      SELECT 1
      FROM public.access_portfolio_types apt
      WHERE apt.id = access_business_portfolios.portfolio_type_id
        AND apt.portfolio_type_key = 'supplier'
        AND apt.status = 'active'
    )
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())

  OR (
    public.has_any_pole(
      auth.uid(),
      ARRAY['supplier']
    )

    AND EXISTS (
      SELECT 1
      FROM public.access_portfolio_types apt
      WHERE apt.id = access_business_portfolios.portfolio_type_id
        AND apt.portfolio_type_key = 'supplier'
        AND apt.status = 'active'
    )
  )
);


-- ============================================================
-- 8. PAS DE DELETE
-- ============================================================
--
-- Intentionnel.
--
-- Un portefeuille ou une affectation ne doit pas disparaître
-- de l'historique métier.
--
-- Pour une affectation :
--
--   active
--      ↓
--   revoked
--
-- avec ends_at.
--
-- ============================================================


-- ============================================================
-- 9. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION
  public.rh_can_assign_employee_portfolio(uuid, uuid)
IS
'Valide qu''un collaborateur RH actif/onboarding peut recevoir le portefeuille métier demandé. Supplier exige le pôle supplier + position supplier_manager. Marketplace exige le pôle marketplace.';


COMMENT ON TABLE
  public.access_portfolio_assignments
IS
'Affectations collaborateur → portefeuille métier. Les affectations sont révocables mais non supprimables afin de conserver l''historique RH/RBAC.';


-- ============================================================
-- FIN
-- ============================================================
