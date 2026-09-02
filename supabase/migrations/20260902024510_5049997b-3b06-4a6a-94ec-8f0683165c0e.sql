-- =========================================================
-- 1. Helpers RBAC backend
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_pole(_user_id uuid, _pole text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND _pole = ANY(COALESCE(p.poles::text[], '{}'::text[]))
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_pole(_user_id uuid, _poles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND COALESCE(p.poles::text[], '{}'::text[]) && _poles
  )
$$;

CREATE OR REPLACE FUNCTION public.my_poles()
RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT poles::text[] FROM public.profiles WHERE id = auth.uid()), '{}'::text[])
$$;

GRANT EXECUTE ON FUNCTION public.has_pole(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_pole(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_poles() TO authenticated;

-- Accès élevé : direction, admin technique
CREATE OR REPLACE FUNCTION public.is_leadership(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'executive')
      OR public.has_pole(_user_id, 'direction')
$$;
GRANT EXECUTE ON FUNCTION public.is_leadership(uuid) TO authenticated;

-- =========================================================
-- 2. Demandes inter-pôles -> Tech Studio
-- =========================================================
CREATE TABLE public.tech_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('TR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random()*9999)+1)::text, 4, '0')),
  title text NOT NULL,
  description text NOT NULL,
  requester_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text,
  requester_pole text NOT NULL,
  category text NOT NULL DEFAULT 'evolution',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'submitted',
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason text,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tech_request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tech_requests(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  author_pole text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tech_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.tech_requests(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_request_comments TO authenticated;
GRANT SELECT, INSERT ON public.tech_request_events TO authenticated;
GRANT ALL ON public.tech_requests TO service_role;
GRANT ALL ON public.tech_request_comments TO service_role;
GRANT ALL ON public.tech_request_events TO service_role;

ALTER TABLE public.tech_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tech_requests_select" ON public.tech_requests FOR SELECT TO authenticated
USING (
  requester_id = auth.uid()
  OR requester_pole = ANY(public.my_poles())
  OR public.has_pole(auth.uid(), 'tech')
  OR public.is_leadership(auth.uid())
);
CREATE POLICY "tech_requests_insert" ON public.tech_requests FOR INSERT TO authenticated
WITH CHECK (requester_id = auth.uid());
CREATE POLICY "tech_requests_update" ON public.tech_requests FOR UPDATE TO authenticated
USING (public.has_pole(auth.uid(), 'tech') OR public.is_leadership(auth.uid()) OR requester_id = auth.uid())
WITH CHECK (public.has_pole(auth.uid(), 'tech') OR public.is_leadership(auth.uid()) OR requester_id = auth.uid());
CREATE POLICY "tech_requests_delete" ON public.tech_requests FOR DELETE TO authenticated
USING (public.is_leadership(auth.uid()));

CREATE POLICY "tech_request_comments_select" ON public.tech_request_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tech_requests r WHERE r.id = request_id));
CREATE POLICY "tech_request_comments_insert" ON public.tech_request_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tech_requests r WHERE r.id = request_id));
CREATE POLICY "tech_request_comments_delete" ON public.tech_request_comments FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.is_leadership(auth.uid()));

