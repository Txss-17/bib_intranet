-- ============================================================
-- BIB — RH / DOSSIERS COLLABORATEURS
-- Registre documentaire RH rattaché directement à profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rh_employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id UUID NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  document_type TEXT NOT NULL DEFAULT 'other',

  source TEXT NOT NULL DEFAULT 'drive',

  document_url TEXT,

  description TEXT,

  document_date DATE,

  expires_at DATE,

  created_by UUID
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT rh_employee_documents_type_check
    CHECK (
      document_type IN (
        'contract',
        'identity',
        'diploma',
        'administrative',
        'medical',
        'training',
        'evaluation',
        'disciplinary',
        'other'
      )
    ),

  CONSTRAINT rh_employee_documents_source_check
    CHECK (
      source IN (
        'drive',
        'upload',
        'external',
        'other'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_rh_employee_documents_employee
  ON public.rh_employee_documents(employee_id);

CREATE INDEX IF NOT EXISTS idx_rh_employee_documents_type
  ON public.rh_employee_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_rh_employee_documents_expires
  ON public.rh_employee_documents(expires_at);

CREATE INDEX IF NOT EXISTS idx_rh_employee_documents_created_at
  ON public.rh_employee_documents(created_at DESC);


-- ============================================================
-- UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_rh_employee_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rh_employee_documents_updated_at
ON public.rh_employee_documents;

CREATE TRIGGER trg_rh_employee_documents_updated_at
BEFORE UPDATE ON public.rh_employee_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_rh_employee_documents_updated_at();


-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.rh_employee_documents ENABLE ROW LEVEL SECURITY;


-- Lecture :
-- RH
-- Direction
-- collaborateur concerné
CREATE POLICY "rh_employee_documents_select"
ON public.rh_employee_documents
FOR SELECT
TO authenticated
USING (
  employee_id = auth.uid()
  OR public.is_leadership(auth.uid())
  OR public.has_any_pole(auth.uid(), ARRAY['rh'])
);


-- Création :
-- RH et Direction uniquement
CREATE POLICY "rh_employee_documents_insert"
ON public.rh_employee_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(auth.uid(), ARRAY['rh'])
);


-- Modification :
-- RH et Direction uniquement
CREATE POLICY "rh_employee_documents_update"
ON public.rh_employee_documents
FOR UPDATE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(auth.uid(), ARRAY['rh'])
)
WITH CHECK (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(auth.uid(), ARRAY['rh'])
);


-- Suppression :
-- RH et Direction uniquement
CREATE POLICY "rh_employee_documents_delete"
ON public.rh_employee_documents
FOR DELETE
TO authenticated
USING (
  public.is_leadership(auth.uid())
  OR public.has_any_pole(auth.uid(), ARRAY['rh'])
);


COMMENT ON TABLE public.rh_employee_documents IS
'Registre documentaire RH des collaborateurs. Les fichiers physiques sont conservés dans l environnement documentaire BIB ; cette table conserve leurs métadonnées et leur référence.';

COMMENT ON COLUMN public.rh_employee_documents.document_url IS
'Référence vers le document dans l environnement documentaire BIB, notamment Google Drive BIB.';

COMMENT ON COLUMN public.rh_employee_documents.source IS
'Origine documentaire : drive, upload, external ou other.';
