import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { intranetRpc } from '@/lib/intranet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
type QueryError = { code?: string };
type WorkData = Record<string, unknown> & {
    id: string; first_name?: string; last_name?: string;
    owner_id?: string; created_by?: string; requester_id?: string;
    validator_id?: string; raised_by?: string; assigned_to?: string;
};
type WorkQuery = PromiseLike<{ data: WorkData[] | null; error: QueryError | null }> & {
    select(columns: string): WorkQuery;
    order(column: string, options: { ascending: boolean }): WorkQuery;
    in(column: string, values: string[]): WorkQuery;
    eq(column: string, value: unknown): WorkQuery;
    update(patch: Record<string, unknown>): WorkQuery;
    single(): PromiseLike<{ data: WorkData | null; error: QueryError | null }>;
};
// These migrations extend the generated Supabase types; keep the transport shape explicit.
const db = supabase as unknown as { from(table: string): WorkQuery };
export type WorkModuleKind = 'projects' | 'processes' | 'validations' | 'escalations';
export interface WorkVersion {
    id: string;
    revision: number;
    archived_at: string | null;
    updated_at: string;
    test_account: boolean;
}
const message = (error: QueryError | null) => new Error(error?.code === '40001' || error?.code === 'PGRST116' ? 'Cet élément a changé ou n’est plus modifiable. Actualisez avant de reprendre.' : error?.code === '42501' ? 'Cette action exige les droits adaptés et le responsable désigné.' : error?.code === '55000' ? 'Cet élément est verrouillé. Une réouverture motivée est nécessaire.' : error?.code === '22023' ? 'Vérifiez les champs, les étapes, le statut et le motif.' : 'Enregistrement non confirmé. Réessayez.');
// ---------- Projets ----------
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    planning: 'Planification',
    active: 'Actif',
    on_hold: 'En pause',
    completed: 'Terminé',
    cancelled: 'Annulé',
};
export interface WorkProject extends WorkVersion {
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
export const useWorkProjects = () => useWorkModuleRows<WorkProject>('projects');
// ---------- Processus ----------
export type ProcessStatus = 'draft' | 'active' | 'deprecated';
export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
    draft: 'Brouillon',
    active: 'Actif',
    deprecated: 'Retiré',
};
export interface WorkProcess extends WorkVersion {
    id: string;
    name: string;
    description: string | null;
    pole: string | null;
    steps: {
        label: string;
    }[];
    status: ProcessStatus;
    owner_id: string | null;
    owner_name?: string | null;
    created_by: string | null;
    created_at: string;
}
export const useWorkProcesses = () => useWorkModuleRows<WorkProcess>('processes');
// ---------- Validations ----------
export type ValidationStatus = 'pending' | 'approved' | 'rejected';
export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Rejetée',
};
export interface WorkValidation extends WorkVersion {
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
    decided_by: string | null;
    created_at: string;
}
export const useWorkValidations = () => useWorkModuleRows<WorkValidation>('validations');
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
export interface WorkEscalation extends WorkVersion {
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
export const useWorkEscalations = () => useWorkModuleRows<WorkEscalation>('escalations');
export function useWorkModuleRows<T>(kind: WorkModuleKind) {
    const { user } = useAuth();
    return useQuery({ queryKey: ['work-' + kind, user?.id], enabled: !!user, queryFn: async () => {
            const { data, error } = await db.from('work_' + kind).select('*').order('created_at', { ascending: false });
            if (error)
                throw message(error);
            const rows = data || [];
            const ids = [...new Set<string>(rows.flatMap(r => [r.owner_id, r.created_by, r.requester_id, r.validator_id, r.raised_by, r.assigned_to].filter((id): id is string => !!id)))];
            const people: Record<string, string> = {};
            for (let i = 0; i < ids.length; i += 100) {
                const { data: names } = await db.from('profiles').select('id,first_name,last_name').in('id', ids.slice(i, i + 100));
                for (const p of names || [])
                    people[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            }
            return rows.map(r => ({ ...r, steps: Array.isArray(r.steps) ? r.steps : [], owner_name: people[r.owner_id] || null, requester_name: people[r.requester_id] || null, validator_name: people[r.validator_id] || null, raised_by_name: people[r.raised_by] || null, assigned_name: people[r.assigned_to] || null })) as unknown as T[];
        } });
}
export function useWorkModulePeople(kind: WorkModuleKind) { const { user } = useAuth(); return useQuery({ queryKey: ['work-module-people', user?.id, kind], enabled: !!user, queryFn: () => intranetRpc<{
        id: string;
        first_name: string;
        last_name: string;
    }[]>('list_work_module_people', { p_kind: kind }) }); }
export function useWorkModuleActions(kind: WorkModuleKind) {
    const qc = useQueryClient();
    const { user } = useAuth();
    const keys = useRef(new Map<string, string>());
    const label = { projects: 'Projet', processes: 'Processus', validations: 'Demande', escalations: 'Escalade' }[kind];
    const done = () => Promise.all([
        'work-projects', 'work-processes', 'work-validations', 'work-escalations',
        'work-module-events', 'work-activity', 'notifications', 'business-history',
    ].map(key => qc.invalidateQueries({ queryKey: [key] })));
    const onError = (error: Error) => toast.error(error.message);
    const create = useMutation({
        mutationFn: async (input: Record<string, unknown>) => {
            const fingerprint = JSON.stringify([user?.id, kind, input]);
            const key = keys.current.get(fingerprint) || crypto.randomUUID();
            keys.current.set(fingerprint, key);
            const result = await intranetRpc<WorkVersion>('create_work_module_record', {
                p_kind: kind, p_key: key, p_payload: input,
            });
            keys.current.delete(fingerprint);
            return result;
        },
        onSuccess: () => { void done(); toast.success(label + ' enregistré(e)'); },
        onError,
    });
    const update = useMutation({
        mutationFn: async ({ id, revision, ...patch }: Record<string, unknown> & { id: string; revision: number }) => {
            if (typeof patch.status === 'string') {
                return intranetRpc('transition_work_module_record', {
                    p_kind: kind, p_id: id, p_revision: revision, p_status: patch.status,
                    p_note: patch.change_note || patch.decision_note || patch.resolution_note || '',
                });
            }
            const { data, error } = await db.from('work_' + kind).update({ ...patch, revision: revision + 1 })
                .eq('id', id).eq('revision', revision).select('id').single();
            if (error) throw message(error);
            return data;
        },
        onSuccess: () => { void done(); toast.success(label + ' mis(e) à jour'); },
        onError,
    });
    const remove = useMutation({
        mutationFn: async (row: Pick<WorkVersion, 'id' | 'revision'>) => intranetRpc('transition_work_module_record', {
            p_kind: kind, p_id: row.id, p_revision: row.revision, p_status: 'archived', p_note: '',
        }),
        onSuccess: () => { void done(); toast.success(label + ' archivé(e)'); },
        onError,
    });
    return { create, update, remove };
}
export type WorkEvent = {
    id: string;
    kind: WorkModuleKind;
    record_id: string;
    actor_name: string;
    before_responsible: string;
    after_responsible: string;
    action: string;
    note: string | null;
    before_state: Record<string, unknown> | null;
    after_state: Record<string, unknown> | null;
    created_at: string;
};
export function useWorkModuleEvents(kind: WorkModuleKind, id: string) { const { user } = useAuth(); return useQuery({ queryKey: ['work-module-events', user?.id, kind, id], enabled: !!user && !!id, queryFn: () => intranetRpc<WorkEvent[]>('list_work_module_events', { p_kind: kind, p_id: id }) }); }
export type WorkActivity = {
    id: string;
    kind: WorkModuleKind | 'tasks';
    record_id: string;
    actor_name: string;
    action: string;
    title: string;
    before_status: string | null;
    after_status: string | null;
    note: string | null;
    created_at: string;
    url: string;
};
export function useWorkActivity(kind: string, search: string, offset: number) { const { user } = useAuth(); return useQuery({ queryKey: ['work-activity', user?.id, kind, search, offset], enabled: !!user, queryFn: () => intranetRpc<{
        rows: WorkActivity[];
        has_more: boolean;
    }>('list_work_activity', { p_kind: kind, p_search: search, p_offset: offset }), refetchInterval: 30000 }); }
