-- Personnel documents must retain their original employee identity.
-- A genuine transfer requires creating a new entry with explicit authorization.
-- This prevents stale audit trails and simultaneous old/new RH bindings.
BEGIN;
CREATE OR REPLACE FUNCTION public.rh_guard_document_employee_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $guard$
BEGIN
  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    RAISE EXCEPTION 'rh_document_employee_immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$guard$;
REVOKE ALL ON FUNCTION public.rh_guard_document_employee_identity() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS trg_rh_document_employee_immutable ON public.rh_employee_documents;
CREATE TRIGGER trg_rh_document_employee_immutable
BEFORE UPDATE OF employee_id ON public.rh_employee_documents
FOR EACH ROW EXECUTE FUNCTION public.rh_guard_document_employee_identity();
COMMIT;
