-- BIB RH: single authenticated server transaction for creating an onboarding,
-- its document register and its initial audit event. No table INSERT grants needed.
BEGIN;

CREATE OR REPLACE FUNCTION public.rh_create_onboarding_request(p_payload jsonb)
RETURNS public.hr_employee_requests
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO ''
AS $onb$
DECLARE
  actor uuid := (SELECT auth.uid());
  actor_profile public.profiles%ROWTYPE;
  result public.hr_employee_requests%ROWTYPE;
  requested_poles text[];
  primary_pole text;
  position_key text;
  requested_role text;
  manager uuid;
  applicant uuid;
  docs jsonb;
  work_mail text;
  first_name_clean text;
  last_name_clean text;
BEGIN
  IF actor IS NULL OR p_payload IS NULL OR jsonb_typeof(p_payload)<>'object'
     OR NOT public.can_intranet_action('rh.onboarding','create') THEN
    RAISE EXCEPTION 'rh_onboarding_creation_not_authorized' USING ERRCODE='42501';
  END IF;
  SELECT * INTO actor_profile FROM public.profiles
    WHERE id=actor AND app_origin='connect'
      AND test_account IS FALSE AND hr_status='active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'rh_onboarding_creator_not_active' USING ERRCODE='42501';
  END IF;

  -- No client may submit the generated reference, ID, role audit state or
  -- privileged mutation/provisioning attributes.
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_payload) AS k(key)
    WHERE key NOT IN (
      'first_name','last_name','personal_email','work_email','collaborator_type',
      'position','position_key','primary_pole','poles','seniority','requested_role',
      'contract_type','start_date','manager_id','notes','work_mode','subsidiary',
      'attached_documents','candidate_id','status','created_by'
    )
  ) THEN
    RAISE EXCEPTION 'rh_onboarding_unexpected_payload_key' USING ERRCODE='22023';
  END IF;

  first_name_clean := btrim(coalesce(p_payload->>'first_name',''));
  last_name_clean := btrim(coalesce(p_payload->>'last_name',''));
  work_mail := lower(btrim(coalesce(p_payload->>'work_email','')));
  IF char_length(first_name_clean) NOT BETWEEN 1 AND 100
    OR char_length(last_name_clean) NOT BETWEEN 1 AND 100
    OR char_length(work_mail)>254
    OR work_mail !~ '^[a-z0-9][a-z0-9._+-]*@brand-in-a-box[.]space$' THEN
    RAISE EXCEPTION 'rh_onboarding_identity_invalid' USING ERRCODE='22023';
  END IF;

  IF jsonb_typeof(p_payload->'poles')<>'array'
    OR jsonb_array_length(p_payload->'poles') NOT BETWEEN 1 AND 14 THEN
    RAISE EXCEPTION 'rh_onboarding_poles_invalid' USING ERRCODE='22023';
  END IF;
  SELECT array_agg(value) INTO requested_poles
    FROM jsonb_array_elements_text(p_payload->'poles') AS a(value);
  primary_pole:=nullif(btrim(coalesce(p_payload->>'primary_pole','')),'');
  position_key:=nullif(btrim(coalesce(p_payload->>'position_key','')),'');
  requested_role:=nullif(btrim(coalesce(p_payload->>'requested_role','')),'');
  IF primary_pole IS NULL OR NOT primary_pole=ANY(requested_poles)
    OR (SELECT count(DISTINCT v) FROM unnest(requested_poles) v)<>cardinality(requested_poles)
    OR EXISTS (SELECT 1 FROM unnest(requested_poles) v
      WHERE v IS NULL OR v NOT IN (
        'direction','finance','ops','supplier','marketplace','support',
        'marketing','rh','audit','compliance','rse','product','data','security'
      )) THEN
    RAISE EXCEPTION 'rh_onboarding_scope_invalid' USING ERRCODE='22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.rh_position_catalog c
     WHERE c.position_key=position_key AND c.pole_id=primary_pole AND c.active=true)
    OR NOT EXISTS (SELECT 1 FROM public.access_roles ar
     WHERE ar.role_key=requested_role AND ar.status='active'
       AND (ar.business_pole IS NULL OR ar.business_pole=ANY(requested_poles))) THEN
    RAISE EXCEPTION 'rh_onboarding_role_invalid' USING ERRCODE='22023';
  END IF;

  IF coalesce(p_payload->>'seniority','') NOT IN ('junior','mid','senior','lead','executive')
    OR coalesce(p_payload->>'work_mode','') NOT IN ('office','hybrid','remote')
    OR coalesce(p_payload->>'collaborator_type','') NOT IN
       ('internal','external','provider','consultant','apprentice','intern','other') THEN
    RAISE EXCEPTION 'rh_onboarding_classification_invalid' USING ERRCODE='22023';
  END IF;

  IF position_key='ceo' AND NOT public.is_canonical_bib_ceo(actor) THEN
    RAISE EXCEPTION 'rh_onboarding_ceo_reserved' USING ERRCODE='42501';
  END IF;

  manager := NULLIF(p_payload->>'manager_id','')::uuid;
  IF position_key<>'ceo' AND (
    manager IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.profiles m WHERE m.id=manager
        AND m.app_origin='connect' AND m.test_account IS FALSE
        AND m.hr_status='active' AND m.position::text='rh_manager'
        AND 'rh'=ANY(m.poles::text[])
    )
  ) THEN
    RAISE EXCEPTION 'rh_onboarding_referent_invalid' USING ERRCODE='22023';
  END IF;

  applicant := NULLIF(p_payload->>'candidate_id','')::uuid;
  docs := COALESCE(p_payload->'attached_documents','[]'::jsonb);
  IF jsonb_typeof(docs)<>'array' OR jsonb_array_length(docs)>50 THEN
    RAISE EXCEPTION 'rh_onboarding_documents_invalid' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.hr_employee_requests(
    first_name,last_name,personal_email,work_email,collaborator_type,
    position,position_key,primary_pole,poles,seniority,requested_role,
    contract_type,start_date,manager_id,notes,work_mode,subsidiary,
    attached_documents,candidate_id,created_by,status,request_kind
  ) VALUES (
    first_name_clean,last_name_clean,
    nullif(btrim(coalesce(p_payload->>'personal_email','')),''),
    work_mail, p_payload->>'collaborator_type',
    NULLIF(p_payload->>'position','')::public.employee_position,
    position_key,primary_pole,requested_poles,p_payload->>'seniority',requested_role,
    nullif(btrim(coalesce(p_payload->>'contract_type','')),''),
    nullif(p_payload->>'start_date','')::date,manager,
    nullif(btrim(coalesce(p_payload->>'notes','')),''),
    p_payload->>'work_mode',
    nullif(btrim(coalesce(p_payload->>'subsidiary','')),''),
    docs,applicant,actor,'submitted','onboarding'
  )
  RETURNING * INTO result;

  INSERT INTO public.hr_employee_request_events(
    request_id,actor_id,actor_name,action,to_status,note
  ) VALUES (
    result.id,actor,concat_ws(' ',actor_profile.first_name,actor_profile.last_name),
    'Dossier collaborateur créé','submitted',
    'Registre documentaire attribué automatiquement : '||result.document_register_reference
  );
  RETURN result;
END;
$onb$;

REVOKE ALL ON FUNCTION public.rh_create_onboarding_request(jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rh_create_onboarding_request(jsonb)
  TO authenticated;

COMMIT;
