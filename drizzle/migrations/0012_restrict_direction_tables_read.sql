DROP POLICY IF EXISTS gov_blocks_select ON public.governance_blocks;
CREATE POLICY gov_blocks_select ON public.governance_blocks FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS roadmap_select ON public.direction_roadmap_items;
CREATE POLICY roadmap_select ON public.direction_roadmap_items FOR SELECT TO authenticated
USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS perm_settings_select ON public.permission_settings;
CREATE POLICY perm_settings_select ON public.permission_settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);