CREATE TABLE public.hr_recruitment_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_key text NOT NULL,
  pole_id text,
  contract_type text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','filled','cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  recruiter_id uuid,
  desired_date date,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id uuid REFERENCES public.hr_recruitment_needs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  position_key text,
  source text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','screening','interview','validation','offer','accepted','rejected','archived')),
  owner_id uuid,
  next_step text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL DEFAULT auth.uid(),
  leave_type text NOT NULL DEFAULT 'cp' CHECK (leave_type IN ('cp','rtt','sick','unpaid','other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  decided_by uuid,
  decided_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE TABLE public.hr_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL DEFAULT auth.uid(),
  work_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','remote','absent','late','leave')),
  check_in time,
  check_out time,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);
CREATE TABLE public.hr_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  employee_id uuid,
  provider text,
  start_date date,
  due_date date,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hr_record_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_recruitment_needs, public.hr_candidates, public.hr_leave_requests, public.hr_attendance_records, public.hr_trainings TO authenticated;
GRANT SELECT ON public.hr_record_events TO authenticated;
GRANT ALL ON public.hr_recruitment_needs, public.hr_candidates, public.hr_leave_requests, public.hr_attendance_records, public.hr_trainings, public.hr_record_events TO service_role;

ALTER TABLE public.hr_recruitment_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_record_events ENABLE ROW LEVEL SECURITY;

-- Recrutement : RH et Direction uniquement
CREATE POLICY "RH manage recruitment needs" ON public.hr_recruitment_needs FOR ALL TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "RH manage candidates" ON public.hr_candidates FOR ALL TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));

-- Congés : le collaborateur voit/crée les siens ; RH gère tout
CREATE POLICY "Leave select" ON public.hr_leave_requests FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Leave insert" ON public.hr_leave_requests FOR INSERT TO authenticated
  WITH CHECK ((employee_id = auth.uid() AND status = 'pending') OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Leave update RH" ON public.hr_leave_requests FOR UPDATE TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Leave cancel own" ON public.hr_leave_requests FOR UPDATE TO authenticated
  USING (employee_id = auth.uid() AND status = 'pending') WITH CHECK (employee_id = auth.uid() AND status IN ('pending','cancelled'));

-- Présences
CREATE POLICY "Attendance select" ON public.hr_attendance_records FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Attendance insert" ON public.hr_attendance_records FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Attendance update RH" ON public.hr_attendance_records FOR UPDATE TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));

-- Formation
CREATE POLICY "Training select" ON public.hr_trainings FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY "Training manage RH" ON public.hr_trainings FOR ALL TO authenticated
  USING (public.can_access_rh_profiles(auth.uid())) WITH CHECK (public.can_access_rh_profiles(auth.uid()));

CREATE POLICY "RH read events" ON public.hr_record_events FOR SELECT TO authenticated
  USING (public.can_access_rh_profiles(auth.uid()));

-- Historique + updated_at
CREATE OR REPLACE FUNCTION public.log_hr_record_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    IF to_jsonb(NEW) ? 'decided_by' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
      NEW.decided_by := auth.uid(); NEW.decided_at := now();
    END IF;
    INSERT INTO public.hr_record_events(table_name, record_id, action, old_value, new_value, performed_by)
      VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.hr_record_events(table_name, record_id, action, new_value, performed_by)
      VALUES (TG_TABLE_NAME, NEW.id, 'create', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.hr_record_events(table_name, record_id, action, old_value, performed_by)
      VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END $$;

CREATE TRIGGER trg_hr_needs_bu BEFORE UPDATE ON public.hr_recruitment_needs FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_needs_ai AFTER INSERT OR DELETE ON public.hr_recruitment_needs FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_cand_bu BEFORE UPDATE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_cand_ai AFTER INSERT OR DELETE ON public.hr_candidates FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_leave_bu BEFORE UPDATE ON public.hr_leave_requests FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_leave_ai AFTER INSERT OR DELETE ON public.hr_leave_requests FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_att_bu BEFORE UPDATE ON public.hr_attendance_records FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_att_ai AFTER INSERT OR DELETE ON public.hr_attendance_records FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_train_bu BEFORE UPDATE ON public.hr_trainings FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();
CREATE TRIGGER trg_hr_train_ai AFTER INSERT OR DELETE ON public.hr_trainings FOR EACH ROW EXECUTE FUNCTION public.log_hr_record_event();