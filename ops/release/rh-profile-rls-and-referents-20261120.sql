-- Final owner-scoped HR personnel profile access.
-- The referent directory is provided through a minimal RPC instead of
-- granting HR managers unrestricted direct SELECT on profiles.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_can_access_employee_profile(p_employee_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $guard$
 SELECT (SELECT auth.uid()) IS NOT NULL AND (
   p_employee_id=(SELECT auth.uid())
   OR public.is_canonical_bib_ceo((SELECT auth.uid()))
   OR NOT public.has_pole((SELECT auth.uid()),'rh')
   OR EXISTS (
     SELECT 1 FROM public.bib_case_portfolio_members m
     JOIN public.bib_case_portfolios p ON p.id=m.portfolio_id
     JOIN public.profiles manager ON manager.id=p.owner_id
     WHERE m.entity_kind='employee' AND m.entity_id=p_employee_id
       AND m.ended_at IS NULL AND p.pole='rh' AND p.status='active'
       AND p.owner_id=(SELECT auth.uid())
       AND manager.app_origin='connect' AND manager.hr_status='active'
       AND manager.test_account IS FALSE
   )
 );
$guard$;
REVOKE ALL ON FUNCTION public.rh_can_access_employee_profile(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_can_access_employee_profile(uuid) TO authenticated,service_role;

DROP POLICY IF EXISTS rh_profiles_portfolio_select ON public.profiles;
CREATE POLICY rh_profiles_portfolio_select ON public.profiles AS RESTRICTIVE
FOR SELECT TO authenticated
USING (public.rh_can_access_employee_profile(id));

DROP POLICY IF EXISTS rh_profiles_portfolio_update ON public.profiles;
CREATE POLICY rh_profiles_portfolio_update ON public.profiles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.rh_can_access_employee_profile(id))
WITH CHECK (public.rh_can_access_employee_profile(id));

-- Minimal contact directory for the HR referent selection in onboarding.
-- Do not expose all profiles or arbitrary personnel fields.
CREATE OR REPLACE FUNCTION public.rh_onboarding_referents()
RETURNS TABLE (
 id uuid, first_name text, last_name text, email text,
 "position" text, poles text[], hr_status text, test_account boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $referents$
 SELECT p.id,p.first_name,p.last_name,p.email,p.position::text,
        p.poles::text[],p.hr_status::text,p.test_account
 FROM public.profiles p
 WHERE (SELECT auth.uid()) IS NOT NULL
   AND (public.has_pole((SELECT auth.uid()),'rh')
      OR public.is_canonical_bib_ceo((SELECT auth.uid())))
   AND p.app_origin='connect'
   AND p.test_account IS FALSE
   AND p.position='rh_manager'
   AND p.hr_status IN ('active','onboarding')
   AND 'rh'=ANY(COALESCE(p.poles::text[],ARRAY[]::text[]))
 ORDER BY p.first_name,p.last_name;
$referents$;
REVOKE ALL ON FUNCTION public.rh_onboarding_referents() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_onboarding_referents() TO authenticated,service_role;

COMMIT;
