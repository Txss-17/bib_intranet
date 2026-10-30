-- Access assignment integrity. The RBAC matrix is not the same as the account
-- assignment: enforce canonical CEO identity and permitted scope instances on
-- future writes. Historical rows are not rewritten.
CREATE OR REPLACE FUNCTION public.guard_access_assignment_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_role_key text;
  v_role_status text;
  v_old_ceo boolean := false;
  v_is_admin boolean := coalesce(public.has_role(auth.uid(), 'admin'::public.app_role), false)
                         OR coalesce(auth.role() = 'service_role', false);
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    SELECT role_key = 'ceo' INTO v_old_ceo
    FROM public.access_roles WHERE id=OLD.role_id;
    IF coalesce(v_old_ceo,false) AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Only a technical administrator may modify the CEO assignment'
        USING ERRCODE='42501';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF NEW.status NOT IN ('active','pending') THEN RETURN NEW; END IF;

  SELECT role_key,status INTO v_role_key,v_role_status
  FROM public.access_roles WHERE id=NEW.role_id;
  IF v_role_key IS NULL OR v_role_status <> 'active' THEN
    RAISE EXCEPTION 'Cannot activate an unknown or inactive role'
      USING ERRCODE='42501';
  END IF;

  IF v_role_key='ceo' THEN
    IF NOT v_is_admin OR NOT EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id=NEW.employee_id
         AND p.position='ceo' AND p.hr_status='active'
         AND p.app_origin='connect' AND p.test_account IS FALSE
    ) THEN
      RAISE EXCEPTION 'CEO assignment requires an administrator and the canonical active CEO identity'
        USING ERRCODE='42501';
    END IF;
  END IF;

  -- A configured role may only be assigned within one of its actual
  -- scope instances. Unconfigured legacy roles may still have NULL scope.
  IF EXISTS (SELECT 1 FROM public.access_role_scopes rs WHERE rs.role_id=NEW.role_id)
     AND NOT EXISTS (
      SELECT 1 FROM public.access_role_scopes rs
       WHERE rs.role_id=NEW.role_id
         AND rs.scope_id IS NOT DISTINCT FROM NEW.scope_id
         AND rs.scope_value IS NOT DISTINCT FROM NULLIF(btrim(NEW.scope_value), '')
     ) THEN
    RAISE EXCEPTION 'The requested scope is not configured for this role'
      USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_guard_access_assignment_scope
  ON public.access_assignments;
CREATE TRIGGER trg_guard_access_assignment_scope
  BEFORE INSERT OR UPDATE OR DELETE ON public.access_assignments
  FOR EACH ROW EXECUTE FUNCTION public.guard_access_assignment_scope();

REVOKE ALL ON FUNCTION public.guard_access_assignment_scope() FROM PUBLIC,anon,authenticated;
