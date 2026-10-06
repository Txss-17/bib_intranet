-- ============================================================
-- BIB INTRANET
-- RBAC — capacités métier du rôle
-- ============================================================

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS seniority TEXT
    CHECK (
      seniority IN (
        'junior',
        'mid',
        'senior',
        'lead',
        'executive'
      )
    );

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS is_external BOOLEAN
    NOT NULL DEFAULT false;

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS read_only BOOLEAN
    NOT NULL DEFAULT false;

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS poles TEXT[]
    NOT NULL DEFAULT '{}';

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS landing_path TEXT;

CREATE INDEX IF NOT EXISTS idx_access_roles_department
  ON public.access_roles(department);

CREATE INDEX IF NOT EXISTS idx_access_roles_business_pole
  ON public.access_roles(business_pole);

CREATE INDEX IF NOT EXISTS idx_access_roles_seniority
  ON public.access_roles(seniority);

CREATE INDEX IF NOT EXISTS idx_access_roles_external
  ON public.access_roles(is_external);


-- ============================================================
-- Fonction permettant de récupérer les capacités d'un rôle
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_role_capabilities(
  p_role_id UUID
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'role_id',
    r.id,

    'role_key',
    r.role_key,

    'label',
    r.label,

    'department',
    r.department,

    'business_pole',
    r.business_pole,

    'owner_type',
    r.owner_type,

    'seniority',
    r.seniority,

    'is_external',
    r.is_external,

    'read_only',
    r.read_only,

    'poles',
    to_jsonb(r.poles),

    'landing_path',
    r.landing_path,

    'status',
    r.status
  )
  FROM public.access_roles r
  WHERE r.id = p_role_id;
$$;


-- ============================================================
-- Fonction de test d'une permission explicite
--
-- Cette fonction ne remplace PAS encore RLS.
-- Elle constitue le point central qui sera utilisé ensuite
-- par les politiques RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_access_permission(
  p_role_id UUID,
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
    FROM public.access_permissions p
    INNER JOIN public.access_interfaces i
      ON i.id = p.interface_id
    INNER JOIN public.access_actions a
      ON a.id = p.action_id
    WHERE p.role_id = p_role_id
      AND i.interface_key = p_interface_key
      AND a.action_key = p_action_key
      AND p.allowed = true
      AND i.status = 'active'
  );
$$;


-- ============================================================
-- Fonction de résolution par compte utilisateur
--
-- Un compte peut avoir plusieurs affectations.
-- Une permission est accordée si au moins une affectation
-- active possède cette permission.
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


REVOKE ALL
ON FUNCTION public.get_role_capabilities(UUID)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.has_access_permission(
  UUID,
  TEXT,
  TEXT
)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.user_has_access_permission(
  UUID,
  TEXT,
  TEXT
)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.get_role_capabilities(UUID)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.has_access_permission(
  UUID,
  TEXT,
  TEXT
)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.user_has_access_permission(
  UUID,
  TEXT,
  TEXT
)
TO authenticated;
