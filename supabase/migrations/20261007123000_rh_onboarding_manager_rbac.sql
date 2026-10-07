-- ============================================================
-- BIB INTRANET
-- RH — ONBOARDING : RÉFÉRENT + VALIDATION MÉTIER
-- ============================================================

ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS manager_id UUID
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hr_employee_requests_manager
  ON public.hr_employee_requests(manager_id);

COMMENT ON COLUMN public.hr_employee_requests.manager_id IS
'Référent RH du collaborateur. Le référent doit être un responsable RH actif ou en onboarding.';


-- ============================================================
-- VALIDATION SERVEUR DU DOSSIER
-- ============================================================

CREATE OR REPLACE FUNCTION public.rh_validate_onboarding_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  expected_pole TEXT;
BEGIN

  expected_pole := CASE NEW.position
    WHEN 'supplier_manager' THEN 'supplier'
    WHEN 'customer_success_manager' THEN 'marketplace'
    WHEN 'ops_logistics_manager' THEN 'ops'
    WHEN 'finance_manager' THEN 'finance'
    WHEN 'audit_compliance_lead' THEN 'audit'
    WHEN 'rse_impact_manager' THEN 'rse'
    WHEN 'product_engineering_manager' THEN 'product'
    WHEN 'marketing_communication_manager' THEN 'marketing'
    WHEN 'rh_manager' THEN 'rh'
    WHEN 'data_bi_manager' THEN 'data'
    WHEN 'security_it_manager' THEN 'security'
    WHEN 'ceo' THEN 'direction'
    ELSE NULL
  END;


  -- Le poste principal doit appartenir à l'un des pôles
  -- sélectionnés dans le dossier.
  IF expected_pole IS NOT NULL
     AND NOT (
       expected_pole = ANY(
         COALESCE(
           NEW.poles,
           ARRAY[]::text[]
         )
       )
     )
  THEN
    RAISE EXCEPTION
      'Le poste % exige le pôle %.',
      NEW.position,
      expected_pole;
  END IF;


  -- Le référent doit être un responsable RH réel.
  IF NEW.manager_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles p
       WHERE p.id = NEW.manager_id
         AND COALESCE(
           p.hr_status,
           'active'
         ) IN (
           'active',
           'onboarding'
         )
         AND 'rh' = ANY(
           COALESCE(
             p.poles,
             ARRAY[]::text[]
           )
         )
         AND p.position = 'rh_manager'
     )
  THEN
    RAISE EXCEPTION
      'Le référent sélectionné doit être un responsable RH actif ou en onboarding.';
  END IF;


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
  trg_rh_validate_onboarding_request
ON public.hr_employee_requests;


CREATE TRIGGER
  trg_rh_validate_onboarding_request

BEFORE INSERT OR UPDATE OF
  position,
  poles,
  manager_id

ON public.hr_employee_requests

FOR EACH ROW

EXECUTE FUNCTION
  public.rh_validate_onboarding_request();


COMMENT ON FUNCTION public.rh_validate_onboarding_request()
IS
'Contrôle serveur des compatibilités poste/pôle et de l''éligibilité du référent RH pour l''Onboarding.';
