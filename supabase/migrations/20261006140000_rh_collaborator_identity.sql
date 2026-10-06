-- ============================================================
-- BIB INTRANET
-- RH — RÉFÉRENTIEL COLLABORATEURS
--
-- Le référentiel RH repose sur public.profiles.
--
-- profiles.id = auth.users.id
--
-- Cette migration ajoute :
--   - collaborator_type
--   - hr_status
--
-- Le type de collaborateur et le statut RH sont distincts
-- du poste, du pôle et du type de contrat.
-- ============================================================


-- ============================================================
-- 1. TYPE DE COLLABORATEUR
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS collaborator_type TEXT;


-- ============================================================
-- 2. STATUT RH
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hr_status TEXT;


-- ============================================================
-- 3. VALEURS PAR DÉFAUT
-- ============================================================

UPDATE public.profiles
SET collaborator_type = 'internal'
WHERE collaborator_type IS NULL;


UPDATE public.profiles
SET hr_status = 'active'
WHERE hr_status IS NULL;


ALTER TABLE public.profiles
  ALTER COLUMN collaborator_type SET DEFAULT 'internal';


ALTER TABLE public.profiles
  ALTER COLUMN hr_status SET DEFAULT 'active';


-- ============================================================
-- 4. CONTRAINTES
-- ============================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_collaborator_type_check;


ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_collaborator_type_check
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


ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_hr_status_check;


ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_hr_status_check
  CHECK (
    hr_status IN (
      'active',
      'onboarding',
      'leave',
      'suspended',
      'leaving',
      'archived'
    )
  );


-- ============================================================
-- 5. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_collaborator_type
  ON public.profiles(collaborator_type);


CREATE INDEX IF NOT EXISTS idx_profiles_hr_status
  ON public.profiles(hr_status);


CREATE INDEX IF NOT EXISTS idx_profiles_hr_directory
  ON public.profiles(collaborator_type, hr_status);


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN public.profiles.collaborator_type IS
'Type RH du collaborateur : internal, external, provider, consultant, apprentice, intern ou other.';


COMMENT ON COLUMN public.profiles.hr_status IS
'Statut RH du collaborateur : active, onboarding, leave, suspended, leaving ou archived.';


-- ============================================================
-- 7. RLS — LECTURE DU RÉFÉRENTIEL
-- ============================================================

DROP POLICY IF EXISTS "RH can view all collaborator profiles"
ON public.profiles;


CREATE POLICY "RH can view all collaborator profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
  OR id = auth.uid()
);


-- ============================================================
-- 8. RLS — MODIFICATION PAR RH
--
-- RH peut administrer les informations RH du collaborateur.
-- La création du compte reste du ressort du workflow
-- d'onboarding/provisionnement.
-- ============================================================

DROP POLICY IF EXISTS "RH can update collaborator profiles"
ON public.profiles;


CREATE POLICY "RH can update collaborator profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
  OR id = auth.uid()
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['rh']
  )
  OR id = auth.uid()
);


-- ============================================================
-- FIN
-- ============================================================
