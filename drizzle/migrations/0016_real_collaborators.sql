ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false;
UPDATE public.profiles SET test_account = true WHERE email ILIKE '%.test@brand-in-a-box.space';

CREATE OR REPLACE FUNCTION public.can_access_rh_profiles(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_leadership(_uid) OR public.has_pole(_uid, 'rh')
$$;

CREATE POLICY "RH and leadership view collaborators" ON public.profiles
FOR SELECT TO authenticated USING (public.can_access_rh_profiles(auth.uid()));

CREATE POLICY "RH and leadership update collaborators" ON public.profiles
FOR UPDATE TO authenticated USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));

CREATE OR REPLACE FUNCTION public.employee_access_directory()
RETURNS TABLE(id uuid, email text, first_name text, last_name text, "position" text, poles text[], hr_status text, roles text[], last_sign_in_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.email, p.first_name, p.last_name, p.position::text, p.poles::text[], p.hr_status,
         COALESCE((SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = p.id), '{}'),
         u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.last_sign_in_at IS NOT NULL AND p.test_account = false
    AND public.can_access_rh_profiles(auth.uid())
  ORDER BY u.last_sign_in_at DESC
$$;