-- Invalidate every dependent CEO/RH onboarding approval if its sole
-- identity assurance is later revoked. Preserve historical decisions and
-- reviewer metadata in the confidential technical reconciliation ledger.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_reopen_leadership_after_identity_revocation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $reopen$
BEGIN
  IF OLD.status='verified' AND NEW.status='revoked' THEN
    INSERT INTO public.hr_existing_onboarding_evidence_reconciliation(
      subject_id,step_key,previous_status,previous_evidence_ref,
      previous_reviewer_id,previous_reviewed_at,reason,correction_source
    )
    SELECT s.subject_id,s.step_key,s.status,s.evidence_ref,s.reviewer_id,
      s.reviewed_at,
      'Attestation de vérification d’identité révoquée : réexamen du parcours complet requis',
      'identity_attestation_revoked'
    FROM public.hr_existing_account_onboarding_steps s
    WHERE s.subject_id=NEW.subject_id AND s.status='validated';

    UPDATE public.hr_existing_account_onboarding_steps s
      SET status='pending',evidence_ref=NULL,reviewer_id=NULL,reviewed_at=NULL,
          note='Contrôle rouvert automatiquement : attestation d’identité révoquée. Refaire les contrôles avant tout visa.',
          updated_at=now()
      WHERE s.subject_id=NEW.subject_id AND s.status='validated';
  END IF;
  RETURN NEW;
END;
$reopen$;

REVOKE ALL ON FUNCTION public.rh_reopen_leadership_after_identity_revocation()
  FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_rh_reopen_after_identity_revocation
  ON public.hr_leadership_identity_attestations;
CREATE TRIGGER trg_rh_reopen_after_identity_revocation
  AFTER UPDATE OF status ON public.hr_leadership_identity_attestations
  FOR EACH ROW
  WHEN (OLD.status='verified' AND NEW.status='revoked')
  EXECUTE FUNCTION public.rh_reopen_leadership_after_identity_revocation();

COMMIT;