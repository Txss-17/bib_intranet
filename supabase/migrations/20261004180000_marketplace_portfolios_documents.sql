-- ============================================================
-- BIB INTRANET
-- MARKETPLACE : PORTEFEUILLES MARCHANDS + DOCUMENTS + COMMUNICATION
-- ============================================================

-- ============================================================
-- 1. PORTEFEUILLES MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,

  owner_id uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  role_scope text NOT NULL DEFAULT 'gestionnaire_boutiques',

  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolios_owner
  ON public.merchant_portfolios(owner_id);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolios_status
  ON public.merchant_portfolios(status);


-- ============================================================
-- 2. AFFECTATION DES MARCHANDS AUX PORTEFEUILLES
--
-- Principe :
-- un marchand = un portefeuille responsable à un instant donné.
-- Les boutiques du marchand suivent automatiquement ce portefeuille.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_portfolio_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  merchant_id uuid NOT NULL,

  portfolio_id uuid NOT NULL
    REFERENCES public.merchant_portfolios(id)
    ON DELETE RESTRICT,

  assigned_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  assigned_at timestamptz NOT NULL DEFAULT now(),

  ended_at timestamptz,

  reason text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolio_assignments_merchant
  ON public.merchant_portfolio_assignments(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_portfolio_assignments_portfolio
  ON public.merchant_portfolio_assignments(portfolio_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_merchant_portfolio
  ON public.merchant_portfolio_assignments(merchant_id)
  WHERE ended_at IS NULL;


-- ============================================================
-- 3. RELATION MARCHAND / BOUTIQUE
--
-- On conserve la boutique comme entité opérationnelle.
-- Le marchand reste l'unité de responsabilité Marketplace.
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS merchant_id uuid;

CREATE INDEX IF NOT EXISTS idx_shops_merchant_id
  ON public.shops(merchant_id);


-- ============================================================
-- 4. DOCUMENTS BIB TRANSVERSES
--
-- Google Workspace / Drive est l'environnement documentaire.
-- Cette table stocke la référence métier et non une copie locale
-- systématique du document.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bib_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_name text NOT NULL,

  document_type text NOT NULL,

  confidentiality_level text NOT NULL DEFAULT 'internal'
    CHECK (
      confidentiality_level IN (
        'internal',
        'confidential',
        'restricted',
        'highly_restricted'
      )
    ),

  drive_file_id text,

  drive_url text,

  drive_owner_email text,

  merchant_id uuid,

  shop_id uuid
    REFERENCES public.shops(id)
    ON DELETE CASCADE,

  related_pole text,

  related_entity_type text,

  related_entity_id uuid,

  status text NOT NULL DEFAULT 'active'
    CHECK (
      status IN (
        'pending',
        'active',
        'archived',
        'rejected'
      )
    ),

  imported_from_drive boolean NOT NULL DEFAULT false,

  created_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bib_documents_merchant
  ON public.bib_documents(merchant_id);

CREATE INDEX IF NOT EXISTS idx_bib_documents_shop
  ON public.bib_documents(shop_id);

CREATE INDEX IF NOT EXISTS idx_bib_documents_pole
  ON public.bib_documents(related_pole);

CREATE INDEX IF NOT EXISTS idx_bib_documents_drive
  ON public.bib_documents(drive_file_id);


-- ============================================================
-- 5. JOURNAL DES IMPORTS / EXPORTS / ENVOIS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bib_document_exchange_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  document_id uuid
    REFERENCES public.bib_documents(id)
    ON DELETE SET NULL,

  action text NOT NULL
    CHECK (
      action IN (
        'import_drive',
        'export_drive',
        'external_send',
        'download',
        'print',
        'copy'
      )
    ),

  actor_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  destination text,

  recipient text,

  success boolean NOT NULL DEFAULT true,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_document
  ON public.bib_document_exchange_log(document_id);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_actor
  ON public.bib_document_exchange_log(actor_id);

CREATE INDEX IF NOT EXISTS idx_bib_document_exchange_created
  ON public.bib_document_exchange_log(created_at DESC);


-- ============================================================
-- 6. MODÈLES DE COMMUNICATION
--
-- Les modèles sont contextuels et restent modifiables
-- avant l'envoi.
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


-- ============================================================
-- 7. HISTORIQUE DES COMMUNICATIONS MARCHANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.merchant_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  merchant_id uuid NOT NULL,

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

  signature text,

  sent_by uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  sent_at timestamptz,

  status text NOT NULL DEFAULT 'draft'
    CHECK (
      status IN (
        'draft',
        'sent',
        'failed',
        'cancelled'
      )
    ),

  gateway_message_id uuid,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_merchant
  ON public.merchant_communications(merchant_id);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_portfolio
  ON public.merchant_communications(portfolio_id);

CREATE INDEX IF NOT EXISTS idx_merchant_communications_sent
  ON public.merchant_communications(sent_at DESC);


-- ============================================================
-- 8. MODÈLES DE COMMUNICATION INITIAUX
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
  'Demande de document complémentaire',
  'document_missing',
  'Documents complémentaires nécessaires — {{shop_name}}',
  'Bonjour {{merchant_first_name}},

Dans le cadre de l’examen de {{shop_name}}, nous avons besoin de quelques éléments complémentaires afin de poursuivre le traitement de votre dossier.

Documents concernés :
{{documents}}

Vous pouvez nous transmettre ces éléments via le canal documentaire indiqué par BIB.

Nous restons disponibles si vous avez besoin d’une précision concernant les éléments demandés.

Bien cordialement,

{{signature}}',
  'marketplace'
),

(
  'merchant_shop_approved',
  'Validation de boutique',
  'shop_approved',
  'Votre boutique {{shop_name}} est validée',
  'Bonjour {{merchant_first_name}},

Nous vous confirmons que votre boutique {{shop_name}} a été validée par BIB.

Les prochaines étapes vous seront communiquées selon le calendrier prévu.

Bien cordialement,

{{signature}}',
  'marketplace'
),

(
  'merchant_subscription_upgrade',
  'Proposition de montée en abonnement',
  'subscription_opportunity',
  'Une évolution de votre offre BIB',
  'Bonjour {{merchant_first_name}},

Au regard de l’évolution de votre activité et de vos boutiques, nous avons identifié une évolution de votre offre BIB qui pourrait être pertinente pour votre développement.

Nous souhaitons vous présenter cette possibilité et les avantages qu’elle pourrait apporter à votre activité.

Bien cordialement,

{{signature}}',
  'marketplace'
),

(
  'merchant_follow_up',
  'Relance marchand',
  'follow_up',
  'Suivi de votre dossier BIB',
  'Bonjour {{merchant_first_name}},

Nous revenons vers vous concernant votre dossier {{shop_name}}.

Nous vous invitons à nous transmettre les éléments attendus afin que nous puissions poursuivre son traitement.

Bien cordialement,

{{signature}}',
  'marketplace'
)

ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 9. RLS
-- ============================================================

ALTER TABLE public.merchant_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_portfolio_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_document_exchange_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_communications ENABLE ROW LEVEL SECURITY;


-- Lecture métier des portefeuilles Marketplace

DROP POLICY IF EXISTS merchant_portfolios_read ON public.merchant_portfolios;

CREATE POLICY merchant_portfolios_read
ON public.merchant_portfolios
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- Gestion des portefeuilles par Marketplace / Direction

DROP POLICY IF EXISTS merchant_portfolios_manage ON public.merchant_portfolios;

CREATE POLICY merchant_portfolios_manage
ON public.merchant_portfolios
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS merchant_portfolio_assignments_read
ON public.merchant_portfolio_assignments;

CREATE POLICY merchant_portfolio_assignments_read
ON public.merchant_portfolio_assignments
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


DROP POLICY IF EXISTS merchant_portfolio_assignments_manage
ON public.merchant_portfolio_assignments;

CREATE POLICY merchant_portfolio_assignments_manage
ON public.merchant_portfolio_assignments
FOR ALL
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- Documents : lecture selon pôle / Direction

DROP POLICY IF EXISTS bib_documents_read
ON public.bib_documents;

CREATE POLICY bib_documents_read
ON public.bib_documents
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR (
    related_pole IS NULL
    OR public.has_any_pole(
      auth.uid(),
      ARRAY[related_pole]
    )
  )
);


