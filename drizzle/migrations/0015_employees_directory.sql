ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS collaborator_type text NOT NULL DEFAULT 'internal';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hr_status text NOT NULL DEFAULT 'active';

CREATE OR REPLACE FUNCTION public.employee_access_directory()
RETURNS TABLE(id uuid, email text, first_name text, last_name text, "position" text, poles text[], hr_status text, roles text[], last_sign_in_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.email, p.first_name, p.last_name, p.position::text, p.poles::text[], p.hr_status,
         COALESCE((SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = p.id), '{}'),
         u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.last_sign_in_at IS NOT NULL
    AND (public.has_role(auth.uid(),'admin') OR public.is_leadership(auth.uid()) OR public.has_pole(auth.uid(),'rh'))
  ORDER BY u.last_sign_in_at DESC
$$;
REVOKE ALL ON FUNCTION public.employee_access_directory() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.employee_access_directory() TO authenticated;