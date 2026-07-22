
-- Chantier 1: Approval workflows
ALTER TABLE public.business_trips
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.corporate_card_transactions
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE TABLE IF NOT EXISTS public.approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_id uuid,
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.approval_history TO authenticated;
GRANT ALL ON public.approval_history TO service_role;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval_history_insert_auth" ON public.approval_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "approval_history_read_auth" ON public.approval_history FOR SELECT TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS approval_history_entity_idx ON public.approval_history(entity_type, entity_id);

-- Chantier 2: BI tables
CREATE TABLE IF NOT EXISTS public.bi_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pole_id text,
  status text NOT NULL DEFAULT 'draft',
  version text NOT NULL DEFAULT 'v1.0',
  owner_id uuid,
  template_id uuid,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  pages jsonb NOT NULL DEFAULT '[{"id":"p1","name":"Page 1"}]'::jsonb,
  target_filiale text,
  target_pole text,
  target_role text,
  target_users uuid[] DEFAULT '{}',
  publish_at timestamptz,
  archive_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_dashboards TO authenticated;
GRANT ALL ON public.bi_dashboards TO service_role;
ALTER TABLE public.bi_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_dashboards_read" ON public.bi_dashboards FOR SELECT TO authenticated USING (true);
CREATE POLICY "bi_dashboards_write" ON public.bi_dashboards FOR ALL TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'executive')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'executive'));

CREATE TABLE IF NOT EXISTS public.bi_dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.bi_dashboards(id) ON DELETE CASCADE,
  page_id text NOT NULL DEFAULT 'p1',
  type text NOT NULL,
  title text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  x integer NOT NULL DEFAULT 0,
  y integer NOT NULL DEFAULT 0,
  w integer NOT NULL DEFAULT 4,
  h integer NOT NULL DEFAULT 3,
  kpi_id uuid,
  data_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_dashboard_widgets TO authenticated;
GRANT ALL ON public.bi_dashboard_widgets TO service_role;
ALTER TABLE public.bi_dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_widgets_read" ON public.bi_dashboard_widgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "bi_widgets_write" ON public.bi_dashboard_widgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS bi_widgets_dashboard_idx ON public.bi_dashboard_widgets(dashboard_id);

CREATE TABLE IF NOT EXISTS public.bi_dashboard_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.bi_dashboards(id) ON DELETE CASCADE,
  version text NOT NULL,
  snapshot jsonb NOT NULL,
  kpis_added text[] DEFAULT '{}',
  kpis_removed text[] DEFAULT '{}',
  author_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bi_dashboard_versions TO authenticated;
GRANT ALL ON public.bi_dashboard_versions TO service_role;
ALTER TABLE public.bi_dashboard_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_versions_read" ON public.bi_dashboard_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "bi_versions_insert" ON public.bi_dashboard_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.bi_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  pole_id text,
  preset jsonb NOT NULL DEFAULT '{}'::jsonb,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bi_templates TO authenticated;
GRANT ALL ON public.bi_templates TO service_role;
ALTER TABLE public.bi_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_templates_read" ON public.bi_templates FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.bi_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bi_data_sources TO authenticated;
GRANT ALL ON public.bi_data_sources TO service_role;
ALTER TABLE public.bi_data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bi_sources_read" ON public.bi_data_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "bi_sources_write" ON public.bi_data_sources FOR ALL TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_bi_dashboards_updated ON public.bi_dashboards;
CREATE TRIGGER trg_bi_dashboards_updated BEFORE UPDATE ON public.bi_dashboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_bi_widgets_updated ON public.bi_dashboard_widgets;
CREATE TRIGGER trg_bi_widgets_updated BEFORE UPDATE ON public.bi_dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_bi_templates_updated ON public.bi_templates;
CREATE TRIGGER trg_bi_templates_updated BEFORE UPDATE ON public.bi_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS trg_bi_sources_updated ON public.bi_data_sources;
CREATE TRIGGER trg_bi_sources_updated BEFORE UPDATE ON public.bi_data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed templates
INSERT INTO public.bi_templates (name, description, pole_id, icon, preset) VALUES
  ('Dashboard Direction', 'KPIs stratégiques consolidés', 'direction', 'Crown', '{"widgets":[{"type":"kpi_card","title":"Revenu global"},{"type":"line_chart","title":"Croissance"},{"type":"scorecard","title":"Santé pôles"}]}'),
  ('Dashboard Finance', 'Cashflow, trésorerie, dettes', 'finance', 'Wallet', '{"widgets":[{"type":"kpi_card","title":"Trésorerie"},{"type":"bar_chart","title":"Cashflow mensuel"}]}'),
  ('Dashboard Audit', 'Conformité et non-conformités', 'audit', 'ShieldCheck', '{"widgets":[{"type":"kpi_card","title":"Audits réalisés"},{"type":"donut_chart","title":"Statut"}]}'),
  ('Dashboard Supplier', 'Performance fournisseurs', 'supplier', 'Truck', '{"widgets":[{"type":"kpi_card","title":"Taux conformité"},{"type":"line_chart","title":"Évolution"}]}'),
  ('Dashboard Marketplace', 'Ventes et catalogue', 'ops', 'Store', '{"widgets":[{"type":"kpi_card","title":"Ventes"},{"type":"heatmap","title":"Régions"}]}'),
  ('Dashboard RH', 'Effectifs, congés, formation', 'rh', 'Users', '{"widgets":[{"type":"kpi_card","title":"Effectif"},{"type":"donut_chart","title":"Répartition"}]}')
ON CONFLICT DO NOTHING;
