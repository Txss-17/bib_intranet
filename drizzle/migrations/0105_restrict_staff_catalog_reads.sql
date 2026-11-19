-- "Public" documents and authorization catalogues are internal to BIB staff.
-- An authenticated subject with no eligible HR profile must not read them.
-- Restrictive policies combine with, and preserve, the existing row boundaries.
CREATE POLICY bib_staff_read_boundary ON public.access_role_scopes
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.is_intranet_staff((SELECT auth.uid())));
CREATE POLICY bib_staff_read_boundary ON public.access_scopes
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.is_intranet_staff((SELECT auth.uid())));
CREATE POLICY bib_staff_read_boundary ON public.permission_settings
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.is_intranet_staff((SELECT auth.uid())));
CREATE POLICY bib_staff_read_boundary ON public.documents
 AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.is_intranet_staff((SELECT auth.uid())));
