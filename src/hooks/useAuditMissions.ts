import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MissionStatus =
  | 'mission' | 'planned' | 'assigned' | 'in_field' | 'synced' | 'analysis'
  | 'compliant' | 'non_compliant' | 'corrective_action' | 'closed';

export const MISSION_STEPS: MissionStatus[] = ['mission', 'planned', 'assigned', 'in_field', 'synced', 'analysis'];

export const MISSION_LABELS: Record<MissionStatus, string> = {
  mission: 'Mission créée', planned: 'Planifiée', assigned: 'Affectée', in_field: 'Audit terrain',
  synced: 'Synchronisée', analysis: 'En analyse', compliant: 'Conforme', non_compliant: 'Non conforme',
  corrective_action: 'Action corrective', closed: 'Clôturée',
};

export const MISSION_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  mission: ['planned', 'assigned'],
  planned: ['assigned'],
  assigned: ['in_field', 'planned'],
  in_field: ['synced'],
  synced: ['analysis'],
  analysis: ['compliant', 'non_compliant'],
  compliant: ['closed'],
  non_compliant: ['corrective_action'],
  corrective_action: ['closed', 'analysis'],
  closed: [],
};

export interface AuditMission {
  id: string; mission_reference: string | null; audit_type: string; target_type: string | null;
  target_name: string | null; auditor_id: string | null; scheduled_date: string | null;
  completed_date: string | null; workflow_status: MissionStatus; findings: string | null;
  recommendations: string | null; score: number | null; app_origin: string | null;
  decision_reason: string | null; corrective_action: string | null; corrective_due_date: string | null;
  anomaly_id: string | null; synced_at: string | null; created_at: string;
}
export interface MissionEvent {
  id: string; from_status: string | null; to_status: string | null; message: string | null;
  origin: string; created_at: string;
}

const db = supabase as any;

export const useAuditMissions = () =>
  useQuery({
    queryKey: ['audit-missions'],
    queryFn: async () => {
      const { data, error } = await db.from('field_audits').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AuditMission[];
    },
  });

export const useMissionEvents = (id?: string) =>
  useQuery({
    queryKey: ['audit-mission-events', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from('audit_mission_events').select('*').eq('audit_id', id).order('created_at');
      if (error) throw error;
      return (data || []) as MissionEvent[];
    },
  });

export const useAuditors = () =>
  useQuery({
    queryKey: ['auditors'],
    queryFn: async () => {
      const { data, error } = await db.from('profiles').select('id, first_name, last_name, email, poles');
      if (error) throw error;
      return ((data || []) as any[]).filter((p) => (p.poles || []).includes('audit'));
    },
  });

export const useMissionActions = () => {
  const qc = useQueryClient();
  const done = () => {
    ['audit-missions', 'audit-mission-events', 'anomalies'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const onError = (e: Error) => toast.error('Mission d’audit', { description: e.message });

  const create = useMutation({
    mutationFn: async (input: Partial<AuditMission>) => {
      const { error } = await db.from('field_audits').insert({ ...input, status: 'scheduled', app_origin: 'connect' });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Mission créée'); done(); }, onError,
  });
  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AuditMission> & { id: string }) => {
      const { error } = await db.from('field_audits').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.workflow_status ? `Étape : ${MISSION_LABELS[v.workflow_status]}` : 'Mission mise à jour',
        { description: v.workflow_status === 'non_compliant' ? 'Une anomalie a été ouverte automatiquement.' : undefined });
      done();
    },
    onError,
  });
  return { create, update };
};
