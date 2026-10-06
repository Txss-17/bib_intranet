-- ============================================================
-- BIB INTRANET
-- MOTEUR TRANSVERSAL DES PORTEFEUILLES
--
-- Un portefeuille métier est distinct du RBAC :
--
--   RBAC
--     rôle
--     permission
--     périmètre
--
--   PORTFOLIO
--     ensemble de ressources métier attribuées
--     à un collaborateur
--
-- Identité collaborateur :
--   auth.users.id = profiles.id
--
-- Ce moteur permet notamment :
--   RH            -> périmètres collaborateurs
--   Fournisseurs  -> portefeuilles fournisseurs
--   Marketplace   -> portefeuilles marchands
--
-- IMPORTANT :
--   merchant_portfolio_assignments est une relation
--   marchand -> portefeuille.
--
--   access_portfolio_assignments est une relation
--   collaborateur -> portefeuille.
--
-- Ces deux relations ne doivent PAS être confondues.
-- ============================================================


-- ============================================================
-- 1. TYPES DE PORTEFEUILLES
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
-- 2. PORTEFEUILLES MÉTIER
--
-- Cette table est le registre transversal.
--
-- Elle ne remplace PAS les tables métier :
--
--   supplier_portfolios
--   merchant_portfolios
--
-- Elle fournit leur représentation commune au moteur
-- de périmètre/affectation.
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
-- 3. AFFECTATION COLLABORATEUR -> PORTEFEUILLE
--
-- employee_id correspond à profiles.id.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.access_portfolio_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id UUID NOT NULL
    REFERENCES public.profiles(id)
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


-- ============================================================
-- 4. EMPÊCHER LES DOUBLONS D'AFFECTATIONS ACTIVES
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_access_portfolio_assignment_active
ON public.access_portfolio_assignments(
  employee_id,
  portfolio_id
)
WHERE assignment_status = 'active';


-- ============================================================
-- 5. TYPES DE PORTEFEUILLES INITIAUX
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
-- 6. SYNCHRONISATION DES PORTEFEUILLES FOURNISSEURS
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

INNER JOIN public.supplier_portfolios sp
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
-- 7. SYNCHRONISATION DES PORTEFEUILLES MARKETPLACE
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

INNER JOIN public.merchant_portfolios mp
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
-- 8. SYNCHRONISATION DES AFFECTATIONS FOURNISSEURS
--
-- ATTENTION :
--
-- portfolio_assignments.assigned_to_id doit correspondre
-- à profiles.id pour être synchronisé.
--
-- On ne crée aucune conversion implicite depuis un ancien
-- modèle employees.
--
-- Les lignes ne correspondant pas à un profil existant
-- sont volontairement ignorées.
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

INNER JOIN public.profiles p
  ON p.id = pa.assigned_to_id

INNER JOIN public.access_portfolio_types apt
  ON apt.portfolio_type_key = 'supplier'

INNER JOIN public.access_business_portfolios abp
  ON abp.portfolio_type_id = apt.id

 AND abp.source_id = pa.portfolio_id

WHERE pa.assigned_to_id IS NOT NULL

  AND pa.portfolio_id IS NOT NULL

ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. MARKETPLACE :
-- PAS DE SYNCHRONISATION AUTOMATIQUE DES COLLABORATEURS
-- ============================================================
--
-- merchant_portfolio_assignments :
--
--     marchand -> portefeuille
--
-- access_portfolio_assignments :
--
--     collaborateur -> portefeuille
--
-- merchant_portfolios.owner_id :
--
--     propriétaire métier du portefeuille.
--
-- Ces informations ont des finalités différentes.
--
-- On ne transforme donc PAS automatiquement owner_id en
-- affectation RBAC.
-- ============================================================


-- ============================================================
-- 10. TRIGGERS updated_at
-- ============================================================

DROP TRIGGER IF EXISTS
  trg_access_portfolio_types_updated
ON public.access_portfolio_types;


CREATE TRIGGER
  trg_access_portfolio_types_updated

BEFORE UPDATE
ON public.access_portfolio_types

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS
  trg_access_business_portfolios_updated
ON public.access_business_portfolios;


CREATE TRIGGER
  trg_access_business_portfolios_updated

BEFORE UPDATE
ON public.access_business_portfolios

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS
  trg_access_portfolio_assignments_updated
ON public.access_portfolio_assignments;


CREATE TRIGGER
  trg_access_portfolio_assignments_updated

BEFORE UPDATE
ON public.access_portfolio_assignments

FOR EACH ROW

EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 11. RLS
-- ============================================================

ALTER TABLE public.access_portfolio_types
  ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.access_business_portfolios
  ENABLE ROW LEVEL SECURITY;


ALTER TABLE public.access_portfolio_assignments
  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 12. LECTURE DES TYPES
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
-- 13. LECTURE DES PORTEFEUILLES MÉTIER
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

    WHERE apt.id =
      access_business_portfolios.portfolio_type_id

      AND public.has_any_pole(
        auth.uid(),
        ARRAY[apt.business_pole]
      )
  )
);


-- ============================================================
-- 14. LECTURE DES AFFECTATIONS
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

  OR access_portfolio_assignments.employee_id = auth.uid()

  OR EXISTS (

    SELECT 1

    FROM public.access_business_portfolios abp

    INNER JOIN public.access_portfolio_types apt
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
-- 15. SERVICE ROLE
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
-- 16. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.access_portfolio_types IS
'Catalogue transversal des types de portefeuilles métier utilisés par les différents pôles BIB.';


COMMENT ON TABLE public.access_business_portfolios IS
'Représentation transversale des portefeuilles métier. La donnée métier source reste dans le pôle concerné.';


COMMENT ON TABLE public.access_portfolio_assignments IS
'Affectations collaborateur -> portefeuille. Le collaborateur est identifié par profiles.id.';


COMMENT ON COLUMN public.access_portfolio_assignments.employee_id IS
'Identifiant du collaborateur BIB. Référence public.profiles.id et auth.users.id.';


-- ============================================================
-- FIN
-- ============================================================
