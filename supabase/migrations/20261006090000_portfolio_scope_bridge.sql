-- ============================================================
-- BIB INTRANET
-- PONT TRANSVERSAL : PORTEFEUILLES MÉTIER ↔ RBAC
-- VERSION CORRIGÉE
--
-- Principe :
-- - les portefeuilles métier sont centralisés dans le moteur
--   transversal ;
-- - les affectations de collaborateurs restent séparées ;
-- - aucune conversion implicite profiles.id → employees.id ;
-- - les affectations Marketplace seront créées explicitement
--   via le système RBAC/RH.
-- ============================================================


-- ============================================================
-- 1. TYPES DE PORTEFEUILLES MÉTIER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.access_portfolio_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  portfolio_type_key TEXT NOT NULL UNIQUE,

  label TEXT NOT NULL,

  business_pole TEXT NOT NULL,

  source_table TEXT NOT NULL,

  source_id_column TEXT NOT NULL DEFAULT 'id',

  description TEXT,

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


CREATE INDEX IF NOT EXISTS idx_access_portfolio_types_pole
  ON public.access_portfolio_types(business_pole);

CREATE INDEX IF NOT EXISTS idx_access_portfolio_types_status
  ON public.access_portfolio_types(status);


-- ============================================================
-- 2. PORTEFEUILLES MÉTIER TRANSVERSAUX
--
-- Cette table ne remplace pas les tables métier existantes.
--
-- Elle constitue le registre transversal permettant au RBAC
-- de référencer un portefeuille fournisseur, Marketplace, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.access_business_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  portfolio_type_id UUID NOT NULL
    REFERENCES public.access_portfolio_types(id)
    ON DELETE CASCADE,

  source_id UUID NOT NULL,

  label_snapshot TEXT,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      status IN (
        'active',
        'inactive',
        'archived'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (
    portfolio_type_id,
    source_id
  )
);


CREATE INDEX IF NOT EXISTS idx_access_business_portfolios_type
  ON public.access_business_portfolios(portfolio_type_id);

CREATE INDEX IF NOT EXISTS idx_access_business_portfolios_source
  ON public.access_business_portfolios(source_id);

CREATE INDEX IF NOT EXISTS idx_access_business_portfolios_status
  ON public.access_business_portfolios(status);


