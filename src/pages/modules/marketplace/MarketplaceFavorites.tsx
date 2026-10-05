import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Building2,
  ChevronDown,
  Filter,
  Heart,
  Package,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  MarketplaceFavoriteType,
  useMarketplaceFavorites,
  useMarketplaceFavoriteStats,
} from "@/hooks/useMarketplaceFavorites";

type FavoriteView = {
  id: string;
  type: MarketplaceFavoriteType;
  targetId: string;
  createdAt: string;

  customerId: string;
  customerName: string | null;
  customerEmail: string | null;

  targetName: string | null;
  targetSku: string | null;

  shopId: string | null;
  shopName: string | null;

  platform_boutique_id: string | null;
  target_name: string | null;
  target_sku: string | null;
};

type FilterType =
  | "all"
  | MarketplaceFavoriteType;

type ReferenceRecord = Record<
  string,
  unknown
>;

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortenId(value: string) {
  if (!value) {
    return "—";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function getTypeLabel(
  type: MarketplaceFavoriteType,
) {
  return type === "product"
    ? "Produit"
    : "Boutique";
}

function getTypeClasses(
  type: MarketplaceFavoriteType,
) {
  return type === "product"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-violet-50 text-violet-700 border-violet-200";
}

export default function MarketplaceFavorites() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<FilterType>("all");

  const {
    data: favorites = [],
    isLoading: favoritesLoading,
    error: favoritesError,
  } = useMarketplaceFavorites({
    type:
      typeFilter === "all"
        ? "all"
        : typeFilter,
  });

  const {
    data: stats,
    isLoading: statsLoading,
  } = useMarketplaceFavoriteStats();

  const {
    productsQuery,
    shopsQuery,
    usersQuery,
  } = useMarketplaceFavoriteReferences(
    favorites,
  );

  const isLoading =
    favoritesLoading ||
    productsQuery.isLoading ||
    shopsQuery.isLoading ||
    usersQuery.isLoading;

  const referenceError =
    productsQuery.error ??
    shopsQuery.error ??
    usersQuery.error;

  const productMap = useMemo(() => {
    return new Map(
      (
        (productsQuery.data ??
          []) as ReferenceRecord[]
      ).map((product) => [
        String(product.platform_id),
        product,
      ]),
    );
  }, [productsQuery.data]);

  const shopMap = useMemo(() => {
    return new Map(
      (
        (shopsQuery.data ??
          []) as ReferenceRecord[]
      ).map((shop) => [
        String(shop.platform_id),
        shop,
      ]),
    );
  }, [shopsQuery.data]);

  const customerMap = useMemo(() => {
    return new Map(
      (
        (usersQuery.data ??
          []) as ReferenceRecord[]
      ).map((user) => [
        String(user.platform_id),
        user,
      ]),
    );
  }, [usersQuery.data]);

  const rows = useMemo<FavoriteView[]>(() => {
    return favorites.map((favorite) => {
      const customer =
        customerMap.get(
          favorite.platform_user_id,
        );

      const customerName =
        typeof customer?.contact_name ===
        "string"
          ? customer.contact_name
          : null;

      const customerEmail =
        typeof customer?.contact_email ===
        "string"
          ? customer.contact_email
          : null;

      if (
        favorite.favorite_type ===
        "product"
      ) {
        const product =
          productMap.get(
            favorite.platform_target_id,
          );

        return {
          id: favorite.id,
          type: favorite.favorite_type,
          targetId:
            favorite.platform_target_id,
          createdAt: favorite.created_at,

          customerId:
            favorite.platform_user_id,
          customerName,
          customerEmail,

          targetName:
            typeof product?.name === "string"
              ? product.name
              : null,

          targetSku:
            typeof product?.sku === "string"
              ? product.sku
              : null,

          /*
           * Le snapshot produit ne contient pas de
           * shop_id confirmé dans le schéma actuel.
           * On ne fabrique donc pas de relation produit
           * → boutique.
           */
          shopId: null,
          shopName: null,
        };
      }

      const shop =
        shopMap.get(
          favorite.platform_target_id,
        );

      const shopName =
        typeof shop?.name === "string"
          ? shop.name
          : null;

      const shopId =
        typeof shop?.id === "string"
          ? shop.id
          : favorite.shop_id;

      return {
        id: favorite.id,
        type: favorite.favorite_type,
        targetId:
          favorite.platform_target_id,
        createdAt: favorite.created_at,

        customerId:
          favorite.platform_user_id,
        customerName,
        customerEmail,

        targetName: shopName,
        targetSku: null,

        shopId,
        shopName,
      };
    });
  }, [
    favorites,
    customerMap,
    productMap,
    shopMap,
  ]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        normalize(row.customerName).includes(
          query,
        ) ||
        normalize(row.customerEmail).includes(
          query,
        ) ||
        normalize(row.targetName).includes(
          query,
        ) ||
        normalize(row.targetSku).includes(
          query,
        ) ||
        normalize(row.shopName).includes(
          query,
        ) ||
        normalize(row.customerId).includes(
          query,
        ) ||
        normalize(row.targetId).includes(
          query,
        )
      );
    });
  }, [rows, search]);

  const uniqueCustomers = useMemo(() => {
    return new Set(
      favorites.map(
        (favorite) =>
          favorite.platform_user_id,
      ),
    ).size;
  }, [favorites]);

  const hasFilters =
    Boolean(search) ||
    typeFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
  };

  const FAVORITE_FIELDS = `
  id,
  platform_user_id,
  favorite_type,
  platform_target_id,
  platform_boutique_id,
  target_name,
  target_sku,
  shop_id,
  created_at,
  platform_synced_at,
  source
  `;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Favoris & suivi</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Favoris & suivi
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue opérationnelle des produits et
            boutiques enregistrés en favoris sur
            BIB Platform. La plateforme reste la
            source de vérité ; cette interface est
            une copie de suivi en lecture seule.
          </p>
        </div>
      </div>

      {/* Source of truth */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Heart className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="font-semibold">
              Données issues de BIB Platform
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Les favoris sont exportés depuis les
              tables client de BIB Platform puis
              synchronisés dans l'Intranet. Aucun
              ajout, suppression ou modification de
              favori n'est effectué depuis l'Intranet.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total favoris"
          value={stats?.total ?? 0}
          icon={Heart}
          loading={statsLoading}
        />

        <KpiCard
          label="Produits"
          value={stats?.products ?? 0}
          icon={Package}
          loading={statsLoading}
          tone="product"
        />

        <KpiCard
          label="Boutiques"
          value={stats?.boutiques ?? 0}
          icon={Building2}
          loading={statsLoading}
          tone="shop"
        />

        <KpiCard
          label="Clients concernés"
          value={uniqueCustomers}
          icon={UserRound}
          loading={favoritesLoading}
        />
      </div>

      {/* Main table */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Suivi des favoris
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Recherchez un client, produit, boutique
            ou identifiant Platform.
          </p>
        </div>

        {/* Filters */}
        <div className="border-b bg-muted/20 p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher un client, produit, boutique ou identifiant..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <FilterSelect
              value={typeFilter}
              onChange={(value) =>
                setTypeFilter(
                  value as FilterType,
                )
              }
              options={[
                {
                  value: "all",
                  label: "Tous les favoris",
                },
                {
                  value: "product",
                  label: "Produits",
                },
                {
                  value: "boutique",
                  label: "Boutiques",
                },
              ]}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {favoritesError ||
        referenceError ? (
          <div className="p-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Impossible de charger les favoris
              synchronisés.

              <div className="mt-1 text-xs">
                {favoritesError instanceof
                  Error
                  ? favoritesError.message
                  : referenceError instanceof
                      Error
                    ? referenceError.message
                    : "Erreur inconnue"}
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ),
            )}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <Heart className="h-9 w-9 text-muted-foreground" />

            <h3 className="mt-4 font-medium">
              Aucun favori à afficher
            </h3>

            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Aucun favori correspondant aux
              critères actuels n'est présent dans
              le snapshot synchronisé depuis
              BIB Platform.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Client
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Favori
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Boutique
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Identifiant Platform
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Ajouté le
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredRows.map((row) => (
                  <FavoriteRow
                    key={row.id}
                    row={row}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading &&
          !favoritesError &&
          !referenceError &&
          filteredRows.length > 0 && (
            <div className="border-t bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
              {filteredRows.length} favori
              {filteredRows.length > 1
                ? "s"
                : ""}{" "}
              affiché
              {filteredRows.length > 1
                ? "s"
                : ""}.
            </div>
          )}
      </section>
    </div>
  );
}

