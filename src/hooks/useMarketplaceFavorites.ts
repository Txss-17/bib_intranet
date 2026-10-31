import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { readAllPages } from '@/lib/operationsMetrics';

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

export function useMarketplaceFavorites(filters: MarketplaceFavoriteFilters = {}) {
  const { user, profile } = useAuth();
  const { type = 'all', platformUserId, shopId } = filters;
  return useQuery({
    queryKey: ['marketplace', 'favorites', user?.id, profile?.test_account === true, type, platformUserId ?? null, shopId ?? null],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows = await readAllPages<MarketplaceCustomerFavorite>(cursor => {
        let query = (supabase as any).from('marketplace_customer_favorites')
          .select(FAVORITE_FIELDS).order('id').limit(500);
        if (type !== 'all') query = query.eq('favorite_type', type);
        if (platformUserId) query = query.eq('platform_user_id', platformUserId);
        if (shopId) query = query.eq('shop_id', shopId);
        if (cursor) query = query.gt('id', cursor);
        return query;
      });
      return rows.sort((left, right) => right.created_at.localeCompare(left.created_at));
    },
  });
}

export function useMarketplaceFavoritesCount() {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: [
      'marketplace',
      'favorites',
      'count',
      user?.id,
      profile?.test_account === true,
    ],

    enabled: !!user && !!profile,
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
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['marketplace', 'favorites', 'stats', user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => {
      // Count all accessible favorite rows rather than just the default API page.
      const rows = await readAllPages<{ id: string; favorite_type: string }>(cursor => {
        let query = (supabase as any).from('marketplace_customer_favorites')
          .select('id, favorite_type').order('id').limit(500);
        if (cursor) query = query.gt('id', cursor);
        return query;
      });
      const products = rows.filter(row => row.favorite_type === 'product').length;
      const boutiques = rows.filter(row => row.favorite_type === 'boutique').length;
      return { total: products + boutiques, products, boutiques };
    },
  });
}
