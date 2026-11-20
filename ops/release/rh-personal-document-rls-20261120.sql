-- Fail-closed RH personnel-document access by owned case portfolio.
-- Non-RH roles retain their existing PERMISSIVE policies. Canonical CEO
-- oversight and employee self-access are explicitly preserved.
BEGIN;
CREATE OR REPLACE FUNCTION public.rh_can_access_employee_document(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
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
REVOKE ALL ON FUNCTION public.rh_can_access_employee_document(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_can_access_employee_document(uuid) TO authenticated,service_role;

DROP POLICY IF EXISTS rh_documents_portfolio_select ON public.rh_employee_documents;
CREATE POLICY rh_documents_portfolio_select ON public.rh_employee_documents AS RESTRICTIVE
FOR SELECT TO authenticated
USING (public.rh_can_access_employee_document(employee_id));

DROP POLICY IF EXISTS rh_documents_portfolio_insert ON public.rh_employee_documents;
CREATE POLICY rh_documents_portfolio_insert ON public.rh_employee_documents AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.rh_can_access_employee_document(employee_id));

DROP POLICY IF EXISTS rh_documents_portfolio_update ON public.rh_employee_documents;
CREATE POLICY rh_documents_portfolio_update ON public.rh_employee_documents AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.rh_can_access_employee_document(employee_id))
WITH CHECK (public.rh_can_access_employee_document(employee_id));

DROP POLICY IF EXISTS rh_documents_portfolio_delete ON public.rh_employee_documents;
CREATE POLICY rh_documents_portfolio_delete ON public.rh_employee_documents AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.rh_can_access_employee_document(employee_id));
COMMIT;
