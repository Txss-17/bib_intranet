import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MarketplaceFavoriteType =
  | 'product'
  | 'boutique';

export interface MarketplaceCustomerFavorite {
  id: string;

  /**
   * Identifiant du client dans BIB Platform.
   * La source de vérité reste BIB Platform.
   */
  platform_user_id: string;

  /**
   * Type de favori enregistré sur BIB Platform.
   */
  favorite_type: MarketplaceFavoriteType;

  /**
   * Identifiant de la cible dans BIB Platform :
   * - product_id pour un produit
   * - boutique_id pour une boutique
   */
  platform_target_id: string;

  /**
   * Identifiant de la boutique BIB Platform associée
   * à la cible.
   *
   * Pour un favori boutique :
   * platform_boutique_id = platform_target_id
   *
   * Pour un favori produit :
   * platform_boutique_id = products.boutique_id
   */
  platform_boutique_id: string | null;

  /**
   * Nom d'affichage exporté depuis BIB Platform.
   *
   * Produit :
   * supplier_products.name
   *
   * Boutique :
   * boutiques.name
   */
  target_name: string | null;

  /**
   * SKU produit lorsqu'il existe sur BIB Platform.
   *
   * Actuellement null pour les produits Platform
   * qui ne disposent pas d'un SKU public autonome.
   */
  target_sku: string | null;

  /**
   * Identifiant de la boutique correspondante dans
   * BIB Intranet, lorsqu'elle a pu être résolue.
   */
  shop_id: string | null;

  /**
   * Date originale du favori sur BIB Platform.
   */
  created_at: string;

  /**
   * Date à laquelle le snapshot a été synchronisé
   * dans BIB Intranet.
   */
  platform_synced_at: string;

  /**
   * Source du snapshot.
   */
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
  platform_boutique_id,
  target_name,
  target_sku,
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

      return (
        data ?? []
      ) as MarketplaceCustomerFavorite[];
    },
  });
}

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
        .select('favorite_type');

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
