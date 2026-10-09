
-- ============================================================
-- BIB INTRANET — RÉFÉRENTIEL CENTRAL DES POSTES RH
-- Migration : 20261009100000
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rh_position_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  position_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  pole_id TEXT NOT NULL,

  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created_by UUID REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rh_position_catalog_key_format
    CHECK (position_key ~ '^[a-z][a-z0-9_]*$'),

  CONSTRAINT rh_position_catalog_label_not_empty
    CHECK (length(trim(label)) > 0),

  CONSTRAINT rh_position_catalog_pole_not_empty
    CHECK (length(trim(pole_id)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_rh_position_catalog_pole_active
  ON public.rh_position_catalog (pole_id, active);

ALTER TABLE public.rh_position_catalog ENABLE ROW LEVEL SECURITY;

-- Les collaborateurs authentifiés peuvent lire les postes actifs.
DROP POLICY IF EXISTS "Authenticated users read active RH positions"
  ON public.rh_position_catalog;

CREATE POLICY "Authenticated users read active RH positions"
  ON public.rh_position_catalog
  FOR SELECT
  TO authenticated
  USING (
    active = TRUE
    OR public.has_pole(auth.uid(), 'rh')
    OR public.is_leadership(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Seuls RH, la direction et les administrateurs peuvent créer
-- ou modifier le référentiel des postes.
DROP POLICY IF EXISTS "RH manages position catalog"
  ON public.rh_position_catalog;

CREATE POLICY "RH manages position catalog"
  ON public.rh_position_catalog
  FOR ALL
  TO authenticated
  USING (
    public.has_pole(auth.uid(), 'rh')
    OR public.is_leadership(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_pole(auth.uid(), 'rh')
    OR public.is_leadership(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Catalogue initial : reprise des postes déjà présents
-- dans le formulaire d'onboarding.
INSERT INTO public.rh_position_catalog (
  position_key,
  label,
  pole_id,
  active
)
VALUES
  (
    'supplier_manager',
    'Responsable Fournisseurs & Produits',
    'supplier',
    TRUE
  ),
  (
    'customer_success_manager',
    'Responsable Marketplace & Customer Success',
    'marketplace',
    TRUE
  ),
  (
    'ops_logistics_manager',
    'Responsable Opérations & Logistique',
    'ops',
    TRUE
  ),
  (
    'finance_manager',
    'Responsable Finance',
    'finance',
    TRUE
  ),
  (
    'audit_compliance_lead',
    'Responsable Qualité, Audit & Conformité',
    'audit',
    TRUE
  ),
  (
    'rse_impact_manager',
    'Responsable RSE & Impact',
    'rse',
    TRUE
  ),
  (
    'product_engineering_manager',
    'Responsable Product & Engineering',
    'product',
    TRUE
  ),
  (
    'marketing_communication_manager',
    'Responsable Marketing & Communication',
    'marketing',
    TRUE
  ),
  (
    'rh_manager',
    'Responsable RH',
    'rh',
    TRUE
  ),
  (
    'data_bi_manager',
    'Responsable Data & BI',
    'data',
    TRUE
  ),
  (
    'security_it_manager',
    'Responsable Security & IT',
    'security',
    TRUE
  ),
  (
    'ceo',
    'Direction',
    'direction',
    TRUE
  )
ON CONFLICT (position_key)
DO UPDATE SET
  label = EXCLUDED.label,
  pole_id = EXCLUDED.pole_id,
  active = EXCLUDED.active,
  updated_at = NOW();

COMMENT ON TABLE public.rh_position_catalog IS
  'Référentiel central des postes RH, rattachés à un pôle.';

COMMENT ON COLUMN public.rh_position_catalog.position_key IS
  'Identifiant technique stable utilisé par les profils et les workflows.';

COMMENT ON COLUMN public.rh_position_catalog.pole_id IS
  'Identifiant du pôle défini dans le référentiel BIB des pôles.';
