import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type GatewayMessage = {
  id: string;
  sender_email: string;
  sender_name: string | null;
  subject: string;
  content: string;
  status: 'pending' | 'validated' | 'routed' | 'responded' | 'archived';
  routed_to_pole: string | null;
  validated_by: string | null;
  validation_notes: string | null;
  response_content: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export const useGatewayMessages = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['gateway-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as GatewayMessage[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('external_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_messages' },
        () => qc.invalidateQueries({ queryKey: ['gateway-messages'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const createMessage = useMutation({
    mutationFn: async (input: { sender_email: string; sender_name?: string; subject: string; content: string }) => {
      const { data, error } = await supabase
        .from('external_messages')
        .insert({ ...input, status: 'pending' })
        .select()
        .single();
      if (error) throw error;
      // fire-and-forget acknowledgment email
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'gateway-acknowledgment',
          recipientEmail: input.sender_email,
          templateData: {
            senderName: input.sender_name || '',
            subject: input.subject,
            messageRef: (data as any).id.slice(0, 8).toUpperCase(),
          },
        },
      }).then(() => {}, () => {});
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Message créé', description: 'Accusé de réception envoyé à l\'expéditeur.' });
      qc.invalidateQueries({ queryKey: ['gateway-messages'] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<GatewayMessage> }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from('external_messages').update(patch).eq('id', id);
      if (error) throw error;
      await supabase.from('message_routing_log').insert({
        message_id: id,
        action: patch.status ? `status:${patch.status}` : 'update',
        performed_by: u.user?.id ?? null,
        to_status: (patch.status as any) ?? null,
        notes: patch.validation_notes ?? null,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gateway-messages'] }),
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const sendReply = useMutation({
    mutationFn: async ({ msg, response }: { msg: GatewayMessage; response: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error: invokeErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'gateway-reply',
          recipientEmail: msg.sender_email,
          templateData: {
            senderName: msg.sender_name || '',
            subject: msg.subject,
            message: response,
            messageRef: msg.id.slice(0, 8).toUpperCase(),
            respondedBy: u.user?.email ?? 'B.I.B',
          },
        },
      });
      if (invokeErr) throw invokeErr;
      const { error } = await supabase.from('external_messages').update({
        status: 'responded',
        response_content: response,
        responded_by: u.user?.id ?? null,
        responded_at: new Date().toISOString(),
      }).eq('id', msg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Réponse envoyée', description: 'Email envoyé au destinataire.' });
      qc.invalidateQueries({ queryKey: ['gateway-messages'] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return { ...query, createMessage, updateStatus, sendReply };
};
