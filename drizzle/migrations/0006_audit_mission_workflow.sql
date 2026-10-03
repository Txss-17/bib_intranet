ALTER TABLE public.field_audits
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'mission'
    CHECK (workflow_status IN ('mission','planned','assigned','in_field','synced','analysis','compliant','non_compliant','corrective_action','closed')),
  ADD COLUMN IF NOT EXISTS mission_reference text UNIQUE DEFAULT ('AUD-' || upper(substr(gen_random_uuid()::text,1,8))),
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS field_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS corrective_action text,
  ADD COLUMN IF NOT EXISTS corrective_due_date date,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS anomaly_id uuid REFERENCES public.anomalies(id) ON DELETE SET NULL;

CREATE TABLE public.audit_mission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.field_audits(id) ON DELETE CASCADE,
  from_status text, to_status text, message text,
  origin text NOT NULL DEFAULT 'connect',
  performed_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_mission_events TO authenticated;
GRANT ALL ON public.audit_mission_events TO service_role;
ALTER TABLE public.audit_mission_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit events read" ON public.audit_mission_events FOR SELECT TO authenticated
  USING (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['audit','compliance','supplier','ops']));
CREATE POLICY "audit events insert" ON public.audit_mission_events FOR INSERT TO authenticated
  WITH CHECK (public.is_leadership(auth.uid()) OR public.has_any_pole(auth.uid(), ARRAY['audit','compliance']));
CREATE INDEX ON public.audit_mission_events(audit_id);

CREATE OR REPLACE FUNCTION public.audit_mission_workflow() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_anomaly uuid;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.app_origin='audit_hub' AND NEW.workflow_status='mission' THEN NEW.workflow_status := 'synced'; NEW.synced_at := now(); END IF;
    RETURN NEW;
  END IF;
  IF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    CASE NEW.workflow_status
      WHEN 'assigned' THEN NEW.assigned_at := now();
      WHEN 'in_field' THEN NEW.field_started_at := now();
      WHEN 'synced' THEN NEW.synced_at := now();
      WHEN 'compliant' THEN NEW.decided_at := now();
      WHEN 'non_compliant' THEN NEW.decided_at := now();
      WHEN 'closed' THEN NEW.closed_at := now();
      ELSE NULL;
    END CASE;
    IF NEW.workflow_status IN ('closed','compliant') AND NEW.completed_date IS NULL THEN NEW.completed_date := current_date; END IF;
    IF NEW.workflow_status='non_compliant' AND NEW.anomaly_id IS NULL THEN
      INSERT INTO public.anomalies(source,type,severity,title,description,object_type,object_id,created_by)
        VALUES ('audits','Non-conformité audit','high',
          'Non-conformité : '||COALESCE(NEW.target_name,'cible'), COALESCE(NEW.decision_reason, NEW.findings),
          'field_audit', NEW.id::text, auth.uid())
        RETURNING id INTO v_anomaly;
      NEW.anomaly_id := v_anomaly;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_audit_mission_workflow BEFORE INSERT OR UPDATE ON public.field_audits
  FOR EACH ROW EXECUTE FUNCTION public.audit_mission_workflow();

CREATE OR REPLACE FUNCTION public.log_audit_mission_event() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.audit_mission_events(audit_id,to_status,message,origin,performed_by)
      VALUES (NEW.id,NEW.workflow_status,'Création',COALESCE(NEW.app_origin,'connect'),auth.uid());
    IF NEW.app_origin='audit_hub' THEN
      INSERT INTO public.notifications(pole_id,title,message,action_url,type)
        VALUES ('audit','Résultat terrain reçu (Audit Hub)',COALESCE(NEW.target_name,'Audit'),'/pole/audit/missions','info');
    END IF;
  ELSIF NEW.workflow_status IS DISTINCT FROM OLD.workflow_status THEN
    INSERT INTO public.audit_mission_events(audit_id,from_status,to_status,message,origin,performed_by)
      VALUES (NEW.id,OLD.workflow_status,NEW.workflow_status,NEW.decision_reason,COALESCE(NEW.app_origin,'connect'),auth.uid());
    IF NEW.workflow_status='synced' THEN
      INSERT INTO public.notifications(pole_id,title,message,action_url,type)
        VALUES ('audit','Audit synchronisé — à analyser',COALESCE(NEW.target_name,'Audit'),'/pole/audit/missions','info');
    END IF;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER trg_audit_mission_events AFTER INSERT OR UPDATE ON public.field_audits
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_mission_event();