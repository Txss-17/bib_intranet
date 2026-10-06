-- ============================================================
-- BIB — RH
-- Type de collaborateur dans le workflow d'onboarding
-- ============================================================

ALTER TABLE public.hr_employee_requests
ADD COLUMN IF NOT EXISTS collaborator_type text
NOT NULL
DEFAULT 'internal';

-- Normalisation des éventuelles lignes existantes
UPDATE public.hr_employee_requests
SET collaborator_type = 'internal'
WHERE collaborator_type IS NULL;

-- Sécurisation des valeurs autorisées
ALTER TABLE public.hr_employee_requests
DROP CONSTRAINT IF EXISTS hr_employee_requests_collaborator_type_check;

ALTER TABLE public.hr_employee_requests
ADD CONSTRAINT hr_employee_requests_collaborator_type_check
CHECK (
  collaborator_type IN (
    'internal',
    'external',
    'provider',
    'consultant',
    'apprentice',
    'intern',
    'other'
  )
);

CREATE INDEX IF NOT EXISTS
  idx_hr_employee_requests_collaborator_type
ON public.hr_employee_requests(collaborator_type);

COMMENT ON COLUMN public.hr_employee_requests.collaborator_type IS
'Type RH du collaborateur : interne, externe, prestataire, consultant, alternant, stagiaire ou autre.';
