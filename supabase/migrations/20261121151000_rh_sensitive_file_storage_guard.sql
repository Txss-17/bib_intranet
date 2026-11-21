-- Refuse new HR records that would reference identity, health, payroll or
-- disciplinary files through any external/managed Drive URL. The internal
-- registry number is independent of the storage location. The secure vault
-- route will require a separate, reviewed implementation and access model.
BEGIN;
CREATE OR REPLACE FUNCTION public.rh_guard_sensitive_document_storage()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $guard$
BEGIN
  IF NEW.document_type IN ('identity','medical','payroll','disciplinary')
     AND NULLIF(btrim(COALESCE(NEW.document_url,'')),'') IS NOT NULL THEN
    RAISE EXCEPTION 'rh_sensitive_document_requires_private_vault'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$guard$;

REVOKE ALL ON FUNCTION public.rh_guard_sensitive_document_storage()
  FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_sensitive_document_storage
  ON public.rh_employee_documents;
CREATE TRIGGER trg_rh_sensitive_document_storage
  BEFORE INSERT OR UPDATE OF document_type,document_url
  ON public.rh_employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.rh_guard_sensitive_document_storage();

-- Existing storage rows remain unchanged; a separate inventory of any
-- legacy sensitive files must precede migration into a future private vault.
COMMIT;
