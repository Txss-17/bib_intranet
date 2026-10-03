CREATE TABLE public.anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL DEFAULT ('ANO-' || upper(substr(gen_random_uuid()::text,1,8))),
  source text NOT NULL CHECK (source IN ('orders','payments','stripe','invoices','stock','suppliers','audits','logistics','tech','platform')),
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','action_required','resolved','closed')),
  title text NOT NULL,
  description text,
  object_type text,
  object_id text,
  owner_id uuid,
  created_by uuid DEFAULT auth.uid(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.anomaly_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_id uuid NOT NULL REFERENCES public.anomalies(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'comment',
  from_status text, to_status text, message text,
  performed_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anomalies TO authenticated;
GRANT SELECT, INSERT ON public.anomaly_events TO authenticated;
GRANT ALL ON public.anomalies, public.anomaly_events TO service_role;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_anomalies(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_leadership(_uid) OR public.has_role(_uid,'admin')
    OR public.has_any_pole(_uid, ARRAY['ops','finance','tech','audit','supplier','lifecycle','compliance'])
$$;

CREATE POLICY "anomalies read" ON public.anomalies FOR SELECT TO authenticated USING (public.can_access_anomalies(auth.uid()));
CREATE POLICY "anomalies insert" ON public.anomalies FOR INSERT TO authenticated WITH CHECK (public.can_access_anomalies(auth.uid()));
CREATE POLICY "anomalies update" ON public.anomalies FOR UPDATE TO authenticated USING (public.can_access_anomalies(auth.uid()));
CREATE POLICY "anomalies delete" ON public.anomalies FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anomaly events read" ON public.anomaly_events FOR SELECT TO authenticated USING (public.can_access_anomalies(auth.uid()));
CREATE POLICY "anomaly events insert" ON public.anomaly_events FOR INSERT TO authenticated WITH CHECK (public.can_access_anomalies(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_anomaly_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status='resolved' THEN NEW.resolved_at := now(); END IF;
    IF NEW.status='closed' THEN NEW.closed_at := now(); END IF;
    INSERT INTO public.anomaly_events(anomaly_id,kind,from_status,to_status,performed_by)
      VALUES (NEW.id,'status',OLD.status,NEW.status,auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_anomaly_change BEFORE UPDATE ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.log_anomaly_change();

CREATE OR REPLACE FUNCTION public.log_anomaly_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.anomaly_events(anomaly_id,kind,to_status,message,performed_by)
    VALUES (NEW.id,'created',NEW.status,NEW.title,NEW.created_by);
  IF NEW.severity IN ('high','critical') THEN
    INSERT INTO public.notifications(pole_id,title,message,action_url,type)
      VALUES ((CASE WHEN NEW.source IN ('tech','platform') THEN 'tech' WHEN NEW.source IN ('payments','stripe','invoices') THEN 'finance' WHEN NEW.source='suppliers' THEN 'supplier' WHEN NEW.source='audits' THEN 'audit' ELSE 'ops' END)::pole_id,
        'Anomalie '||NEW.severity, NEW.title, '/pole/ops/anomalies', 'warning');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_anomaly_created AFTER INSERT ON public.anomalies FOR EACH ROW EXECUTE FUNCTION public.log_anomaly_created();
CREATE INDEX ON public.anomalies(status, severity);
CREATE INDEX ON public.anomaly_events(anomaly_id);