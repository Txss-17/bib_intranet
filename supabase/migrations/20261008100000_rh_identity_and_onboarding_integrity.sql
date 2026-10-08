-- ============================================================
-- BIB INTRANET
-- RH — IDENTITÉ, COMPTES TEST ET INTÉGRITÉ ONBOARDING
-- ============================================================

-- ============================================================
-- 1. IDENTIFIER EXPLICITEMENT LES COMPTES DE TEST
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS test_account BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_test_account
  ON public.profiles(test_account);

CREATE INDEX IF NOT EXISTS idx_profiles_hr_status_test_account
  ON public.profiles(hr_status, test_account);


-- ============================================================
-- 2. SYNCHRONISER LES COMPTES DE TEST EXISTANTS
--
-- Le provisioning des comptes de test inscrit déjà
-- test_account=true dans auth.users.user_metadata.
-- On reporte cette information dans profiles.
-- ============================================================

UPDATE public.profiles p
SET test_account = TRUE
FROM auth.users u
WHERE u.id = p.id
  AND lower(
    COALESCE(
      u.raw_user_meta_data ->> 'test_account',
      ''
    )
  ) IN ('true', '1', 'yes');


-- ============================================================
-- 3. CORRIGER LA RELATION DU RÉFÉRENT RH
--
-- L'ancien schéma pouvait avoir :
--   hr_employee_requests.manager_id -> auth.users(id)
--
-- Le modèle RH utilise désormais :
--   hr_employee_requests.manager_id -> profiles(id)
-- ============================================================

ALTER TABLE public.hr_employee_requests
  DROP CONSTRAINT IF EXISTS hr_employee_requests_manager_id_fkey;

ALTER TABLE public.hr_employee_requests
  ADD CONSTRAINT hr_employee_requests_manager_id_fkey
  FOREIGN KEY (manager_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hr_employee_requests_manager
  ON public.hr_employee_requests(manager_id);

COMMENT ON COLUMN public.hr_employee_requests.manager_id IS
'Référent RH du collaborateur. Référence profiles.id et doit correspondre à un responsable RH actif ou en onboarding.';


-- ============================================================
-- 4. NETTOYER LES ANCIENS RÉFÉRENTS ORPHELINS
--
-- Si une ancienne valeur pointait vers auth.users mais ne
-- possède pas de profil correspondant, elle devient NULL.
-- ============================================================

UPDATE public.hr_employee_requests r
SET manager_id = NULL
WHERE manager_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = r.manager_id
  );


-- ============================================================
-- 5. VALIDATION SERVEUR DE L'ONBOARDING
-- ============================================================

CREATE OR REPLACE FUNCTION public.rh_validate_onboarding_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  expected_pole TEXT;
BEGIN

  expected_pole := CASE NEW.position
    WHEN 'supplier_manager'
      THEN 'supplier'

    WHEN 'customer_success_manager'
      THEN 'marketplace'

    WHEN 'ops_logistics_manager'
      THEN 'ops'

    WHEN 'finance_manager'
      THEN 'finance'

    WHEN 'audit_compliance_lead'
      THEN 'audit'

    WHEN 'rse_impact_manager'
      THEN 'rse'

    WHEN 'product_engineering_manager'
      THEN 'product'

    WHEN 'marketing_communication_manager'
      THEN 'marketing'

    WHEN 'rh_manager'
      THEN 'rh'

    WHEN 'data_bi_manager'
      THEN 'data'

    WHEN 'security_it_manager'
      THEN 'security'

    WHEN 'ceo'
      THEN 'direction'

    ELSE NULL
  END;


  -- ----------------------------------------------------------
  -- Le poste doit être compatible avec au moins un pôle.
  -- ----------------------------------------------------------

  IF expected_pole IS NOT NULL
     AND NOT (
       expected_pole = ANY(
         COALESCE(
           NEW.poles,
           ARRAY[]::TEXT[]
         )
       )
     )
  THEN
    RAISE EXCEPTION
      'Le poste % exige le pôle %.',
      NEW.position,
      expected_pole;
  END IF;


  -- ----------------------------------------------------------
  -- Un référent doit être :
  --   - un vrai profil
  --   - non test
  --   - actif ou en onboarding
  --   - responsable RH
  --   - rattaché au pôle RH
  -- ----------------------------------------------------------

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
           COALESCE(
             p.poles,
             ARRAY[]::TEXT[]
           )
         )
     )
  THEN
    RAISE EXCEPTION
      'Le référent sélectionné doit être un responsable RH réel, actif ou en onboarding.';
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
'Contrôle serveur des compatibilités poste/pôle et de l’éligibilité du référent RH pour l’Onboarding.';


-- ============================================================
-- 6. ANNUAIRE DES EMPLOYÉS CONNECTÉS
--
-- Les comptes techniques de test ne doivent jamais apparaître
-- dans les vues RH opérationnelles.
-- ============================================================

CREATE OR REPLACE FUNCTION public.employee_access_directory()
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  "position" TEXT,
  poles TEXT[],
  hr_status TEXT,
  roles TEXT[],
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.position::TEXT,
    p.poles::TEXT[],
    p.hr_status,

    COALESCE(
      (
        SELECT array_agg(ur.role::TEXT)
        FROM public.user_roles ur
        WHERE ur.user_id = p.id
      ),
      '{}'
    ),

    u.last_sign_in_at

  FROM public.profiles p

  JOIN auth.users u
    ON u.id = p.id

  WHERE
    u.last_sign_in_at IS NOT NULL

    AND COALESCE(p.test_account, FALSE) = FALSE

    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.is_leadership(auth.uid())
      OR public.has_pole(auth.uid(), 'rh')
    )

  ORDER BY
    u.last_sign_in_at DESC;
$$;


REVOKE ALL
ON FUNCTION public.employee_access_directory()
FROM public, anon;

GRANT EXECUTE
ON FUNCTION public.employee_access_directory()
TO authenticated;
