-- RH: attestation of live identity verification without retaining an
-- identity document, passport number, photo, scan, Google Drive link or OCR.
-- This is an internal HR reviewer statement, not certification of a document
-- or a qualified electronic signature.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.rh_identity_attestation_reference_seq;

CREATE TABLE IF NOT EXISTS public.hr_leadership_identity_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  verifier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  request_key uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  method text NOT NULL CHECK (method='in_person_original'),
  original_inspected boolean NOT NULL DEFAULT true CHECK (original_inspected),
  subject_matched boolean NOT NULL DEFAULT true CHECK (subject_matched),
  apparent_validity_checked boolean NOT NULL DEFAULT true CHECK (apparent_validity_checked),
  no_copy_retained boolean NOT NULL DEFAULT true CHECK (no_copy_retained),
  status text NOT NULL DEFAULT 'verified' CHECK(status IN('verified','revoked')),
  verified_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id),
  revocation_reason text CHECK (
    revocation_reason IS NULL OR revocation_reason IN
      ('error','superseded','verification_challenged')
  ),
  CONSTRAINT identity_attestation_not_self CHECK (subject_id<>verifier_id),
  CONSTRAINT identity_attestation_request_idempotency UNIQUE(subject_id,verifier_id,request_key),
  CONSTRAINT identity_attestation_state_consistent CHECK (
    (status='verified' AND revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
    OR (status='revoked' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revocation_reason IS NOT NULL)
  )
);
ALTER TABLE public.hr_leadership_identity_attestations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_leadership_identity_attestations FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.hr_leadership_identity_attestation_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attestation_id uuid NOT NULL REFERENCES public.hr_leadership_identity_attestations(id) ON DELETE RESTRICT,
  reference text NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_kind text NOT NULL CHECK (event_kind IN ('verified','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_leadership_identity_attestation_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_leadership_identity_attestation_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_record_leadership_identity_attestation(
  p_subject uuid,
  p_method text,
  p_original_inspected boolean,
  p_subject_matched boolean,
  p_apparent_validity_checked boolean,
  p_no_copy_retained boolean,
  p_request_key uuid
) RETURNS TABLE(reference text,verified_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $register$
DECLARE
  v_actor uuid:=(SELECT auth.uid());
  v_rights jsonb;
  v_attestation_id uuid;
  v_reference text;
  v_time timestamptz;
  v_method text;
  v_status text;
BEGIN
  IF v_actor IS NULL OR p_subject IS NULL OR p_request_key IS NULL
     OR p_subject=v_actor THEN
    RAISE EXCEPTION 'identity_attestation_not_authorized' USING ERRCODE='42501';
  END IF;

  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO v_rights;
  IF COALESCE((v_rights->>'validate')::boolean,false) IS NOT TRUE
    OR NOT public.rh_leadership_evidence_reviewer_allowed(v_actor) THEN
    RAISE EXCEPTION 'identity_attestation_reviewer_not_authorized'
      USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=p_subject AND p.position::text IN ('ceo','rh_manager')
      AND p.app_origin='connect' AND p.hr_status='active'
      AND p.test_account IS FALSE
  ) THEN
    RAISE EXCEPTION 'identity_attestation_subject_invalid'
      USING ERRCODE='42501';
  END IF;
  -- Remote verification requires an independently approved identity assurance
  -- procedure; it cannot be silently treated as in-person original inspection.
  IF p_method IS DISTINCT FROM 'in_person_original'
    OR p_original_inspected IS DISTINCT FROM true
    OR p_subject_matched IS DISTINCT FROM true
    OR p_apparent_validity_checked IS DISTINCT FROM true
    OR p_no_copy_retained IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'identity_attestation_checks_incomplete'
      USING ERRCODE='23514';
  END IF;

  INSERT INTO public.hr_leadership_identity_attestations (
    subject_id,verifier_id,request_key,reference,method,
    original_inspected,subject_matched,apparent_validity_checked,no_copy_retained
  ) VALUES(
    p_subject,v_actor,p_request_key,
    'BIB-RH-IDV-'||to_char(now(),'YYYY')||'-'||
      lpad(nextval('public.rh_identity_attestation_reference_seq'::regclass)::text,6,'0'),
    'in_person_original',true,true,true,true
  )
  ON CONFLICT (subject_id,verifier_id,request_key) DO NOTHING
  RETURNING id,hr_leadership_identity_attestations.reference,hr_leadership_identity_attestations.verified_at
  INTO v_attestation_id,v_reference,v_time;

  IF v_attestation_id IS NULL THEN
    SELECT a.id,a.reference,a.verified_at,a.method,a.status
      INTO v_attestation_id,v_reference,v_time,v_method,v_status
    FROM public.hr_leadership_identity_attestations a
    WHERE a.subject_id=p_subject AND a.verifier_id=v_actor
      AND a.request_key=p_request_key;
    IF v_attestation_id IS NULL OR v_status<>'verified'
       OR v_method<>'in_person_original' THEN
      RAISE EXCEPTION 'identity_attestation_retry_conflict' USING ERRCODE='23514';
    END IF;
  ELSE
    INSERT INTO public.hr_leadership_identity_attestation_events(
      attestation_id,reference,subject_id,actor_id,event_kind
    ) VALUES(v_attestation_id,v_reference,p_subject,v_actor,'verified');
  END IF;

  reference:=v_reference;verified_at:=v_time;
  RETURN NEXT;
END;
$register$;

CREATE OR REPLACE FUNCTION public.rh_revoke_leadership_identity_attestation(
  p_reference text,p_reason text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $revoke$
DECLARE
  v_actor uuid:=(SELECT auth.uid());
  v_att public.hr_leadership_identity_attestations%ROWTYPE;
BEGIN
  IF v_actor IS NULL OR p_reason NOT IN ('error','superseded','verification_challenged')
    OR NOT public.rh_leadership_evidence_reviewer_allowed(v_actor) THEN
    RAISE EXCEPTION 'identity_attestation_revoke_forbidden'
      USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_att
  FROM public.hr_leadership_identity_attestations a
  WHERE a.reference=p_reference FOR UPDATE;
  IF NOT FOUND OR NOT (v_actor=v_att.verifier_id OR public.is_canonical_bib_ceo(v_actor)) THEN
    RAISE EXCEPTION 'identity_attestation_revoke_forbidden' USING ERRCODE='42501';
  END IF;
  IF v_att.status='revoked' THEN RETURN false; END IF;

  UPDATE public.hr_leadership_identity_attestations
    SET status='revoked',revoked_at=now(),revoked_by=v_actor,revocation_reason=p_reason
    WHERE id=v_att.id;

  INSERT INTO public.hr_leadership_identity_attestation_events(
    attestation_id,reference,subject_id,actor_id,event_kind
  ) VALUES(v_att.id,v_att.reference,v_att.subject_id,v_actor,'revoked');
  RETURN true;
END;
$revoke$;

REVOKE ALL ON FUNCTION public.rh_record_leadership_identity_attestation(
 uuid,text,boolean,boolean,boolean,boolean,uuid
) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rh_revoke_leadership_identity_attestation(text,text)
 FROM PUBLIC,anon,authenticated;

GRANT EXECUTE ON FUNCTION public.rh_record_leadership_identity_attestation(
 uuid,text,boolean,boolean,boolean,boolean,uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rh_revoke_leadership_identity_attestation(text,text)
 TO authenticated;

COMMIT;
