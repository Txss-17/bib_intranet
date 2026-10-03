import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Loader2,
  Package,
  Pencil,
  Search,
  X,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  usePartnerStocks,
  useUpdateStock,
} from '@/hooks/useOpsControl';

// ============================================================
// PAGE
// ============================================================

export default function DistributedStocks() {
  const {
    data: stocks = [],
    isLoading,
    isError,
    error,
  } = usePartnerStocks();

  const update = useUpdateStock();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return stocks;
    }

    return stocks.filter((stock) => {
      return (
        stock.product_catalog?.shop_sku
          ?.toLowerCase()
          .includes(query) ||
        stock.product_catalog?.name
          ?.toLowerCase()
          .includes(query) ||
        stock.logistics_partners?.name
          ?.toLowerCase()
          .includes(query) ||
        stock.region
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [stocks, search]);

  // ============================================================
  // KPI
  // ============================================================

  const kpis = useMemo(() => {
    const totalUnits = stocks.reduce(
      (sum, stock) => sum + Number(stock.quantity ?? 0),
      0
    );

    const reservedUnits = stocks.reduce(
      (sum, stock) =>
        sum + Number(stock.reserved_quantity ?? 0),
      0
    );

    const availableUnits = Math.max(
      0,
      totalUnits - reservedUnits
    );

    const ruptures = stocks.filter(
      (stock) =>
        stock.quantity <= stock.rupture_threshold
    ).length;

    const lows = stocks.filter(
      (stock) =>
        stock.quantity > stock.rupture_threshold &&
        stock.quantity <= stock.reorder_threshold
    ).length;

    const healthy = stocks.filter(
      (stock) =>
        stock.quantity > stock.reorder_threshold
    ).length;

    return {
      totalUnits,
      reservedUnits,
      availableUnits,
      ruptures,
      lows,
      healthy,
    };
  }, [stocks]);

  // ============================================================
  // STATUS
  // ============================================================

  const getStatus = (
    stock: (typeof stocks)[number]
  ) => {
    if (
      stock.quantity <=
      stock.rupture_threshold
    ) {
      return {
        label: 'Rupture',
        variant: 'destructive' as const,
      };
    }

    if (
      stock.quantity <=
      stock.reorder_threshold
    ) {
      return {
        label: 'Faible',
        variant: 'secondary' as const,
      };
    }

    return {
      label: 'OK',
      variant: 'outline' as const,
    };
  };

  // ============================================================
  // EDITION
  // ============================================================

  const startEditing = (
    stock: (typeof stocks)[number]
  ) => {
    setEditing(stock.id);
    setEditValue(stock.quantity);
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValue(0);
  };

  const saveStock = (
    stock: (typeof stocks)[number]
  ) => {
    update.mutate(
      {
        id: stock.id,
        quantity: Math.max(
          0,
          Math.floor(editValue)
        ),
      },
      {
        onSuccess: () => {
          setEditing(null);
          setEditValue(0);
        },
      }
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            Chargement des stocks...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">
            Stocks distribués
          </h1>

          <p className="text-muted-foreground">
            Vue des stocks par produit et partenaire
          </p>
        </div>

        <Card className="border-destructive/50">
          <CardContent className="py-8">
            <p className="font-medium text-destructive">
              Impossible de charger les stocks.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : 'Une erreur Supabase est survenue.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold">
          Stocks distribués
        </h1>

        <p className="text-muted-foreground">
          Vue opérationnelle par produit × partenaire
        </p>
      </div>

      {/* KPI */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Unités totales
            </CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.totalUnits.toLocaleString(
                'fr-FR'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Disponibles
            </CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.availableUnits.toLocaleString(
                'fr-FR'
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {kpis.reservedUnits.toLocaleString(
                'fr-FR'
              )}{' '}
              réservées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ruptures
            </CardTitle>

            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpis.ruptures}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Références concernées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Stock faible
            </CardTitle>

            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.lows}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Sous le seuil de réapprovisionnement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Stock normal
            </CardTitle>

            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.healthy}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Références au-dessus du seuil
            </p>
          </CardContent>
        </Card>

      </div>

      {/* TABLE */}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Inventaire distribué
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} référence
                {filtered.length > 1 ? 's' : ''}
                affichée
                {filtered.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="SKU, produit, partenaire ou région..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />

              <p className="font-medium">
                Aucun stock trouvé
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aucun inventaire ne correspond aux
                critères actuels.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      SKU boutique
                    </TableHead>

                    <TableHead>
                      Produit
                    </TableHead>

                    <TableHead>
                      Partenaire
                    </TableHead>

                    <TableHead>
                      Région
                    </TableHead>

                    <TableHead className="text-right">
                      Quantité
                    </TableHead>

                    <TableHead className="text-right">
                      Réservé
                    </TableHead>

                    <TableHead className="text-right">
                      Disponible
                    </TableHead>

                    <TableHead className="text-right">
                      Seuils
                    </TableHead>

                    <TableHead>
                      État
                    </TableHead>

                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((stock) => {
                    const status =
                      getStatus(stock);

                    const available = Math.max(
                      0,
                      stock.quantity -
                        stock.reserved_quantity
                    );

                    const isEditing =
                      editing === stock.id;

                    return (
                      <TableRow key={stock.id}>

                        {/* SKU */}

                        <TableCell className="font-mono text-xs">
                          {stock.product_catalog
                            ?.shop_sku ?? '—'}
                        </TableCell>

                        {/* PRODUIT */}

                        <TableCell>
                          <div className="max-w-[220px]">
                            <p className="font-medium">
                              {stock.product_catalog
                                ?.name ??
                                'Produit inconnu'}
                            </p>

                            {stock.product_catalog
                              ?.category && (
                              <p className="text-xs text-muted-foreground">
                                {
                                  stock
                                    .product_catalog
                                    .category
                                }
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* PARTENAIRE */}

                        <TableCell>
                          {stock
                            .logistics_partners
                            ?.name ?? '—'}
                        </TableCell>

                        {/* REGION */}

                        <TableCell className="text-xs text-muted-foreground">
                          {stock.region ?? '—'}
                        </TableCell>

                        {/* QUANTITE */}

                        <TableCell className="text-right font-medium">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              value={editValue}
                              onChange={(event) =>
                                setEditValue(
                                  Math.max(
                                    0,
                                    Number(
                                      event.target
                                        .value
                                    ) || 0
                                  )
                                )
                              }
                              className="ml-auto h-8 w-24"
                              autoFocus
                            />
                          ) : (
                            stock.quantity.toLocaleString(
                              'fr-FR'
                            )
                          )}
                        </TableCell>

                        {/* RESERVE */}

                        <TableCell className="text-right text-muted-foreground">
                          {stock.reserved_quantity.toLocaleString(
                            'fr-FR'
                          )}
                        </TableCell>

                        {/* DISPONIBLE */}

                        <TableCell className="text-right font-medium">
                          {available.toLocaleString(
                            'fr-FR'
                          )}
                        </TableCell>

                        {/* SEUILS */}

                        <TableCell className="text-right text-xs text-muted-foreground">
                          <div>
                            Rupture :{' '}
                            {stock.rupture_threshold}
                          </div>

                          <div>
                            Réassort :{' '}
                            {stock.reorder_threshold}
                          </div>
                        </TableCell>

                        {/* ETAT */}

                        <TableCell>
                          <Badge
                            variant={status.variant}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={
                                  update.isPending
                                }
                                onClick={() =>
                                  saveStock(stock)
                                }
                              >
                                {update.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}

                                <span className="sr-only">
                                  Enregistrer
                                </span>
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={
                                  update.isPending
                                }
                                onClick={
                                  cancelEditing
                                }
                              >
                                <X className="h-4 w-4" />

                                <span className="sr-only">
                                  Annuler
                                </span>
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                startEditing(stock)
                              }
                            >
                              <Pencil className="h-4 w-4" />

                              <span className="sr-only">
                                Modifier le stock
                              </span>
                            </Button>
                          )}
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}