import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { intranetRpc } from '@/lib/intranet';
import { normalizeDispute, type Dispute, type DisputeFields, type DisputeAction, type DisputeStats, type DisputePage, type DisputeEvent } from '@/lib/disputes';
import { toast } from 'sonner';
export function useDisputes(search: string, status: string, stage: string, offset: number) {
 const { user, profile } = useAuth();return useQuery({ queryKey: ['disputes',user?.id,profile?.test_account === true,search,status,stage,offset], enabled: !!user && !!profile,
 queryFn: async () => { const page = await intranetRpc<DisputePage<Dispute>>('list_compliance_disputes', { p_search: search, p_status: status, p_stage: stage, p_offset: offset });return { ...page, rows: page.rows.map(normalizeDispute) }; } });
}
export function useDispute(id: string | null) { const { user, profile } = useAuth();return useQuery({ queryKey: ['dispute',user?.id,profile?.test_account === true,id], enabled: !!user && !!profile && !!id, queryFn: async () => normalizeDispute(await intranetRpc<Dispute>('get_compliance_dispute', { p_id: id })) }); }
export function useDisputeStats() { const { user, profile } = useAuth();return useQuery({ queryKey: ['dispute-stats',user?.id,profile?.test_account === true], enabled: !!user && !!profile, queryFn: () => intranetRpc<DisputeStats>('get_compliance_dispute_stats') }); }
export function useDisputePeople() { const { user, profile } = useAuth();return useQuery({ queryKey: ['dispute-people',user?.id,profile?.test_account === true], enabled: !!user && !!profile, queryFn: () => intranetRpc<{ id: string; name: string }[]>('list_compliance_dispute_people') }); }
export function useDisputeEvents(id: string, offset: number) { const { user, profile } = useAuth();return useQuery({ queryKey: ['dispute-events',user?.id,profile?.test_account === true,id,offset], enabled: !!user && !!profile && !!id, queryFn: () => intranetRpc<DisputePage<DisputeEvent>>('list_compliance_dispute_events', { p_id: id, p_offset: offset }) }); }
export function useDisputeActions() {
 const { user, profile } = useAuth();const qc = useQueryClient();const keys = useRef(new Map<string, string>());
 const refresh = () => Promise.all(['disputes','dispute','dispute-stats','dispute-events','intranet-records','intranet-record','intranet-record-events','intranet-overview','notifications','drive-documents'].map(key => qc.invalidateQueries({ queryKey: [key] })));
 const onError = (error: Error) => toast.error(error.message);
 const save = useMutation({ mutationFn: async ({ original, fields }: { original?: Dispute; fields: DisputeFields }) => {
  const fingerprint = JSON.stringify([user?.id, profile?.test_account === true, fields]);const key = keys.current.get(fingerprint) || crypto.randomUUID();if (!original) keys.current.set(fingerprint, key);
  const result = await intranetRpc<Dispute>('save_compliance_dispute', { p_id: original?.id || null, p_revision: original?.revision || null, p_key: key, p_title: fields.title, p_payload: fields.payload, p_owner: fields.owner, p_due: fields.due, p_priority: fields.priority, p_visibility: fields.visibility, p_documents: fields.documents });if (!original) keys.current.delete(fingerprint);return result;
 }, onSuccess: () => { void refresh();toast.success('Litige enregistré'); }, onError });
 const transition = useMutation({ mutationFn: ({ record, action, note }: { record: Dispute; action: DisputeAction; note: string }) => intranetRpc<Dispute>('transition_compliance_dispute', { p_id: record.id, p_revision: record.revision, p_action: action, p_note: note }), onSuccess: () => { void refresh();toast.success('Décision enregistrée'); }, onError });
 const comment = useMutation({ mutationFn: ({ id, note }: { id: string; note: string }) => intranetRpc<string>('comment_compliance_dispute', { p_id: id, p_note: note.trim() }), onSuccess: () => { void refresh();toast.success('Commentaire ajouté'); }, onError });
 return { save, transition, comment };
}
