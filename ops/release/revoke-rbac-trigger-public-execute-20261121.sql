-- Security hardening: trigger functions must not be exposed as public RPCs.
-- This function is invoked by the access_portfolio_assignments trigger only.
-- SECURITY DEFINER remains needed by the trigger, but direct EXECUTE is not.
-- Apply to Supabase Intranet staging first; no production migration in this PR.
BEGIN;
REVOKE ALL ON FUNCTION public.bib_guard_access_portfolio_assignment()
  FROM PUBLIC, anon, authenticated;
COMMIT;
