-- ============================================================
-- BIB INTRANET
-- RBAC — IDENTITÉ COLLABORATEUR
--
-- Correction :
-- l'identité métier d'un collaborateur BIB est portée par
-- public.profiles.id, lui-même aligné sur auth.users.id.
--
-- Ancien modèle :
--   access_assignments.employee_id
--       -> public.employees(id)
--
-- Nouveau modèle :
--   access_assignments.employee_id
--       -> public.profiles(id)
--
-- Même correction pour :
--   access_change_history
--
-- Cette migration ne crée PAS de table employees.
-- ============================================================


-- ============================================================
-- 1. AFFECTATIONS RBAC
-- ============================================================

DO $$
DECLARE
  constraint_name TEXT;
BEGIN

  /*
   * Suppression de toute ancienne FK portée par
   * access_assignments.employee_id.
   *
   * On recherche la contrainte dynamiquement afin de ne pas
   * dépendre du nom généré automatiquement par PostgreSQL.
   */
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.access_assignments'::regclass
      AND att.attname = 'employee_id'
      AND con.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.access_assignments DROP CONSTRAINT IF EXISTS %I',
      constraint_name
    );
  END LOOP;

END;
$$;


ALTER TABLE public.access_assignments
  ADD CONSTRAINT access_assignments_profile_fk
  FOREIGN KEY (employee_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;


-- ============================================================
-- 2. HISTORIQUE DES CHANGEMENTS
-- ============================================================

DO $$
DECLARE
  constraint_name TEXT;
BEGIN

  /*
   * Même correction pour l'historique RBAC.
   */
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_attribute att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY(con.conkey)
    WHERE con.conrelid = 'public.access_change_history'::regclass
      AND att.attname = 'employee_id'
      AND con.contype = 'f'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.access_change_history DROP CONSTRAINT IF EXISTS %I',
      constraint_name
    );
  END LOOP;

END;
$$;


ALTER TABLE public.access_change_history
  ADD CONSTRAINT access_change_history_profile_fk
  FOREIGN KEY (employee_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;


-- ============================================================
-- 3. INDEX D'IDENTITÉ
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_access_assignments_employee
  ON public.access_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_access_change_history_employee
  ON public.access_change_history(employee_id);


-- ============================================================
-- 4. FONCTION DE RÉSOLUTION D'UNE PERMISSION
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_has_access_permission(
  p_user_id UUID,
  p_interface_key TEXT,
  p_action_key TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.access_assignments aa

    INNER JOIN public.access_permissions ap
      ON ap.role_id = aa.role_id

    INNER JOIN public.access_interfaces ai
      ON ai.id = ap.interface_id

    INNER JOIN public.access_actions ac
      ON ac.id = ap.action_id

    /*
     * Le collaborateur BIB est identifié par profiles.id.
     * profiles.id correspond à auth.users.id.
     */
    WHERE aa.employee_id = p_user_id

      AND aa.status = 'active'

      AND (
        aa.starts_at IS NULL
        OR aa.starts_at <= now()
      )

      AND (
        aa.ends_at IS NULL
        OR aa.ends_at >= now()
      )

      AND ap.allowed = true

      AND ai.interface_key = p_interface_key

      AND ac.action_key = p_action_key

      AND ai.status = 'active'
  );
$$;


-- ============================================================
-- 5. SÉCURISATION DE LA FONCTION
-- ============================================================

REVOKE ALL
ON FUNCTION public.user_has_access_permission(
  UUID,
  TEXT,
  TEXT
)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.user_has_access_permission(
  UUID,
  TEXT,
  TEXT
)
TO authenticated;


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

COMMENT ON COLUMN public.access_assignments.employee_id IS
'Identifiant du collaborateur BIB. Référence public.profiles.id, lui-même aligné sur auth.users.id.';

COMMENT ON COLUMN public.access_change_history.employee_id IS
'Identifiant du collaborateur BIB concerné par le changement. Référence public.profiles.id.';


-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
