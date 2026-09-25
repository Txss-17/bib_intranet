import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AnomalyStatus = 'open' | 'investigating' | 'action_required' | 'resolved' | 'closed';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  open: 'Ouverte', investigating: 'En investigation', action_required: 'Action requise',
  resolved: 'Résolue', closed: 'Clôturée',
};
export const ANOMALY_TRANSITIONS: Record<AnomalyStatus, AnomalyStatus[]> = {
  open: ['investigating', 'closed'],
  investigating: ['action_required', 'resolved'],
  action_required: ['investigating', 'resolved'],
  resolved: ['closed', 'investigating'],
  closed: [],
};
export const SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  low: 'Faible', medium: 'Moyenne', high: 'Élevée', critical: 'Critique',
};
export const ANOMALY_SOURCES: Record<string, string> = {
  orders: 'Commandes', payments: 'Paiements', stripe: 'Stripe', invoices: 'Factures', stock: 'Stocks',
  suppliers: 'Fournisseurs', audits: 'Audits', logistics: 'Logistique', tech: 'Tech', platform: 'B.I.B Platform',
};

export interface Anomaly {
  id: string; reference: string; source: string; type: string; severity: AnomalySeverity;
  status: AnomalyStatus; title: string; description: string | null; object_type: string | null;
  object_id: string | null; owner_id: string | null; created_at: string; updated_at: string;
  resolved_at: string | null; closed_at: string | null;
  due_at: string | null; reminder_at: string | null; last_reminded_at: string | null;
  category: string | null; checks: string[]; ai_suggestion: AiSuggestion | null;
  ai_decision: 'accepted' | 'modified' | 'rejected' | null; ai_validated_at: string | null;
}
export interface AiSuggestion {
  source: string; category: string; severity: AnomalySeverity; title: string;
  rationale: string; checks: string[]; model: string; generated_at: string;
}
export interface AnomalyNotification {
  id: string; anomaly_id: string; recipient_id: string | null; kind: string; message: string | null; sent_at: string;
}
export const NOTIF_KIND_LABELS: Record<string, string> = {
  assigned: 'Assignation', reminder: 'Rappel', overdue: 'Retard', due_changed: 'Échéance modifiée',
};
export const isOverdue = (a: Anomaly) => !!a.due_at && !['resolved', 'closed'].includes(a.status) && new Date(a.due_at) < new Date();
export interface AnomalyEvent {
  id: string; anomaly_id: string; kind: string; from_status: string | null; to_status: string | null;
  message: string | null; performed_by: string | null; created_at: string;
}

const db = supabase as any;

export const useAnomalies = () =>
  useQuery({
    queryKey: ['anomalies'],
    queryFn: async () => {
      const { data, error } = await db.from('anomalies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Anomaly[];
    },
  });

export const useAnomalyEvents = (id?: string) =>
  useQuery({
    queryKey: ['anomaly-events', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from('anomaly_events').select('*').eq('anomaly_id', id).order('created_at');
      if (error) throw error;
      return (data || []) as AnomalyEvent[];
    },
  });

export const useAnomalyNotifications = (id?: string) =>
  useQuery({
    queryKey: ['anomaly-notifications', id ?? 'all'],
    queryFn: async () => {
      let q = db.from('anomaly_notifications').select('*').order('sent_at', { ascending: false }).limit(200);
      if (id) q = q.eq('anomaly_id', id);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as AnomalyNotification[];
    },
  });

export const useAssignees = () =>
  useQuery({
    queryKey: ['anomaly-assignees'],
    queryFn: async () => {
      const { data, error } = await db.from('profiles').select('id, first_name, last_name, email').order('first_name');
      if (error) throw error;
      return (data || []) as { id: string; first_name: string | null; last_name: string | null; email: string }[];
    },
  });

export const requestTriage = async (description: string, context?: string): Promise<AiSuggestion> => {
  const { data, error } = await supabase.functions.invoke('anomaly-triage', { body: { description, context } });
  if (error) {
    let msg = error.message;
    try { const b = await (error as any).context?.json(); if (b?.error) msg = b.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as AiSuggestion;
};

export const useAnomalyActions = () => {
  const qc = useQueryClient();
  const done = () => { qc.invalidateQueries({ queryKey: ['anomalies'] }); qc.invalidateQueries({ queryKey: ['anomaly-events'] }); };
  const onError = (e: Error) => toast.error('Anomalie', { description: e.message });

  const create = useMutation({
    mutationFn: async (input: Partial<Anomaly>) => {
      const { error } = await db.from('anomalies').insert(input);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Anomalie déclarée'); done(); }, onError,
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: AnomalyStatus; comment?: string }) => {
      const { error } = await db.from('anomalies').update({ status }).eq('id', id);
      if (error) throw error;
      if (comment) await db.from('anomaly_events').insert({ anomaly_id: id, kind: 'comment', message: comment });
    },
    onSuccess: () => { toast.success('Statut mis à jour'); done(); }, onError,
  });
  const comment = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const { error } = await db.from('anomaly_events').insert({ anomaly_id: id, kind: 'comment', message });
      if (error) throw error;
    },
    onSuccess: done, onError,
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Anomaly> }) => {
      const { error } = await db.from('anomalies').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Anomalie mise à jour'); done(); qc.invalidateQueries({ queryKey: ['anomaly-notifications'] }); }, onError,
  });
  return { create, setStatus, comment, update };
};
