import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  Loader2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSyncEvents } from '@/hooks/useOpsControl';

type SyncStatus = 'success' | 'pending' | 'error' | 'timeout';

const STATUS_LABELS: Record<SyncStatus, string> = {
  success: 'Succès',
  pending: 'En attente',
  error: 'Erreur',
  timeout: 'Timeout',
};

export default function SyncFlows() {
  const {
    data: events = [],
    isLoading,
    isError,
  } = useSyncEvents();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | SyncStatus
  >('all');

  const stats = useMemo(() => {
    const total = events.length;

    const success = events.filter(
      (event) => event.status === 'success',
    ).length;

    const errors = events.filter(
      (event) =>
        event.status === 'error' ||
        event.status === 'timeout',
    ).length;

    const pending = events.filter(
      (event) => event.status === 'pending',
    ).length;

    const durations = events
      .map((event) => event.duration_ms)
      .filter(
        (duration): duration is number =>
          duration !== null &&
          typeof duration === 'number',
      );

    const averageDuration =
      durations.length === 0
        ? 0
        : Math.round(
            durations.reduce(
              (total, duration) =>
                total + duration,
              0,
            ) / durations.length,
          );

    const successRate =
      total === 0
        ? 100
        : Math.round((success / total) * 100);

    return {
      total,
      success,
      errors,
      pending,
      averageDuration,
      successRate,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const partnerName =
        event.logistics_partners?.name ?? '';

      const matchesSearch =
        !query ||
        partnerName.toLowerCase().includes(query) ||
        event.event_type
          .toLowerCase()
          .includes(query) ||
        (event.reference_id ?? '')
          .toLowerCase()
          .includes(query) ||
        (event.reference_type ?? '')
          .toLowerCase()
          .includes(query) ||
        (event.error_message ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <CheckCircle2 className="h-4 w-4 text-success" />
        );

      case 'error':
      case 'timeout':
        return (
          <AlertCircle className="h-4 w-4 text-destructive" />
        );

      case 'pending':
      default:
        return (
          <Clock3 className="h-4 w-4 text-warning" />
        );
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="secondary">
            Succès
          </Badge>
        );

      case 'error':
        return (
          <Badge variant="destructive">
            Erreur
          </Badge>
        );

      case 'timeout':
        return (
          <Badge variant="destructive">
            Timeout
          </Badge>
        );

      case 'pending':
        return (
          <Badge variant="outline">
            En attente
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Flux & synchronisation
            </h1>

            <p className="text-muted-foreground">
              Surveillance des échanges entre BIB et les
              partenaires logistiques.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Événements
            </p>

            <p className="mt-1 text-2xl font-bold">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Taux de succès
            </p>

            <p className="mt-1 text-2xl font-bold">
              {stats.successRate} %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Erreurs / timeouts
            </p>

            <p className="mt-1 text-2xl font-bold">
              {stats.errors}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Latence moyenne
            </p>

            <p className="mt-1 text-2xl font-bold">
              {stats.averageDuration} ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-success" />

            <div>
              <p className="text-sm font-medium">
                Échanges réussis
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.success} événement(s)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />

            <div>
              <p className="text-sm font-medium">
                Incidents de synchronisation
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.errors} erreur(s) ou timeout(s)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Clock3 className="h-5 w-5 text-warning" />

            <div>
              <p className="text-sm font-medium">
                En attente
              </p>

              <p className="text-xs text-muted-foreground">
                {stats.pending} échange(s)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Historique des échanges (
                {filteredEvents.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Journal des communications avec les partenaires.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Partenaire, événement, référence…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant={
                statusFilter === 'all'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('all')}
            >
              Tous
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'success'
                  ? 'default'
                  : 'outline'
              }
              onClick={() =>
                setStatusFilter('success')
              }
            >
              Succès
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'error'
                  ? 'default'
                  : 'outline'
              }
              onClick={() => setStatusFilter('error')}
            >
              Erreurs
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'timeout'
                  ? 'default'
                  : 'outline'
              }
              onClick={() =>
                setStatusFilter('timeout')
              }
            >
              Timeouts
            </Button>

            <Button
              size="sm"
              variant={
                statusFilter === 'pending'
                  ? 'default'
                  : 'outline'
              }
              onClick={() =>
                setStatusFilter('pending')
              }
            >
              En attente
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement des événements…
              </div>
            </div>
          ) : isError ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-destructive" />

              <p className="font-medium">
                Impossible de charger les événements
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Vérifie la table `partner_sync_events` et
                les permissions Supabase.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <RefreshCw className="mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucun échange trouvé
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Modifie les filtres ou la recherche.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>Partenaire</TableHead>
                    <TableHead>Événement</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">
                      Durée
                    </TableHead>
                    <TableHead>Quand</TableHead>
                    <TableHead>Erreur</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.direction ===
                          'outbound' ? (
                            <>
                              <ArrowUp className="h-4 w-4 text-primary" />

                              <span className="text-sm">
                                Sortant
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="h-4 w-4 text-accent" />

                              <span className="text-sm">
                                Entrant
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {event.logistics_partners?.name ??
                          'Partenaire inconnu'}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {event.event_type}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {event.reference_id ? (
                          <div>
                            <p className="max-w-[180px] truncate text-sm font-medium">
                              {event.reference_id}
                            </p>

                            {event.reference_type && (
                              <p className="text-xs text-muted-foreground">
                                {event.reference_type}
                              </p>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcon(event.status)}
                          {statusBadge(event.status)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-sm text-muted-foreground">
                        {event.duration_ms !== null
                          ? `${event.duration_ms} ms`
                          : '—'}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(event.created_at),
                          {
                            addSuffix: true,
                            locale: fr,
                          },
                        )}
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        {event.error_message ? (
                          <p
                            className="truncate text-xs text-destructive"
                            title={event.error_message}
                          >
                            {event.error_message}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}