-- Authorization inputs cannot be self-assigned through an ordinary profile update.
CREATE OR REPLACE FUNCTION public.guard_profile_authorization_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); field text; changed boolean:=false;
BEGIN
  FOREACH field IN ARRAY ARRAY['id','position','poles','seniority','subsidiary','hr_status','collaborator_type','manager_id','test_account'] LOOP
    IF to_jsonb(NEW)->field IS DISTINCT FROM to_jsonb(OLD)->field THEN changed:=true; EXIT; END IF;
  END LOOP;
  IF NOT changed THEN RETURN NEW; END IF;
  IF auth.role()='service_role' THEN RETURN NEW; END IF;
  -- Trusted database maintenance has no end-user identity.
  IF actor IS NULL AND coalesce(auth.role(),'') NOT IN ('anon','authenticated')
      AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=session_user AND rolsuper) THEN RETURN NEW; END IF;
  IF actor IS NULL THEN RAISE EXCEPTION 'profile_authorization_fields_forbidden' USING ERRCODE='42501'; END IF;
  IF public.has_role(actor,'admin') THEN RETURN NEW; END IF;
  -- HR continues to manage colleagues; changing one's own authority requires a different authorized actor.
  IF OLD.id<>actor AND (public.is_leadership(actor) OR public.can_access_rh_profiles(actor)) THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'profile_authorization_fields_forbidden' USING ERRCODE='42501';
END;
$$;
DROP TRIGGER IF EXISTS guard_profile_authorization_fields ON public.profiles;
CREATE TRIGGER guard_profile_authorization_fields BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_authorization_fields();
REVOKE ALL ON FUNCTION public.guard_profile_authorization_fields() FROM PUBLIC,anon,authenticated;
