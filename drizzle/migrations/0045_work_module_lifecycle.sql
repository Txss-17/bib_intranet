-- Workflow invariants for projects, procedures, validations and escalations.
CREATE OR REPLACE FUNCTION public.can_intranet_action_for(p_actor uuid,p_page text,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=p_actor; profile public.profiles%ROWTYPE; definition jsonb; role_keys text[]; chosen text; saved_count integer; permitted boolean; canonical_saved boolean; read_only boolean; level text;
BEGIN
 IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','update','delete','publish','validate','administer') THEN RETURN false; END IF;
 SELECT m.definition INTO definition FROM public.intranet_modules m WHERE page_id=p_page OR coalesce(m.definition->'permissionAliases','[]'::jsonb)?p_page;
 IF definition IS NULL THEN RETURN false; END IF;
 p_page:=definition->>'id';
 SELECT * INTO profile FROM public.profiles WHERE id=actor;
 IF NOT FOUND OR profile.app_origin IS DISTINCT FROM 'connect' OR profile.hr_status IS DISTINCT FROM 'active' OR NOT public.is_intranet_staff(actor) THEN RETURN false; END IF;
 IF public.has_role(actor,'admin') THEN RETURN true; END IF;
 IF EXISTS(SELECT 1 FROM public.access_interfaces WHERE (interface_key=p_page OR (coalesce(definition->'permissionAliases','[]'::jsonb)?interface_key AND NOT EXISTS(SELECT 1 FROM public.access_interfaces c WHERE c.interface_key=p_page AND c.status='active'))) AND status IS DISTINCT FROM 'active') THEN RETURN false; END IF;
 SELECT coalesce(array_agg(DISTINCT ar.role_key),'{}'::text[]),coalesce(bool_and(ar.read_only),false) INTO role_keys,read_only
 FROM public.access_assignments aa JOIN public.access_roles ar ON ar.id=aa.role_id AND ar.status='active'
 WHERE aa.employee_id=actor AND aa.status='active' AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now());
 IF cardinality(role_keys)=0 THEN
  IF EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor) THEN RETURN false; END IF;
  chosen:=public.legacy_hr_publication_role(profile.position::text,profile.poles::text[]);
  IF chosen IS NULL THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM public.access_roles WHERE role_key=chosen AND status IS DISTINCT FROM 'active') THEN RETURN false; END IF;
  role_keys:=ARRAY[chosen];
  SELECT coalesce(bool_or(ar.read_only),false) INTO read_only FROM public.access_roles ar WHERE ar.role_key=chosen;
 END IF;
 IF read_only AND p_action<>'read'THEN RETURN false;END IF;
 SELECT EXISTS(SELECT 1 FROM public.access_permissions ap JOIN public.access_roles r ON r.id=ap.role_id AND r.status='active'
 JOIN public.access_interfaces i ON i.id=ap.interface_id AND i.interface_key=p_page AND i.status='active'WHERE r.role_key=ANY(role_keys))INTO canonical_saved;
 SELECT count(*),coalesce(bool_or(ap.allowed AND a.action_key=p_action),false) INTO saved_count,permitted
 FROM public.access_permissions ap JOIN public.access_roles r ON r.id=ap.role_id AND r.status='active'
 JOIN public.access_interfaces i ON i.id=ap.interface_id AND (i.interface_key=p_page OR (NOT canonical_saved AND coalesce(definition->'permissionAliases','[]'::jsonb)?i.interface_key)) AND i.status='active'
 JOIN public.access_actions a ON a.id=ap.action_id WHERE r.role_key=ANY(role_keys);
 IF saved_count>0 THEN RETURN permitted; END IF;
 IF coalesce((definition->>'public')::boolean,false) THEN RETURN p_action IN ('read','create'); END IF;
 IF NOT coalesce((definition->>'transversal')::boolean,false) AND NOT (definition->>'scope'=ANY(profile.poles::text[])) THEN RETURN false; END IF;
 IF jsonb_array_length(definition->'restrictedRoles')>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(definition->'restrictedRoles') r WHERE r=ANY(role_keys)) THEN RETURN false; END IF;
 IF definition->>'scope'='admin' AND jsonb_array_length(definition->'restrictedRoles')=0 THEN RETURN false; END IF;
 IF p_action='read' THEN RETURN true; END IF;
 IF read_only THEN RETURN false; END IF;
 level:=coalesce(profile.seniority::text,'junior');
 RETURN CASE WHEN p_action IN ('create','update') THEN level IN ('mid','senior','lead','executive')
 WHEN p_action IN ('delete','validate') THEN level IN ('senior','lead','executive')
 WHEN p_action='publish' THEN level IN ('lead','executive') ELSE level='executive' END;
