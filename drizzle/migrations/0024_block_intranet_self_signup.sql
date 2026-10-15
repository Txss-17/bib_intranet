CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Intranet : aucune inscription autonome. Seuls les comptes invités par les RH
  -- (invited_at) ou créés par le service d'administration (email confirmé) passent.
  IF COALESCE(NEW.raw_user_meta_data->>'app_origin', '') = 'connect'
     AND NEW.invited_at IS NULL
     AND NEW.email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Inscription autonome désactivée : les comptes intranet sont créés par les RH.';
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');

  RETURN NEW;
END;
$function$;