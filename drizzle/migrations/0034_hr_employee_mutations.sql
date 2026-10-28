-- Existing-account changes stay inside RH; they never invite or rebind an Auth account by email.
ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS request_kind text NOT NULL DEFAULT 'onboarding' CHECK (request_kind IN ('onboarding','mutation')),
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS mutation_creation_key uuid,
  ADD COLUMN IF NOT EXISTS mutation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS mutation_replace_assignment_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mutation_result_assignment_id uuid REFERENCES public.access_assignments(id);
CREATE UNIQUE INDEX IF NOT EXISTS hr_mutation_creation_retry ON public.hr_employee_requests(created_by,mutation_creation_key)
  WHERE mutation_creation_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hr_mutation_pending_target ON public.hr_employee_requests(target_user_id)
  WHERE request_kind='mutation' AND status IN ('draft','submitted','hr_validated','account_created');
--> statement-breakpoint
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
    SELECT public.legacy_hr_publication_role(position::text,poles) INTO chosen FROM public.profiles WHERE id=actor;
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
CREATE OR REPLACE FUNCTION public.get_hr_onboarding_permissions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
SELECT jsonb_build_object('read',public.can_hr_employee_mutation_action('read'),'create',public.can_hr_employee_mutation_action('create'),
  'validate',public.can_hr_employee_mutation_action('validate'),'apply',public.can_hr_employee_mutation_action('apply'));
