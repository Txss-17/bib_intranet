-- Evidence only: never completes an onboarding and never sends an invitation.
-- Auth identities are queried server-side; the client receives booleans only.
CREATE OR REPLACE FUNCTION public.hr_onboarding_activation_evidence(p_request_id uuid)
RETURNS TABLE (
  auth_user_exists boolean,
  email_confirmed boolean,
  first_login_recorded boolean,
  role_assignment_active boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_hr_employee_mutation_action('read') THEN
    RAISE EXCEPTION 'hr_activation_evidence_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT
    (u.id IS NOT NULL),
    (u.email_confirmed_at IS NOT NULL),
    (u.last_sign_in_at IS NOT NULL),
    EXISTS (
      SELECT 1
      FROM public.access_assignments aa
      JOIN public.access_roles ar ON ar.id=aa.role_id AND ar.status='active'
      WHERE aa.employee_id=r.created_user_id
        AND ar.role_key=r.requested_role
        AND aa.status='active'
        AND (aa.starts_at IS NULL OR aa.starts_at<=now())
        AND (aa.ends_at IS NULL OR aa.ends_at>=now())
    )
  FROM public.hr_employee_requests r
  LEFT JOIN auth.users u ON u.id=r.created_user_id
  WHERE r.id=p_request_id AND r.request_kind='onboarding'
    AND r.status IN ('account_created','completed');
END;
$$;
REVOKE ALL ON FUNCTION public.hr_onboarding_activation_evidence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hr_onboarding_activation_evidence(uuid) TO authenticated;
