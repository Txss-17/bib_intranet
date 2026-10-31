import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { intranetRpc, ModuleRecord, ModuleList, ModuleEvent, Person, RecordStatus } from '@/lib/intranet';
import { toast } from 'sonner';
const productRoute = (page: string) => page.startsWith('product.');
export function useIntranetPeople(scope?: string) {
 const { user } = useAuth();
 return useQuery({ queryKey: ['intranet-people', user?.id, scope], enabled: !!user, queryFn: () => intranetRpc<Person[]>(scope === 'product' ? 'product_people' : 'list_intranet_people'), staleTime: 60000 });
}
export function useIntranetRecords(page: string, search: string, status: string, offset: number, allowed = true) {
 const { user, profile } = useAuth();
 return useQuery({ queryKey: ['intranet-records', user?.id, profile?.test_account === true, page, search, status, offset], enabled: !!user && !!profile && !!page && allowed, queryFn: () => intranetRpc<ModuleList>(productRoute(page) ? 'product_list_records' : 'list_intranet_records', { p_page: page, p_search: search, p_status: status, p_offset: offset }) });
}
export function useIntranetRecordEvents(recordId: string | undefined, scope?: string) {
 const { user } = useAuth();
 return useQuery({ queryKey: ['intranet-record-events', user?.id, recordId, scope], enabled: !!user && !!recordId, queryFn: () => intranetRpc<ModuleEvent[]>(scope === 'product' ? 'product_record_events' : 'list_intranet_record_events', { p_id: recordId }) });
}
export function useIntranetRecordActions(page: string) {
 const qc = useQueryClient();
 const done = () => { void qc.invalidateQueries({ queryKey: ['intranet-records'] }); void qc.invalidateQueries({ queryKey: ['intranet-record-events'] }); void qc.invalidateQueries({ queryKey: ['intranet-record'] }); void qc.invalidateQueries({ queryKey: ['notifications'] }); };
 const onError = (error: Error) => toast.error(error.message);
 const save = useMutation({ mutationFn: (input: { original?: ModuleRecord; key: string; title: string; payload: Record<string, unknown>; owner: string | null; due: string | null; priority: string; visibility: string; documents: string[] }) => intranetRpc<ModuleRecord>(productRoute(page) ? 'product_save_record' : 'save_intranet_record', { p_id: input.original?.id || null, p_page: page, p_expected_revision: input.original?.revision || null, p_key: input.key, p_title: input.title, p_payload: input.payload, p_owner: input.owner, p_due: input.due, p_priority: input.priority, p_visibility: input.visibility, p_documents: input.documents }), onSuccess: () => { done(); toast.success('Dossier enregistré'); }, onError });
 const transition = useMutation({ mutationFn: (input: { record: ModuleRecord; status: RecordStatus; note: string }) => intranetRpc<ModuleRecord>(productRoute(page) ? 'product_transition_record' : 'transition_intranet_record', { p_id: input.record.id, p_expected_revision: input.record.revision, p_status: input.status, p_note: input.note }), onSuccess: () => { done(); toast.success('Décision enregistrée'); }, onError });
 const comment = useMutation({ mutationFn: (input: { id: string; note: string }) => intranetRpc<string>(productRoute(page) ? 'product_comment_record' : 'comment_intranet_record', { p_id: input.id, p_note: input.note }), onSuccess: done, onError });
 return { save, transition, comment };
}

export function useIntranetRecord(id: string | null, scope?: string) {
 const { user } = useAuth();
 return useQuery({ queryKey: ['intranet-record', user?.id, id, scope], enabled: !!user && !!id, queryFn: () => intranetRpc<ModuleRecord>(scope === 'product' ? 'product_get_record' : 'get_intranet_record', { p_id: id }) });
}
