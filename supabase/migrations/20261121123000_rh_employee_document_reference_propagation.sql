-- RH: preserve the onboarding document's canonical reference when the
-- provisioner copies it into the employee document register.
-- Manual RH documents get a fresh reference from the same sequence.
BEGIN;

ALTER TABLE public.rh_employee_documents
  ADD COLUMN IF NOT EXISTS document_reference text,
  ADD COLUMN IF NOT EXISTS onboarding_request_id uuid
    REFERENCES public.hr_employee_requests(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_employee_documents_reference
  ON public.rh_employee_documents(document_reference)
  WHERE document_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.rh_assign_employee_document_reference()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $rh_employee_doc$
DECLARE
  linked boolean;
BEGIN
  IF TG_OP='UPDATE' AND OLD.document_reference IS NOT NULL THEN
    NEW.document_reference := OLD.document_reference;
    NEW.onboarding_request_id := OLD.onboarding_request_id;
    RETURN NEW;
  END IF;

  IF NEW.source='onboarding' AND NEW.onboarding_request_id IS NOT NULL THEN
    -- Edge provisions the account before it updates created_user_id. Require
    -- matching account email until the request identity is attached.
    SELECT EXISTS(
      SELECT 1 FROM public.hr_employee_requests r
      JOIN public.profiles p ON p.id=NEW.employee_id
      WHERE r.id=NEW.onboarding_request_id
        AND r.request_kind='onboarding'
        AND (
          r.created_user_id=NEW.employee_id
          OR (r.created_user_id IS NULL AND lower(r.work_email)=lower(p.email))
        )
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(r.attached_documents) item
          WHERE item->>'document_reference'=NEW.document_reference
            AND left(item->>'name',200)=NEW.name
            AND item->>'document_type'=NEW.document_type
        )
    ) INTO linked;
    IF NOT linked THEN
      RAISE EXCEPTION 'rh_onboarding_document_reference_mismatch'
        USING ERRCODE='23514';
    END IF;
  ELSE
    -- A manual document or a legacy provisioning request without a linked
    -- onboarding reference cannot choose an arbitrary document reference.
    NEW.onboarding_request_id := NULL;
    NEW.document_reference :=
      'BIB-RH-DOC-'||to_char(COALESCE(NEW.created_at,now()),'YYYY')||'-'||
      lpad(nextval('public.rh_onboarding_document_reference_seq'::regclass)::text,6,'0');
  END IF;
  RETURN NEW;
END;
$rh_employee_doc$;

REVOKE ALL ON FUNCTION public.rh_assign_employee_document_reference()
  FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_employee_document_reference ON public.rh_employee_documents;
CREATE TRIGGER trg_rh_employee_document_reference
  BEFORE INSERT OR UPDATE OF document_reference, onboarding_request_id
  ON public.rh_employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.rh_assign_employee_document_reference();

-- Historical documents, if any, receive a server-issued reference.
UPDATE public.rh_employee_documents
  SET document_reference=document_reference
  WHERE document_reference IS NULL;

COMMIT;
