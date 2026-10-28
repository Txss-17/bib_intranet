-- Forward repair: only an effective preserved assignment may satisfy the destination role.
-- Future or expired destination assignments must be explicitly selected for replacement.
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
  -- A preserved assignment outside its validity window cannot grant the new role.
  -- Require explicit replacement instead of reporting a mutation with no effective access.
  IF EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=target.id AND status='active'
      AND NOT (id=ANY(request.mutation_replace_assignment_ids)) AND role_id=role_row.id
      AND ((starts_at IS NOT NULL AND starts_at>stamp) OR (ends_at IS NOT NULL AND ends_at<stamp))) THEN
    RAISE EXCEPTION 'hr_mutation_destination_assignment_not_effective' USING ERRCODE='40001'; END IF;
  SELECT id INTO new_assignment FROM public.access_assignments WHERE employee_id=target.id AND status='active'
    AND NOT (id=ANY(request.mutation_replace_assignment_ids)) AND role_id=role_row.id
    AND (starts_at IS NULL OR starts_at<=stamp) AND (ends_at IS NULL OR ends_at>=stamp)
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
REVOKE ALL ON FUNCTION public.apply_hr_employee_mutation(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_hr_employee_mutation(uuid) TO authenticated;
