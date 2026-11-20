-- Follow-up to pole_owned_portfolio_assignments_20261120.
-- The previous owner-only RLS is fail-closed, but authenticated is missing
-- table INSERT/UPDATE grants, and dashboard-only RESTRICTIVE policies deny
-- a verified non-CEO pole lead even when bib_can_manage_access_portfolio is true.
-- Do not grant DELETE; historical revocation uses UPDATE.
BEGIN;

GRANT INSERT, UPDATE ON TABLE public.access_portfolio_assignments TO authenticated;

DROP POLICY IF EXISTS "intranet_authority_insert" ON public.access_portfolio_assignments;
CREATE POLICY "intranet_authority_insert"
ON public.access_portfolio_assignments AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (
  NOT public.intranet_is_test_mode()
  AND (
    public.can_intranet_action('app.dashboard','read')
    OR public.bib_can_manage_access_portfolio(portfolio_id)
  )
);

DROP POLICY IF EXISTS "intranet_authority_update" ON public.access_portfolio_assignments;
CREATE POLICY "intranet_authority_update"
ON public.access_portfolio_assignments AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (
  NOT public.intranet_is_test_mode()
  AND (
    public.can_intranet_action('app.dashboard','read')
    OR public.bib_can_manage_access_portfolio(portfolio_id)
  )
)
WITH CHECK (
  NOT public.intranet_is_test_mode()
  AND (
    public.can_intranet_action('app.dashboard','read')
    OR public.bib_can_manage_access_portfolio(portfolio_id)
  )
);

-- All INSERTs remain subject to access_portfolio_assignments_insert_governed:
-- eligible employee, authenticated current assigned_by and verified lead in the
-- same portfolio pole. UPDATEs remain limited by the governed owner policy and
-- immutable-author trigger. Existing RESTRICTIVE environment policy stays.
COMMIT;
