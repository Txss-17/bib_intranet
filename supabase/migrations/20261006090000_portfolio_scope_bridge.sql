-- ============================================================
-- BIB INTRANET
-- PONT TRANSVERSAL : PORTEFEUILLES MÉTIER ↔ RBAC
-- ============================================================
--
-- PRINCIPES
--
-- 1. Les portefeuilles métier restent propres à chaque pôle.
--
--    Fournisseurs :
--      supplier_portfolios
--      portfolio_assignments
--
--    Marketplace :
--      merchant_portfolios
--      merchant_portfolio_assignments
--
-- 2. Le RBAC reste transversal :
--
--      collaborateur
--          ↓
--        rôle
--          ↓
--      permissions
--          ↓
--       périmètre
--          ↓
--     ressources accessibles
--
-- 3. Un portefeuille métier ne donne PAS de permission.
--    Il définit uniquement le périmètre de ressources.
--
-- 4. Un collaborateur peut avoir plusieurs affectations.
--
-- 5. On ne remplace PAS les tables métier existantes.
--    Cette migration crée uniquement leur représentation
--    comme périmètre RBAC lorsqu'elle est nécessaire.
--
-- ============================================================


-- ============================================================
-- 1. TYPES DE PORTEFEUILLES MÉTIER
-- ============================================================
--
-- Cette table constitue le catalogue technique des types de
-- portefeuille utilisables par le moteur transversal.
--
-- Les données métier restent dans leurs propres tables.
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
-- 2. PORTEFEUILLES MÉTIER RÉFÉRENCÉS PAR LE RBAC
-- ============================================================
--
-- Cette table ne contient PAS les données détaillées du
-- portefeuille.
--
-- Elle contient uniquement une référence vers le portefeuille
-- métier réel.
--
-- Exemple :
--
--   portfolio_type_key = supplier
--   source_table       = supplier_portfolios
--   source_id          = UUID du portefeuille fournisseur
--
-- ou :
--
--   portfolio_type_key = marketplace_merchant
--   source_table       = merchant_portfolios
--   source_id          = UUID du portefeuille Marketplace
--
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
-- 3. AFFECTATION COLLABORATEUR → PORTEFEUILLE MÉTIER
-- ============================================================
--
-- Cette table complète access_assignments.
--
-- access_assignments répond à :
--
--   "Quel rôle possède ce collaborateur ?"
--
-- Cette table répond à :
--
--   "Sur quel portefeuille métier ce rôle peut-il agir ?"
--
-- Les deux dimensions restent donc séparées.
--
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


-- Une même affectation active ne doit pas être dupliquée.
CREATE UNIQUE INDEX IF NOT EXISTS
  uq_access_portfolio_assignment_active
ON public.access_portfolio_assignments(
  employee_id,
  portfolio_id,
  access_assignment_id
)
WHERE assignment_status = 'active';


-- ============================================================
-- 4. CATALOGUE DES TYPES
-- ============================================================
--
-- Fournisseurs
-- Marketplace
--
-- D'autres pôles pourront être ajoutés sans modifier le modèle.
-- ============================================================

INSERT INTO public.access_portfolio_types (
  portfolio_type_key,
  label,
  business_pole,
  source_table,
  source_id_column,
  description
)
VALUES

(
  'supplier',
  'Portefeuille fournisseurs',
  'supplier',
  'supplier_portfolios',
  'id',
  'Portefeuille métier regroupant les fournisseurs attribués à un collaborateur du pôle Fournisseurs.'
),

(
  'marketplace_merchant',
  'Portefeuille marchands',
  'marketplace',
  'merchant_portfolios',
  'id',
  'Portefeuille métier regroupant les marchands et leurs boutiques attribués à un collaborateur Marketplace.'
)

ON CONFLICT (portfolio_type_key)
DO UPDATE SET
  label = EXCLUDED.label,
  business_pole = EXCLUDED.business_pole,
  source_table = EXCLUDED.source_table,
  source_id_column = EXCLUDED.source_id_column,
  description = EXCLUDED.description,
  updated_at = now();


