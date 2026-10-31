-- Account-owned notifications; operational alerts remain in their métier tables.
-- No shared "read" flag can be changed by one employee for another.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_owner_select_20261031 ON public.notifications;
CREATE POLICY notification_owner_select_20261031
 ON public.notifications AS RESTRICTIVE FOR SELECT TO authenticated
 USING (user_id = auth.uid());
DROP POLICY IF EXISTS notification_owner_update_20261031 ON public.notifications;
CREATE POLICY notification_owner_update_20261031
 ON public.notifications AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS notification_owner_delete_20261031 ON public.notifications;
CREATE POLICY notification_owner_delete_20261031
 ON public.notifications AS RESTRICTIVE FOR DELETE TO authenticated
 USING (user_id = auth.uid());

-- Preserve row ownership even where historic permissive UPDATE policies exist.
CREATE OR REPLACE FUNCTION public.guard_notification_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.user_id IS DISTINCT FROM OLD.user_id
   AND coalesce(auth.role(),'') <> 'service_role' THEN
   RAISE EXCEPTION 'Notification recipient cannot be changed' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS guard_notification_owner_update ON public.notifications;
CREATE TRIGGER guard_notification_owner_update BEFORE UPDATE ON public.notifications
 FOR EACH ROW EXECUTE FUNCTION public.guard_notification_owner();

-- Legacy system events used NULL user_id as a shared inbox. New events are
-- distributed into independent per-recipient records, never shared read-state.
-- Unrouted/sensitive system notices go to the canonical CEO rather than every
-- staff member. The original NULL-recipient row is removed after delivery.
CREATE OR REPLACE FUNCTION public.fanout_legacy_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 v_actor_is_test boolean:=false;
 v_pole text:=NEW.pole_id::text;
BEGIN
 IF NEW.user_id IS NOT NULL THEN RETURN NULL; END IF;
 IF auth.uid() IS NOT NULL THEN
   SELECT coalesce(p.test_account,false) INTO v_actor_is_test
    FROM public.profiles p WHERE p.id=auth.uid();
 END IF;
 INSERT INTO public.notifications(user_id,pole_id,title,message,type,action_url,metadata,created_at,read)
 SELECT p.id,NEW.pole_id,NEW.title,NEW.message,NEW.type,NEW.action_url,NEW.metadata,
   coalesce(NEW.created_at,now()),false
 FROM public.profiles p
 WHERE p.app_origin='connect' AND p.hr_status='active'
   AND coalesce(p.test_account,false)=coalesce(v_actor_is_test,false)
   AND (
     -- Ethics, alerts without department, and legacy departments are restricted.
     (v_pole IS NULL AND public.is_canonical_bib_ceo(p.id))
     OR
     (v_pole IS NOT NULL AND (
        -- Non-sensitive pole notice: only members with department read rights.
        (v_pole=ANY(coalesce(p.poles::text[],'{}'::text[]))
          AND public.can_intranet_action_for(p.id,v_pole||'.overview','read'))
        OR public.is_canonical_bib_ceo(p.id)
     ))
   )
   AND NOT (
     lower(coalesce(NEW.title,'')||' '||coalesce(NEW.message,'')) ~
       '(signalement|lanceur d.alerte|whistleblow|ethics|éthique|confidentiel)'
     AND NOT public.is_canonical_bib_ceo(p.id)
   );
 DELETE FROM public.notifications WHERE id=NEW.id;
 RETURN NULL;
END;$$;
REVOKE ALL ON FUNCTION public.fanout_legacy_notification() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS notification_legacy_fanout_20261031 ON public.notifications;
CREATE TRIGGER notification_legacy_fanout_20261031
 AFTER INSERT ON public.notifications
 FOR EACH ROW WHEN (NEW.user_id IS NULL)
 EXECUTE FUNCTION public.fanout_legacy_notification();

-- Do not expose old global rows: legacy history is retained for audit,
-- but can be read by no individual user unless explicitly addressed to them.
NOTIFY pgrst,'reload schema';
