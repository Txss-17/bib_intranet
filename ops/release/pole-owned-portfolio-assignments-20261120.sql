-- BIB Intranet — séparation de la gouvernance des portefeuilles métier (20/11/2026)
-- Exécuter uniquement après tests sur le schéma Supabase préproduction ciblé.
-- RH conserve l'administration des rôles RH ; les portefeuilles métier sont
-- attribués par le responsable habilité de chaque pôle, jamais par RH seul.
BEGIN;

CREATE OR REPLACE FUNCTION public.bib_can_manage_access_portfolio(p_portfolio_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.access_business_portfolios abp
    JOIN public.access_portfolio_types apt ON apt.id=abp.portfolio_type_id
    JOIN public.profiles p ON p.id=(SELECT auth.uid())
    JOIN public.access_assignments aa ON aa.employee_id=p.id
    JOIN public.access_roles ar ON ar.id=aa.role_id
    WHERE abp.id=p_portfolio_id
      AND abp.status='active' AND apt.status='active'
      AND p.app_origin='connect' AND p.hr_status='active'
      AND p.test_account IS FALSE
      AND apt.business_pole=ANY(COALESCE(p.poles::text[],ARRAY[]::text[]))
      AND aa.status='active' AND ar.status='active'
      AND (aa.starts_at IS NULL OR aa.starts_at<=now())
      AND (aa.ends_at IS NULL OR aa.ends_at>=now())
      AND ar.business_pole=apt.business_pole
      AND ar.seniority='lead'
      AND ar.owner_type='pole_responsible'
      AND coalesce(ar.is_external,false) IS FALSE
      AND (
        (apt.business_pole='supplier' AND ar.role_key IN ('responsable_fournisseurs','responsable_catalogue'))
        OR (apt.business_pole='ops' AND ar.role_key='responsable_logistique')
        OR (apt.business_pole='marketplace' AND ar.role_key='responsable_marketplace')
      )
  );
