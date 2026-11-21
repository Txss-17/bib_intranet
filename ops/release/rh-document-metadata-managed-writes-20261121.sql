-- The RH dossier UI manages metadata directly. PostgreSQL ACLs were
-- denying INSERT/UPDATE/DELETE before portfolio-scoped RLS could run.
-- All operations remain subject to existing PERMISSIVE RH-manage and
-- RESTRICTIVE portfolio-owner / non-test policies.
GRANT INSERT,UPDATE,DELETE ON TABLE public.rh_employee_documents TO authenticated;
