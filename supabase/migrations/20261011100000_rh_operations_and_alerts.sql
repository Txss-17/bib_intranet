-- RH operational pages: recruitment records and persistent alert handling.

CREATE TABLE IF NOT EXISTS public.hr_recruitment_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_key TEXT NOT NULL,
  pole_id TEXT,
  contract_type TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'filled', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  recruiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  desired_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID REFERENCES public.hr_recruitment_needs(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  position_key TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'screening', 'interview', 'validation', 'offer', 'accepted', 'rejected', 'archived')),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  next_step TEXT,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) DEFAULT auth.uid(),
  leave_type TEXT NOT NULL DEFAULT 'cp'
    CHECK (leave_type IN ('cp', 'rtt', 'sick', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hr_leave_requests_dates_check CHECK (end_date >= start_date)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.hr_leave_requests'::regclass
      AND conname = 'hr_leave_requests_employee_id_fkey'
  ) THEN
    ALTER TABLE public.hr_leave_requests
      ADD CONSTRAINT hr_leave_requests_employee_id_fkey
      FOREIGN KEY (employee_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.hr_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) DEFAULT auth.uid(),
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'remote', 'absent', 'late', 'leave')),
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hr_attendance_employee_date_unique UNIQUE (employee_id, work_date)
);

CREATE TABLE IF NOT EXISTS public.hr_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider TEXT,
  start_date DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.hr_recruitment_needs,
   public.hr_candidates,
   public.hr_leave_requests,
   public.hr_attendance_records,
   public.hr_trainings
TO authenticated;
GRANT ALL
ON public.hr_recruitment_needs,
   public.hr_candidates,
   public.hr_leave_requests,
   public.hr_attendance_records,
   public.hr_trainings
TO service_role;

ALTER TABLE public.hr_recruitment_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_trainings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RH manage recruitment needs" ON public.hr_recruitment_needs;
CREATE POLICY rh_manage_recruitment_needs
ON public.hr_recruitment_needs
FOR ALL TO authenticated
USING (public.can_access_rh_profiles(auth.uid()))
WITH CHECK (public.can_access_rh_profiles(auth.uid()));

DROP POLICY IF EXISTS "RH manage candidates" ON public.hr_candidates;
CREATE POLICY rh_manage_candidates
ON public.hr_candidates
FOR ALL TO authenticated
USING (public.can_access_rh_profiles(auth.uid()))
WITH CHECK (public.can_access_rh_profiles(auth.uid()));

DROP POLICY IF EXISTS "Leave select" ON public.hr_leave_requests;
DROP POLICY IF EXISTS "Leave insert" ON public.hr_leave_requests;
DROP POLICY IF EXISTS "Leave update RH" ON public.hr_leave_requests;
DROP POLICY IF EXISTS "Leave cancel own" ON public.hr_leave_requests;
CREATE POLICY rh_read_leave_requests
ON public.hr_leave_requests
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY rh_insert_leave_requests
ON public.hr_leave_requests
FOR INSERT TO authenticated
WITH CHECK (
  (employee_id = auth.uid() AND status = 'pending')
  OR public.can_access_rh_profiles(auth.uid())
);
CREATE POLICY rh_update_leave_requests
ON public.hr_leave_requests
FOR UPDATE TO authenticated
USING (
  public.can_access_rh_profiles(auth.uid())
  OR (employee_id = auth.uid() AND status = 'pending')
)
WITH CHECK (
  public.can_access_rh_profiles(auth.uid())
  OR (employee_id = auth.uid() AND status IN ('pending', 'cancelled'))
);

DROP POLICY IF EXISTS "Attendance select" ON public.hr_attendance_records;
DROP POLICY IF EXISTS "Attendance insert" ON public.hr_attendance_records;
DROP POLICY IF EXISTS "Attendance update RH" ON public.hr_attendance_records;
CREATE POLICY rh_read_attendance_records
ON public.hr_attendance_records
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY rh_insert_attendance_records
ON public.hr_attendance_records
FOR INSERT TO authenticated
WITH CHECK (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY rh_update_attendance_records
ON public.hr_attendance_records
FOR UPDATE TO authenticated
USING (public.can_access_rh_profiles(auth.uid()))
WITH CHECK (public.can_access_rh_profiles(auth.uid()));

DROP POLICY IF EXISTS "Training select" ON public.hr_trainings;
DROP POLICY IF EXISTS "Training manage RH" ON public.hr_trainings;
CREATE POLICY rh_read_trainings
ON public.hr_trainings
FOR SELECT TO authenticated
USING (employee_id = auth.uid() OR public.can_access_rh_profiles(auth.uid()));
CREATE POLICY rh_manage_trainings
ON public.hr_trainings
FOR ALL TO authenticated
USING (public.can_access_rh_profiles(auth.uid()))
WITH CHECK (public.can_access_rh_profiles(auth.uid()));

CREATE TABLE IF NOT EXISTS public.rh_alert_statuses (
  alert_key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'acknowledged', 'resolved')),
  updated_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rh_alert_statuses TO authenticated;
GRANT ALL ON public.rh_alert_statuses TO service_role;
ALTER TABLE public.rh_alert_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rh_manage_alert_statuses ON public.rh_alert_statuses;
CREATE POLICY rh_manage_alert_statuses
ON public.rh_alert_statuses
FOR ALL TO authenticated
USING (public.can_access_rh_profiles(auth.uid()))
WITH CHECK (public.can_access_rh_profiles(auth.uid()));

COMMENT ON TABLE public.rh_alert_statuses IS
  'État partagé des alertes calculées depuis les échéances de documents RH et les congés approuvés.';
