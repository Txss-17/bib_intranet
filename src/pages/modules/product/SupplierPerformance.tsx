import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Lightbulb,
  Loader2,
  Package,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

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
  useProductSupplierData,
  type SupplierPerformanceRow,
} from '@/hooks/useRDData';

import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type SortColumn =
  | 'name'
  | 'country'
  | 'products_count'
  | 'quality_score'
  | 'risk_score';

const statusLabel: Record<
  string,
  string
> = {
  active: 'Actif',
  at_risk: 'À risque',
  suspended: 'Suspendu',
  pending: 'En attente',
};

function riskLabel(score: number) {
  if (score >= 70) return 'Élevé';
  if (score >= 40) return 'Modéré';
  return 'Faible';
}

function riskVariant(
  score: number,
): 'destructive' | 'secondary' | 'default' {
  if (score >= 70) return 'destructive';
  if (score >= 40) return 'secondary';
  return 'default';
}

function formatDate(
  date: string | null,
) {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString(
    'fr-FR',
  );
}

export default function SupplierPerformance() {
  const {
    data,
    isLoading,
    isError,
  } = useProductSupplierData();

  const rows: SupplierPerformanceRow[] =
    data?.rows ?? [];

  const isMock = data?.isMock ?? false;

  const [searchQuery, setSearchQuery] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [riskFilter, setRiskFilter] =
    useState('all');

  const [sortColumn, setSortColumn] =
    useState<SortColumn>('risk_score');

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('desc');

  const filteredRows = useMemo(() => {
    const normalized =
      searchQuery.trim().toLowerCase();

    const filtered = rows.filter(
      (supplier) => {
        if (
          normalized &&
          !`${supplier.name} ${supplier.country}`
            .toLowerCase()
            .includes(normalized)
        ) {
          return false;
        }

        if (
          statusFilter !== 'all' &&
          supplier.status !== statusFilter
        ) {
          return false;
        }

        if (
          riskFilter !== 'all'
        ) {
          const risk =
            supplier.risk_score;

          if (
            riskFilter === 'high' &&
            risk < 70
          ) {
            return false;
          }

          if (
            riskFilter === 'medium' &&
            (risk < 40 || risk >= 70)
          ) {
            return false;
          }

          if (
            riskFilter === 'low' &&
            risk >= 40
          ) {
            return false;
          }
        }

        return true;
      },
    );

    return [...filtered].sort(
      (a, b) => {
        const first =
          a[sortColumn];

        const second =
          b[sortColumn];

        let comparison = 0;

        if (
          typeof first === 'number' &&
          typeof second === 'number'
        ) {
          comparison =
            first - second;
        } else {
          comparison =
            String(
              first ?? '',
            ).localeCompare(
              String(
                second ?? '',
              ),
              'fr',
            );
        }

        return sortDirection === 'asc'
          ? comparison
          : -comparison;
      },
    );
  }, [
    rows,
    searchQuery,
    statusFilter,
    riskFilter,
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

  const activeCount =
    rows.filter(
      (row) =>
        row.status === 'active',
    ).length;

  const atRiskCount =
    rows.filter(
      (row) =>
        row.risk_score >= 70 ||
        row.status === 'at_risk',
    ).length;

  const averageQuality = rows.length
    ? Math.round(
        rows.reduce(
          (sum, row) =>
            sum + row.quality_score,
          0,
        ) / rows.length,
      )
    : 0;

  const auditedCount =
    rows.filter(
      (row) => row.last_audit_date,
    ).length;

  const kpis = [
    {
      label: 'Fournisseurs actifs',
      value: activeCount,
      icon: CheckCircle,
    },
    {
      label: 'Points de vigilance',
      value: atRiskCount,
      icon: AlertTriangle,
    },
    {
      label: 'Qualité moyenne',
      value: `${averageQuality}%`,
      icon: TrendingUp,
    },
    {
      label: 'Audits renseignés',
      value: auditedCount,
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Package className="h-7 w-7" />

            <h1 className="text-2xl font-bold">
              Performance fournisseurs
            </h1>

            <Badge variant="outline">
              Produit & Engineering
            </Badge>
          </div>

          <p className="mt-1 text-muted-foreground">
            Données fournisseurs utiles au
            pilotage produit : qualité,
            risque, catalogue et audits.
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
            filename="bib-supplier-performance"
            title="Performance fournisseurs"
            columns={[
              {
                accessor: 'name',
                header: 'Fournisseur',
              },
              {
                accessor: 'country',
                header: 'Pays',
              },
              {
                accessor: 'products_count',
                header: 'Produits',
              },
              {
                accessor: 'quality_score',
                header: 'Qualité',
              },
              {
                accessor: 'risk_score',
                header: 'Risque',
              },
              {
                accessor: 'status',
                header: 'Statut',
              },
              {
                accessor:
                  'last_audit_date',
                header: 'Dernier audit',
              },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {kpi.label}
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      {kpi.value}
                    </p>
                  </div>

                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Fournisseurs suivis
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredRows.length}{' '}
                fournisseur
                {filteredRows.length > 1
                  ? 's'
                  : ''}{' '}
                affiché
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
                  placeholder="Fournisseur ou pays..."
                  className="w-56 pl-9"
                />
              </div>

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

                  <SelectItem value="active">
                    Actif
                  </SelectItem>

                  <SelectItem value="at_risk">
                    À risque
                  </SelectItem>

                  <SelectItem value="suspended">
                    Suspendu
                  </SelectItem>

                  <SelectItem value="pending">
                    En attente
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={riskFilter}
                onValueChange={
                  setRiskFilter
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous risques
                  </SelectItem>

                  <SelectItem value="high">
                    Risque élevé
                  </SelectItem>

                  <SelectItem value="medium">
                    Risque modéré
                  </SelectItem>

                  <SelectItem value="low">
                    Risque faible
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
                Impossible de charger les
                données fournisseurs.
              </div>
            )}

          {!isLoading &&
            !isError && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        column="name"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Fournisseur
                      </SortableTableHead>

                      <SortableTableHead
                        column="country"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Pays
                      </SortableTableHead>

                      <SortableTableHead
                        column="products_count"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Produits
                      </SortableTableHead>

                      <SortableTableHead
                        column="quality_score"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Qualité
                      </SortableTableHead>

                      <SortableTableHead
                        column="risk_score"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Risque
                      </SortableTableHead>

                      <TableHead>
                        Statut
                      </TableHead>

                      <TableHead>
                        Dernier audit
                      </TableHead>

                      <TableHead className="text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredRows.map(
                      (supplier) => (
                        <TableRow
                          key={supplier.id}
                        >
                          <TableCell className="font-medium">
                            {supplier.name}
                          </TableCell>

                          <TableCell>
                            {supplier.country}
                          </TableCell>

                          <TableCell>
                            {supplier.products_count}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  supplier.quality_score
                                }
                                className="h-2 w-16"
                              />

                              <span className="text-xs">
                                {
                                  supplier.quality_score
                                }%
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant={riskVariant(
                                supplier.risk_score,
                              )}
                            >
                              {riskLabel(
                                supplier.risk_score,
                              )}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {statusLabel[
                                supplier.status
                              ] ??
                                supplier.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(
                              supplier.last_audit_date,
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <CreateRecommendationDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Créer une recommandation pour ${supplier.name}`}
                                >
                                  <Lightbulb className="h-4 w-4" />
                                </Button>
                              }
                              defaultDetail={`Fournisseur "${supplier.name}" — qualité ${supplier.quality_score}%, risque ${supplier.risk_score}%, ${supplier.products_count} produits.`}
                              defaultCategory="supplier"
                              defaultPole="product"
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}

                    {filteredRows.length ===
                      0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Aucun fournisseur
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