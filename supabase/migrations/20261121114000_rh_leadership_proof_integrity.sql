-- Verify leadership onboarding evidence against real BIB registries.
-- A non-empty free-text value ("Aucun", "CEO, Global", etc.) is NOT evidence.
-- Preserve the existing audit trail when technically unsubstantiated approvals
-- are reopened for human review. No document or approval is fabricated.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_verifiable(
  p_subject uuid, p_step text, p_reference text
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $proof$
DECLARE
  v_reference text := btrim(coalesce(p_reference,''));
BEGIN
  IF p_subject IS NULL OR char_length(v_reference) NOT BETWEEN 8 AND 160
    OR p_step NOT IN ('identity','assignment','documents','hr_review',
                       'independent_review','access_security','integration')
    OR lower(v_reference) IN ('aucun','néant','neant','none','n/a','na','non renseigné',
                            'non renseigne','sans objet','non applicable','inconnu') THEN
    RETURN false;
  END IF;

  -- An HR onboarding v_reference can demonstrate the identity of an existing
  -- account only if the recorded identity is this exact subject, and the
  -- onboarding is neither rejected nor merely submitted.
  IF p_step='identity'
     AND (v_reference ~ '^HR-[0-9]{8}-[0-9]{4}$'
       OR v_reference ~ '^BIB-RH-ONB-[0-9]{4}-[0-9]{6,}$') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.hr_employee_requests r
      WHERE (r.reference=v_reference OR r.document_register_reference=v_reference)
        AND r.created_user_id=p_subject
        AND r.request_kind='onboarding'
        AND r.status IN ('account_created','completed')
    );
  END IF;

  -- Assignment proof refers to an actual ACTIVE, current assignment to this
  -- very subject, never a role label or arbitrary scope typed in a textbox.
  IF p_step='assignment'
    AND v_reference ~* '^ACCESS:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.access_assignments a
      JOIN public.access_roles role ON role.id=a.role_id
      WHERE a.id=substring(v_reference from 8)::uuid
        AND a.employee_id=p_subject AND a.status='active'
        AND role.status='active'
        AND (a.starts_at IS NULL OR a.starts_at<=now())
        AND (a.ends_at IS NULL OR a.ends_at>now())
    );
  END IF;

  -- Real document evidence: employee-scoped RH registry entry, with a
  -- canonical internal BIB document link pointing to existing nonempty file
  -- metadata. This is evidence of a registered file, NOT automatic proof of
  -- signature or acceptance: the reviewer must check the file and record
  -- their observations on document, HR and independent-review stages.
  IF p_step IN ('identity','documents','hr_review','independent_review','access_security','integration')
     AND v_reference ~ '^BIB-RH-DOC-[0-9]{4}-[0-9]{6,}$' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.rh_employee_documents d
      JOIN public.intranet_drive_documents file ON file.id =
        CASE
          WHEN d.document_url ~* '^/documents[?]document=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          THEN substring(d.document_url FROM 'document=([0-9a-fA-F-]{36})')::uuid
          ELSE NULL::uuid
        END
      WHERE d.employee_id=p_subject
        AND d.document_reference=v_reference
        AND d.status IN ('active','valid')
        AND (p_step<>'documents' OR d.document_type IN ('charter','policy','contract','regulatory'))
        AND file.test_account IS FALSE AND file.size_bytes>0
        AND nullif(btrim(file.file_id),'') IS NOT NULL
    );
  END IF;

  RETURN false;
END;
$proof$;

