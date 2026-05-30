-- Supplier applications intake from BOS form submissions
CREATE TABLE IF NOT EXISTS public.supplier_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'supplier',
  company_name text NOT NULL,
  contact_name text,
  contact_email text NOT NULL,
  contact_phone text,
  country text,
  category text,
  lead_time_days integer,
  moq integer,
  audit_accepted boolean NOT NULL DEFAULT false,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'new',
  blocking_criteria text[] NOT NULL DEFAULT '{}',
  assigned_to_id uuid,
  assigned_to_name text,
  assigned_at timestamptz,
  decision_notes text,
  decision_by uuid,
  decision_at timestamptz,
  source text NOT NULL DEFAULT 'bos_form',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.supplier_applications TO authenticated;
GRANT ALL ON public.supplier_applications TO service_role;

ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view supplier applications" ON public.supplier_applications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert supplier applications" ON public.supplier_applications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "manage supplier applications" ON public.supplier_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE TABLE IF NOT EXISTS public.supplier_application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.supplier_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  notes text,
  performed_by uuid,
  performed_by_name text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.supplier_application_events TO authenticated;
GRANT ALL ON public.supplier_application_events TO service_role;

ALTER TABLE public.supplier_application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view application events" ON public.supplier_application_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert application events" ON public.supplier_application_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_supplier_applications_status ON public.supplier_applications(status);
CREATE INDEX IF NOT EXISTS idx_supplier_applications_priority ON public.supplier_applications(priority);
CREATE INDEX IF NOT EXISTS idx_supplier_applications_assigned ON public.supplier_applications(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_application_events_app ON public.supplier_application_events(application_id);

CREATE TRIGGER trg_supplier_applications_updated_at
  BEFORE UPDATE ON public.supplier_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
