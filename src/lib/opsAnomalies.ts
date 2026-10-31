import type { Database } from '@/integrations/supabase/types';
export type AnomalyStatus = 'open' | 'investigating' | 'action_required' | 'resolved' | 'closed';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyAction = 'investigate' | 'require_action' | 'resolve' | 'approve' | 'return' | 'dismiss' | 'reopen' | 'archive';
export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = { open: 'Ouverte', investigating: 'En investigation', action_required: 'Action requise', resolved: 'Correction proposée', closed: 'Clôturée' };
export const SEVERITY_LABELS: Record<AnomalySeverity, string> = { low: 'Faible', medium: 'Moyenne', high: 'Élevée', critical: 'Critique' };
export const ANOMALY_SOURCES: Record<string, string> = { orders: 'Commandes', payments: 'Paiements', stripe: 'Stripe', invoices: 'Factures', stock: 'Stocks', suppliers: 'Fournisseurs', audits: 'Audits', logistics: 'Logistique', tech: 'Tech', platform: 'BIB Platform' };
export const ANOMALY_TEAMS = ['Ops', 'Qualité', 'Finance'] as const;
export const NOTIF_KIND_LABELS: Record<string, string> = { assigned: 'Attribution', reminder: 'Rappel', overdue: 'Retard', due_changed: 'Échéance modifiée' };
type AnomalyRow = Database['public']['Tables']['anomalies']['Row'];
export type Anomaly = Omit<AnomalyRow, 'checks' | 'status' | 'severity'> & { checks: string[]; status: AnomalyStatus; severity: AnomalySeverity; owner_name?: string; creator_name?: string; resolver_name?: string; closer_name?: string; team?: string | null; corrective_action?: string | null; evidence?: string | null };
export function normalizeAnomaly(row: AnomalyRow): Anomaly {
 return { ...row, checks: Array.isArray(row.checks) ? row.checks.filter((check): check is string => typeof check === 'string') : [], status: row.status as AnomalyStatus, severity: row.severity as AnomalySeverity };
}
export interface AnomalyFields { title: string; type: string; description: string | null; source: string; severity: AnomalySeverity; team: string; category: string | null; owner_id: string | null; object_type: string | null; object_id: string | null; due_at: string | null; reminder_at: string | null; checks: string[]; corrective_action: string | null; evidence: string | null; document_ids: string[] }
export type AnomalyPatch = Partial<AnomalyFields> & { completed_checks?: string[]; change_note?: string };
export interface AnomalyStats { active: number; open: number; working: number; awaiting_review: number; overdue: number; critical: number; closed: number; dismissed: number; avg_resolution_hours: number | null; duration_samples: number }
export interface OpsPage<T> { rows: T[]; has_more: boolean }
export interface AnomalyFilters { search: string; status: string; source: string; team: string; view: string; offset: number }
export type AnomalyEvent = Database['public']['Tables']['anomaly_events']['Row'] & { actor_name?: string };
export type AnomalyNotification = Database['public']['Tables']['anomaly_notifications']['Row'] & { reference?: string; recipient_name?: string };
export function isOverdue(anomaly: Pick<Anomaly, 'due_at' | 'status' | 'archived_at'>, now = Date.now()) {
 const due = anomaly.due_at ? Date.parse(anomaly.due_at) : NaN;
 return !anomaly.archived_at && !['resolved','closed'].includes(anomaly.status) && Number.isFinite(due) && due < now;
}
export function anomalyMayReview(anomaly: Anomaly, actor: string | undefined, canValidate: boolean, action: 'approve' | 'return' | 'dismiss' = 'approve') {
 return !!actor && canValidate && !anomaly.archived_at && ![anomaly.created_by, anomaly.owner_id, anomaly.resolved_by].includes(actor)
  && (action === 'dismiss' ? ['open','investigating','action_required'].includes(anomaly.status) : anomaly.status === 'resolved' && (action === 'return' || !!anomaly.resolved_by));
}
export function anomalyReadyForResolution(anomaly: Anomaly) {
 return !!anomaly.corrective_action?.trim() && (!!anomaly.evidence?.trim() || anomaly.document_ids.length > 0) && anomaly.checks.every(check => anomaly.completed_checks.includes(check));
}
export function localDateTime(iso: string | null) {
 if (!iso) return '';const date = new Date(iso);if (!Number.isFinite(date.getTime())) return '';
 const pad = (value: number) => String(value).padStart(2, '0');
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function parseLocalDateTime(value: string) {
 if (!value) return null;const date = new Date(value);
 if (!Number.isFinite(date.getTime()) || localDateTime(date.toISOString()) !== value) throw new Error('La date ou l’heure renseignée est invalide.');
 return date.toISOString();
}
export function anomalyDate(value: string | null | undefined) {
 if (!value || !Number.isFinite(Date.parse(value))) return 'Non renseignée';
 return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}
