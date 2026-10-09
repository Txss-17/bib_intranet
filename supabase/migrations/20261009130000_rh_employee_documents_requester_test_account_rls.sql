-- ============================================================
-- BIB — RH / DOSSIERS COLLABORATEURS
-- Correctif : exclusion des comptes de test demandeurs
-- ============================================================
-- Objectifs :
-- 1. Interdire l'accès aux dossiers des comptes de test.
-- 2. Interdire aux comptes de test d'accéder aux documents RH,
--    même s'ils possèdent un rôle RH, Direction ou admin.
-- 3. Conserver les droits des comptes opérationnels autorisés.
-- 4. Ne pas modifier les migrations déjà appliquées.
-- ============================================================


-- ============================================================
-- 1. CONTRÔLE DE LECTURE
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_access_rh_employee_documents(
  p_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS target_profile
    WHERE target_profile.id = p_employee_id
      AND COALESCE(target_profile.test_account, FALSE) = FALSE
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS requester
        WHERE requester.id = auth.uid()

          -- Un compte de test ne peut jamais être demandeur.
          AND COALESCE(requester.test_account, FALSE) = FALSE

          AND (
            'rh' = ANY(
              COALESCE(
                requester.poles::TEXT[],
                ARRAY[]::TEXT[]
              )
            )

            OR 'direction' = ANY(
              COALESCE(
                requester.poles::TEXT[],
                ARRAY[]::TEXT[]
              )
            )

            OR EXISTS (
              SELECT 1
              FROM public.user_roles AS ur
              WHERE ur.user_id = auth.uid()
                AND ur.role::TEXT IN ('admin', 'executive')
            )

            -- Un collaborateur opérationnel peut consulter
            -- uniquement son propre dossier documentaire.
            OR requester.id = p_employee_id
          )
      )
  );
$$;


-- ============================================================
-- 2. CONTRÔLE DES ÉCRITURES
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_manage_rh_employee_documents(
  p_employee_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS target_profile
    WHERE target_profile.id = p_employee_id
      AND COALESCE(target_profile.test_account, FALSE) = FALSE
      AND EXISTS (
        SELECT 1
        FROM public.profiles AS requester
        WHERE requester.id = auth.uid()

          -- Un compte de test ne peut jamais créer,
          -- modifier ou supprimer des documents RH.
          AND COALESCE(requester.test_account, FALSE) = FALSE

          AND (
            'rh' = ANY(
              COALESCE(
                requester.poles::TEXT[],
                ARRAY[]::TEXT[]
              )
            )

            OR 'direction' = ANY(
              COALESCE(
                requester.poles::TEXT[],
                ARRAY[]::TEXT[]
              )
            )

            OR EXISTS (
              SELECT 1
              FROM public.user_roles AS ur
              WHERE ur.user_id = auth.uid()
                AND ur.role::TEXT IN ('admin', 'executive')
            )
          )
      )
  );
$$;


-- ============================================================
-- 3. PRIVILÈGES D'EXÉCUTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.can_access_rh_employee_documents(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.can_access_rh_employee_documents(UUID)
TO authenticated;


REVOKE ALL
ON FUNCTION public.can_manage_rh_employee_documents(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.can_manage_rh_employee_documents(UUID)
TO authenticated;


-- ============================================================
-- 4. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION
  public.can_access_rh_employee_documents(UUID)
IS
'Contrôle la lecture des documents RH. Le demandeur et le collaborateur cible doivent tous deux être des comptes opérationnels non test.';

COMMENT ON FUNCTION
  public.can_manage_rh_employee_documents(UUID)
IS
'Contrôle la création, la modification et la suppression des documents RH. Les comptes de test sont exclus comme demandeurs et comme cibles.';