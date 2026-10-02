import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

// ---------- Projets ----------
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planification',
  active: 'Actif',
  on_hold: 'En pause',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export interface WorkProject {
  id: string;
  name: string;
  description: string | null;
  pole: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  owner_name?: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export const useWorkProjects = () =>
  useQuery({
    queryKey: ['work-projects'],
    queryFn: async () => {
      const { data, error } = await db
        .from('work_projects')
        .select('*, owner:profiles!work_projects_owner_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        owner_name: p.owner ? `${p.owner.first_name} ${p.owner.last_name}` : null,
      })) as WorkProject[];
    },
  });

// ---------- Processus ----------
export type ProcessStatus = 'draft' | 'active' | 'deprecated';
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  deprecated: 'Retiré',
};

export interface WorkProcess {
  id: string;
  name: string;
  description: string | null;
  pole: string | null;
  steps: { label: string }[];
  status: ProcessStatus;
  owner_id: string | null;
  owner_name?: string | null;
  created_by: string | null;
  created_at: string;
}

export const useWorkProcesses = () =>
  useQuery({
    queryKey: ['work-processes'],
    queryFn: async () => {
      const { data, error } = await db
        .from('work_processes')
        .select('*, owner:profiles!work_processes_owner_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        steps: Array.isArray(p.steps) ? p.steps : [],
        owner_name: p.owner ? `${p.owner.first_name} ${p.owner.last_name}` : null,
      })) as WorkProcess[];
    },
  });

// ---------- Validations ----------
export type ValidationStatus = 'pending' | 'approved' | 'rejected';
export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

export interface WorkValidation {
  id: string;
  title: string;
  description: string | null;
  pole: string | null;
  status: ValidationStatus;
  requester_id: string | null;
  requester_name?: string | null;
  validator_id: string | null;
  validator_name?: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
}

export const useWorkValidations = () =>
  useQuery({
    queryKey: ['work-validations'],
    queryFn: async () => {
      const { data, error } = await db
        .from('work_validations')
        .select('*, validator:profiles!work_validations_validator_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data || [];
      // requester profiles (auth.users id == profiles id)
      const ids = [...new Set(rows.map((r: any) => r.requester_id).filter(Boolean))];
      let requesters: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await db.from('profiles').select('id, first_name, last_name').in('id', ids);
        (profs || []).forEach((p: any) => { requesters[p.id] = `${p.first_name} ${p.last_name}`; });
      }
      return rows.map((v: any) => ({
        ...v,
        requester_name: v.requester_id ? requesters[v.requester_id] ?? null : null,
        validator_name: v.validator ? `${v.validator.first_name} ${v.validator.last_name}` : null,
      })) as WorkValidation[];
    },
  });

// ---------- Escalades ----------
export type EscalationStatus = 'open' | 'acknowledged' | 'resolved';
export const ESCALATION_STATUS_LABELS: Record<EscalationStatus, string> = {
  open: 'Ouverte',
  acknowledged: 'Prise en charge',
  resolved: 'Résolue',
};
export type EscalationSeverity = 'low' | 'medium' | 'high' | 'critical';
export const ESCALATION_SEVERITY_LABELS: Record<EscalationSeverity, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

export interface WorkEscalation {
  id: string;
  title: string;
  description: string | null;
  pole: string | null;
  severity: EscalationSeverity;
  status: EscalationStatus;
  raised_by: string | null;
  raised_by_name?: string | null;
  assigned_to: string | null;
  assigned_name?: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export const useWorkEscalations = () =>
  useQuery({
    queryKey: ['work-escalations'],
    queryFn: async () => {
      const { data, error } = await db
        .from('work_escalations')
        .select('*, assignee:profiles!work_escalations_assigned_to_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data || [];
      const ids = [...new Set(rows.map((r: any) => r.raised_by).filter(Boolean))];
      let raisers: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await db.from('profiles').select('id, first_name, last_name').in('id', ids);
        (profs || []).forEach((p: any) => { raisers[p.id] = `${p.first_name} ${p.last_name}`; });
      }
      return rows.map((e: any) => ({
        ...e,
        raised_by_name: e.raised_by ? raisers[e.raised_by] ?? null : null,
        assigned_name: e.assignee ? `${e.assignee.first_name} ${e.assignee.last_name}` : null,
      })) as WorkEscalation[];
    },
  });

// ---------- Actions ----------
export const useWorkModuleActions = () => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['work-projects'] })
      .then(() => qc.invalidateQueries({ queryKey: ['work-processes'] }))
      .then(() => qc.invalidateQueries({ queryKey: ['work-validations'] }))
      .then(() => qc.invalidateQueries({ queryKey: ['work-escalations'] }));
  const onError = (e: Error) => toast.error('Travail', { description: e.message });

  const mutate = (table: string, label: string) => ({
    create: useMutation({
      mutationFn: async (input: Record<string, unknown>) => {
        const { data: user } = await supabase.auth.getUser();
        const col = table === 'work_validations' ? 'requester_id' : table === 'work_escalations' ? 'raised_by' : 'created_by';
        const { error } = await db.from(table).insert({ ...input, [col]: user.user?.id });
        if (error) throw error;
      },
      onSuccess: () => { toast.success(`${label} créé(e)`); invalidate(); },
      onError,
    }),
    update: useMutation({
      mutationFn: async ({ id, ...patch }: Record<string, unknown> & { id: string }) => {
        const { error } = await db.from(table).update(patch).eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => { toast.success(`${label} mis(e) à jour`); invalidate(); },
      onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from(table).delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => { toast.success(`${label} supprimé(e)`); invalidate(); },
      onError,
    }),
  });

  return {
    projects: mutate('work_projects', 'Projet'),
    processes: mutate('work_processes', 'Processus'),
    validations: mutate('work_validations', 'Demande'),
    escalations: mutate('work_escalations', 'Escalade'),
  };
};
