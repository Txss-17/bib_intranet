import { useState } from 'react';
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
  Send,
  ArrowRightLeft,
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
    label: 'RH',
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
  )?.label ?? pole ?? 'Non défini';

export default function GatewayRouting() {
  const {
    data: messages = [],
    updateStatus,
  } = useGatewayMessages();

  const [selectedPole, setSelectedPole] =
    useState<
      Record<string, GatewayPole | undefined>
    >({});

  const validated = messages.filter(
    (message) =>
      message.status === 'validated',
  );

  const routed = messages.filter(
    (message) =>
      message.status === 'routed',
  );

  const responded = messages.filter(
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

  const handleRoute = (
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Routage
        </h1>

        <p className="text-muted-foreground">
          Attribuer les messages validés aux
          pôles BIB concernés.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="h-8 w-8 text-primary" />

              <div>
                <p className="text-2xl font-bold">
                  {validated.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  À router
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
                  {routed.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Routés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-green-500" />

              <div>
                <p className="text-2xl font-bold">
                  {responded.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Traités
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Messages validés en attente de
            routage
          </CardTitle>
        </CardHeader>

        <CardContent>
          {validated.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun message à router.
            </p>
          ) : (
            <div className="space-y-3">
              {validated.map((message) => {
                const currentPole =
                  selectedPole[message.id];

                return (
                  <div
                    key={message.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {message.subject}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {message.sender_email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={
                          currentPole ?? ''
                        }
                        onValueChange={(value) =>
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
                          {POLES.map((pole) => (
                            <SelectItem
                              key={pole.value}
                              value={pole.value}
                            >
                              {pole.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        disabled={
                          !currentPole ||
                          updateStatus.isPending
                        }
                        onClick={() =>
                          handleRoute(
                            message.id,
                          )
                        }
                      >
                        Router
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Déjà routés
          </CardTitle>
        </CardHeader>

        <CardContent>
          {routed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun message routé.
            </p>
          ) : (
            <div className="space-y-2">
              {routed.map((message) => (
                <div
                  key={message.id}
                  className="flex items-center justify-between gap-3 rounded border border-border p-2"
                >
                  <span className="truncate text-sm">
                    {message.subject}
                  </span>

                  <Badge variant="outline">
                    {getPoleLabel(
                      message.routed_to_pole,
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
