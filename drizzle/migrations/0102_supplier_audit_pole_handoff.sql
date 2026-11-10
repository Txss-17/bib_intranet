-- 0102: explicit supplier -> Audit handoff (initial audit and counter-audit).
-- Does not create a new case, admit a product, issue an invoice or change audit status.
-- Historical cases without a handoff are NOT inferred to have been transmitted.
CREATE TABLE IF NOT EXISTS public.supplier_audit_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL UNIQUE REFERENCES public.supplier_audit_cases(id) ON DELETE RESTRICT,
  test_account boolean NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  audit_kind text NOT NULL CHECK (audit_kind IN ('initial','counter_audit')),
  audit_modality text NOT NULL CHECK (audit_modality IN ('documentary','on_site','quality_control')),
  sent_by uuid NOT NULL REFERENCES auth.users(id),
  sent_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 8 AND 500),
  case_revision integer NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK(status='received')
);
CREATE INDEX IF NOT EXISTS supplier_audit_handoffs_sent_idx ON public.supplier_audit_handoffs(sent_at DESC);
ALTER TABLE public.supplier_audit_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_audit_handoffs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.supplier_audit_handoffs TO authenticated;
GRANT ALL ON public.supplier_audit_handoffs TO service_role;
DROP POLICY IF EXISTS supplier_audit_handoff_read ON public.supplier_audit_handoffs;
CREATE POLICY supplier_audit_handoff_read ON public.supplier_audit_handoffs FOR SELECT TO authenticated USING (
  test_account=public.intranet_is_test_mode()
  AND EXISTS(
    SELECT 1 FROM public.supplier_audit_cases c
    WHERE c.id=supplier_audit_handoffs.case_id
      AND c.supplier_id=supplier_audit_handoffs.supplier_id
      AND c.test_account=supplier_audit_handoffs.test_account
  )
  AND (
    coalesce(public.can_intranet_action('audit.supplier','read'),false)
    OR coalesce(public.can_intranet_action('supplier.suppliers','read'),false)
  )
);

CREATE OR REPLACE FUNCTION public.transmit_supplier_audit_to_pole(
  p_case_id uuid, p_expected_revision integer, p_reason text, p_modality text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE v_case public.supplier_audit_cases;
  v_handoff public.supplier_audit_handoffs;
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(public.is_intranet_staff(auth.uid()),false)
    OR NOT coalesce(public.can_intranet_action('supplier.suppliers','update'),false)
  THEN RAISE EXCEPTION 'audit_handoff_forbidden' USING ERRCODE='42501'; END IF;
  IF p_modality NOT IN ('documentary','on_site','quality_control') OR p_modality IS NULL
  THEN RAISE EXCEPTION 'audit_handoff_modality_invalid' USING ERRCODE='22023'; END IF;
  IF p_case_id IS NULL OR p_expected_revision IS NULL
     OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 500
  THEN RAISE EXCEPTION 'audit_handoff_invalid_request' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_case FROM public.supplier_audit_cases
    WHERE id=p_case_id FOR UPDATE;
  IF NOT FOUND OR v_case.test_account IS DISTINCT FROM public.intranet_is_test_mode()
  THEN RAISE EXCEPTION 'audit_handoff_case_unavailable' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_handoff FROM public.supplier_audit_handoffs
    WHERE case_id=p_case_id;
  IF FOUND THEN
    -- Idempotent receipt; the original sender, date and evidence are immutable.
    RETURN jsonb_build_object('case_id',v_handoff.case_id,'sent_at',v_handoff.sent_at,
      'status',v_handoff.status,'already_transmitted',true);
  END IF;
  IF v_case.revision <> p_expected_revision
  THEN RAISE EXCEPTION 'audit_handoff_stale_case' USING ERRCODE='40001'; END IF;
  IF v_case.state NOT IN ('preselected','contracted')
     OR coalesce(array_length(v_case.scope,1),0)=0
     OR (v_case.kind='counter_audit' AND nullif(btrim(v_case.incident_reference),'') IS NULL)
  THEN RAISE EXCEPTION 'audit_handoff_case_not_ready' USING ERRCODE='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.suppliers s WHERE s.id=v_case.supplier_id
    AND coalesce(s.test_account,false)=v_case.test_account)
  THEN RAISE EXCEPTION 'audit_handoff_supplier_invalid' USING ERRCODE='23503'; END IF;
  INSERT INTO public.supplier_audit_handoffs(
    case_id,test_account,supplier_id,audit_kind,audit_modality,sent_by,reason,case_revision
  ) VALUES(p_case_id,v_case.test_account,v_case.supplier_id,v_case.kind,p_modality,auth.uid(),btrim(p_reason),v_case.revision)
  RETURNING * INTO v_handoff;
  RETURN jsonb_build_object('case_id',v_handoff.case_id,'sent_at',v_handoff.sent_at,
    'status',v_handoff.status,'already_transmitted',false);
END;$$;
REVOKE ALL ON FUNCTION public.transmit_supplier_audit_to_pole(uuid,integer,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.transmit_supplier_audit_to_pole(uuid,integer,text,text) TO authenticated;
COMMENT ON TABLE public.supplier_audit_handoffs IS 'Immutable internal handoff to Audit pole. Does not certify compliance, transmit documents externally or imply approval.';
NOTIFY pgrst, 'reload schema';
