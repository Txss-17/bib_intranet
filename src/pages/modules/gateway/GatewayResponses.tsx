```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Send,
  MessageSquareReply,
  CheckCheck,
  AlertTriangle,
  Clock,
  Ban,
  ExternalLink,
} from 'lucide-react';
import {
  useGatewayMessages,
  GatewayMessage,
} from '@/hooks/useGatewayMessages';
import {
  useOutboundDelivery,
  DeliveryStatus,
} from '@/hooks/useOutboundDelivery';

const isOutbound = (subject: string | null | undefined) =>
  Boolean(
    subject
      ?.trim()
      .toLowerCase()
      .startsWith('[sortant]'),
  );

const deliveryConfig: Record<
  DeliveryStatus,
  {
    label: string;
    variant: any;
    icon: any;
    tone: string;
  }
> = {
  sent: {
    label: 'Envoyé',
    variant: 'default',
    icon: CheckCheck,
    tone: 'text-green-500',
  },
  pending: {
    label: 'En cours…',
    variant: 'secondary',
    icon: Clock,
    tone: 'text-muted-foreground',
  },
  bounced: {
    label: 'Bounce',
    variant: 'destructive',
    icon: AlertTriangle,
    tone: 'text-destructive',
  },
  failed: {
    label: 'Échec',
    variant: 'destructive',
    icon: AlertTriangle,
    tone: 'text-destructive',
  },
  dlq: {
    label: 'Échec',
    variant: 'destructive',
    icon: AlertTriangle,
    tone: 'text-destructive',
  },
  suppressed: {
    label: 'Bloqué (RGPD)',
    variant: 'outline',
    icon: Ban,
    tone: 'text-amber-500',
  },
  unknown: {
    label: '—',
    variant: 'outline',
    icon: Clock,
    tone: 'text-muted-foreground',
  },
};

const DeliveryBadge = ({
  status,
  error,
}: {
  status: DeliveryStatus;
  error?: string | null;
}) => {
  const cfg =
    deliveryConfig[status] ??
    deliveryConfig.unknown;

  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge
        variant={cfg.variant}
        className="gap-1"
      >
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>

      {error && (
        <span className="max-w-xs text-right text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
};

export default function GatewayResponses() {
  const navigate = useNavigate();

  const {
    data: messages = [],
    sendReply,
  } = useGatewayMessages();

  const { data: deliveries = [] } =
    useOutboundDelivery();

  const [drafts, setDrafts] = useState<
    Record<string, string>
  >({});

  /*
   * --------------------------------------------------------------------------
   * MESSAGES
   * --------------------------------------------------------------------------
   */

  const incoming = messages.filter(
    (message) =>
      !isOutbound(message.subject),
  );

  /*
   * Un message attribué peut être traité directement.
   *
   * On ne dépend plus de :
   *
   *   status === "validated"
   *
   * pour autoriser une réponse.
   */

  const toRespond = incoming.filter(
    (message) =>
      Boolean(message.routed_to_pole) &&
      message.status !== 'responded' &&
      message.status !== 'archived',
  );

  const replied = incoming.filter(
    (message) =>
      message.status === 'responded',
  );

  const outbound = messages.filter(
    (message) =>
      isOutbound(message.subject),
  );

  /*
   * --------------------------------------------------------------------------
   * DELIVERY
   * --------------------------------------------------------------------------
   */

  const deliveryMap = useMemo(() => {
    const map = new Map<
      string,
      {
        status: DeliveryStatus;
        error: string | null;
      }
    >();

    for (const delivery of deliveries) {
      map.set(
        delivery.recipient_email.toLowerCase(),
        {
          status: delivery.status,
          error:
            delivery.error_message,
        },
      );
    }

    return map;
  }, [deliveries]);

  const getDelivery = (
    email: string,
  ) =>
    deliveryMap.get(
      email.toLowerCase(),
    ) ?? {
      status:
        'unknown' as DeliveryStatus,
      error: null,
    };

  /*
   * --------------------------------------------------------------------------
   * ACTIONS
   * --------------------------------------------------------------------------
   */

  const handleSend = async (
    message: GatewayMessage,
  ) => {
    const response =
      drafts[message.id]?.trim();

    if (!response) {
      return;
    }

    await sendReply.mutateAsync({
      msg: message,
      response,
    });

    setDrafts((current) => ({
      ...current,
      [message.id]: '',
    }));
  };

  const handleOpenMessage = (
    messageId: string,
  ) => {
    navigate(
      `/modules/gateway/message/${messageId}`,
    );
  };

  const handleReplyInComposer = (
    message: GatewayMessage,
  ) => {
    navigate('/modules/gateway/compose', {
      state: {
        mode: 'reply',
        message,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Réponses & Envois
        </h1>

        <p className="mt-1 text-muted-foreground">
          Traitement des communications attribuées
          et suivi des envois via Google Workspace
          Gmail.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI                                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquareReply className="h-8 w-8 text-primary" />

              <div>
                <p className="text-2xl font-bold">
                  {toRespond.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  À traiter
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />

              <div>
                <p className="text-2xl font-bold">
                  {replied.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Réponses envoyées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-primary" />

              <div>
                <p className="text-2xl font-bold">
                  {outbound.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Envois sortants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCheck className="h-8 w-8 text-green-500" />

              <div>
                <p className="text-2xl font-bold">
                  {messages.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Communications
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABS                                                               */}
      {/* ------------------------------------------------------------------ */}

      <Tabs defaultValue="reply">
        <TabsList>
          <TabsTrigger value="reply">
            À traiter ({toRespond.length})
          </TabsTrigger>

          <TabsTrigger value="replied">
            Historique réponses (
            {replied.length})
          </TabsTrigger>

          <TabsTrigger value="outbound">
            Envois sortants (
            {outbound.length})
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- */}
        {/* À TRAITER                                                        */}
        {/* ---------------------------------------------------------------- */}

        <TabsContent value="reply">
          <Card>
            <CardHeader>
              <CardTitle>
                Communications attribuées
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Les messages attribués à un pôle
                peuvent être traités directement.
                Une validation préalable n'est pas
                nécessaire sauf lorsqu'une approbation
                spécifique est requise.
              </p>
            </CardHeader>

            <CardContent>
              {toRespond.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <MessageSquareReply className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                  <p className="font-medium">
                    Aucun message à traiter
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Les messages entrants doivent
                    d'abord être attribués à un pôle
                    depuis le module Routage.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {toRespond.map((message) => (
                    <div
                      key={message.id}
                      className="space-y-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() =>
                            handleOpenMessage(
                              message.id,
                            )
                          }
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {message.routed_to_pole}
                            </Badge>

                            <span className="truncate text-xs text-muted-foreground">
                              {message.sender_name
                                ? `${message.sender_name} · `
                                : ''}
                              {message.sender_email}
                            </span>
                          </div>

                          <p className="mt-2 font-medium">
                            {message.subject}
                          </p>

                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleOpenMessage(
                              message.id,
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Rédiger la réponse…"
                        rows={4}
                        value={
                          drafts[message.id] ||
                          ''
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [message.id]:
                                event.target.value,
                            }),
                          )
                        }
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            handleSend(
                              message,
                            )
                          }
                          disabled={
                            !drafts[
                              message.id
                            ]?.trim() ||
                            sendReply.isPending
                          }
                        >
                          <Send className="h-3 w-3" />
                          Envoyer la réponse
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() =>
                            handleReplyInComposer(
                              message,
                            )
                          }
                        >
                          <MessageSquareReply className="h-3 w-3" />
                          Ouvrir dans le composeur
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* HISTORIQUE                                                       */}
        {/* ---------------------------------------------------------------- */}

        <TabsContent value="replied">
          <Card>
            <CardHeader>
              <CardTitle>
                Historique des réponses
              </CardTitle>
            </CardHeader>

            <CardContent>
              {replied.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune réponse envoyée.
                </p>
              ) : (
                <div className="space-y-2">
                  {replied.map((message) => {
                    const delivery =
                      getDelivery(
                        message.sender_email,
                      );

                    return (
                      <button
                        type="button"
                        key={message.id}
                        className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                        onClick={() =>
                          handleOpenMessage(
                            message.id,
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">
                              {message.subject}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              →{' '}
                              {
                                message.sender_email
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs">
                              {
                                message.response_content
                              }
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground">
                              {message.responded_at
                                ? new Date(
                                    message.responded_at,
                                  ).toLocaleString(
                                    'fr-FR',
                                  )
                                : '—'}
                            </span>

                            <DeliveryBadge
                              status={
                                delivery.status
                              }
                              error={
                                delivery.error
                              }
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------- */}
        {/* SORTANTS                                                         */}
        {/* ---------------------------------------------------------------- */}

        <TabsContent value="outbound">
          <Card>
            <CardHeader>
              <CardTitle>
                Envois sortants
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                Les emails sont transmis par le
                compte Google Workspace BIB. Les
                statuts affichés correspondent au
                suivi disponible dans le système
                d'envoi.
              </p>
            </CardHeader>

            <CardContent>
              {outbound.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun envoi sortant.
                </p>
              ) : (
                <div className="space-y-2">
                  {outbound.map((message) => {
                    const delivery =
                      getDelivery(
                        message.sender_email,
                      );

                    return (
                      <button
                        type="button"
                        key={message.id}
                        className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                        onClick={() =>
                          handleOpenMessage(
                            message.id,
                          )
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">
                              {message.subject.replace(
                                /^\[Sortant\]\s*/,
                                '',
                              )}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              →{' '}
                              {message.sender_name
                                ? `${message.sender_name} · `
                                : ''}
                              {
                                message.sender_email
                              }
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs">
                              {message.content}
                            </p>

                            {message.validation_notes && (
                              <p className="mt-1 text-xs italic text-muted-foreground">
                                {
                                  message.validation_notes
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(
                                message.created_at,
                              ).toLocaleString(
                                'fr-FR',
                              )}
                            </span>

                            <DeliveryBadge
                              status={
                                delivery.status
                              }
                              error={
                                delivery.error
                              }
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```
