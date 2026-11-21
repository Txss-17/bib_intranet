-- A single current identity attestation per leadership subject, with a
-- private reviewer-only status and revocation view.
BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_leadership_one_current_identity_attestation
  ON public.hr_leadership_identity_attestations(subject_id)
  WHERE status='verified';

CREATE OR REPLACE FUNCTION public.rh_my_identity_attestations()
RETURNS TABLE(reference text,subject_id uuid,verifier_id uuid,verified_at timestamptz,status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $list$
DECLARE
  v_actor uuid:=(SELECT auth.uid());
BEGIN
  IF v_actor IS NULL OR NOT public.rh_leadership_evidence_reviewer_allowed(v_actor) THEN
    RAISE EXCEPTION 'identity_attestation_list_forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
  SELECT a.reference,a.subject_id,a.verifier_id,a.verified_at,a.status
  FROM public.hr_leadership_identity_attestations a
  WHERE a.verifier_id=v_actor OR public.is_canonical_bib_ceo(v_actor)
  ORDER BY a.verified_at DESC LIMIT 100;
END;
$list$;

REVOKE ALL ON FUNCTION public.rh_my_identity_attestations()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_my_identity_attestations()
 TO authenticated;

COMMIT;
