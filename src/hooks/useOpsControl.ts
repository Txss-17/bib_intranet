import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductCatalogItem {
  id: string;
  product_id: string | null;
  shop_sku: string;
  internal_sku: string | null;
  barcode: string | null;
  name: string;
  category: string | null;
  weight_gross_g: number | null;
  weight_net_g: number | null;
  packaging_type: string | null;
  dimensions: string | null;
  moq: number;
  reorder_threshold: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerStock {
  id: string;
  catalog_id: string;
  partner_id: string;
  quantity: number;
  reserved_quantity: number;
  rupture_threshold: number;
  reorder_threshold: number;
  location: string | null;
  region: string | null;
  last_inventory_at: string | null;
  // joined
  product_catalog?: ProductCatalogItem | null;
  logistics_partners?: { id: string; name: string; region: string | null } | null;
}

export interface OrderLifecycleEvent {
  id: string;
  order_id: string;
  stage: string;
  partner_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface PartnerSyncEvent {
  id: string;
  partner_id: string;
  direction: 'outbound' | 'inbound';
  event_type: string;
  status: 'success' | 'pending' | 'error' | 'timeout';
  reference_id: string | null;
  reference_type: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
  logistics_partners?: { id: string; name: string } | null;
}

export interface ReplenishmentSuggestion {
  id: string;
  catalog_id: string;
  source_partner_id: string | null;
  target_partner_id: string | null;
  suggested_quantity: number;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  notes: string | null;
  created_at: string;
}

// ============= QUERIES =============

export const useProductCatalog = () =>
  useQuery({
    queryKey: ['ops', 'product_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_catalog')
        .select('*')
        .order('shop_sku');
      if (error) throw error;
      return (data ?? []) as ProductCatalogItem[];
    },
  });

export const usePartnerStocks = () =>
  useQuery({
    queryKey: ['ops', 'partner_stocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_stocks')
        .select('*, product_catalog(*), logistics_partners(id, name, region)')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PartnerStock[];
    },
  });

export const useOpsPartners = () =>
  useQuery({
    queryKey: ['ops', 'partners_enriched'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_partners')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

export const useOrdersWithLifecycle = () =>
  useQuery({
    queryKey: ['ops', 'orders_lifecycle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, logistics_partners:partner_id(id, name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

export const useSyncEvents = () =>
  useQuery({
    queryKey: ['ops', 'sync_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_sync_events')
        .select('*, logistics_partners(id, name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as PartnerSyncEvent[];
    },
  });

export const useReplenishment = () =>
  useQuery({
    queryKey: ['ops', 'replenishment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('replenishment_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReplenishmentSuggestion[];
    },
  });

export const useLogisticsIncidentsDb = () =>
  useQuery({
    queryKey: ['ops', 'incidents_db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_incidents')
        .select('*, logistics_partners:partner_id(id, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

// ============= MUTATIONS =============

export const useUpdateStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('partner_stocks')
        .update({ quantity: vars.quantity, last_inventory_at: new Date().toISOString() })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'partner_stocks'] });
      toast.success('Stock mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useApproveReplenishment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; status: 'approved' | 'rejected' | 'executed' }) => {
      const { error } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: vars.status,
          approved_at: vars.status !== 'rejected' ? new Date().toISOString() : null,
        })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'replenishment'] });
      toast.success('Suggestion mise à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAdvanceOrderStage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { orderId: string; nextStage: string; partnerId?: string }) => {
      const { error: e1 } = await supabase.from('order_lifecycle_events').insert({
        order_id: vars.orderId,
        stage: vars.nextStage,
        partner_id: vars.partnerId,
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from('orders')
        .update({ current_stage: vars.nextStage })
        .eq('id', vars.orderId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'orders_lifecycle'] });
      toast.success('Étape mise à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// KPIs aggregator
export const useOpsControlKPIs = () => {
  const stocks = usePartnerStocks();
  const orders = useOrdersWithLifecycle();
  const sync = useSyncEvents();
  const incidents = useLogisticsIncidentsDb();

  const kpis = (() => {
    const s = stocks.data ?? [];
    const o = orders.data ?? [];
    const sy = sync.data ?? [];
    const i = (incidents.data ?? []) as Array<{ status?: string }>;
    return {
      ordersInPipeline: o.filter((x: { current_stage?: string }) => !['delivered', 'cancelled'].includes(x.current_stage ?? '')).length,
      ordersDelivered: o.filter((x: { current_stage?: string }) => x.current_stage === 'delivered').length,
      stockUnits: s.reduce((acc, x) => acc + (x.quantity ?? 0), 0),
      ruptureCount: s.filter((x) => x.quantity <= x.rupture_threshold).length,
      lowStockCount: s.filter((x) => x.quantity > x.rupture_threshold && x.quantity <= x.reorder_threshold).length,
      syncErrors24h: sy.filter((x) => x.status === 'error' && Date.now() - new Date(x.created_at).getTime() < 86400000).length,
      syncSuccessRate: sy.length === 0 ? 100 : Math.round((sy.filter((x) => x.status === 'success').length / sy.length) * 100),
      openIncidents: i.filter((x) => x.status === 'open' || x.status === 'investigating').length,
    };
  })();

  return { ...kpis, isLoading: stocks.isLoading || orders.isLoading };
};
