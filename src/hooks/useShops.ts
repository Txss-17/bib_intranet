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
  test: 'En test',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspendue',
  closed: 'Clôturée',
};

export const SHOP_TRANSITIONS: Record<ShopStatus, ShopStatus[]> = {
  draft: ['application', 'closed'],
  application: ['review', 'closed'],
  review: ['test', 'active', 'closed'],
  test: ['active', 'suspended', 'closed'],
  active: ['inactive', 'suspended', 'closed'],
  inactive: ['active', 'suspended', 'closed'],
  suspended: ['active', 'inactive', 'closed'],
  closed: [],
};

export interface Shop {
  id: string;

  platform_id: string | null;
  platform_synced_at: string | null;

  shop_code: string;
  name: string;
  slug: string | null;

  activity_type: string | null;
  activity_description: string | null;
  website_url: string | null;

  country: string | null;
  category: string | null;

  status: ShopStatus;

  subscription_plan: string | null;
  commission_rate: number | null;

  activated_at: string | null;
  inactive_at: string | null;
  suspended_at: string | null;
  closed_at: string | null;

  merchant_name?: string | null;
  merchant_email?: string | null;
  merchant_phone?: string | null;
  test_started_at?: string | null;
  test_ends_at?: string | null;
  test_extensions?: number;

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

const SHOP_SELECT = `
  id,
  platform_id,
  platform_synced_at,
  shop_code,
  name,
  slug,
  activity_type,
  activity_description,
  website_url,
  country,
  category,
  status,
  subscription_plan,
  commission_rate,
  activated_at,
  inactive_at,
  suspended_at,
  closed_at,
  suspension_reason,
  notes,
  app_origin,
  created_at,
  updated_at
`;

export const useShops = () =>
  useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select(SHOP_SELECT)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as Shop[];
    },
  });

export const useShop = (shopId?: string) =>
  useQuery({
    queryKey: ['shops', 'detail', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select(SHOP_SELECT)
        .eq('id', shopId!)
        .single();

      if (error) throw error;

      return data as Shop;
    },
  });

export const useShopEvents = (shopId?: string) =>
  useQuery({
    queryKey: ['shops', 'events', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_status_events')
        .select('*')
        .eq('shop_id', shopId!)
        .order('performed_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as ShopStatusEvent[];
    },
  });

export const useShopOrderSummaries = () =>
  useQuery({
    queryKey: ['shops', 'order-summaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('shop_id, total_amount, status')
        .not('shop_id', 'is', null);

      if (error) throw error;

      const map = new Map<string, ShopOrderSummary>();

      for (const row of data ?? []) {
        const shopId = row.shop_id as string;

        const entry = map.get(shopId) ?? {
          shop_id: shopId,
          orders: 0,
          revenue: 0,
          inProgress: 0,
        };

        entry.orders += 1;
        entry.revenue += Number(row.total_amount ?? 0);

        if (
          !['delivered', 'cancelled', 'refunded'].includes(
            row.status ?? '',
          )
        ) {
          entry.inProgress += 1;
        }

        map.set(shopId, entry);
      }

      return map;
    },
  });

export const useShopOrders = (shopId?: string) =>
  useQuery({
    queryKey: ['shops', 'orders', shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          current_stage,
          total_amount,
          currency,
          created_at
        `)
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data ?? [];
    },
  });

export const useShopActions = () => {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['shops'] });
  };

  const changeStatus = useMutation({
    mutationFn: async (params: {
      shop: Shop;
      to: ShopStatus;
      reason?: string;
      testDurationDays?: number;
    }) => {
      const { shop, to, reason, testDurationDays } = params;

      if (shop.status === to) {
        throw new Error(
          `La boutique est déjà au statut « ${SHOP_STATUS_LABELS[to]} ».`,
        );
      }

      const allowed = SHOP_TRANSITIONS[shop.status] ?? [];

      if (!allowed.includes(to)) {
        throw new Error(
          `Transition interdite : ${SHOP_STATUS_LABELS[shop.status]} → ${SHOP_STATUS_LABELS[to]}.`,
        );
      }

      if (
        ['inactive', 'suspended', 'closed'].includes(to) &&
        !reason?.trim()
      ) {
        throw new Error(
          `Une justification est obligatoire pour ${SHOP_STATUS_LABELS[
            to
          ].toLowerCase()}.`,
        );
      }

      const now = new Date().toISOString();

      const patch: Record<string, unknown> = {
        status: to,
      };

      if (to === 'test') {
        const days = testDurationDays && testDurationDays > 0 ? testDurationDays : 30;
        patch.test_started_at = now;
        patch.test_ends_at = new Date(Date.now() + days * 86_400_000).toISOString();
      }

      if (to === 'active') {
        patch.activated_at = now;
        patch.inactive_at = null;
        patch.suspended_at = null;
        patch.suspension_reason = null;
      }

      if (to === 'inactive') {
        patch.inactive_at = now;
        patch.suspension_reason = reason!.trim();
      }

      if (to === 'suspended') {
        patch.suspended_at = now;
        patch.suspension_reason = reason!.trim();
      }

      if (to === 'closed') {
        patch.closed_at = now;
        patch.suspension_reason = reason!.trim();
      }

      const { error } = await (supabase as any)
        .from('shops')
        .update(patch)
        .eq('id', shop.id);

      if (error) throw error;
    },

    onSuccess: () => {
      invalidate();

      qc.invalidateQueries({
        queryKey: ['shops', 'events'],
      });

      toast.success(
        'Statut de la boutique mis à jour',
      );
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const extendTest = useMutation({
    mutationFn: async (params: { shop: Shop; days: number; reason?: string }) => {
      const { shop, days, reason } = params;
      if (shop.status !== 'test') throw new Error('Seule une boutique en test peut être prolongée.');
      if (!days || days <= 0) throw new Error('Durée de prolongation invalide.');
      if (!reason?.trim()) throw new Error('Une justification est obligatoire.');
      const base = shop.test_ends_at ? new Date(shop.test_ends_at).getTime() : Date.now();
      const { error } = await (supabase as any)
        .from('shops')
        .update({
          test_ends_at: new Date(Math.max(base, Date.now()) + days * 86_400_000).toISOString(),
          test_extensions: (shop.test_extensions ?? 0) + 1,
        })
        .eq('id', shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['shops', 'events'] });
      toast.success('Phase de test prolongée');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    changeStatus,
    extendTest,
  };
};

/** Jours restants de la phase de test (null si non applicable). */
export const testDaysLeft = (shop: Partial<Shop> & Record<string, any>): number | null => {
  const end = shop?.test_end_date ?? shop?.test_ends_at ?? null;
  if (!end) return null;
  return Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000);
};
