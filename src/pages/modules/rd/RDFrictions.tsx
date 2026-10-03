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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import {
  Search,
  Zap,
  Clock,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Loader2,
  Database,
} from 'lucide-react';

import { useRDFrictionsData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type FrictionSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

type FrictionStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

type FrictionRow = {
  id: string;
  title: string;
  description?: string | null;
  environment?: string | null;
  severity: FrictionSeverity | string;
  status: FrictionStatus | string;
  created_at?: string | null;
};

type SortableFrictionColumn =
  | 'title'
  | 'environment'
  | 'created_at';

type FrictionFilters = {
  severity: string;
  status: string;
};

const severityConfig: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  critical: {
    label: 'Critique',
    color: 'text-destructive',
  },
  high: {
    label: 'Élevée',
    color: 'text-orange-500',
  },
  medium: {
    label: 'Moyenne',
    color: 'text-yellow-500',
  },
  low: {
    label: 'Faible',
    color: 'text-muted-foreground',
  },
};

const statusConfig: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline';
  }
> = {
  open: {
    label: 'Ouvert',
    variant: 'destructive',
  },
  in_progress: {
    label: 'En cours',
    variant: 'secondary',
  },
  resolved: {
    label: 'Résolu',
    variant: 'default',
  },
  closed: {
    label: 'Clos',
    variant: 'outline',
  },
};

