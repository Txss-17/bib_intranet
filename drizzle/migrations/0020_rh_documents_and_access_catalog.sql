CREATE TABLE IF NOT EXISTS public.rh_employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  name text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  source text NOT NULL DEFAULT 'manual',
  document_url text,
  description text,
  document_date date,
  expires_at date,
  status text NOT NULL DEFAULT 'valid',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rh_docs_employee ON public.rh_employee_documents(employee_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_employee_documents TO authenticated;
GRANT ALL ON public.rh_employee_documents TO service_role;
ALTER TABLE public.rh_employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RH docs select" ON public.rh_employee_documents FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "RH docs manage" ON public.rh_employee_documents FOR ALL TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));
CREATE TRIGGER trg_rh_docs_bu BEFORE UPDATE ON public.rh_employee_documents FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_rh_docs_ai AFTER INSERT OR DELETE ON public.rh_employee_documents FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();

ALTER TABLE public.access_roles
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS poles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS landing_path text;

CREATE TABLE IF NOT EXISTS public.access_interfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interface_key text NOT NULL UNIQUE,
  label text NOT NULL,
  module text,
  pole text,
  path text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.access_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.access_roles(id) ON DELETE CASCADE,
  interface_id uuid NOT NULL REFERENCES public.access_interfaces(id) ON DELETE CASCADE,
  action_id uuid NOT NULL REFERENCES public.access_actions(id) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT false,
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, interface_id, action_id)
);
CREATE TABLE IF NOT EXISTS public.access_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid DEFAULT auth.uid(),
  role_id uuid,
  change_type text NOT NULL,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.access_interfaces, public.access_actions, public.access_permissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.access_permissions TO authenticated;
GRANT SELECT, INSERT ON public.access_change_history TO authenticated;
GRANT ALL ON public.access_interfaces, public.access_actions, public.access_permissions, public.access_change_history TO service_role;

ALTER TABLE public.access_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interfaces readable" ON public.access_interfaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Actions readable" ON public.access_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permissions readable" ON public.access_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permissions admin write" ON public.access_permissions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Permissions admin update" ON public.access_permissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Permissions admin delete" ON public.access_permissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "History read admin" ON public.access_change_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_leadership(auth.uid()) OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "History insert admin" ON public.access_change_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND actor_id = auth.uid());