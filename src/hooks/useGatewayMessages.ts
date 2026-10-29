import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRef } from 'react';
import { intranetRpc } from '@/lib/intranet';
import { toast } from '@/hooks/use-toast';

export type GatewayMessage = {
  id: string;

  sender_email: string;
  sender_name: string | null;

  subject: string;
  content: string;

  status:
    | 'pending'
    | 'validated'
    | 'routed'
    | 'responded'
    | 'archived';

  routed_to_pole: string | null;

  validated_by: string | null;
  validation_notes: string | null;

  response_content: string | null;
  responded_by: string | null;
  responded_at: string | null;

  created_at: string;
  updated_at: string;

  /*
   * Gmail synchronization metadata.
   *
   * These fields connect the internal Gateway message
   * with the actual Google Workspace / Gmail message.
   */
  gmail_message_id: string | null;
  gmail_thread_id: string | null;
  gmail_history_id: string | null;
  gmail_message_id_header: string | null;
  gmail_in_reply_to: string | null;
  gmail_references: string | null;
  gmail_label_ids: string[] | null;
  gmail_internal_date: string | null;
  gmail_synced_at: string | null;
};

type GatewayComposeRecipient = {
  email: string;
  name?: string | null;
};

async function getCurrentUserContext() {
  const { data: u } =
    await supabase.auth.getUser();

  let senderName = '';
  let senderPosition = '';

  if (u.user?.id) {
    const { data: p } =
      await supabase
        .from('profiles')
        .select(
          'first_name, last_name, position'
        )
        .eq('id', u.user.id)
        .maybeSingle();

    if (p) {
      senderName =
        `${(p as any).first_name ?? ''} ${(p as any).last_name ?? ''}`
          .trim();

      const pos = (p as any).position;

      if (pos) {
        const {
          positionInfos,
        } = await import(
          '@/types/positions'
        );

        senderPosition =
          positionInfos[
            pos as keyof typeof positionInfos
          ]?.titleFr ?? '';
      }
    }
  }

  return {
    user: u.user,
    senderName,
    senderPosition,
  };
}

export const useGatewayMessages = () => {
  const qc = useQueryClient();
  const outboxKeys = useRef(new Map<string, string>());
  const requestKey = (value: unknown) => { const fingerprint = JSON.stringify(value); const old = outboxKeys.current.get(fingerprint); if (old) return old; const key = crypto.randomUUID(); outboxKeys.current.set(fingerprint, key); return key; };

  /*
   * --------------------------------------------------------------------------
   * INBOX
   * --------------------------------------------------------------------------
   */

  const query = useQuery({
    queryKey: ['gateway-messages'],

    queryFn: async () => {
      const { data, error } =
        await supabase
          .from('external_messages')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

      if (error) {
        throw error;
      }

      return (data || []) as GatewayMessage[];
    },
  });

  /*
   * Realtime synchronization.
   *
   * Gmail synchronization inserts/updates external_messages.
   * The Gateway reacts to those changes automatically.
   */
  useEffect(() => {
    const channel = supabase
      .channel(
        'external_messages_changes'
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'external_messages',
        },
        () => {
          qc.invalidateQueries({
            queryKey: ['gateway-messages'],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [qc]);

  /*
   * --------------------------------------------------------------------------
   * CREATE INTERNAL / SYNTHETIC MESSAGE
   * --------------------------------------------------------------------------
   */

  const createMessage = useMutation({
    mutationFn: async (input: {
      sender_email: string;
      sender_name?: string;
      subject: string;
      content: string;
    }) => {
      const {
        data,
        error,
      } = await supabase
        .from('external_messages')
        .insert({
          ...input,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }


      return data;
    },

    onSuccess: () => {
      toast({
        title: 'Message créé',
        description:
          'Message enregistré dans la boîte de réception.',
      });

      qc.invalidateQueries({
        queryKey: ['gateway-messages'],
      });
    },

    onError: (e: any) =>
      toast({
        title: 'Erreur',
        description: e.message,
        variant: 'destructive',
      }),
  });

  /*
   * --------------------------------------------------------------------------
   * STATUS / ROUTING UPDATE
   * --------------------------------------------------------------------------
   */

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<GatewayMessage>;
    }) => {
      const {
        data: u,
      } =
        await supabase.auth.getUser();

      const {
        error,
      } = await supabase
        .from('external_messages')
        .update(patch as any)
        .eq('id', id);

      if (error) {
        throw error;
      }

      await supabase
        .from('message_routing_log')
        .insert({
          message_id: id,

          action: patch.status
            ? `status:${patch.status}`
            : 'update',

          performed_by:
            u.user?.id ?? null,

          to_status:
            (patch.status as any) ??
            null,

          notes:
            patch.validation_notes ??
            null,
        });
    },

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['gateway-messages'],
      }),

    onError: (e: any) =>
      toast({
        title: 'Erreur',
        description: e.message,
        variant: 'destructive',
      }),
  });

  /*
   * --------------------------------------------------------------------------
   * REPLY TO GMAIL MESSAGE
   * --------------------------------------------------------------------------
   *
   * This is the important Gmail integration.
   *
   * Gateway does NOT open Gmail.
   *
   * Gateway sends through the internal Supabase function,
   * which queues the message and ultimately uses Gmail API.
   *
   * Gmail threading metadata is passed along so the reply
   * can remain associated with the original Gmail conversation.
   */

  const submitted = () => { qc.invalidateQueries({ queryKey: ['gateway-outbox'] }); toast({ title: 'Communication soumise à validation', description: 'Aucun envoi externe n’a encore été effectué.' }); };
  const failed = (error: Error) => toast({ title: 'Demande non confirmée', description: error.message, variant: 'destructive' });
  const sendReply = useMutation({
    mutationFn: async ({ msg, response }: { msg: GatewayMessage; response: string }) => intranetRpc('submit_intranet_outbox', { p_key: requestKey({ source: msg.id, response }), p_source: msg.id, p_recipients: [msg.sender_email], p_subject: `Re: ${msg.subject}`, p_body: response }),
    onSuccess: submitted, onError: failed,
  });
  const sendOutbound = useMutation({
    mutationFn: async (input: { to: string; cc?: string[]; bcc?: string[]; recipientName?: string; subject: string; message: string }) => {
      const result = await intranetRpc<{ id: string }>('submit_intranet_outbox', { p_key: requestKey(input), p_source: null, p_recipients: [input.to, ...(input.cc || []), ...(input.bcc || [])], p_subject: input.subject, p_body: input.message });
      return { messageRef: result.id, count: 1 + (input.cc?.length || 0) + (input.bcc?.length || 0) };
    }, onSuccess: submitted, onError: failed,
  });

  return {
    ...query,
    createMessage,
    updateStatus,
    sendReply,
    sendOutbound,
  };
};