CREATE POLICY "tech_request_events_select" ON public.tech_request_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tech_requests r WHERE r.id = request_id));
CREATE POLICY "tech_request_events_insert" ON public.tech_request_events FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE TRIGGER trg_tech_requests_updated BEFORE UPDATE ON public.tech_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Notification automatique
CREATE OR REPLACE FUNCTION public.notify_tech_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (title, message, type, pole_id, action_url)
    VALUES (
      'Nouvelle demande Tech — ' || NEW.reference,
      COALESCE(NEW.requester_pole, 'pôle') || ' : ' || NEW.title,
      CASE WHEN NEW.priority = 'critical' THEN 'critical' WHEN NEW.priority = 'high' THEN 'warning' ELSE 'info' END,
      'tech',
      '/pole/tech/studio'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (title, message, type, pole_id, action_url, user_id)
    VALUES (
      'Demande ' || NEW.reference || ' — ' || NEW.status,
      NEW.title,
      CASE WHEN NEW.status = 'rejected' THEN 'warning' WHEN NEW.status = 'done' THEN 'success' ELSE 'info' END,
      NEW.requester_pole,
      '/pole/tech/studio',
      NEW.requester_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tech_request_notify
AFTER INSERT OR UPDATE ON public.tech_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_tech_request();

-- =========================================================
-- 3. Workflow RH -> Tech (création de collaborateur)
-- =========================================================
CREATE TABLE public.hr_employee_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('HR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad((floor(random()*9999)+1)::text, 4, '0')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  personal_email text,
  work_email text,
  position employee_position,
  poles text[] NOT NULL DEFAULT '{}',
  seniority text NOT NULL DEFAULT 'junior',
  requested_role app_role NOT NULL DEFAULT 'viewer',
  contract_type text,
  start_date date,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  hr_validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  hr_validated_at timestamptz,
  account_created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  account_created_at timestamptz,
  created_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hr_employee_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.hr_employee_requests(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_employee_requests TO authenticated;
GRANT SELECT, INSERT ON public.hr_employee_request_events TO authenticated;
GRANT ALL ON public.hr_employee_requests TO service_role;
GRANT ALL ON public.hr_employee_request_events TO service_role;

ALTER TABLE public.hr_employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_requests_select" ON public.hr_employee_requests FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_any_pole(auth.uid(), ARRAY['rh','tech'])
  OR public.is_leadership(auth.uid())
);
CREATE POLICY "hr_requests_insert" ON public.hr_employee_requests FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (public.has_pole(auth.uid(), 'rh') OR public.is_leadership(auth.uid())));
CREATE POLICY "hr_requests_update" ON public.hr_employee_requests FOR UPDATE TO authenticated
USING (public.has_any_pole(auth.uid(), ARRAY['rh','tech']) OR public.is_leadership(auth.uid()))
WITH CHECK (public.has_any_pole(auth.uid(), ARRAY['rh','tech']) OR public.is_leadership(auth.uid()));
CREATE POLICY "hr_requests_delete" ON public.hr_employee_requests FOR DELETE TO authenticated
USING (public.is_leadership(auth.uid()));

CREATE POLICY "hr_request_events_select" ON public.hr_employee_request_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.hr_employee_requests r WHERE r.id = request_id));
CREATE POLICY "hr_request_events_insert" ON public.hr_employee_request_events FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE TRIGGER trg_hr_requests_updated BEFORE UPDATE ON public.hr_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.notify_hr_employee_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (title, message, type, pole_id, action_url)
    VALUES (
      'Dossier collaborateur ' || NEW.reference || ' — ' || NEW.status,
      NEW.first_name || ' ' || NEW.last_name,
      CASE WHEN NEW.status = 'rejected' THEN 'warning' WHEN NEW.status = 'completed' THEN 'success' ELSE 'info' END,
      CASE WHEN NEW.status = 'hr_validated' THEN 'tech' ELSE 'rh' END,
      '/pole/rh/onboarding'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_hr_request_notify
AFTER UPDATE ON public.hr_employee_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_hr_employee_request();

-- =========================================================
-- 4. RLS métier renforcée sur les données sensibles
-- =========================================================
DO $$
DECLARE
  t record;
  cfg jsonb := '{
    "salaries": ["rh","finance"],
    "cashflows": ["finance"],
    "guarantee_fund": ["finance"],
    "fundraising_rounds": ["finance"],
    "corporate_cards": ["finance"],
    "corporate_card_transactions": ["finance"],
    "supplier_payments": ["finance","supplier"],
    "business_trips": ["rh","finance"],
    "vpn_access": ["tech"],
    "edge_function_logs": ["tech"],
    "deployments": ["tech"],
    "security_alerts": ["tech","risk"],
    "bugs": ["tech"],
    "tech_backlog": ["tech","data"],
    "audit_incidents": ["audit","compliance"],
    "field_audits": ["audit"],
    "ops_audits": ["audit","ops"],
    "supplier_audits": ["audit","supplier"]
  }'::jsonb;
  k text;
  poles text[];
  pol record;
BEGIN
  FOR k IN SELECT jsonb_object_keys(cfg) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                   WHERE n.nspname='public' AND c.relname=k AND c.relkind='r') THEN
      CONTINUE;
    END IF;
    SELECT array_agg(value::text) INTO poles FROM jsonb_array_elements_text(cfg->k) AS value;

    -- Retire les anciennes policies de lecture
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname='public' AND tablename=k AND cmd IN ('SELECT','ALL') LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, k);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_any_pole(auth.uid(), %L::text[]) OR public.is_leadership(auth.uid()))',
      k || '_select_by_pole', k, poles
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_any_pole(auth.uid(), %L::text[]) OR public.is_leadership(auth.uid()))',
      k || '_insert_by_pole', k, poles
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.has_any_pole(auth.uid(), %L::text[]) OR public.is_leadership(auth.uid())) WITH CHECK (public.has_any_pole(auth.uid(), %L::text[]) OR public.is_leadership(auth.uid()))',
      k || '_update_by_pole', k, poles, poles
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_leadership(auth.uid()))',
      k || '_delete_leadership', k
    );
  END LOOP;
END $$;