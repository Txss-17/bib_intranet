-- Forward repair for databases that have already applied 0034.
-- Keep enum-backed profile poles compatible with the legacy role resolver, preserve
-- orphaned assignment UUIDs, and fail closed on incomplete mutation data.
CREATE OR REPLACE FUNCTION public.can_hr_employee_mutation_action(p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); chosen text; saved_count integer; permitted boolean; level text; has_roles boolean;
BEGIN
  IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','validate','apply')
      OR NOT coalesce(public.is_intranet_staff(actor),false)
      OR NOT public.has_pole(actor,'rh')
      OR EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND coalesce(test_account,false)) THEN RETURN false; END IF;
  IF public.has_role(actor,'admin') THEN RETURN true; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN
    SELECT public.legacy_hr_publication_role(position::text,poles::text[]) INTO chosen FROM public.profiles WHERE id=actor;
  END IF;
  SELECT count(*),coalesce(bool_or(ap.allowed AND ac.action_key=CASE WHEN p_action='apply' THEN 'validate' ELSE p_action END),false)
    INTO saved_count,permitted
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  JOIN public.access_permissions ap ON ap.role_id=ar.id
  JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='rh.onboarding' AND ai.status='active'
  JOIN public.access_actions ac ON ac.id=ap.action_id
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=chosen);
  IF saved_count>0 THEN
    IF p_action='apply' THEN
      RETURN permitted AND EXISTS(
        SELECT 1 FROM public.access_roles ar
        LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
          AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
        JOIN public.access_permissions ap ON ap.role_id=ar.id AND ap.allowed
        JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='rh.onboarding' AND ai.status='active'
        JOIN public.access_actions ac ON ac.id=ap.action_id AND ac.action_key='update'
        WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=chosen));
    END IF;
    RETURN permitted;
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id AND ar.status='active'
    WHERE aa.employee_id=actor AND aa.status='active' AND (aa.starts_at IS NULL OR aa.starts_at<=now())
      AND (aa.ends_at IS NULL OR aa.ends_at>=now())) INTO has_roles;
  IF NOT has_roles AND EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN RETURN false; END IF;
  IF chosen IS NOT NULL AND EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=chosen AND status<>'active') THEN RETURN false; END IF;
  IF p_action='read' THEN RETURN true; END IF;
  SELECT coalesce(seniority::text,'junior') INTO level FROM public.profiles WHERE id=actor;
  IF EXISTS(
    SELECT 1 FROM public.access_roles ar
    LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
      AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
    WHERE ar.status='active' AND ar.read_only AND (aa.employee_id IS NOT NULL OR ar.role_key=chosen)) THEN RETURN false; END IF;
  RETURN CASE WHEN p_action='create' THEN level IN ('mid','senior','lead','executive')
    ELSE level IN ('senior','lead','executive') END;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.can_hr_publication_action(p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); saved_count integer; saved_allow boolean; level text;
  in_scope boolean; has_active boolean; only_read_only boolean; legacy_role text;
