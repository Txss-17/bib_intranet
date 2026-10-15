ALTER TABLE public.hr_employee_requests
  ADD COLUMN IF NOT EXISTS work_mode text,
  ADD COLUMN IF NOT EXISTS subsidiary text,
  ADD COLUMN IF NOT EXISTS attached_documents jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.hr_account_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  target_user_id uuid,
  target_email text,
  request_id uuid,
  action text NOT NULL,
  role_key text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hr_account_audit_log_target_idx ON public.hr_account_audit_log(target_user_id, created_at DESC);

GRANT SELECT ON public.hr_account_audit_log TO authenticated;
GRANT ALL ON public.hr_account_audit_log TO service_role;
ALTER TABLE public.hr_account_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR, direction and admins read account audit"
ON public.hr_account_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_any_pole(auth.uid(), ARRAY['rh','direction']));

CREATE OR REPLACE FUNCTION public.log_account_access_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _actor uuid := auth.uid();
  _name text;
  _target uuid;
  _email text;
  _action text;
  _role text;
BEGIN
  -- Les écritures du service d'onboarding sont journalisées par la fonction elle-même.
  IF _actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT trim(coalesce(first_name,'')||' '||coalesce(last_name,'')) INTO _name FROM profiles WHERE id=_actor;
  IF TG_TABLE_NAME = 'user_roles' THEN
    _target := COALESCE(NEW.user_id, OLD.user_id);
    _role := COALESCE(NEW.role, OLD.role)::text;
    _action := CASE TG_OP WHEN 'INSERT' THEN 'app_role_granted' WHEN 'DELETE' THEN 'app_role_revoked' ELSE 'app_role_changed' END;
  ELSE
    _target := COALESCE(NEW.employee_id, OLD.employee_id);
    SELECT role_key INTO _role FROM access_roles WHERE id = COALESCE(NEW.role_id, OLD.role_id);
    _action := CASE TG_OP WHEN 'INSERT' THEN 'access_role_assigned' WHEN 'DELETE' THEN 'access_role_removed' ELSE 'access_role_updated' END;
  END IF;
  SELECT email INTO _email FROM profiles WHERE id=_target;
  INSERT INTO hr_account_audit_log(actor_id, actor_name, target_user_id, target_email, action, role_key, details)
  VALUES (_actor, NULLIF(_name,''), _target, _email, _action, _role,
    jsonb_build_object('old', CASE WHEN TG_OP<>'INSERT' THEN to_jsonb(OLD) END, 'new', CASE WHEN TG_OP<>'DELETE' THEN to_jsonb(NEW) END));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_log_user_roles_change ON public.user_roles;
CREATE TRIGGER trg_log_user_roles_change AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_account_access_change();
DROP TRIGGER IF EXISTS trg_log_access_assignments_change ON public.access_assignments;
CREATE TRIGGER trg_log_access_assignments_change AFTER INSERT OR UPDATE OR DELETE ON public.access_assignments
FOR EACH ROW EXECUTE FUNCTION public.log_account_access_change();