END;
$$;
REVOKE ALL ON FUNCTION public.can_intranet_action_for(uuid,text,text)FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_intranet_action_for(uuid,text,text)TO service_role;
CREATE OR REPLACE FUNCTION public.can_intranet_action(p_page text,p_action text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT public.can_intranet_action_for(auth.uid(),p_page,p_action); $$;
CREATE OR REPLACE FUNCTION public.work_module_table(p_kind text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT CASE WHEN p_kind IN ('projects','processes','validations','escalations')THEN 'work_'||p_kind END; $$;
DO $$DECLARE t text;actor_column text;BEGIN
 FOREACH t IN ARRAY ARRAY['work_projects','work_processes','work_validations','work_escalations']LOOP
 EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1,ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,ADD COLUMN IF NOT EXISTS archived_at timestamptz,ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),ADD COLUMN IF NOT EXISTS creation_key uuid,ADD COLUMN IF NOT EXISTS creation_request jsonb,ADD COLUMN IF NOT EXISTS change_note text',t);
 actor_column:=CASE t WHEN 'work_validations'THEN 'requester_id'WHEN 'work_escalations'THEN 'raised_by'ELSE 'created_by'END;
 EXECUTE format('CREATE UNIQUE INDEX %I ON public.%I(%I,creation_key)WHERE creation_key IS NOT NULL',t||'_creation_retry',t,actor_column);
 EXECUTE format('DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.%I',t);
 -- Classify existing rows before exposing the new partition; test records must not become real work.
 EXECUTE format('UPDATE public.%I r SET test_account=coalesce((SELECT coalesce(p.test_account,false)FROM public.profiles p WHERE p.id=coalesce(r.%I,r.%I)),false)',t,actor_column,CASE t WHEN 'work_validations'THEN 'validator_id'WHEN 'work_escalations'THEN 'assigned_to'ELSE 'owner_id'END);
 EXECUTE format('DROP POLICY IF EXISTS intranet_test_environment ON public.%I',t);
 EXECUTE format('CREATE POLICY intranet_test_environment ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(test_account=public.intranet_is_test_mode())WITH CHECK(test_account=public.intranet_is_test_mode())',t);
 EXECUTE format('CREATE POLICY work_no_physical_delete ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING(false)',t);
 END LOOP;
END $$;
CREATE POLICY work_projects_team_read ON public.work_projects FOR SELECT TO authenticated USING(public.can_intranet_action('work.projects','read')AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()AND work_projects.pole=ANY(p.poles::text[])));
CREATE POLICY work_processes_team_read ON public.work_processes FOR SELECT TO authenticated USING(public.can_intranet_action('work.processes','read')AND((status='active'AND archived_at IS NULL AND(pole IS NULL OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()AND work_processes.pole=ANY(p.poles::text[]))))OR(public.can_intranet_action('work.processes','publish')AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid()AND work_processes.pole=ANY(p.poles::text[])))));
ALTER TABLE public.work_escalations ADD COLUMN IF NOT EXISTS resolution_note text;
ALTER TABLE public.work_validations ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES public.profiles(id);
CREATE TABLE public.work_module_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL CHECK(kind IN ('projects','processes','validations','escalations')),record_id uuid NOT NULL,actor_id uuid REFERENCES public.profiles(id),action text NOT NULL,note text,before_state jsonb,after_state jsonb,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX work_module_events_record ON public.work_module_events(kind,record_id,created_at DESC);
ALTER TABLE public.work_module_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.work_module_events TO authenticated;
GRANT ALL ON public.work_module_events TO service_role;
CREATE OR REPLACE FUNCTION public.can_read_work_module_record(p_kind text,p_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE t text:=public.work_module_table(p_kind);found boolean;
BEGIN IF t IS NULL OR NOT public.can_intranet_action('work.'||p_kind,'read')THEN RETURN false;END IF;
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id=$1)',t)INTO found USING p_id;RETURN found;END;
$$;
CREATE POLICY work_module_events_read ON public.work_module_events FOR SELECT TO authenticated USING(public.can_read_work_module_record(kind,record_id));
CREATE OR REPLACE FUNCTION public.list_work_module_people(p_kind text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF public.work_module_table(p_kind)IS NULL OR NOT public.can_intranet_action('work.'||p_kind,'read')THEN RAISE EXCEPTION 'work_module_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'first_name',p.first_name,'last_name',p.last_name)ORDER BY p.first_name,p.last_name),'[]'::jsonb)FROM public.profiles p WHERE p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()
 AND public.can_intranet_action_for(p.id,'work.'||p_kind,'read')AND public.can_intranet_action_for(p.id,'work.'||p_kind,CASE WHEN p_kind='validations'THEN 'validate'ELSE 'update'END));
