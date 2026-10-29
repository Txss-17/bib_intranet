import type { Database } from '@/integrations/supabase/types';
export type QualityPage = 'supplier.alerts' | 'audit.nonconformities';
export type QualityKind = 'all' | 'formal' | 'alert';
export type QualityAction = 'investigate' | 'resolve' | 'approve' | 'return' | 'reopen' | 'archive';
export const QUALITY_STATUS = { open: 'Ouverte', investigating: 'En traitement', resolved: 'Correction proposée', reviewed: 'Première validation', closed: 'Clôturée' };
export const QUALITY_SEVERITY = { low: 'Faible', medium: 'Moyenne', high: 'Élevée', critical: 'Critique' };
export type QualityAlert = Database['public']['Tables']['quality_alerts']['Row'] & {
 supplier_name?: string | null; product_name?: string | null; assignee_name?: string;
 first_reviewer_name?: string; closed_by_name?: string;
};
export interface QualityFields {
 title: string; description: string; severity: string; supplier_id: string | null; product_id: string | null;
 assigned_to: string | null; is_nonconformity: boolean; corrective_action: string | null;
 corrective_due_date: string | null; evidence: string | null; document_ids: string[];
}
export interface QualityStats { total: number; active: number; open: number; investigating: number; awaiting_review: number;
 closed: number; critical: number; avg_correction_hours: number | null; duration_samples: number }
export interface QualityPageResult<T> { rows: T[]; has_more: boolean }
export interface QualityEvent { id: string; action: string; before_state: Partial<QualityAlert> | null;
 after_state: Partial<QualityAlert> | null; actor_name: string; note: string | null; created_at: string }
export function qualityMayReview(alert: QualityAlert, actor: string | undefined, canValidate: boolean, action: 'approve' | 'return' = 'approve') {
 return !!actor && canValidate && !alert.archived_at && ['resolved', 'reviewed'].includes(alert.status)
  && ![alert.reported_by, alert.assigned_to, alert.resolved_by].includes(actor)
  && !(action === 'approve' && alert.status === 'reviewed' && alert.first_reviewer === actor);
}
export const qualityActionLabel = (alert: QualityAlert, action: QualityAction) => action === 'approve'
 ? alert.status === 'resolved' && alert.approval_levels === 2 ? 'Première validation' : 'Valider et clôturer'
 : ({ investigate: 'Commencer le traitement', resolve: 'Proposer la correction', return: 'Demander une reprise', reopen: 'Rouvrir', archive: 'Archiver' }[action]);
