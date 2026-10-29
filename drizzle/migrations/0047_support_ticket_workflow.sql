-- Support reads customer context without receiving commercial write permissions.
ALTER TABLE public.intranet_business_tables ADD COLUMN read_page_ids text[] NOT NULL DEFAULT '{}';
UPDATE public.intranet_business_tables SET read_page_ids=ARRAY['support.overview','support.tickets','support.customer-success','support.monitoring','support.onboarding','support.compliance']WHERE table_name='user_accounts';
CREATE OR REPLACE FUNCTION public.can_intranet_table_action(p_table text,p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE config public.intranet_business_tables%ROWTYPE;
BEGIN
 SELECT *INTO config FROM public.intranet_business_tables WHERE table_name=p_table;
 IF NOT FOUND OR p_action IS NULL OR p_action NOT IN('read','create','update','delete','publish','validate','administer')THEN RETURN false;END IF;
 IF config.shared_platform AND NOT public.is_intranet_actor()THEN RETURN true;END IF;
 IF p_table IN('auth_logs','edge_function_logs','audit_logs')AND p_action='create'THEN RETURN public.can_intranet_action('app.dashboard','read');END IF;
 IF p_table IN('tech_requests','tech_request_comments','tech_request_events')AND p_action='create'THEN RETURN public.can_intranet_action('app.dashboard','read');END IF;
 IF p_table='publications'AND p_action<>'read'THEN RETURN public.can_intranet_action('data.reports',p_action);END IF;
 RETURN EXISTS(SELECT 1 FROM unnest(config.page_ids||CASE WHEN p_action='read'THEN config.read_page_ids ELSE '{}'::text[]END)p WHERE public.can_intranet_action(p,p_action));
END;$$;

ALTER TABLE public.support_tickets
 ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS archived_at timestamptz,
 ADD COLUMN IF NOT EXISTS closed_at timestamptz,
 ADD COLUMN IF NOT EXISTS creation_key uuid,
 ADD COLUMN IF NOT EXISTS creation_request jsonb,
 ADD COLUMN IF NOT EXISTS change_note text;
DROP TRIGGER IF EXISTS zz_intranet_business_guard ON public.support_tickets;
WITH classified AS(SELECT t.id,coalesce(
 (SELECT p.test_account FROM public.profiles p WHERE p.id=t.created_by),
 (SELECT coalesce((to_jsonb(a)->>'test_account')::boolean,p.test_account)FROM public.user_accounts a LEFT JOIN public.profiles p ON p.id=a.user_id WHERE a.id=t.user_account_id),
 (SELECT p.test_account FROM public.profiles p WHERE p.id=t.assigned_to),false)AS mode FROM public.support_tickets t)
UPDATE public.support_tickets t SET test_account=c.mode FROM classified c WHERE t.id=c.id AND t.test_account IS DISTINCT FROM c.mode;
GRANT SELECT,INSERT,UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
CREATE UNIQUE INDEX support_ticket_creation_retry ON public.support_tickets(created_by,creation_key)WHERE creation_key IS NOT NULL;
CREATE INDEX support_ticket_queue ON public.support_tickets(test_account,status,created_at DESC);
DROP POLICY IF EXISTS intranet_test_environment ON public.support_tickets;
CREATE POLICY intranet_test_environment ON public.support_tickets AS RESTRICTIVE FOR ALL TO authenticated USING(NOT public.is_intranet_actor()OR test_account=public.intranet_is_test_mode())WITH CHECK(NOT public.is_intranet_actor()OR test_account=public.intranet_is_test_mode());
DROP POLICY IF EXISTS intranet_read_boundary ON public.support_tickets;
CREATE POLICY intranet_read_boundary ON public.support_tickets AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT public.is_intranet_actor()OR public.can_intranet_action('support.tickets','read'));
DROP POLICY IF EXISTS intranet_update_boundary ON public.support_tickets;
CREATE POLICY intranet_update_boundary ON public.support_tickets AS RESTRICTIVE FOR UPDATE TO authenticated USING(NOT public.is_intranet_actor()OR(public.can_intranet_action('support.tickets','read')AND(public.can_intranet_action('support.tickets','update')OR public.can_intranet_action('support.tickets','delete'))))WITH CHECK(NOT public.is_intranet_actor()OR(public.can_intranet_action('support.tickets','read')AND(public.can_intranet_action('support.tickets','update')OR public.can_intranet_action('support.tickets','delete'))));
CREATE POLICY support_staff_read ON public.support_tickets FOR SELECT TO authenticated USING(public.is_intranet_actor()AND public.can_intranet_action('support.tickets','read'));
CREATE POLICY support_staff_create ON public.support_tickets FOR INSERT TO authenticated WITH CHECK(public.is_intranet_actor()AND public.can_intranet_action('support.tickets','read')AND public.can_intranet_action('support.tickets','create'));
CREATE POLICY support_staff_update ON public.support_tickets FOR UPDATE TO authenticated USING(public.is_intranet_actor()AND public.can_intranet_action('support.tickets','read')AND(public.can_intranet_action('support.tickets','update')OR public.can_intranet_action('support.tickets','delete')));
CREATE POLICY support_no_physical_delete ON public.support_tickets AS RESTRICTIVE FOR DELETE TO authenticated USING(false);