function FavoriteRow({
  row,
}: {
  row: FavoriteView;
}) {
  return (
    <tr className="transition hover:bg-muted/20">
      {/* Client */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            {row.customerName ? (
              <div className="font-medium">
                {row.customerName}
              </div>
            ) : (
              <div className="font-mono text-xs">
                {shortenId(row.customerId)}
              </div>
            )}

            {row.customerEmail && (
              <div className="truncate text-xs text-muted-foreground">
                {row.customerEmail}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Favorite */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            {row.type === "product" ? (
              <Package className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {row.targetName ??
                  "Cible non résolue"}
              </span>

              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getTypeClasses(
                  row.type,
                )}`}
              >
                {getTypeLabel(row.type)}
              </span>
            </div>

            {row.targetSku && (
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                SKU : {row.targetSku}
              </div>
            )}

            {!row.targetName && (
              <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                Platform :{" "}
                {shortenId(
                  row.targetId,
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Boutique */}
      <td className="px-5 py-4">
        {row.shopId ? (
          <Link
            to={`/pole/marketplace/stores/${row.shopId}`}
            className="font-medium hover:underline"
          >
            {row.shopName ??
              "Boutique sans nom"}
          </Link>
        ) : (
          <span className="text-muted-foreground">
            Non rattachée
          </span>
        )}
      </td>

      {/* Platform ID */}
      <td className="px-5 py-4">
        <div className="font-mono text-xs text-muted-foreground">
          {shortenId(row.targetId)}
        </div>
      </td>

      {/* Date */}
      <td className="px-5 py-4">
        <span className="text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      </td>
    </tr>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Heart;
  loading: boolean;
  tone?: "default" | "product" | "shop";
}) {
  const iconClass =
    tone === "product"
      ? "text-blue-600"
      : tone === "shop"
        ? "text-violet-600"
        : "text-muted-foreground";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <Icon
          className={`h-4 w-4 ${iconClass}`}
        />
      </div>

      <div className="mt-2 text-2xl font-semibold">
        {loading ? "—" : value}
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <div className="relative">
      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 min-w-[200px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/**
 * Charge les références nécessaires à l'affichage.
 *
 * Source de vérité :
 * - favoris : marketplace_customer_favorites
 * - produits : products.platform_id
 * - boutiques : shops.platform_id
 * - clients : user_accounts.platform_id
 *
 * Aucun JOIN ou mapping artificiel n'est créé ici.
 */
function useMarketplaceFavoriteReferences(
  favorites: Array<{
    platform_user_id: string;
    favorite_type: MarketplaceFavoriteType;
    platform_target_id: string;
  }>,
) {
  const productIds = useMemo(
    () =>
      Array.from(
        new Set(
          favorites
            .filter(
              (favorite) =>
                favorite.favorite_type ===
                "product",
            )
            .map(
              (favorite) =>
                favorite.platform_target_id,
            ),
        ),
      ),
    [favorites],
  );

  const boutiqueIds = useMemo(
    () =>
      Array.from(
        new Set(
          favorites
            .filter(
              (favorite) =>
                favorite.favorite_type ===
                "boutique",
            )
            .map(
              (favorite) =>
                favorite.platform_target_id,
            ),
        ),
      ),
    [favorites],
  );

  const userIds = useMemo(
    () =>
      Array.from(
        new Set(
          favorites.map(
            (favorite) =>
              favorite.platform_user_id,
          ),
        ),
      ),
    [favorites],
  );

  const [
    productsQuery,
    shopsQuery,
    usersQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: [
          "marketplace",
          "favorites",
          "references",
          "products",
          productIds,
        ],

        enabled: productIds.length > 0,

        queryFn: async () => {
          const {
            data,
            error,
          } = await (supabase as any)
            .from("products")
            .select(
              `
                id,
                platform_id,
                name,
                sku,
                category,
                status
              `,
            )
            .in(
              "platform_id",
              productIds,
            );

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      },

      {
        queryKey: [
          "marketplace",
          "favorites",
          "references",
          "shops",
          boutiqueIds,
        ],

        enabled: boutiqueIds.length > 0,

        queryFn: async () => {
          const {
            data,
            error,
          } = await (supabase as any)
            .from("shops")
            .select(
              `
                id,
                platform_id,
                name,
                shop_code
              `,
            )
            .in(
              "platform_id",
              boutiqueIds,
            );

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      },

      {
        queryKey: [
          "marketplace",
          "favorites",
          "references",
          "users",
          userIds,
        ],

        enabled: userIds.length > 0,

        queryFn: async () => {
          const {
            data,
            error,
          } = await (supabase as any)
            .from("user_accounts")
            .select(
              `
                id,
                platform_id,
                contact_name,
                contact_email
              `,
            )
            .in(
              "platform_id",
              userIds,
            );

          if (error) {
            throw error;
          }

          return data ?? [];
        },
      },
    ],
  });

  return {
    productsQuery,
    shopsQuery,
    usersQuery,
  };
}
