import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function loadPureTypeScript(path) {
  const source = readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(output.diagnostics?.length ?? 0, 0, 'TypeScript transpilation should succeed');
  return import('data:text/javascript;charset=utf-8,' + encodeURIComponent(output.outputText));
}

const flow = await loadPureTypeScript('src/lib/financeFlowRules.ts');
const recon = await loadPureTypeScript('src/lib/financeReconciliation.ts');

test('supplier invoices belong to BIB, stock invoices to the supplier', () => {
  assert.equal(flow.FINANCE_FLOW_RULES.supplier_audit.invoiceIssuer, 'bib');
  assert.equal(flow.FINANCE_FLOW_RULES.supplier_audit.payer, 'supplier');
  assert.equal(flow.FINANCE_FLOW_RULES.stock_purchase.invoiceIssuer, 'supplier');
  assert.equal(flow.FINANCE_FLOW_RULES.stock_purchase.settlement, 'psp_pending_validation');
});
test('a bank order without verified credit is unpaid', () => {
  assert.equal(flow.getBankTransferStatus({
    paymentReference: 'AUD-1', expectedCents: 15000,
    creditedCents: 15000, bankCredited: false,
  }), 'unpaid');
});
test('bank credit verification is distinct from Stripe events', () => {
  const bill = { invoiceId: 'INV-1', legalEntityId: 'BIB-EI', amountCents: 15000, currency: 'EUR', paymentReference: 'AUD-1' };
  const credit = {
    id: 'row-1', source: 'bib_bank', kind: 'bank_credit',
    sourceEventId: 'evt-1', bankTransactionId: 'movement-1',
    legalEntityId: 'BIB-EI', amountCents: 15000, currency: 'EUR',
    paymentReference: 'AUD-1', occurredAt: '2026-11-05', verified: true,
  };
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [credit]).status, 'paid');
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [{ ...credit, source: 'stripe', kind: 'stripe_payout' }]).status, 'missing');
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [{ ...credit, verified: false }]).status, 'missing');
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [{ ...credit, amountCents: 5000 }]).status, 'partial');
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [{ ...credit, amountCents: 16000 }]).status, 'overpaid');
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [credit, { ...credit, id: 'duplicate' }]).matchedCents, 15000);
  assert.equal(recon.reconcileSupplierInvoiceWithBank(bill, [{ ...credit, legalEntityId: 'OTHER' }]).status, 'missing');
  assert.equal(recon.classifyFinanceEvent(credit), 'bank_reconciliation');
  assert.equal(recon.classifyFinanceEvent({ ...credit, source: 'stripe', kind: 'stripe_transfer' }), 'stripe_reporting');
});
test('Finance and fiscal validation are required before audit invoicing', () => {
  assert.equal(flow.canIssueSupplierAuditInvoice({
    quoteAccepted: true, bibLegalEntityVerified: true,
    taxRuleValidated: true, financeApproved: false,
  }), false);
});