-- Validate a newly selected client through the caller's original row policies. An unchanged
-- historical link must not prevent the assigned agent from resolving a case.
CREATE OR REPLACE FUNCTION public.check_support_account_link()RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid()IS NOT NULL AND auth.role()IS DISTINCT FROM 'service_role'AND public.is_intranet_actor()AND NEW.user_account_id IS NOT NULL AND(TG_OP='INSERT'OR NEW.user_account_id IS DISTINCT FROM OLD.user_account_id)AND NOT EXISTS(SELECT 1 FROM public.user_accounts a WHERE a.id=NEW.user_account_id)THEN RAISE EXCEPTION 'support_account_forbidden' USING ERRCODE='42501';END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER support_account_link_guard BEFORE INSERT OR UPDATE OF user_account_id ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.check_support_account_link();

CREATE OR REPLACE FUNCTION public.guard_support_ticket_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid();manager boolean;claim boolean;before jsonb;after jsonb:=to_jsonb(NEW);field text;status_change boolean;archiving boolean;
BEGIN
 -- Trusted synchronization remains a service operation; customer requests start open.
 IF actor IS NULL OR auth.role()='service_role'THEN IF TG_OP='UPDATE'THEN NEW.revision:=OLD.revision+1;ELSE NEW.revision:=1;END IF;RETURN NEW;END IF;
 IF NOT public.is_intranet_actor()THEN
  IF TG_OP<>'INSERT'THEN RAISE EXCEPTION 'support_staff_update_required' USING ERRCODE='42501';END IF;
  IF NEW.status IS DISTINCT FROM 'open'OR NEW.assigned_to IS NOT NULL OR NEW.archived_at IS NOT NULL OR NEW.resolved_at IS NOT NULL OR NEW.closed_at IS NOT NULL OR NEW.resolution IS NOT NULL OR NEW.platform_id IS NOT NULL OR NEW.platform_synced_at IS NOT NULL OR NEW.priority IS NULL OR NEW.priority NOT IN('low','medium','high','critical')OR NEW.category IS NULL OR NEW.category NOT IN('general','billing','technical','delivery','quality')OR length(btrim(coalesce(NEW.subject,'')))NOT BETWEEN 1 AND 255 OR length(btrim(coalesce(NEW.description,'')))NOT BETWEEN 1 AND 20000 THEN RAISE EXCEPTION 'support_customer_creation_invalid' USING ERRCODE='22023';END IF;
  IF NEW.user_account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.user_accounts a WHERE a.id=NEW.user_account_id AND a.user_id=actor)THEN RAISE EXCEPTION 'support_customer_account_forbidden' USING ERRCODE='42501';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.updated_at:=clock_timestamp();NEW.test_account:=public.intranet_is_test_mode();NEW.revision:=1;NEW.change_note:=NULL;RETURN NEW;
 END IF;
 IF NOT public.can_intranet_action('support.tickets','read')THEN RAISE EXCEPTION 'support_forbidden' USING ERRCODE='42501';END IF;
 manager:=public.has_role(actor,'admin')OR public.can_intranet_action('support.tickets','validate');
 IF TG_OP='INSERT'THEN
  IF NOT public.can_intranet_action('support.tickets','create')THEN RAISE EXCEPTION 'support_create_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.status IS DISTINCT FROM 'open'OR NEW.archived_at IS NOT NULL OR NEW.resolved_at IS NOT NULL OR NEW.closed_at IS NOT NULL OR nullif(btrim(NEW.resolution),'')IS NOT NULL OR NEW.platform_id IS NOT NULL OR NEW.platform_synced_at IS NOT NULL THEN RAISE EXCEPTION 'support_initial_state_required' USING ERRCODE='22023';END IF;
  NEW.created_by:=actor;NEW.created_at:=clock_timestamp();NEW.test_account:=public.intranet_is_test_mode();NEW.revision:=1;NEW.change_note:=NULL;
 ELSE
  before:=to_jsonb(OLD);status_change:=NEW.status IS DISTINCT FROM OLD.status;archiving:=NEW.archived_at IS DISTINCT FROM OLD.archived_at;
  IF OLD.test_account IS DISTINCT FROM public.intranet_is_test_mode()THEN RAISE EXCEPTION 'support_environment_forbidden' USING ERRCODE='42501';END IF;
  IF NEW.revision IS DISTINCT FROM OLD.revision+1 THEN RAISE EXCEPTION 'support_record_changed' USING ERRCODE='40001';END IF;
  FOREACH field IN ARRAY ARRAY['id','created_by','created_at','test_account','platform_id','platform_synced_at','creation_key','creation_request']LOOP IF after->field IS DISTINCT FROM before->field THEN RAISE EXCEPTION 'support_identity_immutable' USING ERRCODE='42501';END IF;END LOOP;
  claim:=OLD.assigned_to IS NULL AND NEW.assigned_to=actor AND(after-ARRAY['assigned_to','revision','updated_at'])IS NOT DISTINCT FROM(before-ARRAY['assigned_to','revision','updated_at']);
  IF actor IS DISTINCT FROM OLD.created_by AND actor IS DISTINCT FROM OLD.assigned_to AND NOT manager AND NOT coalesce(claim,false)THEN RAISE EXCEPTION 'support_owner_forbidden' USING ERRCODE='42501';END IF;
  IF archiving THEN
   IF NOT public.can_intranet_action('support.tickets','delete')THEN RAISE EXCEPTION 'support_archive_forbidden' USING ERRCODE='42501';END IF;
   IF OLD.archived_at IS NOT NULL OR(after-ARRAY['archived_at','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['archived_at','revision','updated_at'])THEN RAISE EXCEPTION 'support_archive_locked' USING ERRCODE='55000';END IF;
   NEW.archived_at:=clock_timestamp();NEW.updated_at:=clock_timestamp();RETURN NEW;
  ELSE
   IF OLD.archived_at IS NOT NULL THEN RAISE EXCEPTION 'support_archived' USING ERRCODE='55000';END IF;
   IF NOT public.can_intranet_action('support.tickets','update')THEN RAISE EXCEPTION 'support_update_forbidden' USING ERRCODE='42501';END IF;
   IF OLD.status IN('resolved','closed')THEN
    IF NOT status_change OR NOT(OLD.status='resolved'AND NEW.status IN('closed','open')OR OLD.status='closed'AND NEW.status='open')THEN RAISE EXCEPTION 'support_resolution_locked' USING ERRCODE='55000';END IF;
    IF NEW.status='open'AND(length(btrim(coalesce(NEW.change_note,'')))=0 OR(OLD.status='closed'AND NOT manager))THEN RAISE EXCEPTION 'support_reopen_reason_required' USING ERRCODE='42501';END IF;
   END IF;
   IF status_change THEN
    IF NOT(OLD.status='open'AND NEW.status IN('in_progress','pending','resolved')OR OLD.status='in_progress'AND NEW.status IN('pending','resolved')OR OLD.status='pending'AND NEW.status IN('in_progress','resolved')OR OLD.status='resolved'AND NEW.status IN('closed','open')OR OLD.status='closed'AND NEW.status='open')THEN RAISE EXCEPTION 'invalid_support_transition' USING ERRCODE='22023';END IF;
    IF(after-ARRAY['status','resolution','resolved_at','closed_at','change_note','revision','updated_at'])IS DISTINCT FROM(before-ARRAY['status','resolution','resolved_at','closed_at','change_note','revision','updated_at'])THEN RAISE EXCEPTION 'support_transition_content_changed' USING ERRCODE='22023';END IF;
    IF actor IS DISTINCT FROM OLD.assigned_to AND NOT manager THEN RAISE EXCEPTION 'support_assignee_required' USING ERRCODE='42501';END IF;
    IF NEW.status='resolved'THEN
     IF length(btrim(coalesce(NEW.resolution,'')))NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'support_resolution_required' USING ERRCODE='22023';END IF;
     NEW.resolution:=btrim(NEW.resolution);NEW.resolved_at:=clock_timestamp();NEW.closed_at:=NULL;
    ELSIF NEW.status='closed'THEN NEW.resolution:=OLD.resolution;NEW.resolved_at:=OLD.resolved_at;NEW.closed_at:=clock_timestamp();
    ELSIF OLD.status IN('resolved','closed')THEN NEW.resolution:=NULL;NEW.resolved_at:=NULL;NEW.closed_at:=NULL;
    ELSE NEW.resolution:=OLD.resolution;NEW.resolved_at:=OLD.resolved_at;NEW.closed_at:=OLD.closed_at;END IF;
   ELSIF NEW.resolved_at IS DISTINCT FROM OLD.resolved_at OR NEW.closed_at IS DISTINCT FROM OLD.closed_at OR NEW.resolution IS DISTINCT FROM OLD.resolution THEN RAISE EXCEPTION 'support_resolution_metadata_immutable' USING ERRCODE='42501';END IF;
  END IF;
 END IF;
 IF length(btrim(coalesce(NEW.subject,'')))NOT BETWEEN 1 AND 255 OR length(btrim(coalesce(NEW.description,'')))NOT BETWEEN 1 AND 20000 OR length(coalesce(NEW.change_note,''))>5000 OR NEW.status IS NULL OR NEW.status NOT IN('open','in_progress','pending','resolved','closed')THEN RAISE EXCEPTION 'invalid_support_ticket' USING ERRCODE='22023';END IF;
 IF(TG_OP='INSERT'OR NEW.priority IS DISTINCT FROM OLD.priority)AND(NEW.priority IS NULL OR NEW.priority NOT IN('low','medium','high','critical'))THEN RAISE EXCEPTION 'invalid_support_priority' USING ERRCODE='22023';END IF;
 IF(TG_OP='INSERT'OR NEW.category IS DISTINCT FROM OLD.category)AND(NEW.category IS NULL OR NEW.category NOT IN('general','billing','technical','delivery','quality'))THEN RAISE EXCEPTION 'invalid_support_category' USING ERRCODE='22023';END IF;
 IF NEW.assigned_to IS NOT NULL AND(TG_OP='INSERT'OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.assigned_to AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.can_intranet_action_for(p.id,'support.tickets','read')AND public.can_intranet_action_for(p.id,'support.tickets','update'))THEN RAISE EXCEPTION 'support_assignee_forbidden' USING ERRCODE='42501';END IF;
 IF TG_OP='INSERT'OR NEW.subject IS DISTINCT FROM OLD.subject THEN NEW.subject:=btrim(NEW.subject);END IF;IF TG_OP='INSERT'OR NEW.description IS DISTINCT FROM OLD.description THEN NEW.description:=btrim(NEW.description);END IF;NEW.updated_at:=clock_timestamp();RETURN NEW;
END;$$;
CREATE TRIGGER zz_support_ticket_guard BEFORE INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.guard_support_ticket_write();

CREATE TABLE public.support_ticket_notes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),ticket_id uuid NOT NULL REFERENCES public.support_tickets(id),actor_id uuid NOT NULL REFERENCES public.profiles(id)DEFAULT auth.uid(),body text NOT NULL CHECK(length(btrim(body))BETWEEN 1 AND 5000),created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.support_ticket_notes TO authenticated;
GRANT ALL ON public.support_ticket_notes TO service_role;
CREATE INDEX support_ticket_notes_parent ON public.support_ticket_notes(ticket_id,created_at);
CREATE POLICY support_notes_read ON public.support_ticket_notes FOR SELECT TO authenticated USING(public.can_intranet_action('support.tickets','read')AND EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id));
CREATE POLICY support_notes_add ON public.support_ticket_notes FOR INSERT TO authenticated WITH CHECK(actor_id=auth.uid()AND public.can_intranet_action('support.tickets','update')AND EXISTS(SELECT 1 FROM public.support_tickets t WHERE t.id=ticket_id AND t.archived_at IS NULL AND coalesce(t.status,'open')NOT IN('resolved','closed')));
CREATE OR REPLACE FUNCTION public.stamp_support_note()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN NEW.body:=btrim(NEW.body);NEW.created_at:=clock_timestamp();RETURN NEW;END;$$;
CREATE TRIGGER support_note_stamp BEFORE INSERT ON public.support_ticket_notes FOR EACH ROW EXECUTE FUNCTION public.stamp_support_note();