-- This internal helper reads protected personnel metadata but exposes no
-- direct anonymous/authenticated SQL endpoint. Only the guarded RPC uses it.
REVOKE ALL ON FUNCTION public.rh_leadership_evidence_verifiable(uuid,text,text)
  FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.hr_existing_onboarding_evidence_reconciliation (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.profiles(id),
  step_key text NOT NULL,
  previous_status text NOT NULL,
  previous_evidence_ref text,
  previous_reviewer_id uuid REFERENCES public.profiles(id),
  previous_reviewed_at timestamptz,
  reason text NOT NULL,
  correction_source text NOT NULL DEFAULT 'server_migration',
  corrected_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hr_existing_onboarding_evidence_reconciliation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hr_existing_onboarding_evidence_reconciliation
  FROM PUBLIC,anon,authenticated;

-- Capture every invalidated approval BEFORE changing it; do not reattribute a
-- system correction to the former human reviewer in the business event log.
CREATE TEMP TABLE _rh_invalid_leadership_approvals ON COMMIT DROP AS
  SELECT s.subject_id,s.step_key,s.status,s.evidence_ref,s.reviewer_id,s.reviewed_at
  FROM public.hr_existing_account_onboarding_steps s
  WHERE s.status='validated'
    AND NOT public.rh_leadership_evidence_verifiable(s.subject_id,s.step_key,s.evidence_ref);

INSERT INTO public.hr_existing_onboarding_evidence_reconciliation (
  subject_id,step_key,previous_status,previous_evidence_ref,previous_reviewer_id,
  previous_reviewed_at,reason,correction_source
)
SELECT subject_id,step_key,status,evidence_ref,reviewer_id,reviewed_at,
 'Ancienne validation sans justificatif vérifiable dans les registres BIB/RH',
 'migration_reconciliation'
FROM _rh_invalid_leadership_approvals;

UPDATE public.hr_existing_account_onboarding_steps s
SET status='pending',evidence_ref=NULL,reviewer_id=NULL,reviewed_at=NULL,
    note='Contrôle rouvert : l’ancienne preuve n’était pas vérifiable. Ajouter une pièce BIB réelle et demander une nouvelle revue.',
    updated_at=now()
FROM _rh_invalid_leadership_approvals i
WHERE s.subject_id=i.subject_id AND s.step_key=i.step_key;

-- The same protection applies to future elevated writers and migrations,
-- not only to the React form. This trigger does not grant table write access.
CREATE OR REPLACE FUNCTION public.rh_guard_leadership_step_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $guard$
BEGIN
  IF NEW.status='validated' THEN
    IF NEW.reviewer_id IS NULL OR NEW.reviewer_id=NEW.subject_id
       OR NEW.reviewed_at IS NULL
       OR NOT public.rh_leadership_evidence_verifiable(
         NEW.subject_id,NEW.step_key,NEW.evidence_ref
       ) THEN
      RAISE EXCEPTION 'leadership_evidence_not_verifiable'
        USING ERRCODE='23514';
    END IF;
    IF NEW.step_key IN ('documents','hr_review','independent_review',
                        'access_security','integration')
       AND char_length(btrim(coalesce(NEW.note,'')))<30 THEN
      RAISE EXCEPTION 'leadership_review_note_required'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$guard$;

REVOKE ALL ON FUNCTION public.rh_guard_leadership_step_proof()
  FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_rh_guard_leadership_step_proof
  ON public.hr_existing_account_onboarding_steps;
CREATE TRIGGER trg_rh_guard_leadership_step_proof
  BEFORE INSERT OR UPDATE ON public.hr_existing_account_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.rh_guard_leadership_step_proof();

ALTER TABLE public.hr_existing_account_onboarding_steps
  ADD CONSTRAINT validated_leadership_evidence_not_placeholder
  CHECK (status<>'validated' OR
    (lower(btrim(coalesce(evidence_ref,''))) NOT IN
      ('aucun','néant','neant','none','n/a','na','non renseigné',
       'non renseigne','sans objet','non applicable','inconnu')
     AND nullif(btrim(evidence_ref),'') IS NOT NULL));

CREATE OR REPLACE FUNCTION public.list_existing_leadership_onboarding()
RETURNS TABLE(
  subject_id uuid,display_name text,"position" text,step_key text,status text,
  evidence_ref text,note text,reviewed_at timestamptz,reviewer_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $list$
DECLARE actor uuid:=(SELECT auth.uid()); rights jsonb;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO rights;
  IF COALESCE((rights->>'read')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  SELECT p.id,concat_ws(' ',p.first_name,p.last_name)::text,p.position::text,k.key::text,
    CASE WHEN s.status='validated' AND NOT public.rh_leadership_evidence_verifiable(
          s.subject_id,s.step_key,s.evidence_ref)
         THEN 'pending' ELSE coalesce(s.status,'pending') END::text,
    s.evidence_ref,s.note,s.reviewed_at,s.reviewer_id
  FROM public.profiles p
  CROSS JOIN (VALUES ('identity'),('assignment'),('documents'),('hr_review'),
                     ('independent_review'),('access_security'),('integration')) k(key)
  LEFT JOIN public.hr_existing_account_onboarding_steps s
    ON s.subject_id=p.id AND s.step_key=k.key
  WHERE p.position::text IN ('ceo','rh_manager')
    AND p.test_account IS FALSE AND p.app_origin='connect' AND p.hr_status='active'
  ORDER BY p.position::text,k.key;
END;
$list$;

REVOKE ALL ON FUNCTION public.list_existing_leadership_onboarding()
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_existing_leadership_onboarding()
  TO authenticated;

CREATE OR REPLACE FUNCTION public.review_existing_leadership_onboarding_step(
  p_subject uuid,p_step text,p_decision text,p_evidence_ref text,p_note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $review$
DECLARE
  actor uuid:=(SELECT auth.uid());
  rights jsonb;
  previous_status text;
  previous_reference text;
  step_index int;
  step_order text[]:=ARRAY['identity','assignment','documents','hr_review',
                           'independent_review','access_security','integration'];
  note_clean text:=nullif(btrim(coalesce(p_note,'')),'');
  evidence_clean text:=nullif(btrim(coalesce(p_evidence_ref,'')),'');
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO rights;
  IF coalesce((rights->>'validate')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
  END IF;
  IF actor=p_subject THEN
    RAISE EXCEPTION 'Independent reviewer required' USING ERRCODE='42501';
  END IF;
  IF p_decision NOT IN ('validated','rejected') THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE='22023';
  END IF;
  step_index:=array_position(step_order,p_step);
  IF step_index IS NULL THEN RAISE EXCEPTION 'Invalid step' USING ERRCODE='22023'; END IF;

  -- Serialize validations for one subject, including different steps, to
  -- preserve the seven-stage sequence under concurrent reviewer sessions.
  PERFORM 1 FROM public.profiles p WHERE p.id=p_subject
    AND p.position::text IN('ceo','rh_manager')
    AND p.app_origin='connect' AND p.test_account IS FALSE AND p.hr_status='active'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Eligible account not found' USING ERRCODE='P0002'; END IF;

  IF step_index>1 AND EXISTS (
    SELECT 1 FROM unnest(step_order[1:step_index-1]) prior(key)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.hr_existing_account_onboarding_steps s
      WHERE s.subject_id=p_subject AND s.step_key=prior.key
        AND s.status='validated'
        AND public.rh_leadership_evidence_verifiable(s.subject_id,s.step_key,s.evidence_ref)
    )
  ) THEN
    RAISE EXCEPTION 'Previous onboarding steps are not validated with verifiable evidence'
      USING ERRCODE='23514';
  END IF;

  IF p_step='independent_review' AND EXISTS (
    SELECT 1 FROM public.hr_existing_account_onboarding_steps s
    WHERE s.subject_id=p_subject AND s.step_key='hr_review'
      AND s.reviewer_id=actor
  ) THEN RAISE EXCEPTION 'Independent visa requires a different reviewer' USING ERRCODE='42501'; END IF;

  IF p_decision='validated' THEN
    IF NOT public.rh_leadership_evidence_verifiable(p_subject,p_step,evidence_clean) THEN
      RAISE EXCEPTION 'leadership_evidence_not_verifiable' USING ERRCODE='23514';
    END IF;
    IF p_step IN ('documents','hr_review','independent_review',
                  'access_security','integration')
       AND char_length(coalesce(note_clean,''))<30 THEN
      RAISE EXCEPTION 'leadership_review_note_required' USING ERRCODE='23514';
    END IF;
  ELSIF char_length(coalesce(note_clean,''))<20 THEN
    RAISE EXCEPTION 'leadership_rejection_note_required' USING ERRCODE='23514';
  END IF;

  SELECT s.status,s.evidence_ref INTO previous_status,previous_reference
  FROM public.hr_existing_account_onboarding_steps s
  WHERE s.subject_id=p_subject AND s.step_key=p_step FOR UPDATE;

  IF previous_status='validated'
    AND public.rh_leadership_evidence_verifiable(p_subject,p_step,previous_reference) THEN
    RAISE EXCEPTION 'Already validated; reopening requires a separate controlled process'
      USING ERRCODE='23514';
  END IF;

  INSERT INTO public.hr_existing_account_onboarding_steps(
    subject_id,step_key,status,evidence_ref,note,reviewer_id,reviewed_at,updated_at
  ) VALUES(p_subject,p_step,p_decision,evidence_clean,note_clean,actor,now(),now())
  ON CONFLICT(subject_id,step_key) DO UPDATE
    SET status=excluded.status,evidence_ref=excluded.evidence_ref,
        note=excluded.note,reviewer_id=excluded.reviewer_id,
        reviewed_at=excluded.reviewed_at,updated_at=excluded.updated_at;

  INSERT INTO public.hr_existing_account_onboarding_events(
    subject_id,step_key,previous_status,next_status,evidence_ref,note,actor_id
  ) VALUES(p_subject,p_step,coalesce(previous_status,'pending'),p_decision,
           evidence_clean,note_clean,actor);
END;
$review$;

REVOKE ALL ON FUNCTION public.review_existing_leadership_onboarding_step(
  uuid,text,text,text,text
) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_existing_leadership_onboarding_step(
  uuid,text,text,text,text
) TO authenticated;

COMMIT;
