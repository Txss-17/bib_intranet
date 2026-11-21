-- Supplementary guard: linking a managed Drive document requires pre-existing document read access.
CREATE OR REPLACE FUNCTION public.rh_bind_employee_drive_document()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $bind$
DECLARE doc_id uuid;
BEGIN
  doc_id := public.rh_extract_managed_drive_id(NEW.document_url);
  IF doc_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.intranet_drive_documents d WHERE d.id=doc_id) THEN
    RAISE EXCEPTION 'rh_managed_drive_document_not_found' USING ERRCODE='23503';
  END IF;
  -- Never let an HR user claim a confidential document merely by guessing
  -- its UUID. Check the ORIGINAL document rights before registering any new
  -- RH-owned binding (the newly inserted link cannot authorize itself).
  IF (SELECT auth.uid()) IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.intranet_drive_documents d
    WHERE d.id=doc_id AND public.can_read_intranet_drive_document(d)
  ) THEN
    RAISE EXCEPTION 'rh_managed_drive_source_not_readable' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.rh_drive_document_bindings(document_id,employee_id,source_document_id)
  VALUES(doc_id,NEW.employee_id,NEW.id)
  ON CONFLICT(document_id,employee_id) DO UPDATE
    SET source_document_id=EXCLUDED.source_document_id;
  RETURN NEW;
END;
$bind$;
