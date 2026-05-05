
-- Lifecycle risk alerts
CREATE TABLE public.lifecycle_risk_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'inactivity',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  company text,
  amount numeric DEFAULT 0,
  assigned_to uuid,
  resolution_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.lifecycle_risk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view risk alerts" ON public.lifecycle_risk_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage risk alerts" ON public.lifecycle_risk_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_lra_updated BEFORE UPDATE ON public.lifecycle_risk_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Lifecycle email campaigns
CREATE TABLE public.lifecycle_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  audience text,
  body text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_count integer DEFAULT 0,
  open_rate numeric DEFAULT 0,
  click_rate numeric DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lifecycle_email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view email campaigns" ON public.lifecycle_email_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage email campaigns" ON public.lifecycle_email_campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_lec_updated BEFORE UPDATE ON public.lifecycle_email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Direction board reports
CREATE TABLE public.direction_board_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'monthly',
  period text,
  summary text,
  file_url text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.direction_board_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view board reports" ON public.direction_board_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage board reports" ON public.direction_board_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_dbr_updated BEFORE UPDATE ON public.direction_board_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Audit incidents (independent audit, declaration, resolution)
CREATE TABLE public.audit_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'declared',
  declared_by uuid,
  declared_by_name text,
  pole_id pole_id,
  assigned_to uuid,
  resolution_notes text,
  resolved_by uuid,
  declared_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view audit incidents" ON public.audit_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "declare audit incidents" ON public.audit_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "manage audit incidents" ON public.audit_incidents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_ai_updated BEFORE UPDATE ON public.audit_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
