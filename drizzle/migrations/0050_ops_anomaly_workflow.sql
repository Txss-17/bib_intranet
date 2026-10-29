-- Keep Ops anomalies, evidence and reminders on the existing canonical register.
ALTER TABLE public.anomalies
 ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS legacy_record boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'Ops' CHECK(team IN('Ops','Qualité','Finance')),
 ADD COLUMN IF NOT EXISTS corrective_action text,
 ADD COLUMN IF NOT EXISTS evidence text,
 ADD COLUMN IF NOT EXISTS resolution text,
 ADD COLUMN IF NOT EXISTS document_ids uuid[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS completed_checks text[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS closure_kind text CHECK(closure_kind IN('resolved','dismissed')),
 ADD COLUMN IF NOT EXISTS archived_at timestamptz,
 ADD COLUMN IF NOT EXISTS change_note text,
 ADD COLUMN IF NOT EXISTS creation_key uuid,
 ADD COLUMN IF NOT EXISTS creation_request jsonb;
ALTER TABLE public.anomalies ALTER COLUMN legacy_record SET DEFAULT false;
ALTER TABLE public.anomaly_events ADD COLUMN IF NOT EXISTS before_state jsonb,ADD COLUMN IF NOT EXISTS after_state jsonb;
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.anomalies;
DROP TRIGGER IF EXISTS trg_anomaly_change ON public.anomalies;
DROP TRIGGER IF EXISTS trg_anomaly_created ON public.anomalies;
DROP TRIGGER IF EXISTS zz_intranet_business_history ON public.anomalies;
DROP TRIGGER IF EXISTS trg_anomaly_assignment_notify ON public.anomalies;
WITH modes AS(SELECT a.id,coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=a.created_by),(SELECT p.test_account FROM public.profiles p WHERE p.id=a.owner_id),false)AS mode FROM public.anomalies a)
UPDATE public.anomalies a SET test_account=m.mode FROM modes m WHERE a.id=m.id AND a.test_account IS DISTINCT FROM m.mode;
UPDATE public.anomalies SET team=CASE WHEN source IN('payments','stripe','invoices')THEN 'Finance'WHEN source='audits'THEN 'Qualité'ELSE 'Ops'END WHERE legacy_record;
CREATE UNIQUE INDEX ops_anomaly_creation_retry ON public.anomalies(created_by,creation_key)WHERE creation_key IS NOT NULL;
CREATE INDEX ops_anomaly_queue ON public.anomalies(test_account,status,created_at DESC);
CREATE OR REPLACE FUNCTION public.can_read_ops_anomaly(a public.anomalies)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$SELECT public.can_intranet_action('ops.anomalies','read')AND a.test_account=public.intranet_is_test_mode();$$;
DROP POLICY IF EXISTS intranet_test_environment ON public.anomalies;
CREATE POLICY intranet_test_environment ON public.anomalies AS RESTRICTIVE FOR ALL TO authenticated USING(test_account=public.intranet_is_test_mode())WITH CHECK(test_account=public.intranet_is_test_mode());
DROP POLICY IF EXISTS intranet_update_boundary ON public.anomalies;
CREATE POLICY intranet_update_boundary ON public.anomalies AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.can_intranet_action('ops.anomalies','read')AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate')OR public.can_intranet_action('ops.anomalies','delete')))WITH CHECK(public.can_intranet_action('ops.anomalies','read')AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate')OR public.can_intranet_action('ops.anomalies','delete')));
CREATE POLICY ops_anomalies_read ON public.anomalies FOR SELECT TO authenticated USING(public.can_intranet_action('ops.anomalies','read'));
CREATE POLICY ops_anomalies_create ON public.anomalies FOR INSERT TO authenticated WITH CHECK(public.can_intranet_action('ops.anomalies','read')AND public.can_intranet_action('ops.anomalies','create'));
CREATE POLICY ops_anomalies_update ON public.anomalies FOR UPDATE TO authenticated USING(public.can_intranet_action('ops.anomalies','read')AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate')OR public.can_intranet_action('ops.anomalies','delete')));
CREATE POLICY ops_anomalies_preserve ON public.anomalies AS RESTRICTIVE FOR DELETE TO authenticated USING(false);
GRANT SELECT,INSERT,UPDATE ON public.anomalies TO authenticated;
GRANT ALL ON public.anomalies,public.anomaly_events,public.anomaly_notifications TO service_role;

CREATE OR REPLACE FUNCTION public.guard_ops_anomaly_write()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();before jsonb;after jsonb:=to_jsonb(NEW);field text;manager boolean;changed boolean;decision boolean;reopening boolean;claim boolean;trusted_audit boolean:=false;document uuid;
BEGIN
 IF actor IS NULL OR auth.role()='service_role'THEN
  IF TG_OP='INSERT'THEN NEW.revision:=1;
  ELSIF(after-ARRAY['last_reminded_at','revision'])IS NOT DISTINCT FROM(to_jsonb(OLD)-ARRAY['last_reminded_at','revision'])THEN NEW.revision:=OLD.revision;
  ELSE NEW.revision:=OLD.revision+1;END IF;
  RETURN NEW;
 END IF;
 -- Preserve the narrowly authorized nested Audit->Ops handoff introduced by 0049.
 IF TG_OP='INSERT'AND pg_trigger_depth()>1 AND NEW.source='audits'AND NEW.type='Non-conformité audit'AND NEW.severity='high'AND NEW.status='open'AND NEW.owner_id IS NULL AND NEW.resolved_at IS NULL AND NEW.closed_at IS NULL AND NEW.object_type='field_audit'AND NEW.created_by=actor AND NOT public.intranet_is_test_mode()AND public.audit_mission_action('validate')AND public.audit_mission_action('read')AND EXISTS(SELECT 1 FROM public.field_audits a WHERE a.id::text=NEW.object_id AND a.workflow_status='analysis'AND NOT a.test_account AND NEW.title='Non-conformité : '||coalesce(a.target_name,'cible')AND a.created_by IS DISTINCT FROM actor AND a.auditor_id IS DISTINCT FROM actor)THEN trusted_audit:=true;END IF;
 IF NOT trusted_audit AND NOT public.can_intranet_action('ops.anomalies','read')THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 manager:=public.can_intranet_action('ops.anomalies','validate');
 IF TG_OP='INSERT'THEN
  IF NOT trusted_audit AND NOT public.can_intranet_action('ops.anomalies','create')THEN RAISE EXCEPTION 'ops_anomaly_create_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.status IS DISTINCT FROM 'open'OR NEW.resolved_at IS NOT NULL OR NEW.closed_at IS NOT NULL OR NEW.resolved_by IS NOT NULL OR NEW.closed_by IS NOT NULL OR NEW.archived_at IS NOT NULL OR NEW.resolution IS NOT NULL OR NEW.closure_kind IS NOT NULL OR NEW.ai_suggestion IS NOT NULL OR NEW.ai_decision IS NOT NULL OR NEW.ai_validated_by IS NOT NULL OR NEW.ai_validated_at IS NOT NULL THEN RAISE EXCEPTION 'ops_anomaly_initial_state_required' USING ERRCODE='22023';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.updated_at:=NEW.created_at;NEW.reference:='ANO-'||upper(substr(gen_random_uuid()::text,1,8));NEW.test_account:=public.intranet_is_test_mode();NEW.legacy_record:=false;NEW.revision:=1;NEW.last_reminded_at:=NULL;NEW.change_note:=NULL;
  IF trusted_audit THEN NEW.team:='Qualité';END IF;
 ELSE
  before:=to_jsonb(OLD);changed:=NEW.status IS DISTINCT FROM OLD.status;
  decision:=changed AND(NEW.status='closed'OR OLD.status='resolved'AND NEW.status='investigating');
  reopening:=changed AND OLD.status='closed'AND NEW.status='investigating';
  IF EXISTS(SELECT 1 FROM public.field_audits a WHERE a.anomaly_id=OLD.id)AND(NEW.source IS DISTINCT FROM OLD.source OR NEW.object_type IS DISTINCT FROM OLD.object_type OR NEW.object_id IS DISTINCT FROM OLD.object_id)THEN RAISE EXCEPTION 'ops_anomaly_audit_link_immutable' USING ERRCODE='42501';END IF;
  IF OLD.test_account IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'ops_anomaly_environment_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'ops_anomaly_changed' USING ERRCODE='40001';END IF;
  FOREACH field IN ARRAY ARRAY['id','reference','created_by','created_at','test_account','legacy_record','creation_key','creation_request','resolved_at','resolved_by','closed_at','closed_by','closure_kind','last_reminded_at','ai_suggestion','ai_decision','ai_validated_by','ai_validated_at']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'ops_anomaly_server_metadata_immutable' USING ERRCODE='42501';END IF;END LOOP;
  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
   IF NOT public.can_intranet_action('ops.anomalies','delete')OR(actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager)THEN RAISE EXCEPTION 'ops_anomaly_archive_forbidden' USING ERRCODE='42501';END IF;
   IF OLD.status<>'closed'OR OLD.archived_at IS NOT NULL OR(after-ARRAY['archived_at','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['archived_at','revision','updated_at'])THEN RAISE EXCEPTION 'ops_anomaly_close_before_archive' USING ERRCODE='55000';END IF;
   NEW.archived_at:=clock_timestamp();NEW.updated_at:=clock_timestamp();RETURN NEW;
  END IF;
  IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'ops_anomaly_archived' USING ERRCODE='55000';END IF;
  IF NOT public.can_intranet_action('ops.anomalies',CASE WHEN decision OR reopening THEN 'validate'ELSE 'update'END)THEN RAISE EXCEPTION 'ops_anomaly_action_forbidden' USING ERRCODE='42501';END IF;
  IF decision THEN
   IF actor=OLD.created_by OR actor=OLD.owner_id OR actor=OLD.resolved_by THEN RAISE EXCEPTION 'ops_anomaly_distinct_validator_required' USING ERRCODE='42501';END IF;
  ELSIF NOT reopening THEN
   claim:=OLD.owner_id IS NULL AND NEW.owner_id=actor AND(after-ARRAY['owner_id','revision','updated_at'])IS NOT DISTINCT FROM(before-ARRAY['owner_id','revision','updated_at']);
   IF actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager AND NOT coalesce(claim,false)THEN RAISE EXCEPTION 'ops_anomaly_owner_forbidden' USING ERRCODE='42501';END IF;
  END IF;
  IF changed THEN
   IF(after-ARRAY['status','resolution','change_note','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['status','resolution','change_note','revision','updated_at'])THEN RAISE EXCEPTION 'ops_anomaly_transition_content_changed' USING ERRCODE='22023';END IF;
   IF NOT(OLD.status='open'AND NEW.status='investigating'OR OLD.status='investigating'AND NEW.status IN('action_required','resolved')OR OLD.status='action_required'AND NEW.status IN('investigating','resolved')OR OLD.status='resolved'AND NEW.status IN('closed','investigating')OR OLD.status IN('open','investigating','action_required')AND NEW.status='closed'OR reopening)THEN RAISE EXCEPTION 'invalid_ops_anomaly_transition' USING ERRCODE='22023';END IF;
   IF NEW.status<>'resolved'AND NEW.resolution IS DISTINCT FROM OLD.resolution THEN RAISE EXCEPTION 'ops_anomaly_resolution_immutable' USING ERRCODE='42501';END IF;
   IF NEW.status IN('resolved','closed')OR OLD.status IN('resolved','closed')OR NEW.status='action_required'THEN
    IF length(btrim(coalesce(NEW.change_note,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'ops_anomaly_reason_required' USING ERRCODE='22023';END IF;
   END IF;
   IF NOT decision AND NOT reopening AND actor IS DISTINCT FROM OLD.owner_id AND NOT manager THEN RAISE EXCEPTION 'ops_anomaly_assignee_required' USING ERRCODE='42501';END IF;
   IF NEW.status='resolved'THEN
    IF jsonb_typeof(NEW.checks)IS DISTINCT FROM 'array'THEN RAISE EXCEPTION 'invalid_ops_anomaly_checks' USING ERRCODE='22023';END IF;
    IF length(btrim(coalesce(NEW.resolution,'')))NOT BETWEEN 1 AND 5000 OR length(btrim(coalesce(NEW.corrective_action,'')))=0 OR(length(btrim(coalesce(NEW.evidence,'')))=0 AND cardinality(NEW.document_ids)=0)OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(NEW.checks)c WHERE NOT c=ANY(NEW.completed_checks))THEN RAISE EXCEPTION 'ops_anomaly_resolution_evidence_required' USING ERRCODE='22023';END IF;
    NEW.resolved_by:=actor;NEW.resolved_at:=clock_timestamp();NEW.closed_by:=NULL;NEW.closed_at:=NULL;NEW.closure_kind:=NULL;
   ELSIF NEW.status='closed'THEN
    IF OLD.status='resolved'AND OLD.resolved_by IS NULL THEN RAISE EXCEPTION 'ops_anomaly_legacy_resolution_needs_rework' USING ERRCODE='22023';END IF;
    NEW.closed_by:=actor;NEW.closed_at:=clock_timestamp();NEW.closure_kind:=CASE WHEN OLD.status='resolved'THEN 'resolved'ELSE 'dismissed'END;
   ELSIF OLD.status IN('resolved','closed')THEN
    NEW.resolution:=NULL;NEW.resolved_by:=NULL;NEW.resolved_at:=NULL;NEW.closed_by:=NULL;NEW.closed_at:=NULL;NEW.closure_kind:=NULL;NEW.last_reminded_at:=NULL;
   END IF;
  ELSE
   IF OLD.status IN('resolved','closed')THEN RAISE EXCEPTION 'ops_anomaly_content_locked' USING ERRCODE='55000';END IF;
   IF NEW.resolution IS DISTINCT FROM OLD.resolution THEN RAISE EXCEPTION 'ops_anomaly_resolution_immutable' USING ERRCODE='42501';END IF;
  END IF;
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.due_at IS DISTINCT FROM OLD.due_at OR NEW.reminder_at IS DISTINCT FROM OLD.reminder_at THEN NEW.last_reminded_at:=NULL;END IF;
 END IF;
 IF length(btrim(coalesce(NEW.title,'')))NOT BETWEEN 1 AND 255 OR length(btrim(coalesce(NEW.type,'')))NOT BETWEEN 1 AND 255 OR length(coalesce(NEW.description,''))>20000 OR length(coalesce(NEW.corrective_action,''))>10000 OR length(coalesce(NEW.evidence,''))>10000 OR length(coalesce(NEW.change_note,''))>5000 OR length(coalesce(NEW.category,''))>255 OR length(coalesce(NEW.object_type,''))>100 OR length(coalesce(NEW.object_id,''))>255 OR cardinality(NEW.document_ids)>20 OR array_ndims(NEW.document_ids)>1 OR array_position(NEW.document_ids,NULL)IS NOT NULL OR cardinality(NEW.completed_checks)>50 OR array_ndims(NEW.completed_checks)>1 OR array_position(NEW.completed_checks,NULL)IS NOT NULL THEN RAISE EXCEPTION 'invalid_ops_anomaly' USING ERRCODE='22023';END IF;
 IF TG_OP='INSERT'OR NEW.checks IS DISTINCT FROM OLD.checks OR NEW.completed_checks IS DISTINCT FROM OLD.completed_checks THEN
  IF jsonb_typeof(NEW.checks)IS DISTINCT FROM 'array'THEN RAISE EXCEPTION 'invalid_ops_anomaly_checks' USING ERRCODE='22023';END IF;
  IF jsonb_array_length(NEW.checks)>50 OR EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.checks)c WHERE jsonb_typeof(c)<>'string'OR length(btrim(c#>>'{}'))NOT BETWEEN 1 AND 255)OR EXISTS(SELECT 1 FROM unnest(NEW.completed_checks)c WHERE NOT NEW.checks@>jsonb_build_array(c))THEN RAISE EXCEPTION 'invalid_ops_anomaly_checks' USING ERRCODE='22023';END IF;
 END IF;
 IF TG_OP='INSERT'OR NEW.due_at IS DISTINCT FROM OLD.due_at OR NEW.reminder_at IS DISTINCT FROM OLD.reminder_at THEN
  IF NEW.due_at IS NOT NULL AND NOT isfinite(NEW.due_at)OR NEW.reminder_at IS NOT NULL AND(NOT isfinite(NEW.reminder_at)OR NEW.due_at IS NULL OR NEW.reminder_at>NEW.due_at)THEN RAISE EXCEPTION 'invalid_ops_anomaly_deadline' USING ERRCODE='22023';END IF;
 END IF;
 IF NEW.owner_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.owner_id IS DISTINCT FROM OLD.owner_id)AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.owner_id AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.can_intranet_action_for(p.id,'ops.anomalies','read')AND public.can_intranet_action_for(p.id,'ops.anomalies','update'))THEN RAISE EXCEPTION 'ops_anomaly_assignee_forbidden' USING ERRCODE='42501';END IF;
 FOREACH document IN ARRAY NEW.document_ids LOOP
  IF(TG_OP='INSERT'OR NOT document=ANY(OLD.document_ids))AND NOT EXISTS(SELECT 1 FROM public.intranet_drive_documents d WHERE d.id=document AND d.owner_id=actor AND d.test_account=NEW.test_account AND public.can_read_intranet_drive_document(d))THEN RAISE EXCEPTION 'ops_anomaly_attachment_forbidden' USING ERRCODE='42501';END IF;
 END LOOP;
 NEW.title:=btrim(NEW.title);NEW.type:=btrim(NEW.type);NEW.updated_at:=clock_timestamp();RETURN NEW;
END;$$;
CREATE TRIGGER zz_intranet_business_guard BEFORE INSERT OR UPDATE ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.guard_ops_anomaly_write();

-- Shared evidence remains governed by both the parent record and Documents access.
CREATE OR REPLACE FUNCTION public.can_read_intranet_drive_document(p public.intranet_drive_documents)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action('app.documents','read')AND EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid()AND coalesce(me.test_account,false)=p.test_account)
 AND((public.can_intranet_action(p.page_id,'read')AND(p.owner_id=auth.uid()OR p.classification='internal'OR public.can_intranet_action(p.page_id,'validate')))
 OR public.is_intranet_document_recipient(p.id)OR EXISTS(SELECT 1 FROM public.intranet_records r WHERE p.id=ANY(r.document_ids)AND public.can_read_intranet_record(r))
 OR EXISTS(SELECT 1 FROM public.quality_alerts a WHERE p.id=ANY(a.document_ids)AND public.can_read_quality_alert(a))
 OR EXISTS(SELECT 1 FROM public.anomalies a WHERE p.id=ANY(a.document_ids)AND public.can_read_ops_anomaly(a)));
$$;

-- Authenticated clients may append comments, never fabricate workflow events or notifications.
DROP POLICY IF EXISTS intranet_test_environment ON public.anomaly_events;
CREATE POLICY intranet_test_environment ON public.anomaly_events AS RESTRICTIVE FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id))WITH CHECK(EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id AND a.archived_at IS NULL AND a.status<>'closed'));
DROP POLICY IF EXISTS intranet_create_boundary ON public.anomaly_events;
CREATE POLICY intranet_create_boundary ON public.anomaly_events AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.can_intranet_action('ops.anomalies','read')AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate')));
CREATE POLICY ops_event_read ON public.anomaly_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id));
CREATE POLICY ops_event_comment ON public.anomaly_events FOR INSERT TO authenticated WITH CHECK(kind='comment'AND performed_by=auth.uid()AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate'))AND EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id AND a.archived_at IS NULL AND a.status<>'closed'));
CREATE OR REPLACE FUNCTION public.guard_ops_anomaly_event()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid()IS NULL OR auth.role()='service_role'OR pg_trigger_depth()>1 THEN RETURN NEW;END IF;
 IF NEW.kind IS DISTINCT FROM 'comment'OR NEW.from_status IS NOT NULL OR NEW.to_status IS NOT NULL OR NEW.before_state IS NOT NULL OR NEW.after_state IS NOT NULL OR length(btrim(coalesce(NEW.message,'')))NOT BETWEEN 1 AND 5000 OR NOT(public.can_intranet_action('ops.anomalies','read')AND(public.can_intranet_action('ops.anomalies','update')OR public.can_intranet_action('ops.anomalies','validate')))THEN RAISE EXCEPTION 'ops_anomaly_comment_forbidden' USING ERRCODE='42501';END IF;
 NEW.performed_by:=auth.uid();NEW.created_at:=clock_timestamp();NEW.message:=btrim(NEW.message);RETURN NEW;
END;$$;
CREATE TRIGGER ops_anomaly_event_guard BEFORE INSERT ON public.anomaly_events FOR EACH ROW EXECUTE FUNCTION public.guard_ops_anomaly_event();
REVOKE UPDATE,DELETE ON public.anomaly_events FROM authenticated;
GRANT SELECT,INSERT ON public.anomaly_events TO authenticated;
-- This child journal is exclusively server-written. The generic create guard would
-- incorrectly require an editor/validator to hold the general create permission.
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.anomaly_notifications;
DROP TRIGGER IF EXISTS zz_intranet_business_history ON public.anomaly_notifications;
UPDATE public.intranet_business_history h SET test_account=a.test_account FROM public.anomaly_notifications n JOIN public.anomalies a ON a.id=n.anomaly_id WHERE h.table_name='anomaly_notifications'AND h.row_id=n.id::text AND h.test_account IS DISTINCT FROM a.test_account;
DROP POLICY IF EXISTS intranet_test_environment ON public.anomaly_notifications;
CREATE POLICY intranet_test_environment ON public.anomaly_notifications AS RESTRICTIVE FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id))WITH CHECK(false);
CREATE POLICY ops_notification_read ON public.anomaly_notifications FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.anomalies a WHERE a.id=anomaly_id));
REVOKE INSERT,UPDATE,DELETE ON public.anomaly_notifications FROM authenticated;
GRANT SELECT ON public.anomaly_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.enqueue_ops_anomaly_notification(_a public.anomalies,_kind text,_msg text)RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF _a.owner_id IS NULL OR _a.archived_at IS NOT NULL OR _a.status='closed'OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=_a.owner_id AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=_a.test_account AND public.can_intranet_action_for(p.id,'ops.anomalies','read'))THEN RETURN false;END IF;
 INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(_a.owner_id,CASE _kind WHEN 'assigned'THEN 'Anomalie attribuée'WHEN 'due_changed'THEN 'Échéance modifiée'WHEN 'overdue'THEN 'Anomalie en retard'ELSE 'Rappel anomalie'END||' — '||_a.reference,_msg,(CASE WHEN _kind='overdue'THEN 'critical'ELSE 'warning'END)::public.notification_type,'/pole/ops/anomalies?anomaly='||_a.id,jsonb_build_object('anomaly_id',_a.id,'kind',_kind,'test_account',_a.test_account));
 INSERT INTO public.anomaly_notifications(anomaly_id,recipient_id,kind,message)VALUES(_a.id,_a.owner_id,_kind,_msg);
 RETURN true;
