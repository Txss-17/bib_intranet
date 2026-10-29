-- Connect decisions require the saved validation right, independently of the update right.
-- Audit Hub retains its existing service-role integration and event/anomaly triggers.
ALTER TABLE public.field_audits
 ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS decided_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS correction_evidence text,
 ADD COLUMN IF NOT EXISTS change_note text,
 ADD COLUMN IF NOT EXISTS creation_key uuid,
 ADD COLUMN IF NOT EXISTS creation_request jsonb;
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.field_audits;
UPDATE public.field_audits a SET test_account=p.test_account FROM public.profiles p WHERE p.id=a.auditor_id AND a.test_account IS DISTINCT FROM p.test_account;
CREATE UNIQUE INDEX audit_mission_creation_retry ON public.field_audits(created_by,creation_key)WHERE creation_key IS NOT NULL;
CREATE OR REPLACE FUNCTION public.audit_mission_action_for(p_actor uuid,p_action text)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action_for(p_actor,'audit.missions',p_action)OR public.can_intranet_action_for(p_actor,'audit.field',p_action);
$$;
CREATE OR REPLACE FUNCTION public.audit_mission_action(p_action text)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$SELECT public.audit_mission_action_for(auth.uid(),p_action);$$;
DROP POLICY IF EXISTS intranet_test_environment ON public.field_audits;
CREATE POLICY intranet_test_environment ON public.field_audits AS RESTRICTIVE FOR ALL TO authenticated USING(test_account=public.intranet_is_test_mode())WITH CHECK(test_account=public.intranet_is_test_mode());
DROP POLICY IF EXISTS intranet_update_boundary ON public.field_audits;
CREATE POLICY intranet_update_boundary ON public.field_audits AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.audit_mission_action('read')AND(public.audit_mission_action('update')OR public.audit_mission_action('validate')))WITH CHECK(public.audit_mission_action('read')AND(public.audit_mission_action('update')OR public.audit_mission_action('validate')));
CREATE POLICY audit_staff_read ON public.field_audits FOR SELECT TO authenticated USING(public.audit_mission_action('read'));
CREATE POLICY audit_staff_insert ON public.field_audits FOR INSERT TO authenticated WITH CHECK(public.audit_mission_action('read')AND public.audit_mission_action('create'));
CREATE POLICY audit_staff_update ON public.field_audits FOR UPDATE TO authenticated USING(public.audit_mission_action('read')AND(public.audit_mission_action('update')OR public.audit_mission_action('validate')));
CREATE POLICY audit_preserve_history ON public.field_audits AS RESTRICTIVE FOR DELETE TO authenticated USING(false);
GRANT SELECT,INSERT,UPDATE ON public.field_audits TO authenticated;
GRANT ALL ON public.field_audits TO service_role;

