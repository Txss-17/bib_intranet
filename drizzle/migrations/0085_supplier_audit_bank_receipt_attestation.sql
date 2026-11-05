-- Supplier audit bank transfers: an auditable Finance attestation is required
-- before the existing record_payment command can add a payment to an audit case.
-- This is NOT an API connection to a bank and does not prove external settlement automatically.
CREATE TABLE IF NOT EXISTS public.supplier_audit_bank_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.supplier_audit_cases(id) ON DELETE RESTRICT,
  test_account boolean NOT NULL,
  bank_transaction_reference text NOT NULL,
  bank_statement_reference text NOT NULL,
  credited_on date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency = 'EUR'),
  verified_by uuid NOT NULL REFERENCES auth.users(id),
  verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT supplier_audit_bank_reference_unique UNIQUE (test_account, bank_transaction_reference),
  CONSTRAINT supplier_audit_bank_receipt_unique UNIQUE (case_id, bank_transaction_reference),
  CONSTRAINT supplier_audit_bank_reference_length CHECK (char_length(btrim(bank_transaction_reference)) BETWEEN 3 AND 200),
  CONSTRAINT supplier_audit_bank_statement_length CHECK (char_length(btrim(bank_statement_reference)) BETWEEN 3 AND 500)
);
CREATE INDEX IF NOT EXISTS supplier_audit_bank_receipts_case_idx ON public.supplier_audit_bank_receipts (case_id);
ALTER TABLE public.supplier_audit_bank_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_audit_bank_receipts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.supplier_audit_bank_receipts TO service_role;
GRANT SELECT ON public.supplier_audit_bank_receipts TO authenticated;
DROP POLICY IF EXISTS supplier_audit_bank_receipts_finance_read ON public.supplier_audit_bank_receipts;
CREATE POLICY supplier_audit_bank_receipts_finance_read ON public.supplier_audit_bank_receipts
  FOR SELECT TO authenticated USING (
    test_account = public.intranet_is_test_mode()
    AND public.can_intranet_action('finance.billing','read')
  );

-- Only Finance roles with validation rights may attest that they reviewed the
-- actual bank statement. Arbitrary authenticated clients cannot insert credits.
CREATE OR REPLACE FUNCTION public.attest_supplier_audit_bank_receipt(
  p_case_id uuid,
  p_bank_transaction_reference text,
  p_bank_statement_reference text,
  p_credited_on date,
  p_amount_cents bigint
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  target public.supplier_audit_cases%ROWTYPE;
  receipt_id uuid;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.can_intranet_action('finance.billing','validate') THEN
    RAISE EXCEPTION 'finance_bank_attestation_forbidden' USING ERRCODE='42501';
  END IF;
  IF p_case_id IS NULL OR p_credited_on IS NULL OR p_credited_on > current_date
     OR p_amount_cents IS NULL OR p_amount_cents <= 0
     OR char_length(btrim(coalesce(p_bank_transaction_reference,''))) NOT BETWEEN 3 AND 200
     OR char_length(btrim(coalesce(p_bank_statement_reference,''))) NOT BETWEEN 3 AND 500 THEN
    RAISE EXCEPTION 'invalid_bank_receipt' USING ERRCODE='22023';
  END IF;
  SELECT * INTO target FROM public.supplier_audit_cases WHERE id=p_case_id;
  IF NOT FOUND OR target.test_account IS DISTINCT FROM public.intranet_is_test_mode()
     OR target.invoice IS NULL OR target.quote_state <> 'accepted' THEN
    RAISE EXCEPTION 'audited_invoice_required' USING ERRCODE='22023';
  END IF;
  -- Network retries may repeat the same immutable attestation, but must not
  -- repurpose the bank transaction reference for a different invoice or amount.
  SELECT b.id INTO receipt_id
  FROM public.supplier_audit_bank_receipts b
  WHERE b.test_account = target.test_account
    AND b.bank_transaction_reference = btrim(p_bank_transaction_reference);
  IF FOUND THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.supplier_audit_bank_receipts b
      WHERE b.id=receipt_id AND b.case_id=p_case_id
        AND b.bank_statement_reference=btrim(p_bank_statement_reference)
        AND b.credited_on=p_credited_on AND b.amount_cents=p_amount_cents
        AND b.verified_by=auth.uid()
    ) THEN
      RAISE EXCEPTION 'bank_reference_already_allocated' USING ERRCODE='23505';
    END IF;
    RETURN receipt_id;
  END IF;
  INSERT INTO public.supplier_audit_bank_receipts (
    case_id,test_account,bank_transaction_reference,bank_statement_reference,
    credited_on,amount_cents,verified_by
  ) VALUES (
    p_case_id,target.test_account,btrim(p_bank_transaction_reference),
    btrim(p_bank_statement_reference),p_credited_on,p_amount_cents,auth.uid()
  ) RETURNING id INTO receipt_id;
  RETURN receipt_id;
END;
$$;
REVOKE ALL ON FUNCTION public.attest_supplier_audit_bank_receipt(uuid,text,text,date,bigint)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attest_supplier_audit_bank_receipt(uuid,text,text,date,bigint)
  TO authenticated;

-- Trigger follows the existing supplier_audit_case command trigger and rejects
-- any payment lacking a matching Finance-attested credit. No direct payment can
-- be recorded by merely ticking a checkbox in the client.
CREATE OR REPLACE FUNCTION public.require_attested_audit_bank_credit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  entered jsonb;
BEGIN
  IF NEW.last_action IS DISTINCT FROM 'record_payment'
     OR NEW.revision IS NOT DISTINCT FROM OLD.revision THEN RETURN NEW; END IF;
  entered := NEW.command_payload;
  IF NOT EXISTS (
    SELECT 1 FROM public.supplier_audit_bank_receipts b
    WHERE b.case_id=NEW.id
      AND b.test_account=NEW.test_account
      AND b.bank_transaction_reference=entered->>'reference'
      AND b.amount_cents=(entered->>'amount_cents')::bigint
      AND b.credited_on=(entered->>'paid_on')::date
      AND b.verified_by IS DISTINCT FROM NEW.created_by
  ) THEN
    RAISE EXCEPTION 'finance_attested_bank_credit_required' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS zz_supplier_audit_verified_bank_credit ON public.supplier_audit_cases;
CREATE TRIGGER zz_supplier_audit_verified_bank_credit
AFTER UPDATE ON public.supplier_audit_cases
FOR EACH ROW EXECUTE FUNCTION public.require_attested_audit_bank_credit();
