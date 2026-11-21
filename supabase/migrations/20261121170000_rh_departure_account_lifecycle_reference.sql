-- BIB RH: tie an offboarding case to the account opened during onboarding.
-- References are registry identifiers, not Drive files or proof of closure.
-- This migration intentionally does not archive, ban or delete any user.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.rh_departure_register_reference_seq AS bigint;

ALTER TABLE public.rh_departure_cases
  ADD COLUMN IF NOT EXISTS departure_reference text,
  ADD COLUMN IF NOT EXISTS onboarding_request_id uuid
    REFERENCES public.hr_employee_requests(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_rh_departure_register_reference
  ON public.rh_departure_cases(departure_reference)
  WHERE departure_reference IS NOT NULL;

-- Backfill historical cases without changing their status or access.
WITH refs AS (
  SELECT c.id,
    'BIB-RH-DEP-' || to_char(c.created_at, 'YYYY') || '-' ||
    lpad(nextval('public.rh_departure_register_reference_seq'::regclass)::text, 6, '0') AS ref
  FROM public.rh_departure_cases c
  WHERE c.departure_reference IS NULL
)
UPDATE public.rh_departure_cases c
  SET departure_reference = refs.ref
FROM refs WHERE c.id = refs.id;

UPDATE public.rh_departure_cases c
  SET onboarding_request_id = (
    SELECT r.id FROM public.hr_employee_requests r
    WHERE r.request_kind = 'onboarding'
      AND r.created_user_id = c.employee_id
    ORDER BY r.created_at ASC, r.id ASC
    LIMIT 1
  )
WHERE c.onboarding_request_id IS NULL;

-- Insert assigns a new immutable reference and resolves origin from the actual
-- Auth/profile UUID, never from the email address or client-provided documents.
CREATE OR REPLACE FUNCTION public.rh_departure_assign_account_origin()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO ''
AS $origin$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.departure_reference :=
      'BIB-RH-DEP-' || to_char(COALESCE(NEW.created_at, now()), 'YYYY') || '-' ||
      lpad(nextval('public.rh_departure_register_reference_seq'::regclass)::text, 6, '0');

    SELECT r.id INTO NEW.onboarding_request_id
    FROM public.hr_employee_requests r
    WHERE r.request_kind = 'onboarding'
      AND r.created_user_id = NEW.employee_id
    ORDER BY r.created_at ASC, r.id ASC
    LIMIT 1;

  ELSIF NEW.employee_id IS DISTINCT FROM OLD.employee_id
     OR NEW.departure_reference IS DISTINCT FROM OLD.departure_reference
     OR NEW.onboarding_request_id IS DISTINCT FROM OLD.onboarding_request_id THEN
    RAISE EXCEPTION 'rh_departure_account_origin_immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$origin$;

REVOKE ALL ON FUNCTION public.rh_departure_assign_account_origin()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_rh_departure_assign_account_origin
  ON public.rh_departure_cases;
CREATE TRIGGER trg_rh_departure_assign_account_origin
  BEFORE INSERT OR UPDATE OF employee_id, departure_reference, onboarding_request_id
  ON public.rh_departure_cases
  FOR EACH ROW EXECUTE FUNCTION public.rh_departure_assign_account_origin();

-- New read RPC avoids changing the return type of rh_departure_list().
-- Only canonical CEO or requesting RH manager with live personal portfolio
-- can see the linked onboarding register. The link is revalidated at read.
CREATE OR REPLACE FUNCTION public.rh_departure_lifecycle_list()
RETURNS TABLE (
  id uuid, employee_id uuid, employee_name text, planned_at date,
  status text, requested_by uuid, decided_at timestamptz, tasks_pending bigint,
  departure_reference text, onboarding_reference text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO ''
AS $lifecycle$
DECLARE
  actor uuid := (SELECT auth.uid());
BEGIN
  IF actor IS NULL OR NOT public.can_intranet_action('rh.employees', 'read')
    OR NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = actor AND p.app_origin = 'connect'
        AND p.test_account IS FALSE AND p.hr_status = 'active'
    ) THEN
    RAISE EXCEPTION 'rh_departure_lifecycle_forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.id, c.employee_id,
    concat_ws(' ', e.first_name, e.last_name)::text,
    c.planned_at, c.status, c.requested_by, c.decided_at,
    (SELECT count(*) FROM public.rh_departure_tasks t
      WHERE t.case_id = c.id AND t.state = 'pending'),
    c.departure_reference, r.document_register_reference
  FROM public.rh_departure_cases c
  JOIN public.profiles e ON e.id = c.employee_id
  LEFT JOIN public.hr_employee_requests r
    ON r.id = c.onboarding_request_id
   AND r.request_kind = 'onboarding'
   AND r.created_user_id = c.employee_id
  WHERE public.is_canonical_bib_ceo(actor)
    OR (c.requested_by = actor AND EXISTS (
      SELECT 1 FROM public.bib_case_portfolios portfolio
      JOIN public.bib_case_portfolio_members m
        ON m.portfolio_id = portfolio.id
      WHERE portfolio.pole = 'rh' AND portfolio.status = 'active'
        AND portfolio.owner_id = actor AND m.entity_kind = 'employee'
        AND m.entity_id = c.employee_id AND m.ended_at IS NULL
    ))
  ORDER BY c.created_at DESC LIMIT 200;
END;
$lifecycle$;

REVOKE ALL ON FUNCTION public.rh_departure_lifecycle_list()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rh_departure_lifecycle_list()
  TO authenticated;

COMMIT;
