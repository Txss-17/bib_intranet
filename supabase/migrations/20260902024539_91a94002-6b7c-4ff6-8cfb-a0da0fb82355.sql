-- Helpers : SECURITY INVOKER (lecture du profil de l'utilisateur courant uniquement)
CREATE OR REPLACE FUNCTION public.has_pole(_user_id uuid, _pole text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND _pole = ANY(COALESCE(p.poles::text[], '{}'::text[]))
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_pole(_user_id uuid, _poles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND COALESCE(p.poles::text[], '{}'::text[]) && _poles
  )
$$;

CREATE OR REPLACE FUNCTION public.my_poles()
RETURNS text[] LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE((SELECT poles::text[] FROM public.profiles WHERE id = auth.uid()), '{}'::text[])
$$;

CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'executive')
      OR public.has_pole(_user_id, 'direction')
$$;

REVOKE ALL ON FUNCTION public.has_pole(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_any_pole(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_poles() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_leadership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_pole(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_pole(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_poles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_leadership(uuid) TO authenticated;

-- Fonctions de trigger : non exposées à l'API
REVOKE ALL ON FUNCTION public.notify_tech_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_hr_employee_request() FROM PUBLIC, anon, authenticated;