CREATE OR REPLACE FUNCTION public.guard_audit_mission_write()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();before jsonb;after jsonb:=to_jsonb(NEW);field text;changed boolean;decision boolean;manager boolean;
BEGIN
 IF actor IS NULL OR auth.role()='service_role'THEN NEW.revision:=CASE WHEN TG_OP='INSERT'THEN 1 ELSE OLD.revision+1 END;RETURN NEW;END IF;
 IF NOT public.audit_mission_action('read')THEN RAISE EXCEPTION 'audit_mission_forbidden' USING ERRCODE='42501';END IF;
 manager:=public.audit_mission_action('validate');
 IF TG_OP='INSERT'THEN
  IF NOT public.audit_mission_action('create')THEN RAISE EXCEPTION 'audit_creation_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.workflow_status NOT IN('mission','planned','assigned')OR NEW.app_origin<>'connect'OR NEW.assigned_at IS NOT NULL OR NEW.field_started_at IS NOT NULL OR NEW.synced_at IS NOT NULL OR NEW.decided_at IS NOT NULL OR NEW.closed_at IS NOT NULL OR NEW.completed_date IS NOT NULL OR NEW.decided_by IS NOT NULL OR NEW.closed_by IS NOT NULL OR NEW.anomaly_id IS NOT NULL OR NEW.decision_reason IS NOT NULL OR NEW.corrective_action IS NOT NULL OR NEW.correction_evidence IS NOT NULL OR NEW.findings IS NOT NULL OR NEW.score IS NOT NULL THEN RAISE EXCEPTION 'audit_initial_state_required' USING ERRCODE='22023';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.mission_reference:='AUD-'||upper(substr(gen_random_uuid()::text,1,8));NEW.test_account:=public.intranet_is_test_mode();NEW.revision:=1;NEW.change_note:=NULL;
  IF NEW.workflow_status='assigned'THEN NEW.assigned_at:=clock_timestamp();END IF;
 ELSE
  before:=to_jsonb(OLD);changed:=NEW.workflow_status IS DISTINCT FROM OLD.workflow_status;
  decision:=changed AND NEW.workflow_status IN('compliant','non_compliant','closed');
  IF OLD.test_account IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'audit_environment_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'audit_mission_changed' USING ERRCODE='40001';END IF;
  FOREACH field IN ARRAY ARRAY['id','created_by','created_at','test_account','app_origin','mission_reference','creation_key','creation_request','assigned_at','field_started_at','synced_at','decided_at','closed_at','completed_date','decided_by','closed_by','anomaly_id','status']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'audit_server_metadata_immutable' USING ERRCODE='42501';END IF;END LOOP;
  IF OLD.workflow_status='closed'THEN RAISE EXCEPTION 'audit_mission_closed' USING ERRCODE='55000';END IF;
  IF NOT public.audit_mission_action(CASE WHEN decision THEN 'validate'ELSE 'update'END)THEN RAISE EXCEPTION 'audit_action_forbidden' USING ERRCODE='42501';END IF;
  IF decision THEN
   IF actor=OLD.auditor_id OR actor=OLD.created_by THEN RAISE EXCEPTION 'audit_distinct_validator_required' USING ERRCODE='42501';END IF;
  ELSIF actor IS DISTINCT FROM OLD.auditor_id AND actor IS DISTINCT FROM OLD.created_by AND NOT manager THEN RAISE EXCEPTION 'audit_actor_forbidden' USING ERRCODE='42501';END IF;
  IF changed THEN
   IF NOT(OLD.workflow_status='mission'AND NEW.workflow_status IN('planned','assigned')OR OLD.workflow_status='planned'AND NEW.workflow_status='assigned'OR OLD.workflow_status='assigned'AND NEW.workflow_status IN('in_field','planned')OR OLD.workflow_status='in_field'AND NEW.workflow_status='synced'OR OLD.workflow_status='synced'AND NEW.workflow_status='analysis'OR OLD.workflow_status='analysis'AND NEW.workflow_status IN('compliant','non_compliant')OR OLD.workflow_status='compliant'AND NEW.workflow_status='closed'OR OLD.workflow_status='non_compliant'AND NEW.workflow_status='corrective_action'OR OLD.workflow_status='corrective_action'AND NEW.workflow_status IN('analysis','closed'))THEN RAISE EXCEPTION 'invalid_audit_transition' USING ERRCODE='22023';END IF;
   IF(after-ARRAY['workflow_status','decision_reason','corrective_action','corrective_due_date','change_note','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['workflow_status','decision_reason','corrective_action','corrective_due_date','change_note','revision','updated_at'])THEN RAISE EXCEPTION 'audit_transition_content_changed' USING ERRCODE='22023';END IF;
   IF NEW.workflow_status NOT IN('compliant','non_compliant')AND NEW.decision_reason IS DISTINCT FROM OLD.decision_reason THEN RAISE EXCEPTION 'audit_decision_locked' USING ERRCODE='42501';END IF;
   IF NEW.workflow_status<>'corrective_action'AND(NEW.corrective_action IS DISTINCT FROM OLD.corrective_action OR NEW.corrective_due_date IS DISTINCT FROM OLD.corrective_due_date)THEN RAISE EXCEPTION 'audit_corrective_action_locked' USING ERRCODE='42501';END IF;
   IF NEW.workflow_status IN('compliant','non_compliant')THEN
    IF length(btrim(coalesce(NEW.decision_reason,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'audit_decision_reason_required' USING ERRCODE='22023';END IF;
    IF length(btrim(coalesce(OLD.findings,'')))=0 THEN RAISE EXCEPTION 'audit_findings_required' USING ERRCODE='22023';END IF;
    NEW.decided_by:=actor;
   END IF;
   IF NEW.workflow_status='corrective_action'AND length(btrim(coalesce(NEW.corrective_action,'')))=0 THEN RAISE EXCEPTION 'audit_corrective_action_required' USING ERRCODE='22023';END IF;
   IF NEW.workflow_status='closed'THEN
    IF length(btrim(coalesce(NEW.change_note,'')))NOT BETWEEN 1 AND 5000 OR(OLD.workflow_status='corrective_action'AND length(btrim(coalesce(OLD.correction_evidence,'')))=0)THEN RAISE EXCEPTION 'audit_closure_evidence_required' USING ERRCODE='22023';END IF;
    NEW.closed_by:=actor;
   END IF;
  ELSE
   IF NEW.decision_reason IS DISTINCT FROM OLD.decision_reason OR NEW.corrective_action IS DISTINCT FROM OLD.corrective_action OR NEW.corrective_due_date IS DISTINCT FROM OLD.corrective_due_date THEN RAISE EXCEPTION 'audit_decision_locked' USING ERRCODE='42501';END IF;
   IF OLD.workflow_status='corrective_action'THEN
    IF(after-ARRAY['correction_evidence','change_note','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['correction_evidence','change_note','revision','updated_at'])THEN RAISE EXCEPTION 'audit_content_locked' USING ERRCODE='55000';END IF;
   ELSIF OLD.workflow_status NOT IN('mission','planned','assigned','in_field','synced','analysis')THEN RAISE EXCEPTION 'audit_content_locked' USING ERRCODE='55000';END IF;
   IF OLD.workflow_status NOT IN('mission','planned','assigned')AND(NEW.auditor_id IS DISTINCT FROM OLD.auditor_id OR NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date OR NEW.target_name IS DISTINCT FROM OLD.target_name OR NEW.target_type IS DISTINCT FROM OLD.target_type OR NEW.target_id IS DISTINCT FROM OLD.target_id OR NEW.audit_type IS DISTINCT FROM OLD.audit_type)THEN RAISE EXCEPTION 'audit_assignment_locked' USING ERRCODE='55000';END IF;
   IF OLD.workflow_status NOT IN('in_field','synced','analysis')AND(NEW.findings IS DISTINCT FROM OLD.findings OR NEW.recommendations IS DISTINCT FROM OLD.recommendations OR NEW.score IS DISTINCT FROM OLD.score)THEN RAISE EXCEPTION 'audit_results_not_started' USING ERRCODE='55000';END IF;
   IF OLD.workflow_status<>'corrective_action'AND NEW.correction_evidence IS DISTINCT FROM OLD.correction_evidence THEN RAISE EXCEPTION 'audit_correction_not_started' USING ERRCODE='55000';END IF;
  END IF;
 END IF;
 IF NEW.workflow_status='planned'AND NEW.scheduled_date IS NULL OR NEW.workflow_status='assigned'AND(NEW.scheduled_date IS NULL OR NEW.auditor_id IS NULL)THEN RAISE EXCEPTION 'audit_assignment_incomplete' USING ERRCODE='22023';END IF;
 IF NEW.auditor_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.auditor_id IS DISTINCT FROM OLD.auditor_id)AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.auditor_id AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.audit_mission_action_for(p.id,'read')AND public.audit_mission_action_for(p.id,'update'))THEN RAISE EXCEPTION 'audit_assignee_forbidden' USING ERRCODE='42501';END IF;
 IF(TG_OP='INSERT'OR NEW.audit_type IS DISTINCT FROM OLD.audit_type)AND NEW.audit_type NOT IN('initial','continuous','periodic','quality','compliance','rse','logistics')OR(TG_OP='INSERT'OR NEW.target_type IS DISTINCT FROM OLD.target_type)AND NEW.target_type NOT IN('supplier','ops','internal','warehouse','product','partner')THEN RAISE EXCEPTION 'invalid_audit_type' USING ERRCODE='22023';END IF;
 IF(TG_OP='INSERT'OR NEW.target_name IS DISTINCT FROM OLD.target_name)AND length(btrim(coalesce(NEW.target_name,'')))NOT BETWEEN 1 AND 255 OR(TG_OP='INSERT'OR NEW.score IS DISTINCT FROM OLD.score)AND NEW.score NOT BETWEEN 0 AND 100 OR length(coalesce(NEW.findings,''))>20000 OR length(coalesce(NEW.recommendations,''))>10000 OR length(coalesce(NEW.corrective_action,''))>10000 OR length(coalesce(NEW.correction_evidence,''))>10000 OR length(coalesce(NEW.change_note,''))>5000 THEN RAISE EXCEPTION 'invalid_audit_mission' USING ERRCODE='22023';END IF;
 NEW.status:=CASE WHEN NEW.workflow_status IN('compliant','closed')THEN 'completed'WHEN NEW.workflow_status IN('mission','planned','assigned')THEN 'scheduled'ELSE 'in_progress'END;
 NEW.updated_at:=clock_timestamp();RETURN NEW;
END;$$;
CREATE TRIGGER aa_audit_mission_guard BEFORE INSERT OR UPDATE ON public.field_audits FOR EACH ROW EXECUTE FUNCTION public.guard_audit_mission_write();

-- Preserve automatic real Ops findings without granting Audit users general Ops writes.
-- Only the nested mission trigger may insert this narrowly bound finding.
CREATE OR REPLACE FUNCTION public.guard_audit_linked_anomaly()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid()IS NULL OR auth.role()='service_role'THEN IF TG_OP='DELETE'THEN RETURN OLD;ELSE RETURN NEW;END IF;END IF;
 IF TG_OP='INSERT'AND pg_trigger_depth()>1 AND NEW.source='audits'AND NEW.type='Non-conformité audit'AND NEW.severity='high'AND NEW.status='open'AND NEW.owner_id IS NULL AND NEW.resolved_at IS NULL AND NEW.closed_at IS NULL AND NEW.object_type='field_audit'AND NEW.created_by=auth.uid()AND NOT public.intranet_is_test_mode()AND public.audit_mission_action('validate')AND EXISTS(SELECT 1 FROM public.field_audits a WHERE a.id::text=NEW.object_id AND a.workflow_status='analysis'AND NOT a.test_account AND NEW.title='Non-conformité : '||coalesce(a.target_name,'cible')AND a.created_by IS DISTINCT FROM auth.uid()AND a.auditor_id IS DISTINCT FROM auth.uid()AND public.audit_mission_action('read'))THEN RETURN NEW;END IF;
 IF NOT public.can_intranet_table_action('anomalies',CASE TG_OP WHEN 'INSERT'THEN 'create'WHEN 'DELETE'THEN 'delete'ELSE 'update'END)THEN RAISE EXCEPTION 'business_action_forbidden' USING ERRCODE='42501';END IF;
 IF TG_OP='DELETE'THEN RETURN OLD;END IF;
 IF TG_OP='INSERT'THEN NEW.created_by:=auth.uid();ELSIF NEW.created_by IS DISTINCT FROM OLD.created_by THEN RAISE EXCEPTION 'business_actor_immutable' USING ERRCODE='42501';END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.anomalies;
CREATE TRIGGER zz_intranet_business_guard BEFORE INSERT OR UPDATE OR DELETE ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.guard_audit_linked_anomaly();
CREATE OR REPLACE FUNCTION public.audit_mission_workflow()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_anomaly uuid;
BEGIN
 IF TG_OP='INSERT'THEN
  IF NEW.app_origin='audit_hub'AND NEW.workflow_status='mission'THEN NEW.workflow_status:='synced';NEW.synced_at:=now();END IF;RETURN NEW;
 END IF;
 IF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
  CASE NEW.workflow_status WHEN 'assigned'THEN NEW.assigned_at:=now();WHEN 'in_field'THEN NEW.field_started_at:=now();WHEN 'synced'THEN NEW.synced_at:=now();WHEN 'compliant'THEN NEW.decided_at:=now();WHEN 'non_compliant'THEN NEW.decided_at:=now();WHEN 'closed'THEN NEW.closed_at:=now();ELSE NULL;END CASE;
  IF NEW.workflow_status IN('closed','compliant')AND NEW.completed_date IS NULL THEN NEW.completed_date:=current_date;END IF;
  -- Synthetic missions never open a real Ops anomaly or its pole-wide notification.
  IF NEW.workflow_status='non_compliant'AND NEW.anomaly_id IS NULL AND NOT NEW.test_account THEN
   INSERT INTO public.anomalies(source,type,severity,title,description,object_type,object_id,created_by)
   VALUES('audits','Non-conformité audit','high','Non-conformité : '||coalesce(NEW.target_name,'cible'),coalesce(NEW.decision_reason,NEW.findings),'field_audit',NEW.id::text,auth.uid())RETURNING id INTO v_anomaly;
   NEW.anomaly_id:=v_anomaly;
  END IF;
 END IF;RETURN NEW;
END;$$;

-- Events are exclusively generated by the existing trigger, and inherit parent visibility.
REVOKE INSERT,UPDATE,DELETE ON public.audit_mission_events FROM authenticated;
DROP POLICY IF EXISTS intranet_test_environment ON public.audit_mission_events;
CREATE POLICY intranet_test_environment ON public.audit_mission_events AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.field_audits a WHERE a.id=audit_id));
DROP POLICY IF EXISTS intranet_read_boundary ON public.audit_mission_events;
CREATE POLICY intranet_read_boundary ON public.audit_mission_events AS RESTRICTIVE FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.field_audits a WHERE a.id=audit_id));
CREATE POLICY audit_parent_events_read ON public.audit_mission_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.field_audits a WHERE a.id=audit_id));
CREATE OR REPLACE FUNCTION public.log_audit_mission_event()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT'OR NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
  INSERT INTO public.audit_mission_events(audit_id,from_status,to_status,message,origin,performed_by)
  VALUES(NEW.id,CASE WHEN TG_OP='UPDATE'THEN OLD.workflow_status END,NEW.workflow_status,CASE WHEN TG_OP='INSERT'THEN 'Création'ELSE coalesce(nullif(NEW.change_note,''),NEW.decision_reason)END,NEW.app_origin,auth.uid());
 END IF;
 -- Targeted notifications avoid exposing sandbox findings through pole-wide messages.
 IF NEW.auditor_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.auditor_id IS DISTINCT FROM OLD.auditor_id OR NEW.workflow_status IS DISTINCT FROM OLD.workflow_status)AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.auditor_id AND coalesce(p.test_account,false)=NEW.test_account AND p.hr_status='active'AND public.audit_mission_action_for(p.id,'read'))THEN
  INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(NEW.auditor_id,'Mission d’audit mise à jour',NEW.target_name,'info','/pole/audit/missions?mission='||NEW.id,jsonb_build_object('audit_id',NEW.id,'test_account',NEW.test_account));
 END IF;
 RETURN NULL;