END;$$;
CREATE OR REPLACE FUNCTION public.notify_anomaly(_a public.anomalies,_kind text,_msg text)RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN PERFORM public.enqueue_ops_anomaly_notification(_a,_kind,_msg);END;$$;
CREATE OR REPLACE FUNCTION public.log_ops_anomaly_write()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE before jsonb;recipient record;BEGIN
 IF TG_OP='UPDATE'THEN before:=to_jsonb(OLD);IF(to_jsonb(NEW)-ARRAY['last_reminded_at','revision'])IS NOT DISTINCT FROM(before-ARRAY['last_reminded_at','revision'])THEN RETURN NULL;END IF;END IF;
 IF public.is_intranet_actor()OR auth.role()='service_role'THEN
  INSERT INTO public.intranet_business_history(table_name,row_id,actor_id,action,before_state,after_state,test_account)VALUES('anomalies',NEW.id::text,auth.uid(),lower(TG_OP),before,to_jsonb(NEW),NEW.test_account);
 END IF;
 INSERT INTO public.anomaly_events(anomaly_id,kind,from_status,to_status,message,performed_by,before_state,after_state)VALUES(NEW.id,CASE WHEN TG_OP='INSERT'THEN 'created'WHEN NEW.status IS DISTINCT FROM OLD.status THEN 'status'ELSE 'update'END,CASE WHEN TG_OP='UPDATE'THEN OLD.status END,NEW.status,CASE WHEN TG_OP='INSERT'THEN NEW.title ELSE NEW.change_note END,auth.uid(),before,to_jsonb(NEW));
 IF NEW.owner_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.owner_id IS DISTINCT FROM OLD.owner_id)THEN PERFORM public.notify_anomaly(NEW,'assigned',NEW.title);
 ELSIF TG_OP='UPDATE'AND(NEW.due_at IS DISTINCT FROM OLD.due_at OR NEW.reminder_at IS DISTINCT FROM OLD.reminder_at)THEN PERFORM public.notify_anomaly(NEW,'due_changed',NEW.title||' — échéance '||coalesce(to_char(NEW.due_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY HH24:MI'),'non définie'));END IF;
 IF TG_OP='INSERT'AND NEW.severity IN('high','critical')THEN
  FOR recipient IN SELECT p.id FROM public.profiles p WHERE p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND p.id IS DISTINCT FROM NEW.owner_id AND p.id IS DISTINCT FROM auth.uid()AND public.can_intranet_action_for(p.id,'ops.anomalies','read')AND public.can_intranet_action_for(p.id,'ops.anomalies','validate')LOOP
   INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(recipient.id,'Anomalie à suivre',NEW.title,'warning','/pole/ops/anomalies?anomaly='||NEW.id,jsonb_build_object('anomaly_id',NEW.id,'test_account',NEW.test_account));
  END LOOP;
 END IF;RETURN NULL;
END;$$;
CREATE TRIGGER ops_anomaly_history AFTER INSERT OR UPDATE ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.log_ops_anomaly_write();
CREATE TRIGGER ops_anomaly_business_delete AFTER DELETE ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.log_intranet_business_write();
CREATE OR REPLACE FUNCTION public.send_anomaly_reminders()RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.anomalies;n integer:=0;BEGIN
 FOR a IN SELECT x.* FROM public.anomalies x JOIN public.profiles p ON p.id=x.owner_id WHERE x.archived_at IS NULL AND x.status NOT IN('resolved','closed')AND x.due_at IS NOT NULL AND isfinite(x.due_at)AND(x.last_reminded_at IS NULL OR x.last_reminded_at<now()-interval '20 hours')AND(x.due_at<now()OR coalesce(x.reminder_at,x.due_at-interval '24 hours')<=now())AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=x.test_account AND public.can_intranet_action_for(p.id,'ops.anomalies','read')ORDER BY x.due_at,x.id LIMIT 200 FOR UPDATE OF x SKIP LOCKED LOOP
  IF public.enqueue_ops_anomaly_notification(a,CASE WHEN a.due_at<now()THEN 'overdue'ELSE 'reminder'END,a.title||' — échéance '||to_char(a.due_at AT TIME ZONE 'Europe/Paris','DD/MM/YYYY HH24:MI'))THEN
   UPDATE public.anomalies SET last_reminded_at=now()WHERE id=a.id;n:=n+1;
  END IF;
 END LOOP;RETURN n;
END;$$;

CREATE OR REPLACE FUNCTION public.create_ops_anomaly(p_key uuid,p_payload jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE prior public.anomalies;request jsonb;columns text;values_sql text;result jsonb;BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')OR NOT public.can_intranet_action('ops.anomalies','create')THEN RAISE EXCEPTION 'ops_anomaly_create_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'OR octet_length(p_payload::text)>100000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload)k WHERE k<>ALL(ARRAY['title','description','source','type','severity','team','category','object_type','object_id','owner_id','due_at','reminder_at','checks','corrective_action','evidence','document_ids']))THEN RAISE EXCEPTION 'invalid_ops_anomaly_payload' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('ops-anomaly-create:'||auth.uid()::text||p_key::text,0));
 SELECT * INTO prior FROM public.anomalies WHERE created_by=auth.uid()AND creation_key=p_key;
 IF FOUND THEN IF prior.creation_request IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'ops_anomaly_retry_changed' USING ERRCODE='40001';END IF;RETURN to_jsonb(prior);END IF;
 request:=jsonb_build_object('severity','medium','team','Ops')||p_payload||jsonb_build_object('created_by',auth.uid(),'creation_key',p_key,'creation_request',p_payload);
 SELECT string_agg(quote_ident(k),','ORDER BY k),string_agg('v.'||quote_ident(k),','ORDER BY k)INTO columns,values_sql FROM jsonb_object_keys(request)k;
 EXECUTE format('INSERT INTO public.anomalies(%s)SELECT %s FROM jsonb_populate_record(NULL::public.anomalies,$1)v RETURNING to_jsonb(anomalies.*)',columns,values_sql)INTO result USING request;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.update_ops_anomaly(p_id uuid,p_revision bigint,p_patch jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE fields text;result jsonb;BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')OR NOT public.can_intranet_action('ops.anomalies','update')THEN RAISE EXCEPTION 'ops_anomaly_update_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR jsonb_typeof(p_patch)IS DISTINCT FROM 'object'OR p_patch='{}'OR octet_length(p_patch::text)>100000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_patch)k WHERE k<>ALL(ARRAY['title','description','source','type','severity','team','category','object_type','object_id','owner_id','due_at','reminder_at','checks','completed_checks','corrective_action','evidence','document_ids','change_note']))THEN RAISE EXCEPTION 'invalid_ops_anomaly_patch' USING ERRCODE='22023';END IF;
 SELECT string_agg(format('%I=v.%I',k,k),','ORDER BY k)INTO fields FROM jsonb_object_keys(p_patch)k;
 EXECUTE format('UPDATE public.anomalies a SET %s,revision=a.revision+1 FROM jsonb_populate_record(NULL::public.anomalies,$1)v WHERE a.id=$2 AND a.revision=$3 RETURNING to_jsonb(a.*)',fields)INTO result USING p_patch,p_id,p_revision;
 IF result IS NULL THEN RAISE EXCEPTION 'ops_anomaly_changed' USING ERRCODE='40001';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.transition_ops_anomaly(p_id uuid,p_revision bigint,p_action text,p_note text DEFAULT '')RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE a public.anomalies;next_status text;result jsonb;BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')OR p_action IS NULL OR p_action NOT IN('investigate','require_action','resolve','approve','return','dismiss','reopen','archive')OR NOT public.can_intranet_action('ops.anomalies',CASE WHEN p_action='archive'THEN 'delete'WHEN p_action IN('approve','return','dismiss','reopen')THEN 'validate'ELSE 'update'END)THEN RAISE EXCEPTION 'ops_anomaly_transition_forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.anomalies WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_revision IS NULL OR a.revision<>p_revision THEN RAISE EXCEPTION 'ops_anomaly_changed' USING ERRCODE='40001';END IF;
 IF p_action='archive'THEN UPDATE public.anomalies SET archived_at=clock_timestamp(),revision=revision+1 WHERE id=p_id RETURNING to_jsonb(anomalies.*)INTO result;RETURN result;END IF;
 IF(p_action IN('investigate','resolve','require_action')AND a.status NOT IN('open','investigating','action_required'))OR p_action IN('approve','return')AND a.status<>'resolved'OR p_action='dismiss'AND a.status NOT IN('open','investigating','action_required')OR p_action='reopen'AND a.status<>'closed'THEN RAISE EXCEPTION 'invalid_ops_anomaly_transition' USING ERRCODE='22023';END IF;
 next_status:=CASE p_action WHEN 'investigate'THEN 'investigating'WHEN 'require_action'THEN 'action_required'WHEN 'resolve'THEN 'resolved'WHEN 'approve'THEN 'closed'WHEN 'return'THEN 'investigating'WHEN 'dismiss'THEN 'closed'WHEN 'reopen'THEN 'investigating'END;
 IF next_status=a.status THEN RAISE EXCEPTION 'invalid_ops_anomaly_transition' USING ERRCODE='22023';END IF;
 UPDATE public.anomalies SET status=next_status,change_note=nullif(btrim(p_note),''),resolution=CASE WHEN p_action='resolve'THEN nullif(btrim(p_note),'')ELSE resolution END,revision=revision+1 WHERE id=p_id RETURNING to_jsonb(anomalies.*)INTO result;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_ops_anomaly_people()RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',trim(concat_ws(' ',p.first_name,p.last_name)))ORDER BY p.last_name,p.first_name),'[]'::jsonb)FROM public.profiles p WHERE public.can_intranet_action('ops.anomalies','read')AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()AND public.can_intranet_action_for(p.id,'ops.anomalies','read')AND public.can_intranet_action_for(p.id,'ops.anomalies','update');
$$;
CREATE OR REPLACE FUNCTION public.get_ops_anomaly(p_id uuid)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 SELECT to_jsonb(a)||jsonb_build_object('owner_name',trim(concat_ws(' ',owner.first_name,owner.last_name)),'creator_name',trim(concat_ws(' ',creator.first_name,creator.last_name)),'resolver_name',trim(concat_ws(' ',resolver.first_name,resolver.last_name)),'closer_name',trim(concat_ws(' ',closer.first_name,closer.last_name)))INTO result FROM public.anomalies a LEFT JOIN public.profiles owner ON owner.id=a.owner_id LEFT JOIN public.profiles creator ON creator.id=a.created_by LEFT JOIN public.profiles resolver ON resolver.id=a.resolved_by LEFT JOIN public.profiles closer ON closer.id=a.closed_by WHERE a.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_ops_anomalies(p_search text DEFAULT '',p_status text DEFAULT 'active',p_source text DEFAULT 'all',p_team text DEFAULT 'all',p_view text DEFAULT 'all',p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 IF p_status IS NULL OR p_status NOT IN('active','all','archived','open','investigating','action_required','resolved','closed')OR p_view IS NULL OR p_view NOT IN('all','mine','overdue')OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_ops_anomaly_filter' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT a.*,trim(concat_ws(' ',p.first_name,p.last_name))AS owner_name FROM public.anomalies a LEFT JOIN public.profiles p ON p.id=a.owner_id WHERE(CASE WHEN p_status='archived'THEN a.archived_at IS NOT NULL ELSE a.archived_at IS NULL END)AND(p_status IN('all','archived')OR p_status='active'AND a.status<>'closed'OR a.status=p_status)AND(p_source='all'OR a.source=p_source)AND(p_team='all'OR a.team=p_team)AND(p_view='all'OR p_view='mine'AND a.owner_id=auth.uid()OR p_view='overdue'AND a.status NOT IN('resolved','closed')AND isfinite(a.due_at)AND a.due_at<now())AND concat_ws(' ',a.reference,a.title,a.type,a.description,a.category)ILIKE '%'||left(coalesce(p_search,''),200)||'%'ORDER BY a.created_at DESC,a.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.get_ops_anomaly_stats(p_page text DEFAULT 'ops.anomalies')RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE observed_at timestamptz:=clock_timestamp();BEGIN
 IF p_page IS NULL OR p_page NOT IN('ops.anomalies','ops.overview','direction.overview')OR NOT public.can_intranet_action(p_page,'read')THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT jsonb_build_object('active',count(*)FILTER(WHERE status<>'closed'),'open',count(*)FILTER(WHERE status='open'),'working',count(*)FILTER(WHERE status IN('investigating','action_required')),'awaiting_review',count(*)FILTER(WHERE status='resolved'),'overdue',count(*)FILTER(WHERE status NOT IN('resolved','closed')AND isfinite(due_at)AND due_at<now()),'critical',count(*)FILTER(WHERE severity='critical'AND status<>'closed'),'closed',count(*)FILTER(WHERE status='closed'),'dismissed',count(*)FILTER(WHERE status='closed'AND closure_kind='dismissed'),'avg_resolution_hours',avg(extract(epoch FROM(resolved_at-created_at))/3600)FILTER(WHERE status='closed'AND closure_kind='resolved'AND closed_by IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at),'duration_samples',count(*)FILTER(WHERE status='closed'AND closure_kind='resolved'AND closed_by IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at))FROM public.anomalies WHERE archived_at IS NULL AND test_account=public.intranet_is_test_mode());
END;$$;
CREATE OR REPLACE FUNCTION public.list_ops_anomaly_events(p_id uuid,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')OR NOT EXISTS(SELECT 1 FROM public.anomalies WHERE id=p_id)THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_ops_anomaly_page' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT e.*,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM public.anomaly_events e LEFT JOIN public.profiles p ON p.id=e.performed_by WHERE e.anomaly_id=p_id ORDER BY e.created_at DESC,e.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.list_ops_anomaly_notifications(p_id uuid DEFAULT NULL,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('ops.anomalies','read')THEN RAISE EXCEPTION 'ops_anomaly_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_ops_anomaly_page' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT n.*,a.reference,trim(concat_ws(' ',p.first_name,p.last_name))AS recipient_name FROM public.anomaly_notifications n JOIN public.anomalies a ON a.id=n.anomaly_id LEFT JOIN public.profiles p ON p.id=n.recipient_id WHERE p_id IS NULL OR n.anomaly_id=p_id ORDER BY n.sent_at DESC,n.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.sent_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY sent_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.add_ops_anomaly_comment(p_id uuid,p_message text)RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result uuid;BEGIN INSERT INTO public.anomaly_events(anomaly_id,kind,message)VALUES(p_id,'comment',p_message)RETURNING id INTO result;RETURN result;END;$$;
REVOKE ALL ON FUNCTION public.guard_ops_anomaly_write(),public.guard_ops_anomaly_event(),public.log_ops_anomaly_write(),public.notify_anomaly(public.anomalies,text,text),public.enqueue_ops_anomaly_notification(public.anomalies,text,text),public.send_anomaly_reminders(),public.log_anomaly_change(),public.log_anomaly_created(),public.anomaly_assignment_notify()FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.send_anomaly_reminders()TO service_role;
REVOKE ALL ON FUNCTION public.can_read_ops_anomaly(public.anomalies),public.create_ops_anomaly(uuid,jsonb),public.update_ops_anomaly(uuid,bigint,jsonb),public.transition_ops_anomaly(uuid,bigint,text,text),public.list_ops_anomaly_people(),public.get_ops_anomaly(uuid),public.list_ops_anomalies(text,text,text,text,text,integer),public.get_ops_anomaly_stats(text),public.list_ops_anomaly_events(uuid,integer),public.list_ops_anomaly_notifications(uuid,integer),public.add_ops_anomaly_comment(uuid,text)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_read_ops_anomaly(public.anomalies),public.create_ops_anomaly(uuid,jsonb),public.update_ops_anomaly(uuid,bigint,jsonb),public.transition_ops_anomaly(uuid,bigint,text,text),public.list_ops_anomaly_people(),public.get_ops_anomaly(uuid),public.list_ops_anomalies(text,text,text,text,text,integer),public.get_ops_anomaly_stats(text),public.list_ops_anomaly_events(uuid,integer),public.list_ops_anomaly_notifications(uuid,integer),public.add_ops_anomaly_comment(uuid,text)TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
