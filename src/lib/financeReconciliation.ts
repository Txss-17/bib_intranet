/**
 * Normalisation de données de rapprochement : ne contacte ni Stripe ni une banque.
 * Les adaptateurs serveur authentifiés restent seuls habilités à produire ces entrées.
 */
export type FinanceSource = "stripe" | "bib_bank";
export type FinanceEventKind =
  | "stripe_charge" | "stripe_transfer" | "stripe_payout" | "stripe_refund"
  | "stripe_dispute" | "stripe_fee" | "bank_credit" | "bank_debit";
export interface FinanceReconciliationEvent {
  id: string;
  source: FinanceSource;
  sourceEventId: string;
  kind: FinanceEventKind;
  legalEntityId: string;
  amountCents: number;
  currency: string;
  occurredAt: string;
  invoiceId?: string;
  paymentReference?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  stripePayoutId?: string;
  bankTransactionId?: string;
  verified: boolean;
}
export type ReconciliationResult =
  | { status: "missing"; matchedCents: 0; eventIds: [] }
  | { status: "requires_review"; matchedCents: number; eventIds: string[] }
  | { status: "partial" | "paid" | "overpaid"; matchedCents: number; eventIds: string[] };

const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
/**
 * Crédit bancaire confirmé uniquement : un payout Stripe marqué « paid »
 * ne prouve pas à lui seul un crédit sur le relevé du compte BIB.
 */
export function reconcileSupplierInvoiceWithBank(
  invoice: { invoiceId: string; legalEntityId: string; amountCents: number; currency: string; paymentReference: string },
  events: readonly FinanceReconciliationEvent[],
): ReconciliationResult {
  if (!Number.isSafeInteger(invoice.amountCents) || invoice.amountCents <= 0) throw new Error("Montant de facture invalide.");
  if (!invoice.invoiceId.trim() || !invoice.legalEntityId.trim() || !invoice.paymentReference.trim()) {
    throw new Error("Facture, bénéficiaire et référence bancaire obligatoires.");
  }
  const matching = events.filter(e =>
    e.source === "bib_bank" && e.kind === "bank_credit" && e.verified &&
    e.legalEntityId === invoice.legalEntityId &&
    e.currency.toUpperCase() === invoice.currency.toUpperCase() &&
    (e.invoiceId === invoice.invoiceId || normalize(e.paymentReference ?? "") === normalize(invoice.paymentReference)),
  );
  if (!matching.length) return { status: "missing", matchedCents: 0, eventIds: [] };
  const seen = new Set<string>();
  let amount = 0;
  const ids: string[] = [];
  for (const event of matching) {
    if (!event.bankTransactionId?.trim() || !Number.isSafeInteger(event.amountCents) || event.amountCents <= 0) {
      return { status: "requires_review", matchedCents: amount, eventIds: ids };
    }
    const key = `${event.legalEntityId}:${event.bankTransactionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    amount += event.amountCents;
    if (!Number.isSafeInteger(amount)) throw new Error("Montant rapproché hors limites.");
    ids.push(event.id);
  }
  return { status: amount < invoice.amountCents ? "partial" : amount > invoice.amountCents ? "overpaid" : "paid", matchedCents: amount, eventIds: ids };
}
export function classifyFinanceEvent(event: FinanceReconciliationEvent): "stripe_reporting" | "bank_reconciliation" {
  const stripeKinds: FinanceEventKind[] = ["stripe_charge", "stripe_transfer", "stripe_payout", "stripe_refund", "stripe_dispute", "stripe_fee"];
  if (event.source === "stripe" && stripeKinds.includes(event.kind)) return "stripe_reporting";
  if (event.source === "bib_bank" && (event.kind === "bank_credit" || event.kind === "bank_debit")) return "bank_reconciliation";
  throw new Error("Source et type d'événement financier incohérents.");
}
