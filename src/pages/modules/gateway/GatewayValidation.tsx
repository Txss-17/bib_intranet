import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Check,
  Clock,
  ShieldCheck,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';

export default function GatewayValidation() {
  const {
    data: messages = [],
    updateStatus,
  } = useGatewayMessages();

  /*
   * --------------------------------------------------------------------------
   * IMPORTANT
   * --------------------------------------------------------------------------
   *
   * La validation n'est PAS une étape obligatoire du traitement d'un email.
   *
   * Le flux normal est :
   *
   *   Inbox
   *      ↓
   *   Attribution
   *      ↓
   *   Traitement / réponse
   *
   * Cette page est réservée aux communications nécessitant explicitement
   * une approbation avant action externe.
   *
   * Le champ "approval_required" devra être ajouté au modèle de données
   * lorsque la logique d'approbation sera branchée côté backend.
   *
   * En attendant, on ne considère donc plus tous les messages "pending"
   * comme des demandes de validation.
   */

  const approvalRequests = messages.filter(
    (message) =>
      message.status === 'validated',
  );

  const archived = messages.filter(
    (message) =>
      message.status === 'archived',
  );

  const processed = messages.filter(
    (message) =>
      message.status === 'validated' ||
      message.status === 'archived',
  );

  /*
   * --------------------------------------------------------------------------
   * ACTIONS DE COMPATIBILITÉ
   * --------------------------------------------------------------------------
   *
   * Ces actions restent disponibles pour les éventuelles demandes
   * d'approbation déjà présentes dans la base.
   */

  const handleApprove = (
    id: string,
    notes?: string | null,
  ) => {
    updateStatus.mutate({
      id,
      patch: {
        status: 'validated',
        validation_notes:
          notes || null,
      },
    });
  };

  const handleReject = (
    id: string,
    notes?: string | null,
  ) => {
    updateStatus.mutate({
      id,
      patch: {
        status: 'archived',
        validation_notes:
          notes || 'Demande d’approbation refusée',
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />

          <h1 className="text-2xl font-bold text-foreground">
            Approbations
          </h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Approbations requises avant certaines
          communications ou actions externes sensibles.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* INFORMATION                                                        */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardContent className="flex gap-3 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

          <div className="space-y-1">
            <p className="font-medium">
              La validation n'est pas obligatoire pour
              les messages entrants ordinaires.
            </p>

            <p className="text-sm text-muted-foreground">
              Une question client, une demande marchand,
              une demande d'information ou un suivi
              opérationnel standard peut être traité
              directement après attribution au pôle
              responsable.
            </p>

            <p className="text-sm text-muted-foreground">
              L'approbation est destinée notamment aux
              engagements financiers, contractuels,
              juridiques, sensibles ou aux communications
              nécessitant l'accord d'un responsable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* KPI                                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <Clock className="h-5 w-5" />
            </div>

            <div>
              <p className="text-2xl font-bold">
                {approvalRequests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Demandes d'approbation
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <Check className="h-5 w-5" />
            </div>

            <div>
              <p className="text-2xl font-bold">
                {messages.filter(
                  (message) =>
                    message.status === 'validated',
                ).length}
              </p>

              <p className="text-xs text-muted-foreground">
                Approuvés
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-muted p-3">
              <X className="h-5 w-5" />
            </div>

            <div>
              <p className="text-2xl font-bold">
                {archived.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Refusés / archivés
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DEMANDES                                                           */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Demandes nécessitant une approbation
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            Cette section sera alimentée par les
            communications explicitement marquées comme
            nécessitant une approbation.
          </p>
        </CardHeader>

        <CardContent>
          {approvalRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucune demande d'approbation
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Les emails ordinaires ne passent pas par
                cette étape.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvalRequests.map(
                (message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              Approbation
                            </Badge>

                            {message.routed_to_pole && (
                              <Badge variant="outline">
                                {message.routed_to_pole}
                              </Badge>
                            )}
                          </div>

                          <p className="mt-2 font-medium">
                            {message.subject}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {message.sender_name
                              ? `${message.sender_name} · `
                              : ''}
                            {message.sender_email}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </p>
                      </div>

                      {message.validation_notes && (
                        <div className="rounded-md border border-border p-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Notes
                          </p>

                          <p className="mt-1 text-sm">
                            {message.validation_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={
                            updateStatus.isPending
                          }
                          onClick={() =>
                            handleApprove(
                              message.id,
                              message.validation_notes,
                            )
                          }
                        >
                          <Check className="h-4 w-4" />
                          Approuver
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-destructive"
                          disabled={
                            updateStatus.isPending
                          }
                          onClick={() =>
                            handleReject(
                              message.id,
                              message.validation_notes,
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* HISTORIQUE                                                         */}
      {/* ------------------------------------------------------------------ */}

      <Card>
        <CardHeader>
          <CardTitle>
            Historique des décisions
          </CardTitle>
        </CardHeader>

        <CardContent>
          {processed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune décision d'approbation enregistrée.
            </p>
          ) : (
            <div className="space-y-2">
              {processed.map((message) => (
                <div
                  key={message.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {message.subject}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {message.sender_email}
                    </p>
                  </div>

                  <Badge
                    variant={
                      message.status === 'validated'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {message.status ===
                    'validated'
                      ? 'Approuvé'
                      : 'Refusé / archivé'}
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
```
