
CREATE TABLE public.rd_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'analysis',
  status text NOT NULL DEFAULT 'draft',
  summary text,
  author_id uuid,
  author_name text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rd_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view rd reports" ON public.rd_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage rd reports" ON public.rd_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_rdr_updated BEFORE UPDATE ON public.rd_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.rd_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.rd_reports(id) ON DELETE CASCADE,
  detail text NOT NULL,
  category text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  target_pole pole_id,
  ticket_type text,
  ticket_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rd_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view rd recos" ON public.rd_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage rd recos" ON public.rd_recommendations FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'manager'::app_role));
CREATE TRIGGER trg_rdrec_updated BEFORE UPDATE ON public.rd_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
