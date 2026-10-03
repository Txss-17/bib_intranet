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

// ============================================================
// MOCK DATA TEMPORAIRE
// ============================================================
//
// Les commandes ne sont PLUS mockées.
// Les autres sous-modules Ops seront raccordés à Supabase
// dans les étapes suivantes.
//

const mockShipments: Shipment[] = [
  {
    id: '1',
    order_id: '2',
    tracking_number: 'DHL-FR-123456',
    carrier: 'DHL',
    status: 'in_transit',
    destination_address: 'Lyon, France',
    weight_kg: 2.5,
    estimated_delivery: new Date(Date.now() + 86400000).toISOString(),
    shipping_cost: 12.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_id: '4',
    tracking_number: 'COL-789012',
    carrier: 'Colissimo',
    status: 'delivered',
    destination_address: 'Bordeaux, France',
    weight_kg: 0.8,
    actual_delivery: new Date(Date.now() - 86400000).toISOString(),
    shipping_cost: 8,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    order_id: '1',
    tracking_number: 'UPS-345678',
    carrier: 'UPS',
    status: 'preparing',
    destination_address: 'Paris, France',
    weight_kg: 4.2,
    estimated_delivery: new Date(Date.now() + 172800000).toISOString(),
    shipping_cost: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    tracking_number: 'FDX-901234',
    carrier: 'FedEx',
    status: 'out_for_delivery',
    destination_address: 'Nice, France',
    weight_kg: 1.2,
    estimated_delivery: new Date().toISOString(),
    shipping_cost: 18.5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    order_id: '6',
    tracking_number: 'DHL-FR-654321',
    carrier: 'DHL',
    status: 'picked_up',
    destination_address: 'Nantes, France',
    weight_kg: 3.1,
    estimated_delivery: new Date(Date.now() + 259200000).toISOString(),
    shipping_cost: 14,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockIncidents: LogisticsIncident[] = [
  {
    id: '1',
    shipment_id: '1',
    type: 'delay',
    severity: 'medium',
    status: 'investigating',
    description: 'Retard de livraison dû aux conditions météo',
    reported_by: 'Client',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    order_id: '3',
    type: 'wrong_address',
    severity: 'high',
    status: 'open',
    description: 'Adresse de livraison incorrecte signalée',
    reported_by: 'Transporteur',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    shipment_id: '2',
    type: 'damage',
    severity: 'low',
    status: 'resolved',
    description: 'Emballage légèrement endommagé',
    resolution: 'Remboursement partiel accordé',
    reported_by: 'Client',
    resolved_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'customer_complaint',
    severity: 'critical',
    status: 'open',
    description: 'Colis non reçu après 10 jours',
    reported_by: 'Client VIP',
    assigned_to: 'Sophie Martin',
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    shipment_id: '4',
    type: 'delay',
    severity: 'medium',
    status: 'investigating',
    description: 'Retard de livraison - camion en panne',
    reported_by: 'FedEx',
    assigned_to: 'Jean Dupont',
    created_at: new Date(Date.now() - 21600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockPartners: LogisticsPartner[] = [
  {
    id: '1',
    name: 'DHL Express',
    type: 'carrier',
    contact_email: 'contact@dhl.fr',
    status: 'active',
    performance_score: 92,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Colissimo',
    type: 'carrier',
    contact_email: 'pro@colissimo.fr',
    status: 'active',
    performance_score: 88,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'UPS France',
    type: 'carrier',
    contact_email: 'business@ups.fr',
    status: 'active',
    performance_score: 85,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Entrepôt Paris Nord',
    type: 'warehouse',
    contact_email: 'ops@parisnord.fr',
    status: 'active',
    performance_score: 95,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'FedEx',
    type: 'carrier',
    contact_email: 'france@fedex.com',
    status: 'inactive',
    performance_score: 78,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Entrepôt Lyon Sud',
    type: 'warehouse',
    contact_email: 'contact@lyonsud.fr',
    contact_phone: '+33 4 72 XX XX XX',
    status: 'active',
    performance_score: 91,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Chronopost',
    type: 'carrier',
    contact_email: 'pro@chronopost.fr',
    status: 'active',
    performance_score: 86,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================
// ORDER STATUS NORMALIZATION
// ============================================================
//
// La plateforme peut transmettre des statuts de paiement ou
// de logistique différents de ceux utilisés par l'interface Ops.
//
// Exemple :
// paid + null       -> confirmed
// paid + processing -> processing
// paid + shipped    -> shipped
// paid + delivered  -> delivered
//

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

      return (ordersData ?? []).map((row): Order => {
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
      return mockShipments;
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
      return mockIncidents;
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
      return mockPartners;
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