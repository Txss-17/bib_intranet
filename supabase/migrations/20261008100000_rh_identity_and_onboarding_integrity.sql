-- ============================================================
-- BIB INTRANET
-- RH — IDENTITÉ, COMPTES DE TEST ET INTÉGRITÉ ONBOARDING
--
-- Cette migration corrige deux problèmes structurels :
--
-- 1. profiles.test_account devient la référence explicite
--    permettant de distinguer les vrais collaborateurs
--    des comptes techniques de test.
--
-- 2. hr_employee_requests.manager_id référence désormais
--    public.profiles(id), et non auth.users(id).
--
-- Le référent RH doit obligatoirement être :
--   - un vrai collaborateur ;
--   - non-test ;
--   - actif ou en onboarding ;
--   - positionné comme rh_manager ;
--   - rattaché au pôle rh.
-- ============================================================


-- ============================================================
-- 1. IDENTIFICATION EXPLICITE DES COMPTES DE TEST
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS test_account BOOLEAN
  NOT NULL
  DEFAULT FALSE;


-- Synchronisation des comptes de test déjà créés.
--
-- Le provisioning historique écrit déjà :
-- auth.users.raw_user_meta_data.test_account = true
--
-- On récupère donc cette information une seule fois dans
-- profiles afin que les requêtes RH n'aient plus besoin
-- d'interroger les metadata Auth.

UPDATE public.profiles AS p
SET test_account = TRUE
FROM auth.users AS u
WHERE u.id = p.id
  AND COALESCE(
    (u.raw_user_meta_data ->> 'test_account')::BOOLEAN,
    FALSE
  ) = TRUE;


CREATE INDEX IF NOT EXISTS idx_profiles_test_account
  ON public.profiles(test_account);


COMMENT ON COLUMN public.profiles.test_account IS
'Compte technique de test/démonstration. Les comptes avec test_account=true sont exclus des référentiels RH opérationnels.';


-- ============================================================
-- 2. INDEX RH COMBINÉ
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_rh_directory_real
  ON public.profiles(test_account, collaborator_type, hr_status);


-- ============================================================
-- 3. CORRECTION DE LA RELATION manager_id
-- ============================================================

-- La table hr_employee_requests a historiquement été créée
-- avec :
--
-- manager_id UUID REFERENCES auth.users(id)
--
-- L'architecture RH actuelle utilise cependant profiles.id
-- pour représenter l'identité métier du collaborateur.
--
-- On supprime donc explicitement l'ancienne FK.

ALTER TABLE public.hr_employee_requests
  DROP CONSTRAINT IF EXISTS hr_employee_requests_manager_id_fkey;


-- Nettoyage des éventuelles références qui ne correspondent
-- plus à un profil existant.

UPDATE public.hr_employee_requests AS r
SET manager_id = NULL
WHERE r.manager_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = r.manager_id
  );


-- Nouvelle FK métier.

ALTER TABLE public.hr_employee_requests
  ADD CONSTRAINT hr_employee_requests_manager_id_fkey
  FOREIGN KEY (manager_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;


CREATE INDEX IF NOT EXISTS idx_hr_employee_requests_manager
  ON public.hr_employee_requests(manager_id);


COMMENT ON COLUMN public.hr_employee_requests.manager_id IS
'Référent RH du dossier collaborateur. Référence public.profiles.id.';


-- ============================================================
-- 4. FONCTION DE VALIDATION MÉTIER DE L'ONBOARDING
-- ============================================================

CREATE OR REPLACE FUNCTION public.rh_validate_onboarding_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected_pole TEXT;
BEGIN

  -- ----------------------------------------------------------
  -- 4.1 Correspondance poste → pôle principal
  -- ----------------------------------------------------------

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
      'Le poste "%" exige le pôle "%".',
      NEW.position,
      expected_pole;
  END IF;


  -- ----------------------------------------------------------
  -- 4.2 Validation du référent RH
  -- ----------------------------------------------------------

  IF NEW.manager_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.profiles AS p
       WHERE p.id = NEW.manager_id

         -- Jamais de compte de test comme référent.
         AND COALESCE(p.test_account, FALSE) = FALSE

         -- Le référent doit être opérationnel.
         AND p.hr_status IN (
           'active',
           'onboarding'
         )

         -- Fonction RH obligatoire.
         AND p.position = 'rh_manager'

         -- Appartenance RH obligatoire.
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


-- Suppression du trigger précédent pour éviter plusieurs
-- validations concurrentes.

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
EXECUTE FUNCTION public.rh_validate_onboarding_request();


-- ============================================================
-- 5. RÉPERTOIRE DES EMPLOYÉS CONNECTÉS
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
        SELECT array_agg(
          ur.role::TEXT
        )
        FROM public.user_roles AS ur
        WHERE ur.user_id = p.id
      ),
      '{}'
    ),

    u.last_sign_in_at

  FROM public.profiles AS p

  INNER JOIN auth.users AS u
    ON u.id = p.id

  WHERE
    -- Exclusion explicite des comptes techniques.
    COALESCE(p.test_account, FALSE) = FALSE

    -- Seulement les utilisateurs réellement connectés.
    AND u.last_sign_in_at IS NOT NULL

    -- Accès réservé aux profils autorisés.
    AND (
      public.has_role(
        auth.uid(),
        'admin'
      )

      OR public.is_leadership(
        auth.uid()
      )

      OR public.has_pole(
        auth.uid(),
        'rh'
      )
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


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION public.rh_validate_onboarding_request()
IS
'Validation métier du workflow RH : cohérence poste/pôle et contrôle du référent RH.';


COMMENT ON FUNCTION public.employee_access_directory()
IS
'Répertoire des collaborateurs réels récemment connectés. Les comptes techniques test_account=true sont exclus.';
