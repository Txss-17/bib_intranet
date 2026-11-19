-- Fixed resolution of built-ins; table references in the RH trigger are qualified.
-- No grants, role assignments or business data are changed by this migration.
ALTER FUNCTION public.rh_validate_onboarding_request() SET search_path = '';
--> statement-breakpoint
ALTER FUNCTION public.work_module_table(text) SET search_path = '';