CREATE OR REPLACE FUNCTION public.notify_support_ticket_change()RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM auth.uid()AND(TG_OP='INSERT'OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.assigned_to AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.can_intranet_action_for(p.id,'support.tickets','read'))THEN INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(NEW.assigned_to,'Ticket support attribué',NEW.subject,'info','/pole/support/tickets?ticket='||NEW.id::text,jsonb_build_object('source','support_ticket','ticket_id',NEW.id));END IF;
 IF TG_OP='UPDATE'AND NEW.status IS DISTINCT FROM OLD.status AND NEW.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM auth.uid()AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.created_by AND p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=NEW.test_account AND public.can_intranet_action_for(p.id,'support.tickets','read'))THEN INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)VALUES(NEW.created_by,'Ticket support mis à jour',NEW.subject,'info','/pole/support/tickets?ticket='||NEW.id::text,jsonb_build_object('source','support_ticket','ticket_id',NEW.id));END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER support_ticket_notifications AFTER INSERT OR UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.notify_support_ticket_change();

CREATE OR REPLACE FUNCTION public.create_support_ticket(p_key uuid,p_payload jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE prior public.support_tickets%ROWTYPE;r public.support_tickets%ROWTYPE;BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')OR NOT public.can_intranet_action('support.tickets','create')THEN RAISE EXCEPTION 'support_create_forbidden' USING ERRCODE='42501';END IF;
 IF p_key IS NULL OR jsonb_typeof(p_payload)IS DISTINCT FROM 'object'OR octet_length(p_payload::text)>65000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_payload)k WHERE k<>ALL(ARRAY['subject','description','priority','category','assigned_to','user_account_id']))THEN RAISE EXCEPTION 'invalid_support_payload' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('support-create:'||auth.uid()::text||p_key::text,0));
 SELECT *INTO prior FROM public.support_tickets WHERE created_by=auth.uid()AND creation_key=p_key;
 IF FOUND THEN IF prior.creation_request IS DISTINCT FROM p_payload THEN RAISE EXCEPTION 'support_key_conflict' USING ERRCODE='40001';END IF;RETURN to_jsonb(prior);END IF;
 INSERT INTO public.support_tickets(subject,description,priority,category,assigned_to,user_account_id,created_by,creation_key,creation_request)
 VALUES(p_payload->>'subject',p_payload->>'description',coalesce(p_payload->>'priority','medium'),coalesce(p_payload->>'category','general'),nullif(p_payload->>'assigned_to','')::uuid,nullif(p_payload->>'user_account_id','')::uuid,auth.uid(),p_key,p_payload)RETURNING *INTO r;RETURN to_jsonb(r);
