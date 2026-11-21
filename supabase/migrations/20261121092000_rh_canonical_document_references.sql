-- BIB RH: origin-independent document references for all new RH files,
-- onboarding requests and mutation requests. Legacy rows are untouched.
BEGIN;

CREATE OR REPLACE FUNCTION public.validate_hr_employee_mutation(p_target uuid, p_payload jsonb, p_replace_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE actor uuid:=auth.uid(); target public.profiles%ROWTYPE; catalog public.rh_position_catalog%ROWTYPE;
  access_role public.access_roles%ROWTYPE; item jsonb; key text; chosen_poles text[]; actual_replacements integer;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload)<>'object' OR p_target IS NULL OR p_target=actor THEN
    RAISE EXCEPTION 'hr_mutation_target_forbidden' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload) k WHERE k NOT IN (
    'position','primary_pole','poles','seniority','requested_role','contract_type','start_date','manager_id','work_mode','subsidiary','notes','attached_documents')) THEN
    RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  SELECT * INTO target FROM public.profiles WHERE id=p_target;
  IF NOT FOUND OR NOT public.is_intranet_staff(p_target) OR coalesce(target.test_account,false)
      OR coalesce(target.hr_status::text,'') NOT IN ('active','onboarding','leave') OR public.has_role(p_target,'admin')
      OR (public.is_leadership(p_target) AND NOT public.has_role(actor,'admin')) THEN
    RAISE EXCEPTION 'hr_mutation_target_forbidden' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=p_target AND status='pending') THEN
    RAISE EXCEPTION 'hr_mutation_pending_access' USING ERRCODE='40001'; END IF;
  IF p_replace_ids IS NULL OR array_ndims(p_replace_ids)>1 OR array_position(p_replace_ids,NULL) IS NOT NULL
      OR cardinality(p_replace_ids)<>(SELECT count(DISTINCT id) FROM unnest(p_replace_ids) id) THEN
    RAISE EXCEPTION 'invalid_hr_mutation_replacements' USING ERRCODE='22023'; END IF;
  SELECT count(*) INTO actual_replacements FROM public.access_assignments
    WHERE employee_id=p_target AND status='active' AND id=ANY(p_replace_ids);
  IF actual_replacements<>cardinality(p_replace_ids) OR (actual_replacements=0 AND EXISTS(
      SELECT 1 FROM public.access_assignments WHERE employee_id=p_target AND status='active')) THEN
    RAISE EXCEPTION 'invalid_hr_mutation_replacements' USING ERRCODE='22023'; END IF;
  FOREACH key IN ARRAY ARRAY['position','primary_pole','seniority','requested_role','start_date','work_mode','subsidiary'] LOOP
    IF jsonb_typeof(p_payload->key) IS DISTINCT FROM 'string' OR char_length(btrim(p_payload->>key)) NOT BETWEEN 1 AND 200 THEN
      RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  END LOOP;
  IF jsonb_typeof(p_payload->'poles') IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload->'poles') NOT BETWEEN 1 AND 14
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_payload->'poles') v WHERE jsonb_typeof(v)<>'string') THEN
    RAISE EXCEPTION 'invalid_hr_mutation_poles' USING ERRCODE='22023'; END IF;
  SELECT array_agg(value ORDER BY value) INTO chosen_poles FROM jsonb_array_elements_text(p_payload->'poles') value;
  IF cardinality(chosen_poles)<>(SELECT count(DISTINCT x) FROM unnest(chosen_poles) x)
      OR NOT chosen_poles<@ARRAY['direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security']::text[]
      OR NOT (p_payload->>'primary_pole'=ANY(chosen_poles)) THEN
    RAISE EXCEPTION 'invalid_hr_mutation_poles' USING ERRCODE='22023'; END IF;
  SELECT * INTO catalog FROM public.rh_position_catalog WHERE position_key=p_payload->>'position' AND active=true;
  IF NOT FOUND OR catalog.pole_id<>p_payload->>'primary_pole' OR NOT (catalog.pole_id=ANY(chosen_poles)) THEN
    RAISE EXCEPTION 'hr_mutation_catalog_position_invalid' USING ERRCODE='22023'; END IF;
  SELECT * INTO access_role FROM public.access_roles WHERE role_key=p_payload->>'requested_role' AND status='active';
  IF NOT FOUND OR coalesce(access_role.is_external,false) OR access_role.department IN ('technical','external')
      OR access_role.role_key LIKE 'svc\_%' ESCAPE '\' OR access_role.role_key LIKE 'ext\_%' ESCAPE '\'
      OR access_role.role_key IN ('admin','super_admin','service_role') THEN
    RAISE EXCEPTION 'hr_mutation_role_forbidden' USING ERRCODE='42501'; END IF;
  IF access_role.business_pole IS NOT NULL AND NOT (access_role.business_pole=ANY(chosen_poles))
      OR NOT coalesce(access_role.poles,'{}'::text[])<@chosen_poles
      OR (access_role.seniority IS NOT NULL AND access_role.seniority<>p_payload->>'seniority')
      OR p_payload->>'seniority' NOT IN ('junior','mid','senior','lead','executive') THEN
    RAISE EXCEPTION 'hr_mutation_role_scope_invalid' USING ERRCODE='22023'; END IF;
  IF NOT public.has_role(actor,'admin') AND ('direction'=ANY(chosen_poles) OR access_role.business_pole='direction'
      OR 'direction'=ANY(coalesce(access_role.poles,'{}'::text[])) OR catalog.position_key='ceo') THEN
    RAISE EXCEPTION 'hr_mutation_leadership_forbidden' USING ERRCODE='42501'; END IF;
  IF (SELECT count(*) FROM public.access_role_scopes WHERE role_id=access_role.id)>1 THEN
    RAISE EXCEPTION 'hr_mutation_role_scope_ambiguous' USING ERRCODE='22023'; END IF;
  IF p_payload->>'work_mode' NOT IN ('office','hybrid','remote') OR p_payload->>'start_date' !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  PERFORM (p_payload->>'start_date')::date;
  IF jsonb_typeof(p_payload->'manager_id') IS DISTINCT FROM 'string' OR NOT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id=(p_payload->>'manager_id')::uuid AND p.id<>p_target AND NOT coalesce(p.test_account,false)
      AND p.hr_status IN ('active','onboarding') AND p.position::text='rh_manager' AND 'rh'=ANY(p.poles)) THEN
    RAISE EXCEPTION 'hr_mutation_manager_invalid' USING ERRCODE='22023'; END IF;
  FOREACH key IN ARRAY ARRAY['contract_type','notes'] LOOP
    IF p_payload ? key AND jsonb_typeof(p_payload->key) NOT IN ('string','null') THEN
      RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  END LOOP;
  IF char_length(p_payload->>'contract_type')>100 OR char_length(p_payload->>'notes')>2000 THEN
    RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  IF jsonb_typeof(p_payload->'attached_documents') IS DISTINCT FROM 'array' OR jsonb_array_length(p_payload->'attached_documents')>50 THEN
    RAISE EXCEPTION 'invalid_hr_mutation_documents' USING ERRCODE='22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_payload->'attached_documents') LOOP
    IF jsonb_typeof(item)<>'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(item) k WHERE k NOT IN ('name','document_type','document_url'))
        OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string' OR char_length(btrim(item->>'name')) NOT BETWEEN 1 AND 200
        OR jsonb_typeof(item->'document_type') IS DISTINCT FROM 'string' OR char_length(item->>'document_type') NOT BETWEEN 1 AND 50
        OR coalesce(jsonb_typeof(item->'document_url'),'missing') NOT IN ('string','null') OR (item->>'document_url' IS NOT NULL
          AND (char_length(item->>'document_url')>2048 OR item->>'document_url' !~ '^/documents[?]document=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')) THEN
      RAISE EXCEPTION 'invalid_hr_mutation_documents' USING ERRCODE='22023'; END IF;
  END LOOP;
  RETURN p_payload;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rh_guard_canonical_document_links()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $rh_guard$
