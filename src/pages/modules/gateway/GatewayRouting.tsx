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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  Inbox,
  RotateCcw,
  Send,
} from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';

type GatewayPole =
  | 'direction'
  | 'finance'
  | 'ops'
  | 'supplier'
  | 'marketplace'
  | 'support'
  | 'marketing'
  | 'rh'
  | 'audit'
  | 'compliance'
  | 'rse'
  | 'product'
  | 'data'
  | 'security';

const POLES: Array<{
  value: GatewayPole;
  label: string;
}> = [
  {
    value: 'direction',
    label: 'Direction',
  },
  {
    value: 'finance',
    label: 'Finance',
  },
  {
    value: 'ops',
    label: 'Opérations & Logistique',
  },
  {
    value: 'supplier',
    label: 'Fournisseurs & Produits',
  },
  {
    value: 'marketplace',
    label: 'Marketplace & Customer',
  },
  {
    value: 'support',
    label: 'Support & Customer Success',
  },
  {
    value: 'marketing',
    label: 'Marketing & Communication',
  },
  {
    value: 'rh',
    label: 'Ressources Humaines',
  },
  {
    value: 'audit',
    label: 'Qualité & Audit',
  },
  {
    value: 'compliance',
    label: 'Conformité & Juridique',
  },
  {
    value: 'rse',
    label: 'RSE & Impact',
  },
  {
    value: 'product',
    label: 'Produit & Engineering',
  },
  {
    value: 'data',
    label: 'Data & BI',
  },
  {
    value: 'security',
    label: 'Security & IT',
  },
];

const getPoleLabel = (
  pole: string | null | undefined,
) =>
  POLES.find(
    (item) => item.value === pole,
  )?.label ?? pole ?? 'Non attribué';

const isIncomingMessage = (
  message: {
    subject?: string | null;
  },
) =>
  !message.subject
    ?.trim()
    .toLowerCase()
    .startsWith('[sortant]');

