import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RoutingLogEntry = {
  id: string;
  message_id: string | null;
  action: string;
  performed_by: string | null;
  from_status: string | null;
  to_status: string | null;
  notes: string | null;
  created_at: string;
  performer?: { first_name: string | null; last_name: string | null; email: string | null } | null;
  message?: { subject: string | null; sender_email: string | null } | null;
};

export const useMessageRoutingLog = (messageId?: string) => {
  return useQuery({
    queryKey: ['message-routing-log', messageId ?? 'all'],
    queryFn: async (): Promise<RoutingLogEntry[]> => {
      let q = supabase
        .from('message_routing_log')
        .select('*, performer:profiles!message_routing_log_performed_by_fkey(first_name,last_name,email), message:external_messages!message_routing_log_message_id_fkey(subject,sender_email)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (messageId) q = q.eq('message_id', messageId);
      const { data, error } = await q;
      if (error) {
        // fallback without joins if FKs aren't named
        const { data: d2, error: e2 } = await (messageId
          ? supabase.from('message_routing_log').select('*').eq('message_id', messageId).order('created_at', { ascending: false }).limit(200)
          : supabase.from('message_routing_log').select('*').order('created_at', { ascending: false }).limit(200));
        if (e2) throw e2;
        return (d2 || []) as any;
      }
      return (data || []) as any;
    },
  });
};