END;$$;
CREATE OR REPLACE FUNCTION public.update_support_ticket(p_id uuid,p_revision bigint,p_patch jsonb)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r jsonb;fields text;BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')OR NOT public.can_intranet_action('support.tickets','update')THEN RAISE EXCEPTION 'support_update_forbidden' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL OR jsonb_typeof(p_patch)IS DISTINCT FROM 'object'OR p_patch='{}'::jsonb OR octet_length(p_patch::text)>65000 OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_patch)k WHERE k<>ALL(ARRAY['subject','description','priority','category','assigned_to','user_account_id','status','resolution','change_note']))THEN RAISE EXCEPTION 'invalid_support_patch' USING ERRCODE='22023';END IF;
 SELECT string_agg(format('%I=v.%I',k,k),','ORDER BY k)INTO fields FROM jsonb_object_keys(p_patch)k;
 EXECUTE format('UPDATE public.support_tickets t SET %s,revision=t.revision+1 FROM jsonb_populate_record(NULL::public.support_tickets,$1)v WHERE t.id=$2 AND t.revision=$3 RETURNING to_jsonb(t.*)',fields)INTO r USING p_patch,p_id,p_revision;
 IF r IS NULL THEN RAISE EXCEPTION 'support_record_changed' USING ERRCODE='40001';END IF;RETURN r;
