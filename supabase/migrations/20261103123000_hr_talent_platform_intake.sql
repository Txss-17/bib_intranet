-- Separate private intake for BIB Talent applications from Platform.
-- Existing manually entered RH candidates and historical Drive archives are untouched.
CREATE TABLE IF NOT EXISTS public.hr_talent_applications (
  platform_application_id uuid PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  location text,
  current_activity text,
  preferred_pole text,
  assigned_pole text,
  contribution_type text,
  skills text,
  motivation text,
  availability text,
  portfolio_url text,
  locale text,
  platform_status text,
  consent_given_at timestamptz NOT NULL,
  future_opportunities_consent boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL,
  platform_updated_at timestamptz NOT NULL,
  retention_until timestamptz NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  candidate_id uuid UNIQUE REFERENCES public.hr_candidates(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS hr_talent_applications_retention ON public.hr_talent_applications (retention_until);
CREATE INDEX IF NOT EXISTS hr_talent_applications_email ON public.hr_talent_applications (lower(email));
ALTER TABLE public.hr_talent_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_talent_applications FROM PUBLIC, anon;
GRANT SELECT ON public.hr_talent_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_talent_applications TO service_role;
DROP POLICY IF EXISTS hr_talent_authorized_read ON public.hr_talent_applications;
CREATE POLICY hr_talent_authorized_read ON public.hr_talent_applications FOR SELECT TO authenticated
USING (public.can_access_rh_profiles(auth.uid()) AND retention_until > now());
COMMENT ON TABLE public.hr_talent_applications IS 'Copies minimisées des candidatures BIB Talent Platform. Synchronisation serveur uniquement, effacement à échéance, aucun accès hors RH.';

-- Existing RH candidate statuses remain under RH control; never replace with
-- automatically imported Platform status changes.
ALTER TABLE public.hr_candidates ADD COLUMN IF NOT EXISTS platform_application_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS hr_candidates_platform_application_uidx
 ON public.hr_candidates (platform_application_id) WHERE platform_application_id IS NOT NULL;
