import { describe, it, expect } from "vitest";
import { classifyFinanceEvent, reconcileSupplierInvoiceWithBank, type FinanceReconciliationEvent } from "./financeReconciliation";

const invoice = { invoiceId: "INV-AUD-1", legalEntityId: "BIB-EI", amountCents: 15000, currency: "EUR", paymentReference: "AUD-1" };
const bankCredit: FinanceReconciliationEvent = {
  id: "row-1", source: "bib_bank", sourceEventId: "bank-1", kind: "bank_credit",
  legalEntityId: "BIB-EI", amountCents: 15000, currency: "EUR", occurredAt: "2026-11-05",
  paymentReference: "AUD-1", bankTransactionId: "bank-1", verified: true,
};
describe("financeReconciliation", () => {
  it("rapproche un crédit bancaire confirmé du compte professionnel BIB", () => {
    expect(reconcileSupplierInvoiceWithBank(invoice, [bankCredit])).toEqual({
      status: "paid", matchedCents: 15000, eventIds: ["row-1"],
    });
  });
  it("ne prend ni un paiement Stripe ni un virement annoncé pour un crédit bancaire", () => {
    const stripe = { ...bankCredit, source: "stripe" as const, kind: "stripe_payout" as const };
    expect(reconcileSupplierInvoiceWithBank(invoice, [stripe])).toMatchObject({ status: "missing" });
    expect(reconcileSupplierInvoiceWithBank(invoice, [{ ...bankCredit, verified: false }])).toMatchObject({ status: "missing" });
  });
  it("distingue partiel, trop-perçu et double import du même mouvement", () => {
    const part = { ...bankCredit, amountCents: 5000 };
    expect(reconcileSupplierInvoiceWithBank(invoice, [part]).status).toBe("partial");
    expect(reconcileSupplierInvoiceWithBank(invoice, [{ ...bankCredit, amountCents: 16000 }]).status).toBe("overpaid");
    expect(reconcileSupplierInvoiceWithBank(invoice, [bankCredit, { ...bankCredit, id: "duplicate-import" }]).matchedCents).toBe(15000);
  });
  it("ne valide pas une opération au mauvais nom de bénéficiaire", () => {
    expect(reconcileSupplierInvoiceWithBank(invoice, [{ ...bankCredit, legalEntityId: "OTHER" }]).status).toBe("missing");
  });
  it("classe séparément la télémétrie Stripe et les mouvements de banque", () => {
    expect(classifyFinanceEvent(bankCredit)).toBe("bank_reconciliation");
    expect(classifyFinanceEvent({ ...bankCredit, source: "stripe", kind: "stripe_transfer" })).toBe("stripe_reporting");
    expect(() => classifyFinanceEvent({ ...bankCredit, source: "stripe", kind: "bank_credit" })).toThrow();
  });
});
