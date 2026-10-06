-- ============================================================
-- BIB INTRANET — RBAC
-- Comptes / rôles métier / permissions / périmètres / affectations
-- ============================================================

-- ------------------------------------------------------------
-- 1. RÔLES MÉTIER
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,

  department TEXT,
  business_pole TEXT,

  description TEXT,

  -- owner_type:
  -- pole_responsible = responsable du pôle
  -- direction = Direction temporairement propriétaire
  owner_type TEXT NOT NULL DEFAULT 'pole_responsible'
    CHECK (
      owner_type IN (
        'pole_responsible',
        'direction'
      )
    ),

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      status IN (
        'draft',
        'active',
        'inactive',
        'archived'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_roles_department
  ON public.access_roles(department);

CREATE INDEX IF NOT EXISTS idx_access_roles_business_pole
  ON public.access_roles(business_pole);

CREATE INDEX IF NOT EXISTS idx_access_roles_status
  ON public.access_roles(status);


-- ------------------------------------------------------------
-- 2. INTERFACES ACCESSIBLES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  interface_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,

  module TEXT,
  pole TEXT,

  path TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      status IN (
        'draft',
        'active',
        'inactive',
        'archived'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_interfaces_pole
  ON public.access_interfaces(pole);

CREATE INDEX IF NOT EXISTS idx_access_interfaces_module
  ON public.access_interfaces(module);

CREATE INDEX IF NOT EXISTS idx_access_interfaces_status
  ON public.access_interfaces(status);


-- ------------------------------------------------------------
-- 3. ACTIONS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  action_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,

  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ------------------------------------------------------------
-- 4. PERMISSIONS
--
-- Une permission relie :
-- rôle + interface + action
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role_id UUID NOT NULL
    REFERENCES public.access_roles(id)
    ON DELETE CASCADE,

  interface_id UUID NOT NULL
    REFERENCES public.access_interfaces(id)
    ON DELETE CASCADE,

  action_id UUID NOT NULL
    REFERENCES public.access_actions(id)
    ON DELETE CASCADE,

  allowed BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (
    role_id,
    interface_id,
    action_id
  )
);

CREATE INDEX IF NOT EXISTS idx_access_permissions_role
  ON public.access_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_access_permissions_interface
  ON public.access_permissions(interface_id);

CREATE INDEX IF NOT EXISTS idx_access_permissions_action
  ON public.access_permissions(action_id);


-- ------------------------------------------------------------
-- 5. PÉRIMÈTRES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  scope_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,

  scope_type TEXT NOT NULL
    CHECK (
      scope_type IN (
        'global',
        'pole',
        'portfolio',
        'region',
        'record',
        'custom'
      )
    ),

  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_scopes_type
  ON public.access_scopes(scope_type);


-- ------------------------------------------------------------
-- 6. PÉRIMÈTRES DES RÔLES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_role_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role_id UUID NOT NULL
    REFERENCES public.access_roles(id)
    ON DELETE CASCADE,

  scope_id UUID NOT NULL
    REFERENCES public.access_scopes(id)
    ON DELETE CASCADE,

  scope_value TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (
    role_id,
    scope_id,
    scope_value
  )
);

CREATE INDEX IF NOT EXISTS idx_access_role_scopes_role
  ON public.access_role_scopes(role_id);

CREATE INDEX IF NOT EXISTS idx_access_role_scopes_scope
  ON public.access_role_scopes(scope_id);


-- ------------------------------------------------------------
-- 7. AFFECTATIONS DES COMPTES
--
-- Un collaborateur peut avoir un rôle métier.
-- Le rôle reste distinct du poste RH.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id UUID NOT NULL
    REFERENCES public.employees(id)
    ON DELETE CASCADE,

  role_id UUID NOT NULL
    REFERENCES public.access_roles(id)
    ON DELETE RESTRICT,

  scope_id UUID
    REFERENCES public.access_scopes(id)
    ON DELETE SET NULL,

  scope_value TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      status IN (
        'pending',
        'active',
        'suspended',
        'revoked',
        'expired'
      )
    ),

  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,

  assigned_by UUID
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_assignments_employee
  ON public.access_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_access_assignments_role
  ON public.access_assignments(role_id);

CREATE INDEX IF NOT EXISTS idx_access_assignments_scope
  ON public.access_assignments(scope_id);

CREATE INDEX IF NOT EXISTS idx_access_assignments_status
  ON public.access_assignments(status);


-- ------------------------------------------------------------
-- 8. HISTORIQUE DES CHANGEMENTS D'ACCÈS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.access_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  actor_id UUID
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  employee_id UUID
    REFERENCES public.employees(id)
    ON DELETE SET NULL,

  role_id UUID
    REFERENCES public.access_roles(id)
    ON DELETE SET NULL,

  assignment_id UUID
    REFERENCES public.access_assignments(id)
    ON DELETE SET NULL,

  change_type TEXT NOT NULL,

  previous_value JSONB,
  new_value JSONB,

  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_history_employee
  ON public.access_change_history(employee_id);

CREATE INDEX IF NOT EXISTS idx_access_history_role
  ON public.access_change_history(role_id);

CREATE INDEX IF NOT EXISTS idx_access_history_actor
  ON public.access_change_history(actor_id);

CREATE INDEX IF NOT EXISTS idx_access_history_created_at
  ON public.access_change_history(created_at DESC);


-- ------------------------------------------------------------
-- 9. RLS
-- ------------------------------------------------------------

ALTER TABLE public.access_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_role_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_change_history ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 10. LECTURE
--
-- Phase initiale :
-- les utilisateurs authentifiés peuvent consulter le catalogue.
-- Les écritures seront ensuite limitées à RH / Direction /
-- Security selon la gouvernance définie.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS access_roles_select
  ON public.access_roles;

CREATE POLICY access_roles_select
  ON public.access_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_interfaces_select
  ON public.access_interfaces;

CREATE POLICY access_interfaces_select
  ON public.access_interfaces
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_actions_select
  ON public.access_actions;

CREATE POLICY access_actions_select
  ON public.access_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_permissions_select
  ON public.access_permissions;

CREATE POLICY access_permissions_select
  ON public.access_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_scopes_select
  ON public.access_scopes;

CREATE POLICY access_scopes_select
  ON public.access_scopes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_role_scopes_select
  ON public.access_role_scopes;

CREATE POLICY access_role_scopes_select
  ON public.access_role_scopes
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_assignments_select
  ON public.access_assignments;

CREATE POLICY access_assignments_select
  ON public.access_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


DROP POLICY IF EXISTS access_change_history_select
  ON public.access_change_history;

CREATE POLICY access_change_history_select
  ON public.access_change_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);


-- ------------------------------------------------------------
-- 11. SERVICE ROLE
-- ------------------------------------------------------------

GRANT ALL ON public.access_roles TO service_role;
GRANT ALL ON public.access_interfaces TO service_role;
GRANT ALL ON public.access_actions TO service_role;
GRANT ALL ON public.access_permissions TO service_role;
GRANT ALL ON public.access_scopes TO service_role;
GRANT ALL ON public.access_role_scopes TO service_role;
GRANT ALL ON public.access_assignments TO service_role;
GRANT ALL ON public.access_change_history TO service_role;
