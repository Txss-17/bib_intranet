-- RH departure: read-only security preflight.
-- Never treats Auth bans, old JWTs, role counts or pending tasks as proof of revocation.
-- No real account is mutated by this migration or RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_departure_security_preflight(p_case uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $preflight$
DECLARE
  actor uuid := (SELECT auth.uid());
  v_case public.rh_departure_cases%ROWTYPE;
  v_ceo boolean := false;
  v_tech boolean := false;
  v_auth_exists boolean := false;
  v_banned boolean := false;
  v_session_records bigint := 0;
  v_active_assignments bigint := 0;
  v_active_memberships bigint := 0;
  v_owned_portfolios bigint := 0;
  v_tasks_pending bigint := 0;
  v_decision_valid boolean := false;
  v_date_reached boolean := false;
BEGIN
  IF actor IS NULL OR p_case IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles profile
    WHERE profile.id = actor AND profile.app_origin = 'connect'
      AND profile.hr_status = 'active' AND profile.test_account IS FALSE
  ) THEN
    RAISE EXCEPTION 'rh_departure_preflight_forbidden' USING ERRCODE='42501';
  END IF;

  v_ceo := public.is_canonical_bib_ceo(actor);
  SELECT EXISTS (
    SELECT 1 FROM public.access_assignments aa
    JOIN public.access_roles ar ON ar.id = aa.role_id
    WHERE aa.employee_id = actor AND aa.status = 'active'
      AND ar.status = 'active' AND ar.role_key = 'responsable_tech'
      AND (aa.starts_at IS NULL OR aa.starts_at <= now())
      AND (aa.ends_at IS NULL OR aa.ends_at > now())
  ) INTO v_tech;

  IF NOT v_ceo AND NOT v_tech THEN
    RAISE EXCEPTION 'rh_departure_preflight_tech_authorization_required'
      USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_case FROM public.rh_departure_cases WHERE id = p_case;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'rh_departure_preflight_not_found' USING ERRCODE='P0002';
  END IF;

  -- Do not reveal target's session inventory to the subject or an involved
  -- requester/reviewer who is not the CEO supervising the transition.
  IF actor = v_case.employee_id OR
    (NOT v_ceo AND actor IN (v_case.requested_by, v_case.decided_by)) THEN
    RAISE EXCEPTION 'rh_departure_preflight_independent_technician_required'
      USING ERRCODE='42501';
  END IF;

  v_decision_valid := v_case.status = 'approved'
    AND v_case.requested_by <> v_case.employee_id
    AND v_case.decided_by IS NOT NULL
    AND v_case.decided_by <> v_case.requested_by
    AND v_case.decided_by <> v_case.employee_id;
  v_date_reached := v_case.planned_at <= current_date;

  SELECT EXISTS(SELECT 1 FROM auth.users u WHERE u.id = v_case.employee_id),
         EXISTS(SELECT 1 FROM auth.users u WHERE u.id = v_case.employee_id
           AND u.banned_until > now() AND u.deleted_at IS NULL)
    INTO v_auth_exists, v_banned;

  -- A row in auth.sessions is only a possible session, not proof that a token
  -- is currently accepted by Auth or that existing JWTs have been revoked.
  SELECT count(*) INTO v_session_records FROM auth.sessions s
    WHERE s.user_id = v_case.employee_id
      AND (s.not_after IS NULL OR s.not_after > now());

  SELECT count(*) INTO v_active_assignments
    FROM public.access_assignments aa
    JOIN public.access_roles ar ON ar.id = aa.role_id
    WHERE aa.employee_id = v_case.employee_id AND aa.status = 'active'
      AND ar.status = 'active'
      AND (aa.starts_at IS NULL OR aa.starts_at <= now())
      AND (aa.ends_at IS NULL OR aa.ends_at > now());

  SELECT count(*) INTO v_active_memberships FROM public.bib_case_portfolio_members member
    JOIN public.bib_case_portfolios portfolio ON portfolio.id = member.portfolio_id
    WHERE member.entity_kind = 'employee'
      AND member.entity_id = v_case.employee_id
      AND member.ended_at IS NULL AND portfolio.status = 'active';

  SELECT count(*) INTO v_owned_portfolios FROM public.bib_case_portfolios portfolio
    WHERE portfolio.owner_id = v_case.employee_id AND portfolio.status = 'active';

  SELECT count(*) INTO v_tasks_pending FROM public.rh_departure_tasks task
    WHERE task.case_id = v_case.id AND task.state = 'pending';

  RETURN jsonb_build_object(
    'case_id', v_case.id,
    'approved', v_decision_valid,
    'effective_date_reached', v_date_reached,
    'authorized_viewer', CASE WHEN v_ceo THEN 'direction' ELSE 'technical_lead' END,
    'auth_account_exists', v_auth_exists,
    'auth_banned_for_new_signins', v_banned,
    'possible_session_records', v_session_records,
    'active_role_assignments', v_active_assignments,
    'active_portfolio_memberships', v_active_memberships,
    'active_owned_portfolios', v_owned_portfolios,
    'technical_tasks_pending', v_tasks_pending,
    'document_acl_independently_verified', false,
    'external_services_independently_verified', false,
    'session_token_revocation_verified', false,
    'ready_for_closure', false,
    'warning', 'Lecture seule : aucun acces ne peut etre considere revoque sur ces seuls indicateurs.'
  );
END;
$preflight$;

REVOKE ALL ON FUNCTION public.rh_departure_security_preflight(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_security_preflight(uuid)
  TO authenticated;

COMMIT;
