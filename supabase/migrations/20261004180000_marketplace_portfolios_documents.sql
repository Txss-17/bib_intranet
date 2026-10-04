-- ============================================================
-- BIB INTRANET
-- MARKETPLACE : MARCHANDS, PORTEFEUILLES, DOCUMENTS & COMMUNICATIONS
-- ============================================================
--
-- Principes :
--
-- 1. Le marchand est l'unité principale de gestion Marketplace.
-- 2. Un marchand peut posséder plusieurs boutiques.
-- 3. Toutes les boutiques d'un marchand suivent son portefeuille.
-- 4. Le cycle de vie d'une boutique est géré par Marketplace.
-- 5. Ops exploite les boutiques actives mais ne gère pas leur cycle.
-- 6. Google Workspace / Drive reste l'environnement documentaire
--    professionnel de référence.
-- 7. Les communications marchands sont contextualisées et journalisées.
--
-- ============================================================


-- ============================================================
-- 1. RATTACHEMENT BOUTIQUE → MARCHAND
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS merchant_id uuid
    REFERENCES public.user_accounts(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shops_merchant_id
  ON public.shops(merchant_id);


-- ============================================================
-- 2. PORTEFEUILLES MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,

  owner_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  role_scope text NOT NULL DEFAULT 'marketplace',

  status text NOT NULL DEFAULT 'active',

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT merchant_portfolios_status_check
    CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolios_owner
  ON public.merchant_portfolios(owner_id);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolios_status
  ON public.merchant_portfolios(status);


-- ============================================================
-- 3. HISTORIQUE D'AFFECTATION DES MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_portfolio_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  merchant_id uuid NOT NULL
    REFERENCES public.user_accounts(id)
    ON DELETE CASCADE,

  portfolio_id uuid NOT NULL
    REFERENCES public.merchant_portfolios(id)
    ON DELETE CASCADE,

  assigned_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  assigned_at timestamptz NOT NULL DEFAULT now(),

  ended_at timestamptz,

  reason text,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT merchant_portfolio_assignment_dates_check
    CHECK (
      ended_at IS NULL
      OR ended_at >= assigned_at
    )
);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolio_assignments_merchant
  ON public.merchant_portfolio_assignments(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolio_assignments_portfolio
  ON public.merchant_portfolio_assignments(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolio_assignments_active
  ON public.merchant_portfolio_assignments(merchant_id)
  WHERE ended_at IS NULL;


CREATE UNIQUE INDEX IF NOT EXISTS
  uq_active_merchant_portfolio_assignment
ON public.merchant_portfolio_assignments(merchant_id)
WHERE ended_at IS NULL;


-- ============================================================
-- 4. DOCUMENTS BIB
-- ============================================================
--
-- Cette table ne remplace PAS Google Drive.
-- Elle constitue l'index métier documentaire de l'Intranet.
-- Le fichier physique reste dans Google Workspace / Drive.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bib_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_name text NOT NULL,

  document_type text NOT NULL,

  confidentiality_level text NOT NULL DEFAULT 'internal',

  drive_file_id text,

  drive_url text,

  drive_owner_email text,

  merchant_id uuid
    REFERENCES public.user_accounts(id)
    ON DELETE SET NULL,

  shop_id uuid
    REFERENCES public.shops(id)
    ON DELETE SET NULL,

  related_pole text,

  related_entity_type text,

  related_entity_id uuid,

  status text NOT NULL DEFAULT 'pending',

  imported_from_drive boolean NOT NULL DEFAULT false,

  created_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bib_documents_confidentiality_check
    CHECK (
      confidentiality_level IN (
        'internal',
        'confidential',
        'restricted',
        'highly_restricted'
      )
    ),

  CONSTRAINT bib_documents_status_check
    CHECK (
      status IN (
        'pending',
        'active',
        'archived',
        'rejected'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_bib_documents_merchant
  ON public.bib_documents(merchant_id);

CREATE INDEX IF NOT EXISTS idx_bib_documents_shop
  ON public.bib_documents(shop_id);

CREATE INDEX IF NOT EXISTS idx_bib_documents_pole
  ON public.bib_documents(related_pole);

CREATE INDEX IF NOT EXISTS idx_bib_documents_drive
  ON public.bib_documents(drive_file_id);

CREATE INDEX IF NOT EXISTS idx_bib_documents_status
  ON public.bib_documents(status);


-- ============================================================
-- 5. JOURNAL DES ÉCHANGES DOCUMENTAIRES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bib_document_exchange_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id uuid NOT NULL
    REFERENCES public.bib_documents(id)
    ON DELETE CASCADE,

  action text NOT NULL,

  actor_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  destination text,

  recipient text,

  success boolean NOT NULL DEFAULT true,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bib_document_exchange_action_check
    CHECK (
      action IN (
        'import_drive',
        'export_drive',
        'external_send',
        'download',
        'print',
        'copy'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_document
  ON public.bib_document_exchange_log(document_id);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_actor
  ON public.bib_document_exchange_log(actor_id);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_created
  ON public.bib_document_exchange_log(created_at DESC);


-- ============================================================
-- 6. MODÈLES DE COMMUNICATION MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,

  label text NOT NULL,

  situation text NOT NULL,

  subject_template text NOT NULL,

  body_template text NOT NULL,

  pole text NOT NULL DEFAULT 'marketplace',

  active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_communication_templates_pole
  ON public.merchant_communication_templates(pole);

CREATE INDEX IF NOT EXISTS idx_merchant_communication_templates_active
  ON public.merchant_communication_templates(active);


-- ============================================================
-- 7. COMMUNICATIONS MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  merchant_id uuid NOT NULL
    REFERENCES public.user_accounts(id)
    ON DELETE CASCADE,

  shop_id uuid
    REFERENCES public.shops(id)
    ON DELETE SET NULL,

  portfolio_id uuid
    REFERENCES public.merchant_portfolios(id)
    ON DELETE SET NULL,

  template_id uuid
    REFERENCES public.merchant_communication_templates(id)
    ON DELETE SET NULL,

  situation text NOT NULL,

  recipient text NOT NULL,

  subject text NOT NULL,

  body text NOT NULL,

  signature text NOT NULL,

  sent_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  sent_at timestamptz,

  status text NOT NULL DEFAULT 'draft',

  gateway_message_ref text,

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT merchant_communications_status_check
    CHECK (
      status IN (
        'draft',
        'sent',
        'failed',
        'cancelled'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_merchant
  ON public.merchant_communications(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_shop
  ON public.merchant_communications(shop_id);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_portfolio
  ON public.merchant_communications(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_status
  ON public.merchant_communications(status);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_sent
  ON public.merchant_communications(sent_at DESC);


-- ============================================================
-- 8. MODÈLES INITIAUX MARKETPLACE
-- ============================================================

INSERT INTO public.merchant_communication_templates
(
  code,
  label,
  situation,
  subject_template,
  body_template,
  pole
)
VALUES

(
  'merchant_document_request',
  'Demande de document',
  'Document complémentaire requis',
  'B.I.B — Document complémentaire requis pour votre boutique',
  E'Bonjour {{merchant_name}},\n\nDans le cadre du suivi de votre activité sur B.I.B, nous avons besoin d’un document complémentaire concernant votre boutique {{shop_name}}.\n\nDocument demandé : {{document_type}}\n\nMerci de nous transmettre ce document afin que nous puissions poursuivre l’examen de votre dossier.\n\nCordialement,\nB.I.B — Marketplace',
  'marketplace'
),

(
  'merchant_shop_approved',
  'Validation d’une boutique',
  'Boutique validée',
  'B.I.B — Votre boutique {{shop_name}} est validée',
  E'Bonjour {{merchant_name}},\n\nNous vous confirmons que votre boutique {{shop_name}} a été validée par B.I.B.\n\nVous pouvez désormais poursuivre son développement dans l’environnement B.I.B.\n\nCordialement,\nB.I.B — Marketplace',
  'marketplace'
),

(
  'merchant_subscription_upgrade',
  'Proposition d’évolution',
  'Opportunité d’abonnement ou d’add-on',
  'B.I.B — Une évolution adaptée à votre activité',
  E'Bonjour {{merchant_name}},\n\nAprès analyse de votre activité et de vos boutiques, nous avons identifié une évolution qui pourrait être pertinente pour votre développement.\n\nNous souhaiterions vous présenter cette possibilité et ses avantages.\n\nCordialement,\nB.I.B — Marketplace',
  'marketplace'
),

(
  'merchant_follow_up',
  'Suivi marchand',
  'Relance ou accompagnement',
  'B.I.B — Suivi de votre activité',
  E'Bonjour {{merchant_name}},\n\nNous revenons vers vous concernant le suivi de votre activité sur B.I.B.\n\nNous souhaitons faire le point avec vous sur votre situation et les prochaines étapes.\n\nCordialement,\nB.I.B — Marketplace',
  'marketplace'
)

ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 9. UPDATED_AT
-- ============================================================

DROP TRIGGER IF EXISTS trg_merchant_portfolios_updated
ON public.merchant_portfolios;

CREATE TRIGGER trg_merchant_portfolios_updated
BEFORE UPDATE ON public.merchant_portfolios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS trg_bib_documents_updated
ON public.bib_documents;

CREATE TRIGGER trg_bib_documents_updated
BEFORE UPDATE ON public.bib_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS trg_merchant_communication_templates_updated
ON public.merchant_communication_templates;

CREATE TRIGGER trg_merchant_communication_templates_updated
BEFORE UPDATE ON public.merchant_communication_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


DROP TRIGGER IF EXISTS trg_merchant_communications_updated
ON public.merchant_communications;

CREATE TRIGGER trg_merchant_communications_updated
BEFORE UPDATE ON public.merchant_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 10. RLS
-- ============================================================

ALTER TABLE public.merchant_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_portfolio_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_document_exchange_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_communications ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 11. PORTEFEUILLES
-- ============================================================

DROP POLICY IF EXISTS
  "Marketplace portfolios read"
ON public.merchant_portfolios;

CREATE POLICY
  "Marketplace portfolios read"
ON public.merchant_portfolios
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS
  "Marketplace portfolios manage"
ON public.merchant_portfolios;

CREATE POLICY
  "Marketplace portfolios manage"
ON public.merchant_portfolios
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- ============================================================
-- 12. AFFECTATIONS
-- ============================================================

DROP POLICY IF EXISTS
  "Marketplace portfolio assignments read"
ON public.merchant_portfolio_assignments;

CREATE POLICY
  "Marketplace portfolio assignments read"
ON public.merchant_portfolio_assignments
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS
  "Marketplace portfolio assignments manage"
ON public.merchant_portfolio_assignments;

CREATE POLICY
  "Marketplace portfolio assignments manage"
ON public.merchant_portfolio_assignments
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- ============================================================
-- 13. DOCUMENTS
-- ============================================================

DROP POLICY IF EXISTS
  "BIB documents read"
ON public.bib_documents;

CREATE POLICY
  "BIB documents read"
ON public.bib_documents
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    related_pole IS NOT NULL
    AND public.has_any_pole(
      auth.uid(),
      ARRAY[related_pole]
    )
  )
);


DROP POLICY IF EXISTS
  "BIB documents manage"
ON public.bib_documents;

CREATE POLICY
  "BIB documents manage"
ON public.bib_documents
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    related_pole IS NOT NULL
    AND public.has_any_pole(
      auth.uid(),
      ARRAY[related_pole]
    )
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    related_pole IS NOT NULL
    AND public.has_any_pole(
      auth.uid(),
      ARRAY[related_pole]
    )
  )
);


-- ============================================================
-- 14. JOURNAL DOCUMENTAIRE
-- ============================================================

DROP POLICY IF EXISTS
  "BIB document exchange log read"
ON public.bib_document_exchange_log;

CREATE POLICY
  "BIB document exchange log read"
ON public.bib_document_exchange_log
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace','audit','compliance','finance','rh','supplier','ops']
  )
);


DROP POLICY IF EXISTS
  "BIB document exchange log insert"
ON public.bib_document_exchange_log;

CREATE POLICY
  "BIB document exchange log insert"
ON public.bib_document_exchange_log
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'marketplace',
      'audit',
      'compliance',
      'finance',
      'rh',
      'supplier',
      'ops'
    ]
  )
);


-- ============================================================
-- 15. MODÈLES DE COMMUNICATION
-- ============================================================

DROP POLICY IF EXISTS
  "Merchant communication templates read"
ON public.merchant_communication_templates;

CREATE POLICY
  "Merchant communication templates read"
ON public.merchant_communication_templates
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS
  "Merchant communication templates manage"
ON public.merchant_communication_templates;

CREATE POLICY
  "Merchant communication templates manage"
ON public.merchant_communication_templates
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- ============================================================
-- 16. COMMUNICATIONS MARCHANDS
-- ============================================================

DROP POLICY IF EXISTS
  "Merchant communications read"
ON public.merchant_communications;

CREATE POLICY
  "Merchant communications read"
ON public.merchant_communications
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS
  "Merchant communications create"
ON public.merchant_communications;

CREATE POLICY
  "Merchant communications create"
ON public.merchant_communications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS
  "Merchant communications update"
ON public.merchant_communications;

CREATE POLICY
  "Merchant communications update"
ON public.merchant_communications
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- ============================================================
-- FIN
-- ============================================================
