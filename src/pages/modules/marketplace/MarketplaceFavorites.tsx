import {
  useMemo,
  useState,
} from 'react';

import {
  useQueries,
} from '@tanstack/react-query';

import {
  Search,
  Heart,
  Store,
  Package,
  Users,
  CalendarDays,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';

import {
  useMarketplaceFavorites,
  type MarketplaceCustomerFavorite,
  type MarketplaceFavoriteType,
} from '@/hooks/useMarketplaceFavorites';


type UserAccount = {
  id: string;
  platform_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
};

type Shop = {
  id: string;
  platform_id: string | null;
  name: string | null;
  slug: string | null;
};

type FavoriteRow = MarketplaceCustomerFavorite & {
  customer?: UserAccount | null;
  shop?: Shop | null;
};


function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}


function shortenId(
  value: string | null | undefined,
) {
  if (!value) {
    return '—';
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}


function getCustomerLabel(
  customer: UserAccount | null | undefined,
  platformUserId: string,
) {
  if (!customer) {
    return `Client Platform ${shortenId(platformUserId)}`;
  }

  if (customer.contact_name) {
    return customer.contact_name;
  }

  if (customer.contact_email) {
    return customer.contact_email;
  }

  return `Client Platform ${shortenId(platformUserId)}`;
}


function getFavoriteTargetLabel(
  favorite: MarketplaceCustomerFavorite,
) {
  if (favorite.target_name) {
    return favorite.target_name;
  }

  if (favorite.favorite_type === 'product') {
    return `Produit ${shortenId(
      favorite.platform_target_id,
    )}`;
  }

  return `Boutique ${shortenId(
    favorite.platform_target_id,
  )}`;
}


function getFavoriteTargetSecondaryLabel(
  favorite: MarketplaceCustomerFavorite,
) {
  if (
    favorite.favorite_type === 'product' &&
    favorite.target_sku
  ) {
    return `SKU : ${favorite.target_sku}`;
  }

  if (
    favorite.favorite_type === 'product'
  ) {
    return `ID Platform : ${shortenId(
      favorite.platform_target_id,
    )}`;
  }

  return `ID Platform : ${shortenId(
    favorite.platform_target_id,
  )}`;
}


function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Heart;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}