$$;
--> statement-breakpoint
-- This is service-only and queries Auth directly, including unconfirmed accounts and all pages.
CREATE OR REPLACE FUNCTION public.hr_account_email_exists(p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE lower(email)=lower(btrim(p_email)));
$$;
REVOKE ALL ON FUNCTION public.hr_account_email_exists(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hr_account_email_exists(text) TO service_role;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.hr_employee_mutation_state(p_user uuid,p_role_key text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
SELECT jsonb_build_object(
  'profile',(SELECT jsonb_build_object('id',id,'email',email,'first_name',first_name,'last_name',last_name,
    'position',position,'position_key',position_key,'poles',poles,'seniority',seniority,'collaborator_type',collaborator_type,
    'hr_status',hr_status,'manager_id',manager_id,'work_mode',work_mode,'subsidiary',subsidiary,'test_account',test_account)
    FROM public.profiles WHERE id=p_user),
  'assignments',coalesce((SELECT jsonb_agg(jsonb_build_object('id',aa.id,'role_id',aa.role_id,'role_key',ar.role_key,
    'label',ar.label,'scope_id',aa.scope_id,'scope_value',aa.scope_value,'status',aa.status,'starts_at',aa.starts_at,
    'ends_at',aa.ends_at,'updated_at',aa.updated_at) ORDER BY aa.id)
    FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id WHERE aa.employee_id=p_user AND aa.status='active'),'[]'::jsonb),
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
      OR target.hr_status NOT IN ('active','onboarding','leave') OR public.has_role(p_target,'admin')
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
        OR jsonb_typeof(item->'document_url') NOT IN ('string','null') OR (item->>'document_url' IS NOT NULL
          AND (char_length(item->>'document_url')>2048 OR item->>'document_url' !~ '^https://[^/@[:space:]]+(/|$)')) THEN
      RAISE EXCEPTION 'invalid_hr_mutation_documents' USING ERRCODE='22023'; END IF;
  END LOOP;
  RETURN p_payload;
END;
$$;

--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.hr_mutation_legacy_position(p_key text)
RETURNS text LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
SELECT CASE WHEN t.typtype='e' THEN (SELECT enumlabel FROM pg_enum WHERE enumtypid=t.oid AND enumlabel=p_key) ELSE p_key END
FROM pg_attribute a JOIN pg_type t ON t.oid=a.atttypid
WHERE a.attrelid='public.profiles'::regclass AND a.attname='position';
$$;
CREATE OR REPLACE FUNCTION public.list_hr_mutation_targets(p_search text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb:='[]'; p public.profiles%ROWTYPE; state jsonb; source public.hr_employee_requests%ROWTYPE;
BEGIN
  IF NOT public.can_hr_employee_mutation_action('read') THEN RAISE EXCEPTION 'hr_mutation_forbidden' USING ERRCODE='42501'; END IF;
  FOR p IN SELECT * FROM public.profiles candidate WHERE id<>auth.uid() AND NOT coalesce(test_account,false)
      AND hr_status IN ('active','onboarding','leave') AND public.is_intranet_staff(id) AND NOT public.has_role(id,'admin')
      AND (NOT public.is_leadership(id) OR public.has_role(auth.uid(),'admin'))
      AND (p_search='' OR concat_ws(' ',first_name,last_name,email) ILIKE '%'||left(p_search,100)||'%')
    ORDER BY last_name,first_name,id LIMIT 200 LOOP
    state:=public.hr_employee_mutation_state(p.id,NULL);
    SELECT * INTO source FROM public.hr_employee_requests WHERE id=(state->>'source_request_id')::uuid;
    result:=result||jsonb_build_array(jsonb_build_object('id',p.id,'first_name',p.first_name,'last_name',p.last_name,'email',p.email,
      'position',p.position,'position_key',coalesce(p.position_key,p.position::text),'poles',p.poles,'seniority',p.seniority,
      'collaborator_type',p.collaborator_type,'manager_id',p.manager_id,'work_mode',p.work_mode,'subsidiary',p.subsidiary,'hr_status',p.hr_status,
      'requested_role',CASE WHEN jsonb_array_length(state->'assignments')=1 THEN state->'assignments'->0->>'role_key' ELSE NULL END,
      'contract_type',source.contract_type,'start_date',current_date::text,
      'attached_documents',coalesce((SELECT jsonb_agg(jsonb_build_object('name',d->>'name','document_type',d->>'document_type','document_url',d->>'document_url'))
        FROM jsonb_array_elements(state->'documents') d),'[]'::jsonb),
      'assignments',state->'assignments','technical_roles',state->'technical_roles','revision',md5(state::text)));
  END LOOP;
  RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.submit_hr_employee_mutation(
  p_target_user_id uuid,p_creation_key uuid,p_expected_target_revision text,p_replace_assignment_ids uuid[],p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); existing public.hr_employee_requests%ROWTYPE; target public.profiles%ROWTYPE;
  state jsonb; snapshot jsonb; values_row public.hr_employee_requests%ROWTYPE; result_row public.hr_employee_requests%ROWTYPE;
BEGIN
  IF NOT public.can_hr_employee_mutation_action('read') OR NOT public.can_hr_employee_mutation_action('create') THEN
    RAISE EXCEPTION 'hr_mutation_forbidden' USING ERRCODE='42501'; END IF;
  IF p_creation_key IS NULL OR p_expected_target_revision IS NULL THEN RAISE EXCEPTION 'invalid_hr_mutation_payload' USING ERRCODE='22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||p_creation_key::text,0));
  SELECT * INTO existing FROM public.hr_employee_requests WHERE created_by=actor AND mutation_creation_key=p_creation_key FOR UPDATE;
  IF FOUND THEN
    IF existing.target_user_id<>p_target_user_id OR existing.mutation_snapshot->'submitted_payload' IS DISTINCT FROM p_payload
        OR existing.mutation_replace_assignment_ids IS DISTINCT FROM p_replace_assignment_ids THEN
      RAISE EXCEPTION 'hr_mutation_creation_conflict' USING ERRCODE='40001';
    END IF;
    RETURN to_jsonb(existing);
  END IF;
  SELECT * INTO target FROM public.profiles WHERE id=p_target_user_id FOR UPDATE;
  PERFORM public.validate_hr_employee_mutation(p_target_user_id,p_payload,p_replace_assignment_ids);
  IF EXISTS(SELECT 1 FROM public.hr_employee_requests WHERE request_kind='mutation' AND target_user_id=p_target_user_id
      AND status IN ('draft','submitted','hr_validated','account_created')) THEN
    RAISE EXCEPTION 'hr_mutation_already_pending' USING ERRCODE='40001'; END IF;
  IF md5(public.hr_employee_mutation_state(p_target_user_id,NULL)::text)<>p_expected_target_revision THEN
    RAISE EXCEPTION 'hr_mutation_target_changed' USING ERRCODE='40001'; END IF;
  state:=public.hr_employee_mutation_state(p_target_user_id,p_payload->>'requested_role');
  snapshot:=jsonb_build_object('state',state,'submitted_payload',p_payload,'assignments',state->'assignments','technical_roles',state->'technical_roles');
  values_row:=jsonb_populate_record(NULL::public.hr_employee_requests,p_payload||jsonb_build_object(
    'position_key',p_payload->>'position','position',public.hr_mutation_legacy_position(p_payload->>'position')));
  INSERT INTO public.hr_employee_requests(first_name,last_name,personal_email,work_email,collaborator_type,position,position_key,
    primary_pole,poles,seniority,requested_role,contract_type,start_date,manager_id,work_mode,subsidiary,notes,attached_documents,
    status,created_by,request_kind,target_user_id,mutation_creation_key,mutation_snapshot,mutation_replace_assignment_ids)
  VALUES(target.first_name,target.last_name,NULL,target.email,target.collaborator_type,values_row.position,values_row.position_key,
    values_row.primary_pole,values_row.poles,values_row.seniority,values_row.requested_role,values_row.contract_type,values_row.start_date,
    values_row.manager_id,values_row.work_mode,values_row.subsidiary,values_row.notes,values_row.attached_documents,
    'submitted',actor,'mutation',target.id,p_creation_key,snapshot,p_replace_assignment_ids)
  RETURNING * INTO result_row;
  INSERT INTO public.hr_employee_request_events(request_id,actor_id,actor_name,action,to_status,note)
  SELECT result_row.id,actor,btrim(concat_ws(' ',first_name,last_name)),'Mutation collaborateur soumise','submitted',
    'Affectations à remplacer : '||cardinality(p_replace_assignment_ids)::text FROM public.profiles WHERE id=actor;
  RETURN to_jsonb(result_row);
END;
$$;
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
  PERFORM public.validate_hr_employee_mutation(request.target_user_id,request.mutation_snapshot->'submitted_payload',request.mutation_replace_assignment_ids);
  IF public.hr_employee_mutation_state(request.target_user_id,request.requested_role) IS DISTINCT FROM request.mutation_snapshot->'state' THEN
    RAISE EXCEPTION 'hr_mutation_target_changed' USING ERRCODE='40001'; END IF;
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
CREATE OR REPLACE FUNCTION public.apply_hr_employee_mutation(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE request public.hr_employee_requests%ROWTYPE; actor uuid:=auth.uid(); target public.profiles%ROWTYPE;
  role_row public.access_roles%ROWTYPE; scope_row public.access_role_scopes%ROWTYPE; stamp timestamptz:=clock_timestamp();
  new_assignment uuid; preserved uuid[]; doc jsonb; applied_profile public.profiles%ROWTYPE;
BEGIN
  IF NOT public.can_hr_employee_mutation_action('read') OR NOT public.can_hr_employee_mutation_action('apply') THEN
    RAISE EXCEPTION 'hr_mutation_forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO request FROM public.hr_employee_requests WHERE id=p_request_id AND request_kind='mutation' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'hr_mutation_not_found' USING ERRCODE='P0002'; END IF;
  IF request.target_user_id=actor THEN RAISE EXCEPTION 'hr_mutation_target_forbidden' USING ERRCODE='42501'; END IF;
  IF request.status='completed' AND request.created_user_id=request.target_user_id AND request.mutation_result_assignment_id IS NOT NULL THEN
    RETURN jsonb_build_object('requestId',request.id,'userId',request.target_user_id,'invitationSent',false,'accessAssignmentId',request.mutation_result_assignment_id);
  END IF;
  IF request.status<>'hr_validated' OR request.hr_validated_by IS NULL THEN RAISE EXCEPTION 'hr_mutation_not_validated' USING ERRCODE='40001'; END IF;
  IF request.start_date>current_date THEN RAISE EXCEPTION 'hr_mutation_not_effective_yet' USING ERRCODE='22023'; END IF;
  SELECT * INTO target FROM public.profiles WHERE id=request.target_user_id FOR UPDATE;
  PERFORM 1 FROM public.access_assignments WHERE employee_id=target.id FOR UPDATE;
  SELECT * INTO role_row FROM public.access_roles WHERE role_key=request.requested_role FOR UPDATE;
  PERFORM 1 FROM public.access_permissions WHERE role_id=role_row.id FOR UPDATE;
  PERFORM 1 FROM public.access_role_scopes WHERE role_id=role_row.id FOR UPDATE;
  LOCK TABLE public.rh_employee_documents IN SHARE ROW EXCLUSIVE MODE;
  PERFORM public.validate_hr_employee_mutation(target.id,request.mutation_snapshot->'submitted_payload',request.mutation_replace_assignment_ids);
  IF public.hr_employee_mutation_state(target.id,request.requested_role) IS DISTINCT FROM request.mutation_snapshot->'state' THEN
    RAISE EXCEPTION 'hr_mutation_target_changed' USING ERRCODE='40001'; END IF;
  SELECT * INTO scope_row FROM public.access_role_scopes WHERE role_id=role_row.id LIMIT 1;
  SELECT id INTO new_assignment FROM public.access_assignments WHERE employee_id=target.id AND status='active'
    AND NOT (id=ANY(request.mutation_replace_assignment_ids)) AND role_id=role_row.id
    AND scope_id IS NOT DISTINCT FROM scope_row.scope_id AND scope_value IS NOT DISTINCT FROM scope_row.scope_value;
  IF (SELECT count(*) FROM public.access_assignments WHERE employee_id=target.id AND status='active'
      AND NOT (id=ANY(request.mutation_replace_assignment_ids)) AND role_id=role_row.id)>(CASE WHEN new_assignment IS NULL THEN 0 ELSE 1 END) THEN
    RAISE EXCEPTION 'hr_mutation_role_scope_ambiguous' USING ERRCODE='40001'; END IF;
  SELECT coalesce(array_agg(id ORDER BY id),'{}') INTO preserved FROM public.access_assignments
    WHERE employee_id=target.id AND status='active' AND NOT (id=ANY(request.mutation_replace_assignment_ids));
  UPDATE public.access_assignments SET status='revoked',ends_at=stamp,updated_at=stamp
    WHERE employee_id=target.id AND id=ANY(request.mutation_replace_assignment_ids) AND status='active';
  IF new_assignment IS NULL THEN
    INSERT INTO public.access_assignments(employee_id,role_id,scope_id,scope_value,status,starts_at,assigned_by)
    VALUES(target.id,role_row.id,scope_row.scope_id,scope_row.scope_value,'active',stamp,actor) RETURNING id INTO new_assignment;
  END IF;
  applied_profile:=jsonb_populate_record(NULL::public.profiles,jsonb_build_object('position',request.position,'position_key',request.position_key,
    'poles',request.poles,'seniority',request.seniority,'manager_id',request.manager_id,'work_mode',request.work_mode,'subsidiary',request.subsidiary));
  UPDATE public.profiles SET position=applied_profile.position,position_key=applied_profile.position_key,poles=applied_profile.poles,
    seniority=applied_profile.seniority,manager_id=applied_profile.manager_id,work_mode=applied_profile.work_mode,
    subsidiary=applied_profile.subsidiary WHERE id=target.id;
  UPDATE public.rh_employee_documents d SET status='archived',updated_at=stamp
    WHERE employee_id=target.id AND source='onboarding' AND status IN ('active','valid') AND NOT EXISTS(
      SELECT 1 FROM jsonb_array_elements(request.attached_documents) item WHERE item->>'name'=d.name
        AND item->>'document_type'=d.document_type AND item->>'document_url' IS NOT DISTINCT FROM d.document_url);
  FOR doc IN SELECT value FROM jsonb_array_elements(request.attached_documents) LOOP
    IF NOT EXISTS(SELECT 1 FROM public.rh_employee_documents WHERE employee_id=target.id AND source='onboarding'
        AND status IN ('active','valid') AND name=doc->>'name' AND document_type=doc->>'document_type'
        AND document_url IS NOT DISTINCT FROM doc->>'document_url') THEN
      INSERT INTO public.rh_employee_documents(employee_id,name,document_type,document_url,source,description,document_date,status,created_by)
      VALUES(target.id,doc->>'name',doc->>'document_type',doc->>'document_url','onboarding',
        'Document rattaché à la mutation RH '||request.reference,current_date,'active',actor);
    END IF;
  END LOOP;
  UPDATE public.hr_employee_requests SET status='completed',created_user_id=target.id,account_created_by=actor,account_created_at=stamp,
    mutation_result_assignment_id=new_assignment WHERE id=request.id;
  INSERT INTO public.access_change_history(actor_id,employee_id,role_id,assignment_id,change_type,previous_value,new_value,reason)
  VALUES(actor,target.id,role_row.id,new_assignment,'employee_mutation',request.mutation_snapshot->'state'->'assignments',
    jsonb_build_object('assignment_id',new_assignment,'preserved_assignment_ids',preserved),'Mutation RH '||request.reference);
  INSERT INTO public.hr_account_audit_log(actor_id,actor_name,target_user_id,target_email,request_id,action,role_key,details)
  SELECT actor,btrim(concat_ws(' ',first_name,last_name)),target.id,target.email,request.id,'collaborator_mutated',request.requested_role,
    jsonb_build_object('replaced_assignment_ids',request.mutation_replace_assignment_ids,'preserved_assignment_ids',preserved,
      'new_assignment_id',new_assignment,'technical_roles_preserved',request.mutation_snapshot->'technical_roles')
  FROM public.profiles WHERE id=actor;
  INSERT INTO public.hr_employee_request_events(request_id,actor_id,actor_name,action,from_status,to_status,note)
  SELECT request.id,actor,btrim(concat_ws(' ',first_name,last_name)),'Mutation appliquée au compte existant','hr_validated','completed',
    'Profil, affectations sélectionnées et documents mis à jour sans invitation.' FROM public.profiles WHERE id=actor;
  RETURN jsonb_build_object('requestId',request.id,'userId',target.id,'invitationSent',false,'accessAssignmentId',new_assignment);
END;
$$;
--> statement-breakpoint
-- Keep private HR notes inside the RH workflow; ordinary staff receive only their professional fields.
CREATE OR REPLACE FUNCTION public.my_hr_professional_details()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
SELECT jsonb_build_object('position_key',coalesce(p.position_key,p.position::text),'position_label',c.label,'poles',p.poles,'seniority',p.seniority,
  'contract_type',r.contract_type,'start_date',r.start_date,'work_mode',p.work_mode,'subsidiary',p.subsidiary,'manager_id',p.manager_id,
  'manager_name',nullif(btrim(concat_ws(' ',m.first_name,m.last_name)),''),'manager_email',m.email)
FROM public.profiles p LEFT JOIN public.rh_position_catalog c ON c.position_key=coalesce(p.position_key,p.position::text)
LEFT JOIN public.profiles m ON m.id=p.manager_id
LEFT JOIN LATERAL(SELECT contract_type,start_date FROM public.hr_employee_requests WHERE created_user_id=p.id AND status='completed'
  ORDER BY created_at DESC,id DESC LIMIT 1) r ON true
WHERE p.id=auth.uid() AND public.is_intranet_staff(auth.uid());
$$;
--> statement-breakpoint
-- Existing permissive onboarding policies must not allow clients to forge a mutation.
DROP POLICY IF EXISTS "Mutation requests read boundary" ON public.hr_employee_requests;
CREATE POLICY "Mutation requests read boundary" ON public.hr_employee_requests AS RESTRICTIVE FOR SELECT TO authenticated
USING(request_kind<>'mutation' OR public.can_hr_employee_mutation_action('read'));
DROP POLICY IF EXISTS "Mutation requests insert via RPC" ON public.hr_employee_requests;
CREATE POLICY "Mutation requests insert via RPC" ON public.hr_employee_requests AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK(request_kind='onboarding' AND target_user_id IS NULL AND mutation_creation_key IS NULL
  AND mutation_snapshot='{}'::jsonb AND cardinality(mutation_replace_assignment_ids)=0 AND mutation_result_assignment_id IS NULL);
DROP POLICY IF EXISTS "Mutation requests update via RPC" ON public.hr_employee_requests;
CREATE POLICY "Mutation requests update via RPC" ON public.hr_employee_requests AS RESTRICTIVE FOR UPDATE TO authenticated
USING(request_kind='onboarding') WITH CHECK(request_kind='onboarding' AND target_user_id IS NULL AND mutation_creation_key IS NULL
  AND mutation_snapshot='{}'::jsonb AND cardinality(mutation_replace_assignment_ids)=0 AND mutation_result_assignment_id IS NULL);
DROP POLICY IF EXISTS "Mutation requests delete boundary" ON public.hr_employee_requests;
CREATE POLICY "Mutation requests delete boundary" ON public.hr_employee_requests AS RESTRICTIVE FOR DELETE TO authenticated
USING(request_kind='onboarding');
--> statement-breakpoint
-- Extend 0032 without relaxing authority guards or blocking personal name/avatar/contact edits.
CREATE OR REPLACE FUNCTION public.guard_profile_authorization_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); field text; changed boolean:=false;
BEGIN
  FOREACH field IN ARRAY ARRAY['id','position','position_key','poles','seniority','subsidiary','work_mode','hr_status','collaborator_type','manager_id','test_account'] LOOP
    IF to_jsonb(NEW)->field IS DISTINCT FROM to_jsonb(OLD)->field THEN changed:=true; EXIT; END IF;
  END LOOP;
  IF NOT changed THEN RETURN NEW; END IF;
  IF auth.role()='service_role' THEN RETURN NEW; END IF;
  IF actor IS NULL AND coalesce(auth.role(),'') NOT IN ('anon','authenticated')
      AND EXISTS(SELECT 1 FROM pg_roles WHERE rolname=session_user AND rolsuper) THEN RETURN NEW; END IF;
  IF actor IS NULL THEN RAISE EXCEPTION 'profile_authorization_fields_forbidden' USING ERRCODE='42501'; END IF;
  IF public.has_role(actor,'admin') THEN RETURN NEW; END IF;
  IF OLD.id<>actor AND (public.is_leadership(actor) OR public.can_access_rh_profiles(actor)) THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'profile_authorization_fields_forbidden' USING ERRCODE='42501';
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.hr_employee_mutation_state(uuid,text),public.validate_hr_employee_mutation(uuid,jsonb,uuid[]),
  public.hr_mutation_legacy_position(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.can_hr_employee_mutation_action(text),public.get_hr_onboarding_permissions(),public.list_hr_mutation_targets(text),
  public.submit_hr_employee_mutation(uuid,uuid,text,uuid[],jsonb),public.set_hr_employee_mutation_status(uuid,text,text),
  public.apply_hr_employee_mutation(uuid),public.my_hr_professional_details() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_hr_employee_mutation_action(text),public.get_hr_onboarding_permissions(),public.list_hr_mutation_targets(text),
  public.submit_hr_employee_mutation(uuid,uuid,text,uuid[],jsonb),public.set_hr_employee_mutation_status(uuid,text,text),
  public.apply_hr_employee_mutation(uuid),public.my_hr_professional_details() TO authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_authorization_fields() FROM PUBLIC,anon,authenticated;