-- ============================================================
-- 5. SYNCHRONISATION DES PORTEFEUILLES FOURNISSEURS
-- ============================================================
--
-- On crée une référence RBAC pour les portefeuilles déjà
-- présents dans supplier_portfolios.
--
-- Aucun enregistrement métier n'est modifié.
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
  status = 'active',
  updated_at = now();


-- ============================================================
-- 6. SYNCHRONISATION DES PORTEFEUILLES MARKETPLACE
-- ============================================================
--
-- Même principe :
-- merchant_portfolios reste la source métier.
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
    WHEN mp.status = 'active' THEN 'active'
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
-- ============================================================
--
-- Le système historique :
--
--   portfolio_assignments
--
-- devient une source métier d'affectation.
--
-- On ne le supprime pas.
--
-- On crée simplement la liaison avec le moteur transversal.
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
  COALESCE(pa.assigned_at, now()),
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
-- 8. SYNCHRONISATION DES AFFECTATIONS MARKETPLACE
-- ============================================================
--
-- Le système Marketplace conserve :
--
--   merchant_portfolio_assignments
--
-- comme source métier.
--
-- Le moteur transversal récupère une référence.
-- ============================================================

INSERT INTO public.access_portfolio_assignments (
  employee_id,
  portfolio_id,
  assignment_status,
  starts_at,
  reason
)
SELECT
  mp.owner_id,
  abp.id,
  'active',
  COALESCE(mpa.assigned_at, now()),
  'Synchronisation depuis merchant_portfolio_assignments'
FROM public.merchant_portfolio_assignments mpa

JOIN public.access_portfolio_types apt
  ON apt.portfolio_type_key = 'marketplace_merchant'

JOIN public.access_business_portfolios abp
  ON abp.portfolio_type_id = apt.id
  AND abp.source_id = mpa.portfolio_id

JOIN public.merchant_portfolios mp
  ON mp.id = mpa.portfolio_id

WHERE mp.owner_id IS NOT NULL
  AND mpa.ended_at IS NULL

ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. MISE À JOUR AUTOMATIQUE
-- ============================================================

DROP TRIGGER IF EXISTS
  trg_access_portfolio_types_updated
ON public.access_portfolio_types;

CREATE TRIGGER
  trg_access_portfolio_types_updated
BEFORE UPDATE ON public.access_portfolio_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS
  trg_access_business_portfolios_updated
ON public.access_business_portfolios;

CREATE TRIGGER
  trg_access_business_portfolios_updated
BEFORE UPDATE ON public.access_business_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS
  trg_access_portfolio_assignments_updated
ON public.access_portfolio_assignments;

CREATE TRIGGER
  trg_access_portfolio_assignments_updated
BEFORE UPDATE ON public.access_portfolio_assignments
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

DROP POLICY IF EXISTS
  access_portfolio_types_select
ON public.access_portfolio_types;

CREATE POLICY
  access_portfolio_types_select
ON public.access_portfolio_types
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
);


-- ============================================================
-- 12. LECTURE DES PORTEFEUILLES
-- ============================================================
--
-- La lecture reste compatible avec le pôle concerné.
-- Les restrictions fines par rôle/périmètre seront appliquées
-- dans les étapes RBAC suivantes.
-- ============================================================

DROP POLICY IF EXISTS
  access_business_portfolios_select
ON public.access_business_portfolios;

CREATE POLICY
  access_business_portfolios_select
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
    WHERE apt.id = access_business_portfolios.portfolio_type_id
      AND public.has_any_pole(
        auth.uid(),
        ARRAY[apt.business_pole]
      )
  )
);


-- ============================================================
-- 13. LECTURE DES AFFECTATIONS
-- ============================================================

DROP POLICY IF EXISTS
  access_portfolio_assignments_select
ON public.access_portfolio_assignments;

CREATE POLICY
  access_portfolio_assignments_select
ON public.access_portfolio_assignments
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(
    auth.uid(),
    'admin'::app_role
  )
  OR employee_id IN (
    SELECT e.id
    FROM public.employees e
    WHERE e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.access_business_portfolios abp
    JOIN public.access_portfolio_types apt
      ON apt.id = abp.portfolio_type_id
    WHERE abp.id = access_portfolio_assignments.portfolio_id
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


-- ============================================================
-- FIN
-- ============================================================
