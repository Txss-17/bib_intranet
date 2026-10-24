DROP POLICY IF EXISTS "Staff read access_roles" ON public.access_roles;
CREATE POLICY "Staff read access_roles" ON public.access_roles FOR SELECT TO authenticated USING (public.is_intranet_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff read access_permissions" ON public.access_permissions;
CREATE POLICY "Staff read access_permissions" ON public.access_permissions FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_pole(auth.uid(),'rh')
  OR EXISTS (SELECT 1 FROM public.access_assignments aa WHERE aa.employee_id = auth.uid() AND aa.role_id = access_permissions.role_id AND COALESCE(aa.status,'active') = 'active')
  OR EXISTS (SELECT 1 FROM public.access_roles ar JOIN public.profiles p ON p.id = auth.uid() WHERE ar.id = access_permissions.role_id AND ar.role_key = p.position::text)
);

DROP POLICY IF EXISTS "Authenticated users can insert media attachments" ON public.media_attachments;
CREATE POLICY "Related staff insert media attachments" ON public.media_attachments FOR INSERT TO authenticated WITH CHECK (
  public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager') OR public.has_pole(auth.uid(), entity_type)
);