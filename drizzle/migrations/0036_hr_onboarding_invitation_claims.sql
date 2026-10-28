-- Invitation proof is private, issued after server-side RH authorization and consumed
-- by the Auth insert transaction. Public signup metadata is never sufficient.
CREATE TABLE public.hr_onboarding_invitation_claims (
  nonce uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.hr_employee_requests(id) ON DELETE CASCADE,
  email text NOT NULL,
  issued_by uuid NOT NULL REFERENCES public.profiles(id),
  issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  consumed_user_id uuid,
  consumed_at timestamptz,
  CHECK (expires_at > issued_at),
  CHECK ((consumed_user_id IS NULL) = (consumed_at IS NULL))
);
CREATE INDEX hr_onboarding_invitation_claims_request ON public.hr_onboarding_invitation_claims(request_id);
ALTER TABLE public.hr_onboarding_invitation_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.hr_onboarding_invitation_claims FROM PUBLIC,anon,authenticated;
GRANT ALL ON TABLE public.hr_onboarding_invitation_claims TO service_role;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.reserve_hr_onboarding_invitation(p_request_id uuid,p_attempt_nonce uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); request public.hr_employee_requests%ROWTYPE; destination text;
  prior public.hr_onboarding_invitation_claims%ROWTYPE; stamp timestamptz:=clock_timestamp();
BEGIN
  IF NOT public.can_hr_employee_mutation_action('read') OR NOT public.can_hr_employee_mutation_action('apply') THEN
    RAISE EXCEPTION 'hr_invitation_forbidden' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_attempt_nonce IS NULL THEN
    RAISE EXCEPTION 'invalid_hr_invitation_claim' USING ERRCODE='22023'; END IF;
  SELECT * INTO request FROM public.hr_employee_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR request.request_kind IS DISTINCT FROM 'onboarding'
      OR request.status IS DISTINCT FROM 'hr_validated' OR request.hr_validated_by IS NULL
      OR request.created_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'hr_invitation_request_not_ready' USING ERRCODE='40001'; END IF;
  destination:=lower(btrim(coalesce(request.work_email,request.personal_email,'')));
  IF destination='' OR EXISTS(SELECT 1 FROM auth.users WHERE lower(email)=destination) THEN
    RAISE EXCEPTION 'hr_invitation_existing_identity' USING ERRCODE='40001'; END IF;
  SELECT * INTO prior FROM public.hr_onboarding_invitation_claims WHERE nonce=p_attempt_nonce FOR UPDATE;
  IF FOUND THEN
    IF prior.request_id=request.id AND prior.issued_by=actor AND prior.email=destination
        AND prior.consumed_at IS NULL AND prior.expires_at>stamp THEN RETURN true; END IF;
    RAISE EXCEPTION 'hr_invitation_claim_conflict' USING ERRCODE='40001';
  END IF;
  INSERT INTO public.hr_onboarding_invitation_claims(nonce,request_id,email,issued_by,issued_at,expires_at)
  VALUES(p_attempt_nonce,request.id,destination,actor,stamp,stamp+interval '5 minutes');
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_hr_onboarding_invitation(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_hr_onboarding_invitation(uuid,uuid) TO authenticated;
--> statement-breakpoint
-- GoTrue sets invited_at after inserting auth.users. Accept the one-use private RH
-- proof at INSERT time while retaining the existing trusted invited/confirmed path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE claimed_request uuid; request public.hr_employee_requests%ROWTYPE;
BEGIN
  IF coalesce(NEW.raw_user_meta_data->>'app_origin','')='connect'
      AND NEW.invited_at IS NULL AND NEW.email_confirmed_at IS NULL THEN
    -- Lock in the same order as reservation so a concurrent rejection cannot
    -- authorize creation from an obsolete validated request.
    SELECT * INTO request FROM public.hr_employee_requests
    WHERE id::text=NEW.raw_user_meta_data->>'hr_onboarding_request_id' FOR UPDATE;
    IF NOT FOUND OR request.request_kind IS DISTINCT FROM 'onboarding'
        OR request.status IS DISTINCT FROM 'hr_validated' OR request.hr_validated_by IS NULL
        OR request.created_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'hr_invitation_request_not_ready' USING ERRCODE='42501';
    END IF;
    UPDATE public.hr_onboarding_invitation_claims claim
    SET consumed_user_id=NEW.id,consumed_at=clock_timestamp()
    WHERE claim.nonce::text=NEW.raw_user_meta_data->>'hr_onboarding_attempt_nonce'
      AND claim.request_id=request.id
      AND claim.email=lower(btrim(NEW.email))
      AND claim.email=lower(btrim(coalesce(request.work_email,request.personal_email,'')))
      AND claim.expires_at>clock_timestamp() AND claim.consumed_at IS NULL
      AND request.request_kind='onboarding' AND request.status='hr_validated'
      AND request.hr_validated_by IS NOT NULL AND request.created_user_id IS NULL
    RETURNING claim.request_id INTO claimed_request;
    IF claimed_request IS NULL THEN
      RAISE EXCEPTION 'Inscription autonome désactivée : les comptes intranet sont créés par les RH.' USING ERRCODE='42501';
    END IF;
  END IF;
  INSERT INTO public.profiles(id,email,first_name,last_name)
  VALUES(NEW.id,NEW.email,coalesce(NEW.raw_user_meta_data->>'first_name','New'),coalesce(NEW.raw_user_meta_data->>'last_name','User'));
  INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'viewer');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
