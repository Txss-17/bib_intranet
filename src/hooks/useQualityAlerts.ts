import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { intranetRpc } from '@/lib/intranet';
import { toast } from 'sonner';
import type { QualityPage, QualityKind, QualityAction, QualityAlert, QualityFields, QualityStats, QualityPageResult, QualityEvent } from '@/lib/qualityAlerts';
export function useQualityAlerts(page: QualityPage, kind: QualityKind, search: string, status: string, offset: number, enabled = true) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-alerts', user?.id, profile?.test_account === true, page, kind, search, status, offset], enabled: !!user && !!profile && enabled,
 queryFn: () => intranetRpc<QualityPageResult<QualityAlert>>('list_quality_alerts', { p_page: page, p_kind: kind, p_search: search, p_status: status, p_offset: offset }) });
}
export function useQualityAlert(page: QualityPage, id: string | null) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-alert', user?.id, profile?.test_account === true, page, id], enabled: !!user && !!id,
 queryFn: () => intranetRpc<QualityAlert>('get_quality_alert', { p_page: page, p_id: id }) });
}
export function useQualityStats(page: string, kind: QualityKind = 'all') {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-stats', user?.id, profile?.test_account === true, page, kind], enabled: !!user && !!profile,
 queryFn: () => intranetRpc<QualityStats>('get_quality_stats', { p_page: page, p_kind: kind }) });
}
export function useQualityPeople(page: QualityPage) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-people', user?.id, profile?.test_account === true, page], enabled: !!user && !!profile,
 queryFn: () => intranetRpc<{ id: string; name: string }[]>('list_quality_people', { p_page: page }) });
}
export function useQualityTimeline(page: QualityPage, id: string, offset: number) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-timeline', user?.id, profile?.test_account === true, page, id, offset], enabled: !!user && !!id,
 queryFn: () => intranetRpc<QualityPageResult<QualityEvent>>('list_quality_timeline', { p_page: page, p_id: id, p_offset: offset }) });
}
export function useQualityActions(page: QualityPage) {
 const { user } = useAuth(); const qc = useQueryClient(); const keys = useRef(new Map<string, string>());
 const refresh = () => Promise.all(['quality-alerts','quality-alert','quality-stats','quality-timeline','quality_alerts','audit_dashboard_stats','supplier_dashboard_stats','critical_quality_alerts','business-history','notifications','drive-documents','field-audit-rows']
  .map(key => qc.invalidateQueries({ queryKey: [key] })));
 const onError = (error: Error) => toast.error(error.message);
 const create = useMutation({ mutationFn: async (input: QualityFields) => {
  const fingerprint = JSON.stringify([user?.id, page, input]); const key = keys.current.get(fingerprint) || crypto.randomUUID(); keys.current.set(fingerprint, key);
  const result = await intranetRpc<QualityAlert>('create_quality_alert', { p_page: page, p_key: key, p_payload: input }); keys.current.delete(fingerprint); return result;
 }, onSuccess: () => { void refresh(); toast.success('Signalement créé'); }, onError });
 const update = useMutation({ mutationFn: ({ id, revision, patch }: { id: string; revision: number; patch: Partial<QualityFields> & { change_note?: string } }) =>
  intranetRpc<QualityAlert>('update_quality_alert', { p_page: page, p_id: id, p_revision: revision, p_patch: patch }), onSuccess: () => { void refresh(); toast.success('Signalement mis à jour'); }, onError });
 const transition = useMutation({ mutationFn: ({ alert, action, note }: { alert: QualityAlert; action: QualityAction; note: string }) =>
  intranetRpc<QualityAlert>('transition_quality_alert', { p_page: page, p_id: alert.id, p_revision: alert.revision, p_action: action, p_note: note }), onSuccess: () => { void refresh(); toast.success('Décision enregistrée'); }, onError });
 const comment = useMutation({ mutationFn: ({ id, body }: { id: string; body: string }) =>
  intranetRpc<string>('add_quality_comment', { p_page: page, p_id: id, p_body: body.trim() }), onSuccess: () => { void refresh(); toast.success('Commentaire enregistré'); }, onError });
 return { create, update, transition, comment };
}

export function useQualityReferences(page: QualityPage) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['quality-references', user?.id, profile?.test_account === true, page], enabled: !!user && !!profile,
 queryFn: async () => {
  async function pages<T extends { id: string }>(fetchPage: (cursor?: string) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
   const all: T[] = []; let cursor: string | undefined;
   for (;;) { const { data, error } = await fetchPage(cursor); if (error) throw new Error('Références indisponibles.'); all.push(...(data || [])); if (!data || data.length < 500) break; cursor = data[data.length - 1].id; }return all;
  }
  const [suppliers, products] = await Promise.all([
   pages(cursor => { let query = supabase.from('suppliers').select('id,name').order('id').limit(500); if (cursor) query = query.gt('id', cursor); return query; }),
   pages(cursor => { let query = supabase.from('products').select('id,name,supplier_id').order('id').limit(500); if (cursor) query = query.gt('id', cursor); return query; }),
  ]);
  return { suppliers, products };
 }});
}