const formatDate = (date?: string | null) => {
  if (!date) {
    return '—';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  return parsedDate.toLocaleDateString('fr-FR');
};

export default function RDFrictions() {
  const [searchQuery, setSearchQuery] = useState('');

  const [sortColumn, setSortColumn] =
    useState<SortableFrictionColumn | null>('created_at');

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc' | null>('desc');

  const [filters, setFilters] =
    useState<FrictionFilters>({
      severity: 'all',
      status: 'all',
    });

  const { data, isLoading } = useRDFrictionsData();

  const rows = (data?.rows ?? []) as FrictionRow[];
  const isMock = Boolean(data?.isMock);

  const setFilter = (
    key: keyof FrictionFilters,
    value: string,
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleSort = (
    column: SortableFrictionColumn,
  ) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection(null);
      }

      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    const result = rows.filter((friction) => {
      if (normalizedSearch) {
        const title =
          friction.title?.toLowerCase() ?? '';

        const description =
          friction.description?.toLowerCase() ?? '';

        const environment =
          friction.environment?.toLowerCase() ?? '';

        const matchesSearch =
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch) ||
          environment.includes(normalizedSearch);

        if (!matchesSearch) {
          return false;
        }
      }

      if (
        filters.status !== 'all' &&
        friction.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.severity !== 'all' &&
        friction.severity !== filters.severity
      ) {
        return false;
      }

      return true;
    });

    if (!sortColumn || !sortDirection) {
      return result;
    }

    const direction =
      sortDirection === 'asc' ? 1 : -1;

    return [...result].sort((first, second) => {
      const firstValue = first[sortColumn];
      const secondValue = second[sortColumn];

      if (
        sortColumn === 'created_at'
      ) {
        const firstTime = firstValue
          ? new Date(firstValue).getTime()
          : 0;

        const secondTime = secondValue
          ? new Date(secondValue).getTime()
          : 0;

        return (
          (firstTime - secondTime) *
          direction
        );
      }

      return (
        String(firstValue ?? '').localeCompare(
          String(secondValue ?? ''),
          'fr',
        ) * direction
      );
    });
  }, [
    rows,
    searchQuery,
    filters,
    sortColumn,
    sortDirection,
  ]);

  const openCount = rows.filter(
    (friction) => friction.status === 'open',
  ).length;

  const inProgressCount = rows.filter(
    (friction) =>
      friction.status === 'in_progress',
  ).length;

  const criticalCount = rows.filter(
    (friction) =>
      friction.severity === 'critical',
  ).length;

  const resolvedCount = rows.filter(
    (friction) =>
      friction.status === 'resolved' ||
      friction.status === 'closed',
  ).length;

  const kpis = [
    {
      label: 'Frictions ouvertes',
      value: openCount,
      icon: Zap,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'En cours',
      value: inProgressCount,
      icon: Clock,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Impact critique',
      value: criticalCount,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Résolues',
      value: resolvedCount,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Frictions Produit & Engineering
            </h1>

            {isMock && (
              <Badge
                variant="outline"
                className="gap-1"
              >
                <Database className="h-3 w-3" />
                Démo
              </Badge>
            )}
          </div>

          <p className="mt-1 text-muted-foreground">
            Bugs, UX, performance et problèmes
            techniques suivis par le pôle Produit &
            Engineering.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButtons
            data={filteredRows}
            filename="bib-frictions-produit"
            title="Frictions Produit & Engineering"
            columns={[
              {
                accessor: 'title',
                header: 'Titre',
              },
              {
                accessor: 'environment',
                header: 'Module',
              },
              {
                accessor: 'severity',
                header: 'Sévérité',
              },
              {
                accessor: 'status',
                header: 'Statut',
              },
              {
                accessor: 'created_at',
                header: 'Date',
              },
            ]}
          />

          <CreateRecommendationDialog
            defaultCategory="ux"
            defaultPole="product"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>

                    <p
                      className={`mt-1 text-3xl font-bold ${kpi.color}`}
                    >
                      {kpi.value}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${kpi.color}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle>
                Registre des frictions (
                {filteredRows.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Suivi des problèmes affectant les
                produits, interfaces, services et
                environnements techniques.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  className="w-48 pl-9"
                />
              </div>

              <Select
                value={filters.severity}
                onValueChange={(value) =>
                  setFilter('severity', value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Toutes sévérités
                  </SelectItem>

                  <SelectItem value="critical">
                    Critique
                  </SelectItem>

                  <SelectItem value="high">
                    Élevée
                  </SelectItem>

                  <SelectItem value="medium">
                    Moyenne
                  </SelectItem>

                  <SelectItem value="low">
                    Faible
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilter('status', value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous
                  </SelectItem>

                  <SelectItem value="open">
                    Ouvert
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
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    column="title"
                    currentSort={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  >
                    Titre
                  </SortableTableHead>

                  <SortableTableHead
                    column="environment"
                    currentSort={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  >
                    Module
                  </SortableTableHead>

                  <TableHead>
                    Sévérité
                  </TableHead>

                  <TableHead>
                    Statut
                  </TableHead>

                  <SortableTableHead
                    column="created_at"
                    currentSort={sortColumn}
                    direction={sortDirection}
                    onSort={toggleSort}
                  >
                    Date
                  </SortableTableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.map((friction) => {
                  const severity =
                    severityConfig[
                      friction.severity
                    ];

                  const status =
                    statusConfig[
                      friction.status
                    ];

                  return (
                    <TableRow key={friction.id}>
                      <TableCell>
                        <div className="font-medium">
                          {friction.title}
                        </div>

                        {friction.description && (
                          <div className="max-w-md truncate text-xs text-muted-foreground">
                            {friction.description}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-sm">
                        {friction.environment || '—'}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-sm font-medium ${
                            severity?.color ??
                            'text-muted-foreground'
                          }`}
                        >
                          {severity?.label ??
                            friction.severity}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            status?.variant ??
                            'outline'
                          }
                        >
                          {status?.label ??
                            friction.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(
                          friction.created_at,
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <CreateRecommendationDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Créer une recommandation pour ${friction.title}`}
                            >
                              <Lightbulb className="h-4 w-4" />
                            </Button>
                          }
                          defaultDetail={`Friction "${friction.title}" (${friction.severity}) : `}
                          defaultCategory={
                            friction.severity ===
                              'critical' ||
                            friction.severity ===
                              'high'
                              ? 'bug'
                              : 'ux'
                          }
                          defaultPole="product"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Aucune friction correspondant
                      aux critères.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}