```tsx
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ShopStatus =
  | 'draft'
  | 'application'
  | 'review'
  | 'test'
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'closed';

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  draft: 'Brouillon',
  application: 'Candidature',
  review: 'En revue',
  test: 'Période de test',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspendue',
  closed: 'Clôturée',
};

export const SHOP_TRANSITIONS: Record<
  ShopStatus,
  ShopStatus[]
> = {
  draft: ['application', 'closed'],
  application: ['review', 'closed'],
  review: ['test', 'active', 'closed'],
  test: ['active', 'inactive', 'suspended', 'closed'],
  active: ['inactive', 'suspended', 'closed'],
  inactive: ['active', 'suspended', 'closed'],
  suspended: ['active', 'inactive', 'closed'],
  closed: [],
};

export interface Shop {
  id: string;
  platform_id?: string | null;
  platform_synced_at?: string | null;

  shop_code: string;
  name: string;
  slug: string | null;

  country: string | null;
  category: string | null;

  status: ShopStatus;

  subscription_plan: string | null;
  commission_rate: number | null;

  test_started_at: string | null;
  test_ends_at: string | null;
  test_extensions: number;

  activated_at: string | null;
  inactive_at: string | null;
  suspended_at: string | null;
  closed_at: string | null;

  suspension_reason: string | null;
  notes: string | null;

  app_origin: string;
  created_at: string;
  updated_at: string;
}

export interface ShopStatusEvent {
  id: string;
  shop_id: string;
  from_status: string | null;
  to_status: string;
  action: string | null;
  reason: string | null;
  performed_by: string | null;
  performed_at: string;
}

export interface ShopOrderSummary {
  shop_id: string;
  orders: number;
  revenue: number;
  inProgress: number;
}

export const testDaysLeft = (
  shop: Shop,
): number | null => {
  if (
    shop.status !== 'test' ||
    !shop.test_ends_at
  ) {
    return null;
  }

  const diff =
    new Date(shop.test_ends_at).getTime() -
    Date.now();

  return Math.ceil(diff / 86_400_000);
};

// ============================================================
// QUERIES
// ============================================================

export const useShops = () =>
  useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const db = supabase as any;

      const { data, error } = await db
        .from('shops')
        .select(`
          id,
          platform_id,
          platform_synced_at,
          shop_code,
          name,
          slug,
          country,
          category,
          status,
          subscription_plan,
          commission_rate,
          test_started_at,
          test_ends_at,
          test_extensions,
          activated_at,
          inactive_at,
          suspended_at,
          closed_at,
          suspension_reason,
          notes,
          app_origin,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) throw error;

      return (data ?? []) as Shop[];
    },
  });

export const useShop = (
  shopId?: string,
) =>
  useQuery({
    queryKey: ['shops', 'detail', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const db = supabase as any;

      const { data, error } = await db
        .from('shops')
        .select(`
          id,
          platform_id,
          platform_synced_at,
          shop_code,
          name,
          slug,
          country,
          category,
          status,
          subscription_plan,
          commission_rate,
          test_started_at,
          test_ends_at,
          test_extensions,
          activated_at,
          inactive_at,
          suspended_at,
          closed_at,
          suspension_reason,
          notes,
          app_origin,
          created_at,
          updated_at
        `)
        .eq('id', shopId!)
        .single();

      if (error) throw error;

      return data as Shop;
    },
  });

export const useShopEvents = (
  shopId?: string,
) =>
  useQuery({
    queryKey: [
      'shops',
      'events',
      shopId,
    ],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } =
        await supabase
          .from('shop_status_events')
          .select('*')
          .eq('shop_id', shopId!)
          .order('performed_at', {
            ascending: false,
          });

      if (error) throw error;

      return (data ?? []) as ShopStatusEvent[];
    },
  });

export const useShopOrderSummaries = () =>
  useQuery({
    queryKey: [
      'shops',
      'order-summaries',
    ],
    queryFn: async () => {
      const { data, error } =
        await supabase
          .from('orders')
          .select(
            'shop_id, total_amount, status',
          )
          .not('shop_id', 'is', null);

      if (error) throw error;

      const map = new Map<
        string,
        ShopOrderSummary
      >();

      for (const row of data ?? []) {
        const key = row.shop_id as string;

        const entry =
          map.get(key) ?? {
            shop_id: key,
            orders: 0,
            revenue: 0,
            inProgress: 0,
          };

        entry.orders += 1;
        entry.revenue += Number(
          row.total_amount ?? 0,
        );

        if (
          ![
            'delivered',
            'cancelled',
            'refunded',
          ].includes(row.status ?? '')
        ) {
          entry.inProgress += 1;
        }

        map.set(key, entry);
      }

      return map;
    },
  });

