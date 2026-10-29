-- One quality dataset serves supplier alerts and formal audit non-conformities.
UPDATE public.intranet_business_tables SET page_ids=ARRAY['supplier.alerts','audit.nonconformities']WHERE table_name='quality_alerts';
UPDATE public.intranet_business_tables SET read_page_ids=ARRAY(SELECT DISTINCT p FROM unnest(read_page_ids||ARRAY['supplier.alerts','audit.nonconformities'])p)WHERE table_name IN('suppliers','products');
ALTER TABLE public.quality_alerts
 ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS is_nonconformity boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS approval_levels integer NOT NULL DEFAULT 2 CHECK(approval_levels IN(1,2)),
 ADD COLUMN IF NOT EXISTS legacy_record boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS origin_page text,
 ADD COLUMN IF NOT EXISTS creation_key uuid,
 ADD COLUMN IF NOT EXISTS creation_request jsonb,
 ADD COLUMN IF NOT EXISTS corrective_action text,
 ADD COLUMN IF NOT EXISTS corrective_due_date date,
 ADD COLUMN IF NOT EXISTS evidence text,
 ADD COLUMN IF NOT EXISTS document_ids uuid[] NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS first_reviewer uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
 ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS closed_at timestamptz,
 ADD COLUMN IF NOT EXISTS archived_at timestamptz,
 ADD COLUMN IF NOT EXISTS change_note text;
ALTER TABLE public.quality_alerts ALTER COLUMN is_nonconformity SET DEFAULT false,ALTER COLUMN approval_levels SET DEFAULT 1,ALTER COLUMN legacy_record SET DEFAULT false;
ALTER TABLE public.quality_alerts DROP CONSTRAINT IF EXISTS quality_alerts_status_check;
ALTER TABLE public.quality_alerts ADD CONSTRAINT quality_alerts_status_check CHECK(status IN('open','investigating','resolved','reviewed','closed'));
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.quality_alerts;
WITH modes AS(SELECT a.id,coalesce((SELECT p.test_account FROM public.profiles p WHERE p.id=a.reported_by),(SELECT p.test_account FROM public.profiles p WHERE p.id=a.assigned_to),false)AS mode FROM public.quality_alerts a)
UPDATE public.quality_alerts a SET test_account=m.mode FROM modes m WHERE a.id=m.id AND a.test_account IS DISTINCT FROM m.mode;
CREATE UNIQUE INDEX quality_alert_creation_retry ON public.quality_alerts(reported_by,creation_key)WHERE creation_key IS NOT NULL;
CREATE INDEX quality_alert_queue ON public.quality_alerts(test_account,is_nonconformity,status,created_at DESC);
GRANT SELECT,INSERT,UPDATE ON public.quality_alerts TO authenticated;
GRANT ALL ON public.quality_alerts TO service_role;
CREATE OR REPLACE FUNCTION public.quality_action_for(p_actor uuid,p_action text)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action_for(p_actor,'supplier.alerts',p_action)OR public.can_intranet_action_for(p_actor,'audit.nonconformities',p_action);
$$;
REVOKE ALL ON FUNCTION public.quality_action_for(uuid,text)FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.quality_action(p_action text)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$SELECT public.quality_action_for(auth.uid(),p_action);$$;
CREATE OR REPLACE FUNCTION public.can_read_quality_alert(a public.quality_alerts)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$SELECT public.quality_action('read')AND a.test_account=public.intranet_is_test_mode();$$;
DROP POLICY IF EXISTS intranet_test_environment ON public.quality_alerts;
CREATE POLICY intranet_test_environment ON public.quality_alerts AS RESTRICTIVE FOR ALL TO authenticated USING(test_account=public.intranet_is_test_mode())WITH CHECK(test_account=public.intranet_is_test_mode());
DROP POLICY IF EXISTS intranet_read_boundary ON public.quality_alerts;
CREATE POLICY intranet_read_boundary ON public.quality_alerts AS RESTRICTIVE FOR SELECT TO authenticated USING(public.quality_action('read'));
DROP POLICY IF EXISTS intranet_update_boundary ON public.quality_alerts;
CREATE POLICY intranet_update_boundary ON public.quality_alerts AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.quality_action('read')AND(public.quality_action('update')OR public.quality_action('validate')OR public.quality_action('delete')))WITH CHECK(public.quality_action('read')AND(public.quality_action('update')OR public.quality_action('validate')OR public.quality_action('delete')));
CREATE POLICY quality_staff_read ON public.quality_alerts FOR SELECT TO authenticated USING(public.quality_action('read'));
CREATE POLICY quality_staff_create ON public.quality_alerts FOR INSERT TO authenticated WITH CHECK(public.quality_action('read')AND public.quality_action('create'));
CREATE POLICY quality_staff_update ON public.quality_alerts FOR UPDATE TO authenticated USING(public.quality_action('read')AND(public.quality_action('update')OR public.quality_action('validate')OR public.quality_action('delete')));
CREATE POLICY quality_no_physical_delete ON public.quality_alerts AS RESTRICTIVE FOR DELETE TO authenticated USING(false);