$$;
REVOKE ALL ON FUNCTION public.bib_can_manage_access_portfolio(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_can_manage_access_portfolio(uuid) TO authenticated,service_role;

-- Une affectation doit respecter le type de portefeuille et le pôle de l'employé.
-- Le catalogue recense « merchant », « supplier » et « shop » en préproduction.
CREATE OR REPLACE FUNCTION public.rh_can_assign_employee_portfolio(p_employee_id uuid,p_portfolio_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
 SELECT EXISTS (
  SELECT 1
  FROM public.profiles p
  JOIN public.access_business_portfolios abp ON abp.id=p_portfolio_id
  JOIN public.access_portfolio_types apt ON apt.id=abp.portfolio_type_id
  WHERE p.id=p_employee_id
    AND p.app_origin='connect' AND p.test_account IS FALSE
    AND p.hr_status IN ('active','onboarding')
    AND abp.status='active' AND apt.status='active'
    AND apt.business_pole=ANY(COALESCE(p.poles::text[],ARRAY[]::text[]))
    AND (
      (apt.portfolio_type_key='supplier' AND p.position='supplier_manager')
      OR (apt.portfolio_type_key='shop' AND p.position='ops_logistics_manager')
      OR (apt.portfolio_type_key='merchant' AND 'marketplace'=ANY(COALESCE(p.poles::text[],ARRAY[]::text[])))
    )
 );
$$;
REVOKE ALL ON FUNCTION public.rh_can_assign_employee_portfolio(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_can_assign_employee_portfolio(uuid,uuid) TO authenticated,service_role;

-- Ne pas laisser la politique catalogue ALL (administrateurs / managers génériques)
-- exposer ou modifier les portefeuilles d'un autre pôle.
CREATE OR REPLACE FUNCTION public.bib_can_manage_access_portfolio_type(p_portfolio_type_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $
  SELECT (SELECT auth.uid()) IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.access_portfolio_types apt
    JOIN public.profiles p ON p.id=(SELECT auth.uid())
    JOIN public.access_assignments aa ON aa.employee_id=p.id
    JOIN public.access_roles ar ON ar.id=aa.role_id
    WHERE apt.id=p_portfolio_type_id
      AND apt.status='active'
      AND p.app_origin='connect' AND p.hr_status='active' AND p.test_account IS FALSE
      AND apt.business_pole=ANY(COALESCE(p.poles::text[], ARRAY[]::text[]))
      AND aa.status='active' AND ar.status='active'
      AND (aa.starts_at IS NULL OR aa.starts_at<=now())
      AND (aa.ends_at IS NULL OR aa.ends_at>=now())
      AND ar.business_pole=apt.business_pole
      AND ar.seniority='lead' AND ar.owner_type='pole_responsible'
      AND coalesce(ar.is_external,false) IS FALSE
      AND (
       (apt.business_pole='supplier' AND ar.role_key IN ('responsable_fournisseurs','responsable_catalogue'))
       OR (apt.business_pole='ops' AND ar.role_key='responsable_logistique')
       OR (apt.business_pole='marketplace' AND ar.role_key='responsable_marketplace')
      )
  );
$;
REVOKE ALL ON FUNCTION public.bib_can_manage_access_portfolio_type(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_can_manage_access_portfolio_type(uuid) TO authenticated,service_role;

-- La Direction générale conserve une visibilité transverse explicite, sans
-- la conférer au seul rôle RH. Le collaborateur ne voit que son propre pôle.
DROP POLICY IF EXISTS "bib_portfolio_catalog_pole_visibility" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_pole_visibility"
ON public.access_business_portfolios AS RESTRICTIVE
FOR SELECT TO authenticated
USING (
  public.is_canonical_bib_ceo((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.access_portfolio_types apt
    JOIN public.profiles me ON me.id=(SELECT auth.uid())
    WHERE apt.id=access_business_portfolios.portfolio_type_id
      AND me.app_origin='connect' AND me.hr_status='active'
      AND me.test_account IS FALSE
      AND apt.business_pole=ANY(COALESCE(me.poles::text[],ARRAY[]::text[]))
  )
);

-- Les responsables métier n'ont pas nécessairement le rôle applicatif générique
-- "manager" ; ajouter une autorisation PERMISSIVE exacte, ensuite bornée par
-- les politiques RESTRICTIVE du même pôle.
DROP POLICY IF EXISTS "bib_portfolio_catalog_manager_insert" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_manager_insert"
ON public.access_business_portfolios
FOR INSERT TO authenticated
WITH CHECK (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

DROP POLICY IF EXISTS "bib_portfolio_catalog_manager_update" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_manager_update"
ON public.access_business_portfolios
FOR UPDATE TO authenticated
USING (public.bib_can_manage_access_portfolio_type(portfolio_type_id))
WITH CHECK (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

DROP POLICY IF EXISTS "bib_portfolio_catalog_manager_delete" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_manager_delete"
ON public.access_business_portfolios
FOR DELETE TO authenticated
USING (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

DROP POLICY IF EXISTS "bib_portfolio_catalog_pole_insert" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_pole_insert"
ON public.access_business_portfolios AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

DROP POLICY IF EXISTS "bib_portfolio_catalog_pole_update" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_pole_update"
ON public.access_business_portfolios AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.bib_can_manage_access_portfolio_type(portfolio_type_id))
WITH CHECK (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

DROP POLICY IF EXISTS "bib_portfolio_catalog_pole_delete" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_pole_delete"
ON public.access_business_portfolios AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.bib_can_manage_access_portfolio_type(portfolio_type_id));

-- Retirer l'ancienne visibilité RH transversale sur les affectations.
DROP POLICY IF EXISTS "Employees read own access_portfolio_assignments" ON public.access_portfolio_assignments;
CREATE POLICY "Employees read own access_portfolio_assignments"
ON public.access_portfolio_assignments
FOR SELECT TO authenticated
USING (employee_id=(SELECT auth.uid()) OR public.bib_can_manage_access_portfolio(portfolio_id));

DROP POLICY IF EXISTS "access_portfolio_assignments_insert_governed" ON public.access_portfolio_assignments;
CREATE POLICY "access_portfolio_assignments_insert_governed"
ON public.access_portfolio_assignments
FOR INSERT TO authenticated
WITH CHECK (
  public.bib_can_manage_access_portfolio(portfolio_id)
  AND public.rh_can_assign_employee_portfolio(employee_id,portfolio_id)
  AND assigned_by=(SELECT auth.uid())
);

DROP POLICY IF EXISTS "access_portfolio_assignments_update_governed" ON public.access_portfolio_assignments;
CREATE POLICY "access_portfolio_assignments_update_governed"
ON public.access_portfolio_assignments
FOR UPDATE TO authenticated
USING (public.bib_can_manage_access_portfolio(portfolio_id))
WITH CHECK (public.bib_can_manage_access_portfolio(portfolio_id));

-- Le trigger existant valide les changements de couple employé/portefeuille.
-- Ajouter l'intégrité de l'auteur d'origine et de la réactivation éventuelle.
CREATE OR REPLACE FUNCTION public.bib_guard_access_portfolio_assignment()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF (SELECT auth.role())='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
   IF NEW.assigned_by IS DISTINCT FROM (SELECT auth.uid())
      OR NOT public.bib_can_manage_access_portfolio(NEW.portfolio_id)
      OR NOT public.rh_can_assign_employee_portfolio(NEW.employee_id,NEW.portfolio_id)
   THEN RAISE EXCEPTION 'pole_manager_assignment_required' USING ERRCODE='42501'; END IF;
 ELSE
   IF NEW.assigned_by IS DISTINCT FROM OLD.assigned_by THEN
     RAISE EXCEPTION 'portfolio_assignment_author_immutable' USING ERRCODE='42501';
   END IF;
   IF NEW.assignment_status='active'
      AND (OLD.assignment_status IS DISTINCT FROM 'active'
        OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
        OR NEW.portfolio_id IS DISTINCT FROM OLD.portfolio_id)
      AND NOT public.rh_can_assign_employee_portfolio(NEW.employee_id,NEW.portfolio_id)
   THEN RAISE EXCEPTION 'portfolio_assignment_target_ineligible' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_bib_guard_access_portfolio_assignment ON public.access_portfolio_assignments;
CREATE TRIGGER trg_bib_guard_access_portfolio_assignment
BEFORE INSERT OR UPDATE ON public.access_portfolio_assignments
FOR EACH ROW EXECUTE FUNCTION public.bib_guard_access_portfolio_assignment();

COMMIT;
