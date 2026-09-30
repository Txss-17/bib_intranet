CREATE TABLE public.work_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  pole TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_projects TO authenticated;
GRANT ALL ON public.work_projects TO service_role;
ALTER TABLE public.work_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_projects_select ON public.work_projects FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_projects_insert ON public.work_projects FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_projects_update ON public.work_projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_projects_delete ON public.work_projects FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.work_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  pole TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','deprecated')),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_processes TO authenticated;
GRANT ALL ON public.work_processes TO service_role;
ALTER TABLE public.work_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_processes_select ON public.work_processes FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_processes_insert ON public.work_processes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_processes_update ON public.work_processes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_processes_delete ON public.work_processes FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.work_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pole TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_validations TO authenticated;
GRANT ALL ON public.work_validations TO service_role;
ALTER TABLE public.work_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_validations_select ON public.work_validations FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR validator_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_validations_insert ON public.work_validations FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_validations_update ON public.work_validations FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() OR validator_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_validations_delete ON public.work_validations FOR DELETE TO authenticated
  USING (requester_id = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.work_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pole TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  raised_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_escalations TO authenticated;
GRANT ALL ON public.work_escalations TO service_role;
ALTER TABLE public.work_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY work_escalations_select ON public.work_escalations FOR SELECT TO authenticated
  USING (raised_by = auth.uid() OR assigned_to = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_escalations_insert ON public.work_escalations FOR INSERT TO authenticated
  WITH CHECK (raised_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_escalations_update ON public.work_escalations FOR UPDATE TO authenticated
  USING (raised_by = auth.uid() OR assigned_to = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY work_escalations_delete ON public.work_escalations FOR DELETE TO authenticated
  USING (raised_by = auth.uid() OR public.is_leadership(auth.uid()) OR public.has_role(auth.uid(), 'admin'));