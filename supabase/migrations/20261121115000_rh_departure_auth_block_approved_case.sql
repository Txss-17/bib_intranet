-- Step 1 of technical offboarding: verified blocking of new sign-ins.
-- The CEO may execute this control after an independently submitted RH case
-- has been approved by Direction and its effective date reached.
-- Existing sessions/JWTs, Drive shares and other checklist controls remain pending.
BEGIN;

ALTER TABLE public.rh_departure_tasks
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS evidence_ref text;

ALTER TABLE public.rh_departure_tasks
  DROP CONSTRAINT IF EXISTS rh_departure_tasks_state_check,
  ADD CONSTRAINT rh_departure_tasks_state_check CHECK (
    (state='pending' AND verified_by IS NULL AND verified_at IS NULL AND evidence_ref IS NULL)
    OR
    (state='verified' AND task_key='auth_signin'
      AND verified_by IS NOT NULL AND verified_at IS NOT NULL
      AND nullif(btrim(evidence_ref),'') IS NOT NULL)
  );

ALTER TABLE public.rh_departure_events
  DROP CONSTRAINT IF EXISTS rh_departure_events_action_check,
  ADD CONSTRAINT rh_departure_events_action_check
  CHECK (action IN ('submitted','direction_approved','direction_rejected','auth_signin_blocked'));

CREATE OR REPLACE FUNCTION public.rh_departure_auth_block_target(p_case uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $get_target$
DECLARE
  actor uuid := (SELECT auth.uid());
  v_case public.rh_departure_cases%ROWTYPE;
  employee public.profiles%ROWTYPE;
BEGIN
  IF actor IS NULL OR NOT public.is_canonical_bib_ceo(actor)
    OR NOT public.can_intranet_action('rh.employees','validate') THEN
    RAISE EXCEPTION 'rh_auth_block_direction_required' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_case FROM public.rh_departure_cases WHERE id=p_case;
  IF NOT FOUND OR v_case.status<>'approved'
    OR v_case.planned_at > current_date
    OR v_case.decided_by IS DISTINCT FROM actor
    OR v_case.requested_by=actor OR v_case.employee_id=actor
    OR v_case.decided_by=v_case.requested_by
    OR v_case.decided_by=v_case.employee_id THEN
    RAISE EXCEPTION 'rh_auth_block_case_not_eligible' USING ERRCODE='42501';
  END IF;

  SELECT * INTO employee FROM public.profiles WHERE id=v_case.employee_id;
  IF NOT FOUND OR employee.app_origin<>'connect'
    OR employee.test_account IS DISTINCT FROM FALSE
    OR employee.position::text='ceo'
    OR public.is_canonical_bib_ceo(employee.id)
    OR employee.hr_status NOT IN ('active','onboarding','leave') THEN
    RAISE EXCEPTION 'rh_auth_block_target_not_eligible' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=employee.id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'rh_auth_block_auth_account_missing' USING ERRCODE='P0002';
  END IF;

  RETURN employee.id;
END;
$get_target$;

CREATE OR REPLACE FUNCTION public.rh_departure_record_auth_block(p_case uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $record_block$
DECLARE
  actor uuid := (SELECT auth.uid());
  target uuid;
  changed_count integer;
BEGIN
  -- Internal call to the same authoritative eligibility logic.
  target := public.rh_departure_auth_block_target(p_case);

  IF NOT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id=target AND u.deleted_at IS NULL
      AND u.banned_until > now()+interval '30 days'
  ) THEN
    RAISE EXCEPTION 'rh_auth_block_not_confirmed_in_auth'
      USING ERRCODE='40001';
  END IF;

  UPDATE public.rh_departure_tasks
     SET state='verified',
         verified_by=actor,
         verified_at=now(),
         evidence_ref='auth.admin.updateUserById:ban_verified_in_auth.users'
   WHERE case_id=p_case AND task_key='auth_signin' AND state='pending';
  GET DIAGNOSTICS changed_count = ROW_COUNT;

  IF changed_count=1 THEN
    INSERT INTO public.rh_departure_events(case_id,action,actor_id,note)
    VALUES(p_case,'auth_signin_blocked',actor,
      'Blocage des nouvelles connexions vérifié dans Supabase Auth. Sessions et JWT encore à contrôler.');
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.rh_departure_tasks
    WHERE case_id=p_case AND task_key='auth_signin' AND state='verified'
      AND verified_by=actor
  ) THEN
    RAISE EXCEPTION 'rh_auth_block_task_missing' USING ERRCODE='40001';
  END IF;

  RETURN true;
END;
$record_block$;

REVOKE ALL ON FUNCTION public.rh_departure_auth_block_target(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rh_departure_record_auth_block(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_auth_block_target(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_record_auth_block(uuid)
  TO authenticated;

COMMIT;
