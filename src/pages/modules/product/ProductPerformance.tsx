import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Database,
  Lightbulb,
  Loader2,
  Package,
  Search,
  TrendingDown,
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
  useProductPerformanceData,
  type ProductPerformanceRow,
} from '@/hooks/useRDData';

import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type ProductStatus =
  | 'active'
  | 'dormant'
  | 'declining';

const statusConfig: Record<
  ProductStatus,
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
  dormant: {
    label: 'Dormant',
    variant: 'destructive',
  },
  declining: {
    label: 'En déclin',
    variant: 'secondary',
  },
};

type SortColumn =
  | 'name'
  | 'category'
  | 'supplier_name'
  | 'adoption'
  | 'orders_30d'
  | 'revenue_30d';

export default function ProductPerformance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] =
    useState<SortColumn>('orders_30d');
  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc'>('desc');

  const [statusFilter, setStatusFilter] =
    useState('all');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const {
    data,
    isLoading,
    isError,
  } = useProductPerformanceData();

  const rows: ProductPerformanceRow[] =
    data?.rows ?? [];

  const isMock = data?.isMock ?? false;

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.category)
          .filter(
            (category) =>
              category && category !== '—',
          ),
      ),
    ).sort((a, b) =>
      a.localeCompare(b, 'fr'),
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      searchQuery.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (
        normalizedSearch &&
        !`${row.name} ${row.category} ${row.supplier_name}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        statusFilter !== 'all' &&
        row.status !== statusFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        row.category !== categoryFilter
      ) {
        return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const first = a[sortColumn];
      const second = b[sortColumn];

      let comparison = 0;

      if (
        typeof first === 'number' &&
        typeof second === 'number'
      ) {
        comparison = first - second;
      } else {
        comparison = String(
          first ?? '',
        ).localeCompare(
          String(second ?? ''),
          'fr',
        );
      }

      return sortDirection === 'asc'
        ? comparison
        : -comparison;
    });
  }, [
    rows,
    searchQuery,
    statusFilter,
    categoryFilter,
    sortColumn,
    sortDirection,
  ]);

  const toggleSort = (
    column: string,
  ) => {
    if (
      column === sortColumn
    ) {
      setSortDirection((current) =>
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

  const dormantCount =
    rows.filter(
      (row) =>
        row.status === 'dormant',
    ).length;

  const decliningCount =
    rows.filter(
      (row) =>
        row.status === 'declining',
    ).length;

  const averageAdoption = rows.length
    ? Math.round(
        rows.reduce(
          (total, row) =>
            total + row.adoption,
          0,
        ) / rows.length,
      )
    : 0;

  const totalRevenue = rows.reduce(
    (total, row) =>
      total + row.revenue_30d,
    0,
  );

  const kpis = [
    {
      label: 'Produits dormants',
      value: dormantCount,
      description:
        'Sans activité récente',
      icon: Package,
    },
    {
      label: 'Produits en déclin',
      value: decliningCount,
      description:
        'Demande en diminution',
      icon: TrendingDown,
    },
    {
      label: 'Adoption moyenne',
      value: `${averageAdoption}%`,
      description:
        'Adoption moyenne du catalogue',
      icon: BarChart3,
    },
    {
      label: 'CA sur 30 jours',
      value: `${Math.round(
        totalRevenue,
      ).toLocaleString('fr-FR')} €`,
      description:
        'Chiffre d’affaires observé',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">
                  Performance produit
                </h1>

                <Badge variant="outline">
                  Produit & Engineering
                </Badge>
              </div>

              <p className="mt-1 text-muted-foreground">
                Analyse de la performance du
                catalogue, de l’adoption et de
                l’activité commerciale.
              </p>
            </div>
          </div>
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
            filename="bib-product-performance"
            title="Performance produit"
            columns={[
              {
                accessor: 'name',
                header: 'Produit',
              },
              {
                accessor: 'category',
                header: 'Catégorie',
              },
              {
                accessor: 'supplier_name',
                header: 'Fournisseur',
              },
              {
                accessor: 'status',
                header: 'Statut',
              },
              {
                accessor: 'adoption',
                header: 'Adoption',
              },
              {
                accessor: 'orders_30d',
                header: 'Commandes 30j',
              },
              {
                accessor: 'revenue_30d',
                header: 'CA 30j',
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
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      {kpi.value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {kpi.description}
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
                Catalogue produit
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredRows.length} produit
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
                  placeholder="Rechercher..."
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
                    Tous les statuts
                  </SelectItem>

                  <SelectItem value="active">
                    Actif
                  </SelectItem>

                  <SelectItem value="declining">
                    En déclin
                  </SelectItem>

                  <SelectItem value="dormant">
                    Dormant
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={
                  setCategoryFilter
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Toutes catégories
                  </SelectItem>

                  {categories.map(
                    (category) => (
                      <SelectItem
                        key={category}
                        value={category}
                      >
                        {category}
                      </SelectItem>
                    ),
                  )}
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

          {isError && !isLoading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm">
              Impossible de charger les
              données de performance produit.
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
                        Produit
                      </SortableTableHead>

                      <SortableTableHead
                        column="category"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Catégorie
                      </SortableTableHead>

                      <SortableTableHead
                        column="supplier_name"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Fournisseur
                      </SortableTableHead>

                      <TableHead>
                        Statut
                      </TableHead>

                      <SortableTableHead
                        column="adoption"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Adoption
                      </SortableTableHead>

                      <SortableTableHead
                        column="orders_30d"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        Cmd 30j
                      </SortableTableHead>

                      <SortableTableHead
                        column="revenue_30d"
                        currentSort={sortColumn}
                        direction={sortDirection}
                        onSort={toggleSort}
                      >
                        CA 30j
                      </SortableTableHead>

                      <TableHead className="text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredRows.map(
                      (product) => {
                        const status =
                          statusConfig[
                            product.status as ProductStatus
                          ];

                        return (
                          <TableRow
                            key={product.id}
                          >
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>

                            <TableCell>
                              {product.category}
                            </TableCell>

                            <TableCell>
                              {product.supplier_name}
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant={
                                  status?.variant ??
                                  'outline'
                                }
                              >
                                {status?.label ??
                                  product.status}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex min-w-[120px] items-center gap-2">
                                <Progress
                                  value={
                                    product.adoption
                                  }
                                  className="h-2 w-16"
                                />

                                <span className="text-xs">
                                  {product.adoption}%
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {
                                product.orders_30d
                              }
                            </TableCell>

                            <TableCell className="font-medium">
                              {Math.round(
                                product.revenue_30d,
                              ).toLocaleString(
                                'fr-FR',
                              )}{' '}
                              €
                            </TableCell>

                            <TableCell className="text-right">
                              <CreateRecommendationDialog
                                trigger={
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Créer une recommandation pour ${product.name}`}
                                  >
                                    <Lightbulb className="h-4 w-4" />
                                  </Button>
                                }
                                defaultDetail={`Produit "${product.name}" — ${product.orders_30d} commandes sur 30 jours, adoption ${product.adoption}%.`}
                                defaultCategory="product"
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
                          colSpan={8}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Aucun produit ne
                          correspond aux
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