export const useShopOrders = (
  shopId?: string,
) =>
  useQuery({
    queryKey: [
      'shops',
      'orders',
      shopId,
    ],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } =
        await supabase
          .from('orders')
          .select(
            'id, order_number, status, current_stage, total_amount, currency, created_at',
          )
          .eq('shop_id', shopId!)
          .order('created_at', {
            ascending: false,
          })
          .limit(50);

      if (error) throw error;

      return data ?? [];
    },
  });

// ============================================================
// MUTATIONS
// ============================================================

export const useShopActions = () => {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: ['shops'],
    });
  };

  const changeStatus = useMutation({
    mutationFn: async (params: {
      shop: Shop;
      to: ShopStatus;
      reason?: string;
      testDurationDays?: number;
    }) => {
      const {
        shop,
        to,
        reason,
        testDurationDays,
      } = params;

      if (shop.status === to) {
        throw new Error(
          `La boutique est déjà au statut « ${SHOP_STATUS_LABELS[to]} ».`,
        );
      }

      const allowed =
        SHOP_TRANSITIONS[shop.status] ?? [];

      if (!allowed.includes(to)) {
        throw new Error(
          `Transition interdite : ${SHOP_STATUS_LABELS[shop.status]} → ${SHOP_STATUS_LABELS[to]}.`,
        );
      }

      if (
        [
          'inactive',
          'suspended',
          'closed',
        ].includes(to) &&
        !reason?.trim()
      ) {
        throw new Error(
          `Une justification est obligatoire pour ${SHOP_STATUS_LABELS[to].toLowerCase()}.`,
        );
      }

      if (
        to === 'test' &&
        testDurationDays !== undefined &&
        (
          !Number.isInteger(
            testDurationDays,
          ) ||
          testDurationDays <= 0 ||
          testDurationDays > 365
        )
      ) {
        throw new Error(
          'La durée de test doit être comprise entre 1 et 365 jours.',
        );
      }

      const now =
        new Date().toISOString();

      const patch: Record<
        string,
        unknown
      > = {
        status: to,
      };

      if (to === 'test') {
        const days =
          testDurationDays ?? 30;

        patch.test_started_at = now;
        patch.test_ends_at =
          new Date(
            Date.now() +
              days *
                86_400_000,
          ).toISOString();
      }

      if (to === 'active') {
        patch.activated_at = now;
        patch.inactive_at = null;
        patch.suspended_at = null;
        patch.suspension_reason = null;
      }

      if (to === 'inactive') {
        patch.inactive_at = now;
        patch.suspension_reason =
          reason!.trim();
      }

      if (to === 'suspended') {
        patch.suspended_at = now;
        patch.suspension_reason =
          reason!.trim();
      }

      if (to === 'closed') {
        patch.closed_at = now;
        patch.suspension_reason =
          reason!.trim();
      }

      const db = supabase as any;

      const { error } = await db
        .from('shops')
        .update(patch)
        .eq('id', shop.id);

      if (error) throw error;
    },

    onSuccess: () => {
      invalidate();

      qc.invalidateQueries({
        queryKey: [
          'shops',
          'events',
        ],
      });

      toast.success(
        'Statut de la boutique mis à jour',
      );
    },

    onError: (e: Error) =>
      toast.error(e.message),
  });

  const extendTest = useMutation({
    mutationFn: async (params: {
      shop: Shop;
      days: number;
      reason?: string;
    }) => {
      const {
        shop,
        days,
        reason,
      } = params;

      if (shop.status !== 'test') {
        throw new Error(
          'Seule une boutique en période de test peut être prolongée.',
        );
      }

      if (
        !Number.isInteger(days) ||
        days <= 0 ||
        days > 90
      ) {
        throw new Error(
          'Une prolongation doit être comprise entre 1 et 90 jours.',
        );
      }

      const base =
        shop.test_ends_at
          ? new Date(
              shop.test_ends_at,
            ).getTime()
          : Date.now();

      const newEnd =
        new Date(
          base +
            days *
              86_400_000,
        ).toISOString();

      const db = supabase as any;

      const { error } =
        await db
          .from('shops')
          .update({
            test_ends_at: newEnd,
            test_extensions:
              (shop.test_extensions ?? 0) +
              1,
          })
          .eq('id', shop.id);

      if (error) throw error;

      const {
        error: eventError,
      } = await supabase
        .from('shop_status_events')
        .insert({
          shop_id: shop.id,
          from_status: shop.status,
          to_status: shop.status,
          action: 'test_extended',
          reason:
            reason?.trim() ||
            `Prolongation de ${days} jours`,
        });

      if (eventError) {
        throw eventError;
      }
    },

    onSuccess: () => {
      invalidate();

      qc.invalidateQueries({
        queryKey: [
          'shops',
          'events',
        ],
      });

      toast.success(
        'Période de test prolongée',
      );
    },

    onError: (e: Error) =>
      toast.error(e.message),
  });

  return {
    changeStatus,
    extendTest,
  };
};
```
