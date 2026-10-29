import type { ModuleRecord } from './intranet';
export const DISPUTE_STAGES = { open: 'Ouvert', analysis: 'En analyse', negotiation: 'En négociation' };
export const DISPUTE_TYPES = ['Commercial','Contrat','Qualité','Livraison','Paiement','Autre'];
export const DISPUTE_OUTCOMES = { settlement: 'Résolution proposée', dismissed: 'Classement sans suite proposé' };
export interface DisputePayload extends Record<string, unknown> { party: string; type: string; description: string; stage: keyof typeof DISPUTE_STAGES; amount: string; currency: string; legal_reference: string; assessment: string; proposal: string; evidence: string; outcome: keyof typeof DISPUTE_OUTCOMES; amount_raw?: string }
export type Dispute = ModuleRecord & { payload: DisputePayload; test_account: boolean; dispute_reference: string | null; dispute_opened_at: string | null; dispute_legacy: boolean | null; dispute_required_reviews: number | null; dispute_submitted_by: string | null; dispute_submitted_at: string | null; dispute_reviewed_at: string | null; dispute_approved_at: string | null; dispute_change_note: string | null; owner_name?: string; creator_name?: string; submitter_name?: string; reviewer_name?: string; approver_name?: string };
export interface DisputeFields { title: string; payload: DisputePayload; owner: string | null; due: string | null; priority: string; visibility: string; documents: string[] }
export type DisputeAction = 'submit' | 'approve' | 'return' | 'reopen' | 'archive';
export interface DisputeStats { active: number; awaiting_review: number; closed: number; overdue: number; amounts: { currency: string; amount: string; samples: number }[]; unknown_amounts: number }
export interface DisputePage<T> { rows: T[]; has_more: boolean }
export interface DisputeEvent { id: string; kind: string; note: string | null; actor_name?: string; created_at: string; before_state: Dispute | null; after_state: Dispute | null }
export function disputePayload(value: Record<string, unknown> = {}): DisputePayload {
 const text = (key: string) => typeof value[key] === 'string' ? value[key] as string : '';
 return { ...value, party: text('party') || text('entity'), type: text('type') || 'Autre', description: text('description') || text('requirement'), stage: text('stage') in DISPUTE_STAGES ? text('stage') as DisputePayload['stage'] : 'open', amount: text('amount'), currency: text('currency'), legal_reference: text('legal_reference'), assessment: text('assessment'), proposal: text('proposal') || text('mitigation'), evidence: text('evidence'), outcome: text('outcome') === 'dismissed' ? 'dismissed' : 'settlement', ...(text('amount_raw') ? { amount_raw: text('amount_raw') } : {}) };
}
export function normalizeDispute(record: Dispute): Dispute { return { ...record, payload: disputePayload(record.payload) }; }
export function normalizeDisputeAmount(value: string) {
 const amount = value.trim().replace(/[\s\u202f\u00a0]/g, '').replace(',', '.');
 if (!amount) return '';
 if (!/^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$/.test(amount)) throw new Error('Saisissez un montant positif ou nul, avec deux décimales au maximum.');
 return amount;
}
export function disputeMoney(amount: string | null | undefined, currency: string | null | undefined) {
 if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return 'Non renseigné';
 const [whole, fraction = ''] = amount.split('.');return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f')},${fraction.padEnd(2, '0')} ${currency}`;
}
export function disputeStatus(record: Dispute) {
 if (record.status === 'draft') return DISPUTE_STAGES[record.payload.stage] || 'En traitement';
 if (record.status === 'approved' && !record.dispute_approved_at && !record.dispute_submitted_by) return 'Validation historique';
 return { submitted: 'À valider', reviewed: 'Première validation', approved: record.payload.outcome === 'dismissed' ? 'Classement validé' : 'Résolution validée', rejected: 'Reprise demandée', archived: 'Archivé' }[record.status];
}
export function disputeMayReview(record: Dispute, actor: string | undefined, canValidate: boolean, action: 'approve' | 'return' = 'approve') {
 return !!actor && canValidate && ['submitted','reviewed'].includes(record.status) && ![record.created_by,record.owner_id,record.dispute_submitted_by].includes(actor)
  && (action === 'return' || !!record.dispute_submitted_by && !(record.status === 'reviewed' && record.first_reviewer === actor));
}
export function disputeReady(record: Dispute) { return ['draft','rejected'].includes(record.status) && ['analysis','negotiation'].includes(record.payload.stage) && !!record.payload.assessment.trim() && !!record.payload.proposal.trim() && (!!record.payload.evidence.trim() || record.document_ids.length > 0); }
export function disputeDate(value: string | null | undefined) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Non documentée'; }
