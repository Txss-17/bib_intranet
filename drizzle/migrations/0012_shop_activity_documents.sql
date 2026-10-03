```sql
-- ============================================================
-- BIB INTRANET — DOCUMENTS LIÉS À L'ACTIVITÉ DES BOUTIQUES
-- ============================================================
--
-- Le marchand crée et renseigne sa boutique depuis BIB Platform.
-- L'intranet ne crée pas de boutique et ne gère pas les données
-- personnelles du marchand.
--
-- Cette table contient uniquement les documents nécessaires à
-- l'examen de l'activité de la boutique.
-- ============================================================

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS activity_description text,
  ADD COLUMN IF NOT EXISTS activity_type text,
  ADD COLUMN IF NOT EXISTS website_url text;

-- ============================================================
-- DOCUMENTS D'ACTIVITÉ
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_activity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  shop_id uuid NOT NULL
    REFERENCES public.shops(id)
    ON DELETE CASCADE,

  document_type text NOT NULL,
  title text NOT NULL,

  document_url text,

  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'rejected'
      )
    ),

  issued_at timestamptz,
  expires_at timestamptz,

  reviewed_by uuid,
  reviewed_at timestamptz,

  rejection_reason text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX IF NOT EXISTS shop_activity_documents_shop_idx
  ON public.shop_activity_documents(shop_id);

CREATE INDEX IF NOT EXISTS shop_activity_documents_status_idx
  ON public.shop_activity_documents(status);

CREATE INDEX IF NOT EXISTS shop_activity_documents_expiry_idx
  ON public.shop_activity_documents(expires_at);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.shop_activity_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ops can view shop activity documents"
ON public.shop_activity_documents;

CREATE POLICY "Ops can view shop activity documents"
ON public.shop_activity_documents
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle',
      'audit',
      'compliance'
    ]
  )
);

DROP POLICY IF EXISTS "Ops can review shop activity documents"
ON public.shop_activity_documents;

CREATE POLICY "Ops can review shop activity documents"
ON public.shop_activity_documents
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
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
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
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
-- INSERTION
-- Les documents sont destinés à être alimentés depuis la
-- plateforme / le bridge.
-- ============================================================

DROP POLICY IF EXISTS "Platform can create shop activity documents"
ON public.shop_activity_documents;

CREATE POLICY "Platform can create shop activity documents"
ON public.shop_activity_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(
    auth.uid(),
    ARRAY[
      'ops',
      'lifecycle'
    ]
  )
);

-- ============================================================
-- TRIGGER UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_shop_activity_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shop_activity_documents_updated_at
ON public.shop_activity_documents;

CREATE TRIGGER trg_shop_activity_documents_updated_at
BEFORE UPDATE ON public.shop_activity_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_activity_documents_updated_at();
```
