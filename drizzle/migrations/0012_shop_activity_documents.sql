```sql
-- ============================================================
-- BIB — ACTIVITÉ DES BOUTIQUES & JUSTIFICATIFS D'ACTIVITÉ
-- ============================================================
--
-- Ce module concerne uniquement :
--   - l'activité déclarée de la boutique
--   - sa présentation opérationnelle
--   - les justificatifs liés à cette activité
--   - leur vérification par l'Intranet
--
-- Ne contient volontairement :
--   - aucune donnée personnelle du marchand
--   - aucun contrat
--   - aucune donnée de conformité produit
--   - aucune création de boutique
-- ============================================================


-- ============================================================
-- 1. INFORMATIONS D'ACTIVITÉ DE LA BOUTIQUE
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS activity_description text,
  ADD COLUMN IF NOT EXISTS website_url text;


COMMENT ON COLUMN public.shops.activity_type IS
  'Type ou nature de l''activité exercée par la boutique.';

COMMENT ON COLUMN public.shops.activity_description IS
  'Description de l''activité de la boutique.';

COMMENT ON COLUMN public.shops.website_url IS
  'Site ou vitrine publique de la boutique, lorsqu''il existe.';


CREATE INDEX IF NOT EXISTS idx_shops_activity_type
  ON public.shops(activity_type);


-- ============================================================
-- 2. JUSTIFICATIFS LIÉS À L'ACTIVITÉ
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_activity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  shop_id uuid NOT NULL
    REFERENCES public.shops(id)
    ON DELETE CASCADE,

  -- Nature du justificatif :
  -- ex. registre, licence, autorisation, certificat,
  -- justificatif d'activité, document sectoriel, etc.
  document_type text NOT NULL,

  title text NOT NULL,

  -- Référence vers le document stocké.
  -- Le stockage physique reste géré par le système documentaire
  -- de BIB ; cette colonne ne contient qu'une référence/URL.
  document_url text,

  status text NOT NULL DEFAULT 'pending',

  issued_at timestamptz,
  expires_at timestamptz,

  reviewed_by uuid,
  reviewed_at timestamptz,

  rejection_reason text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT shop_activity_documents_status_check
    CHECK (
      status IN ('pending', 'approved', 'rejected')
    ),

  CONSTRAINT shop_activity_documents_rejection_check
    CHECK (
      status <> 'rejected'
      OR NULLIF(trim(rejection_reason), '') IS NOT NULL
    )
);


-- ============================================================
-- 3. INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shop_activity_documents_shop
  ON public.shop_activity_documents(shop_id);

CREATE INDEX IF NOT EXISTS idx_shop_activity_documents_status
  ON public.shop_activity_documents(status);

CREATE INDEX IF NOT EXISTS idx_shop_activity_documents_expiry
  ON public.shop_activity_documents(expires_at);


-- ============================================================
-- 4. UPDATED_AT AUTOMATIQUE
-- ============================================================

DROP TRIGGER IF EXISTS trg_shop_activity_documents_updated
ON public.shop_activity_documents;

CREATE TRIGGER trg_shop_activity_documents_updated
BEFORE UPDATE ON public.shop_activity_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- 5. RLS
-- ============================================================

ALTER TABLE public.shop_activity_documents
ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE
ON public.shop_activity_documents
TO authenticated;

GRANT ALL
ON public.shop_activity_documents
TO service_role;


-- ============================================================
-- 6. LECTURE PAR LES ÉQUIPES AUTORISÉES
-- ============================================================

DROP POLICY IF EXISTS
  "Shop activity documents staff can view"
ON public.shop_activity_documents;

CREATE POLICY
  "Shop activity documents staff can view"
ON public.shop_activity_documents
FOR SELECT
TO authenticated
USING (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle',
      'audit',
      'compliance'
    ]
  )
);


-- ============================================================
-- 7. VÉRIFICATION PAR L'INTRANET
-- ============================================================
--
-- L'Intranet ne crée pas les justificatifs.
-- Il peut uniquement modifier leur statut et renseigner
-- la décision de vérification.
-- ============================================================

DROP POLICY IF EXISTS
  "Shop activity documents staff can review"
ON public.shop_activity_documents;

CREATE POLICY
  "Shop activity documents staff can review"
ON public.shop_activity_documents
FOR UPDATE
TO authenticated
USING (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle',
      'audit',
      'compliance'
    ]
  )
)
WITH CHECK (
  is_leadership(auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle',
      'audit',
      'compliance'
    ]
  )
);


-- ============================================================
-- 8. JOURNALISATION DE LA VÉRIFICATION
-- ============================================================
--
-- reviewed_by / reviewed_at sont obligatoires dès qu'une
-- décision est prise.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_shop_activity_document_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN

  IF NEW.status IN ('approved', 'rejected') THEN

    IF NEW.reviewed_by IS NULL THEN
      NEW.reviewed_by := auth.uid();
    END IF;

    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := now();
    END IF;

  END IF;


  IF NEW.status = 'rejected'
     AND NULLIF(trim(NEW.rejection_reason), '') IS NULL THEN

    RAISE EXCEPTION
      'Une justification est obligatoire pour rejeter un justificatif d''activité.';

  END IF;


  IF NEW.status = 'approved' THEN
    NEW.rejection_reason := NULL;
  END IF;


  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS trg_validate_shop_activity_document_review
ON public.shop_activity_documents;

CREATE TRIGGER trg_validate_shop_activity_document_review
BEFORE INSERT OR UPDATE
ON public.shop_activity_documents
FOR EACH ROW
EXECUTE FUNCTION public.validate_shop_activity_document_review();


-- ============================================================
-- 9. GARDE-FOU SUR LES DATES
-- ============================================================

ALTER TABLE public.shop_activity_documents
  DROP CONSTRAINT IF EXISTS shop_activity_documents_dates_check;

ALTER TABLE public.shop_activity_documents
  ADD CONSTRAINT shop_activity_documents_dates_check
  CHECK (
    expires_at IS NULL
    OR issued_at IS NULL
    OR expires_at >= issued_at
  );


-- ============================================================
-- FIN
-- ============================================================
```