CREATE OR REPLACE FUNCTION public.check_quality_references()RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid()IS NULL OR auth.role()='service_role'THEN RETURN NEW;END IF;
 IF NEW.supplier_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id)AND NOT EXISTS(SELECT 1 FROM public.suppliers WHERE id=NEW.supplier_id)THEN RAISE EXCEPTION 'quality_supplier_forbidden' USING ERRCODE='42501';END IF;
 IF NEW.product_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.product_id IS DISTINCT FROM OLD.product_id)AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=NEW.product_id)THEN RAISE EXCEPTION 'quality_product_forbidden' USING ERRCODE='42501';END IF;
 IF NEW.product_id IS NOT NULL AND NEW.supplier_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.supplier_id IS DISTINCT FROM OLD.supplier_id)AND(SELECT supplier_id FROM public.products WHERE id=NEW.product_id)IS DISTINCT FROM NEW.supplier_id THEN RAISE EXCEPTION 'quality_product_supplier_mismatch' USING ERRCODE='22023';END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER quality_references BEFORE INSERT OR UPDATE OF supplier_id,product_id ON public.quality_alerts FOR EACH ROW EXECUTE FUNCTION public.check_quality_references();
CREATE OR REPLACE FUNCTION public.guard_quality_alert_write()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();before jsonb;after jsonb:=to_jsonb(NEW);manager boolean;claim boolean;changed boolean;review boolean;returning_for_changes boolean;required integer;field text;document uuid;
BEGIN
 IF actor IS NULL OR auth.role()='service_role'THEN IF TG_OP='UPDATE'THEN NEW.revision:=OLD.revision+1;ELSE NEW.revision:=1;END IF;RETURN NEW;END IF;
 IF NOT public.quality_action('read')THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 manager:=public.quality_action('validate');
 IF TG_OP='INSERT'THEN
  IF NEW.origin_page IS NULL OR NEW.origin_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(NEW.origin_page,'read')OR NOT public.can_intranet_action(NEW.origin_page,'create')THEN RAISE EXCEPTION 'quality_create_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.status IS DISTINCT FROM 'open'OR NEW.resolved_at IS NOT NULL OR NEW.resolved_by IS NOT NULL OR NEW.first_reviewer IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.closed_by IS NOT NULL OR NEW.closed_at IS NOT NULL OR NEW.archived_at IS NOT NULL OR NEW.resolution_notes IS NOT NULL THEN RAISE EXCEPTION 'quality_initial_state_required' USING ERRCODE='22023';END IF;
  NEW.reported_by:=actor;NEW.created_at:=clock_timestamp();NEW.test_account:=public.intranet_is_test_mode();NEW.revision:=1;NEW.legacy_record:=false;NEW.change_note:=NULL;
  IF NEW.origin_page='audit.nonconformities'THEN NEW.is_nonconformity:=true;END IF;
 ELSE
  before:=to_jsonb(OLD);changed:=NEW.status IS DISTINCT FROM OLD.status;
  review:=changed AND(OLD.status='resolved'AND NEW.status IN('reviewed','closed')OR OLD.status='reviewed'AND NEW.status='closed');
  returning_for_changes:=changed AND OLD.status IN('resolved','reviewed')AND NEW.status='investigating';
  IF OLD.test_account IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'quality_environment_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'quality_record_changed' USING ERRCODE='40001';END IF;
  FOREACH field IN ARRAY ARRAY['id','reported_by','created_at','test_account','legacy_record','origin_page','creation_key','creation_request','approval_levels']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'quality_identity_immutable' USING ERRCODE='42501';END IF;END LOOP;
  IF OLD.is_nonconformity AND NOT NEW.is_nonconformity THEN RAISE EXCEPTION 'quality_review_policy_cannot_decrease' USING ERRCODE='42501';END IF;
  IF NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
   IF NOT public.quality_action('delete')OR(actor IS DISTINCT FROM OLD.reported_by AND actor IS DISTINCT FROM OLD.assigned_to AND NOT manager)THEN RAISE EXCEPTION 'quality_archive_forbidden' USING ERRCODE='42501';END IF;
   IF OLD.status<>'closed'THEN RAISE EXCEPTION 'quality_close_before_archive' USING ERRCODE='55000';END IF;
   IF OLD.archived_at IS NOT NULL OR(after-ARRAY['archived_at','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['archived_at','revision','updated_at'])THEN RAISE EXCEPTION 'quality_archive_locked' USING ERRCODE='55000';END IF;
   NEW.archived_at:=clock_timestamp();NEW.updated_at:=clock_timestamp();RETURN NEW;
  END IF;
  IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'quality_archived' USING ERRCODE='55000';END IF;
  IF NOT public.quality_action(CASE WHEN review OR returning_for_changes THEN 'validate'ELSE 'update'END)THEN RAISE EXCEPTION 'quality_action_forbidden' USING ERRCODE='42501';END IF;
  IF(review OR returning_for_changes OR changed AND OLD.status='closed')AND OLD.is_nonconformity AND NOT public.can_intranet_action('audit.nonconformities','validate')THEN RAISE EXCEPTION 'quality_audit_review_required' USING ERRCODE='42501';END IF;
  IF review OR returning_for_changes THEN
   IF actor=OLD.reported_by OR actor=OLD.assigned_to OR actor=OLD.resolved_by OR(review AND OLD.status='reviewed'AND actor=OLD.first_reviewer)THEN RAISE EXCEPTION 'quality_distinct_reviewer_required' USING ERRCODE='42501';END IF;
  ELSE
   claim:=OLD.assigned_to IS NULL AND NEW.assigned_to=actor AND(after-ARRAY['assigned_to','revision','updated_at'])IS NOT DISTINCT FROM(before-ARRAY['assigned_to','revision','updated_at']);
   IF actor IS DISTINCT FROM OLD.reported_by AND actor IS DISTINCT FROM OLD.assigned_to AND NOT manager AND NOT coalesce(claim,false)THEN RAISE EXCEPTION 'quality_owner_forbidden' USING ERRCODE='42501';END IF;
  END IF;
  IF changed THEN
   IF(after-ARRAY['status','resolution_notes','resolved_at','resolved_by','first_reviewer','reviewed_at','closed_by','closed_at','change_note','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['status','resolution_notes','resolved_at','resolved_by','first_reviewer','reviewed_at','closed_by','closed_at','change_note','revision','updated_at'])THEN RAISE EXCEPTION 'quality_transition_content_changed' USING ERRCODE='22023';END IF;
   IF NOT(OLD.status='open'AND NEW.status='investigating'OR OLD.status='investigating'AND NEW.status='resolved'OR review OR returning_for_changes OR OLD.status='closed'AND NEW.status='investigating')THEN RAISE EXCEPTION 'invalid_quality_transition' USING ERRCODE='22023';END IF;
   IF NEW.status IN('investigating','resolved')AND NOT returning_for_changes AND OLD.status<>'closed'AND actor IS DISTINCT FROM OLD.assigned_to AND NOT manager THEN RAISE EXCEPTION 'quality_assignee_required' USING ERRCODE='42501';END IF;
   IF(NEW.status IN('resolved','reviewed','closed')OR returning_for_changes OR OLD.status='closed')AND length(btrim(coalesce(NEW.change_note,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'quality_decision_reason_required' USING ERRCODE='22023';END IF;
   IF OLD.status='closed'AND NOT manager THEN RAISE EXCEPTION 'quality_reopen_forbidden' USING ERRCODE='42501';END IF;
   IF NEW.status='resolved'THEN
    IF length(btrim(coalesce(NEW.resolution_notes,'')))NOT BETWEEN 1 AND 5000 OR(NEW.is_nonconformity AND(length(btrim(coalesce(NEW.corrective_action,'')))=0 OR(length(btrim(coalesce(NEW.evidence,'')))=0 AND cardinality(NEW.document_ids)=0)))THEN RAISE EXCEPTION 'quality_correction_evidence_required' USING ERRCODE='22023';END IF;
    NEW.resolved_by:=actor;NEW.resolved_at:=clock_timestamp();NEW.first_reviewer:=NULL;NEW.reviewed_at:=NULL;NEW.closed_by:=NULL;NEW.closed_at:=NULL;
   ELSIF review THEN
    IF greatest(OLD.approval_levels,coalesce((SELECT (definition->>'approvalLevels')::integer FROM public.intranet_modules WHERE page_id=CASE WHEN OLD.is_nonconformity THEN 'audit.nonconformities'ELSE 'supplier.alerts'END),1))=2 AND OLD.status='resolved'THEN
     IF NEW.status<>'reviewed'THEN RAISE EXCEPTION 'quality_first_review_required' USING ERRCODE='22023';END IF;
     NEW.first_reviewer:=actor;NEW.reviewed_at:=clock_timestamp();NEW.closed_by:=NULL;NEW.closed_at:=NULL;
    ELSE
     IF NEW.status<>'closed'OR(OLD.approval_levels=2 AND OLD.first_reviewer IS NULL)THEN RAISE EXCEPTION 'quality_final_review_required' USING ERRCODE='22023';END IF;
     NEW.first_reviewer:=OLD.first_reviewer;NEW.reviewed_at:=OLD.reviewed_at;NEW.closed_by:=actor;NEW.closed_at:=clock_timestamp();
    END IF;
    NEW.resolution_notes:=OLD.resolution_notes;NEW.resolved_at:=OLD.resolved_at;NEW.resolved_by:=OLD.resolved_by;
   ELSIF returning_for_changes OR OLD.status='closed'THEN
    NEW.resolution_notes:=NULL;NEW.resolved_at:=NULL;NEW.resolved_by:=NULL;NEW.first_reviewer:=NULL;NEW.reviewed_at:=NULL;NEW.closed_by:=NULL;NEW.closed_at:=NULL;
   ELSE NEW.resolution_notes:=OLD.resolution_notes;NEW.resolved_at:=OLD.resolved_at;NEW.resolved_by:=OLD.resolved_by;NEW.first_reviewer:=OLD.first_reviewer;NEW.reviewed_at:=OLD.reviewed_at;NEW.closed_by:=OLD.closed_by;NEW.closed_at:=OLD.closed_at;END IF;
  ELSE
   IF OLD.status NOT IN('open','investigating')THEN RAISE EXCEPTION 'quality_content_locked' USING ERRCODE='55000';END IF;
   FOREACH field IN ARRAY ARRAY['resolution_notes','resolved_at','resolved_by','first_reviewer','reviewed_at','closed_by','closed_at']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'quality_decision_metadata_immutable' USING ERRCODE='42501';END IF;END LOOP;
  END IF;
 END IF;
 SELECT (definition->>'approvalLevels')::integer INTO required FROM public.intranet_modules WHERE page_id=CASE WHEN NEW.is_nonconformity THEN 'audit.nonconformities'ELSE 'supplier.alerts'END;
 NEW.approval_levels:=greatest(coalesce(required,1),CASE WHEN TG_OP='UPDATE'THEN OLD.approval_levels ELSE 1 END);
 NEW.document_ids:=coalesce(NEW.document_ids,'{}');
 IF length(btrim(coalesce(NEW.title,'')))NOT BETWEEN 1 AND 255 OR length(btrim(coalesce(NEW.description,'')))NOT BETWEEN 1 AND 20000 OR length(coalesce(NEW.corrective_action,''))>10000 OR length(coalesce(NEW.evidence,''))>10000 OR length(coalesce(NEW.change_note,''))>5000 OR cardinality(NEW.document_ids)>20 OR array_ndims(NEW.document_ids)>1 OR array_position(NEW.document_ids,NULL)IS NOT NULL THEN RAISE EXCEPTION 'invalid_quality_alert' USING ERRCODE='22023';END IF;
 IF NEW.assigned_to IS NOT NULL AND(TG_OP='INSERT'OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.assigned_to AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.quality_action_for(p.id,'read')AND public.quality_action_for(p.id,'update'))THEN RAISE EXCEPTION 'quality_assignee_forbidden' USING ERRCODE='42501';END IF;
 FOREACH document IN ARRAY NEW.document_ids LOOP
  IF(TG_OP='INSERT'OR NOT document=ANY(OLD.document_ids))AND NOT EXISTS(SELECT 1 FROM public.intranet_drive_documents d WHERE d.id=document AND d.owner_id=actor AND d.test_account=NEW.test_account AND public.can_read_intranet_drive_document(d))THEN RAISE EXCEPTION 'quality_attachment_forbidden' USING ERRCODE='42501';END IF;
 END LOOP;
 NEW.title:=btrim(NEW.title);NEW.description:=btrim(NEW.description);NEW.updated_at:=clock_timestamp();RETURN NEW;
END;$$;
CREATE TRIGGER zz_quality_alert_guard BEFORE INSERT OR UPDATE ON public.quality_alerts FOR EACH ROW EXECUTE FUNCTION public.guard_quality_alert_write();

CREATE OR REPLACE FUNCTION public.can_read_intranet_drive_document(p public.intranet_drive_documents)RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_intranet_action('app.documents','read')AND EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid()AND coalesce(me.test_account,false)=p.test_account)
 AND((public.can_intranet_action(p.page_id,'read')AND(p.owner_id=auth.uid()OR p.classification='internal'OR public.can_intranet_action(p.page_id,'validate')))
 OR public.is_intranet_document_recipient(p.id)OR EXISTS(SELECT 1 FROM public.intranet_records r WHERE p.id=ANY(r.document_ids)AND public.can_read_intranet_record(r))
 OR EXISTS(SELECT 1 FROM public.quality_alerts a WHERE p.id=ANY(a.document_ids)AND public.can_read_quality_alert(a)));
$$;
CREATE TABLE public.quality_alert_comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),alert_id uuid NOT NULL REFERENCES public.quality_alerts(id),actor_id uuid NOT NULL REFERENCES public.profiles(id)DEFAULT auth.uid(),body text NOT NULL CHECK(length(btrim(body))BETWEEN 1 AND 5000),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.quality_alert_comments ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.quality_alert_comments TO authenticated;
GRANT ALL ON public.quality_alert_comments TO service_role;
CREATE INDEX quality_comments_parent ON public.quality_alert_comments(alert_id,created_at);
CREATE POLICY quality_comments_read ON public.quality_alert_comments FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.quality_alerts a WHERE a.id=alert_id));
CREATE POLICY quality_comments_add ON public.quality_alert_comments FOR INSERT TO authenticated WITH CHECK(actor_id=auth.uid()AND(public.quality_action('update')OR public.quality_action('validate'))AND EXISTS(SELECT 1 FROM public.quality_alerts a WHERE a.id=alert_id AND a.archived_at IS NULL AND a.status<>'closed'));
CREATE TRIGGER quality_comment_stamp BEFORE INSERT ON public.quality_alert_comments FOR EACH ROW EXECUTE FUNCTION public.stamp_support_note();
-- stamp_support_note only reads NEW.body and NEW.created_at and is shared with append-only internal notes.

CREATE OR REPLACE FUNCTION public.create_quality_alert(p_page text,p_key uuid,p_payload jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE prior jsonb;request jsonb;result jsonb;columns text;values_sql text;BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')OR NOT public.can_intranet_action(p_page,'create')THEN RAISE EXCEPTION 'quality_create_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'OR octet_length(p_payload::text)>100000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload)k WHERE k<>ALL(ARRAY['title','description','severity','supplier_id','product_id','assigned_to','is_nonconformity','corrective_action','corrective_due_date','evidence','document_ids']))THEN RAISE EXCEPTION 'invalid_quality_payload' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('quality-create:'||auth.uid()::text||p_key::text,0));
 SELECT to_jsonb(a)INTO prior FROM public.quality_alerts a WHERE a.reported_by=auth.uid()AND a.creation_key=p_key;
 IF FOUND THEN IF prior->'creation_request'IS DISTINCT FROM p_payload OR prior->>'origin_page'IS DISTINCT FROM p_page THEN RAISE EXCEPTION 'quality_creation_key_conflict' USING ERRCODE='40001';END IF;RETURN prior;END IF;
 request:=jsonb_build_object('severity','medium')||p_payload||jsonb_build_object('reported_by',auth.uid(),'origin_page',p_page,'creation_key',p_key,'creation_request',p_payload);
 SELECT string_agg(quote_ident(k),','ORDER BY k),string_agg('v.'||quote_ident(k),','ORDER BY k)INTO columns,values_sql FROM jsonb_object_keys(request)k;
 EXECUTE format('INSERT INTO public.quality_alerts(%s)SELECT %s FROM jsonb_populate_record(NULL::public.quality_alerts,$1)v RETURNING to_jsonb(quality_alerts.*)',columns,values_sql)INTO result USING request;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.update_quality_alert(p_page text,p_id uuid,p_revision bigint,p_patch jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;fields text;BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')OR NOT public.can_intranet_action(p_page,'update')THEN RAISE EXCEPTION 'quality_update_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR jsonb_typeof(p_patch)IS DISTINCT FROM 'object'OR p_patch='{}'::jsonb OR octet_length(p_patch::text)>100000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_patch)k WHERE k<>ALL(ARRAY['title','description','severity','supplier_id','product_id','assigned_to','is_nonconformity','corrective_action','corrective_due_date','evidence','document_ids','change_note']))THEN RAISE EXCEPTION 'invalid_quality_patch' USING ERRCODE='22023';END IF;
 SELECT string_agg(format('%I=v.%I',k,k),','ORDER BY k)INTO fields FROM jsonb_object_keys(p_patch)k;
 EXECUTE format('UPDATE public.quality_alerts a SET %s,revision=a.revision+1 FROM jsonb_populate_record(NULL::public.quality_alerts,$1)v WHERE a.id=$2 AND a.revision=$3 RETURNING to_jsonb(a.*)',fields)INTO result USING p_patch,p_id,p_revision;
 IF result IS NULL THEN RAISE EXCEPTION 'quality_record_changed' USING ERRCODE='40001';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.transition_quality_alert(p_page text,p_id uuid,p_revision bigint,p_action text,p_note text DEFAULT '')RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE a public.quality_alerts%ROWTYPE;next_status text;result jsonb;BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')OR p_action IS NULL OR p_action NOT IN('investigate','resolve','approve','return','reopen','archive')OR NOT public.can_intranet_action(p_page,CASE WHEN p_action='archive'THEN 'delete'WHEN p_action IN('approve','return')THEN 'validate'ELSE 'update'END)THEN RAISE EXCEPTION 'quality_transition_forbidden' USING ERRCODE='42501';END IF;
 SELECT *INTO a FROM public.quality_alerts WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_revision IS NULL OR a.revision<>p_revision THEN RAISE EXCEPTION 'quality_record_changed' USING ERRCODE='40001';END IF;
 IF p_action='archive'THEN UPDATE public.quality_alerts SET archived_at=clock_timestamp(),revision=revision+1 WHERE id=p_id RETURNING to_jsonb(quality_alerts.*)INTO result;RETURN result;END IF;
 next_status:=CASE p_action WHEN 'investigate'THEN 'investigating'WHEN 'resolve'THEN 'resolved'WHEN 'approve'THEN CASE WHEN a.status='resolved'AND greatest(a.approval_levels,coalesce((SELECT (definition->>'approvalLevels')::integer FROM public.intranet_modules WHERE page_id=CASE WHEN a.is_nonconformity THEN 'audit.nonconformities'ELSE 'supplier.alerts'END),1))=2 THEN 'reviewed'ELSE 'closed'END WHEN 'return'THEN 'investigating'WHEN 'reopen'THEN 'investigating'END;
 UPDATE public.quality_alerts SET status=next_status,resolution_notes=CASE WHEN p_action='resolve'THEN nullif(btrim(p_note),'')ELSE resolution_notes END,change_note=nullif(btrim(p_note),''),revision=revision+1 WHERE id=p_id RETURNING to_jsonb(quality_alerts.*)INTO result;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_quality_people(p_page text)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',trim(concat_ws(' ',p.first_name,p.last_name)))ORDER BY p.first_name,p.last_name),'[]'::jsonb)FROM public.profiles p WHERE p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()AND public.quality_action_for(p.id,'read')AND public.quality_action_for(p.id,'update'));
END;$$;
CREATE OR REPLACE FUNCTION public.list_quality_alerts(p_page text,p_kind text DEFAULT 'all',p_search text DEFAULT '',p_status text DEFAULT 'active',p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 IF p_kind IS NULL OR p_kind NOT IN('all','formal','alert')OR p_status IS NULL OR p_status NOT IN('active','all','archived','open','investigating','resolved','reviewed','closed')OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_quality_filter' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT a.*,s.name AS supplier_name,p.name AS product_name,trim(concat_ws(' ',owner.first_name,owner.last_name))AS assignee_name FROM public.quality_alerts a LEFT JOIN public.suppliers s ON s.id=a.supplier_id LEFT JOIN public.products p ON p.id=a.product_id LEFT JOIN public.profiles owner ON owner.id=a.assigned_to
 WHERE(p_kind='all'OR a.is_nonconformity=(p_kind='formal'))AND(CASE WHEN p_status='archived'THEN a.archived_at IS NOT NULL ELSE a.archived_at IS NULL END)AND(p_status IN('all','archived')OR p_status='active'AND a.status<>'closed'OR a.status=p_status)
 AND(concat_ws(' ',a.title,a.description,s.name,p.name)ILIKE '%'||left(coalesce(p_search,''),200)||'%')ORDER BY a.created_at DESC,a.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.get_quality_alert(p_page text,p_id uuid)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 SELECT to_jsonb(a)||jsonb_build_object('supplier_name',s.name,'product_name',p.name,'assignee_name',trim(concat_ws(' ',owner.first_name,owner.last_name)),'first_reviewer_name',trim(concat_ws(' ',reviewer.first_name,reviewer.last_name)),'closed_by_name',trim(concat_ws(' ',closer.first_name,closer.last_name)))INTO result FROM public.quality_alerts a LEFT JOIN public.suppliers s ON s.id=a.supplier_id LEFT JOIN public.products p ON p.id=a.product_id LEFT JOIN public.profiles owner ON owner.id=a.assigned_to LEFT JOIN public.profiles reviewer ON reviewer.id=a.first_reviewer LEFT JOIN public.profiles closer ON closer.id=a.closed_by WHERE a.id=p_id;
 IF result IS NULL THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.get_quality_stats(p_page text,p_kind text DEFAULT 'all')RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE observed_at timestamptz:=clock_timestamp();BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities','supplier.overview','audit.overview','direction.overview')OR NOT public.can_intranet_action(p_page,'read')THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 IF p_kind IS NULL OR p_kind NOT IN('all','formal','alert')THEN RAISE EXCEPTION 'invalid_quality_filter' USING ERRCODE='22023';END IF;
 RETURN(SELECT jsonb_build_object('total',count(*),'active',count(*)FILTER(WHERE status<>'closed'),'open',count(*)FILTER(WHERE status='open'),'investigating',count(*)FILTER(WHERE status='investigating'),'awaiting_review',count(*)FILTER(WHERE status IN('resolved','reviewed')),'closed',count(*)FILTER(WHERE status='closed'),'critical',count(*)FILTER(WHERE severity='critical'AND status<>'closed'),
 'avg_correction_hours',avg(extract(epoch FROM(resolved_at-created_at))/3600)FILTER(WHERE status='closed'AND closed_by IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at),'duration_samples',count(*)FILTER(WHERE status='closed'AND closed_by IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at))FROM public.quality_alerts WHERE archived_at IS NULL AND test_account=public.intranet_is_test_mode()AND(p_kind='all'OR is_nonconformity=(p_kind='formal')));
END;$$;
CREATE OR REPLACE FUNCTION public.add_quality_comment(p_page text,p_id uuid,p_body text)RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result uuid;BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')OR NOT(public.can_intranet_action(p_page,'update')OR public.can_intranet_action(p_page,'validate'))THEN RAISE EXCEPTION 'quality_comment_forbidden' USING ERRCODE='42501';END IF;
 INSERT INTO public.quality_alert_comments(alert_id,body)VALUES(p_id,p_body)RETURNING id INTO result;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.list_quality_timeline(p_page text,p_id uuid,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF p_page IS NULL OR p_page NOT IN('supplier.alerts','audit.nonconformities')OR NOT public.can_intranet_action(p_page,'read')OR NOT EXISTS(SELECT 1 FROM public.quality_alerts WHERE id=p_id)THEN RAISE EXCEPTION 'quality_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_quality_page' USING ERRCODE='22023';END IF;
 RETURN(WITH events AS(SELECT h.id,h.action,h.before_state,h.after_state,h.created_at,h.actor_id,h.after_state->>'change_note'AS note FROM public.intranet_business_history h WHERE h.table_name='quality_alerts'AND h.row_id=p_id::text
 UNION ALL SELECT c.id,'comment',NULL::jsonb,NULL::jsonb,c.created_at,c.actor_id,c.body FROM public.quality_alert_comments c WHERE c.alert_id=p_id),selected AS(SELECT e.*,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM events e LEFT JOIN public.profiles p ON p.id=e.actor_id ORDER BY e.created_at DESC,e.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(x)ORDER BY x.created_at DESC,x.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)x),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.notify_quality_change()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE recipient uuid;url text;BEGIN
 recipient:=CASE WHEN TG_OP='INSERT'OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN NEW.assigned_to WHEN NEW.status IS DISTINCT FROM OLD.status THEN NEW.reported_by END;
 IF recipient IS NOT NULL AND recipient IS DISTINCT FROM auth.uid()AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=recipient AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.quality_action_for(p.id,'read'))THEN
 url:=CASE WHEN public.can_intranet_action_for(recipient,'supplier.alerts','read')THEN '/pole/supplier/alerts'ELSE '/pole/audit/nonconformities'END||'?alert='||NEW.id::text;
 INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(recipient,'Suivi qualité mis à jour',NEW.title,'info',url,jsonb_build_object('source','quality_alert','alert_id',NEW.id));END IF;RETURN NEW;
END;$$;
CREATE TRIGGER quality_notifications AFTER INSERT OR UPDATE ON public.quality_alerts FOR EACH ROW EXECUTE FUNCTION public.notify_quality_change();
INSERT INTO public.intranet_business_history(table_name,row_id,actor_id,action,after_state,test_account)SELECT 'quality_alerts',a.id::text,NULL,'imported',to_jsonb(a),a.test_account FROM public.quality_alerts a WHERE NOT EXISTS(SELECT 1 FROM public.intranet_business_history h WHERE h.table_name='quality_alerts'AND h.row_id=a.id::text);
REVOKE ALL ON FUNCTION public.check_quality_references(),public.guard_quality_alert_write(),public.notify_quality_change()FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.quality_action(text),public.can_read_quality_alert(public.quality_alerts),public.create_quality_alert(text,uuid,jsonb),public.update_quality_alert(text,uuid,bigint,jsonb),public.transition_quality_alert(text,uuid,bigint,text,text),public.list_quality_people(text),public.list_quality_alerts(text,text,text,text,integer),public.get_quality_alert(text,uuid),public.get_quality_stats(text,text),public.add_quality_comment(text,uuid,text),public.list_quality_timeline(text,uuid,integer)FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.quality_action(text),public.can_read_quality_alert(public.quality_alerts),public.create_quality_alert(text,uuid,jsonb),public.update_quality_alert(text,uuid,bigint,jsonb),public.transition_quality_alert(text,uuid,bigint,text,text),public.list_quality_people(text),public.list_quality_alerts(text,text,text,text,integer),public.get_quality_alert(text,uuid),public.get_quality_stats(text,text),public.add_quality_comment(text,uuid,text),public.list_quality_timeline(text,uuid,integer)TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
