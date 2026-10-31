-- Only approved Finance collaborators can register manual inflows/outflows.
-- Imported Platform events remain owned by the server-side bridge.
-- Amendments to an entered transaction must be posted as a separate
-- reversing/correcting entry, preserving the original and its audit trail.
CREATE OR REPLACE FUNCTION public.guard_finance_manual_cashflows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $guard$
BEGIN
  IF auth.role() = 'service_role' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'Cashflow entries cannot be overwritten or deleted; post a correcting entry'
      USING ERRCODE='42501';
  END IF;

  IF NOT (public.can_intranet_action('finance.cashflow', 'create')
          OR public.can_intranet_action('finance.transactions', 'create')) THEN
    RAISE EXCEPTION 'Finance creation permission required' USING ERRCODE='42501';
  END IF;

  IF NEW.source IS DISTINCT FROM 'manual'
     OR NEW.platform_id IS NOT NULL
     OR NEW.platform_synced_at IS NOT NULL
     OR NEW.shop_id IS NOT NULL THEN
    RAISE EXCEPTION 'Manual cashflows must not impersonate Platform imports'
      USING ERRCODE='42501';
  END IF;

  IF NEW.type NOT IN ('income', 'expense')
     OR NEW.amount IS NULL OR NEW.amount <= 0
     OR NEW.currency IS NULL OR NEW.currency !~ '^[A-Z]{3}$'
     OR NEW.transaction_date IS NULL
     OR nullif(btrim(NEW.category), '') IS NULL
     OR nullif(btrim(NEW.reference), '') IS NULL
     OR nullif(btrim(NEW.description), '') IS NULL THEN
    RAISE EXCEPTION 'Incomplete or invalid manual cashflow'
      USING ERRCODE='22023';
  END IF;

  -- The existing general business guard sets recorded_by to auth.uid().
  NEW.recorded_by := auth.uid();
  RETURN NEW;
END;
$guard$;

DROP TRIGGER IF EXISTS a_finance_manual_cashflow_guard ON public.cashflows;
CREATE TRIGGER a_finance_manual_cashflow_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.cashflows
FOR EACH ROW EXECUTE FUNCTION public.guard_finance_manual_cashflows();

REVOKE ALL ON FUNCTION public.guard_finance_manual_cashflows() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.guard_finance_manual_cashflows() IS
  'Staff may add authorized manual Finance entries only; imported Platform transactions and history are protected.';
