-- ============================================================
-- BIB — RH / DOSSIERS COLLABORATEURS
-- Renforcement RLS + exclusion des comptes de test
-- ============================================================

-- ============================================================
-- 1. FONCTION DE CONTRÔLE D'ACCÈS
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
    FROM public.profiles target_profile
    WHERE
      target_profile.id = p_employee_id
      AND COALESCE(target_profile.test_account, FALSE) = FALSE
      AND EXISTS (
        SELECT 1
        FROM public.profiles requester
        WHERE
          requester.id = auth.uid()
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
              FROM public.user_roles ur
              WHERE
                ur.user_id = auth.uid()
                AND ur.role::TEXT IN (
                  'admin',
                  'executive'
                )
            )
            OR (
              requester.id = p_employee_id
              AND COALESCE(
                requester.test_account,
                FALSE
              ) = FALSE
            )
          )
      )
  );
$$;


REVOKE ALL
ON FUNCTION public.can_access_rh_employee_documents(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.can_access_rh_employee_documents(UUID)
TO authenticated;


-- ============================================================
-- 2. FONCTION DE CONTRÔLE POUR LES ÉCRITURES
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
    FROM public.profiles target_profile
    WHERE
      target_profile.id = p_employee_id
      AND COALESCE(target_profile.test_account, FALSE) = FALSE
      AND EXISTS (
        SELECT 1
        FROM public.profiles requester
        WHERE
          requester.id = auth.uid()
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
              FROM public.user_roles ur
              WHERE
                ur.user_id = auth.uid()
                AND ur.role::TEXT IN (
                  'admin',
                  'executive'
                )
            )
          )
      )
  );
$$;


REVOKE ALL
ON FUNCTION public.can_manage_rh_employee_documents(UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.can_manage_rh_employee_documents(UUID)
TO authenticated;


-- ============================================================
-- 3. RECRÉATION DES POLICIES
-- ============================================================

DROP POLICY IF EXISTS
  "rh_employee_documents_select"
ON public.rh_employee_documents;

DROP POLICY IF EXISTS
  "rh_employee_documents_insert"
ON public.rh_employee_documents;

DROP POLICY IF EXISTS
  "rh_employee_documents_update"
ON public.rh_employee_documents;

DROP POLICY IF EXISTS
  "rh_employee_documents_delete"
ON public.rh_employee_documents;


-- ============================================================
-- SELECT
-- ============================================================

CREATE POLICY "rh_employee_documents_select"
ON public.rh_employee_documents
FOR SELECT
TO authenticated
USING (
  public.can_access_rh_employee_documents(
    employee_id
  )
);


-- ============================================================
-- INSERT
-- ============================================================

CREATE POLICY "rh_employee_documents_insert"
ON public.rh_employee_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_manage_rh_employee_documents(
    employee_id
  )
);


-- ============================================================
-- UPDATE
-- ============================================================

CREATE POLICY "rh_employee_documents_update"
ON public.rh_employee_documents
FOR UPDATE
TO authenticated
USING (
  public.can_manage_rh_employee_documents(
    employee_id
  )
)
WITH CHECK (
  public.can_manage_rh_employee_documents(
    employee_id
  )
);


-- ============================================================
-- DELETE
-- ============================================================

CREATE POLICY "rh_employee_documents_delete"
ON public.rh_employee_documents
FOR DELETE
TO authenticated
USING (
  public.can_manage_rh_employee_documents(
    employee_id
  )
);


-- ============================================================
-- 4. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS
  idx_rh_employee_documents_employee
ON public.rh_employee_documents(employee_id);


-- ============================================================
-- 5. DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION
  public.can_access_rh_employee_documents(UUID)
IS
'Contrôle SECURITY DEFINER de lecture des dossiers documentaires RH. Les comptes test_account sont systématiquement exclus.';


COMMENT ON FUNCTION
  public.can_manage_rh_employee_documents(UUID)
IS
'Contrôle SECURITY DEFINER de création, modification et suppression des documents RH. Les comptes test_account sont systématiquement exclus.';
