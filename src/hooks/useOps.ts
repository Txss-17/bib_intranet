import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================
// TYPES OPS
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  order_number: string;

  // Origine plateforme
  platform_id?: string | null;

  // Client / compte
  customer_id?: string | null;

  // Boutique
  shop_id?: string | null;
  shop_name?: string | null;
  shop_code?: string | null;

  // Commande
  status: OrderStatus;
  current_stage?: string | null;
  total_amount: number;
  currency: string;

  // Il n'existe pas encore de items_count dans la table orders.
  // On le garde optionnel pour compatibilité avec certains composants.
  items_count?: number;

  // Livraison
  shipping_address?: string | null;
  shipping_method?: string | null;
  tracking_number?: string | null;

  // Informations temporelles
  ordered_at?: string | null;
  created_at: string;
  updated_at?: string | null;

  // Informations complémentaires
  region?: string | null;
  catalog_id?: string | null;
  shop_sku?: string | null;
  partner_id?: string | null;
  platform_synced_at?: string | null;

  // Compatibilité avec certains écrans existants
  billing_address?: string;
  notes?: string;
}

export interface Shipment {
  id: string;
  order_id?: string;
  tracking_number?: string;
  carrier: string;
  status:
    | 'preparing'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'returned';
  origin_address?: string;
  destination_address?: string;
  weight_kg?: number;
  estimated_delivery?: string;
  actual_delivery?: string;
  shipping_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LogisticsIncident {
  id: string;
  shipment_id?: string;
  order_id?: string;
  type:
    | 'delay'
    | 'damage'
    | 'lost'
    | 'wrong_address'
    | 'customer_complaint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
  resolution?: string;
  reported_by?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LogisticsPartner {
  id: string;
  name: string;
  type: 'carrier' | 'warehouse' | 'fulfillment' | 'customs';
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'suspended';
  contract_start?: string;
  contract_end?: string;
  performance_score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Order normalization uses the saved lifecycle stage.
const normalizeOrderStatus = (
  rawStatus: string | null | undefined,
  currentStage: string | null | undefined
): OrderStatus => {
  const status = (rawStatus ?? '').toLowerCase();
  const stage = (currentStage ?? '').toLowerCase();

  const effective = stage || status;

  if (
    effective === 'cancelled' ||
    effective === 'canceled' ||
    effective === 'refunded'
  ) {
    return 'cancelled';
  }

  if (
    effective === 'delivered' ||
    effective === 'completed'
  ) {
    return 'delivered';
  }

  if (
    effective === 'shipped' ||
    effective === 'in_transit' ||
    effective === 'out_for_delivery'
  ) {
    return 'shipped';
  }

  if (
    effective === 'processing' ||
    effective === 'prepared' ||
    effective === 'preparing' ||
    effective === 'accepted' ||
    effective === 'transmitted'
  ) {
    return 'processing';
  }

  if (
    effective === 'confirmed' ||
    effective === 'paid'
  ) {
    return 'confirmed';
  }

  return 'pending';
};

// ============================================================
// ORDERS
// ============================================================

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      // On récupère les commandes réelles.
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          [
            'id',
            'order_number',
            'platform_id',
            'user_account_id',
            'shop_id',
            'catalog_id',
            'shop_sku',
            'partner_id',
            'status',
            'current_stage',
            'total_amount',
            'currency',
            'region',
            'shipping_address',
            'shipping_method',
            'tracking_number',
            'ordered_at',
            'created_at',
            'updated_at',
            'platform_synced_at',
          ].join(', ')
        )
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // Les boutiques sont récupérées séparément afin de ne pas
      // dépendre d'un nom de relation PostgREST généré.
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, shop_code');

      if (shopsError) {
        throw shopsError;
      }

      const shopMap = new Map(
        (shopsData ?? []).map((shop) => [
          shop.id,
          {
            name: shop.name,
            shop_code: shop.shop_code,
          },
        ])
      );

      return ((ordersData ?? []) as any[]).map((row): Order => {
        const shop = row.shop_id
          ? shopMap.get(row.shop_id)
          : undefined;

        return {
          id: row.id,
          order_number: row.order_number,

          platform_id: row.platform_id,
          customer_id: row.user_account_id,

          shop_id: row.shop_id,
          shop_name: shop?.name ?? null,
          shop_code: shop?.shop_code ?? null,

          status: normalizeOrderStatus(
            row.status,
            row.current_stage
          ),

          current_stage: row.current_stage,

          total_amount: Number(row.total_amount ?? 0),
          currency: row.currency ?? 'EUR',

          shipping_address: row.shipping_address,
          shipping_method: row.shipping_method,
          tracking_number: row.tracking_number,

          ordered_at: row.ordered_at,
          created_at:
            row.created_at ??
            row.ordered_at ??
            new Date().toISOString(),

          updated_at: row.updated_at,

          region: row.region,
          catalog_id: row.catalog_id,
          shop_sku: row.shop_sku,
          partner_id: row.partner_id,
          platform_synced_at: row.platform_synced_at,
        };
      });
    },
  });
};

// ============================================================
// SHIPMENTS
// ============================================================

export const useShipments = () => {
  return useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('shipments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Shipment[];
    },
  });
};

// ============================================================
// LOGISTICS INCIDENTS
// ============================================================

export const useLogisticsIncidents = () => {
  return useQuery({
    queryKey: ['logistics-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('logistics_incidents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LogisticsIncident[];
    },
  });
};

// ============================================================
// LOGISTICS PARTNERS
// ============================================================

export const useLogisticsPartners = () => {
  return useQuery({
    queryKey: ['logistics-partners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('logistics_partners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LogisticsPartner[];
    },
  });
};

// ============================================================
// OPS KPIs
// ============================================================

export const calculateOpsKPIs = (
  orders: Order[],
  shipments: Shipment[],
  incidents: LogisticsIncident[]
) => {
  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (o) =>
      o.status === 'pending' ||
      o.status === 'confirmed'
  ).length;

  const processingOrders = orders.filter(
    (o) => o.status === 'processing'
  ).length;

  const shippedOrders = orders.filter(
    (o) => o.status === 'shipped'
  ).length;

  const deliveredOrders = orders.filter(
    (o) => o.status === 'delivered'
  ).length;

  const shipmentsInTransit = shipments.filter(
    (s) =>
      s.status === 'in_transit' ||
      s.status === 'out_for_delivery'
  ).length;

  const deliveredShipments = shipments.filter(
    (s) => s.status === 'delivered'
  ).length;

  const openIncidents = incidents.filter(
    (i) =>
      i.status === 'open' ||
      i.status === 'investigating'
  ).length;

  const criticalIncidents = incidents.filter(
    (i) =>
      i.severity === 'critical' &&
      i.status !== 'resolved' &&
      i.status !== 'closed'
  ).length;

  const deliveryRate =
    totalOrders > 0
      ? Math.round(
          (deliveredOrders / totalOrders) * 100
        )
      : 0;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    shipmentsInTransit,
    deliveredShipments,
    openIncidents,
    criticalIncidents,
    deliveryRate,
    totalRevenue,
  };
};