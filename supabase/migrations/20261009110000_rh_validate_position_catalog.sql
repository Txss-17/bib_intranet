
-- BIB INTRANET
-- Validation serveur de l'affectation poste / pôle
-- Référentiel : public.rh_position_catalog

CREATE OR REPLACE FUNCTION public.rh_validate_onboarding_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  catalog_pole TEXT;
  catalog_active BOOLEAN;
BEGIN
  -- 1. Un poste doit être sélectionné.
  IF NEW.position IS NULL OR length(trim(NEW.position)) = 0 THEN
    RAISE EXCEPTION 'Un poste doit être sélectionné.';
  END IF;

  -- 2. Le poste doit exister dans le catalogue et être actif.
  SELECT pole_id, active
    INTO catalog_pole, catalog_active
  FROM public.rh_position_catalog
  WHERE position_key = NEW.position
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Le poste "%" est absent du catalogue RH.',
      NEW.position;
  END IF;

  IF catalog_active IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION
      'Le poste "%" est désactivé dans le catalogue RH.',
      NEW.position;
  END IF;

  -- 3. Le pôle du poste doit être inclus dans les pôles affectés.
  IF NOT (
    catalog_pole = ANY(
      COALESCE(NEW.poles, ARRAY[]::TEXT[])
    )
  ) THEN
    RAISE EXCEPTION
      'Le poste "%" exige le pôle "%".',
      NEW.position,
      catalog_pole;
  END IF;

  -- 4. Le référent doit être un véritable responsable RH,
  --    actif ou en onboarding, et non un compte de test.
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
BEFORE INSERT OR UPDATE OF position, poles, manager_id
ON public.hr_employee_requests
FOR EACH ROW
EXECUTE FUNCTION public.rh_validate_onboarding_request();

COMMENT ON FUNCTION public.rh_validate_onboarding_request()
IS 'Valide côté serveur le poste actif du catalogue RH, sa compatibilité avec les pôles affectés et l’éligibilité du référent RH.';
