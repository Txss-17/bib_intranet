import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLogisticsIncidentsDb } from '@/hooks/useOpsControl';

type IncidentStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'closed';

type IncidentSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

type IncidentType =
  | 'delay'
  | 'damage'
  | 'lost'
  | 'wrong_address'
  | 'customer_complaint';

interface LogisticsIncident {
  id: string;
  type: IncidentType | string;
  severity: IncidentSeverity | string;
  status: IncidentStatus | string;
  description: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  resolution: string | null;
  created_at: string;
  updated_at?: string | null;
  partner_id?: string | null;
  order_id?: string | null;
  logistics_partners?: {
    id: string;
    name: string;
  } | null;
}

const TYPE_LABELS: Record<string, string> = {
  delay: 'Retard',
  damage: 'Dommage',
  lost: 'Colis perdu',
  wrong_address: 'Mauvaise adresse',
  customer_complaint: 'Plainte client',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  investigating: 'En investigation',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const SEVERITY_CLASSES: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-500',
  critical: 'bg-destructive/10 text-destructive',
};

const LogisticsIncidents = () => {
  const {
    data: rawIncidents = [],
    isLoading,
    isError,
  } = useLogisticsIncidentsDb();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<string>('all');
  const [severityFilter, setSeverityFilter] =
    useState<string>('all');
  const [typeFilter, setTypeFilter] =
    useState<string>('all');

  const incidents =
    rawIncidents as LogisticsIncident[];

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const partnerName =
        incident.logistics_partners?.name ?? '';

      const matchesSearch =
        !query ||
        (incident.description ?? '')
          .toLowerCase()
          .includes(query) ||
        (incident.reported_by ?? '')
          .toLowerCase()
          .includes(query) ||
        (incident.assigned_to ?? '')
          .toLowerCase()
          .includes(query) ||
        partnerName.toLowerCase().includes(query) ||
        (incident.order_id ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        incident.status === statusFilter;

      const matchesSeverity =
        severityFilter === 'all' ||
        incident.severity === severityFilter;

      const matchesType =
        typeFilter === 'all' ||
        incident.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSeverity &&
        matchesType
      );
    });
  }, [
    incidents,
    search,
    statusFilter,
    severityFilter,
    typeFilter,
  ]);

  const stats = useMemo(() => {
    const open = incidents.filter(
      (incident) => incident.status === 'open',
    ).length;

    const investigating = incidents.filter(
      (incident) =>
        incident.status === 'investigating',
    ).length;

    const critical = incidents.filter(
      (incident) =>
        incident.severity === 'critical' &&
        !['resolved', 'closed'].includes(
          incident.status,
        ),
    ).length;

    const resolved = incidents.filter(
      (incident) =>
        incident.status === 'resolved',
    ).length;

    const active =
      open + investigating;

    return {
      total: incidents.length,
      open,
      investigating,
      critical,
      resolved,
      active,
    };
  }, [incidents]);

  const getSeverityBadge = (severity: string) => {
    return (
      <Badge
        variant={
          severity === 'critical' ||
          severity === 'high'
            ? 'destructive'
            : severity === 'medium'
              ? 'outline'
              : 'secondary'
        }
      >
        {SEVERITY_LABELS[severity] ?? severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge
            variant="destructive"
            className="gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Ouvert
          </Badge>
        );

      case 'investigating':
        return (
          <Badge
            variant="outline"
            className="gap-1"
          >
            <Clock3 className="h-3 w-3" />
            En investigation
          </Badge>
        );

      case 'resolved':
        return (
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Résolu
          </Badge>
        );

      case 'closed':
        return (
          <Badge variant="secondary">
            Fermé
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des incidents…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertTriangle className="h-5 w-5 text-destructive" />

            <div>
              <p className="font-medium">
                Impossible de charger les incidents
              </p>

              <p className="text-sm text-muted-foreground">
                Vérifie la table `logistics_incidents`
                et les permissions Supabase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              Incidents logistiques
            </h1>

            <p className="text-muted-foreground">
              Supervision des incidents transport, livraison
              et partenaires logistiques.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={
            stats.critical > 0
              ? 'border-destructive/50'
              : ''
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Critiques actives
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.critical}
                </p>
              </div>

              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Incidents ouverts
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.open}
                </p>
              </div>

              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  En investigation
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.investigating}
                </p>
              </div>

              <Clock3 className="h-5 w-5 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Résolus
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {stats.resolved}
                </p>
              </div>

              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>
            Incidents ({filteredIncidents.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Description, commande, partenaire…"
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
                </SelectItem>

                <SelectItem value="open">
                  Ouvert
                </SelectItem>

                <SelectItem value="investigating">
                  En investigation
                </SelectItem>

                <SelectItem value="resolved">
                  Résolu
                </SelectItem>

                <SelectItem value="closed">
                  Fermé
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={setSeverityFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes les sévérités
                </SelectItem>

                <SelectItem value="critical">
                  Critique
                </SelectItem>

                <SelectItem value="high">
                  Haute
                </SelectItem>

                <SelectItem value="medium">
                  Moyenne
                </SelectItem>

                <SelectItem value="low">
                  Basse
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les types
                </SelectItem>

                <SelectItem value="delay">
                  Retard
                </SelectItem>

                <SelectItem value="damage">
                  Dommage
                </SelectItem>

                <SelectItem value="lost">
                  Colis perdu
                </SelectItem>

                <SelectItem value="wrong_address">
                  Mauvaise adresse
                </SelectItem>

                <SelectItem value="customer_complaint">
                  Plainte client
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incident list */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <CheckCircle2 className="mb-3 h-8 w-8 text-muted-foreground" />

            <p className="font-medium">
              Aucun incident trouvé
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Aucun incident ne correspond aux critères
              actuels.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const severityClass =
              SEVERITY_CLASSES[incident.severity] ??
              SEVERITY_CLASSES.low;

            return (
              <Card
                key={incident.id}
                className={
                  incident.severity === 'critical' &&
                  !['resolved', 'closed'].includes(
                    incident.status,
                  )
                    ? 'border-destructive/50'
                    : ''
                }
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-full p-3 ${severityClass}`}
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {incident.description ||
                              'Incident sans description'}
                          </h3>

                          <Badge variant="outline">
                            {TYPE_LABELS[
                              incident.type
                            ] ?? incident.type}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                          {incident.logistics_partners
                            ?.name && (
                            <span>
                              Partenaire :{' '}
                              {
                                incident
                                  .logistics_partners
                                  .name
                              }
                            </span>
                          )}

                          {incident.order_id && (
                            <span>
                              Commande :{' '}
                              {incident.order_id}
                            </span>
                          )}

                          <span>
                            Signalé par :{' '}
                            {incident.reported_by ||
                              'Système'}
                          </span>

                          {incident.assigned_to && (
                            <span>
                              Assigné à :{' '}
                              {incident.assigned_to}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(
                              incident.created_at,
                            ),
                            "dd MMM yyyy 'à' HH:mm",
                            { locale: fr },
                          )}
                        </p>

                        {incident.resolution && (
                          <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />

                            <div>
                              <span className="font-medium">
                                Résolution :
                              </span>{' '}
                              {incident.resolution}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row gap-2 lg:flex-col lg:items-end">
                      {getSeverityBadge(
                        incident.severity,
                      )}

                      {getStatusBadge(
                        incident.status,
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogisticsIncidents;