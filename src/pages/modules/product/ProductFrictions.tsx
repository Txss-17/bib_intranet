import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Lightbulb,
  Loader2,
  Search,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useProductFrictionsData,
  type ProductFrictionRow,
} from '@/hooks/useRDData';

import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type SortColumn =
  | 'title'
  | 'environment'
  | 'created_at';

const severityConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  critical: {
    label: 'Critique',
    className: 'text-destructive',
  },
  high: {
    label: 'Élevée',
    className: 'text-orange-600',
  },
  medium: {
    label: 'Moyenne',
    className: 'text-yellow-600',
  },
  low: {
    label: 'Faible',
    className: 'text-muted-foreground',
  },
};

const statusConfig: Record<
  string,
  string
> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Clos',
};

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(
    'fr-FR',
  );
}

export default function ProductFrictions() {
  const {
    data,
    isLoading,
    isError,
  } = useProductFrictionsData();

  const rows: ProductFrictionRow[] =
    data?.rows ?? [];

  const isMock = data?.isMock ?? false;

  const [searchQuery, setSearchQuery] =
    useState('');

  const [severityFilter, setSeverityFilter] =
    useState('all');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [sortColumn, setSortColumn] =
    useState<SortColumn>('created_at');

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('desc');

  const filteredRows = useMemo(() => {
    const normalized =
      searchQuery.trim().toLowerCase();

    const filtered = rows.filter(
      (row) => {
        if (
          normalized &&
          !`${row.title} ${row.description ?? ''} ${row.environment ?? ''}`
            .toLowerCase()
            .includes(normalized)
        ) {
          return false;
        }

        if (
          severityFilter !== 'all' &&
          row.severity !==
            severityFilter
        ) {
          return false;
        }

        if (
          statusFilter !== 'all' &&
          row.status !== statusFilter
        ) {
          return false;
        }

        return true;
      },
    );

    return [...filtered].sort(
      (a, b) => {
        const first =
          a[sortColumn] ?? '';

        const second =
          b[sortColumn] ?? '';

        const comparison =
          String(first).localeCompare(
            String(second),
            'fr',
          );

        return sortDirection === 'asc'
          ? comparison
          : -comparison;
      },
    );
  }, [
    rows,
    searchQuery,
    severityFilter,
    statusFilter,
    sortColumn,
    sortDirection,
  ]);

  const toggleSort = (
    column: string,
  ) => {
    if (column === sortColumn) {
      setSortDirection(
        (current) =>
          current === 'asc'
            ? 'desc'
            : 'asc',
      );

      return;
    }

    setSortColumn(
      column as SortColumn,
    );

    setSortDirection('asc');
  };

  const openCount =
    rows.filter(
      (row) =>
        row.status === 'open',
    ).length;

  const criticalCount =
    rows.filter(
      (row) =>
        row.severity === 'critical',
    ).length;

  const highCount =
    rows.filter(
      (row) =>
        row.severity === 'high',
    ).length;

  const resolvedCount =
    rows.filter(
      (row) =>
        row.status === 'resolved' ||
        row.status === 'closed',
    ).length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <AlertTriangle className="h-7 w-7" />

            <h1 className="text-2xl font-bold">
              Frictions Produit & Engineering
            </h1>

            <Badge variant="outline">
              Produit & Engineering
            </Badge>
          </div>

          <p className="mt-1 max-w-3xl text-muted-foreground">
            Bugs, problèmes UX, performances
            et anomalies techniques suivis par
            le pôle Produit & Engineering.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isMock && (
            <Badge
              variant="outline"
              className="gap-1"
            >
              <Database className="h-3 w-3" />
              Données de démonstration
            </Badge>
          )}

          <ExportButtons
            data={filteredRows}
            filename="bib-product-frictions"
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
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Ouvertes
            </p>

            <p className="mt-1 text-3xl font-bold">
              {openCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Critiques
            </p>

            <p className="mt-1 text-3xl font-bold text-destructive">
              {criticalCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Élevées
            </p>

            <p className="mt-1 text-3xl font-bold">
              {highCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Résolues / closes
            </p>

            <p className="mt-1 text-3xl font-bold">
              {resolvedCount}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Registre des frictions
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredRows.length} friction
                {filteredRows.length > 1
                  ? 's'
                  : ''} affichée
                {filteredRows.length > 1
                  ? 's'
                  : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Rechercher..."
                  className="w-56 pl-9"
                />
              </div>

              <Select
                value={severityFilter}
                onValueChange={
                  setSeverityFilter
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
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
                value={statusFilter}
                onValueChange={
                  setStatusFilter
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous statuts
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
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {isError &&
            !isLoading && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
                Impossible de charger le registre
                des frictions.
              </div>
            )}

          {!isLoading &&
            !isError && (
              <div className="overflow-x-auto">
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
                    {filteredRows.map(
                      (friction) => {
                        const severity =
                          severityConfig[
                            friction.severity
                          ];

                        return (
                          <TableRow
                            key={friction.id}
                          >
                            <TableCell>
                              <div className="font-medium">
                                {
                                  friction.title
                                }
                              </div>

                              {friction.description && (
                                <div className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                                  {
                                    friction.description
                                  }
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              {friction.environment ??
                                '—'}
                            </TableCell>

                            <TableCell>
                              <span
                                className={`text-sm font-medium ${
                                  severity?.className ??
                                  'text-muted-foreground'
                                }`}
                              >
                                {severity?.label ??
                                  friction.severity}
                              </span>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline">
                                {statusConfig[
                                  friction.status
                                ] ??
                                  friction.status}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-sm text-muted-foreground">
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
                                defaultDetail={`Friction "${friction.title}" — ${friction.description ?? ''}`}
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
                      },
                    )}

                    {filteredRows.length ===
                      0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Aucune friction
                          correspondant aux
                          critères.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}