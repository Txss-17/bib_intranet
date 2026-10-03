import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Package,
  Search,
  Store,
  Truck,
  XCircle,
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ExportButtons } from '@/components/ExportButtons';
import { useOrders, Order } from '@/hooks/useOps';

// ============================================================
// CONFIGURATION
// ============================================================

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_VARIANTS: Record<
  Order['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

const STAGE_LABELS: Record<string, string> = {
  created: 'Créée',
  confirmed: 'Confirmée',
  transmitted: 'Transmise',
  accepted: 'Acceptée',
  prepared: 'Préparée',
  preparing: 'Préparation',
  processing: 'Traitement',
  shipped: 'Expédiée',
  in_transit: 'En transit',
  out_for_delivery: 'En livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  refunded: 'Remboursée',
};

const formatStage = (stage?: string | null) => {
  if (!stage) return '—';

  return (
    STAGE_LABELS[stage.toLowerCase()] ??
    stage.replace(/_/g, ' ')
  );
};

const formatCurrency = (
  amount: number,
  currency = 'EUR'
) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
};

const formatDate = (date?: string | null) => {
  if (!date) return '—';

  try {
    return format(
      new Date(date),
      'dd/MM/yyyy HH:mm',
      { locale: fr }
    );
  } catch {
    return '—';
  }
};

// ============================================================
// PAGE
// ============================================================

