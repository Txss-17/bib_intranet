
-- === PUBLICATIONS & DATA GOVERNANCE (Phase 1) ===

-- 1) KPI CATALOG
CREATE TABLE public.kpi_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  formula TEXT,
  source TEXT,
  frequency TEXT CHECK (frequency IN ('realtime','hourly','daily','weekly','monthly','quarterly')) DEFAULT 'daily',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  pole_access TEXT[] NOT NULL DEFAULT '{}',
  status TEXT CHECK (status IN ('draft','active','deprecated','archived')) DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  app_origin TEXT NOT NULL DEFAULT 'connect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_catalog TO authenticated;
GRANT ALL ON public.kpi_catalog TO service_role;
ALTER TABLE public.kpi_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kpi_catalog readable authenticated" ON public.kpi_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "kpi_catalog manage authenticated" ON public.kpi_catalog FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 2) KPI VERSIONS (historique)
CREATE TABLE public.kpi_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES public.kpi_catalog(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.kpi_versions TO authenticated;
GRANT ALL ON public.kpi_versions TO service_role;
ALTER TABLE public.kpi_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kpi_versions readable auth" ON public.kpi_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "kpi_versions insert auth" ON public.kpi_versions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 3) PUBLICATIONS (news + technical)
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN ('technical','news','hr','finance','legal','security','data')),
  subtype TEXT,
  version TEXT NOT NULL DEFAULT 'v1.0',
  visibility_scope TEXT NOT NULL DEFAULT 'all' CHECK (visibility_scope IN ('all','subsidiary','pole','team','role','user')),
  visibility_targets TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  archive_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_pole TEXT,
  related_kpi_id UUID REFERENCES public.kpi_catalog(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  app_origin TEXT NOT NULL DEFAULT 'connect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publications TO authenticated;
GRANT ALL ON public.publications TO service_role;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "publications readable auth" ON public.publications FOR SELECT TO authenticated USING (true);
CREATE POLICY "publications manage auth" ON public.publications FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE INDEX idx_publications_type_status ON public.publications(type, status);
CREATE INDEX idx_publications_publish_at ON public.publications(publish_at DESC);

-- 4) PUBLICATION REQUESTS (workflow Data → Tech)
CREATE TABLE public.publication_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN ('kpi','dashboard','feature','fix','maintenance')),
  related_kpi_id UUID REFERENCES public.kpi_catalog(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','data_validated','tech_queued','in_dev','testing','deployed','archived','rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_validator UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tech_assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_deploy_date DATE,
  deployed_at TIMESTAMPTZ,
  notes TEXT,
  history JSONB DEFAULT '[]',
  app_origin TEXT NOT NULL DEFAULT 'connect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_requests TO authenticated;
GRANT ALL ON public.publication_requests TO service_role;
ALTER TABLE public.publication_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_req readable auth" ON public.publication_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "pub_req manage auth" ON public.publication_requests FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 5) PUBLICATION READS (badge non-lu)
CREATE TABLE public.publication_reads (
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.publication_reads TO authenticated;
GRANT ALL ON public.publication_reads TO service_role;
ALTER TABLE public.publication_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_reads own" ON public.publication_reads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6) TECH BACKLOG
CREATE TABLE public.tech_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  origin_request_id UUID REFERENCES public.publication_requests(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  impact TEXT DEFAULT 'medium' CHECK (impact IN ('low','medium','high','strategic')),
  complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('xs','s','m','l','xl')),
  due_date DATE,
  assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','review','done','cancelled')),
  labels TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  app_origin TEXT NOT NULL DEFAULT 'connect',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_backlog TO authenticated;
GRANT ALL ON public.tech_backlog TO service_role;
ALTER TABLE public.tech_backlog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tech_backlog readable auth" ON public.tech_backlog FOR SELECT TO authenticated USING (true);
CREATE POLICY "tech_backlog manage auth" ON public.tech_backlog FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 7) PROFILES additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('remote','hybrid','field','office')) DEFAULT 'office',
  ADD COLUMN IF NOT EXISTS subsidiary TEXT DEFAULT 'brand-in-a-box',
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8) update_updated_at trigger for new tables
CREATE TRIGGER trg_kpi_catalog_updated BEFORE UPDATE ON public.kpi_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_publications_updated BEFORE UPDATE ON public.publications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pub_req_updated BEFORE UPDATE ON public.publication_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_tech_backlog_updated BEFORE UPDATE ON public.tech_backlog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
