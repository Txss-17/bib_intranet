import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../../drizzle/migrations/0085_supplier_audit_bank_receipt_attestation.sql', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../../src/components/supplier/SupplierAuditWorkflow.tsx', import.meta.url), 'utf8');
test('the payment cannot be confirmed solely by checking an audit UI checkbox', () => {
  assert.match(sql, /CREATE TRIGGER zz_supplier_audit_verified_bank_credit\s+AFTER UPDATE/);
  assert.match(sql, /finance_attested_bank_credit_required/);
  assert.match(sql, /b\.amount_cents=\(entered->>'amount_cents'\)::bigint/);
  assert.match(sql, /b\.credited_on=\(entered->>'paid_on'\)::date/);
  assert.match(sql, /b\.bank_transaction_reference=entered->>'reference'/);
});
test('Finance validates the bank statement via restricted RPC', () => {
  assert.match(sql, /can_intranet_action\('finance\.billing','validate'\)/);
  assert.match(sql, /REVOKE ALL ON public\.supplier_audit_bank_receipts FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.attest_supplier_audit_bank_receipt/);
  assert.match(ui, /attest_supplier_audit_bank_receipt/);
  assert.match(ui, /bank_statement_reference/);
});
test('the account receipt reference is globally unique within test/prod', () => {
  assert.match(sql, /UNIQUE \(test_account, bank_transaction_reference\)/);
  assert.match(sql, /bank_reference_already_allocated/);
});
