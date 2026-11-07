-- Follow-on to migration 0090. The original migration remains immutable.
-- A signed contract does not itself allow marking access as delivered.
-- Access invitation is informational only. No credentials, OTPs, token URLs or
-- passwords may be stored here. Delivery proof must originate from the
-- approved communication process, not a self-reported UI checkbox.
CREATE TABLE IF NOT EXISTS public.bib_partner_access_handoffs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 case_id uuid NOT NULL UNIQUE REFERENCES public.bib_partner_onboarding_cases(id),
 test_account boolean NOT NULL,
 channel text NOT NULL CHECK(channel IN ('transactional_email','verified_manual')),
 recipient_email text NOT NULL CHECK(recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+
CREATE OR REPLACE FUNCTION public.bib_record_partner_catalog_eligibility(
 p_case_id uuid,p_sku text,p_description text,p_status text,
 p_documentary jsonb,p_certifications jsonb,p_audit_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_case public.bib_partner_onboarding_cases%ROWTYPE; v_actor uuid:=auth.uid(); v_id uuid;
BEGIN
 SELECT * INTO v_case FROM public.bib_partner_onboarding_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR v_case.id IS NULL OR v_case.partner_kind<>'supplier'
 OR v_case.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_partner_onboarding_permitted('supplier','update')
 OR v_case.stage NOT IN ('catalog_received','catalog_reviewed','products_selected')
 OR length(btrim(coalesce(p_sku,''))) NOT BETWEEN 1 AND 120
 OR length(btrim(coalesce(p_description,''))) NOT BETWEEN 1 AND 1000
 OR p_status NOT IN ('under_review','eligible','rejected','changes_requested')
 OR jsonb_typeof(p_documentary) IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_certifications) IS DISTINCT FROM 'array'
 OR (p_status='eligible' AND jsonb_array_length(p_documentary)=0) THEN
  RAISE EXCEPTION 'catalog_eligibility_not_authorized' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.bib_partner_catalog_eligibility
 (case_id,sku,product_description,status,documentary_evidence,certification_evidence,
  audit_reuse_reference,reviewed_by,reviewed_at,test_account)
 VALUES(p_case_id,btrim(p_sku),btrim(p_description),p_status,p_documentary,p_certifications,
  nullif(btrim(coalesce(p_audit_reference,'')),''),CASE WHEN p_status='under_review' THEN NULL ELSE v_actor END,
  CASE WHEN p_status='under_review' THEN NULL ELSE now() END,v_case.test_account)
 ON CONFLICT(case_id,sku) DO UPDATE SET product_description=EXCLUDED.product_description,
 status=EXCLUDED.status,documentary_evidence=EXCLUDED.documentary_evidence,
 certification_evidence=EXCLUDED.certification_evidence,audit_reuse_reference=EXCLUDED.audit_reuse_reference,
 reviewed_by=EXCLUDED.reviewed_by,reviewed_at=EXCLUDED.reviewed_at,updated_at=now()
 RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_record_partner_catalog_eligibility(uuid,text,text,text,jsonb,jsonb,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_record_partner_catalog_eligibility(uuid,text,text,text,jsonb,jsonb,text)
 TO authenticated;
),
 invitation_reference text NOT NULL CHECK(length(btrim(invitation_reference)) BETWEEN 8 AND 500),
 delivery_state text NOT NULL DEFAULT 'prepared' CHECK(delivery_state IN ('prepared','queued','confirmed','failed')),
 delivery_reference text,
 prepared_by uuid NOT NULL,
 confirmed_by uuid,
 confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(delivery_state<>'confirmed' OR (
  confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL
  AND length(btrim(coalesce(delivery_reference,''))) BETWEEN 8 AND 500))
);
ALTER TABLE public.bib_partner_access_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_partner_access_handoffs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_partner_access_handoffs TO authenticated;
CREATE POLICY bib_partner_access_handoffs_read ON public.bib_partner_access_handoffs
 FOR SELECT TO authenticated USING(test_account=public.intranet_is_test_mode()
 AND EXISTS(SELECT 1 FROM public.bib_partner_onboarding_cases c WHERE c.id=case_id));

