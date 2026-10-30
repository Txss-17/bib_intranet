-- Data & BI domain isolation for BIB Intranet.
-- The old broad SELECT and ALL policies are permissive; restrictive policies
-- below must be ANDed with those policies to prevent Finance -> Marketplace
-- leakage even when a user is a dashboard creator.
-- Apply only after review in staging; there is NO client-only security filter.

ALTER TABLE public.bi_data_sources
  ADD COLUMN IF NOT EXISTS business_pole text,
  ADD COLUMN IF NOT EXISTS business_subsidiary text;

CREATE OR REPLACE FUNCTION public.bib_data_domain_allowed(
  p_pole text,
  p_subsidiary text DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=public,pg_temp
AS $function$
SELECT
  auth.uid() IS NOT NULL
  AND p_pole IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    JOIN public.access_assignments assignment
      ON assignment.employee_id = profile.id
    JOIN public.access_roles role ON role.id = assignment.role_id
    WHERE profile.id = auth.uid()
      AND profile.test_account IS FALSE
      AND profile.app_origin = 'connect'
      AND profile.hr_status = 'active'
      AND role.status = 'active'
      AND assignment.status = 'active'
      AND (assignment.starts_at IS NULL OR assignment.starts_at <= now())
      AND (assignment.ends_at IS NULL OR assignment.ends_at >= now())
      AND coalesce(role.is_external,false) IS FALSE
      AND (p_subsidiary IS NULL OR p_subsidiary = profile.subsidiary)
      AND (
        (role.role_key='ceo' AND EXISTS(
          SELECT 1 FROM public.access_role_scopes ars
          JOIN public.access_scopes s ON s.id=ars.scope_id
          WHERE ars.role_id=role.id AND s.scope_key='global'
        ))
        OR (
          p_pole=ANY(profile.poles::text[])
          AND (
            role.business_pole=p_pole
            OR EXISTS(
              SELECT 1 FROM public.access_role_scopes ars
              JOIN public.access_scopes s ON s.id=ars.scope_id
              WHERE ars.role_id=role.id AND s.scope_key='pole'
                AND ars.scope_value=p_pole
            )
          )
        )
      )
  );
$function$;

REVOKE ALL ON FUNCTION public.bib_data_domain_allowed(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_data_domain_allowed(text,text) TO authenticated;

-- BI dashboards: must have a domain that user may read. Existing unclassified
-- dashboards remain owner-only, not shared across poles.
CREATE POLICY bi_dashboards_domain_guard ON public.bi_dashboards
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    (pole_id IS NOT NULL AND target_filiale IS NOT NULL AND public.bib_data_domain_allowed(pole_id,target_filiale))
    OR ((pole_id IS NULL OR target_filiale IS NULL) AND owner_id=auth.uid())
  );

CREATE POLICY bi_dashboards_domain_write_guard ON public.bi_dashboards
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    (pole_id IS NOT NULL AND target_filiale IS NOT NULL AND public.bib_data_domain_allowed(pole_id,target_filiale))
    OR (pole_id IS NULL AND owner_id=auth.uid())
  )
  WITH CHECK (
    (pole_id IS NOT NULL AND target_filiale IS NOT NULL AND public.bib_data_domain_allowed(pole_id,target_filiale))
    OR (pole_id IS NULL AND owner_id=auth.uid())
  );

-- Every widget inherits exactly its parent dashboard's domain.
CREATE POLICY bi_widgets_domain_guard ON public.bi_dashboard_widgets
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bi_dashboards d
      WHERE d.id=bi_dashboard_widgets.dashboard_id
        AND (
          (d.pole_id IS NOT NULL AND d.target_filiale IS NOT NULL AND public.bib_data_domain_allowed(d.pole_id,d.target_filiale))
          OR ((d.pole_id IS NULL OR d.target_filiale IS NULL) AND d.owner_id=auth.uid())
        )
    )
  );
CREATE POLICY bi_widgets_domain_write_guard ON public.bi_dashboard_widgets
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bi_dashboards d
      WHERE d.id=bi_dashboard_widgets.dashboard_id
        AND (
          (d.pole_id IS NOT NULL AND d.target_filiale IS NOT NULL AND public.bib_data_domain_allowed(d.pole_id,d.target_filiale))
          OR (d.pole_id IS NULL AND d.owner_id=auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bi_dashboards d
      WHERE d.id=bi_dashboard_widgets.dashboard_id
        AND (
          (d.pole_id IS NOT NULL AND d.target_filiale IS NOT NULL AND public.bib_data_domain_allowed(d.pole_id,d.target_filiale))
          OR (d.pole_id IS NULL AND d.owner_id=auth.uid())
        )
    )
  );

-- Sources without a classified domain cannot become shared through a generic
-- Data permission. Ownership is not a substitute for domain authorization.
CREATE POLICY bi_sources_domain_guard ON public.bi_data_sources
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    (business_pole IS NOT NULL
      AND public.bib_data_domain_allowed(business_pole,business_subsidiary))
    OR (business_pole IS NULL AND owner_id=auth.uid())
  );
CREATE POLICY bi_sources_domain_write_guard ON public.bi_data_sources
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    (business_pole IS NOT NULL
      AND public.bib_data_domain_allowed(business_pole,business_subsidiary))
    OR (business_pole IS NULL AND owner_id=auth.uid())
  )
  WITH CHECK (
    business_pole IS NOT NULL
      AND public.bib_data_domain_allowed(business_pole,business_subsidiary)
  );

-- KPI can be shared with several poles, but each selected pole must be within
-- the assigned rights. No generic published-KPI access across divisions.
CREATE POLICY kpi_catalog_domain_guard ON public.kpi_catalog
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (
    (coalesce(cardinality(pole_access),0)>0 AND EXISTS(
      SELECT 1 FROM unnest(pole_access) allowed_pole
      WHERE public.bib_data_domain_allowed(allowed_pole)
    ))
    OR (coalesce(cardinality(pole_access),0)=0 AND owner_id=auth.uid())
  );
CREATE POLICY kpi_catalog_domain_write_guard ON public.kpi_catalog
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (
    (coalesce(cardinality(pole_access),0)>0 AND EXISTS(
      SELECT 1 FROM unnest(pole_access) allowed_pole
      WHERE public.bib_data_domain_allowed(allowed_pole)
    ))
    OR (coalesce(cardinality(pole_access),0)=0 AND owner_id=auth.uid())
  )
  WITH CHECK (
    coalesce(cardinality(pole_access),0)>0 AND NOT EXISTS(
      SELECT 1 FROM unnest(pole_access) allowed_pole
      WHERE NOT public.bib_data_domain_allowed(allowed_pole)
    )
  );

-- See separate deployment preflight for privilege, RLS and user simulations.
