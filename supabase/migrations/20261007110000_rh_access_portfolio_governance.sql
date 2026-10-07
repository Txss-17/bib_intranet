-- ============================================================
-- BIB INTRANET
-- GOUVERNANCE RH DES AFFECTATIONS DE PORTEFEUILLES
-- ============================================================
--
-- Objectif :
--
--   RH peut affecter un collaborateur à un portefeuille,
--   mais uniquement si le collaborateur est autorisé
--   à recevoir ce type de portefeuille.
--
-- Règles :
--
--   1. Collaborateur :
--      hr_status = active ou onboarding
--
--   2. Portefeuille fournisseur :
--      pôle supplier
--      ET position supplier_manager
--
--   3. Portefeuille Marketplace :
--      pôle marketplace
--
--   4. Aucun DELETE :
--      la révocation passe par assignment_status = revoked
--
--   5. Une révocation reste possible même si le collaborateur
--      est ensuite en congé, suspendu, en départ ou archivé.
--
--   6. Les pôles métier restent propriétaires de leurs
--      portefeuilles métier.
--
-- ============================================================


-- ============================================================
-- 1. FONCTION DE VALIDATION D'UNE NOUVELLE AFFECTATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.rh_can_assign_employee_portfolio(
  p_employee_id UUID,
  p_portfolio_id UUID
)
RETURNS BOOLEAN
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

      -- Collaborateur autorisé à recevoir une nouvelle affectation
      AND p.hr_status IN (
        'active',
        'onboarding'
      )

      -- Portefeuille actif
      AND abp.status = 'active'

      -- Type de portefeuille actif
      AND apt.status = 'active'

      AND (
        -- ======================================================
        -- FOURNISSEURS
        -- ======================================================

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

        -- ======================================================
        -- MARKETPLACE
        -- ======================================================

        (
          apt.portfolio_type_key = 'marketplace_merchant'

          AND 'marketplace' = ANY(
            COALESCE(
              p.poles,
              ARRAY[]::text[]
            )
          )
        )
      )
  );
$$;


-- ============================================================
-- 2. SÉCURITÉ DE LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.rh_can_assign_employee_portfolio(
  UUID,
  UUID
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.rh_can_assign_employee_portfolio(
  UUID,
  UUID
)
TO authenticated;


-- ============================================================
-- 3. TRIGGER DE PROTECTION DES MODIFICATIONS
-- ============================================================
--
-- Important :
--
-- Une révocation doit rester possible même si le collaborateur
-- n'est plus active/onboarding.
--
-- On ne peut donc PAS mettre simplement
-- rh_can_assign_employee_portfolio()
-- dans le WITH CHECK de toutes les UPDATE.
--
-- Le trigger vérifie uniquement le couple
-- employee_id + portfolio_id lorsqu'il est modifié.
--
-- Une simple modification :
--
--   assignment_status = revoked
--   ends_at = ...
--
-- reste donc toujours possible.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_access_portfolio_assignment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN

  -- Si le collaborateur ou le portefeuille change,
  -- le nouveau couple doit être juridiquement/métierement valide.
  IF
    NEW.employee_id IS DISTINCT FROM OLD.employee_id
    OR
    NEW.portfolio_id IS DISTINCT FROM OLD.portfolio_id
  THEN

    IF NOT public.rh_can_assign_employee_portfolio(
      NEW.employee_id,
      NEW.portfolio_id
    )
    THEN
      RAISE EXCEPTION
        'Affectation portefeuille non autorisée pour ce collaborateur';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_validate_access_portfolio_assignment_update
ON public.access_portfolio_assignments;


CREATE TRIGGER
  trg_validate_access_portfolio_assignment_update

BEFORE UPDATE
ON public.access_portfolio_assignments

FOR EACH ROW

EXECUTE FUNCTION
  public.validate_access_portfolio_assignment_update();


-- ============================================================
-- 4. SUPPRESSION DES POLICIES RH TROP LARGES
-- ============================================================

DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_rh"
ON public.access_portfolio_assignments;


DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_rh"
ON public.access_portfolio_assignments;


-- ============================================================
-- 5. SUPPRESSION DES POLICIES FOURNISSEURS TROP LARGES
-- ============================================================

DROP POLICY IF EXISTS
  "access_portfolio_assignments_insert_supplier"
ON public.access_portfolio_assignments;


DROP POLICY IF EXISTS
  "access_portfolio_assignments_update_supplier"
ON public.access_portfolio_assignments;


-- ============================================================
-- 6. NOUVELLE POLICY INSERT
-- ============================================================
--
-- RH / Direction / Admin peuvent créer une affectation,
-- mais la cible doit passer par la fonction de gouvernance.
--
-- Le pôle Fournisseurs peut également créer une affectation
-- fournisseur, avec exactement les mêmes règles métier.
--
-- ============================================================

CREATE POLICY
  "access_portfolio_assignments_insert_governed"

ON public.access_portfolio_assignments

FOR INSERT

TO authenticated

WITH CHECK (

  (
    public.is_leadership(auth.uid())
    OR
    public.has_role(
      auth.uid(),
      'admin'::app_role
    )
    OR
    public.has_any_pole(
      auth.uid(),
      ARRAY['rh']
    )
    OR
    public.has_any_pole(
      auth.uid(),
      ARRAY['supplier']
    )
  )

  AND

  public.rh_can_assign_employee_portfolio(
    employee_id,
    portfolio_id
  )
);


-- ============================================================
-- 7. NOUVELLE POLICY UPDATE
-- ============================================================
--
-- RH / Direction / Admin / Fournisseurs peuvent modifier
-- une affectation existante.
--
-- Le trigger ci-dessus empêche de détourner l'affectation
-- vers un autre collaborateur ou un autre portefeuille
-- non autorisé.
--
-- La révocation reste donc possible même après changement
-- de statut RH.
--
-- ============================================================

CREATE POLICY
  "access_portfolio_assignments_update_governed"

ON public.access_portfolio_assignments

FOR UPDATE

TO authenticated

USING (

  public.is_leadership(auth.uid())

  OR
  public.has_role(
    auth.uid(),
    'admin'::app_role
  )

  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )

  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
)

WITH CHECK (

  public.is_leadership(auth.uid())

  OR
  public.has_role(
    auth.uid(),
    'admin'::app_role
  )

  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )

  OR
  public.has_any_pole(
    auth.uid(),
    ARRAY['supplier']
  )
);


-- ============================================================
-- 8. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION
  public.rh_can_assign_employee_portfolio(
    UUID,
    UUID
  )
IS
'Vérifie qu''un collaborateur actif ou en onboarding peut recevoir le portefeuille métier demandé selon son pôle et son poste. Fournisseurs : supplier + supplier_manager. Marketplace : pôle marketplace.';


COMMENT ON FUNCTION
  public.validate_access_portfolio_assignment_update()
IS
'Empêche de déplacer une affectation existante vers un collaborateur ou portefeuille non autorisé, tout en permettant la révocation historique.';


-- ============================================================
-- FIN
-- ============================================================
