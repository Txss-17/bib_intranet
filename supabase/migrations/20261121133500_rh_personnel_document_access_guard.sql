-- BIB RH: close an authorization fallthrough on the personnel document register.
-- Keep the existing RESTRICTIVE portfolio policies; the shared helper must
-- never treat "not in RH" as blanket access to all personnel documents.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_can_access_employee_document(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO ''
AS $guard$
SELECT
  (SELECT auth.uid()) IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles actor
    WHERE actor.id=(SELECT auth.uid())
      AND actor.app_origin='connect'
      AND actor.hr_status='active'
      AND actor.test_account IS FALSE
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles employee
    WHERE employee.id=p_employee_id
      AND employee.app_origin='connect'
      AND employee.test_account IS FALSE
  )
  AND (
    -- A currently active real collaborator may see their own RH record.
    p_employee_id=(SELECT auth.uid())
    -- The canonical CEO has governance oversight of real RH dossiers.
    OR public.is_canonical_bib_ceo((SELECT auth.uid()))
    -- RH staff may only access an employee explicitly assigned to their own
    -- active personal RH portfolio; no cross-manager or non-RH fallback.
    OR EXISTS (
      SELECT 1
      FROM public.bib_case_portfolio_members member
      JOIN public.bib_case_portfolios portfolio
        ON portfolio.id=member.portfolio_id
      JOIN public.profiles manager ON manager.id=portfolio.owner_id
      WHERE member.entity_kind='employee'
        AND member.entity_id=p_employee_id
        AND member.ended_at IS NULL
        AND portfolio.pole='rh'
        AND portfolio.status='active'
        AND portfolio.owner_id=(SELECT auth.uid())
        AND manager.app_origin='connect'
        AND manager.hr_status='active'
        AND manager.test_account IS FALSE
        AND 'rh'=ANY(manager.poles::text[])
    )
  );
$guard$;

REVOKE ALL ON FUNCTION public.rh_can_access_employee_document(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rh_can_access_employee_document(uuid)
  TO authenticated, service_role;

-- Assert that a restrictive policy still applies to every Data API command.
DO $policy$
DECLARE v_cmd text;
BEGIN
  FOREACH v_cmd IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public'
        AND p.tablename='rh_employee_documents'
        AND p.permissive='RESTRICTIVE'
        AND p.cmd=v_cmd
        AND (
          p.qual LIKE '%rh_can_access_employee_document%'
          OR p.with_check LIKE '%rh_can_access_employee_document%'
        )
    ) THEN
      RAISE EXCEPTION 'rh_personnel_document_restrictive_policy_missing_for_%',v_cmd;
    END IF;
  END LOOP;
END;
$policy$;

COMMIT;
