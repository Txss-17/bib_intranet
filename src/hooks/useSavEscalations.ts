import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { intranetRpc } from '@/lib/intranet';
import { useAuth } from '@/hooks/useAuth';

export interface SavEscalation {
 issue_id: string;
 platform_order_id: string;
 platform_boutique_id: string;
 platform_merchant_id: string;
 due_at: string;
 escalated_at: string;
 environment: 'sandbox' | 'live';
 status: 'awaiting_intake' | 'acknowledged' | 'closed';
 assigned_to: string | null;
 acknowledged_at: string | null;
 closed_at: string | null;
 resolution_note: string | null;
}
export interface SavEscalationEvent {
 id: string; issue_id: string; action: string; note: string | null;
 actor_id: string; created_at: string;
}

// This table is added by migration 0054. The permission gate and table RLS
// both reject users outside the Support scope. Never use a service key here.
const savDb = supabase as unknown as {
 from(table: string): {
  select(columns: string): {
   order(column: string, options?: { ascending?: boolean }): {
    limit(n: number): PromiseLike<{ data: unknown; error: { message: string } | null }>
   };
   eq(column: string, value: string): {
    order(column: string, options?: { ascending?: boolean }): PromiseLike<{ data: unknown; error: { message: string } | null }>
   };
  };
 };
};

export function useSavEscalationQueue() {
 const { user } = useAuth();
 return useQuery({
  queryKey: ['sav-escalation-queue', user?.id],
  enabled: !!user,
  queryFn: async (): Promise<SavEscalation[]> => {
   const { data, error } = await savDb.from('sav_escalation_queue')
    .select('issue_id,platform_order_id,platform_boutique_id,platform_merchant_id,due_at,escalated_at,environment,status,assigned_to,acknowledged_at,closed_at,resolution_note')
    .order('escalated_at', { ascending: false }).limit(200);
   if (error) throw new Error('File SAV indisponible. Vérifiez les permissions et les migrations.');
   return (data ?? []) as SavEscalation[];
  },
 });
}
export function useSavEscalationEvents(issueId: string | null) {
 const { user } = useAuth();
 return useQuery({
  queryKey: ['sav-escalation-events', user?.id, issueId],
  enabled: !!user && !!issueId,
  queryFn: async (): Promise<SavEscalationEvent[]> => {
   const { data, error } = await savDb.from('sav_escalation_queue_events')
    .select('id,issue_id,action,note,actor_id,created_at')
    .eq('issue_id', issueId!)
    .order('created_at');
   if (error) throw new Error('Journal SAV indisponible.');
   return (data ?? []) as SavEscalationEvent[];
  },
 });
}
export function useSavEscalationActions() {
 const qc = useQueryClient();
 const refresh = () => qc.invalidateQueries({ queryKey: ['sav-escalation-queue'] });
 const acknowledge = useMutation({
  mutationFn: (issueId: string) => intranetRpc<{ issue_id: string; status: string }>(
   'acknowledge_sav_escalation', { p_issue_id: issueId }),
  onSuccess: refresh,
 });
 const close = useMutation({
  mutationFn: ({ issueId, note }: { issueId: string; note: string }) =>
   intranetRpc<{ issue_id: string; status: string }>('close_sav_escalation',
    { p_issue_id: issueId, p_note: note.trim() }),
  onSuccess: () => {
   void refresh();
   void qc.invalidateQueries({ queryKey: ['sav-escalation-events'] });
  },
 });
 return { acknowledge, close };
}