-- ============================================================
-- 3. AFFECTATIONS DES COLLABORATEURS AUX PORTEFEUILLES
--
-- IMPORTANT :
-- employee_id référence exclusivement employees.id.
--
-- Aucune supposition n'est faite concernant profiles.id.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.access_portfolio_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id UUID NOT NULL
    REFERENCES public.employees(id)
    ON DELETE CASCADE,

  portfolio_id UUID NOT NULL
    REFERENCES public.access_business_portfolios(id)
    ON DELETE CASCADE,

  access_assignment_id UUID
    REFERENCES public.access_assignments(id)
    ON DELETE SET NULL,

  assignment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (
      assignment_status IN (
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

  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT access_portfolio_assignment_dates_check
    CHECK (
      ends_at IS NULL
      OR ends_at >= starts_at
    )
);


CREATE INDEX IF NOT EXISTS idx_access_portfolio_assignments_employee
  ON public.access_portfolio_assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_access_portfolio_assignments_portfolio
  ON public.access_portfolio_assignments(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_access_portfolio_assignments_access
  ON public.access_portfolio_assignments(access_assignment_id);

CREATE INDEX IF NOT EXISTS idx_access_portfolio_assignments_status
  ON public.access_portfolio_assignments(assignment_status);


-- Une même combinaison collaborateur + portefeuille +
-- affectation RBAC ne peut être active qu'une seule fois.

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_access_portfolio_assignment_active
ON public.access_portfolio_assignments(
  employee_id,
  portfolio_id,
  access_assignment_id
)
WHERE assignment_status = 'active';


-- ============================================================
-- 4. REGISTRE DES TYPES DE PORTEFEUILLES
-- ============================================================

INSERT INTO public.access_portfolio_types (
  portfolio_type_key,
  label,
  business_pole,
  source_table,
  source_id_column,
  description,
  status
)
VALUES
(
  'supplier',
  'Portefeuilles fournisseurs',
  'supplier',
  'supplier_portfolios',
  'id',
  'Portefeuilles métier regroupant les fournisseurs attribués aux collaborateurs du pôle Fournisseurs.',
  'active'
),
(
  'marketplace_merchant',
  'Portefeuilles marchands',
  'marketplace',
  'merchant_portfolios',
  'id',
  'Portefeuilles métier regroupant les marchands et leurs boutiques attribués aux collaborateurs Marketplace.',
  'active'
)
ON CONFLICT (portfolio_type_key)
DO UPDATE SET
  label = EXCLUDED.label,
  business_pole = EXCLUDED.business_pole,
  source_table = EXCLUDED.source_table,
  source_id_column = EXCLUDED.source_id_column,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = now();


-- ============================================================
-- 5. SYNCHRONISATION DES PORTEFEUILLES FOURNISSEURS
-- ============================================================

INSERT INTO public.access_business_portfolios (
  portfolio_type_id,
  source_id,
  label_snapshot,
  status
)
SELECT
  apt.id,

  sp.id,

  COALESCE(
    NULLIF(sp.category, ''),
    NULLIF(sp.responsible_name, ''),
    'Portefeuille fournisseur'
  ),

  'active'

FROM public.access_portfolio_types apt

JOIN public.supplier_portfolios sp
  ON apt.portfolio_type_key = 'supplier'

ON CONFLICT (
  portfolio_type_id,
  source_id
)

DO UPDATE SET
  label_snapshot = EXCLUDED.label_snapshot,
  status = EXCLUDED.status,
  updated_at = now();


-- ============================================================
-- 6. SYNCHRONISATION DES PORTEFEUILLES MARKETPLACE
-- ============================================================

INSERT INTO public.access_business_portfolios (
  portfolio_type_id,
  source_id,
  label_snapshot,
  status
)
SELECT
  apt.id,

  mp.id,

  mp.name,

  CASE
    WHEN mp.status = 'active'
      THEN 'active'
    ELSE 'inactive'
  END

FROM public.access_portfolio_types apt

JOIN public.merchant_portfolios mp
  ON apt.portfolio_type_key = 'marketplace_merchant'

ON CONFLICT (
  portfolio_type_id,
  source_id
)

DO UPDATE SET
  label_snapshot = EXCLUDED.label_snapshot,
  status = EXCLUDED.status,
  updated_at = now();


-- ============================================================
-- 7. SYNCHRONISATION DES AFFECTATIONS FOURNISSEURS
--
-- Ici assigned_to_id est déjà l'identifiant utilisé par
-- portfolio_assignments pour le collaborateur.
--
-- Aucune conversion profiles → employees n'est effectuée.
-- ============================================================

INSERT INTO public.access_portfolio_assignments (
  employee_id,
  portfolio_id,
  assignment_status,
  starts_at,
  reason
)

SELECT
  pa.assigned_to_id,

  abp.id,

  'active',

  COALESCE(
    pa.assigned_at,
    now()
  ),

  'Synchronisation depuis portfolio_assignments'

FROM public.portfolio_assignments pa

JOIN public.access_portfolio_types apt
  ON apt.portfolio_type_key = 'supplier'

JOIN public.access_business_portfolios abp
  ON abp.portfolio_type_id = apt.id
 AND abp.source_id = pa.portfolio_id

WHERE pa.assigned_to_id IS NOT NULL

  AND pa.portfolio_id IS NOT NULL

ON CONFLICT DO NOTHING;


-- ============================================================
-- 8. PAS DE SYNCHRONISATION AUTOMATIQUE MARKETPLACE
-- ============================================================
--
-- merchant_portfolio_assignments représente actuellement :
--
--      marchand → portefeuille
--
-- et non :
--
--      collaborateur → portefeuille.
--
-- De plus :
--
--      merchant_portfolios.owner_id
--
-- référence profiles.id.
--
-- Le moteur RBAC attend :
--
--      access_portfolio_assignments.employee_id
--      → employees.id
--
-- Nous ne faisons donc aucune conversion implicite.
--
-- L'affectation d'un collaborateur Marketplace sera créée
-- explicitement lorsque l'identité RH/RBAC sera résolue.
--
-- ============================================================


-- ============================================================
-- 9. TRIGGERS updated_at
-- ============================================================

DROP TRIGGER IF EXISTS trg_access_portfolio_types_updated
ON public.access_portfolio_types;

CREATE TRIGGER trg_access_portfolio_types_updated

BEFORE UPDATE
ON public.access_portfolio_types

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS trg_access_business_portfolios_updated
ON public.access_business_portfolios;

CREATE TRIGGER trg_access_business_portfolios_updated

BEFORE UPDATE
ON public.access_business_portfolios

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS trg_access_portfolio_assignments_updated
ON public.access_portfolio_assignments;

CREATE TRIGGER trg_access_portfolio_assignments_updated

BEFORE UPDATE
ON public.access_portfolio_assignments

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 10. RLS
-- ============================================================

ALTER TABLE public.access_portfolio_types
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.access_business_portfolios
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.access_portfolio_assignments
  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 11. LECTURE DES TYPES
-- ============================================================

DROP POLICY IF EXISTS access_portfolio_types_select
ON public.access_portfolio_types;

CREATE POLICY access_portfolio_types_select

ON public.access_portfolio_types

FOR SELECT

TO authenticated

USING (
  auth.uid() IS NOT NULL
);


-- ============================================================
-- 12. LECTURE DES PORTEFEUILLES MÉTIER
-- ============================================================

DROP POLICY IF EXISTS access_business_portfolios_select
ON public.access_business_portfolios;

CREATE POLICY access_business_portfolios_select

ON public.access_business_portfolios

FOR SELECT

TO authenticated

USING (
  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )

  OR EXISTS (
    SELECT 1

    FROM public.access_portfolio_types apt

    WHERE apt.id =
      access_business_portfolios.portfolio_type_id

      AND public.has_any_pole(
        auth.uid(),
        ARRAY[apt.business_pole]
      )
  )
);


-- ============================================================
-- 13. LECTURE DES AFFECTATIONS DE PORTEFEUILLES
-- ============================================================

DROP POLICY IF EXISTS access_portfolio_assignments_select
ON public.access_portfolio_assignments;

CREATE POLICY access_portfolio_assignments_select

ON public.access_portfolio_assignments

FOR SELECT

TO authenticated

USING (
  public.is_leadership(auth.uid())

  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )

  OR EXISTS (
    SELECT 1

    FROM public.access_business_portfolios abp

    JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id

    WHERE abp.id =
      access_portfolio_assignments.portfolio_id

      AND public.has_any_pole(
        auth.uid(),
        ARRAY[apt.business_pole]
      )
  )
);


-- ============================================================
-- 14. SERVICE ROLE
-- ============================================================

GRANT ALL
ON public.access_portfolio_types
TO service_role;

GRANT ALL
ON public.access_business_portfolios
TO service_role;

GRANT ALL
ON public.access_portfolio_assignments
TO service_role;
