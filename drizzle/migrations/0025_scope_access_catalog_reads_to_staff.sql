CREATE OR REPLACE FUNCTION public.is_intranet_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.has_role(_uid,'admin') OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = _uid AND COALESCE(cardinality(p.poles),0) > 0)
$$;
DROP POLICY IF EXISTS "Staff read access_interfaces" ON public.access_interfaces;
CREATE POLICY "Staff read access_interfaces" ON public.access_interfaces FOR SELECT TO authenticated USING (public.is_intranet_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff read access_actions" ON public.access_actions;
CREATE POLICY "Staff read access_actions" ON public.access_actions FOR SELECT TO authenticated USING (public.is_intranet_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff read access_portfolio_types" ON public.access_portfolio_types;
CREATE POLICY "Staff read access_portfolio_types" ON public.access_portfolio_types FOR SELECT TO authenticated USING (public.is_intranet_staff(auth.uid()));