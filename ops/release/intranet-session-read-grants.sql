-- Preproduction restore supplement, applied only to hjquaokkcpnwnvpdfmyj.
-- The deployment caller must verify its target before running this file.
-- Existing RLS decides which profiles and roles are visible. No business write
-- privileges, service-only routines or anonymous access are enabled here.
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT (user_id, role) ON TABLE public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role),
  public.can_access_rh_profiles(uuid), public.intranet_is_test_mode(),
  public.get_intranet_permissions(), public.get_hr_onboarding_permissions(),
  public.get_hr_publication_permissions(), public.get_work_task_permissions()
TO authenticated;
