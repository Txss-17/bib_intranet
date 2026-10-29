-- Task collaboration and immutable history. Deploy through the existing Drizzle path.
ALTER TABLE public.work_tasks
  ADD COLUMN IF NOT EXISTS task_poles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS test_account boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
UPDATE public.work_tasks SET task_poles=ARRAY[pole] WHERE pole IS NOT NULL AND cardinality(task_poles)=0;
UPDATE public.work_tasks t SET test_account=coalesce(p.test_account,false) FROM public.profiles p WHERE p.id=t.created_by;
CREATE OR REPLACE FUNCTION public.can_work_task_action(p_action text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); saved_count integer; saved_allow boolean; level text;
  in_scope boolean; has_active boolean; only_read_only boolean; legacy_role text;
BEGIN
  IF actor IS NULL OR p_action IS NULL OR p_action NOT IN ('read','create','update','delete')
      OR NOT coalesce(public.is_intranet_staff(actor),false)
      OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND app_origin='connect' AND hr_status='active') THEN RETURN false; END IF;
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
  JOIN public.access_interfaces ai ON ai.id=ap.interface_id AND ai.interface_key='work.tasks' AND ai.status='active'
  JOIN public.access_actions ac ON ac.id=ap.action_id
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  -- A saved page grants only its explicitly allowed actions, including explicit denials.
  IF saved_count>0 THEN RETURN saved_allow; END IF;
  SELECT count(*)>0,coalesce(bool_and(ar.read_only),false) INTO has_active,only_read_only
  FROM public.access_roles ar
  LEFT JOIN public.access_assignments aa ON aa.role_id=ar.id AND aa.employee_id=actor AND aa.status='active'
    AND (aa.starts_at IS NULL OR aa.starts_at<=now()) AND (aa.ends_at IS NULL OR aa.ends_at>=now())
  WHERE ar.status='active' AND (aa.employee_id IS NOT NULL OR ar.role_key=legacy_role);
  IF NOT has_active AND (legacy_role IS NULL OR EXISTS(SELECT 1 FROM public.access_assignments WHERE employee_id=actor)) THEN RETURN false; END IF;
  SELECT coalesce(p.seniority::text,'junior'),coalesce('rh'=ANY(p.poles),false)
    INTO level,in_scope FROM public.profiles p WHERE p.id=actor;
  IF public.is_leadership(actor) THEN level:='executive'; in_scope:=true; END IF;
  
  IF p_action='read' THEN RETURN true; END IF;
  IF only_read_only THEN RETURN false; END IF;
  IF p_action IN ('create','update') THEN RETURN level IN ('mid','senior','lead','executive'); END IF;
  RETURN level IN ('senior','lead','executive');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_work_task_permissions()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('read',public.can_work_task_action('read'),'create',public.can_work_task_action('create'),
 'update',public.can_work_task_action('update'),'delete',public.can_work_task_action('delete'));
$$;
CREATE OR REPLACE FUNCTION public.work_task_in_scope(p_creator uuid,p_assignee uuid,p_poles text[],p_test boolean)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT public.can_work_task_action('read') AND EXISTS (
 SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND coalesce(p.test_account,false)=p_test
 AND (p_creator=p.id OR p_assignee=p.id OR public.is_leadership(p.id) OR public.has_role(p.id,'admin')
 OR cardinality(p_poles)=0 OR p_poles && coalesce(p.poles::text[],'{}'::text[])));
$$;
-- Restrictive boundaries also cover any older permissive policies.
CREATE POLICY work_tasks_read_boundary ON public.work_tasks AS RESTRICTIVE FOR SELECT TO authenticated
 USING(public.work_task_in_scope(created_by,assignee_id,task_poles,test_account));
CREATE POLICY work_tasks_collaboration_read ON public.work_tasks FOR SELECT TO authenticated
 USING(public.work_task_in_scope(created_by,assignee_id,task_poles,test_account));
