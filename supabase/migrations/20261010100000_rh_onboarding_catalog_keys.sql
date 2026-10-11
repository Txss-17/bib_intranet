-- Keep onboarding requests aligned with the RH position and access catalogs.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS position_key TEXT;

UPDATE public.profiles
SET position_key = position::TEXT
WHERE position_key IS NULL
  AND position IS NOT NULL;

ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS position_key TEXT;

UPDATE public.hr_employee_requests
SET position_key = position::TEXT
WHERE position_key IS NULL
  AND position IS NOT NULL;

ALTER TABLE public.hr_employee_requests
  ALTER COLUMN requested_role DROP DEFAULT;

ALTER TABLE public.hr_employee_requests
  ALTER COLUMN requested_role TYPE TEXT
  USING requested_role::TEXT;

ALTER TABLE public.hr_employee_requests
  ALTER COLUMN requested_role SET DEFAULT 'viewer';

COMMENT ON COLUMN public.profiles.position_key IS
  'Identifiant du poste dans rh_position_catalog, y compris pour les postes hors enum historique employee_position.';

COMMENT ON COLUMN public.hr_employee_requests.position_key IS
  'Identifiant du poste dans rh_position_catalog; position reste renseigné lorsque la valeur appartient à employee_position.';

COMMENT ON COLUMN public.hr_employee_requests.requested_role IS
  'Clé textuelle du rôle du catalogue access_roles.';

CREATE OR REPLACE FUNCTION public.rh_validate_onboarding_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  catalog_key TEXT;
  catalog_pole TEXT;
  catalog_active BOOLEAN;
BEGIN
  catalog_key := COALESCE(
    NULLIF(NEW.position_key, ''),
    NEW.position::TEXT
  );

  IF catalog_key IS NULL THEN
    RAISE EXCEPTION 'Un poste doit être sélectionné.';
  END IF;

  SELECT pole_id, active
    INTO catalog_pole, catalog_active
  FROM public.rh_position_catalog
  WHERE position_key = catalog_key
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Le poste "%" est absent du catalogue RH.',
      catalog_key;
  END IF;

  IF catalog_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION
      'Le poste "%" est désactivé dans le catalogue RH.',
      catalog_key;
  END IF;

  IF NOT (
    catalog_pole = ANY(
      COALESCE(NEW.poles, ARRAY[]::TEXT[])
    )
  ) THEN
    RAISE EXCEPTION
      'Le poste "%" exige le pôle "%".',
      catalog_key,
      catalog_pole;
  END IF;

  IF NEW.manager_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles p
       WHERE p.id = NEW.manager_id
         AND COALESCE(p.test_account, FALSE) = FALSE
         AND COALESCE(p.hr_status, 'active')
             IN ('active', 'onboarding')
         AND p.position = 'rh_manager'
         AND 'rh' = ANY(
           COALESCE(p.poles, ARRAY[]::TEXT[])
         )
     )
  THEN
    RAISE EXCEPTION
      'Le référent sélectionné doit être un responsable RH réel, actif ou en onboarding.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rh_validate_onboarding_request
ON public.hr_employee_requests;

CREATE TRIGGER trg_rh_validate_onboarding_request
BEFORE INSERT OR UPDATE OF position, position_key, poles, manager_id
ON public.hr_employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.rh_validate_onboarding_request();

COMMENT ON FUNCTION public.rh_validate_onboarding_request()
IS 'Valide le poste du catalogue RH, sa compatibilité avec les pôles affectés et l’éligibilité du référent RH.';
