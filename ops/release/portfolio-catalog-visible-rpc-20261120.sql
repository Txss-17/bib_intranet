-- Follow-up corrective migration after pole_owned_portfolio_assignments_20261120.
-- Isoler l'appel CEO non accessible directement depuis le rôle authenticated.
CREATE OR REPLACE FUNCTION public.bib_can_read_access_portfolio_type(p_portfolio_type_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $portfolio_read$
 SELECT (SELECT auth.uid()) IS NOT NULL AND (
   public.is_canonical_bib_ceo((SELECT auth.uid()))
   OR EXISTS (
     SELECT 1 FROM public.access_portfolio_types apt
     JOIN public.profiles me ON me.id=(SELECT auth.uid())
     WHERE apt.id=p_portfolio_type_id
       AND me.app_origin='connect' AND me.hr_status='active'
       AND me.test_account IS FALSE
       AND apt.business_pole=ANY(COALESCE(me.poles::text[],ARRAY[]::text[]))
   )
 );
$portfolio_read$;
REVOKE ALL ON FUNCTION public.bib_can_read_access_portfolio_type(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_can_read_access_portfolio_type(uuid) TO authenticated,service_role;

DROP POLICY IF EXISTS "bib_portfolio_catalog_pole_visibility" ON public.access_business_portfolios;
CREATE POLICY "bib_portfolio_catalog_pole_visibility"
ON public.access_business_portfolios AS RESTRICTIVE
FOR SELECT TO authenticated
USING (public.bib_can_read_access_portfolio_type(portfolio_type_id));

