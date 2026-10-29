import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { intranetRpc } from '@/lib/intranet';
import type { SupportTicket, SupportTicketFields, SupportTicketWithAccount, SupportTicketStats, SupportHistory, SupportNote, SupportPage } from '@/lib/supportTickets';

export function useSupportTickets(options?: { status?: string; priority?: string; category?: string; limit?: number }) {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['support-tickets', user?.id, profile?.test_account === true, options], enabled: !!user && !!profile,
    queryFn: async (): Promise<SupportTicketWithAccount[]> => {
      const rows: SupportTicketWithAccount[] = [];
      let cursor: string | undefined;
      for (;;) {
        let query = supabase.from('support_tickets').select('*,user_account:user_account_id(id,company_name,contact_email)').order('id').limit(500);
        if (options?.status) query = query.eq('status', options.status);
        if (options?.priority) query = query.eq('priority', options.priority);
        if (options?.category) query = query.eq('category', options.category);
        if (cursor) query = query.gt('id', cursor);
        const { data, error } = await query;
        if (error) throw new Error('Les tickets sont indisponibles. Réessayez.');
        rows.push(...data);
        if (data.length < 500) break;
        cursor = data[data.length - 1].id;
      }
      rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '') || b.id.localeCompare(a.id));
      return options?.limit ? rows.filter(row => !row.archived_at).slice(0, options.limit) : rows;
    },
  });
}
export function useSupportTicketStats() {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['support-ticket-stats', user?.id, profile?.test_account === true], enabled: !!user && !!profile,
    queryFn: () => intranetRpc<SupportTicketStats>('get_support_ticket_stats') });
}
export function useSupportAssignees() {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['support-assignees', user?.id, profile?.test_account === true], enabled: !!user && !!profile,
    queryFn: () => intranetRpc<{ id: string; name: string }[]>('list_support_assignees') });
}
export function useSupportActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const creationKeys = useRef(new Map<string, string>());
  const refresh = () => Promise.all(['support-tickets', 'support-ticket-stats', 'support-notes', 'support-history', 'notifications', 'business-history']
    .map(key => qc.invalidateQueries({ queryKey: [key] })));
  const onError = (error: Error) => toast.error(error.message);
  const create = useMutation({
    mutationFn: async (input: SupportTicketFields) => {
      const fingerprint = JSON.stringify([user?.id, input]);
      const key = creationKeys.current.get(fingerprint) || crypto.randomUUID();
      creationKeys.current.set(fingerprint, key);
      const result = await intranetRpc<SupportTicket>('create_support_ticket', { p_key: key, p_payload: input });
      creationKeys.current.delete(fingerprint);
      return result;
    }, onSuccess: () => { void refresh(); toast.success('Ticket créé'); }, onError,
  });
  const update = useMutation({
    mutationFn: (input: { id: string; revision: number; patch: Partial<SupportTicketFields> & { status?: string; resolution?: string; change_note?: string | null } }) =>
      intranetRpc<SupportTicket>('update_support_ticket', { p_id: input.id, p_revision: input.revision, p_patch: input.patch }),
    onSuccess: () => { void refresh(); toast.success('Ticket mis à jour'); }, onError,
  });
  const archive = useMutation({ mutationFn: (ticket: Pick<SupportTicket, 'id' | 'revision'>) =>
    intranetRpc<SupportTicket>('archive_support_ticket', { p_id: ticket.id, p_revision: ticket.revision }),
    onSuccess: () => { void refresh(); toast.success('Ticket archivé'); }, onError });
  const addNote = useMutation({ mutationFn: ({ id, body }: { id: string; body: string }) =>
    intranetRpc<string>('add_support_ticket_note', { p_id: id, p_body: body.trim() }),
    onSuccess: () => { void refresh(); toast.success('Note enregistrée'); }, onError });
  return { create, update, archive, addNote };
}
export function useSupportHistory(id: string, offset: number) {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['support-history', user?.id, profile?.test_account === true, id, offset], enabled: !!user && !!id,
    queryFn: () => intranetRpc<SupportPage<SupportHistory>>('list_support_ticket_history', { p_id: id, p_offset: offset }) });
}
export function useSupportNotes(id: string, offset: number) {
  const { user, profile } = useAuth();
  return useQuery({ queryKey: ['support-notes', user?.id, profile?.test_account === true, id, offset], enabled: !!user && !!id,
    queryFn: () => intranetRpc<SupportPage<SupportNote>>('list_support_ticket_notes', { p_id: id, p_offset: offset }) });
}
