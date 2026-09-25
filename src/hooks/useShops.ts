import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ShopStatus =
  | 'application'
  | 'review'
  | 'test'
  | 'active'
  | 'suspended'
  | 'closed';

export const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  application: 'Candidature',
  review: 'En revue',
  test: 'Période de test',
  active: 'Active',
  suspended: 'Suspendue',
  closed: 'Clôturée',
};

/** Transitions autorisées du cycle de vie boutique. */
export const SHOP_TRANSITIONS: Record<ShopStatus, ShopStatus[]> = {
  application: ['review', 'closed'],
  review: ['test', 'active', 'closed'],
  test: ['active', 'suspended', 'closed'],
  active: ['suspended', 'closed'],
  suspended: ['active', 'closed'],
  closed: [],
};

export interface Shop {
  id: string;
  shop_code: string;
  name: string;
  slug: string | null;
  merchant_name: string | null;
  merchant_email: string | null;
  merchant_phone: string | null;
  country: string | null;
  category: string | null;
  status: ShopStatus;
  subscription_plan: string | null;
  commission_rate: number | null;
  contract_status: string | null;
  contract_signed_at: string | null;
  test_started_at: string | null;
  test_ends_at: string | null;
  test_extensions: number;
  activated_at: string | null;
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

/** Jours restants de période de test (null si non applicable). */
export const testDaysLeft = (shop: Shop): number | null => {
  if (shop.status !== 'test' || !shop.test_ends_at) return null;
  const diff = new Date(shop.test_ends_at).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

// ===== QUERIES =====

export const useShops = () =>
  useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Shop[];
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

/** Commandes rattachées par boutique (règle : une commande = une seule boutique). */
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
        const key = row.shop_id as string;
        const entry =
          map.get(key) ?? { shop_id: key, orders: 0, revenue: 0, inProgress: 0 };
        entry.orders += 1;
        entry.revenue += Number(row.total_amount ?? 0);
        if (!['delivered', 'cancelled', 'refunded'].includes(row.status ?? '')) {
          entry.inProgress += 1;
        }
        map.set(key, entry);
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
        .select('id, order_number, status, current_stage, total_amount, currency, created_at')
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

// ===== MUTATIONS =====

export interface NewShopInput {
  name: string;
  merchant_name?: string;
  merchant_email?: string;
  merchant_phone?: string;
  country?: string;
  category?: string;
  subscription_plan?: string;
  commission_rate?: number;
  notes?: string;
}

export const useShopActions = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['shops'] });
  };

  const create = useMutation({
    mutationFn: async (input: NewShopInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const code = `SHOP-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from('shops')
        .insert({
          ...input,
          shop_code: code,
          slug: input.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          status: 'application',
          created_by: auth.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Shop;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Candidature boutique enregistrée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async (params: {
      shop: Shop;
      to: ShopStatus;
      reason?: string;
      testDurationDays?: number;
    }) => {
      const { shop, to, reason, testDurationDays } = params;
      const patch: Record<string, unknown> = { status: to };
      const now = new Date().toISOString();

      if (to === 'test') {
        const days = testDurationDays ?? 30;
        patch.test_started_at = now;
        patch.test_ends_at = new Date(Date.now() + days * 86_400_000).toISOString();
      }
      if (to === 'active') {
        patch.activated_at = now;
        patch.suspension_reason = null;
      }
      if (to === 'suspended') {
        patch.suspended_at = now;
        patch.suspension_reason = reason ?? null;
      }
      if (to === 'closed') {
        patch.closed_at = now;
        patch.suspension_reason = reason ?? null;
      }

      const { error } = await supabase.from('shops').update(patch).eq('id', shop.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Décision enregistrée et journalisée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const extendTest = useMutation({
    mutationFn: async (params: { shop: Shop; days: number; reason?: string }) => {
      const { shop, days, reason } = params;
      const base = shop.test_ends_at ? new Date(shop.test_ends_at).getTime() : Date.now();
      const { error } = await supabase
        .from('shops')
        .update({
          test_ends_at: new Date(base + days * 86_400_000).toISOString(),
          test_extensions: (shop.test_extensions ?? 0) + 1,
        })
        .eq('id', shop.id);
      if (error) throw error;

      await supabase.from('shop_status_events').insert({
        shop_id: shop.id,
        from_status: shop.status,
        to_status: shop.status,
        action: 'test_extended',
        reason: reason ?? `Prolongation de ${days} jours`,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success('Période de test prolongée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { create, changeStatus, extendTest };
};
