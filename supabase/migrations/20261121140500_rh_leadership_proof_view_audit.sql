-- Strengthen CEO/RH evidence: the file type must match the claimed stage,
-- and a named independent reviewer must have opened the exact BIB file.
-- This does not cryptographically prove a signature.
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
        AND CASE p_step
          WHEN 'identity' THEN d.document_type IN ('identity','administrative')
          WHEN 'documents' THEN d.document_type IN ('charter','policy','contract','regulatory')
          WHEN 'hr_review' THEN d.document_type IN ('administrative','evaluation','regulatory')
          WHEN 'independent_review' THEN d.document_type IN ('administrative','regulatory')
          WHEN 'access_security' THEN d.document_type IN ('administrative','regulatory')
          WHEN 'integration' THEN d.document_type IN ('training','administrative')
          ELSE false
        END
        AND file.test_account IS FALSE AND file.size_bytes>0
        AND nullif(btrim(file.file_id),'') IS NOT NULL
    );
  END IF;

  RETURN false;
END;
$proof$;
REVOKE ALL ON FUNCTION public.rh_leadership_evidence_verifiable(uuid,text,text)
  FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_guard_leadership_step_proof()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $guard$
DECLARE
  v_file_id uuid;
  v_document_created_at timestamptz;
BEGIN
  IF NEW.status='validated' THEN
    IF NEW.reviewer_id IS NULL OR NEW.reviewer_id=NEW.subject_id
       OR NEW.reviewed_at IS NULL
       OR NOT public.rh_leadership_evidence_verifiable(
          NEW.subject_id,NEW.step_key,NEW.evidence_ref
       ) THEN
      RAISE EXCEPTION 'leadership_evidence_not_verifiable' USING ERRCODE='23514';
    END IF;

    IF NEW.step_key IN ('documents','hr_review','independent_review',
                        'access_security','integration')
       AND char_length(btrim(coalesce(NEW.note,'')))<30 THEN
      RAISE EXCEPTION 'leadership_review_note_required' USING ERRCODE='23514';
    END IF;

    -- A real BIB document number is not evidence the reviewer actually
    -- inspected the contents. The controlled reader records a 'view' event.
    IF NEW.evidence_ref ~ '^BIB-RH-DOC-[0-9]{4}-[0-9]{6,}$' THEN
      SELECT f.id,d.created_at INTO v_file_id,v_document_created_at
      FROM public.rh_employee_documents d
      JOIN public.intranet_drive_documents f
        ON f.id=public.rh_extract_managed_drive_id(d.document_url)
      WHERE d.employee_id=NEW.subject_id
        AND d.document_reference=NEW.evidence_ref
        AND d.status IN ('valid','active')
        AND f.test_account IS FALSE
        AND f.size_bytes>0
      LIMIT 1;

      IF v_file_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.intranet_document_events event
        WHERE event.document_id=v_file_id
          AND event.actor_id=NEW.reviewer_id
          AND event.action='view'
          AND event.created_at>=v_document_created_at
          AND event.created_at>=now()-interval '30 days'
      ) THEN
        RAISE EXCEPTION 'leadership_evidence_not_opened_by_reviewer'
          USING ERRCODE='23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$guard$;
REVOKE ALL ON FUNCTION public.rh_guard_leadership_step_proof()
  FROM PUBLIC,anon,authenticated;
-- Existing BEFORE INSERT/UPDATE trigger remains attached to this function.
COMMIT;
