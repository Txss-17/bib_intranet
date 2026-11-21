-- Keep a persistent employee-to-Drive-document security binding.
-- Metadata URL edits must never silently remove the protection from a file
-- that was once exposed as a collaborator's RH document.
BEGIN;

CREATE TABLE IF NOT EXISTS public.rh_drive_document_bindings (
  document_id uuid NOT NULL REFERENCES public.intranet_drive_documents(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  source_document_id uuid REFERENCES public.rh_employee_documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(document_id,employee_id)
);
CREATE INDEX IF NOT EXISTS rh_drive_document_bindings_employee_idx
  ON public.rh_drive_document_bindings(employee_id);
ALTER TABLE public.rh_drive_document_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rh_drive_document_bindings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.rh_drive_document_bindings TO service_role;

CREATE OR REPLACE FUNCTION public.rh_extract_managed_drive_id(p_url text)
RETURNS uuid
LANGUAGE sql IMMUTABLE SET search_path=''
AS $parse$
 SELECT CASE
   WHEN p_url ~ '^(/documents[?]document=|https://[^/?#]+/documents[?]document=)[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(&.*)?$'
   THEN split_part(split_part(p_url,'document=',2),'&',1)::uuid
   ELSE NULL::uuid
 END;
$parse$;
REVOKE ALL ON FUNCTION public.rh_extract_managed_drive_id(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_extract_managed_drive_id(text) TO authenticated,service_role;

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
REVOKE ALL ON FUNCTION public.rh_bind_employee_drive_document() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_rh_bind_employee_drive_document ON public.rh_employee_documents;
CREATE TRIGGER trg_rh_bind_employee_drive_document
  AFTER INSERT OR UPDATE OF document_url,employee_id
  ON public.rh_employee_documents FOR EACH ROW
  EXECUTE FUNCTION public.rh_bind_employee_drive_document();

-- One-time backfill from existing RH metadata, if linked to managed BIB documents.
INSERT INTO public.rh_drive_document_bindings(document_id,employee_id,source_document_id)
SELECT public.rh_extract_managed_drive_id(r.document_url),r.employee_id,r.id
FROM public.rh_employee_documents r
JOIN public.intranet_drive_documents d
 ON d.id=public.rh_extract_managed_drive_id(r.document_url)
WHERE public.rh_extract_managed_drive_id(r.document_url) IS NOT NULL
ON CONFLICT(document_id,employee_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rh_may_read_linked_drive_document(p_document_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $guard$
 SELECT (SELECT auth.uid()) IS NOT NULL
 AND NOT EXISTS (
   SELECT 1 FROM public.rh_drive_document_bindings b
   WHERE b.document_id=p_document_id
     AND NOT (
       b.employee_id=(SELECT auth.uid())
       OR public.is_canonical_bib_ceo((SELECT auth.uid()))
       OR EXISTS (
         SELECT 1 FROM public.bib_case_portfolio_members m
         JOIN public.bib_case_portfolios p ON p.id=m.portfolio_id
         JOIN public.profiles manager ON manager.id=p.owner_id
         WHERE m.entity_kind='employee' AND m.entity_id=b.employee_id
           AND m.ended_at IS NULL AND p.pole='rh' AND p.status='active'
           AND p.owner_id=(SELECT auth.uid())
           AND manager.app_origin='connect' AND manager.hr_status='active'
           AND manager.test_account IS FALSE
       )
     )
 );
$guard$;
REVOKE ALL ON FUNCTION public.rh_may_read_linked_drive_document(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_may_read_linked_drive_document(uuid) TO authenticated,service_role;

-- Retain every original general, page and record authorization; add a further
-- mandatory RH ownership check before preview/list/share can return the file.
CREATE OR REPLACE FUNCTION public.can_read_intranet_drive_document(p public.intranet_drive_documents)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public','pg_temp'
AS $function$
 SELECT public.can_intranet_action('app.documents','read')
 AND EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id=auth.uid() AND coalesce(me.test_account,false)=p.test_account
 )
 AND (
   (public.can_intranet_action(p.page_id,'read')
     AND (p.owner_id=auth.uid() OR p.classification='internal'
          OR public.can_intranet_action(p.page_id,'validate')
          OR (EXISTS (SELECT 1 FROM public.rh_drive_document_bindings b
                      WHERE b.document_id=p.id)
              AND public.rh_may_read_linked_drive_document(p.id))))
   OR public.is_intranet_document_recipient(p.id)
   OR EXISTS (SELECT 1 FROM public.intranet_records r
     WHERE p.id=ANY(r.document_ids) AND public.can_read_intranet_record(r))
   OR EXISTS (SELECT 1 FROM public.quality_alerts a
     WHERE p.id=ANY(a.document_ids) AND public.can_read_quality_alert(a))
   OR EXISTS (SELECT 1 FROM public.anomalies a
     WHERE p.id=ANY(a.document_ids) AND public.can_read_ops_anomaly(a))
 )
 AND public.rh_may_read_linked_drive_document(p.id);
$function$;
COMMIT;