END;
$$;
CREATE OR REPLACE FUNCTION public.guard_work_module_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before jsonb;after jsonb:=to_jsonb(NEW);kind text:=replace(TG_TABLE_NAME,'work_','');page text:='work.'||kind;actor uuid:=auth.uid();creator_column text;target_column text;creator uuid;target uuid;prior text;next_status text:=after->>'status';changed_status boolean;decision boolean;manager boolean;note text:=btrim(coalesce(after->>'change_note',''));f text;step jsonb;title text;
BEGIN
 creator_column:=CASE kind WHEN 'validations'THEN 'requester_id'WHEN 'escalations'THEN 'raised_by'ELSE 'created_by'END;
 target_column:=CASE kind WHEN 'validations'THEN 'validator_id'WHEN 'escalations'THEN 'assigned_to'ELSE 'owner_id'END;
 IF TG_OP='UPDATE'THEN before:=to_jsonb(OLD);prior:=before->>'status';END IF;
 changed_status:=TG_OP='UPDATE'AND next_status IS DISTINCT FROM prior;
 decision:=kind='validations'AND changed_status AND next_status IN ('approved','rejected');
 IF auth.role()IS DISTINCT FROM 'service_role'AND actor IS NOT NULL THEN
 IF NOT public.can_intranet_action(page,'read')THEN RAISE EXCEPTION 'work_module_forbidden' USING ERRCODE='42501';END IF;
 IF TG_OP='INSERT'THEN
 IF NOT public.can_intranet_action(page,'create')THEN RAISE EXCEPTION 'work_create_forbidden' USING ERRCODE='42501';END IF;
 IF next_status<>(CASE kind WHEN 'projects'THEN 'planning'WHEN 'processes'THEN 'draft'WHEN 'validations'THEN 'pending'ELSE 'open'END)THEN RAISE EXCEPTION 'work_initial_status_required' USING ERRCODE='22023';END IF;
 IF NEW.archived_at IS NOT NULL OR nullif(after->>'decided_at','')IS NOT NULL OR nullif(after->>'decided_by','')IS NOT NULL OR nullif(after->>'decision_note','')IS NOT NULL OR nullif(after->>'resolved_at','')IS NOT NULL OR nullif(after->>'resolution_note','')IS NOT NULL THEN RAISE EXCEPTION 'work_initial_metadata_forbidden' USING ERRCODE='22023';END IF;
 after:=jsonb_set(after,ARRAY[creator_column],to_jsonb(actor));after:=jsonb_set(after,'{test_account}',to_jsonb(public.intranet_is_test_mode()));after:=jsonb_set(after,'{created_at}',to_jsonb(clock_timestamp()));after:=jsonb_set(after,'{change_note}','null');
 ELSE
 IF coalesce(OLD.test_account,false)IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'work_environment_forbidden' USING ERRCODE='42501';END IF;
 IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'work_record_changed' USING ERRCODE='40001';END IF;
 FOREACH f IN ARRAY ARRAY[creator_column,'test_account','creation_key','creation_request','created_at']LOOP IF after->f IS DISTINCT FROM before->f THEN RAISE EXCEPTION 'work_identity_immutable' USING ERRCODE='42501';END IF;END LOOP;
 IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
 IF NOT public.can_intranet_action(page,'delete')THEN RAISE EXCEPTION 'work_archive_forbidden' USING ERRCODE='42501';END IF;
 IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'work_archive_immutable' USING ERRCODE='55000';END IF;
 IF(after-ARRAY['archived_at','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['archived_at','revision','updated_at'])THEN RAISE EXCEPTION 'work_archive_content_changed' USING ERRCODE='22023';END IF;
 after:=jsonb_set(after,'{archived_at}',to_jsonb(clock_timestamp()));
 ELSE
 IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'work_record_archived' USING ERRCODE='55000';END IF;
 IF NOT public.can_intranet_action(page,CASE WHEN decision THEN 'validate'WHEN kind='processes'AND changed_status THEN 'publish'ELSE 'update'END)THEN RAISE EXCEPTION 'work_update_forbidden' USING ERRCODE='42501';END IF;
 END IF;END IF;
 creator:=nullif(after->>creator_column,'')::uuid;target:=nullif(after->>target_column,'')::uuid;
 manager:=public.has_role(actor,'admin')OR(public.can_intranet_action(page,CASE WHEN kind='processes'AND changed_status THEN 'publish'ELSE 'validate'END)AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND after->>'pole'=ANY(p.poles::text[])));
 IF TG_OP='UPDATE'AND actor IS DISTINCT FROM creator AND actor IS DISTINCT FROM nullif(before->>target_column,'')::uuid AND NOT manager THEN RAISE EXCEPTION 'work_owner_forbidden' USING ERRCODE='42501';END IF;
 IF TG_OP='INSERT'OR after->'pole'IS DISTINCT FROM before->'pole'THEN
 IF after->>'pole'IS NOT NULL AND NOT public.has_role(actor,'admin')AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=actor AND after->>'pole'=ANY(p.poles::text[]))THEN RAISE EXCEPTION 'work_pole_forbidden' USING ERRCODE='42501';END IF;END IF;
 IF target IS NOT NULL AND(TG_OP='INSERT'OR after->target_column IS DISTINCT FROM before->target_column)THEN
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=target AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=(after->>'test_account')::boolean AND public.can_intranet_action_for(p.id,page,'read')AND public.can_intranet_action_for(p.id,page,CASE WHEN kind='validations'THEN 'validate'ELSE 'update'END))THEN RAISE EXCEPTION 'work_target_forbidden' USING ERRCODE='42501';END IF;END IF;
 IF kind='validations'AND(TG_OP='INSERT'OR after->target_column IS DISTINCT FROM before->target_column)AND(target IS NULL OR target=creator)THEN RAISE EXCEPTION 'work_distinct_validator_required' USING ERRCODE='42501';END IF;
 END IF;
 title:=btrim(coalesce(after->>'name',after->>'title',''));
 IF length(title)NOT BETWEEN 1 AND 255 OR length(coalesce(after->>'description',''))>20000 OR length(note)>5000 OR length(coalesce(after->>'decision_note',''))>5000 OR length(coalesce(after->>'resolution_note',''))>5000 THEN RAISE EXCEPTION 'invalid_work_record' USING ERRCODE='22023';END IF;
 IF after?'name'THEN after:=jsonb_set(after,'{name}',to_jsonb(title));ELSE after:=jsonb_set(after,'{title}',to_jsonb(title));END IF;
 IF after->>'pole'IS NOT NULL AND NOT(after->>'pole'=ANY(ARRAY['direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security']))THEN RAISE EXCEPTION 'invalid_work_pole' USING ERRCODE='22023';END IF;
 IF kind='processes'THEN
 IF jsonb_typeof(after->'steps')IS DISTINCT FROM 'array'OR jsonb_array_length(after->'steps')>100 THEN RAISE EXCEPTION 'invalid_process_steps' USING ERRCODE='22023';END IF;
 FOR step IN SELECT value FROM jsonb_array_elements(after->'steps')LOOP IF jsonb_typeof(step)<>'object'OR jsonb_typeof(step->'label')IS DISTINCT FROM 'string'OR length(btrim(coalesce(step->>'label','')))NOT BETWEEN 1 AND 500 OR(step-'label')<>'{}'::jsonb THEN RAISE EXCEPTION 'invalid_process_step' USING ERRCODE='22023';END IF;END LOOP;
 IF next_status='active'AND jsonb_array_length(after->'steps')=0 THEN RAISE EXCEPTION 'process_steps_required' USING ERRCODE='22023';END IF;
 END IF;
 IF TG_OP='UPDATE'AND NEW.archived_at IS NOT DISTINCT FROM OLD.archived_at THEN
 IF kind='validations'THEN
 IF prior<>'pending'AND(after-ARRAY['revision','updated_at'])IS DISTINCT FROM(before-ARRAY['revision','updated_at'])THEN RAISE EXCEPTION 'work_decision_locked' USING ERRCODE='55000';END IF;
 IF decision THEN
 IF actor=creator OR actor IS DISTINCT FROM nullif(before->>'validator_id','')::uuid THEN RAISE EXCEPTION 'work_validator_forbidden' USING ERRCODE='42501';END IF;
 IF next_status='rejected'AND length(btrim(coalesce(after->>'decision_note','')))=0 THEN RAISE EXCEPTION 'work_decision_reason_required' USING ERRCODE='22023';END IF;
 IF(after-ARRAY['status','decided_at','decided_by','decision_note','revision','updated_at','change_note'])IS DISTINCT FROM(before-ARRAY['status','decided_at','decided_by','decision_note','revision','updated_at','change_note'])THEN RAISE EXCEPTION 'work_decision_content_changed' USING ERRCODE='22023';END IF;
 after:=jsonb_set(after,'{decided_at}',to_jsonb(clock_timestamp()));after:=jsonb_set(after,'{decided_by}',to_jsonb(actor));
 ELSE
 IF(after-ARRAY['validator_id','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['validator_id','revision','updated_at'])THEN RAISE EXCEPTION 'work_validation_content_locked' USING ERRCODE='55000';END IF;
 IF after->'decided_at'IS DISTINCT FROM before->'decided_at'OR after->'decided_by'IS DISTINCT FROM before->'decided_by'OR after->'decision_note'IS DISTINCT FROM before->'decision_note'THEN RAISE EXCEPTION 'work_decision_metadata_immutable' USING ERRCODE='42501';END IF;END IF;
 ELSIF kind='projects'THEN
 IF prior IN ('completed','cancelled')THEN IF NOT changed_status OR next_status<>'planning'OR note=''OR NOT public.can_intranet_action(page,'validate')THEN RAISE EXCEPTION 'work_project_locked' USING ERRCODE='55000';END IF;END IF;
 IF changed_status AND next_status='cancelled'AND note=''THEN RAISE EXCEPTION 'work_cancellation_reason_required' USING ERRCODE='22023';END IF;
 IF changed_status AND NOT((prior='planning'AND next_status IN ('active','on_hold','cancelled'))OR(prior='active'AND next_status IN ('on_hold','completed','cancelled'))OR(prior='on_hold'AND next_status IN ('active','cancelled'))OR(prior IN ('completed','cancelled')AND next_status='planning'))THEN RAISE EXCEPTION 'invalid_project_transition' USING ERRCODE='22023';END IF;
 ELSIF kind='processes'THEN
 IF prior IN ('active','deprecated')AND(after-ARRAY['status','revision','updated_at','change_note'])IS DISTINCT FROM(before-ARRAY['status','revision','updated_at','change_note'])THEN RAISE EXCEPTION 'work_process_locked' USING ERRCODE='55000';END IF;
 IF changed_status AND NOT((prior='draft'AND next_status='active')OR(prior='active'AND next_status IN ('draft','deprecated'))OR(prior='deprecated'AND next_status='draft'))THEN RAISE EXCEPTION 'invalid_process_transition' USING ERRCODE='22023';END IF;
 IF changed_status AND prior<>'draft'AND note=''THEN RAISE EXCEPTION 'work_process_reason_required' USING ERRCODE='22023';END IF;
 ELSIF kind='escalations'THEN
 IF prior='resolved'AND(NOT changed_status OR next_status<>'open'OR note='')THEN RAISE EXCEPTION 'work_resolution_locked' USING ERRCODE='55000';END IF;
 IF changed_status THEN
 IF NOT((prior='open'AND next_status='acknowledged')OR(prior='acknowledged'AND next_status='resolved')OR(prior='resolved'AND next_status='open'))THEN RAISE EXCEPTION 'invalid_escalation_transition' USING ERRCODE='22023';END IF;
 IF next_status IN ('acknowledged','resolved')AND target IS DISTINCT FROM actor AND NOT manager THEN
 IF next_status='acknowledged'AND target IS NULL THEN after:=jsonb_set(after,'{assigned_to}',to_jsonb(actor));ELSE RAISE EXCEPTION 'escalation_assignee_required' USING ERRCODE='42501';END IF;END IF;
 IF next_status='resolved'THEN IF length(btrim(coalesce(after->>'resolution_note','')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'resolution_note_required' USING ERRCODE='22023';END IF;after:=jsonb_set(after,'{resolved_at}',to_jsonb(clock_timestamp()));
 ELSE after:=jsonb_set(after,'{resolved_at}','null');IF prior='resolved'THEN after:=jsonb_set(after,'{resolution_note}','null');END IF;END IF;
 ELSIF after->'resolved_at'IS DISTINCT FROM before->'resolved_at'THEN RAISE EXCEPTION 'resolution_metadata_immutable' USING ERRCODE='42501';END IF;
 END IF;
 END IF;
 IF TG_OP='INSERT'THEN after:=jsonb_set(after,'{revision}','1');END IF;
 after:=jsonb_set(after,'{updated_at}',to_jsonb(clock_timestamp()));NEW:=jsonb_populate_record(NEW,after);RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION public.log_work_module_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before jsonb;after jsonb:=to_jsonb(NEW);kind text:=replace(TG_TABLE_NAME,'work_','');target uuid;creator uuid;action text;note text;
BEGIN
 IF TG_OP='UPDATE'THEN before:=to_jsonb(OLD);END IF;
 action:=CASE WHEN TG_OP='INSERT'THEN 'created'WHEN after->'archived_at'IS DISTINCT FROM before->'archived_at'THEN 'archived'WHEN after->>'status'IS DISTINCT FROM before->>'status'THEN 'status'ELSE 'updated'END;
 note:=CASE WHEN action='status'THEN coalesce(after->>'change_note',after->>'decision_note',after->>'resolution_note')END;
 INSERT INTO public.work_module_events(kind,record_id,actor_id,action,note,before_state,after_state)VALUES(kind,NEW.id,auth.uid(),action,nullif(note,''),before,after);
 target:=nullif(after->>CASE kind WHEN 'validations'THEN 'validator_id'WHEN 'escalations'THEN 'assigned_to'ELSE 'owner_id'END,'')::uuid;
 creator:=nullif(after->>CASE kind WHEN 'validations'THEN 'requester_id'WHEN 'escalations'THEN 'raised_by'ELSE 'created_by'END,'')::uuid;
 IF target IS NOT NULL AND target IS DISTINCT FROM auth.uid()AND(TG_OP='INSERT'OR target IS DISTINCT FROM nullif(before->>CASE kind WHEN 'validations'THEN 'validator_id'WHEN 'escalations'THEN 'assigned_to'ELSE 'owner_id'END,'')::uuid)THEN
 INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(target,CASE WHEN kind='validations'THEN 'Validation demandée'ELSE 'Nouvelle responsabilité attribuée'END,coalesce(after->>'name',after->>'title'),'info','/work/'||kind||'?record='||NEW.id::text,jsonb_build_object('source','work_module','kind',kind,'record_id',NEW.id));END IF;
 IF action='status'AND creator IS NOT NULL AND creator IS DISTINCT FROM auth.uid()THEN INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(creator,'Suivi Travail mis à jour',coalesce(after->>'name',after->>'title'),'info','/work/'||kind||'?record='||NEW.id::text,jsonb_build_object('source','work_module','kind',kind,'record_id',NEW.id));END IF;
 RETURN NEW;
END;
$$;
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['work_projects','work_processes','work_validations','work_escalations']LOOP
 EXECUTE format('CREATE TRIGGER zz_work_module_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_work_module_write()',t);
 EXECUTE format('CREATE TRIGGER work_module_history AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_work_module_change()',t);
END LOOP;END $$;
CREATE OR REPLACE FUNCTION public.create_work_module_record(p_kind text,p_key uuid,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE t text:=public.work_module_table(p_kind);actor_column text;allowed text[];request jsonb;existing jsonb;result jsonb;columns text;values_sql text;
BEGIN
 IF t IS NULL OR NOT public.can_intranet_action('work.'||p_kind,'read')OR NOT public.can_intranet_action('work.'||p_kind,'create')THEN RAISE EXCEPTION 'work_create_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'OR octet_length(p_payload::text)>100000 THEN RAISE EXCEPTION 'invalid_work_payload' USING ERRCODE='22023';END IF;
 allowed:=CASE p_kind WHEN 'projects'THEN ARRAY['name','description','pole','owner_id','due_date']WHEN 'processes'THEN ARRAY['name','description','pole','owner_id','steps']WHEN 'validations'THEN ARRAY['title','description','pole','validator_id']ELSE ARRAY['title','description','pole','severity','assigned_to']END;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload)k WHERE NOT k=ANY(allowed))THEN RAISE EXCEPTION 'unknown_work_field' USING ERRCODE='22023';END IF;
 actor_column:=CASE p_kind WHEN 'validations'THEN 'requester_id'WHEN 'escalations'THEN 'raised_by'ELSE 'created_by'END;
 PERFORM pg_advisory_xact_lock(hashtextextended(t||auth.uid()::text||p_key::text,0));
 EXECUTE format('SELECT to_jsonb(r)FROM public.%I r WHERE %I=$1 AND creation_key=$2',t,actor_column)INTO existing USING auth.uid(),p_key;
 IF existing IS NOT NULL THEN IF existing->'creation_request'IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'work_creation_key_conflict' USING ERRCODE='40001';END IF;RETURN existing;END IF;
 request:=p_payload||jsonb_build_object(actor_column,auth.uid(),'creation_key',p_key,'creation_request',p_payload);
 SELECT string_agg(quote_ident(k),','ORDER BY k),string_agg('r.'||quote_ident(k),','ORDER BY k)INTO columns,values_sql FROM jsonb_object_keys(request)k;
 EXECUTE format('INSERT INTO public.%1$I(%2$s)SELECT %3$s FROM jsonb_populate_record(NULL::public.%1$I,$1)r RETURNING to_jsonb(%1$I.*)',t,columns,values_sql)INTO result USING request;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.transition_work_module_record(p_kind text,p_id uuid,p_revision bigint,p_status text,p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE t text:=public.work_module_table(p_kind);r jsonb;result jsonb;patch jsonb;
BEGIN
 IF t IS NULL OR NOT public.can_intranet_action('work.'||p_kind,'read')THEN RAISE EXCEPTION 'work_record_forbidden' USING ERRCODE='42501';END IF;
 EXECUTE format('SELECT to_jsonb(r)FROM public.%I r WHERE id=$1 FOR UPDATE',t)INTO r USING p_id;
 IF r IS NULL OR(r->>'test_account')::boolean IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'work_record_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR(r->>'revision')::bigint<>p_revision THEN RAISE EXCEPTION 'work_record_changed' USING ERRCODE='40001';END IF;
 IF length(coalesce(p_note,''))>5000 THEN RAISE EXCEPTION 'work_note_too_long' USING ERRCODE='22023';END IF;
 IF p_status='archived'THEN EXECUTE format('UPDATE public.%I SET archived_at=clock_timestamp(),revision=revision+1 WHERE id=$1 RETURNING to_jsonb(%I.*)',t,t)INTO result USING p_id;
 ELSE
 patch:=jsonb_build_object('status',p_status,'revision',p_revision+1,'change_note',nullif(btrim(p_note),''));
 IF p_kind='validations'THEN patch:=patch||jsonb_build_object('decision_note',nullif(btrim(p_note),''));ELSIF p_kind='escalations'AND p_status='resolved'THEN patch:=patch||jsonb_build_object('resolution_note',nullif(btrim(p_note),''));END IF;
 EXECUTE format('UPDATE public.%1$I AS target SET %2$s FROM jsonb_populate_record(NULL::public.%1$I,$1)r WHERE target.id=$2 RETURNING to_jsonb(target.*)',t,(SELECT string_agg(format('%I=r.%I',k,k),','ORDER BY k)FROM jsonb_object_keys(patch)k))INTO result USING patch,p_id;
 END IF;
 RETURN result;
END;
$$;
CREATE OR REPLACE FUNCTION public.list_work_module_events(p_kind text,p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_read_work_module_record(p_kind,p_id)THEN RAISE EXCEPTION 'work_record_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(to_jsonb(e)ORDER BY e.created_at DESC),'[]'::jsonb)FROM(SELECT e.*,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name,trim(concat_ws(' ',bp.first_name,bp.last_name))AS before_responsible,trim(concat_ws(' ',ap.first_name,ap.last_name))AS after_responsible FROM public.work_module_events e LEFT JOIN public.profiles p ON p.id=e.actor_id LEFT JOIN public.profiles bp ON bp.id::text=coalesce(e.before_state->>'owner_id',e.before_state->>'validator_id',e.before_state->>'assigned_to')LEFT JOIN public.profiles ap ON ap.id::text=coalesce(e.after_state->>'owner_id',e.after_state->>'validator_id',e.after_state->>'assigned_to')WHERE e.kind=p_kind AND e.record_id=p_id ORDER BY e.created_at DESC LIMIT 100)e);
END;
$$;
CREATE OR REPLACE FUNCTION public.list_work_activity(p_kind text DEFAULT 'all',p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;more boolean;
BEGIN
 IF NOT public.can_intranet_action('work.activities','read')THEN RAISE EXCEPTION 'work_activity_forbidden' USING ERRCODE='42501';END IF;
 IF p_kind IS NULL OR p_kind NOT IN ('all','tasks','projects','processes','validations','escalations')OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_work_activity_filter' USING ERRCODE='22023';END IF;
 WITH events AS(
 SELECT e.id,e.kind,e.record_id,e.actor_id,e.action,e.created_at,coalesce(e.after_state->>'name',e.after_state->>'title',e.before_state->>'name',e.before_state->>'title')AS title,e.before_state->>'status'AS before_status,e.after_state->>'status'AS after_status,e.note,'/work/'||e.kind||'?record='||e.record_id::text AS url FROM public.work_module_events e
 UNION ALL SELECT h.id,'tasks',h.task_id,h.actor_id,h.action,h.created_at,coalesce(h.after_state->>'title',h.before_state->>'title'),h.before_state->>'status',h.after_state->>'status',NULL,'/work/tasks?task='||h.task_id::text FROM public.work_task_history h
 UNION ALL SELECT c.id,'tasks',c.task_id,c.author_id,'commented',c.created_at,t.title,NULL,NULL,left(c.body,300),'/work/tasks?task='||c.task_id::text FROM public.work_task_comments c JOIN public.work_tasks t ON t.id=c.task_id
 ),filtered AS(SELECT e.*,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM events e LEFT JOIN public.profiles p ON p.id=e.actor_id WHERE(p_kind='all'OR e.kind=p_kind)AND(e.title ILIKE '%'||left(coalesce(p_search,''),200)||'%'OR e.note ILIKE '%'||left(coalesce(p_search,''),200)||'%')),
 selected AS(SELECT *FROM filtered ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET p_offset)
 SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb),(SELECT count(*)>50 FROM selected)INTO result,more FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x;
 RETURN jsonb_build_object('rows',result,'has_more',coalesce(more,false));
END;
$$;
REVOKE ALL ON FUNCTION public.work_module_table(text),public.can_read_work_module_record(text,uuid),public.list_work_module_people(text),public.create_work_module_record(text,uuid,jsonb),public.transition_work_module_record(text,uuid,bigint,text,text),public.list_work_module_events(text,uuid),public.list_work_activity(text,text,integer)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.work_module_table(text),public.can_read_work_module_record(text,uuid),public.list_work_module_people(text),public.create_work_module_record(text,uuid,jsonb),public.transition_work_module_record(text,uuid,bigint,text,text),public.list_work_module_events(text,uuid),public.list_work_activity(text,text,integer)TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.guard_work_module_write(),public.log_work_module_change()FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';

DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['work_projects','work_processes','work_validations','work_escalations']LOOP
 EXECUTE format('INSERT INTO public.work_module_events(kind,record_id,actor_id,action,note,after_state)SELECT %L,id,NULL,''imported'',''État existant repris dans le journal.'',to_jsonb(r)FROM public.%I r WHERE NOT EXISTS(SELECT 1 FROM public.work_module_events e WHERE e.kind=%L AND e.record_id=r.id)',replace(t,'work_',''),t,replace(t,'work_',''));
END LOOP;END $$;
INSERT INTO public.work_task_history(task_id,actor_id,action,before_state,after_state)SELECT t.id,NULL,'imported',NULL,to_jsonb(t)FROM public.work_tasks t WHERE NOT EXISTS(SELECT 1 FROM public.work_task_history h WHERE h.task_id=t.id);