END;$$;
CREATE OR REPLACE FUNCTION public.archive_support_ticket(p_id uuid,p_revision bigint)RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE r public.support_tickets%ROWTYPE;BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')OR NOT public.can_intranet_action('support.tickets','delete')THEN RAISE EXCEPTION 'support_archive_forbidden' USING ERRCODE='42501';END IF;
 UPDATE public.support_tickets SET archived_at=clock_timestamp(),revision=revision+1 WHERE id=p_id AND revision=p_revision RETURNING *INTO r;
 IF NOT FOUND THEN RAISE EXCEPTION 'support_record_changed' USING ERRCODE='40001';END IF;RETURN to_jsonb(r);
END;$$;
CREATE OR REPLACE FUNCTION public.list_support_assignees()RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')THEN RAISE EXCEPTION 'support_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',trim(concat_ws(' ',p.first_name,p.last_name)))ORDER BY p.first_name,p.last_name),'[]'::jsonb)FROM public.profiles p WHERE p.app_origin='connect'AND p.hr_status='active'AND coalesce(p.test_account,false)=public.intranet_is_test_mode()AND public.can_intranet_action_for(p.id,'support.tickets','read')AND public.can_intranet_action_for(p.id,'support.tickets','update'));
END;$$;
CREATE OR REPLACE FUNCTION public.list_support_ticket_history(p_id uuid,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')OR NOT EXISTS(SELECT 1 FROM public.support_tickets WHERE id=p_id)THEN RAISE EXCEPTION 'support_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_support_history_page' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT h.id,h.action,h.before_state,h.after_state,h.created_at,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM public.intranet_business_history h LEFT JOIN public.profiles p ON p.id=h.actor_id WHERE h.table_name='support_tickets'AND h.row_id=p_id::text ORDER BY h.created_at DESC,h.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(h)ORDER BY h.created_at DESC,h.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)h),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.list_support_ticket_notes(p_id uuid,p_offset integer DEFAULT 0)RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')OR NOT EXISTS(SELECT 1 FROM public.support_tickets WHERE id=p_id)THEN RAISE EXCEPTION 'support_forbidden' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'invalid_support_notes_page' USING ERRCODE='22023';END IF;
 RETURN(WITH selected AS(SELECT n.id,n.body,n.created_at,trim(concat_ws(' ',p.first_name,p.last_name))AS actor_name FROM public.support_ticket_notes n LEFT JOIN public.profiles p ON p.id=n.actor_id WHERE n.ticket_id=p_id ORDER BY n.created_at DESC,n.id DESC LIMIT 51 OFFSET p_offset)
 SELECT jsonb_build_object('rows',(SELECT coalesce(jsonb_agg(to_jsonb(n)ORDER BY n.created_at DESC,n.id DESC),'[]'::jsonb)FROM(SELECT *FROM selected ORDER BY created_at DESC,id DESC LIMIT 50)n),'has_more',(SELECT count(*)>50 FROM selected)));
