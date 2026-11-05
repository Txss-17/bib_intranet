import { describe, expect, it } from "vitest";
import { FINANCE_FLOW_RULES, getBankTransferStatus, canIssueSupplierAuditInvoice } from "./financeFlowRules";

describe("financeFlowRules", () => {
  it("sépare l'encaissement des audits et l'achat de stock", () => {
    expect(FINANCE_FLOW_RULES.supplier_audit.payer).toBe("supplier");
    expect(FINANCE_FLOW_RULES.supplier_audit.invoiceIssuer).toBe("bib");
    expect(FINANCE_FLOW_RULES.supplier_audit.settlement).toBe("bib_business_bank");
    expect(FINANCE_FLOW_RULES.stock_purchase.invoiceIssuer).toBe("supplier");
    expect(FINANCE_FLOW_RULES.stock_purchase.settlement).toBe("psp_pending_validation");
  });
  it("ne considère pas un ordre bancaire comme paiement reçu", () => {
    expect(getBankTransferStatus({ paymentReference: "AUD-1", expectedCents: 15000, creditedCents: 15000, bankCredited: false })).toBe("unpaid");
    expect(getBankTransferStatus({ paymentReference: "AUD-1", expectedCents: 15000, creditedCents: 5000, bankCredited: true })).toBe("partial");
    expect(getBankTransferStatus({ paymentReference: "AUD-1", expectedCents: 15000, creditedCents: 15000, bankCredited: true })).toBe("paid");
  });
  it("interdit émission sans validations de base", () => {
    expect(canIssueSupplierAuditInvoice({ quoteAccepted: true, bibLegalEntityVerified: true, taxRuleValidated: true, financeApproved: false })).toBe(false);
  });
});
