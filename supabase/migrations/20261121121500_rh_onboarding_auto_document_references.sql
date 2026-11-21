-- BIB RH: document references are server-owned, generated with sequences.
-- A reserved reference is NOT a Google Drive file, signed contract or proof.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.rh_onboarding_register_reference_seq AS bigint;
CREATE SEQUENCE IF NOT EXISTS public.rh_onboarding_document_reference_seq AS bigint;

ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS document_register_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_onboarding_document_register_reference
  ON public.hr_employee_requests(document_register_reference)
  WHERE document_register_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.rh_assign_onboarding_document_references()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $rh_refs$
DECLARE
  item jsonb;
  previous_item jsonb;
  item_id text;
  item_ref text;
  used_ids text[] := ARRAY[]::text[];
  prepared jsonb := '[]'::jsonb;
BEGIN
  IF NEW.request_kind <> 'onboarding' THEN
    IF TG_OP='UPDATE' AND OLD.document_register_reference IS NOT NULL THEN
      NEW.document_register_reference := OLD.document_register_reference;
    ELSE
      NEW.document_register_reference := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- The register is generated during the INSERT and returned in that same call.
  -- Changes submitted by an API client cannot overwrite or reuse it.
  IF TG_OP='INSERT' OR OLD.document_register_reference IS NULL THEN
    NEW.document_register_reference :=
      'BIB-RH-ONB-'||to_char(COALESCE(NEW.created_at,now()),'YYYY')||'-'||
      lpad(nextval('public.rh_onboarding_register_reference_seq'::regclass)::text,6,'0');
  ELSE
    NEW.document_register_reference := OLD.document_register_reference;
  END IF;

  IF NEW.attached_documents IS NULL OR jsonb_typeof(NEW.attached_documents)<>'array'
    OR jsonb_array_length(NEW.attached_documents)>50 THEN
    RAISE EXCEPTION 'rh_onboarding_documents_invalid' USING ERRCODE='23514';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(NEW.attached_documents) LOOP
    IF jsonb_typeof(item)<>'object' THEN
      RAISE EXCEPTION 'rh_onboarding_document_invalid' USING ERRCODE='23514';
    END IF;
    previous_item:=NULL;
    item_id:=NULL;
    item_ref:=NULL;

    IF TG_OP='UPDATE' AND OLD.request_kind='onboarding' THEN
      IF nullif(item->>'document_entry_id','') IS NOT NULL THEN
        SELECT value INTO previous_item
        FROM jsonb_array_elements(COALESCE(OLD.attached_documents,'[]'::jsonb)) v
        WHERE v.value->>'document_entry_id'=item->>'document_entry_id'
        LIMIT 1;
        IF previous_item IS NULL THEN
          RAISE EXCEPTION 'rh_document_reference_entry_unknown' USING ERRCODE='23514';
        END IF;
      ELSE
        -- Legacy clients can omit the server ID for an unchanged attachment.
        -- Match an unused prior entry by content, not by array position.
        SELECT value INTO previous_item
        FROM jsonb_array_elements(COALESCE(OLD.attached_documents,'[]'::jsonb)) v
        WHERE v.value->>'name' IS NOT DISTINCT FROM item->>'name'
          AND v.value->>'document_type' IS NOT DISTINCT FROM item->>'document_type'
          AND v.value->>'document_url' IS NOT DISTINCT FROM item->>'document_url'
          AND v.value->>'document_entry_id' IS NOT NULL
          AND NOT (v.value->>'document_entry_id'=ANY(used_ids))
        LIMIT 1;
      END IF;
    END IF;

    item_id := COALESCE(previous_item->>'document_entry_id',gen_random_uuid()::text);
    IF item_id=ANY(used_ids) THEN
      RAISE EXCEPTION 'rh_document_reference_entry_reused' USING ERRCODE='23514';
    END IF;

    item_ref := COALESCE(
      NULLIF(previous_item->>'document_reference',''),
      'BIB-RH-DOC-'||to_char(COALESCE(NEW.created_at,now()),'YYYY')||'-'||
      lpad(nextval('public.rh_onboarding_document_reference_seq'::regclass)::text,6,'0')
    );

    used_ids := array_append(used_ids,item_id);
    -- Client-supplied reference fields are never authoritative.
    prepared := prepared || jsonb_build_array(
      (item-'document_entry_id'-'document_reference')
      || jsonb_build_object('document_entry_id',item_id,'document_reference',item_ref)
    );
  END LOOP;

  NEW.attached_documents:=prepared;
  RETURN NEW;
END;
$rh_refs$;

REVOKE ALL ON FUNCTION public.rh_assign_onboarding_document_references()
  FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_assign_document_references ON public.hr_employee_requests;
CREATE TRIGGER trg_rh_assign_document_references
  BEFORE INSERT OR UPDATE OF attached_documents, document_register_reference, request_kind
  ON public.hr_employee_requests
  FOR EACH ROW EXECUTE FUNCTION public.rh_assign_onboarding_document_references();

-- Backfill historical onboarding dossiers, including those now rejected,
-- without claiming that missing Drive files have been created.
UPDATE public.hr_employee_requests r
SET attached_documents = r.attached_documents
WHERE r.request_kind = 'onboarding'
  AND (
    r.document_register_reference IS NULL OR
    EXISTS (
      SELECT 1 FROM jsonb_array_elements(r.attached_documents) a
      WHERE nullif(a.value->>'document_reference','') IS NULL
         OR nullif(a.value->>'document_entry_id','') IS NULL
    )
  );

COMMIT;