DROP POLICY IF EXISTS bib_documents_write
ON public.bib_documents;

CREATE POLICY bib_documents_write
ON public.bib_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR (
    related_pole IS NULL
    OR public.has_any_pole(
      auth.uid(),
      ARRAY[related_pole]
    )
  )
);


-- Journal documentaire : lecture métier

DROP POLICY IF EXISTS bib_document_exchange_log_read
ON public.bib_document_exchange_log;

CREATE POLICY bib_document_exchange_log_read
ON public.bib_document_exchange_log
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'marketplace',
      'supplier',
      'ops',
      'finance',
      'audit',
      'compliance',
      'rh',
      'rse',
      'product',
      'data',
      'security',
      'support',
      'marketing'
    ]
  )
);


-- Modèles de communication

DROP POLICY IF EXISTS merchant_communication_templates_read
ON public.merchant_communication_templates;

CREATE POLICY merchant_communication_templates_read
ON public.merchant_communication_templates
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);


-- Historique des communications

DROP POLICY IF EXISTS merchant_communications_read
ON public.merchant_communications;

CREATE POLICY merchant_communications_read
ON public.merchant_communications
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);

DROP POLICY IF EXISTS merchant_communications_insert
ON public.merchant_communications;

CREATE POLICY merchant_communications_insert
ON public.merchant_communications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY['marketplace']
  )
);
