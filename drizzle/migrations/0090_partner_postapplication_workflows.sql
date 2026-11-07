-- Intrabib: partner onboarding governance, distinct from operational activation.
-- Requires review of migration ordering with pilot wave selection 0089.
CREATE TABLE IF NOT EXISTS public.bib_partner_onboarding_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 partner_kind text NOT NULL CHECK(partner_kind IN ('supplier','logistics')),
 source_id uuid NOT NULL,
 platform_submission_id uuid,
 stage text NOT NULL DEFAULT 'application_received',
 test_account boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL,
 updated_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(partner_kind,source_id,test_account),
 CHECK ((partner_kind='supplier' AND stage IN
  ('application_received','precontract_catalog_received','precontract_screened',
   'contract_signed','portal_access_recorded','catalog_received',
   'catalog_reviewed','products_selected'))
  OR (partner_kind='logistics' AND stage IN
  ('application_received','contact_completed','requirements_sent',
   'requirements_accepted','contract_signed','portal_access_recorded')))
);
CREATE TABLE IF NOT EXISTS public.bib_partner_onboarding_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 case_id uuid NOT NULL REFERENCES public.bib_partner_onboarding_cases(id),
 actor_id uuid NOT NULL,
 previous_stage text,
 next_stage text NOT NULL,
 evidence_reference text NOT NULL CHECK(length(btrim(evidence_reference)) BETWEEN 8 AND 500),
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bib_partner_onboarding_events_case_idx
 ON public.bib_partner_onboarding_events(case_id,created_at DESC);

-- Product-specific eligibility and documentation; reused by documentary audit.
-- Each admissibility decision is tied to a stable product SKU, not a product name.
CREATE TABLE IF NOT EXISTS public.bib_partner_catalog_eligibility (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 case_id uuid NOT NULL REFERENCES public.bib_partner_onboarding_cases(id),
 sku text NOT NULL CHECK(length(btrim(sku)) BETWEEN 1 AND 120),
 product_description text NOT NULL CHECK(length(btrim(product_description)) BETWEEN 1 AND 1000),
 status text NOT NULL DEFAULT 'under_review' CHECK(status IN ('under_review','eligible','rejected','changes_requested')),
 documentary_evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(documentary_evidence)='array'),
 certification_evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(certification_evidence)='array'),
 audit_reuse_reference text,
 reviewed_by uuid,
 reviewed_at timestamptz,
 test_account boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(case_id,sku),
 CHECK(status NOT IN ('eligible','rejected','changes_requested') OR reviewed_by IS NOT NULL)
);
-- Catalogue eligibility does not itself admit or publish a product.
-- Product publication continues to require existing audit/product controls.

ALTER TABLE public.bib_partner_onboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_partner_onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bib_partner_catalog_eligibility ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_partner_onboarding_cases, public.bib_partner_onboarding_events,
 public.bib_partner_catalog_eligibility FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_partner_onboarding_cases,public.bib_partner_onboarding_events,
 public.bib_partner_catalog_eligibility TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_partner_onboarding_permitted(p_kind text,p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE p_kind
  WHEN 'supplier' THEN coalesce(public.can_intranet_action('supplier.applications',p_action),false)
  WHEN 'logistics' THEN coalesce(public.can_intranet_action('ops.partners',p_action),false)
  ELSE false END
$$;
REVOKE ALL ON FUNCTION public.bib_partner_onboarding_permitted(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_partner_onboarding_permitted(text,text) TO authenticated;

CREATE POLICY bib_partner_onboarding_cases_read ON public.bib_partner_onboarding_cases
 FOR SELECT TO authenticated USING (
 test_account=public.intranet_is_test_mode() AND public.bib_partner_onboarding_permitted(partner_kind,'read'));
CREATE POLICY bib_partner_onboarding_events_read ON public.bib_partner_onboarding_events
 FOR SELECT TO authenticated USING (EXISTS(
 SELECT 1 FROM public.bib_partner_onboarding_cases c WHERE c.id=case_id));
CREATE POLICY bib_partner_catalog_eligibility_read ON public.bib_partner_catalog_eligibility
 FOR SELECT TO authenticated USING (test_account=public.intranet_is_test_mode()
 AND EXISTS(SELECT 1 FROM public.bib_partner_onboarding_cases c WHERE c.id=case_id AND c.partner_kind='supplier'));

-- Safe state advancement. No status change in actual supplier or logistics tables.
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
 IF p_kind='supplier' AND p_next_stage IN ('catalog_reviewed','products_selected') AND NOT EXISTS(
  SELECT 1 FROM public.bib_partner_catalog_eligibility e
  WHERE e.case_id=v_case.id AND e.test_account=v_test
 ) THEN RAISE EXCEPTION 'catalog_documentary_review_required' USING ERRCODE='23514'; END IF;
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
REVOKE ALL ON FUNCTION public.bib_advance_partner_onboarding(text,uuid,text,text,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_advance_partner_onboarding(text,uuid,text,text,text,text,uuid) TO authenticated;

-- Product documentation register, intentionally not a catalog publication RPC.
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
