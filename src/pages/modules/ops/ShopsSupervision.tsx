import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Package,
  Search,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';

import { useShops } from '@/hooks/useShops';
import { cn } from '@/lib/utils';

type ShopStatus = 'active' | 'inactive' | 'pending' | 'suspended';

const statusConfig: Record<
  ShopStatus,
  {
    label: string;
    className: string;
  }
> = {
  active: {
    label: 'Active',
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  inactive: {
    label: 'Inactive',
    className:
      'bg-muted text-muted-foreground',
  },
  pending: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  suspended: {
    label: 'Suspendue',
    className:
      'bg-red-500/10 text-red-700 dark:text-red-400',
  },
};

function normalizeStatus(value: unknown): ShopStatus {
  const status = String(value ?? '').toLowerCase();

  if (
    status === 'active' ||
    status === 'inactive' ||
    status === 'pending' ||
    status === 'suspended'
  ) {
    return status;
  }

  return 'inactive';
}

function formatDate(value: unknown) {
  if (!value) return '—';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export default function ShopsSupervision() {
  const {
    shops,
    isLoading,
    error,
  } = useShops();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | ShopStatus>('all');

  const normalizedShops = useMemo(() => {
    return (shops ?? []).map((shop: any) => ({
      ...shop,
      normalizedStatus: normalizeStatus(
        shop.status ?? shop.shop_status,
      ),
    }));
  }, [shops]);

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedShops.filter((shop: any) => {
      const matchesSearch =
        !query ||
        String(shop.name ?? '')
          .toLowerCase()
          .includes(query) ||
        String(shop.shop_code ?? '')
          .toLowerCase()
          .includes(query) ||
        String(shop.slug ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        shop.normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedShops, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: normalizedShops.length,
      active: normalizedShops.filter(
        (shop: any) =>
          shop.normalizedStatus === 'active',
      ).length,
      pending: normalizedShops.filter(
        (shop: any) =>
          shop.normalizedStatus === 'pending',
      ).length,
      suspended: normalizedShops.filter(
        (shop: any) =>
          shop.normalizedStatus === 'suspended',
      ).length,
    };
  }, [normalizedShops]);

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
                Boutiques
              </h1>

              <p className="text-sm text-muted-foreground">
                Supervision des boutiques présentes sur la
                marketplace BIB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              En attente
            </span>

            <Users className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.pending}
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Suspendues
            </span>

            <Package className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.suspended}
          </p>
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
              placeholder="Rechercher une boutique, un code ou un slug..."
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
              <option value="active">Actives</option>
              <option value="pending">En attente</option>
              <option value="inactive">Inactives</option>
              <option value="suspended">
                Suspendues
              </option>
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
            Vérifiez la connexion aux données marketplace.
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
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Boutique
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Code
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Commandes
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
                  {filteredShops.map((shop: any) => {
                    const status =
                      statusConfig[
                        shop.normalizedStatus
                      ];

                    const orderCount =
                      shop.order_count ??
                      shop.orders_count ??
                      0;

                    return (
                      <tr
                        key={
                          shop.id ??
                          shop.shop_code ??
                          shop.slug
                        }
                        className="border-b last:border-b-0 transition hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                              <ShoppingBag className="h-4 w-4" />
                            </div>

                            <div>
                              <p className="font-medium text-foreground">
                                {shop.name ||
                                  'Boutique sans nom'}
                              </p>

                              {shop.slug && (
                                <p className="text-xs text-muted-foreground">
                                  {shop.slug}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <code className="rounded bg-muted px-2 py-1 text-xs">
                            {shop.shop_code || '—'}
                          </code>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              status.className,
                            )}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {orderCount}
                        </td>

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {formatDate(
                            shop.created_at,
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {shop.url ? (
                            <a
                              href={shop.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition hover:bg-muted"
                              title="Ouvrir la boutique"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
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
                {filteredShops.length > 1 ? 's' : ''}{' '}
                affichée
                {filteredShops.length > 1 ? 's' : ''}
                {search || statusFilter !== 'all'
                  ? ' après filtrage'
                  : ''}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}