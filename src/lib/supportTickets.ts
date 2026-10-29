import type { Database } from '@/integrations/supabase/types';

export type SupportStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
export const SUPPORT_STATUS: Record<SupportStatus, string> = {
  open: 'Ouvert', in_progress: 'En cours', pending: 'En attente', resolved: 'Résolu', closed: 'Fermé',
};
export const SUPPORT_PRIORITY = { low: 'Basse', medium: 'Moyenne', high: 'Haute', critical: 'Critique' };
export const SUPPORT_CATEGORY = { general: 'Général', billing: 'Facturation', technical: 'Technique', delivery: 'Livraison', quality: 'Qualité' };
export const SUPPORT_NEXT: Record<SupportStatus, SupportStatus[]> = {
  open: ['in_progress', 'pending', 'resolved'], in_progress: ['pending', 'resolved'],
  pending: ['in_progress', 'resolved'], resolved: ['closed', 'open'], closed: ['open'],
};
export type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
export type SupportTicketWithAccount = SupportTicket & {
  user_account: { id: string; company_name: string | null; contact_email: string | null } | null;
};
export interface SupportTicketFields {
  subject: string;
  description: string;
  category: string;
  priority: string;
  assigned_to: string | null;
  user_account_id: string | null;
}
export interface SupportTicketStats {
  totalTickets: number; openTickets: number; inProgressTickets: number; pendingTickets: number;
  resolvedTickets: number; closedTickets: number; activeTickets: number; highPriorityTickets: number;
  avgResolutionHours: number | null; resolutionSamples: number;
}
export type SupportHistory = { id: string; action: string; before_state: Partial<SupportTicket> | null;
  after_state: Partial<SupportTicket> | null; actor_name: string; created_at: string };
export type SupportNote = { id: string; body: string; actor_name: string; created_at: string };
export interface SupportPage<T> { rows: T[]; has_more: boolean }
export const supportTransitionNeedsNote = (before: string | null, next: SupportStatus) =>
  next === 'resolved' || next === 'open' && (before === 'resolved' || before === 'closed');
export function supportTransitionPatch(before: string | null, next: SupportStatus, note: string) {
  if (!SUPPORT_NEXT[before as SupportStatus]?.includes(next)) throw new Error('Transition indisponible pour ce ticket.');
  const reason = note.trim();
  if (supportTransitionNeedsNote(before, next) && !reason) throw new Error('Précisez la résolution ou le motif de réouverture.');
  return { status: next, change_note: reason || null, ...(next === 'resolved' ? { resolution: reason } : {}) };
}
export function resolutionDuration(hours: number | null | undefined) {
  if (hours == null || !Number.isFinite(hours) || hours < 0) return '—';
  const minutes = Math.round(hours * 60);
  if (minutes === 0) return 'Moins de 1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
}
