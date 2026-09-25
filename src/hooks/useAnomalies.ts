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
}
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
  return { create, setStatus, comment };
};
