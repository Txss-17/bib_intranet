-- Integrate no-copy, in-person ID verification with seven-step CEO/RH
-- onboarding. A linked account is not adequate proof of physical identity.
BEGIN;
CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_verifiable(p_subject uuid, p_step text, p_reference text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  -- A created account, an unverified request or a Drive file is not
  -- sufficient evidence of identity: require a signed-off HR attestation.
  IF p_step='identity' THEN
    RETURN v_reference ~ '^BIB-RH-IDV-[0-9]{4}-[0-9]{6,}$'
      AND EXISTS(
        SELECT 1 FROM public.hr_leadership_identity_attestations a
        JOIN public.profiles verifier ON verifier.id=a.verifier_id
        WHERE a.subject_id=p_subject
          AND a.reference=v_reference
          AND a.status='verified'
          AND a.revoked_at IS NULL
          AND a.verifier_id<>a.subject_id
          AND a.method='in_person_original'
          AND a.original_inspected IS TRUE
          AND a.subject_matched IS TRUE
          AND a.apparent_validity_checked IS TRUE
          AND a.no_copy_retained IS TRUE
          AND verifier.app_origin='connect'
          AND verifier.test_account IS FALSE
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
  IF p_step IN ('documents','hr_review','independent_review','access_security','integration')
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
          WHEN 'identity' THEN false
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
$function$;

REVOKE ALL ON FUNCTION public.rh_leadership_evidence_verifiable(uuid,text,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rh_leadership_evidence_options()
RETURNS TABLE(subject_id uuid,step_key text,evidence_ref text,label text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $options$
DECLARE
 v_actor uuid:=(SELECT auth.uid());
 v_rights jsonb;
BEGIN
 IF v_actor IS NULL THEN
  RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
 END IF;
 SELECT to_jsonb(public.get_hr_onboarding_permissions()) INTO v_rights;
 IF COALESCE((v_rights->>'read')::boolean,false) IS NOT TRUE THEN
  RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';
 END IF;

 RETURN QUERY
 WITH leadership AS (
   SELECT p.id FROM public.profiles p
   WHERE p.position::text IN ('ceo','rh_manager')
     AND p.app_origin='connect' AND p.hr_status='active'
     AND p.test_account IS FALSE
 ), options AS (
   SELECT p.id AS who,'assignment'::text AS stage,
     ('ACCESS:'||aa.id::text)::text AS ref,
     (role.label||coalesce(' — '||nullif(aa.scope_value,''),' — portée globale'))::text AS display
   FROM leadership p
   JOIN public.access_assignments aa ON aa.employee_id=p.id
   JOIN public.access_roles role ON role.id=aa.role_id
   WHERE public.rh_leadership_evidence_verifiable(p.id,'assignment','ACCESS:'||aa.id::text)

   UNION ALL
   SELECT p.id AS who,'identity'::text AS stage,
     a.reference::text AS ref,
     ('Vérification d’identité en présence — '||a.reference)::text AS display
   FROM leadership p
   JOIN public.hr_leadership_identity_attestations a ON a.subject_id=p.id
   WHERE public.rh_leadership_evidence_verifiable(p.id,'identity',a.reference)

   UNION ALL
   SELECT p.id AS who,step.key::text AS stage,d.document_reference::text AS ref,
     (d.name||' — '||d.document_reference)::text AS display
   FROM public.rh_employee_documents d
   JOIN leadership p ON p.id=d.employee_id
   CROSS JOIN (VALUES ('documents'),('hr_review'),('independent_review'),
                      ('access_security'),('integration')) step(key)
   WHERE d.document_reference IS NOT NULL
     AND public.rh_leadership_evidence_verifiable(p.id,step.key,d.document_reference)
 )
 SELECT o.who,o.stage,o.ref,o.display
 FROM options o
 ORDER BY o.who,o.stage,o.ref
 LIMIT 300;
END;
$options$;
REVOKE ALL ON FUNCTION public.rh_leadership_evidence_options() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_leadership_evidence_options() TO authenticated;
COMMIT;