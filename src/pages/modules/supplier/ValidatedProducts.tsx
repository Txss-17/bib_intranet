import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Package,
  Search,
  Store,
  Tag,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type ProductStatus =
  | 'validated'
  | 'pending'
  | 'rejected'
  | 'inactive';

const statusConfig: Record<
  ProductStatus,
  {
    label: string;
    className: string;
  }
> = {
  validated: {
    label: 'Validé',
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  pending: {
    label: 'En attente',
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  rejected: {
    label: 'Refusé',
    className:
      'bg-red-500/10 text-red-700 dark:text-red-400',
  },
  inactive: {
    label: 'Inactif',
    className:
      'bg-muted text-muted-foreground',
  },
};

function normalizeStatus(value: unknown): ProductStatus {
  const status = String(value ?? '').toLowerCase();

  if (
    status === 'validated' ||
    status === 'pending' ||
    status === 'rejected' ||
    status === 'inactive'
  ) {
    return status;
  }

  if (
    status === 'approved' ||
    status === 'active' ||
    status === 'validated_product'
  ) {
    return 'validated';
  }

  return 'pending';
}

function formatPrice(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
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

export default function ValidatedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | ProductStatus>('all');

  const normalizedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      normalizedStatus: normalizeStatus(
        product.status ??
          product.validation_status ??
          product.product_status,
      ),
    }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedProducts.filter((product) => {
      const matchesSearch =
        !query ||
        String(product.name ?? '')
          .toLowerCase()
          .includes(query) ||
        String(product.sku ?? '')
          .toLowerCase()
          .includes(query) ||
        String(product.slug ?? '')
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        product.normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedProducts, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: normalizedProducts.length,
      validated: normalizedProducts.filter(
        (product) =>
          product.normalizedStatus === 'validated',
      ).length,
      pending: normalizedProducts.filter(
        (product) =>
          product.normalizedStatus === 'pending',
      ).length,
      rejected: normalizedProducts.filter(
        (product) =>
          product.normalizedStatus === 'rejected',
      ).length,
    }),
    [normalizedProducts],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Package className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-semibold">
              Produits
            </h1>

            <p className="text-sm text-muted-foreground">
              Catalogue des produits contrôlés et validés
              par BIB
            </p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Produits
            </span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.total}
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Validés
            </span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.validated}
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              En attente
            </span>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.pending}
          </p>
        </div>

        <div className="enterprise-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Refusés
            </span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-2xl font-semibold">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un produit, SKU ou slug..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | ProductStatus,
              )
            }
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">
              Tous les statuts
            </option>
            <option value="validated">Validés</option>
            <option value="pending">En attente</option>
            <option value="rejected">Refusés</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
      </div>

      {/* État vide */}
      {filteredProducts.length === 0 && (
        <div className="enterprise-card p-12 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />

          <p className="font-medium">
            Aucun produit à afficher
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Aucun produit ne correspond aux critères
            sélectionnés.
          </p>
        </div>
      )}

      {/* Tableau */}
      {filteredProducts.length > 0 && (
        <div className="enterprise-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Produit
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Boutique
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prix
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mise à jour
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const status =
                    statusConfig[
                      product.normalizedStatus
                    ];

                  return (
                    <tr
                      key={
                        product.id ??
                        product.sku ??
                        product.slug
                      }
                      className="border-b last:border-b-0 hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                            <Package className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {product.name ||
                                'Produit sans nom'}
                            </p>

                            {product.slug && (
                              <p className="text-xs text-muted-foreground">
                                {product.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {product.sku || '—'}
                        </code>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />

                          {product.shop_name ??
                            product.shop?.name ??
                            '—'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {formatPrice(
                          product.price ??
                            product.sale_price,
                        )}
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

                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {formatDate(
                          product.updated_at ??
                            product.created_at,
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
              {filteredProducts.length} produit
              {filteredProducts.length > 1 ? 's' : ''}{' '}
              affiché
              {filteredProducts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}