END;$$;

CREATE OR REPLACE FUNCTION public.create_audit_mission(p_key uuid,p_payload jsonb)RETURNS public.field_audits LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result public.field_audits;field text;
BEGIN
 IF NOT public.audit_mission_action('read')OR NOT public.audit_mission_action('create')THEN RAISE EXCEPTION 'audit_creation_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'THEN RAISE EXCEPTION 'invalid_audit_payload' USING ERRCODE='22023';END IF;
 FOR field IN SELECT jsonb_object_keys(p_payload)LOOP IF field<>ALL(ARRAY['target_name','target_type','audit_type','scheduled_date','auditor_id','workflow_status'])THEN RAISE EXCEPTION 'invalid_audit_field' USING ERRCODE='22023';END IF;END LOOP;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,0));
 SELECT * INTO result FROM public.field_audits WHERE created_by=auth.uid()AND creation_key=p_key;
 IF FOUND THEN IF result.creation_request IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'audit_retry_payload_changed' USING ERRCODE='22023';END IF;RETURN result;END IF;
 INSERT INTO public.field_audits(target_name,target_type,audit_type,scheduled_date,auditor_id,workflow_status,app_origin,created_by,creation_key,creation_request)
 VALUES(p_payload->>'target_name',p_payload->>'target_type',p_payload->>'audit_type',nullif(p_payload->>'scheduled_date','')::date,nullif(p_payload->>'auditor_id','')::uuid,coalesce(p_payload->>'workflow_status','mission'),'connect',auth.uid(),p_key,p_payload)RETURNING * INTO result;
 RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.update_audit_mission(p_id uuid,p_revision bigint,p_patch jsonb)RETURNS public.field_audits LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result public.field_audits;field text;sets text:='';
