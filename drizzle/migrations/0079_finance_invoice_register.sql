-- Finance-owned invoice registry; never impersonates Platform or Stripe invoices.
-- The registry tracks documents and payment evidence; no invoice PDF is
-- legally issued and no payment is executed through this table.
CREATE TABLE IF NOT EXISTS public.finance_invoice_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK(direction IN ('incoming','outgoing')),
  origin text NOT NULL DEFAULT 'manual' CHECK(origin='manual'),
  invoice_number text NOT NULL CHECK(length(btrim(invoice_number)) BETWEEN 1 AND 100),
  counterparty text NOT NULL CHECK(length(btrim(counterparty)) BETWEEN 1 AND 250),
  issue_date date NOT NULL,
  due_date date,
  currency text NOT NULL DEFAULT 'EUR' CHECK(currency ~ '^[A-Z]{3}$'),
  amount_excl_tax numeric(18,2) NOT NULL CHECK(amount_excl_tax >= 0),
  tax_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK(tax_amount >= 0),
  total_amount numeric(18,2) GENERATED ALWAYS AS (amount_excl_tax + tax_amount) STORED,
  description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 2000),
  document_reference text NOT NULL CHECK(length(btrim(document_reference)) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'recorded' CHECK(status IN ('recorded','reviewing','approved','paid','cancelled')),
  payment_reference text,
  payment_date date,
  recorded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_invoice_due_date CHECK(due_date IS NULL OR due_date >= issue_date),
  CONSTRAINT finance_invoice_payment_pair CHECK(
    (status = 'paid' AND length(btrim(coalesce(payment_reference,'')))>0 AND payment_date IS NOT NULL)
    OR (status <> 'paid' AND payment_date IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS finance_invoice_manual_unique
  ON public.finance_invoice_register(direction, lower(btrim(invoice_number)), lower(btrim(counterparty)));
CREATE INDEX IF NOT EXISTS finance_invoice_due_idx ON public.finance_invoice_register(due_date, status);
ALTER TABLE public.finance_invoice_register ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.finance_invoice_register FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.finance_invoice_register TO authenticated;
CREATE POLICY finance_invoice_read ON public.finance_invoice_register FOR SELECT TO authenticated
 USING(public.can_intranet_action('finance.billing','read'));
CREATE POLICY finance_invoice_insert ON public.finance_invoice_register FOR INSERT TO authenticated
 WITH CHECK(public.can_intranet_action('finance.billing','create') AND recorded_by=auth.uid());
CREATE POLICY finance_invoice_update ON public.finance_invoice_register FOR UPDATE TO authenticated
 USING(public.can_intranet_action('finance.billing','validate'))
 WITH CHECK(public.can_intranet_action('finance.billing','validate'));

CREATE OR REPLACE FUNCTION public.guard_finance_invoice_register()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
   IF NEW.recorded_by IS DISTINCT FROM auth.uid() OR NEW.status <> 'recorded'
      OR NEW.origin <> 'manual' OR NEW.payment_date IS NOT NULL OR NEW.payment_reference IS NOT NULL THEN
      RAISE EXCEPTION 'Invalid manual invoice registration' USING ERRCODE='42501';
   END IF;
   RETURN NEW;
 END IF;
 IF TG_OP='UPDATE' THEN
   IF (to_jsonb(NEW) - ARRAY['status','payment_reference','payment_date','updated_at'])
     IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','payment_reference','payment_date','updated_at']) THEN
      RAISE EXCEPTION 'Invoice identity and amounts cannot be altered; record a correction separately' USING ERRCODE='42501';
   END IF;
   IF OLD.status IN ('paid','cancelled') OR NEW.status NOT IN ('reviewing','approved','paid','cancelled')
     OR (OLD.status='recorded' AND NEW.status NOT IN ('reviewing','cancelled'))
     OR (OLD.status='reviewing' AND NEW.status NOT IN ('approved','cancelled'))
     OR (OLD.status='approved' AND NEW.status NOT IN ('paid','cancelled'))
     OR NEW.recorded_by=auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized invoice transition or self approval' USING ERRCODE='42501';
   END IF;
   NEW.updated_at:=now();
   RETURN NEW;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS finance_invoice_guard ON public.finance_invoice_register;
CREATE TRIGGER finance_invoice_guard BEFORE INSERT OR UPDATE
  ON public.finance_invoice_register FOR EACH ROW EXECUTE FUNCTION public.guard_finance_invoice_register();
REVOKE ALL ON FUNCTION public.guard_finance_invoice_register() FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.finance_invoice_register IS 'Manual invoice records only; BIB Platform invoices remain canonical in Platform. Payment status is documentary, not an executed transfer.';