BEGIN
  IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','update','publish')
      OR NOT coalesce(public.is_intranet_staff(actor),false) THEN RETURN false; END IF;
  IF public.has_role(actor,'admin') THEN RETURN true; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN
    SELECT public.legacy_hr_publication_role(p.position::text,p.poles::text[]) INTO legacy_role FROM public.profiles p WHERE p.id=actor;
    IF legacy_role IS NOT NULL AND EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role)
      AND NOT EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=legacy_role AND status='active') THEN RETURN false; END IF;
  END IF;
  SELECT count(*),coalesce(bool_or(ap.allowed AND ac.action_key=p_action),false)
    INTO saved_count,saved_allow
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  JOIN public.access_permissions ap ON ap.role_id=ar.id
  JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='rh.publications' AND ai.status='active'
  JOIN public.access_actions ac ON ac.id=ap.action_id
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  -- A saved page grants only its explicitly allowed actions, including explicit denials.
  IF saved_count>0 THEN RETURN saved_allow; END IF;
  SELECT count(*)>0,coalesce(bool_and(ar.read_only),false) INTO has_active,only_read_only
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  IF NOT has_active AND EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN RETURN false; END IF;
  SELECT coalesce(p.seniority::text,'junior'),coalesce('rh'=ANY(p.poles),false)
    INTO level,in_scope FROM public.profiles p WHERE p.id=actor;
  IF public.is_leadership(actor) THEN level:='executive'; in_scope:=true; END IF;
  IF NOT coalesce(in_scope,false) THEN RETURN false; END IF;
  IF p_action='read' THEN RETURN true; END IF;
  IF only_read_only THEN RETURN false; END IF;
  IF p_action IN ('create','update') THEN RETURN level IN ('mid','senior','lead','executive'); END IF;
  RETURN level IN ('lead','executive');
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.hr_employee_mutation_state(p_user uuid,p_role_key text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
SELECT jsonb_build_object(
  'profile',(SELECT jsonb_build_object('id',id,'email',email,'first_name',first_name,'last_name',last_name,
    'position',position,'position_key',position_key,'poles',poles,'seniority',seniority,'collaborator_type',collaborator_type,
    'hr_status',hr_status,'manager_id',manager_id,'work_mode',work_mode,'subsidiary',subsidiary,'test_account',test_account)
    FROM public.profiles WHERE id=p_user),
  'assignments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',aa.id,'role_id',aa.role_id,'role_key',ar.role_key,
    'label',coalesce(ar.label,'Affectation sans rôle'),'scope_id',aa.scope_id,'scope_value',aa.scope_value,'status',aa.status,'starts_at',aa.starts_at,
    'ends_at',aa.ends_at,'updated_at',aa.updated_at) ORDER BY aa.id)
    FROM public.access_assignments aa LEFT JOIN public.access_roles ar ON ar.id=aa.role_id WHERE aa.employee_id=p_user AND aa.status='active'),'[]'::jsonb),
  'technical_roles',coalesce((SELECT jsonb_agg(role::text ORDER BY role::text) FROM public.user_roles WHERE user_id=p_user),'[]'::jsonb),
  'documents',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',name,'document_type',document_type,'document_url',document_url,
    'status',status,'updated_at',updated_at) ORDER BY id) FROM public.rh_employee_documents
    WHERE employee_id=p_user AND source='onboarding' AND status IN ('active','valid')),'[]'::jsonb),
  'source_request_id',(SELECT id FROM public.hr_employee_requests WHERE created_user_id=p_user AND status='completed' ORDER BY created_at DESC,id DESC LIMIT 1),
  'role',(SELECT to_jsonb(ar) FROM public.access_roles ar WHERE role_key=p_role_key),
  'role_scopes',coalesce((SELECT jsonb_agg(to_jsonb(s) ORDER BY s.id) FROM public.access_role_scopes s
    JOIN public.access_roles ar ON ar.id=s.role_id WHERE ar.role_key=p_role_key),'[]'::jsonb),
  'role_permissions',coalesce((SELECT jsonb_agg(to_jsonb(ap) ORDER BY ap.id) FROM public.access_permissions ap
    JOIN public.access_roles ar ON ar.id=ap.role_id WHERE ar.role_key=p_role_key),'[]'::jsonb)
);
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.validate_hr_employee_mutation(p_target uuid,p_payload jsonb,p_replace_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
          AND (char_length(item->>'document_url')>2048 OR item->>'document_url' !~ '^https://[^/@[:space:]]+(/|$)')) THEN
      RAISE EXCEPTION 'invalid_hr_mutation_documents' USING ERRCODE='22023'; END IF;
  END LOOP;
  RETURN p_payload;
END;
$$;

--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.set_hr_employee_mutation_status(p_request_id uuid,p_status text,p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request public.hr_employee_requests%ROWTYPE; actor uuid:=auth.uid();
BEGIN
  IF NOT public.can_hr_employee_mutation_action('read') OR NOT public.can_hr_employee_mutation_action('validate') THEN
    RAISE EXCEPTION 'hr_mutation_forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO request FROM public.hr_employee_requests WHERE id=p_request_id AND request_kind='mutation' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'hr_mutation_not_found' USING ERRCODE='P0002'; END IF;
  IF request.target_user_id=actor THEN RAISE EXCEPTION 'hr_mutation_target_forbidden' USING ERRCODE='42501'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('hr_validated','rejected') OR char_length(p_note)>2000
      OR (p_status='rejected' AND nullif(btrim(coalesce(p_note,'')), '') IS NULL) THEN
    RAISE EXCEPTION 'invalid_hr_mutation_status' USING ERRCODE='22023'; END IF;
  IF request.status=p_status AND (p_status<>'rejected' OR request.rejection_reason IS NOT DISTINCT FROM p_note) THEN RETURN to_jsonb(request); END IF;
  IF request.status NOT IN ('submitted','hr_validated') OR (request.status='hr_validated' AND p_status<>'rejected') THEN
    RAISE EXCEPTION 'hr_mutation_status_changed' USING ERRCODE='40001'; END IF;
  -- Stale proposals must remain rejectable so they do not block a corrected request.
  IF p_status='hr_validated' THEN
    PERFORM public.validate_hr_employee_mutation(request.target_user_id,request.mutation_snapshot->'submitted_payload',request.mutation_replace_assignment_ids);
    IF public.hr_employee_mutation_state(request.target_user_id,request.requested_role) IS DISTINCT FROM request.mutation_snapshot->'state' THEN
      RAISE EXCEPTION 'hr_mutation_target_changed' USING ERRCODE='40001'; END IF;
  END IF;
  UPDATE public.hr_employee_requests SET status=p_status,
    hr_validated_by=CASE WHEN p_status='hr_validated' THEN actor ELSE hr_validated_by END,
    hr_validated_at=CASE WHEN p_status='hr_validated' THEN clock_timestamp() ELSE hr_validated_at END,
    rejection_reason=CASE WHEN p_status='rejected' THEN p_note ELSE NULL END
  WHERE id=p_request_id;
  INSERT INTO public.hr_employee_request_events(request_id,actor_id,actor_name,action,from_status,to_status,note)
  SELECT request.id,actor,btrim(concat_ws(' ',first_name,last_name)),'Décision RH sur mutation',request.status,p_status,p_note
  FROM public.profiles WHERE id=actor;
  RETURN (SELECT to_jsonb(r) FROM public.hr_employee_requests r WHERE id=p_request_id);
END;
$$;
