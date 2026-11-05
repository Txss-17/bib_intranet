/**
 * Référentiel métier des flux BIB : aucune transaction bancaire ni émission de facture.
 * Les responsabilités contractuelles sont distinctes du compte technique Stripe.
 */
export type FinanceFlowKind = "customer_sale" | "sample_purchase" | "stock_purchase" | "supplier_audit" | "supplier_subscription" | "supplier_counter_audit" | "owned_ei_sale";
export type LegalRole = "customer" | "merchant" | "supplier" | "bib" | "ei";
export interface FinanceFlowRule {
  payer: LegalRole;
  goodsSeller: LegalRole | null;
  serviceSeller: LegalRole | null;
  invoiceIssuer: LegalRole;
  invoiceRecipient: LegalRole;
  settlement: "psp_pending_validation" | "bib_business_bank" | "owned_ei_payment";
  requiresSupplierInvoice: boolean;
}
export const FINANCE_FLOW_RULES: Readonly<Record<FinanceFlowKind, FinanceFlowRule>> = {
  customer_sale: { payer: "customer", goodsSeller: "merchant", serviceSeller: null, invoiceIssuer: "merchant", invoiceRecipient: "customer", settlement: "psp_pending_validation", requiresSupplierInvoice: false },
  sample_purchase: { payer: "merchant", goodsSeller: "supplier", serviceSeller: "bib", invoiceIssuer: "supplier", invoiceRecipient: "merchant", settlement: "psp_pending_validation", requiresSupplierInvoice: true },
  stock_purchase: { payer: "merchant", goodsSeller: "supplier", serviceSeller: "bib", invoiceIssuer: "supplier", invoiceRecipient: "merchant", settlement: "psp_pending_validation", requiresSupplierInvoice: true },
  supplier_audit: { payer: "supplier", goodsSeller: null, serviceSeller: "bib", invoiceIssuer: "bib", invoiceRecipient: "supplier", settlement: "bib_business_bank", requiresSupplierInvoice: false },
  supplier_subscription: { payer: "supplier", goodsSeller: null, serviceSeller: "bib", invoiceIssuer: "bib", invoiceRecipient: "supplier", settlement: "bib_business_bank", requiresSupplierInvoice: false },
  supplier_counter_audit: { payer: "supplier", goodsSeller: null, serviceSeller: "bib", invoiceIssuer: "bib", invoiceRecipient: "supplier", settlement: "bib_business_bank", requiresSupplierInvoice: false },
  owned_ei_sale: { payer: "customer", goodsSeller: "ei", serviceSeller: null, invoiceIssuer: "ei", invoiceRecipient: "customer", settlement: "owned_ei_payment", requiresSupplierInvoice: false },
};
export interface PaymentEvidence {
  paymentReference: string;
  expectedCents: number;
  creditedCents: number;
  bankCredited: boolean;
}
export function getBankTransferStatus(e: PaymentEvidence): "unpaid" | "partial" | "paid" | "overpaid" {
  if (!Number.isSafeInteger(e.expectedCents) || e.expectedCents <= 0 ||
      !Number.isSafeInteger(e.creditedCents) || e.creditedCents < 0) {
    throw new Error("Les montants doivent être des centimes entiers valides.");
  }
  if (!e.bankCredited || e.creditedCents === 0) return "unpaid";
  if (e.creditedCents < e.expectedCents) return "partial";
  if (e.creditedCents > e.expectedCents) return "overpaid";
  return "paid";
}
export function canIssueSupplierAuditInvoice(input: {
  quoteAccepted: boolean;
  bibLegalEntityVerified: boolean;
  taxRuleValidated: boolean;
  financeApproved: boolean;
}): boolean {
  return input.quoteAccepted && input.bibLegalEntityVerified && input.taxRuleValidated && input.financeApproved;
}
