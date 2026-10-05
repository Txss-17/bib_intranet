import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ExternalLink,
  History,
  Package,
  Search,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';

import {
  SHOP_STATUS_LABELS,
  type Shop,
  type ShopStatus,
  useShopOrderSummaries,
  useShops,
} from '@/hooks/useShops';

import { cn } from '@/lib/utils';

const STATUS_STYLES: Partial<Record<ShopStatus, string>> = {
  application:
    'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  review:
    'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  test:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  active:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  suspended:
    'bg-red-500/10 text-red-700 dark:text-red-400',
  closed:
    'bg-muted text-muted-foreground',
};

const STATUS_ORDER: ShopStatus[] = [
  'application',
  'review',
  'test',
  'active',
  'suspended',
  'closed',
];

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusCount(
  shops: Shop[],
  status: ShopStatus,
) {
  return shops.filter((shop) => shop.status === status).length;
}

export default function ShopsSupervision() {
  const {
    data: shops = [],
    isLoading,
    error,
  } = useShops();

  const { data: orderSummaries } =
    useShopOrderSummaries();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | ShopStatus>('all');

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesSearch =
        !query ||
        shop.name.toLowerCase().includes(query) ||
        shop.shop_code.toLowerCase().includes(query) ||
        (shop.slug ?? '').toLowerCase().includes(query) ||
        (shop.merchant_name ?? '')
          .toLowerCase()
          .includes(query) ||
        (shop.merchant_email ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        shop.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shops, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: shops.length,
      active: getStatusCount(shops, 'active'),
      test: getStatusCount(shops, 'test'),
      suspended: getStatusCount(shops, 'suspended'),
      applications:
        getStatusCount(shops, 'application') +
        getStatusCount(shops, 'review'),
    }),
    [shops],
  );

  const totalRevenue = useMemo(() => {
    return Array.from(
      orderSummaries?.values() ?? [],
    ).reduce(
      (total, summary) => total + summary.revenue,
      0,
    );
  }, [orderSummaries]);

  const totalOrders = useMemo(() => {
    return Array.from(
      orderSummaries?.values() ?? [],
    ).reduce(
      (total, summary) => total + summary.orders,
      0,
    );
  }, [orderSummaries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Store className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Boutiques & Marchands
              </h1>

              <p className="text-sm text-muted-foreground">
                Supervision du cycle de vie des boutiques
                marketplace BIB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Boutiques
            </span>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.total}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Toutes étapes confondues
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Actives
            </span>
            <Store className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.active}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Autorisées à recevoir des commandes
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              En test
            </span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.test}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Périodes de test en cours
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              À examiner
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.applications}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Candidatures + revues
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Commandes
            </span>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {totalOrders}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            CA cumulé : {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Lifecycle overview */}
      <div className="enterprise-card p-5">
        <div className="mb-4">
          <h2 className="font-semibold">
            Cycle de vie
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Répartition actuelle des boutiques par étape
            opérationnelle.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STATUS_ORDER.map((status) => {
            const count = getStatusCount(
              shops,
              status,
            );

            const selected =
              statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setStatusFilter(
                    selected ? 'all' : status,
                  )
                }
                className={cn(
                  'rounded-lg border p-3 text-left transition hover:bg-muted/40',
                  selected &&
                    'border-foreground/30 bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-[11px] font-medium',
                      STATUS_STYLES[status],
                    )}
                  >
                    {SHOP_STATUS_LABELS[status]}
                  </span>

                  <span className="text-lg font-semibold">
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher une boutique, un marchand, un code ou un slug..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'all'
                    | ShopStatus,
                )
              }
              className="h-10 appearance-none rounded-md border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">
                Tous les statuts
              </option>

              {STATUS_ORDER.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {SHOP_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="enterprise-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Chargement des boutiques...
          </p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="enterprise-card border-destructive/30 p-8 text-center">
          <p className="font-medium text-destructive">
            Impossible de charger les boutiques.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Vérifiez la connexion aux données
            marketplace.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !error &&
        filteredShops.length === 0 && (
          <div className="enterprise-card p-12 text-center">
            <Store className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />

            <p className="font-medium">
              Aucune boutique trouvée
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Aucune boutique ne correspond aux critères
              sélectionnés.
            </p>
          </div>
        )}

      {/* Table */}
      {!isLoading &&
        !error &&
        filteredShops.length > 0 && (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Boutique
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Marchand
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Commandes
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      CA
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Création
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredShops.map((shop) => {
                    const summary =
                      orderSummaries?.get(
                        shop.id,
                      );

                    const orderCount =
                      summary?.orders ?? 0;

                    const revenue =
                      summary?.revenue ?? 0;

                    return (
                      <tr
                        key={shop.id}
                        className="border-b last:border-b-0 transition hover:bg-muted/20"
                      >
                        {/* Boutique */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                              <ShoppingBag className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="font-medium text-foreground">
                                {shop.name}
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <code className="text-[11px] text-muted-foreground">
                                  {shop.shop_code}
                                </code>

                                {shop.slug && (
                                  <span className="text-[11px] text-muted-foreground">
                                    /{shop.slug}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Marchand */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium">
                              {shop.merchant_name ||
                                '—'}
                            </p>

                            {shop.merchant_email && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {shop.merchant_email}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Statut */}
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              STATUS_STYLES[
                                shop.status
                              ],
                            )}
                          >
                            {
                              SHOP_STATUS_LABELS[
                                shop.status
                              ]
                            }
                          </span>

                          {shop.status === 'test' &&
                            shop.test_ends_at && (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Fin :{' '}
                                {formatDate(
                                  shop.test_ends_at,
                                )}
                              </p>
                            )}
                        </td>

                        {/* Commandes */}
                        <td className="px-5 py-4 text-sm">
                          {orderCount}
                        </td>

                        {/* CA */}
                        <td className="px-5 py-4 text-sm">
                          {formatCurrency(revenue)}
                        </td>

                        {/* Création */}
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {formatDate(
                            shop.created_at,
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {shop.slug && (
                              <a
                                href={`/boutiques/${shop.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-muted"
                                title="Ouvrir la boutique"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}

                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-muted"
                              title="Voir le cycle de vie"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t bg-muted/20 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {filteredShops.length} boutique
                {filteredShops.length > 1
                  ? 's'
                  : ''}{' '}
                affichée
                {filteredShops.length > 1
                  ? 's'
                  : ''}
                {search ||
                statusFilter !== 'all'
                  ? ' après filtrage'
                  : ''}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