export default function MarketplaceFavorites() {
  const [
    search,
    setSearch,
  ] = useState('');

  const [
    type,
    setType,
  ] = useState<
    MarketplaceFavoriteType | 'all'
  >('all');

  const {
    data: favorites = [],
    isLoading: favoritesLoading,
    isFetching: favoritesFetching,
    error: favoritesError,
    refetch: refetchFavorites,
  } = useMarketplaceFavorites({
    type,
  });


  /*
   * Les favoris utilisent les identifiants Platform.
   *
   * On résout uniquement :
   * - les clients via user_accounts.platform_id
   * - les boutiques via shops.platform_id
   *
   * Aucun lookup de la table Intranet products n'est effectué.
   *
   * Les informations produit viennent directement du snapshot
   * enrichi marketplace_customer_favorites :
   * - target_name
   * - target_sku
   * - platform_target_id
   * - platform_boutique_id
   */
  const customerPlatformIds = useMemo(
    () =>
      Array.from(
        new Set(
          favorites
            .map(
              (favorite) =>
                favorite.platform_user_id,
            )
            .filter(Boolean),
        ),
      ),
    [favorites],
  );

  const boutiquePlatformIds = useMemo(
    () =>
      Array.from(
        new Set(
          favorites
            .map(
              (favorite) =>
                favorite.platform_boutique_id,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        ),
      ),
    [favorites],
  );


  const lookupQueries = useQueries({
    queries: [
      {
        queryKey: [
          'marketplace',
          'favorites',
          'customers',
          customerPlatformIds,
        ],

        enabled:
          customerPlatformIds.length > 0,

        queryFn: async () => {
          const {
            data,
            error,
          } = await (supabase as any)
            .from('user_accounts')
            .select(
              `
                id,
                platform_id,
                contact_name,
                contact_email
              `,
            )
            .in(
              'platform_id',
              customerPlatformIds,
            );

          if (error) {
            throw error;
          }

          return (
            data ?? []
          ) as UserAccount[];
        },
      },

      {
        queryKey: [
          'marketplace',
          'favorites',
          'shops',
          boutiquePlatformIds,
        ],

        enabled:
          boutiquePlatformIds.length > 0,

        queryFn: async () => {
          const {
            data,
            error,
          } = await (supabase as any)
            .from('shops')
            .select(
              `
                id,
                platform_id,
                name,
                slug
              `,
            )
            .in(
              'platform_id',
              boutiquePlatformIds,
            );

          if (error) {
            throw error;
          }

          return (
            data ?? []
          ) as Shop[];
        },
      },
    ],
  });


  const customersQuery =
    lookupQueries[0];

  const shopsQuery =
    lookupQueries[1];


  const customers =
    (customersQuery?.data ??
      []) as UserAccount[];

  const shops =
    (shopsQuery?.data ??
      []) as Shop[];


  const customerMap =
    useMemo(() => {
      const map = new Map<
        string,
        UserAccount
      >();

      for (const customer of customers) {
        if (
          customer.platform_id
        ) {
          map.set(
            customer.platform_id,
            customer,
          );
        }
      }

      return map;
    }, [customers]);


  const shopMap =
    useMemo(() => {
      const map = new Map<
        string,
        Shop
      >();

      for (const shop of shops) {
        if (shop.platform_id) {
          map.set(
            shop.platform_id,
            shop,
          );
        }
      }

      return map;
    }, [shops]);


  const enrichedFavorites =
    useMemo<FavoriteRow[]>(() => {
      return favorites.map(
        (favorite) => ({
          ...favorite,

          customer:
            customerMap.get(
              favorite.platform_user_id,
            ) ?? null,

          shop:
            favorite.platform_boutique_id
              ? (
                  shopMap.get(
                    favorite.platform_boutique_id,
                  ) ?? null
                )
              : favorite.shop_id
                ? (
                    shops.find(
                      (shop) =>
                        shop.id ===
                        favorite.shop_id,
                    ) ?? null
                  )
                : null,
        }),
      );
    }, [
      favorites,
      customerMap,
      shopMap,
      shops,
    ]);


  const filteredFavorites =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return enrichedFavorites;
      }

      return enrichedFavorites.filter(
        (favorite) => {
          const customer =
            getCustomerLabel(
              favorite.customer,
              favorite.platform_user_id,
            );

          const target =
            getFavoriteTargetLabel(
              favorite,
            );

          const secondary =
            getFavoriteTargetSecondaryLabel(
              favorite,
            );

          const boutique =
            favorite.shop?.name ??
            '';

          const searchable = [
            customer,
            favorite.platform_user_id,
            target,
            secondary,
            boutique,
            favorite.platform_target_id,
            favorite.platform_boutique_id ??
              '',
          ]
            .join(' ')
            .toLowerCase();

          return searchable.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      enrichedFavorites,
      search,
    ]);


  const stats = useMemo(() => {
    let products = 0;
    let boutiques = 0;

    for (const favorite of favorites) {
      if (
        favorite.favorite_type ===
        'product'
      ) {
        products += 1;
      }

      if (
        favorite.favorite_type ===
        'boutique'
      ) {
        boutiques += 1;
      }
    }

    const uniqueCustomers =
      new Set(
        favorites.map(
          (favorite) =>
            favorite.platform_user_id,
        ),
      ).size;

    return {
      total: favorites.length,
      products,
      boutiques,
      uniqueCustomers,
    };
  }, [favorites]);


  const isLoading =
    favoritesLoading ||
    customersQuery?.isLoading ||
    shopsQuery?.isLoading;

  const isRefreshing =
    favoritesFetching ||
    customersQuery?.isFetching ||
    shopsQuery?.isFetching;


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-slate-700" />

            <h1 className="text-2xl font-semibold text-slate-900">
              Favoris clients
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Vue opérationnelle en lecture seule
            des favoris enregistrés sur BIB Platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void refetchFavorites()
          }
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isRefreshing
                ? 'animate-spin'
                : ''
            }`}
          />

          Actualiser
        </button>
      </div>


      {/* Source / architecture notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

          <div>
            <p className="text-sm font-medium text-slate-700">
              Source de vérité : BIB Platform
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Cette page affiche un snapshot synchronisé
              depuis BIB Platform. Les collaborateurs
              de l'Intranet ne peuvent pas modifier les
              favoris clients depuis cette interface.
            </p>
          </div>
        </div>
      </div>


      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Favoris"
          value={stats.total}
          icon={Heart}
        />

        <StatCard
          label="Produits"
          value={stats.products}
          icon={Package}
        />

        <StatCard
          label="Boutiques"
          value={stats.boutiques}
          icon={Store}
        />

        <StatCard
          label="Clients uniques"
          value={stats.uniqueCustomers}
          icon={Users}
        />
      </div>


      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Rechercher un client, produit, boutique ou identifiant..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value as
                  | MarketplaceFavoriteType
                  | 'all',
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          >
            <option value="all">
              Tous les favoris
            </option>

            <option value="product">
              Produits
            </option>

            <option value="boutique">
              Boutiques
            </option>
          </select>
        </div>
      </div>


      {/* Error */}
      {favoritesError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Impossible de charger les favoris.
          </p>

          <p className="mt-1 text-xs text-red-700">
            {favoritesError instanceof Error
              ? favoritesError.message
              : 'Une erreur inconnue est survenue.'}
          </p>
        </div>
      ) : null}


      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Favori
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Boutique
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Identifiant Platform
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Chargement des favoris...
                  </td>
                </tr>
              ) : filteredFavorites.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center"
                  >
                    <Heart className="mx-auto h-8 w-8 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Aucun favori trouvé
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Aucun résultat ne correspond
                      aux critères actuels.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFavorites.map(
                  (favorite) => {
                    const customerLabel =
                      getCustomerLabel(
                        favorite.customer,
                        favorite.platform_user_id,
                      );

                    const targetLabel =
                      getFavoriteTargetLabel(
                        favorite,
                      );

                    const targetSecondary =
                      getFavoriteTargetSecondaryLabel(
                        favorite,
                      );

                    const isProduct =
                      favorite.favorite_type ===
                      'product';

                    const boutiqueName =
                      favorite.shop?.name ??
                      (
                        isProduct
                          ? 'Boutique non résolue'
                          : targetLabel
                      );

                    return (
                      <tr
                        key={favorite.id}
                        className="transition hover:bg-slate-50"
                      >
                        {/* Client */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {customerLabel}
                            </p>

                            {favorite.customer?.contact_email ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {favorite.customer.contact_email}
                              </p>
                            ) : null}

                            <p className="mt-1 font-mono text-[11px] text-slate-400">
                              {shortenId(
                                favorite.platform_user_id,
                              )}
                            </p>
                          </div>
                        </td>


                        {/* Favorite target */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                              {isProduct ? (
                                <Package className="h-4 w-4 text-slate-600" />
                              ) : (
                                <Store className="h-4 w-4 text-slate-600" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900">
                                  {targetLabel}
                                </p>

                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                                  {isProduct
                                    ? 'Produit'
                                    : 'Boutique'}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {targetSecondary}
                              </p>
                            </div>
                          </div>
                        </td>


                        {/* Boutique */}
                        <td className="px-4 py-4 align-top">
                          <div>
                            <p
                              className={
                                favorite.shop
                                  ? 'text-sm font-medium text-slate-900'
                                  : 'text-sm text-slate-500'
                              }
                            >
                              {boutiqueName}
                            </p>

                            {favorite.platform_boutique_id ? (
                              <p className="mt-1 font-mono text-[11px] text-slate-400">
                                {shortenId(
                                  favorite.platform_boutique_id,
                                )}
                              </p>
                            ) : null}

                            {!favorite.shop &&
                            isProduct ? (
                              <p className="mt-1 text-[11px] text-amber-600">
                                Référence boutique Platform
                                non résolue dans l'Intranet
                              </p>
                            ) : null}
                          </div>
                        </td>


                        {/* Platform target ID */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                              {shortenId(
                                favorite.platform_target_id,
                              )}
                            </code>
                          </div>

                          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                            {favorite.favorite_type}
                          </p>
                        </td>


                        {/* Date */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                            <div>
                              <p className="text-sm text-slate-700">
                                {formatDate(
                                  favorite.created_at,
                                )}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Synchronisé le{' '}
                                {formatDate(
                                  favorite.platform_synced_at,
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )
              )}
            </tbody>
          </table>
        </div>


        {/* Footer */}
        {!isLoading &&
        filteredFavorites.length > 0 ? (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {filteredFavorites.length}{' '}
              favori
              {filteredFavorites.length > 1
                ? 's'
                : ''}{' '}
              affiché
              {filteredFavorites.length > 1
                ? 's'
                : ''}
              {search.trim()
                ? ` sur ${favorites.length}`
                : ''}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
