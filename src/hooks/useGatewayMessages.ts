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

      /*
       * Fire-and-forget acknowledgement.
       *
       * The actual transport is now Google Workspace / Gmail.
       */
      supabase.functions
        .invoke(
          'send-transactional-email',
          {
            body: {
              templateName:
                'gateway-acknowledgment',

              recipientEmail:
                input.sender_email,

              templateData: {
                senderName:
                  input.sender_name ||
                  '',

                subject:
                  input.subject,

                messageRef:
                  (data as any).id
                    .slice(0, 8)
                    .toUpperCase(),
              },
            },
          }
        )
        .then(
          () => {},
          () => {}
        );

      return data;
    },

    onSuccess: () => {
      toast({
        title: 'Message créé',
        description:
          "Accusé de réception envoyé à l'expéditeur.",
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

  const sendReply = useMutation({
    mutationFn: async ({
      msg,
      response,
    }: {
      msg: GatewayMessage;
      response: string;
    }) => {
      const {
        user,
        senderName,
        senderPosition,
      } =
        await getCurrentUserContext();

      /*
       * Gmail Message-ID is the RFC Message-ID header.
       *
       * gmail_message_id is Google's internal message resource ID.
       * gmail_message_id_header is the actual Message-ID header
       * used for In-Reply-To / References.
       */
      const originalMessageId =
        msg.gmail_message_id_header ||
        undefined;

      /*
       * Build References correctly.
       *
       * If the original message already contains References,
       * append the original Message-ID.
       *
       * Otherwise use the original Message-ID directly.
       */
      let references =
        msg.gmail_references ||
        '';

      if (
        originalMessageId &&
        !references.includes(
          originalMessageId
        )
      ) {
        references =
          references.trim()
            ? `${references.trim()} ${originalMessageId}`
            : originalMessageId;
      }

      const {
        error: invokeErr,
      } =
        await supabase.functions.invoke(
          'send-transactional-email',
          {
            body: {
              templateName:
                'gateway-reply',

              recipientEmail:
                msg.sender_email,

              /*
               * These values are consumed by
               * send-transactional-email and preserved
               * in transactional_emails.
               */
              gmailThreadId:
                msg.gmail_thread_id ??
                undefined,

              inReplyTo:
                originalMessageId,

              references:
                references || undefined,

              templateData: {
                senderName:
                  msg.sender_name ||
                  '',

                subject:
                  msg.subject,

                message:
                  response,

                messageRef:
                  msg.id
                    .slice(0, 8)
                    .toUpperCase(),

                respondedBy:
                  user?.email ??
                  'B.I.B',

                respondedByName:
                  senderName,

                respondedByPosition:
                  senderPosition,

                /*
                 * Keep the Gmail metadata available
                 * inside the template payload as well.
                 */
                gmailThreadId:
                  msg.gmail_thread_id ??
                  undefined,

                inReplyTo:
                  originalMessageId,

                references:
                  references ||
                  undefined,
              },
            },
          }
        );

      if (invokeErr) {
        throw invokeErr;
      }

      /*
       * Mark the internal Gateway message as responded.
       */
      const {
        error,
      } = await supabase
        .from('external_messages')
        .update({
          status: 'responded',

          response_content:
            response,

          responded_by:
            user?.id ?? null,

          responded_at:
            new Date().toISOString(),
        })
        .eq('id', msg.id);

      if (error) {
        throw error;
      }

      /*
       * Audit trail.
       */
      await supabase
        .from('message_routing_log')
        .insert({
          message_id: msg.id,

          action:
            'reply:sent',

          performed_by:
            user?.id ?? null,

          from_status:
            msg.status as any,

          to_status:
            'responded' as any,

          notes: [
            `Réponse envoyée par ${senderName || user?.email || 'B.I.B'}`,
            `(${senderPosition || '—'})`,
            `à ${msg.sender_email}`,
            msg.gmail_thread_id
              ? `Thread Gmail: ${msg.gmail_thread_id}`
              : 'Thread Gmail: non disponible',
          ].join(' '),
        });

      return {
        messageId: msg.id,
        gmailThreadId:
          msg.gmail_thread_id,
      };
    },

    onSuccess: () => {
      toast({
        title: 'Réponse envoyée',
        description:
          'Email transmis via Google Workspace.',
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
   * OUTBOUND MESSAGE
   * --------------------------------------------------------------------------
   *
   * This is used when a collaborator starts a new conversation
   * from Gateway, for example from:
   *
   * Marketplace → Contacter le marchand
   * Marketplace → Contacter le client
   *
   * No mailto:
   * No external Gmail UI.
   */

  const sendOutbound = useMutation({
    mutationFn: async (input: {
      to: string;
      cc?: string[];
      bcc?: string[];
      recipientName?: string;
      subject: string;
      message: string;
    }) => {
      const {
        user,
        senderName: sentByName,
        senderPosition: sentByPosition,
      } =
        await getCurrentUserContext();

      const messageRef =
        `OUT-${Date.now()
          .toString(36)
          .toUpperCase()}`;

      const sentBy =
        user?.email ??
        'B.I.B';

      const recipients = [
        input.to,
        ...(input.cc ?? []),
        ...(input.bcc ?? []),
      ]
        .map((s) => s.trim())
        .filter(Boolean);

      if (!recipients.length) {
        throw new Error(
          'Aucun destinataire valide.'
        );
      }

      const errors: string[] = [];

      /*
       * Each recipient is queued individually.
       *
       * This preserves the existing Gateway behaviour and
       * keeps the queue/idempotency model deterministic.
       */
      for (const recipient of recipients) {
        const {
          error,
        } =
          await supabase.functions.invoke(
            'send-transactional-email',
            {
              body: {
                templateName:
                  'gateway-outbound',

                recipientEmail:
                  recipient,

                idempotencyKey:
                  `gw-out-${messageRef}-${recipient}`,

                templateData: {
                  senderName:
                    input.recipientName ||
                    '',

                  subject:
                    input.subject,

                  message:
                    input.message,

                  messageRef,

                  sentBy,

                  sentByName,

                  sentByPosition,

                  ccList:
                    input.cc ?? [],
                },
              },
            }
          );

        if (error) {
          errors.push(
            `${recipient}: ${error.message}`
          );
        }
      }

      /*
       * Archive an internal representation of the
       * outbound communication.
       */
      const {
        data: archived,
        error: archiveError,
      } =
        await supabase
          .from('external_messages')
          .insert({
            sender_email:
              input.to,

            sender_name:
              input.recipientName ||
              null,

            subject:
              `[Sortant] ${input.subject}`,

            content:
              input.message,

            status:
              'responded',

            response_content:
              input.message,

            responded_by:
              user?.id ?? null,

            responded_at:
              new Date().toISOString(),

            validation_notes: [
              input.cc?.length
                ? `Cc: ${input.cc.join(', ')}`
                : null,

              input.bcc?.length
                ? `Cci: ${input.bcc.join(', ')}`
                : null,
            ]
              .filter(Boolean)
              .join(' | ') ||
              null,
          } as any)
          .select()
          .single();

      if (archiveError) {
        throw archiveError;
      }

      if (archived?.id) {
        await supabase
          .from('message_routing_log')
          .insert({
            message_id:
              archived.id,

            action:
              'outbound:sent',

            performed_by:
              user?.id ?? null,

            to_status:
              'responded' as any,

            notes: [
              `Envoi sortant par ${sentByName || sentBy} (${sentByPosition || '—'})`,

              `À: ${input.to}`,

              input.cc?.length
                ? `Cc: ${input.cc.join(', ')}`
                : null,

              input.bcc?.length
                ? `Cci: ${input.bcc.join(', ')}`
                : null,

              `Réf: ${messageRef}`,
            ]
              .filter(Boolean)
              .join(' | '),
          });
      }

      if (errors.length) {
        throw new Error(
          errors.join(' ; ')
        );
      }

      return {
        messageRef,
        count:
          recipients.length,
      };
    },

    onSuccess: (r) => {
      toast({
        title: 'Email envoyé',
        description:
          `${r.count} destinataire(s) — Réf ${r.messageRef}`,
      });

      qc.invalidateQueries({
        queryKey: ['gateway-messages'],
      });
    },

    onError: (e: any) =>
      toast({
        title: 'Erreur envoi',
        description:
          e.message,
        variant: 'destructive',
      }),
  });

  return {
    ...query,
    createMessage,
    updateStatus,
    sendReply,
    sendOutbound,
  };
};