const Orders = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');

  // ============================================================
  // BOUTIQUES DISPONIBLES
  // ============================================================

  const shops = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        code: string;
      }
    >();

    for (const order of orders) {
      if (!order.shop_id) continue;

      if (!map.has(order.shop_id)) {
        map.set(order.shop_id, {
          id: order.shop_id,
          name: order.shop_name || 'Boutique inconnue',
          code: order.shop_code || order.shop_id,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'fr')
    );
  }, [orders]);

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.order_number.toLowerCase().includes(query) ||
        (order.shop_name ?? '').toLowerCase().includes(query) ||
        (order.shop_code ?? '').toLowerCase().includes(query) ||
        (order.shipping_address ?? '').toLowerCase().includes(query) ||
        (order.tracking_number ?? '').toLowerCase().includes(query) ||
        (order.platform_id ?? '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        order.status === statusFilter;

      const matchesShop =
        shopFilter === 'all' ||
        order.shop_id === shopFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesShop
      );
    });
  }, [
    orders,
    searchQuery,
    statusFilter,
    shopFilter,
  ]);

  // ============================================================
  // KPI
  // ============================================================

  const kpis = useMemo(() => {
    const total = orders.length;

    const pending = orders.filter(
      (o) => o.status === 'pending'
    ).length;

    const processing = orders.filter(
      (o) => o.status === 'processing'
    ).length;

    const shipped = orders.filter(
      (o) => o.status === 'shipped'
    ).length;

    const delivered = orders.filter(
      (o) => o.status === 'delivered'
    ).length;

    const cancelled = orders.filter(
      (o) => o.status === 'cancelled'
    ).length;

    const revenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce(
        (sum, order) => sum + order.total_amount,
        0
      );

    return {
      total,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      revenue,
    };
  }, [orders]);

  // ============================================================
  // EXPORT
  // ============================================================

  const exportData = filteredOrders.map((order) => ({
    commande: order.order_number,
    boutique: order.shop_name ?? '',
    code_boutique: order.shop_code ?? '',
    statut: STATUS_LABELS[order.status],
    etape: formatStage(order.current_stage),
    montant: order.total_amount,
    devise: order.currency,
    destination: order.shipping_address ?? '',
    methode_livraison: order.shipping_method ?? '',
    suivi: order.tracking_number ?? '',
    region: order.region ?? '',
    date: formatDate(
      order.ordered_at ?? order.created_at
    ),
  }));

  // ============================================================
  // LOADING
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement des commandes...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Commandes
          </h1>
          <p className="text-sm text-muted-foreground">
            Supervision des commandes Marketplace BIB
          </p>
        </div>

        <Card className="border-destructive/50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-destructive" />

            <div>
              <p className="font-medium">
                Impossible de charger les commandes
              </p>

              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : 'Une erreur Supabase est survenue.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Commandes
          </h1>

          <p className="text-sm text-muted-foreground">
            Supervision des commandes Marketplace BIB
          </p>
        </div>

        <ExportButtons
          data={exportData}
          filename="bib-commandes"
          title="Commandes BIB"
        />
      </div>

      {/* KPI */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Commandes
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {kpis.total}
              </p>
            </div>

            <Package className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                En cours
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {kpis.pending + kpis.processing + kpis.shipped}
              </p>
            </div>

            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                Livrées
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {kpis.delivered}
              </p>
            </div>

            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">
                CA commandes
              </p>

              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(kpis.revenue)}
              </p>
            </div>

            <Truck className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* FILTRES */}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Rechercher une commande, boutique, destination ou suivi..."
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full lg:w-[190px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Tous les statuts
              </SelectItem>

              {Object.entries(STATUS_LABELS).map(
                ([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select
            value={shopFilter}
            onValueChange={setShopFilter}
          >
            <SelectTrigger className="w-full lg:w-[220px]">
              <Store className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Boutique" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Toutes les boutiques
              </SelectItem>

              {shops.map((shop) => (
                <SelectItem
                  key={shop.id}
                  value={shop.id}
                >
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* TABLE */}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Commandes Marketplace
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              {filteredOrders.length} commande
              {filteredOrders.length > 1 ? 's' : ''}
              affichée
              {filteredOrders.length > 1 ? 's' : ''}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />

              <p className="font-medium">
                Aucune commande trouvée
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez vos filtres ou attendez la
                synchronisation d'une commande Marketplace.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Commande
                    </TableHead>

                    <TableHead>
                      Boutique
                    </TableHead>

                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Montant
                    </TableHead>

                    <TableHead>
                      Destination
                    </TableHead>

                    <TableHead>
                      Étape
                    </TableHead>

                    <TableHead>
                      Statut
                    </TableHead>

                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      {/* COMMANDE */}

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.order_number}
                          </span>

                          {order.platform_id && (
                            <span className="text-xs text-muted-foreground">
                              Plateforme :{' '}
                              {order.platform_id.slice(0, 12)}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* BOUTIQUE */}

                      <TableCell>
                        {order.shop_id ? (
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />

                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.shop_name ||
                                  'Boutique inconnue'}
                              </span>

                              {order.shop_code && (
                                <span className="text-xs text-muted-foreground">
                                  {order.shop_code}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-destructive">
                            Boutique non rattachée
                          </span>
                        )}
                      </TableCell>

                      {/* DATE */}

                      <TableCell className="whitespace-nowrap">
                        {formatDate(
                          order.ordered_at ??
                            order.created_at
                        )}
                      </TableCell>

                      {/* MONTANT */}

                      <TableCell className="whitespace-nowrap font-medium">
                        {formatCurrency(
                          order.total_amount,
                          order.currency
                        )}
                      </TableCell>

                      {/* DESTINATION */}

                      <TableCell>
                        <div className="flex max-w-[220px] items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                          <span className="truncate text-sm">
                            {order.shipping_address ||
                              order.region ||
                              'Non renseignée'}
                          </span>
                        </div>
                      </TableCell>

                      {/* ÉTAPE */}

                      <TableCell>
                        <span className="text-sm">
                          {formatStage(
                            order.current_stage
                          )}
                        </span>
                      </TableCell>

                      {/* STATUT */}

                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[
                              order.status
                            ]
                          }
                        >
                          {STATUS_LABELS[
                            order.status
                          ]}
                        </Badge>
                      </TableCell>

                      {/* ACTIONS */}

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <ChevronDown className="h-4 w-4" />
                              <span className="sr-only">
                                Actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir le détail
                            </DropdownMenuItem>

                            {order.tracking_number && (
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                Suivi transport
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {order.status === 'pending' && (
                              <DropdownMenuItem>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Examiner la commande
                              </DropdownMenuItem>
                            )}

                            {(order.status === 'confirmed' ||
                              order.status === 'processing') && (
                              <DropdownMenuItem>
                                <Package className="mr-2 h-4 w-4" />
                                Voir la préparation
                              </DropdownMenuItem>
                            )}

                            {order.status === 'shipped' && (
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                Voir la livraison
                              </DropdownMenuItem>
                            )}

                            {order.status === 'cancelled' && (
                              <DropdownMenuItem disabled>
                                <XCircle className="mr-2 h-4 w-4" />
                                Commande annulée
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
};

export default Orders;