CREATE POLICY work_tasks_create_boundary ON public.work_tasks AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(public.can_work_task_action('read') AND public.can_work_task_action('create') AND created_by=auth.uid());
CREATE POLICY work_tasks_update_boundary ON public.work_tasks AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(public.can_work_task_action('update') AND public.work_task_in_scope(created_by,assignee_id,task_poles,test_account)
 AND (created_by=auth.uid() OR assignee_id=auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin')))
 WITH CHECK(public.can_work_task_action('update') AND public.work_task_in_scope(created_by,assignee_id,task_poles,test_account));
CREATE POLICY work_tasks_collaboration_insert ON public.work_tasks FOR INSERT TO authenticated WITH CHECK(public.can_work_task_action('read') AND public.can_work_task_action('create') AND created_by=auth.uid());
CREATE POLICY work_tasks_collaboration_update ON public.work_tasks FOR UPDATE TO authenticated USING(public.can_work_task_action('update') AND (created_by=auth.uid() OR assignee_id=auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY work_tasks_no_physical_delete ON public.work_tasks AS RESTRICTIVE FOR DELETE TO authenticated USING(false);

CREATE TABLE public.work_task_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.work_tasks(id),
 author_id uuid NOT NULL REFERENCES public.profiles(id) DEFAULT auth.uid(),
 body text NOT NULL CHECK(char_length(btrim(body)) BETWEEN 1 AND 5000), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.work_task_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.work_tasks(id),
 actor_id uuid REFERENCES public.profiles(id), action text NOT NULL,
 before_state jsonb, after_state jsonb, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.work_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_task_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON public.work_task_comments TO authenticated;
GRANT SELECT ON public.work_task_history TO authenticated;
GRANT ALL ON public.work_task_comments,public.work_task_history TO service_role;
CREATE INDEX work_task_comments_task ON public.work_task_comments(task_id,created_at);
CREATE INDEX work_task_history_task ON public.work_task_history(task_id,created_at);
CREATE POLICY task_comments_read ON public.work_task_comments FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.work_tasks t WHERE t.id=task_id));
CREATE OR REPLACE FUNCTION public.stamp_work_task_comment() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN NEW.created_at:=clock_timestamp(); RETURN NEW; END; $$;
CREATE TRIGGER work_task_comment_stamp BEFORE INSERT ON public.work_task_comments FOR EACH ROW EXECUTE FUNCTION public.stamp_work_task_comment();
REVOKE ALL ON FUNCTION public.stamp_work_task_comment() FROM PUBLIC,anon,authenticated;
CREATE POLICY task_comments_add ON public.work_task_comments FOR INSERT TO authenticated WITH CHECK(
 author_id=auth.uid() AND public.can_work_task_action('update') AND EXISTS(
 SELECT 1 FROM public.work_tasks t WHERE t.id=task_id AND t.archived_at IS NULL));
CREATE POLICY task_history_read ON public.work_task_history FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.work_tasks t WHERE t.id=task_id));

