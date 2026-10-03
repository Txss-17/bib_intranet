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
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Loader2,
  Database,
} from 'lucide-react';

import { useRDSuppliersData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type SupplierStatus =
  | 'active'
  | 'at_risk'
  | 'suspended'
  | 'pending';

type SupplierRow = {
  id: string;
  name: string;
  country: string;
  products_count: number;
  quality_score: number;
  risk_score: number;
  status: SupplierStatus | string;
  last_audit_date?: string | null;
};

type SortableSupplierColumn =
  | 'name'
  | 'country'
  | 'products_count'
  | 'quality_score'
  | 'risk_score';

type SupplierFilters = {
  status: string;
  risk: string;
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
  active: {
    label: 'Actif',
    variant: 'default',
  },
  at_risk: {
    label: 'À risque',
    variant: 'secondary',
  },
  suspended: {
    label: 'Suspendu',
    variant: 'destructive',
  },
  pending: {
    label: 'En attente',
    variant: 'outline',
  },
};

const fmtDate = (date?: string | null) => {
  if (!date) {
    return '—';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '—';
  }

  return parsedDate.toLocaleDateString('fr-FR');
};

const getRiskLabel = (riskScore: number) => {
  if (riskScore > 60) {
    return 'Élevé';
  }

  if (riskScore > 30) {
    return 'Modéré';
  }

  return 'Faible';
};

export default function RDSuppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] =
    useState<SortableSupplierColumn | null>('risk_score');
  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc' | null>('desc');

  const [filters, setFilters] = useState<SupplierFilters>({
    status: 'all',
    risk: 'all',
  });

  const { data, isLoading } = useRDSuppliersData();

  const rows = (data?.rows ?? []) as SupplierRow[];
  const isMock = Boolean(data?.isMock);

  const setFilter = (
    key: keyof SupplierFilters,
    value: string,
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleSort = (column: SortableSupplierColumn) => {
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
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const result = rows.filter((supplier) => {
      if (
        normalizedSearch &&
        !supplier.name.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        filters.status !== 'all' &&
        supplier.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.risk === 'high' &&
        supplier.risk_score < 50
      ) {
        return false;
      }

      if (
        filters.risk === 'low' &&
        supplier.risk_score >= 50
      ) {
        return false;
      }

      return true;
    });

    if (!sortColumn || !sortDirection) {
      return result;
    }

    const direction = sortDirection === 'asc' ? 1 : -1;

    return [...result].sort((first, second) => {
      const firstValue = first[sortColumn];
      const secondValue = second[sortColumn];

      if (
        typeof firstValue === 'number' &&
        typeof secondValue === 'number'
      ) {
        return (firstValue - secondValue) * direction;
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

  const atRiskCount = rows.filter(
    (supplier) => supplier.risk_score > 50,
  ).length;

  const healthyCount = rows.filter(
    (supplier) => supplier.quality_score >= 80,
  ).length;

  const averageQuality = rows.length
    ? Math.round(
        rows.reduce(
          (total, supplier) =>
            total + supplier.quality_score,
          0,
        ) / rows.length,
      )
    : 0;

  const averageRisk = rows.length
    ? Math.round(
        rows.reduce(
          (total, supplier) =>
            total + supplier.risk_score,
          0,
        ) / rows.length,
      )
    : 0;

  const kpis = [
    {
      label: 'Fournisseurs',
      value: rows.length,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Qualité moyenne',
      value: `${averageQuality}%`,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'À risque',
      value: atRiskCount,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Risque moyen',
      value: averageRisk,
      icon: TrendingUp,
      color:
        averageRisk > 50
          ? 'text-destructive'
          : averageRisk > 30
            ? 'text-orange-500'
            : 'text-emerald-500',
      bg:
        averageRisk > 50
          ? 'bg-destructive/10'
          : averageRisk > 30
            ? 'bg-orange-500/10'
            : 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              Performance fournisseurs
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
            Qualité, dépendances, audits et niveau de risque
            du réseau fournisseurs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButtons
            data={filteredRows}
            filename="bib-fournisseurs"
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
            ]}
          />

          <CreateRecommendationDialog
            defaultCategory="supplier"
            defaultPole="supplier"
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
                Réseau fournisseurs ({filteredRows.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Suivi de la qualité et des dépendances
                fournisseurs.
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
                value={filters.risk}
                onValueChange={(value) =>
                  setFilter('risk', value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Risque" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Tous risques
                  </SelectItem>
                  <SelectItem value="high">
                    Élevé (&gt;50)
                  </SelectItem>
                  <SelectItem value="low">
                    Faible (&lt;50)
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

                  <TableHead>
                    Statut
                  </TableHead>

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
                    Dernier audit
                  </TableHead>

                  <TableHead className="text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.map((supplier) => {
                  const riskLabel = getRiskLabel(
                    supplier.risk_score,
                  );

                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>

                      <TableCell>
                        {supplier.country}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            statusConfig[supplier.status]
                              ?.variant ?? 'outline'
                          }
                        >
                          {statusConfig[supplier.status]
                            ?.label ?? supplier.status}
                        </Badge>
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

                          <span
                            className={`text-xs font-medium ${
                              supplier.quality_score >= 80
                                ? 'text-emerald-500'
                                : supplier.quality_score >= 50
                                  ? 'text-orange-500'
                                  : 'text-destructive'
                            }`}
                          >
                            {supplier.quality_score}%
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${
                              supplier.risk_score > 60
                                ? 'text-destructive'
                                : supplier.risk_score > 30
                                  ? 'text-orange-500'
                                  : 'text-emerald-500'
                            }`}
                          >
                            {supplier.risk_score}
                          </span>

                          <span className="text-[11px] text-muted-foreground">
                            {riskLabel}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDate(
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
                          defaultDetail={`Fournisseur "${supplier.name}" — risque ${supplier.risk_score}, qualité ${supplier.quality_score}% : `}
                          defaultCategory="supplier"
                          defaultPole="supplier"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Aucun fournisseur correspondant
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