-- 0091 follows merged migration 0090 without rewriting its history.
-- Partner portal invitations use the existing independently approved Gateway Outbox.
-- No passwords, OTP codes or partner access tokens are stored or emailed.
CREATE TABLE IF NOT EXISTS public.bib_partner_access_handoffs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 case_id uuid NOT NULL UNIQUE REFERENCES public.bib_partner_onboarding_cases(id),
 outbox_id uuid NOT NULL UNIQUE REFERENCES public.intranet_outbox(id),
 recipient_email text NOT NULL,
 test_account boolean NOT NULL,
 delivery_state text NOT NULL DEFAULT 'prepared'
  CHECK (delivery_state IN ('prepared','confirmed')),
 prepared_by uuid NOT NULL,
 confirmed_by uuid,
 confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (delivery_state <> 'confirmed' OR
  (confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL))
);
ALTER TABLE public.bib_partner_access_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bib_partner_access_handoffs FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.bib_partner_access_handoffs TO authenticated;
CREATE POLICY bib_partner_access_handoffs_read
 ON public.bib_partner_access_handoffs FOR SELECT TO authenticated
 USING (test_account=public.intranet_is_test_mode() AND EXISTS (
  SELECT 1 FROM public.bib_partner_onboarding_cases c
  WHERE c.id=case_id AND public.bib_partner_onboarding_permitted(c.partner_kind,'read')
 ));

CREATE OR REPLACE FUNCTION public.bib_prepare_partner_access_invitation(p_case_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor uuid:=auth.uid(); c public.bib_partner_onboarding_cases%ROWTYPE;
 v_email text; v_url text; v_outbox jsonb; v_id uuid;
BEGIN
 SELECT * INTO c FROM public.bib_partner_onboarding_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR c.id IS NULL OR c.stage<>'contract_signed'
  OR c.test_account<>public.intranet_is_test_mode()
  OR NOT public.bib_partner_onboarding_permitted(c.partner_kind,'update')
  OR NOT public.can_intranet_action('gateway.compose','create')
  OR NOT public.can_intranet_action('gateway.compose','read')
 THEN RAISE EXCEPTION 'signed_contract_and_gateway_permission_required' USING ERRCODE='42501'; END IF;
 IF c.partner_kind='supplier' THEN
  SELECT lower(contact_email) INTO v_email FROM public.supplier_applications WHERE id=c.source_id;
  v_url:='https://brand-in-a-box.space/suppliers/resume?portal=suppliers';
 ELSE
  SELECT lower(contact_email) INTO v_email FROM public.logistics_partners WHERE id=c.source_id;
  v_url:='https://brand-in-a-box.space/ops/resume?portal=ops';
 END IF;
 IF v_email IS NULL OR length(v_email)>254 OR strpos(v_email,'@')<2
  OR strpos(split_part(v_email,'@',2),'.')<2 THEN
  RAISE EXCEPTION 'verified_professional_recipient_required' USING ERRCODE='23514';
 END IF;
 -- Idempotency key is case UUID; no duplicate invitation on retries.
 -- Gateway still requires another authorized person to approve and dispatch.
 SELECT public.submit_intranet_outbox(c.id,NULL,ARRAY[v_email],
  'BIB - Accès sécurisé à votre espace partenaire',
  'Votre contrat partenaire est enregistré. Pour accéder à votre espace BIB, '
  ||'utilisez cette page publique de connexion : '||v_url||E'\n'
  ||'Un code de vérification sera demandé pour votre adresse e-mail. '
  ||'Aucun mot de passe ni jeton d’accès n’est transmis par ce message.'
 ) INTO v_outbox;
 v_id:=(v_outbox->>'id')::uuid;
 INSERT INTO public.bib_partner_access_handoffs
 (case_id,outbox_id,recipient_email,test_account,prepared_by)
 VALUES(c.id,v_id,v_email,c.test_account,v_actor)
 ON CONFLICT(case_id) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.bib_partner_access_handoffs
  WHERE case_id=c.id AND outbox_id=v_id AND recipient_email=v_email) THEN
  RAISE EXCEPTION 'invitation_reference_conflict' USING ERRCODE='23514';
 END IF;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.bib_prepare_partner_access_invitation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_prepare_partner_access_invitation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.bib_confirm_partner_access_delivery(p_case_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor uuid:=auth.uid(); c public.bib_partner_onboarding_cases%ROWTYPE;
 h public.bib_partner_access_handoffs%ROWTYPE; o public.intranet_outbox%ROWTYPE;
BEGIN
 SELECT * INTO c FROM public.bib_partner_onboarding_cases WHERE id=p_case_id FOR UPDATE;
 IF v_actor IS NULL OR c.id IS NULL OR c.stage<>'contract_signed'
  OR c.test_account<>public.intranet_is_test_mode()
  OR NOT public.bib_partner_onboarding_permitted(c.partner_kind,'update')
 THEN RAISE EXCEPTION 'access_confirmation_not_authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO h FROM public.bib_partner_access_handoffs
  WHERE case_id=c.id FOR UPDATE;
 IF h.id IS NULL THEN RAISE EXCEPTION 'invitation_missing' USING ERRCODE='23514'; END IF;
 SELECT * INTO o FROM public.intranet_outbox WHERE id=h.outbox_id;
 IF h.prepared_by=v_actor OR o.status<>'sent' OR o.test_account
  OR o.created_by IS DISTINCT FROM h.prepared_by
  OR o.recipients<>ARRAY[h.recipient_email]::text[]
  OR o.approved_by IS NULL OR o.approved_by=o.created_by
 THEN RAISE EXCEPTION 'independently_approved_delivery_evidence_required' USING ERRCODE='23514'; END IF;
 UPDATE public.bib_partner_access_handoffs
 SET delivery_state='confirmed',confirmed_by=v_actor,confirmed_at=now()
 WHERE id=h.id AND delivery_state='prepared';
 RETURN h.id;
END $$;
REVOKE ALL ON FUNCTION public.bib_confirm_partner_access_delivery(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bib_confirm_partner_access_delivery(uuid) TO authenticated;

-- Preserve every existing 0090 transition and additionally require verified delivery.
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
 IF p_next_stage='portal_access_recorded' AND NOT EXISTS (
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