CREATE OR REPLACE FUNCTION public.guard_work_task_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); actor_test boolean; actor_poles text[];
BEGIN
 IF char_length(btrim(coalesce(NEW.title,''))) NOT BETWEEN 1 AND 255
 OR char_length(coalesce(NEW.description,''))>20000 OR char_length(coalesce(NEW.objective,''))>5000
 OR NEW.task_poles IS NULL OR array_ndims(NEW.task_poles)>1 OR array_position(NEW.task_poles,NULL) IS NOT NULL THEN
 RAISE EXCEPTION 'invalid_work_task' USING ERRCODE='22023'; END IF;
 SELECT coalesce(array_agg(DISTINCT p ORDER BY p),'{}'::text[]) INTO NEW.task_poles FROM unnest(NEW.task_poles) p;
 IF TG_OP='UPDATE' AND (NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.test_account IS DISTINCT FROM OLD.test_account
 OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.id IS DISTINCT FROM OLD.id) THEN
 RAISE EXCEPTION 'immutable_work_task_identity' USING ERRCODE='42501'; END IF;
 IF actor IS NOT NULL THEN
 SELECT coalesce(test_account,false),coalesce(poles::text[],'{}'::text[]) INTO actor_test,actor_poles FROM public.profiles WHERE id=actor;
 IF TG_OP='INSERT' THEN NEW.created_by:=actor; NEW.test_account:=actor_test; NEW.created_at:=now(); END IF;
 IF (TG_OP='INSERT' OR NEW.task_poles IS DISTINCT FROM OLD.task_poles)
 AND NOT (public.is_leadership(actor) OR public.has_role(actor,'admin')) AND NOT NEW.task_poles<@actor_poles THEN
 RAISE EXCEPTION 'work_task_poles_forbidden' USING ERRCODE='42501'; END IF;
 IF NEW.assignee_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=NEW.assignee_id
 AND coalesce(p.test_account,false)=NEW.test_account AND p.app_origin='connect' AND p.hr_status='active' AND public.is_intranet_staff(p.id)) THEN
 RAISE EXCEPTION 'work_task_assignee_forbidden' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' AND NEW.archived_at IS DISTINCT FROM OLD.archived_at AND NOT public.can_work_task_action('delete') THEN
 RAISE EXCEPTION 'work_task_archive_forbidden' USING ERRCODE='42501'; END IF;
 END IF;
 IF (TG_OP='INSERT' OR NEW.task_poles IS DISTINCT FROM OLD.task_poles) AND NOT NEW.task_poles<@ARRAY['direction','finance','ops','supplier','marketplace','support','marketing','rh','audit','compliance','rse','product','data','security']::text[] THEN RAISE EXCEPTION 'invalid_work_task_poles' USING ERRCODE='22023'; END IF;
 NEW.title:=btrim(NEW.title);
 NEW.pole:=NEW.task_poles[1];
 IF TG_OP='UPDATE' THEN NEW.updated_at:=greatest(clock_timestamp(),OLD.updated_at+interval '1 microsecond'); ELSE NEW.updated_at:=clock_timestamp(); END IF;
 IF NEW.status='completed' THEN
  IF TG_OP='INSERT' THEN NEW.completed_at:=now();
  ELSIF OLD.status<>'completed' THEN NEW.completed_at:=now(); ELSE NEW.completed_at:=OLD.completed_at; END IF;
 ELSE NEW.completed_at:=NULL; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER zz_work_task_guard BEFORE INSERT OR UPDATE ON public.work_tasks FOR EACH ROW EXECUTE FUNCTION public.guard_work_task_write();
CREATE OR REPLACE FUNCTION public.log_work_task_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.work_task_history(task_id,actor_id,action,before_state,after_state)
 VALUES(NEW.id,auth.uid(),CASE WHEN TG_OP='INSERT' THEN 'created' WHEN NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN 'archived' ELSE 'updated' END,
 CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW));
 IF NEW.assignee_id IS NOT NULL AND NEW.assignee_id IS DISTINCT FROM auth.uid()
 AND (TG_OP='INSERT' OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id) THEN
 INSERT INTO public.notifications(user_id,title,message,type,action_url,metadata)
 VALUES(NEW.assignee_id,'Nouvelle tâche attribuée',NEW.title,'info','/work/tasks?task='||NEW.id::text,
 jsonb_build_object('task_id',NEW.id,'source','work_tasks'));
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER work_task_history AFTER INSERT OR UPDATE ON public.work_tasks FOR EACH ROW EXECUTE FUNCTION public.log_work_task_change();
REVOKE ALL ON FUNCTION public.guard_work_task_write(),public.log_work_task_change() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.can_work_task_action(text),public.get_work_task_permissions(),public.work_task_in_scope(uuid,uuid,text[],boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_work_task_action(text),public.get_work_task_permissions(),public.work_task_in_scope(uuid,uuid,text[],boolean) TO authenticated,service_role;
