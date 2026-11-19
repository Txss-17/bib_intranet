-- The completion record must be written by the reviewed RPC before status changes.
-- Production is not targeted by this migration.
CREATE TABLE IF NOT EXISTS public.hr_onboarding_completions (
  request_id uuid PRIMARY KEY REFERENCES public.hr_employee_requests(id) ON DELETE RESTRICT,
  completed_by uuid NOT NULL REFERENCES auth.users(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  review_note text NOT NULL CHECK (char_length(btrim(review_note)) >= 30),
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.hr_onboarding_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_onboarding_completions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.hr_onboarding_completions FROM service_role;

CREATE OR REPLACE FUNCTION public.hr_guard_onboarding_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
BEGIN
  IF NEW.request_kind = 'onboarding' AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status IS DISTINCT FROM 'account_created' OR
       NOT EXISTS (
         SELECT 1 FROM public.hr_onboarding_completions c
         WHERE c.request_id = NEW.id
           AND c.completed_by = auth.uid()
       ) THEN
       RAISE EXCEPTION 'hr_completion_requires_verified_review' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_hr_guard_onboarding_completion ON public.hr_employee_requests;
CREATE TRIGGER trg_hr_guard_onboarding_completion
BEFORE UPDATE OF status ON public.hr_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.hr_guard_onboarding_completion();
REVOKE ALL ON FUNCTION public.hr_guard_onboarding_completion() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_hr_employee_onboarding(p_request_id uuid, p_review_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','pg_temp'
AS $$
DECLARE
  actor uuid := auth.uid();
  req public.hr_employee_requests%ROWTYPE;
  candidate auth.users%ROWTYPE;
  v_note text := btrim(coalesce(p_review_note,''));
  v_role_exists boolean;
BEGIN
  IF actor IS NULL OR NOT public.can_hr_employee_mutation_action('read')
     OR NOT public.can_hr_employee_mutation_action('validate') THEN
    RAISE EXCEPTION 'hr_completion_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_request_id IS NULL OR char_length(v_note)<30 OR char_length(v_note)>2000 THEN
    RAISE EXCEPTION 'hr_completion_review_note_required' USING ERRCODE='22023';
  END IF;
  SELECT * INTO req FROM public.hr_employee_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND OR req.request_kind <> 'onboarding'
     OR req.status <> 'account_created' OR req.created_user_id IS NULL THEN
    RAISE EXCEPTION 'hr_completion_request_not_ready' USING ERRCODE='40001';
  END IF;
  -- Two-person rule: creator, validator or provisioner cannot complete their own stage.
  IF actor = req.created_user_id OR actor = req.hr_validated_by
     OR actor = req.account_created_by OR actor = req.created_by THEN
    RAISE EXCEPTION 'hr_completion_independent_review_required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO candidate FROM auth.users WHERE id=req.created_user_id;
  IF NOT FOUND OR candidate.email_confirmed_at IS NULL OR candidate.last_sign_in_at IS NULL THEN
    RAISE EXCEPTION 'hr_completion_activation_not_verified' USING ERRCODE='40001';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.access_assignments aa
    JOIN public.access_roles ar ON ar.id=aa.role_id AND ar.status='active'
    WHERE aa.employee_id=req.created_user_id AND ar.role_key=req.requested_role
      AND aa.status='active'
      AND (aa.starts_at IS NULL OR aa.starts_at<=now())
      AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  ) INTO v_role_exists;
  IF NOT v_role_exists THEN
    RAISE EXCEPTION 'hr_completion_role_missing' USING ERRCODE='40001';
  END IF;
  INSERT INTO public.hr_onboarding_completions(request_id,completed_by,review_note,evidence)
  VALUES(req.id,actor,v_note,jsonb_build_object(
    'auth_user_exists',true,'email_confirmed',true,
    'first_login_recorded',true,'role_assignment_active',true,
    'verified_at',clock_timestamp()
  ));
  UPDATE public.hr_employee_requests
     SET status='completed'
     WHERE id=req.id AND status='account_created';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'hr_completion_concurrent_change' USING ERRCODE='40001';
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_hr_employee_onboarding(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_hr_employee_onboarding(uuid,text) TO authenticated;
