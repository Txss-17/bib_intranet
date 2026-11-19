-- Restore the narrowly scoped RPC entrypoint required by the authenticated
-- RH caller inside provision-employee-account. The SECURITY DEFINER function
-- enforces can_hr_employee_mutation_action(read/apply), a validated onboarding
-- request, identity uniqueness and an expiring one-time nonce.
-- No table-level permission or anonymous EXECUTE is granted.
REVOKE ALL ON FUNCTION public.reserve_hr_onboarding_invitation(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_hr_onboarding_invitation(uuid,uuid) TO authenticated;