BEGIN
 IF NOT public.audit_mission_action('read')THEN RAISE EXCEPTION 'audit_mission_forbidden' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(p_patch)IS DISTINCT FROM 'object'OR p_patch='{}'THEN RAISE EXCEPTION 'invalid_audit_payload' USING ERRCODE='22023';END IF;
 FOR field IN SELECT jsonb_object_keys(p_patch)LOOP
  IF field<>ALL(ARRAY['target_name','target_type','audit_type','scheduled_date','auditor_id','workflow_status','findings','recommendations','score','decision_reason','corrective_action','corrective_due_date','correction_evidence','change_note'])THEN RAISE EXCEPTION 'invalid_audit_field' USING ERRCODE='22023';END IF;
  sets:=sets||format('%I=(jsonb_populate_record(NULL::public.field_audits,$1)).%I,',field,field);
 END LOOP;
 EXECUTE 'UPDATE public.field_audits SET '||sets||'revision=revision+1 WHERE id=$2 AND revision=$3 RETURNING *'INTO result USING p_patch,p_id,p_revision;
 IF result.id IS NULL THEN RAISE EXCEPTION 'audit_mission_changed_or_forbidden' USING ERRCODE='40001';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_audit_people()RETURNS TABLE(id uuid,first_name text,last_name text,email text)LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT p.id,p.first_name,p.last_name,p.email FROM public.profiles p WHERE public.audit_mission_action('read')AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()AND public.audit_mission_action_for(p.id,'read')AND public.audit_mission_action_for(p.id,'update')ORDER BY p.last_name,p.first_name,p.id;
$$;
REVOKE ALL ON FUNCTION public.audit_mission_action_for(uuid,text),public.guard_audit_linked_anomaly(),public.audit_mission_workflow(),public.guard_audit_mission_write(),public.log_audit_mission_event()FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.audit_mission_action(text),public.create_audit_mission(uuid,jsonb),public.update_audit_mission(uuid,bigint,jsonb),public.list_audit_people()FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.audit_mission_action(text),public.create_audit_mission(uuid,jsonb),public.update_audit_mission(uuid,bigint,jsonb),public.list_audit_people()TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