CREATE OR REPLACE FUNCTION public.bib_record_partner_access_handoff(
 p_case_id uuid,p_action text,p_channel text,p_recipient text,
 p_invitation_reference text,p_delivery_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $
DECLARE v_actor uuid:=auth.uid(); v_case public.bib_partner_onboarding_cases%ROWTYPE;
 v_handoff public.bib_partner_access_handoffs%ROWTYPE; v_id uuid;
BEGIN
 SELECT * INTO v_case FROM public.bib_partner_onboarding_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR v_case.id IS NULL OR v_case.test_account<>public.intranet_is_test_mode()
  OR NOT public.bib_partner_onboarding_permitted(v_case.partner_kind,'update')
  OR v_case.stage NOT IN ('access_invitation_prepared','portal_access_recorded')
  OR p_action NOT IN ('prepare','confirm') OR p_channel NOT IN ('transactional_email','verified_manual')
  OR length(btrim(coalesce(p_invitation_reference,''))) NOT BETWEEN 8 AND 500
  OR p_recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+
CREATE OR REPLACE FUNCTION public.bib_record_partner_catalog_eligibility(
 p_case_id uuid,p_sku text,p_description text,p_status text,
 p_documentary jsonb,p_certifications jsonb,p_audit_reference text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_case public.bib_partner_onboarding_cases%ROWTYPE; v_actor uuid:=auth.uid(); v_id uuid;
BEGIN
 SELECT * INTO v_case FROM public.bib_partner_onboarding_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR v_case.id IS NULL OR v_case.partner_kind<>'supplier'
 OR v_case.test_account<>public.intranet_is_test_mode()
 OR NOT public.bib_partner_onboarding_permitted('supplier','update')
 OR v_case.stage NOT IN ('catalog_received','catalog_reviewed','products_selected')
 OR length(btrim(coalesce(p_sku,''))) NOT BETWEEN 1 AND 120
 OR length(btrim(coalesce(p_description,''))) NOT BETWEEN 1 AND 1000
 OR p_status NOT IN ('under_review','eligible','rejected','changes_requested')
 OR jsonb_typeof(p_documentary) IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_certifications) IS DISTINCT FROM 'array'
 OR (p_status='eligible' AND jsonb_array_length(p_documentary)=0) THEN
  RAISE EXCEPTION 'catalog_eligibility_not_authorized' USING ERRCODE='42501';
 END IF;
 INSERT INTO public.bib_partner_catalog_eligibility
 (case_id,sku,product_description,status,documentary_evidence,certification_evidence,
  audit_reuse_reference,reviewed_by,reviewed_at,test_account)
 VALUES(p_case_id,btrim(p_sku),btrim(p_description),p_status,p_documentary,p_certifications,
  nullif(btrim(coalesce(p_audit_reference,'')),''),CASE WHEN p_status='under_review' THEN NULL ELSE v_actor END,
  CASE WHEN p_status='under_review' THEN NULL ELSE now() END,v_case.test_account)
 ON CONFLICT(case_id,sku) DO UPDATE SET product_description=EXCLUDED.product_description,
 status=EXCLUDED.status,documentary_evidence=EXCLUDED.documentary_evidence,
 certification_evidence=EXCLUDED.certification_evidence,audit_reuse_reference=EXCLUDED.audit_reuse_reference,
 reviewed_by=EXCLUDED.reviewed_by,reviewed_at=EXCLUDED.reviewed_at,updated_at=now()
 RETURNING id INTO v_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_record_partner_catalog_eligibility(uuid,text,text,text,jsonb,jsonb,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_record_partner_catalog_eligibility(uuid,text,text,text,jsonb,jsonb,text)
 TO authenticated;

 THEN RAISE EXCEPTION 'partner_access_handoff_not_authorized' USING ERRCODE='42501'; END IF;
 IF v_case.partner_kind='supplier' AND NOT EXISTS(
  SELECT 1 FROM public.supplier_applications a
  WHERE a.id=v_case.source_id AND lower(a.contact_email)=lower(p_recipient)
 ) THEN RAISE EXCEPTION 'supplier_recipient_mismatch' USING ERRCODE='23514'; END IF;
 IF v_case.partner_kind='logistics' AND NOT EXISTS(
  SELECT 1 FROM public.logistics_partners lp
  WHERE lp.id=v_case.source_id AND lower(lp.contact_email)=lower(p_recipient)
 ) THEN RAISE EXCEPTION 'logistics_recipient_mismatch' USING ERRCODE='23514'; END IF;
 SELECT * INTO v_handoff FROM public.bib_partner_access_handoffs WHERE case_id=p_case_id FOR UPDATE;
 IF p_action='prepare' THEN
  IF v_handoff.id IS NOT NULL THEN
   RAISE EXCEPTION 'access_handoff_already_prepared' USING ERRCODE='23514'; END IF;
  INSERT INTO public.bib_partner_access_handoffs(case_id,test_account,channel,
   recipient_email,invitation_reference,prepared_by)
  VALUES(p_case_id,v_case.test_account,p_channel,lower(p_recipient),
   btrim(p_invitation_reference),v_actor) RETURNING id INTO v_id;
 ELSE
  IF v_handoff.id IS NULL OR v_handoff.delivery_state NOT IN ('prepared','queued')
   OR v_handoff.prepared_by=v_actor OR
   p_channel IS DISTINCT FROM v_handoff.channel OR
   lower(p_recipient) IS DISTINCT FROM v_handoff.recipient_email OR
   p_invitation_reference IS DISTINCT FROM v_handoff.invitation_reference OR
   length(btrim(coalesce(p_delivery_reference,''))) NOT BETWEEN 8 AND 500
   OR p_delivery_reference ~* '(access_token|password|secret|otp|https?://)'
  THEN RAISE EXCEPTION 'independent_delivery_confirmation_required' USING ERRCODE='23514'; END IF;
  UPDATE public.bib_partner_access_handoffs SET delivery_state='confirmed',
   delivery_reference=btrim(p_delivery_reference),confirmed_by=v_actor,
   confirmed_at=now(),updated_at=now() WHERE id=v_handoff.id RETURNING id INTO v_id;
 END IF;
 RETURN v_id;
END $;
REVOKE ALL ON FUNCTION public.bib_record_partner_access_handoff(uuid,text,text,text,text,text)
 FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_record_partner_access_handoff(uuid,text,text,text,text,text)
 TO authenticated;


-- Replaces only the transition function to require verified access handoff.
CREATE OR REPLACE FUNCTION public.bib_advance_partner_onboarding(
 p_kind text,p_source_id uuid,p_expected_stage text,p_next_stage text,
 p_evidence_reference text,p_notes text DEFAULT NULL,p_platform_submission_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor uuid:=auth.uid(); v_test boolean:=public.intranet_is_test_mode();
 v_case public.bib_partner_onboarding_cases%ROWTYPE; v_next text;
BEGIN
 IF v_actor IS NULL OR p_source_id IS NULL OR p_kind NOT IN ('supplier','logistics')
  OR length(btrim(coalesce(p_evidence_reference,''))) NOT BETWEEN 8 AND 500
  OR length(coalesce(p_notes,''))>2000
  OR NOT public.bib_partner_onboarding_permitted(p_kind,'update') THEN
  RAISE EXCEPTION 'partner_onboarding_not_authorized' USING ERRCODE='42501';
 END IF;
 IF p_kind='supplier' AND (p_platform_submission_id IS NOT NULL OR NOT EXISTS(
   SELECT 1 FROM public.supplier_applications WHERE id=p_source_id
 )) THEN RAISE EXCEPTION 'supplier_application_missing' USING ERRCODE='23514'; END IF;
 IF p_kind='logistics' AND NOT EXISTS(
   SELECT 1 FROM public.logistics_partners WHERE id=p_source_id
 ) THEN RAISE EXCEPTION 'logistics_partner_missing' USING ERRCODE='23514'; END IF;
 -- No extrapolation from an approved Platform application to live service.
 IF p_kind='logistics' AND p_platform_submission_id IS NULL THEN
  RAISE EXCEPTION 'platform_logistics_source_required' USING ERRCODE='23514';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext('bib_partner_onboard_'||p_kind||'_'||p_source_id::text||'_'||v_test::text));
 INSERT INTO public.bib_partner_onboarding_cases
   (partner_kind,source_id,platform_submission_id,test_account,created_by,updated_by)
 VALUES(p_kind,p_source_id,p_platform_submission_id,v_test,v_actor,v_actor)
 ON CONFLICT(partner_kind,source_id,test_account) DO NOTHING;
 SELECT * INTO v_case FROM public.bib_partner_onboarding_cases
 WHERE partner_kind=p_kind AND source_id=p_source_id AND test_account=v_test FOR UPDATE;
 IF v_case.stage IS DISTINCT FROM p_expected_stage THEN
  RAISE EXCEPTION 'onboarding_stage_conflict' USING ERRCODE='40001';
 END IF;
 IF p_kind='logistics' AND v_case.platform_submission_id IS DISTINCT FROM p_platform_submission_id THEN
  RAISE EXCEPTION 'platform_logistics_mapping_conflict' USING ERRCODE='23514';
 END IF;
 v_next:=CASE p_kind
  WHEN 'supplier' THEN CASE v_case.stage
   WHEN 'application_received' THEN 'precontract_catalog_received'
   WHEN 'precontract_catalog_received' THEN 'precontract_screened'
   WHEN 'precontract_screened' THEN 'contract_signed'
   WHEN 'contract_signed' THEN 'portal_access_recorded'
   WHEN 'portal_access_recorded' THEN 'catalog_received'
   WHEN 'catalog_received' THEN 'catalog_reviewed'
   WHEN 'catalog_reviewed' THEN 'products_selected'
   ELSE NULL END
  ELSE CASE v_case.stage
   WHEN 'application_received' THEN 'contact_completed'
   WHEN 'contact_completed' THEN 'requirements_sent'
   WHEN 'requirements_sent' THEN 'requirements_accepted'
   WHEN 'requirements_accepted' THEN 'contract_signed'
   WHEN 'contract_signed' THEN 'portal_access_recorded'
   ELSE NULL END END;
 IF v_next IS NULL OR v_next IS DISTINCT FROM p_next_stage THEN
  RAISE EXCEPTION 'invalid_partner_onboarding_transition' USING ERRCODE='23514';
 END IF;
 IF p_next_stage='portal_access_recorded' AND NOT EXISTS(
  SELECT 1 FROM public.bib_partner_access_handoffs h
  WHERE h.case_id=v_case.id AND h.test_account=v_test AND h.delivery_state='confirmed'
 ) THEN RAISE EXCEPTION 'confirmed_invitation_delivery_required' USING ERRCODE='23514'; END IF;
 IF p_kind='supplier' AND p_next_stage IN ('catalog_reviewed','products_selected')
 AND (NOT EXISTS(
  SELECT 1 FROM public.bib_partner_catalog_eligibility e
  WHERE e.case_id=v_case.id AND e.test_account=v_test AND e.status<>'under_review'
 ) OR EXISTS(
  SELECT 1 FROM public.bib_partner_catalog_eligibility e
  WHERE e.case_id=v_case.id AND e.test_account=v_test AND e.status='under_review'
 )) THEN RAISE EXCEPTION 'catalog_documentary_review_required' USING ERRCODE='23514'; END IF;
 IF p_kind='supplier' AND p_next_stage='products_selected' AND NOT EXISTS(
  SELECT 1 FROM public.bib_partner_catalog_eligibility e
  WHERE e.case_id=v_case.id AND e.test_account=v_test AND e.status='eligible'
   AND jsonb_array_length(e.documentary_evidence)>0
 ) THEN RAISE EXCEPTION 'eligible_product_evidence_missing' USING ERRCODE='23514'; END IF;
 UPDATE public.bib_partner_onboarding_cases
 SET stage=v_next,updated_by=v_actor,updated_at=now() WHERE id=v_case.id;
 INSERT INTO public.bib_partner_onboarding_events
 (case_id,actor_id,previous_stage,next_stage,evidence_reference,notes)
 VALUES(v_case.id,v_actor,v_case.stage,v_next,btrim(p_evidence_reference),p_notes);
 RETURN v_case.id;
END $$;
