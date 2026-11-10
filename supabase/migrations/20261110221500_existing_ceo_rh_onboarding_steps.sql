-- BIB Intranet: step-by-step regularisation for existing CEO and RH manager accounts.
-- No backfill, invitations, status changes, or automatic approvals.
CREATE TABLE IF NOT EXISTS public.hr_existing_account_onboarding_steps (
  subject_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  step_key text NOT NULL CHECK (step_key IN ('identity','assignment','documents','hr_review','independent_review','access_security','integration')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','validated','rejected')),
  evidence_ref text,
  note text,
  reviewer_id uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(subject_id,step_key),
  CONSTRAINT validated_step_has_proof CHECK (status <> 'validated' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL AND length(btrim(evidence_ref)) > 0))
);
ALTER TABLE public.hr_existing_account_onboarding_steps ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_existing_account_onboarding_steps FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.hr_existing_account_onboarding_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.profiles(id),
  step_key text NOT NULL,
  previous_status text NOT NULL,
  next_status text NOT NULL,
  evidence_ref text,
  note text,
  actor_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_existing_account_onboarding_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_existing_account_onboarding_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_existing_leadership_onboarding()
RETURNS TABLE(subject_id uuid, display_name text, position text, step_key text, status text, evidence_ref text, note text, reviewed_at timestamptz, reviewer_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor uuid := auth.uid(); v_rights jsonb;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO v_rights;
  IF COALESCE((v_rights->>'read')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
  END IF;
  RETURN QUERY
    SELECT p.id, concat_ws(' ',p.first_name,p.last_name)::text, p.position::text, k.key::text,
      COALESCE(s.status,'pending')::text, s.evidence_ref,s.note,s.reviewed_at,s.reviewer_id
    FROM public.profiles p
    CROSS JOIN (VALUES ('identity'),('assignment'),('documents'),('hr_review'),('independent_review'),('access_security'),('integration')) k(key)
    LEFT JOIN public.hr_existing_account_onboarding_steps s ON s.subject_id=p.id AND s.step_key=k.key
    WHERE p.position::text IN ('ceo','rh_manager') AND p.test_account=false AND p.app_origin='connect'
      AND p.hr_status='active'
    ORDER BY p.position::text,k.key;
END; $$;
REVOKE ALL ON FUNCTION public.list_existing_leadership_onboarding() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_existing_leadership_onboarding() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_existing_leadership_onboarding_step(
  p_subject uuid,p_step text,p_decision text,p_evidence_ref text,p_note text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_actor uuid := auth.uid();v_rights jsonb;v_prior text;v_index int;v_steps text[] := ARRAY['identity','assignment','documents','hr_review','independent_review','access_security','integration'];
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO v_rights;
  IF COALESCE((v_rights->>'validate')::boolean,false) IS NOT TRUE THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
  IF v_actor=p_subject THEN RAISE EXCEPTION 'Independent reviewer required' USING ERRCODE='42501'; END IF;
  IF p_decision NOT IN ('validated','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  IF p_decision='validated' AND nullif(btrim(coalesce(p_evidence_ref,'')),'') IS NULL THEN
    RAISE EXCEPTION 'Evidence reference required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=p_subject AND position::text IN ('ceo','rh_manager')
    AND app_origin='connect' AND test_account=false AND hr_status='active') THEN
    RAISE EXCEPTION 'Eligible account not found';
  END IF;
  v_index := array_position(v_steps,p_step);
  IF v_index IS NULL THEN RAISE EXCEPTION 'Invalid step'; END IF;
  -- Steps may not be skipped. Review of a rejected step can be repeated with a new proof.
  IF v_index>1 AND EXISTS (
    SELECT 1 FROM unnest(v_steps[1:v_index-1]) prior(key)
    WHERE NOT EXISTS (SELECT 1 FROM public.hr_existing_account_onboarding_steps s
      WHERE s.subject_id=p_subject AND s.step_key=prior.key AND s.status='validated')
  ) THEN RAISE EXCEPTION 'Previous onboarding steps are not validated'; END IF;
  SELECT status INTO v_prior FROM public.hr_existing_account_onboarding_steps
    WHERE subject_id=p_subject AND step_key=p_step FOR UPDATE;
  IF v_prior='validated' THEN RAISE EXCEPTION 'Already validated; reopening requires a separate controlled process'; END IF;
  INSERT INTO public.hr_existing_account_onboarding_steps(subject_id,step_key,status,evidence_ref,note,reviewer_id,reviewed_at,updated_at)
  VALUES(p_subject,p_step,p_decision,nullif(btrim(p_evidence_ref),''),nullif(btrim(p_note),''),v_actor,now(),now())
  ON CONFLICT(subject_id,step_key) DO UPDATE SET status=excluded.status,evidence_ref=excluded.evidence_ref,
    note=excluded.note,reviewer_id=excluded.reviewer_id,reviewed_at=excluded.reviewed_at,updated_at=excluded.updated_at;
  INSERT INTO public.hr_existing_account_onboarding_events(subject_id,step_key,previous_status,next_status,evidence_ref,note,actor_id)
    VALUES(p_subject,p_step,COALESCE(v_prior,'pending'),p_decision,nullif(btrim(p_evidence_ref),''),nullif(btrim(p_note),''),v_actor);
END; $$;
REVOKE ALL ON FUNCTION public.review_existing_leadership_onboarding_step(uuid,text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_existing_leadership_onboarding_step(uuid,text,text,text,text) TO authenticated;
