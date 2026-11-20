-- The portfolio CRUD functions have internal pole / owner checks.
-- Restore only EXECUTE for the authenticated role after those guards are installed.
BEGIN;
REVOKE ALL ON FUNCTION public.bib_create_case_portfolio(text,text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.bib_change_case_portfolio_owner(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_create_case_portfolio(text,text,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.bib_change_case_portfolio_owner(uuid,uuid,text) TO authenticated,service_role;
COMMIT;
