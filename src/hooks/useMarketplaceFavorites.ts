import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MarketplaceFavoriteType =
  | 'product'
  | 'boutique';

export interface MarketplaceCustomerFavorite {
  id: string;

  platform_user_id: string;

  favorite_type: MarketplaceFavoriteType;

  platform_target_id: string;

  shop_id: string | null;

  created_at: string;

  platform_synced_at: string;

  source: 'platform';
}

export interface MarketplaceFavoriteFilters {
  type?: MarketplaceFavoriteType | 'all';
  platformUserId?: string;
  shopId?: string;
}

const FAVORITE_FIELDS = `
  id,
  platform_user_id,
  favorite_type,
  platform_target_id,
  shop_id,
  created_at,
  platform_synced_at,
  source
`;

export function useMarketplaceFavorites(
  filters: MarketplaceFavoriteFilters = {},
) {
  const {
    type = 'all',
    platformUserId,
    shopId,
  } = filters;

  return useQuery({
    queryKey: [
      'marketplace',
      'favorites',
      type,
      platformUserId ?? null,
      shopId ?? null,
    ],

    queryFn: async () => {
      let query = (supabase as any)
        .from('marketplace_customer_favorites')
        .select(FAVORITE_FIELDS)
        .order('created_at', {
          ascending: false,
        });

      if (type !== 'all') {
        query = query.eq(
          'favorite_type',
          type,
        );
      }

      if (platformUserId) {
        query = query.eq(
          'platform_user_id',
          platformUserId,
        );
      }

      if (shopId) {
        query = query.eq(
          'shop_id',
          shopId,
        );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        throw error;
      }

      return (data ??
        []) as MarketplaceCustomerFavorite[];
    },
  });
}

/**
 * Nombre total de favoris synchronisés.
 */
export function useMarketplaceFavoritesCount() {
  return useQuery({
    queryKey: [
      'marketplace',
      'favorites',
      'count',
    ],

    queryFn: async () => {
      const {
        count,
        error,
      } = await (supabase as any)
        .from(
          'marketplace_customer_favorites',
        )
        .select('id', {
          count: 'exact',
          head: true,
        });

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

/**
 * Nombre de favoris par type.
 */
export function useMarketplaceFavoriteStats() {
  return useQuery({
    queryKey: [
      'marketplace',
      'favorites',
      'stats',
    ],

    queryFn: async () => {
      const {
        data,
        error,
      } = await (supabase as any)
        .from(
          'marketplace_customer_favorites',
        )
        .select(
          'favorite_type',
        );

      if (error) {
        throw error;
      }

      let products = 0;
      let boutiques = 0;

      for (const favorite of data ?? []) {
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

      return {
        total: products + boutiques,
        products,
        boutiques,
      };
    },
  });
}
