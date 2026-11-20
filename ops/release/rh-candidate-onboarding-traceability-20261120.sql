-- Stable, explicit candidate-to-onboarding association. Never join on name/email.
BEGIN;
ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS candidate_id uuid REFERENCES public.hr_candidates(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS hr_employee_requests_one_onboarding_per_candidate
 ON public.hr_employee_requests(candidate_id)
 WHERE candidate_id IS NOT NULL AND request_kind='onboarding';

CREATE OR REPLACE FUNCTION public.rh_guard_onboarding_candidate_link()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $candidate$
DECLARE c record;
BEGIN
  IF TG_OP='UPDATE' AND OLD.candidate_id IS NOT NULL
      AND NEW.candidate_id IS DISTINCT FROM OLD.candidate_id THEN
    RAISE EXCEPTION 'rh_candidate_link_immutable' USING ERRCODE='23514';
  END IF;
  IF NEW.candidate_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.request_kind IS DISTINCT FROM 'onboarding' THEN
    RAISE EXCEPTION 'rh_candidate_link_onboarding_only' USING ERRCODE='23514';
  END IF;
  SELECT id,status,owner_id,position_key INTO c
  FROM public.hr_candidates WHERE id=NEW.candidate_id;
  IF NOT FOUND OR c.status<>'accepted' THEN
    RAISE EXCEPTION 'rh_candidate_must_be_accepted' USING ERRCODE='23514';
  END IF;
  IF c.owner_id IS NULL OR NEW.manager_id IS DISTINCT FROM c.owner_id THEN
    RAISE EXCEPTION 'rh_candidate_referent_mismatch' USING ERRCODE='23514';
  END IF;
  IF (SELECT auth.uid()) IS NOT NULL
     AND NOT public.is_canonical_bib_ceo((SELECT auth.uid()))
     AND (SELECT auth.uid()) IS DISTINCT FROM c.owner_id THEN
    RAISE EXCEPTION 'rh_candidate_not_owned_by_actor' USING ERRCODE='42501';
  END IF;
  IF NEW.position_key IS NOT NULL AND c.position_key IS NOT NULL
     AND NEW.position_key IS DISTINCT FROM c.position_key THEN
    RAISE EXCEPTION 'rh_candidate_position_mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$candidate$;
REVOKE ALL ON FUNCTION public.rh_guard_onboarding_candidate_link() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_rh_guard_onboarding_candidate_link ON public.hr_employee_requests;
CREATE TRIGGER trg_rh_guard_onboarding_candidate_link
BEFORE INSERT OR UPDATE OF candidate_id,manager_id,position_key,request_kind
 ON public.hr_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.rh_guard_onboarding_candidate_link();
COMMIT;
