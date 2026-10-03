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

import { useRDProductsData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

type ProductStatus =
  | 'active'
  | 'dormant'
  | 'declining';

type ProductRow = {
  id: string;
  name: string;
  category: string;
  supplier_name: string;
  status: ProductStatus | string;
  adoption: number;
  orders_30d: number;
  revenue_30d: number;
};

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

export default function RDProducts() {
  const [searchQuery, setSearchQuery] =
    useState('');

  const [sortColumn, setSortColumn] =
    useState<string | null>('orders_30d');

  const [sortDirection, setSortDirection] =
    useState<'asc' | 'desc' | null>('desc');

  const [filters, setFiltersState] =
    useState<Record<string, string>>({});

  const setFilter = (
    key: string,
    value: string,
  ) => {
    setFiltersState((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const toggleSort = (column: string) => {
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

  const { data, isLoading } =
    useRDProductsData();

  const rows = (data?.rows ?? []) as ProductRow[];
  const isMock = data?.isMock ?? false;

  const dormantCount = rows.filter(
    (row) => row.status === 'dormant',
  ).length;

  const decliningCount = rows.filter(
    (row) => row.status === 'declining',
  ).length;

  const avgAdoption = rows.length
    ? Math.round(
        rows.reduce(
          (sum, row) => sum + row.adoption,
          0,
        ) / rows.length,
      )
    : 0;

  const totalRevenue = rows.reduce(
    (sum, row) =>
      sum + (row.revenue_30d || 0),
    0,
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.category)
            .filter(
              (category) =>
                category && category !== '—',
            ),
        ),
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const result = rows.filter((product) => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      if (
        query &&
        !`${product.name} ${product.category} ${product.supplier_name}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }

      if (
        filters.status &&
        filters.status !== 'all' &&
        product.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.category &&
        filters.category !== 'all' &&
        product.category !==
          filters.category
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

    return [...result].sort((a, b) => {
      const first =
        a[
          sortColumn as keyof ProductRow
        ];

      const second =
        b[
          sortColumn as keyof ProductRow
        ];

      if (
        typeof first === 'number' &&
        typeof second === 'number'
      ) {
        return (
          (first - second) * direction
        );
      }

      return (
        String(first ?? '').localeCompare(
          String(second ?? ''),
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

  const kpis = [
    {
      label: 'Produits dormants',
      value: dormantCount,
      description:
        'Produits sans activité récente',
      icon: Package,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Produits en déclin',
      value: decliningCount,
      description:
        'Produits dont la demande diminue',
      icon: TrendingDown,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Adoption moyenne',
      value: `${avgAdoption}%`,
      description:
        'Adoption moyenne du catalogue',
      icon: BarChart3,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'CA 30 jours',
      value: `${Math.round(
        totalRevenue,
      ).toLocaleString('fr-FR')} €`,
      description:
        'Chiffre d’affaires observé sur 30 jours',
      icon: AlertTriangle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-bold">
              Performance catalogue
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Analyse des produits, adoption, commandes,
            chiffre d’affaires et cycle de vie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            data={filtered}
            filename="bib-product-catalogue"
            title="Performance catalogue"
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
                accessor: 'orders_30d',
                header: 'Commandes 30j',
              },
              {
                accessor: 'revenue_30d',
                header: 'CA 30j',
              },
              {
                accessor: 'adoption',
                header: 'Adoption',
              },
            ]}
          />

          <CreateRecommendationDialog
            defaultCategory="product"
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

                    <p className="mt-1 text-xs text-muted-foreground">
                      {kpi.description}
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Catalogue ({filtered.length})
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Vue opérationnelle de la performance des
                produits actuellement suivis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  className="w-56 pl-9"
                />
              </div>

              <Select
                value={
                  filters.status ?? 'all'
                }
                onValueChange={(value) =>
                  setFilter(
                    'status',
                    value,
                  )
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Statut" />
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

              {categories.length > 0 && (
                <Select
                  value={
                    filters.category ?? 'all'
                  }
                  onValueChange={(value) =>
                    setFilter(
                      'category',
                      value,
                    )
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      Toutes les catégories
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
              )}
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
                {filtered.map((product) => {
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
                        <div className="flex items-center gap-2">
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
                        {product.orders_30d}
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
                            >
                              <Lightbulb className="h-4 w-4" />
                            </Button>
                          }
                          defaultDetail={`Produit "${product.name}" — statut ${product.status}, ${product.orders_30d} commandes sur 30 jours.`}
                          defaultCategory="product"
                          defaultPole="product"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Aucun produit correspondant aux
                      critères.
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