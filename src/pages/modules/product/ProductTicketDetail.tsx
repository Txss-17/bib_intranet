import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  History,
  Lightbulb,
  Loader2,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useProductProfiles,
  useProductTicket,
  useUpdateProductTicket,
} from '@/hooks/useRD';

import { useUserRole } from '@/hooks/useUserRole';
import ProtectedScreen from '@/components/ProtectedScreen';

const priorityClass = (
  priority: string | null,
) => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';

    case 'high':
      return 'bg-orange-500 text-white';

    case 'medium':
      return 'bg-yellow-500 text-black';

    default:
      return 'bg-muted';
  }
};

const priorityLabel: Record<
  string,
  string
> = {
  critical: 'Critique',
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
};

const statusLabel: Record<
  string,
  string
> = {
  declared: 'Déclaré',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Clos',
};

function TicketPage() {
  const { id } =
    useParams<{ id: string }>();

  const {
    data,
    isLoading,
    isError,
  } = useProductTicket(id);

  const {
    data: profiles = [],
  } =
    useProductProfiles();

  const update =
    useUpdateProductTicket();

  const {
    isAdmin,
    isManager,
  } = useUserRole();

  const canEdit =
    isAdmin || isManager;

  const [status, setStatus] =
    useState('');

  const [severity, setSeverity] =
    useState('');

  const [assigned, setAssigned] =
    useState('');

  const [note, setNote] =
    useState('');

  useEffect(() => {
    if (!data?.incident) {
      return;
    }

    setStatus(
      data.incident.status ?? '',
    );

    setSeverity(
      data.incident.severity ?? '',
    );

    setAssigned(
      data.incident.assigned_to ??
        '',
    );
  }, [data?.incident?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (
    isError ||
    !data?.incident
  ) {
    return (
      <div className="space-y-4 p-6">
        <Button
          variant="ghost"
          asChild
        >
          <Link to="/pole/product/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux rapports
          </Link>
        </Button>

        <p className="text-muted-foreground">
          Ticket introuvable.
        </p>
      </div>
    );
  }

  const incident = data.incident;

  const submit = async () => {
    const updates: Record<
      string,
      unknown
    > = {};

    if (
      status !== incident.status
    ) {
      updates.status = status;
    }

    if (
      severity !== incident.severity
    ) {
      updates.severity =
        severity;
    }

    if (
      (assigned || null) !==
      (incident.assigned_to ||
        null)
    ) {
      updates.assigned_to =
        assigned || null;
    }

    if (
      Object.keys(updates)
        .length === 0 &&
      !note.trim()
    ) {
      toast.info(
        'Aucune modification',
      );
      return;
    }

    try {
      await update.mutateAsync({
        ticketId: incident.id,
        updates,
        changeNote:
          note.trim(),
      });

      toast.success(
        'Ticket mis à jour',
      );

      setNote('');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre à jour le ticket',
      );
    }
  };

  return (
    <div className="max-w-5xl space-y-6 p-6 lg:p-8">
      <Button
        variant="ghost"
        size="sm"
        asChild
      >
        <Link to="/pole/product/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Rapports & recommandations
        </Link>
      </Button>

      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">
            {incident.title}
          </h1>

          <Badge variant="outline">
            Produit & Engineering
          </Badge>

          <Badge variant="outline">
            {statusLabel[
              incident.status
            ] ??
              incident.status}
          </Badge>

          <Badge
            className={priorityClass(
              incident.severity,
            )}
          >
            {priorityLabel[
              incident.severity
            ] ??
              incident.severity}
          </Badge>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Créé le{' '}
          {new Date(
            incident.created_at,
          ).toLocaleString('fr-FR')}
          {' · '}
          {incident.declared_by_name ??
            'Système'}
        </p>
      </section>

      {data.recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" />
              Recommandation d'origine
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm">
              {
                data.recommendation
                  .detail
              }
            </p>

            <div className="flex flex-wrap gap-2">
              {data.recommendation
                .category && (
                <Badge variant="secondary">
                  {String(
                    data.recommendation
                      .category,
                  )}
                </Badge>
              )}

              <Badge
                className={priorityClass(
                  data.recommendation
                    .priority,
                )}
              >
                {priorityLabel[
                  data.recommendation
                    .priority
                ] ??
                  data.recommendation
                    .priority}
              </Badge>

              <Badge variant="outline">
                {
                  data.recommendation
                    .status
                }
              </Badge>
            </div>

            {data.report && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />

                Rapport :{' '}
                {data.report.title}

                {data.report.type &&
                  ` (${data.report.type})`}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Description
          </CardTitle>
        </CardHeader>

        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {incident.description ??
              '—'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Pilotage du ticket

            {!canEdit && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                <ShieldAlert className="mr-1 h-3 w-3" />
                Lecture seule
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>
                Statut
              </Label>

              <Select
                value={status}
                onValueChange={
                  setStatus
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="declared">
                    Déclaré
                  </SelectItem>

                  <SelectItem value="in_progress">
                    En cours
                  </SelectItem>

                  <SelectItem value="resolved">
                    Résolu
                  </SelectItem>

                  <SelectItem value="closed">
                    Clos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Priorité
              </Label>

              <Select
                value={severity}
                onValueChange={
                  setSeverity
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="low">
                    Basse
                  </SelectItem>

                  <SelectItem value="medium">
                    Moyenne
                  </SelectItem>

                  <SelectItem value="high">
                    Haute
                  </SelectItem>

                  <SelectItem value="critical">
                    Critique
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Responsable
              </Label>

              <Select
                value={
                  assigned || 'none'
                }
                onValueChange={(value) =>
                  setAssigned(
                    value === 'none'
                      ? ''
                      : value,
                  )
                }
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">
                    Non assigné
                  </SelectItem>

                  {profiles.map(
                    (profile) => (
                      <SelectItem
                        key={profile.id}
                        value={profile.id}
                      >
                        {
                          profile.full_name
                        }
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {canEdit && (
            <>
              <div>
                <Label>
                  Note de modification
                </Label>

                <Textarea
                  rows={3}
                  value={note}
                  onChange={(event) =>
                    setNote(
                      event.target.value,
                    )
                  }
                  placeholder="Justification du changement..."
                />
              </div>

              <Button
                onClick={submit}
                disabled={
                  update.isPending
                }
              >
                <Save className="mr-2 h-4 w-4" />

                {update.isPending
                  ? 'Enregistrement...'
                  : 'Enregistrer'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historique
          </CardTitle>
        </CardHeader>

        <CardContent>
          {data.history.length ===
          0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun changement
              enregistré.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.history.map(
                (entry) => {
                  const details =
                    entry.details as
                      | {
                          changes?: unknown;
                          note?: string;
                        }
                      | null;

                  return (
                    <li
                      key={String(
                        entry.id,
                      )}
                      className="border-l-2 border-primary py-1 pl-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {entry.user_name ??
                            'Système'}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            entry.created_at,
                          ).toLocaleString(
                            'fr-FR',
                          )}
                        </span>
                      </div>

                      {details?.changes && (
                        <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                          {JSON.stringify(
                            details.changes,
                          )}
                        </pre>
                      )}

                      {details?.note && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {details.note}
                        </p>
                      )}
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProductTicketDetail() {
  return (
    <ProtectedScreen screenId="product.tickets">
      <TicketPage />
    </ProtectedScreen>
  );
}