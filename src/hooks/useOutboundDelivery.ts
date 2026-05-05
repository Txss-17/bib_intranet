import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DeliveryStatus = 'pending' | 'sent' | 'bounced' | 'failed' | 'suppressed' | 'dlq' | 'unknown';

export type DeliveryEntry = {
  recipient_email: string;
  status: DeliveryStatus;
  error_message: string | null;
  created_at: string;
};

/**
 * Fetch latest email_send_log entry per recipient for gateway-outbound emails
 * within the last 7 days. Used to display real delivery status on outbound history.
 */
export const useOutboundDelivery = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['outbound-delivery'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from('email_send_log')
        .select('recipient_email, status, error_message, created_at, message_id')
        .in('template_name', ['gateway-outbound', 'gateway-reply'])
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      // Keep only the latest row per message_id
      const latestByMsg = new Map<string, any>();
      for (const r of data ?? []) {
        if (!latestByMsg.has((r as any).message_id)) latestByMsg.set((r as any).message_id, r);
      }
      const map = new Map<string, DeliveryEntry>();
      for (const r of latestByMsg.values()) {
        const key = `${r.recipient_email}|${r.created_at.slice(0, 16)}`;
        if (!map.has(r.recipient_email) || new Date(r.created_at) > new Date(map.get(r.recipient_email)!.created_at)) {
          map.set(r.recipient_email, {
            recipient_email: r.recipient_email,
            status: r.status as DeliveryStatus,
            error_message: r.error_message,
            created_at: r.created_at,
          });
        }
        void key;
      }
      return Array.from(map.values());
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel('email_send_log_outbound')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_send_log' },
        () => qc.invalidateQueries({ queryKey: ['outbound-delivery'] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return query;
};
