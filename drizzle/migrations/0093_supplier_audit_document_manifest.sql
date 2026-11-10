-- Document evidence manifest for supplier audit dossiers.
-- Stores immutable metadata only, not PDF bytes; this is NOT fiscal issuance,
-- a certified archive or proof that a PDF was legally dispatched.
CREATE TABLE IF NOT EXISTS public.supplier_audit_document_manifest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.supplier_audit_cases(id) ON DELETE RESTRICT,
  test_account boolean NOT NULL,
  document_kind text NOT NULL CHECK(document_kind IN ('invoice','report','internal_summary')),
  document_reference text NOT NULL CHECK(length(btrim(document_reference)) BETWEEN 8 AND 500),
  sha256_hex text NOT NULL CHECK(sha256_hex ~ '^[0-9a-f]{64}$'),
  version_label text NOT NULL CHECK(length(btrim(version_label)) BETWEEN 1 AND 80),
  recorded_by uuid NOT NULL REFERENCES auth.users(id),
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(test_account,document_reference),
  UNIQUE(case_id,document_kind,sha256_hex)
);
CREATE INDEX IF NOT EXISTS supplier_audit_manifest_case_idx
 ON public.supplier_audit_document_manifest(case_id,recorded_at DESC);
ALTER TABLE public.supplier_audit_document_manifest ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_audit_document_manifest FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.supplier_audit_document_manifest TO authenticated;
GRANT ALL ON public.supplier_audit_document_manifest TO service_role;
DROP POLICY IF EXISTS supplier_audit_manifest_read ON public.supplier_audit_document_manifest;
CREATE POLICY supplier_audit_manifest_read
 ON public.supplier_audit_document_manifest FOR SELECT TO authenticated
 USING (
  test_account=public.intranet_is_test_mode() AND
  EXISTS (
   SELECT 1 FROM public.supplier_audit_cases c
   WHERE c.id=supplier_audit_document_manifest.case_id
     AND c.test_account=supplier_audit_document_manifest.test_account
  )
 );

-- RLS must not be bypassed by a direct client insert. The controlled function
-- validates role, dossier, source document reference and approval state.
CREATE OR REPLACE FUNCTION public.record_supplier_audit_document_manifest(
 p_case_id uuid, p_kind text, p_document_reference text,
 p_sha256_hex text, p_version_label text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 c public.supplier_audit_cases%ROWTYPE;
 v_id uuid;
 v_actor uuid:=auth.uid();
 v_doc text:=btrim(coalesce(p_document_reference,''));
 v_hash text:=lower(btrim(coalesce(p_sha256_hex,'')));
 v_version text:=btrim(coalesce(p_version_label,''));
BEGIN
 SELECT * INTO c FROM public.supplier_audit_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR c.id IS NULL
   OR c.test_account IS DISTINCT FROM public.intranet_is_test_mode()
   OR p_kind NOT IN ('invoice','report','internal_summary')
   OR length(v_doc) NOT BETWEEN 8 AND 500
   OR v_hash !~ '^[0-9a-f]{64}$'
   OR length(v_version) NOT BETWEEN 1 AND 80
 THEN RAISE EXCEPTION 'invalid_audit_document_manifest' USING ERRCODE='22023'; END IF;
 IF p_kind='invoice' THEN
  IF NOT public.can_intranet_action('finance.billing','validate')
    OR c.invoice IS NULL
    OR c.quote_state<>'accepted'
    OR v_doc IS DISTINCT FROM btrim(c.invoice->>'document_reference')
  THEN RAISE EXCEPTION 'invoice_source_and_finance_validation_required' USING ERRCODE='42501'; END IF;
 ELSIF p_kind='report' THEN
  IF NOT public.can_intranet_action('audit.supplier','validate')
    OR c.report IS NULL OR c.report_approved_by IS NULL
    OR v_doc IS DISTINCT FROM btrim(c.report->>'evidence_reference')
  THEN RAISE EXCEPTION 'approved_report_source_required' USING ERRCODE='42501'; END IF;
 ELSE
  IF NOT (public.can_intranet_action('audit.supplier','read')
          AND public.can_intranet_action('finance.billing','read'))
    OR c.invoice IS NULL OR c.report IS NULL OR c.report_approved_by IS NULL
  THEN RAISE EXCEPTION 'internal_summary_source_required' USING ERRCODE='42501'; END IF;
 END IF;
 SELECT id INTO v_id FROM public.supplier_audit_document_manifest
 WHERE case_id=p_case_id AND document_kind=p_kind AND
   document_reference=v_doc AND sha256_hex=v_hash AND version_label=v_version;
 IF FOUND THEN RETURN v_id; END IF;
 INSERT INTO public.supplier_audit_document_manifest
 (case_id,test_account,document_kind,document_reference,sha256_hex,version_label,recorded_by)
 VALUES(p_case_id,c.test_account,p_kind,v_doc,v_hash,v_version,v_actor)
 RETURNING id INTO v_id;
 RETURN v_id;
END
$$;
REVOKE ALL ON FUNCTION public.record_supplier_audit_document_manifest(uuid,text,text,text,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_supplier_audit_document_manifest(uuid,text,text,text,text)
 TO authenticated;
COMMENT ON TABLE public.supplier_audit_document_manifest IS
 'Append-only PDF evidence metadata, not a PDF store and not a fiscal invoicing service.';
