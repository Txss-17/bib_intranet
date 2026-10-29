import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRef } from 'react';
import { useAuth } from './useAuth';
import { useFieldAuditRows } from './useFieldAuditRows';
import { intranetRpc } from '@/lib/intranet';
import { readAllPages } from '@/lib/operationsMetrics';
import type { Database } from '@/integrations/supabase/types';

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

export type AuditMission = Omit<Database['public']['Tables']['field_audits']['Row'], 'workflow_status'> & { workflow_status: MissionStatus };
export type NewMission = Pick<AuditMission, 'target_name' | 'target_type' | 'audit_type' | 'scheduled_date' | 'auditor_id'> & { workflow_status?: MissionStatus };
export type MissionPatch = Partial<Pick<AuditMission, 'target_name' | 'target_type' | 'audit_type' | 'scheduled_date' | 'auditor_id' | 'workflow_status' | 'findings' | 'recommendations' | 'score' | 'decision_reason' | 'corrective_action' | 'corrective_due_date' | 'correction_evidence' | 'change_note'>>;
export interface MissionEvent {
  id: string; from_status: string | null; to_status: string | null; message: string | null;
  origin: string; created_at: string;
}

export function useAuditMissions() {
  const result = useFieldAuditRows();
  return { ...result, data: result.data as AuditMission[] | undefined };
}
export function useMissionEvents(id?: string) {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['audit-mission-events', user?.id, profile?.test_account === true, id], enabled: !!user && !!id,
    queryFn: async () => {
      const events = await readAllPages(cursor => { let query = supabase.from('audit_mission_events').select('*').eq('audit_id', id!).order('id').limit(500); if (cursor) query = query.gt('id', cursor); return query; });
      return events.sort((a, b) => a.created_at.localeCompare(b.created_at)) as MissionEvent[];
    },
  });
}
export function useAuditors() {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['auditors', user?.id, profile?.test_account === true], enabled: !!user && !!profile,
    queryFn: () => intranetRpc<{ id: string; first_name: string; last_name: string; email: string }[]>('list_audit_people', {}),
  });
}
export const useMissionActions = () => {
  const qc = useQueryClient(); const { user } = useAuth(); const keys = useRef(new Map<string, string>());
  const done = () => { for (const key of ['field-audit-rows','audit-missions','audit-mission-events','anomalies','notifications','business-history']) void qc.invalidateQueries({ queryKey: [key] }); };
  const onError = (error: Error) => toast.error('Mission d’audit', { description: error.message });
  const create = useMutation({ mutationFn: async (input: NewMission) => {
    const fingerprint = JSON.stringify([user?.id, input]); const key = keys.current.get(fingerprint) || crypto.randomUUID(); keys.current.set(fingerprint, key);
    const result = await intranetRpc<AuditMission>('create_audit_mission', { p_key: key, p_payload: input }); keys.current.delete(fingerprint); return result;
  }, onSuccess: () => { toast.success('Mission créée'); done(); }, onError });
  const update = useMutation({ mutationFn: ({ id, revision, ...patch }: MissionPatch & { id: string; revision: number }) =>
    intranetRpc<AuditMission>('update_audit_mission', { p_id: id, p_revision: revision, p_patch: patch }),
    onSuccess: () => { toast.success('Mission mise à jour'); done(); }, onError });
  return { create, update };
};
