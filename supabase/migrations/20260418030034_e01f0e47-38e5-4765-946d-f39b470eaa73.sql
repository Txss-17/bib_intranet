-- Tech Pole: 4 nouvelles tables (auth_logs, edge_function_logs, vpn_access, security_alerts)

-- 1. auth_logs : journalisation des évènements d'authentification
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  event_type TEXT NOT NULL, -- login_success, login_failure, logout, password_reset
  ip_address TEXT,
  user_agent TEXT,
  app_origin TEXT DEFAULT 'bos', -- bos | connect
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON public.auth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON public.auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON public.auth_logs(event_type);

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert auth logs"
  ON public.auth_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can view auth logs"
  ON public.auth_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 2. edge_function_logs : exécutions Edge Functions
CREATE TABLE IF NOT EXISTS public.edge_function_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success', -- success | error | timeout
  duration_ms INTEGER,
  http_status INTEGER,
  error_message TEXT,
  caller_id UUID,
  app_origin TEXT DEFAULT 'bos',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_function_logs_created_at ON public.edge_function_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_function_name ON public.edge_function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_logs_status ON public.edge_function_logs(status);

ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert edge function logs"
  ON public.edge_function_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can view edge function logs"
  ON public.edge_function_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- 3. vpn_access : registre VPN (manuel + Tailscale-ready)
CREATE TABLE IF NOT EXISTS public.vpn_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_name TEXT NOT NULL,
  user_email TEXT,
  device_name TEXT,
  ip_address TEXT,
  provider TEXT DEFAULT 'manual', -- manual | tailscale | wireguard
  provider_device_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | revoked | pending
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vpn_access_status ON public.vpn_access(status);
CREATE INDEX IF NOT EXISTS idx_vpn_access_user_id ON public.vpn_access(user_id);

ALTER TABLE public.vpn_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view VPN access"
  ON public.vpn_access FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can manage VPN access"
  ON public.vpn_access FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_vpn_access_updated_at
  BEFORE UPDATE ON public.vpn_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. security_alerts : incidents de sécurité
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL, -- rls_violation | suspicious_ip | brute_force | unauthorized_access | other
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  title TEXT NOT NULL,
  description TEXT,
  source TEXT, -- auth | edge_function | rls | manual
  affected_user_id UUID,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | investigating | resolved | dismissed
  assigned_to UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at DESC);

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert security alerts"
  ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins and managers can view security alerts"
  ON public.security_alerts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update security alerts"
  ON public.security_alerts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.auth_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.edge_function_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vpn_access;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;