export default function GatewayRouting() {
  const navigate = useNavigate();

  const {
    data: messages = [],
    updateStatus,
  } = useGatewayMessages();

  const [selectedPole, setSelectedPole] =
    useState<
      Record<string, GatewayPole | undefined>
    >({});

  /*
   * --------------------------------------------------------------------------
   * SOURCE
   * --------------------------------------------------------------------------
   *
   * Le routage porte principalement sur les messages entrants.
   *
   * Les messages [Sortant] restent consultables dans le Gateway mais ne sont
   * pas proposés comme nouveaux éléments à attribuer.
   */

  const incomingMessages = useMemo(
    () =>
      messages.filter(isIncomingMessage),
    [messages],
  );

  /*
   * --------------------------------------------------------------------------
   * NON ATTRIBUÉS
   * --------------------------------------------------------------------------
   *
   * Un message Gmail nouvellement synchronisé arrive normalement avec :
   *
   *   status = pending
   *   routed_to_pole = null
   *
   * Il peut maintenant être attribué directement sans passer par une étape
   * obligatoire de validation.
   */

  const unassignedMessages =
    incomingMessages.filter(
      (message) =>
        !message.routed_to_pole &&
        message.status !== 'responded' &&
        message.status !== 'archived',
    );

  /*
   * --------------------------------------------------------------------------
   * ATTRIBUÉS
   * --------------------------------------------------------------------------
   */

  const assignedMessages =
    incomingMessages.filter(
      (message) =>
        Boolean(message.routed_to_pole) &&
        message.status !== 'archived',
    );

  /*
   * --------------------------------------------------------------------------
   * TRAITEMENT
   * --------------------------------------------------------------------------
   */

  const respondedMessages =
    incomingMessages.filter(
      (message) =>
        message.status === 'responded',
    );

  const handlePoleChange = (
    messageId: string,
    value: string,
  ) => {
    const pole = POLES.find(
      (item) => item.value === value,
    );

    if (!pole) {
      return;
    }

    setSelectedPole((current) => ({
      ...current,
      [messageId]: pole.value,
    }));
  };

  const handleAssign = (
    messageId: string,
  ) => {
    const pole =
      selectedPole[messageId];

    if (!pole) {
      return;
    }

    updateStatus.mutate({
      id: messageId,
      patch: {
        status: 'routed',
        routed_to_pole: pole,
      },
    });

    setSelectedPole((current) => {
      const next = {
        ...current,
      };

      delete next[messageId];

      return next;
    });
  };

  const handleReassign = (
    messageId: string,
  ) => {
    const pole =
      selectedPole[messageId];

    if (!pole) {
      return;
    }

    updateStatus.mutate({
      id: messageId,
      patch: {
        routed_to_pole: pole,
        status: 'routed',
      },
    });

    setSelectedPole((current) => {
      const next = {
        ...current,
      };

      delete next[messageId];

      return next;
    });
  };

  const handleOpenMessage = (
    messageId: string,
  ) => {
    navigate(
      `/modules/gateway/message/${messageId}`,
    );
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <div className="flex items-center gap-2">
          <ArrowRight className="h-6 w-6 text-primary" />

          <h1 className="text-2xl font-bold text-foreground">
            Attribution & routage
          </h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Attribuer les communications entrantes
          au pôle BIB responsable de leur traitement.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI                                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <Inbox className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                À attribuer
              </p>

              <p className="text-2xl font-bold">
                {unassignedMessages.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Attribués
              </p>

              <p className="text-2xl font-bold">
                {assignedMessages.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <Send className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Réponses traitées
              </p>

              <p className="text-2xl font-bold">
                {respondedMessages.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NOUVEAUX MESSAGES                                                  */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Messages à attribuer
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Les nouveaux messages Gmail peuvent
            être attribués directement au pôle
            concerné.
          </p>
        </CardHeader>

        <CardContent>
          {unassignedMessages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucun message à attribuer
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les nouveaux messages entrants
                apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unassignedMessages.map(
                (message) => {
                  const currentPole =
                    selectedPole[message.id];

                  return (
                    <div
                      key={message.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() =>
                            handleOpenMessage(
                              message.id,
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              Nouveau
                            </Badge>

                            <span className="truncate text-sm text-muted-foreground">
                              {message.sender_name ||
                                message.sender_email}
                            </span>
                          </div>

                          <p className="mt-2 truncate font-medium">
                            {message.subject}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <Select
                            value={
                              currentPole ??
                              undefined
                            }
                            onValueChange={(
                              value,
                            ) =>
                              handlePoleChange(
                                message.id,
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Choisir un pôle" />
                            </SelectTrigger>

                            <SelectContent>
                              {POLES.map(
                                (pole) => (
                                  <SelectItem
                                    key={
                                      pole.value
                                    }
                                    value={
                                      pole.value
                                    }
                                  >
                                    {pole.label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            disabled={
                              !currentPole ||
                              updateStatus.isPending
                            }
                            onClick={() =>
                              handleAssign(
                                message.id,
                              )
                            }
                          >
                            Attribuer
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* MESSAGES ATTRIBUÉS                                                */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Messages attribués
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Suivi des messages déjà orientés vers
            un pôle. Une réaffectation reste possible.
          </p>
        </CardHeader>

        <CardContent>
          {assignedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun message attribué.
            </p>
          ) : (
            <div className="space-y-3">
              {assignedMessages.map(
                (message) => {
                  const currentPole =
                    selectedPole[message.id];

                  return (
                    <div
                      key={message.id}
                      className="rounded-lg border border-border p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() =>
                            handleOpenMessage(
                              message.id,
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {getPoleLabel(
                                message.routed_to_pole,
                              )}
                            </Badge>

                            {message.status ===
                              'responded' && (
                              <Badge>
                                Répondu
                              </Badge>
                            )}

                            <span className="truncate text-sm text-muted-foreground">
                              {message.sender_name ||
                                message.sender_email}
                            </span>
                          </div>

                          <p className="mt-2 truncate font-medium">
                            {message.subject}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Attribution actuelle :{' '}
                            {getPoleLabel(
                              message.routed_to_pole,
                            )}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <Select
                            value={
                              currentPole ??
                              undefined
                            }
                            onValueChange={(
                              value,
                            ) =>
                              handlePoleChange(
                                message.id,
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="w-[220px]">
                              <SelectValue placeholder="Réaffecter à..." />
                            </SelectTrigger>

                            <SelectContent>
                              {POLES.map(
                                (pole) => (
                                  <SelectItem
                                    key={
                                      pole.value
                                    }
                                    value={
                                      pole.value
                                    }
                                  >
                                    {pole.label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              !currentPole ||
                              currentPole ===
                                message.routed_to_pole ||
                              updateStatus.isPending
                            }
                            onClick={() =>
                              handleReassign(
                                message.id,
                              )
                            }
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réaffecter
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
