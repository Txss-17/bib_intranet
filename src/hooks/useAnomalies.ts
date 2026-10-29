import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { intranetRpc } from '@/lib/intranet';
import { normalizeAnomaly, type Anomaly, type AnomalyFields, type AnomalyPatch, type AnomalyAction, type AnomalyFilters, type AnomalyStats, type AnomalyEvent, type AnomalyNotification, type OpsPage } from '@/lib/opsAnomalies';
import { toast } from 'sonner';
export function useAnomalies(filters: AnomalyFilters) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['anomalies', user?.id, profile?.test_account === true, filters], enabled: !!user && !!profile,
  queryFn: async () => { const result = await intranetRpc<OpsPage<Anomaly>>('list_ops_anomalies', { p_search: filters.search, p_status: filters.status, p_source: filters.source, p_team: filters.team, p_view: filters.view, p_offset: filters.offset });return { ...result, rows: result.rows.map(normalizeAnomaly) }; } });
}
export function useAnomaly(id: string | null) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['ops-anomaly', user?.id, profile?.test_account === true, id], enabled: !!user && !!profile && !!id,
  queryFn: async () => normalizeAnomaly(await intranetRpc<Anomaly>('get_ops_anomaly', { p_id: id })) });
}
export function useAnomalyStats(page = 'ops.anomalies') {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['ops-anomaly-stats', user?.id, profile?.test_account === true, page], enabled: !!user && !!profile,
  queryFn: () => intranetRpc<AnomalyStats>('get_ops_anomaly_stats', { p_page: page }) });
}
export function useAnomalyEvents(id: string, offset: number) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['anomaly-events', user?.id, profile?.test_account === true, id, offset], enabled: !!user && !!profile && !!id,
  queryFn: () => intranetRpc<OpsPage<AnomalyEvent>>('list_ops_anomaly_events', { p_id: id, p_offset: offset }) });
}
export function useAnomalyNotifications(id: string | null, offset: number) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['anomaly-notifications', user?.id, profile?.test_account === true, id, offset], enabled: !!user && !!profile,
  queryFn: () => intranetRpc<OpsPage<AnomalyNotification>>('list_ops_anomaly_notifications', { p_id: id, p_offset: offset }) });
}
export function useAssignees() {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['anomaly-assignees', user?.id, profile?.test_account === true], enabled: !!user && !!profile,
  queryFn: () => intranetRpc<{ id: string; name: string }[]>('list_ops_anomaly_people', {}) });
}
export function useAnomalyActions() {
 const { user, profile } = useAuth();const qc = useQueryClient();const keys = useRef(new Map<string, string>());
 const done = () => Promise.all(['anomalies','ops-anomaly','ops-anomaly-stats','anomaly-events','anomaly-notifications','direction-ops','dashboard_kpis_real','executive_critical_alerts','critical_notifications','notifications','drive-documents','business-history'].map(key => qc.invalidateQueries({ queryKey: [key] })));
 const onError = (error: Error) => toast.error('Anomalie', { description: error.message });
 const create = useMutation({ mutationFn: async (input: AnomalyFields) => {
  const fingerprint = JSON.stringify([user?.id, profile?.test_account === true, input]);const key = keys.current.get(fingerprint) || crypto.randomUUID();keys.current.set(fingerprint, key);
  const result = await intranetRpc<Anomaly>('create_ops_anomaly', { p_key: key, p_payload: input });keys.current.delete(fingerprint);return result;
 }, onSuccess: () => { void done();toast.success('Anomalie déclarée'); }, onError });
 const update = useMutation({ mutationFn: ({ id, revision, patch }: { id: string; revision: number; patch: AnomalyPatch }) => intranetRpc<Anomaly>('update_ops_anomaly', { p_id: id, p_revision: revision, p_patch: patch }), onSuccess: () => { void done();toast.success('Anomalie mise à jour'); }, onError });
 const transition = useMutation({ mutationFn: ({ anomaly, action, note }: { anomaly: Anomaly; action: AnomalyAction; note: string }) => intranetRpc<Anomaly>('transition_ops_anomaly', { p_id: anomaly.id, p_revision: anomaly.revision, p_action: action, p_note: note }), onSuccess: () => { void done();toast.success('Décision enregistrée'); }, onError });
 const comment = useMutation({ mutationFn: ({ id, message }: { id: string; message: string }) => intranetRpc<string>('add_ops_anomaly_comment', { p_id: id, p_message: message.trim() }), onSuccess: () => { void done();toast.success('Commentaire ajouté'); }, onError });
 return { create, update, transition, comment };
}