END;$$;
CREATE OR REPLACE FUNCTION public.add_support_ticket_note(p_id uuid,p_body text)RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result uuid;BEGIN
 INSERT INTO public.support_ticket_notes(ticket_id,body)VALUES(p_id,p_body)RETURNING id INTO result;RETURN result;
END;$$;
CREATE OR REPLACE FUNCTION public.get_support_ticket_stats()RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE observed_at timestamptz:=clock_timestamp();
BEGIN
 IF NOT public.can_intranet_action('support.tickets','read')THEN RAISE EXCEPTION 'support_forbidden' USING ERRCODE='42501';END IF;
 RETURN(SELECT jsonb_build_object(
 'totalTickets',count(*),'openTickets',count(*)FILTER(WHERE status='open'),'inProgressTickets',count(*)FILTER(WHERE status='in_progress'),'pendingTickets',count(*)FILTER(WHERE status='pending'),
 'resolvedTickets',count(*)FILTER(WHERE status='resolved'),'closedTickets',count(*)FILTER(WHERE status='closed'),'activeTickets',count(*)FILTER(WHERE status IN('open','in_progress','pending')),
 'highPriorityTickets',count(*)FILTER(WHERE priority IN('high','critical')AND status IN('open','in_progress','pending')),
 'avgResolutionHours',avg(extract(epoch FROM(resolved_at-created_at))/3600)FILTER(WHERE status IN('resolved','closed')AND created_at IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at),
 'resolutionSamples',count(*)FILTER(WHERE status IN('resolved','closed')AND created_at IS NOT NULL AND resolved_at>=created_at AND resolved_at<=observed_at))
 FROM public.support_tickets WHERE archived_at IS NULL);
END;$$;
REVOKE ALL ON FUNCTION public.guard_support_ticket_write(),public.notify_support_ticket_change(),public.stamp_support_note(),public.check_support_account_link()FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.create_support_ticket(uuid,jsonb),public.update_support_ticket(uuid,bigint,jsonb),public.archive_support_ticket(uuid,bigint),public.list_support_assignees(),public.list_support_ticket_history(uuid,integer),public.list_support_ticket_notes(uuid,integer),public.add_support_ticket_note(uuid,text),public.get_support_ticket_stats()FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(uuid,jsonb),public.update_support_ticket(uuid,bigint,jsonb),public.archive_support_ticket(uuid,bigint),public.list_support_assignees(),public.list_support_ticket_history(uuid,integer),public.list_support_ticket_notes(uuid,integer),public.add_support_ticket_note(uuid,text),public.get_support_ticket_stats()TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