DECLARE
  doc jsonb;
  link text;
BEGIN
  IF TG_TABLE_NAME = 'rh_employee_documents' THEN
    link := NEW.document_url;
    IF link IS NOT NULL AND link <> ''
       AND link !~ '^/documents[?]document=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'rh_managed_document_reference_required'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.attached_documents IS NULL OR jsonb_typeof(NEW.attached_documents) <> 'array'
     OR jsonb_array_length(NEW.attached_documents) > 50 THEN
    RAISE EXCEPTION 'rh_attached_documents_invalid'
      USING ERRCODE = '23514';
  END IF;
  FOR doc IN SELECT value FROM jsonb_array_elements(NEW.attached_documents) LOOP
    IF jsonb_typeof(doc) <> 'object' THEN
      RAISE EXCEPTION 'rh_attached_document_invalid' USING ERRCODE = '23514';
    END IF;
    IF doc ? 'document_url' AND jsonb_typeof(doc->'document_url') NOT IN ('null','string') THEN
      RAISE EXCEPTION 'rh_attached_document_url_invalid' USING ERRCODE = '23514';
    END IF;
    link := doc->>'document_url';
    IF link IS NOT NULL AND link <> ''
       AND link !~ '^/documents[?]document=[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
      RAISE EXCEPTION 'rh_managed_document_reference_required'
        USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$rh_guard$;

REVOKE ALL ON FUNCTION public.rh_guard_canonical_document_links()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_rh_document_links_canonical ON public.rh_employee_documents;
CREATE TRIGGER trg_rh_document_links_canonical
  BEFORE INSERT OR UPDATE OF document_url
  ON public.rh_employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.rh_guard_canonical_document_links();

DROP TRIGGER IF EXISTS trg_rh_request_links_canonical ON public.hr_employee_requests;
CREATE TRIGGER trg_rh_request_links_canonical
  BEFORE INSERT OR UPDATE OF attached_documents
  ON public.hr_employee_requests
  FOR EACH ROW EXECUTE FUNCTION public.rh_guard_canonical_document_links();
COMMIT;
