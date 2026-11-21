-- BIB Intranet: prepare and independently approve RH departures.
-- This migration DOES NOT block Supabase Auth, revoke sessions or close a departure.
-- The technical execution remains a separate, evidence-based security workflow.
BEGIN;

CREATE TABLE IF NOT EXISTS public.rh_departure_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  requested_by uuid NOT NULL REFERENCES public.profiles(id),
  planned_at date NOT NULL,
  justification text NOT NULL CHECK (char_length(btrim(justification)) BETWEEN 20 AND 1000),
  status text NOT NULL DEFAULT 'pending_direction'
    CHECK (status IN ('pending_direction','approved','rejected','cancelled')),
  decided_by uuid REFERENCES public.profiles(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rh_departure_decision_complete CHECK (
    (status IN ('pending_direction','cancelled') AND decided_by IS NULL AND decided_at IS NULL)
    OR (status IN ('approved','rejected') AND decided_by IS NOT NULL AND decided_at IS NOT NULL
      AND nullif(btrim(decision_note),'') IS NOT NULL)
  ),
  CONSTRAINT rh_departure_separation_of_duties CHECK (
    decided_by IS NULL OR decided_by <> requested_by
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_departure_open_employee
  ON public.rh_departure_cases(employee_id)
  WHERE status IN ('pending_direction','approved');
CREATE INDEX IF NOT EXISTS idx_rh_departure_actor ON public.rh_departure_cases(requested_by,created_at DESC);
ALTER TABLE public.rh_departure_cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_departure_cases FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.rh_departure_tasks (
  case_id uuid NOT NULL REFERENCES public.rh_departure_cases(id) ON DELETE RESTRICT,
  task_key text NOT NULL CHECK (task_key IN (
    'handover','assets','rbac','auth_signin','auth_sessions','document_shares','external_services'
  )),
  state text NOT NULL DEFAULT 'pending' CHECK (state='pending'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(case_id,task_key)
);
ALTER TABLE public.rh_departure_tasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_departure_tasks FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.rh_departure_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.rh_departure_cases(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('submitted','direction_approved','direction_rejected')),
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_departure_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_departure_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_departure_prepare(
  p_employee uuid,p_planned_at date,p_justification text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $prepare$
DECLARE
  actor uuid := (SELECT auth.uid());
  employee public.profiles%ROWTYPE;
  v_case uuid;
  note text := btrim(coalesce(p_justification,''));
BEGIN
  IF actor IS NULL OR NOT public.can_intranet_action('rh.employees','update') THEN
    RAISE EXCEPTION 'rh_departure_request_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_employee IS NULL OR p_employee=actor OR p_planned_at IS NULL
    OR p_planned_at<current_date OR p_planned_at>(current_date+interval '2 years')::date
    OR char_length(note) NOT BETWEEN 20 AND 1000 THEN
    RAISE EXCEPTION 'rh_departure_request_invalid' USING ERRCODE='22023';
  END IF;

  SELECT * INTO employee FROM public.profiles WHERE id=p_employee FOR UPDATE;
  IF NOT FOUND OR employee.app_origin<>'connect' OR employee.test_account IS DISTINCT FROM FALSE
     OR employee.hr_status NOT IN ('active','onboarding','leave')
     OR employee.position::text='ceo'
     OR public.is_canonical_bib_ceo(p_employee) THEN
    RAISE EXCEPTION 'rh_departure_employee_ineligible' USING ERRCODE='42501';
  END IF;

  IF NOT public.is_canonical_bib_ceo(actor) AND NOT EXISTS (
    SELECT 1 FROM public.bib_case_portfolios portfolio
    JOIN public.bib_case_portfolio_members member ON member.portfolio_id=portfolio.id
    JOIN public.profiles manager ON manager.id=portfolio.owner_id
    WHERE portfolio.pole='rh' AND portfolio.status='active'
      AND portfolio.owner_id=actor
      AND member.entity_kind='employee' AND member.entity_id=p_employee
      AND member.ended_at IS NULL
      AND manager.app_origin='connect' AND manager.hr_status='active'
      AND manager.test_account IS FALSE
  ) THEN
    RAISE EXCEPTION 'rh_departure_outside_portfolio' USING ERRCODE='42501';
  END IF;

  IF EXISTS (SELECT 1 FROM public.rh_departure_cases c
    WHERE c.employee_id=p_employee AND c.status IN ('pending_direction','approved')) THEN
    RAISE EXCEPTION 'rh_departure_already_open' USING ERRCODE='23505';
  END IF;

  INSERT INTO public.rh_departure_cases(employee_id,requested_by,planned_at,justification)
  VALUES(p_employee,actor,p_planned_at,note) RETURNING id INTO v_case;
  INSERT INTO public.rh_departure_events(case_id,action,actor_id,note)
  VALUES(v_case,'submitted',actor,'Demande soumise à la Direction');
  RETURN v_case;
END;
$prepare$;

CREATE OR REPLACE FUNCTION public.rh_departure_direction_review(
  p_case uuid,p_decision text,p_note text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $review$
DECLARE
  actor uuid := (SELECT auth.uid());
  current_case public.rh_departure_cases%ROWTYPE;
  note text := btrim(coalesce(p_note,''));
BEGIN
  IF actor IS NULL OR NOT public.is_canonical_bib_ceo(actor)
     OR NOT public.can_intranet_action('rh.employees','validate') THEN
    RAISE EXCEPTION 'rh_departure_direction_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_case IS NULL OR p_decision NOT IN ('approved','rejected')
    OR char_length(note) NOT BETWEEN 20 AND 2000 THEN
    RAISE EXCEPTION 'rh_departure_decision_invalid' USING ERRCODE='22023';
  END IF;

  SELECT * INTO current_case FROM public.rh_departure_cases WHERE id=p_case FOR UPDATE;
  IF NOT FOUND OR current_case.status<>'pending_direction' THEN
    RAISE EXCEPTION 'rh_departure_request_not_pending' USING ERRCODE='40001';
  END IF;
  IF actor=current_case.employee_id OR actor=current_case.requested_by THEN
    RAISE EXCEPTION 'rh_departure_independent_approval_required' USING ERRCODE='42501';
  END IF;
  IF current_case.planned_at<current_date THEN
    RAISE EXCEPTION 'rh_departure_plan_date_expired' USING ERRCODE='40001';
  END IF;

  UPDATE public.rh_departure_cases
    SET status=p_decision,decided_by=actor,decided_at=now(),
        decision_note=note,updated_at=now()
    WHERE id=p_case;
  INSERT INTO public.rh_departure_events(case_id,action,actor_id,note)
    VALUES(p_case,CASE WHEN p_decision='approved'
      THEN 'direction_approved' ELSE 'direction_rejected' END,actor,note);

  IF p_decision='approved' THEN
    -- These are mandatory real-world controls, NOT assertions of completion.
    INSERT INTO public.rh_departure_tasks(case_id,task_key) SELECT p_case,key FROM unnest(
      ARRAY['handover','assets','rbac','auth_signin','auth_sessions','document_shares','external_services']::text[]
    ) key ON CONFLICT DO NOTHING;
  END IF;
  RETURN true;
END;
$review$;

CREATE OR REPLACE FUNCTION public.rh_departure_list()
RETURNS TABLE(id uuid, employee_id uuid, employee_name text, planned_at date,
 status text, requested_by uuid, decided_at timestamptz, tasks_pending bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $list$
DECLARE actor uuid := (SELECT auth.uid());
BEGIN
  IF actor IS NULL OR NOT public.can_intranet_action('rh.employees','read') THEN
    RAISE EXCEPTION 'rh_departure_list_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT c.id,c.employee_id,concat_ws(' ',e.first_name,e.last_name)::text,
     c.planned_at,c.status,c.requested_by,c.decided_at,
     (SELECT count(*) FROM public.rh_departure_tasks t WHERE t.case_id=c.id)
  FROM public.rh_departure_cases c
  JOIN public.profiles e ON e.id=c.employee_id
  WHERE public.is_canonical_bib_ceo(actor)
    OR (c.requested_by=actor AND EXISTS(
      SELECT 1 FROM public.bib_case_portfolios portfolio
      JOIN public.bib_case_portfolio_members m ON m.portfolio_id=portfolio.id
      WHERE portfolio.pole='rh' AND portfolio.status='active'
        AND portfolio.owner_id=actor AND m.entity_kind='employee'
        AND m.entity_id=c.employee_id AND m.ended_at IS NULL
    ))
  ORDER BY c.created_at DESC LIMIT 200;
END;
$list$;

REVOKE ALL ON FUNCTION public.rh_departure_prepare(uuid,date,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_departure_direction_review(uuid,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_departure_list() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_prepare(uuid,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_direction_review(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_list() TO authenticated;
COMMIT;
