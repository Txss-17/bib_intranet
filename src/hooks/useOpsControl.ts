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

  product_catalog?: ProductCatalogItem | null;

  logistics_partners?: {
    id: string;
    name: string;
    region: string | null;
  } | null;
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

  logistics_partners?: {
    id: string;
    name: string;
  } | null;
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

/* =========================================================
   QUERIES
   ========================================================= */

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
        .select(
          '*, product_catalog(*), logistics_partners(id, name, region)'
        )
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

/* =========================================================
   MUTATIONS
   ========================================================= */

export const useUpdateStock = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      quantity: number;
    }) => {
      if (vars.quantity < 0) {
        throw new Error('La quantité de stock ne peut pas être négative.');
      }

      const { error } = await supabase
        .from('partner_stocks')
        .update({
          quantity: vars.quantity,
          last_inventory_at: new Date().toISOString(),
        })
        .eq('id', vars.id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['ops', 'partner_stocks'],
      });

      toast.success('Stock mis à jour');
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};

export const useApproveReplenishment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      status: 'approved' | 'rejected' | 'executed';
    }) => {
      const { error } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: vars.status,
          approved_at:
            vars.status !== 'rejected'
              ? new Date().toISOString()
              : null,
        })
        .eq('id', vars.id);

      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['ops', 'replenishment'],
      });

      toast.success('Suggestion mise à jour');
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};

export const useAdvanceOrderStage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      orderId: string;
      nextStage: string;
      partnerId?: string;
    }) => {
      const { error: eventError } = await supabase
        .from('order_lifecycle_events')
        .insert({
          order_id: vars.orderId,
          stage: vars.nextStage,
          partner_id: vars.partnerId,
        });

      if (eventError) throw eventError;

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          current_stage: vars.nextStage,
        })
        .eq('id', vars.orderId);

      if (orderError) throw orderError;
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['ops', 'orders_lifecycle'],
      });

      toast.success('Étape mise à jour');
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};

/* =========================================================
   OPS CONTROL TOWER — KPI AGGREGATOR
   ========================================================= */

export const useOpsControlKPIs = () => {
  const stocks = usePartnerStocks();
  const orders = useOrdersWithLifecycle();
  const sync = useSyncEvents();
  const incidents = useLogisticsIncidentsDb();

  const stockRows = stocks.data ?? [];
  const orderRows = orders.data ?? [];
  const syncRows = sync.data ?? [];
  const incidentRows = (incidents.data ?? []) as Array<{
    status?: string;
  }>;

  /*
   * Commandes
   */
  const ordersInPipeline = orderRows.filter((order: {
    current_stage?: string;
  }) => {
    const stage = order.current_stage ?? '';

    return !['delivered', 'cancelled', 'canceled'].includes(stage);
  }).length;

  const ordersDelivered = orderRows.filter((order: {
    current_stage?: string;
  }) => order.current_stage === 'delivered').length;

  /*
   * Stocks
   */
  const stockUnits = stockRows.reduce(
    (total, stock) => total + Number(stock.quantity ?? 0),
    0
  );

  const ruptureCount = stockRows.filter(
    (stock) =>
      Number(stock.quantity ?? 0) <=
      Number(stock.rupture_threshold ?? 0)
  ).length;

  const lowStockCount = stockRows.filter((stock) => {
    const quantity = Number(stock.quantity ?? 0);
    const rupture = Number(stock.rupture_threshold ?? 0);
    const reorder = Number(stock.reorder_threshold ?? 0);

    return quantity > rupture && quantity <= reorder;
  }).length;

  /*
   * Synchronisations
   *
   * Le taux est calculé sur les événements actuellement
   * récupérés par useSyncEvents() — maximum 200 événements.
   */
  const syncSuccessCount = syncRows.filter(
    (event) => event.status === 'success'
  ).length;

  const syncSuccessRate =
    syncRows.length === 0
      ? 100
      : Math.round(
          (syncSuccessCount / syncRows.length) * 100
        );

  /*
   * Erreurs de synchronisation sur les dernières 24h.
   * Les timeouts sont considérés comme des erreurs
   * opérationnelles.
   */
  const now = Date.now();

  const syncErrors24h = syncRows.filter((event) => {
    if (
      event.status !== 'error' &&
      event.status !== 'timeout'
    ) {
      return false;
    }

    const timestamp = new Date(event.created_at).getTime();

    return (
      Number.isFinite(timestamp) &&
      now - timestamp < 24 * 60 * 60 * 1000
    );
  }).length;

  /*
   * Incidents
   */
  const openIncidents = incidentRows.filter(
    (incident) =>
      incident.status === 'open' ||
      incident.status === 'investigating'
  ).length;

  /*
   * État de chargement global.
   */
  const isLoading =
    stocks.isLoading ||
    orders.isLoading ||
    sync.isLoading ||
    incidents.isLoading;

  /*
   * État d'erreur global.
   */
  const error =
    stocks.error ??
    orders.error ??
    sync.error ??
    incidents.error ??
    null;

  return {
    ordersInPipeline,
    ordersDelivered,

    stockUnits,
    ruptureCount,
    lowStockCount,

    syncErrors24h,
    syncSuccessRate,

    openIncidents,

    isLoading,
    error,
  };
};