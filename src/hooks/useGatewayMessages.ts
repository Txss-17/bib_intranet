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
      const { error } = await supabase.from('external_messages').update(patch as any).eq('id', id);
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
      let senderName = '';
      let senderPosition = '';
      if (u.user?.id) {
        const { data: p } = await supabase
          .from('profiles')
          .select('first_name, last_name, position')
          .eq('id', u.user.id)
          .maybeSingle();
        if (p) {
          senderName = `${(p as any).first_name ?? ''} ${(p as any).last_name ?? ''}`.trim();
          const pos = (p as any).position;
          if (pos) {
            const { positionInfos } = await import('@/types/positions');
            senderPosition = positionInfos[pos as keyof typeof positionInfos]?.titleFr ?? '';
          }
        }
      }
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
            respondedByName: senderName,
            respondedByPosition: senderPosition,
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
      await supabase.from('message_routing_log').insert({
        message_id: msg.id,
        action: 'reply:sent',
        performed_by: u.user?.id ?? null,
        from_status: msg.status as any,
        to_status: 'responded' as any,
        notes: `Réponse envoyée par ${senderName || u.user?.email} (${senderPosition || '—'}) à ${msg.sender_email}`,
      });
    },
    onSuccess: () => {
      toast({ title: 'Réponse envoyée', description: 'Email envoyé au destinataire.' });
      qc.invalidateQueries({ queryKey: ['gateway-messages'] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const sendOutbound = useMutation({
    mutationFn: async (input: {
      to: string;
      cc?: string[];
      bcc?: string[];
      recipientName?: string;
      subject: string;
      message: string;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      const messageRef = `OUT-${Date.now().toString(36).toUpperCase()}`;
      const sentBy = u.user?.email ?? 'B.I.B';

      let sentByName = '';
      let sentByPosition = '';
      if (u.user?.id) {
        const { data: p } = await supabase
          .from('profiles')
          .select('first_name, last_name, position')
          .eq('id', u.user.id)
          .maybeSingle();
        if (p) {
          sentByName = `${(p as any).first_name ?? ''} ${(p as any).last_name ?? ''}`.trim();
          const pos = (p as any).position;
          if (pos) {
            const { positionInfos } = await import('@/types/positions');
            sentByPosition = positionInfos[pos as keyof typeof positionInfos]?.titleFr ?? '';
          }
        }
      }

      const recipients = [
        input.to,
        ...(input.cc ?? []),
        ...(input.bcc ?? []),
      ].map(s => s.trim()).filter(Boolean);

      const errors: string[] = [];
      for (const r of recipients) {
        const { error } = await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'gateway-outbound',
            recipientEmail: r,
            idempotencyKey: `gw-out-${messageRef}-${r}`,
            templateData: {
              senderName: input.recipientName || '',
              subject: input.subject,
              message: input.message,
              messageRef,
              sentBy,
              sentByName,
              sentByPosition,
              ccList: input.cc ?? [],
            },
          },
        });
        if (error) errors.push(`${r}: ${error.message}`);
      }

      // Archive a record of the outbound in external_messages
      const { data: archived } = await supabase.from('external_messages').insert({
        sender_email: input.to,
        sender_name: input.recipientName || null,
        subject: `[Sortant] ${input.subject}`,
        content: input.message,
        status: 'responded',
        response_content: input.message,
        responded_by: u.user?.id ?? null,
        responded_at: new Date().toISOString(),
        validation_notes: [
          input.cc?.length ? `Cc: ${input.cc.join(', ')}` : null,
          input.bcc?.length ? `Cci: ${input.bcc.join(', ')}` : null,
        ].filter(Boolean).join(' | ') || null,
      } as any).select().single();

      if (archived?.id) {
        await supabase.from('message_routing_log').insert({
          message_id: archived.id,
          action: 'outbound:sent',
          performed_by: u.user?.id ?? null,
          to_status: 'responded' as any,
          notes: [
            `Envoi sortant par ${sentByName || sentBy} (${sentByPosition || '—'})`,
            `À: ${input.to}`,
            input.cc?.length ? `Cc: ${input.cc.join(', ')}` : null,
            input.bcc?.length ? `Cci: ${input.bcc.join(', ')}` : null,
            `Réf: ${messageRef}`,
          ].filter(Boolean).join(' | '),
        });
      }

      if (errors.length) throw new Error(errors.join(' ; '));
      return { messageRef, count: recipients.length };
    },
    onSuccess: (r) => {
      toast({ title: 'Email envoyé', description: `${r.count} destinataire(s) — Réf ${r.messageRef}` });
      qc.invalidateQueries({ queryKey: ['gateway-messages'] });
    },
    onError: (e: any) => toast({ title: 'Erreur envoi', description: e.message, variant: 'destructive' }),
  });

  return { ...query, createMessage, updateStatus, sendReply, sendOutbound };
};
