import { useQuery } from '@tanstack/react-query';

// Types for Ops module
export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  currency: string;
  items_count: number;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id?: string;
  tracking_number?: string;
  carrier: string;
  status: 'preparing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned';
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
  type: 'delay' | 'damage' | 'lost' | 'wrong_address' | 'customer_complaint';
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

// Mock data for development
const mockOrders: Order[] = [
  { id: '1', order_number: 'ORD-2024-001', status: 'processing', total_amount: 299.99, currency: 'EUR', items_count: 3, shipping_address: 'Paris, France', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', order_number: 'ORD-2024-002', status: 'shipped', total_amount: 149.50, currency: 'EUR', items_count: 2, shipping_address: 'Lyon, France', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', order_number: 'ORD-2024-003', status: 'pending', total_amount: 599.00, currency: 'EUR', items_count: 5, shipping_address: 'Marseille, France', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: '4', order_number: 'ORD-2024-004', status: 'delivered', total_amount: 89.99, currency: 'EUR', items_count: 1, shipping_address: 'Bordeaux, France', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', order_number: 'ORD-2024-005', status: 'confirmed', total_amount: 450.00, currency: 'EUR', items_count: 4, shipping_address: 'Toulouse, France', created_at: new Date(Date.now() - 345600000).toISOString(), updated_at: new Date().toISOString() },
  { id: '6', order_number: 'ORD-2024-006', status: 'processing', total_amount: 175.25, currency: 'EUR', items_count: 2, shipping_address: 'Nantes, France', created_at: new Date(Date.now() - 432000000).toISOString(), updated_at: new Date().toISOString() },
  { id: '7', order_number: 'ORD-2024-007', status: 'pending', total_amount: 320.00, currency: 'EUR', items_count: 3, shipping_address: 'Strasbourg, France', created_at: new Date(Date.now() - 518400000).toISOString(), updated_at: new Date().toISOString() },
];

const mockShipments: Shipment[] = [
  { id: '1', order_id: '2', tracking_number: 'DHL-FR-123456', carrier: 'DHL', status: 'in_transit', destination_address: 'Lyon, France', weight_kg: 2.5, estimated_delivery: new Date(Date.now() + 86400000).toISOString(), shipping_cost: 12.50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', order_id: '4', tracking_number: 'COL-789012', carrier: 'Colissimo', status: 'delivered', destination_address: 'Bordeaux, France', weight_kg: 0.8, actual_delivery: new Date(Date.now() - 86400000).toISOString(), shipping_cost: 8.00, created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', order_id: '1', tracking_number: 'UPS-345678', carrier: 'UPS', status: 'preparing', destination_address: 'Paris, France', weight_kg: 4.2, estimated_delivery: new Date(Date.now() + 172800000).toISOString(), shipping_cost: 15.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', tracking_number: 'FDX-901234', carrier: 'FedEx', status: 'out_for_delivery', destination_address: 'Nice, France', weight_kg: 1.2, estimated_delivery: new Date().toISOString(), shipping_cost: 18.50, created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', order_id: '6', tracking_number: 'DHL-FR-654321', carrier: 'DHL', status: 'picked_up', destination_address: 'Nantes, France', weight_kg: 3.1, estimated_delivery: new Date(Date.now() + 259200000).toISOString(), shipping_cost: 14.00, created_at: new Date(Date.now() - 43200000).toISOString(), updated_at: new Date().toISOString() },
];

const mockIncidents: LogisticsIncident[] = [
  { id: '1', shipment_id: '1', type: 'delay', severity: 'medium', status: 'investigating', description: 'Retard de livraison dû aux conditions météo', reported_by: 'Client', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', order_id: '3', type: 'wrong_address', severity: 'high', status: 'open', description: 'Adresse de livraison incorrecte signalée', reported_by: 'Transporteur', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', shipment_id: '2', type: 'damage', severity: 'low', status: 'resolved', description: 'Emballage légèrement endommagé', resolution: 'Remboursement partiel accordé', reported_by: 'Client', resolved_at: new Date().toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
  { id: '4', type: 'customer_complaint', severity: 'critical', status: 'open', description: 'Colis non reçu après 10 jours', reported_by: 'Client VIP', assigned_to: 'Sophie Martin', created_at: new Date(Date.now() - 43200000).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', shipment_id: '4', type: 'delay', severity: 'medium', status: 'investigating', description: 'Retard de livraison - camion en panne', reported_by: 'FedEx', assigned_to: 'Jean Dupont', created_at: new Date(Date.now() - 21600000).toISOString(), updated_at: new Date().toISOString() },
];

const mockPartners: LogisticsPartner[] = [
  { id: '1', name: 'DHL Express', type: 'carrier', contact_email: 'contact@dhl.fr', status: 'active', performance_score: 92, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Colissimo', type: 'carrier', contact_email: 'pro@colissimo.fr', status: 'active', performance_score: 88, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'UPS France', type: 'carrier', contact_email: 'business@ups.fr', status: 'active', performance_score: 85, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', name: 'Entrepôt Paris Nord', type: 'warehouse', contact_email: 'ops@parisnord.fr', status: 'active', performance_score: 95, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', name: 'FedEx', type: 'carrier', contact_email: 'france@fedex.com', status: 'inactive', performance_score: 78, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', name: 'Entrepôt Lyon Sud', type: 'warehouse', contact_email: 'contact@lyonsud.fr', contact_phone: '+33 4 72 XX XX XX', status: 'active', performance_score: 91, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', name: 'Chronopost', type: 'carrier', contact_email: 'pro@chronopost.fr', status: 'active', performance_score: 86, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      // Return mock data (will connect to Supabase when tables are created)
      return mockOrders;
    },
  });
};

// Shipments hooks
export const useShipments = () => {
  return useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      return mockShipments;
    },
  });
};

// Incidents hooks
export const useLogisticsIncidents = () => {
  return useQuery({
    queryKey: ['logistics-incidents'],
    queryFn: async () => {
      return mockIncidents;
    },
  });
};

// Partners hooks
export const useLogisticsPartners = () => {
  return useQuery({
    queryKey: ['logistics-partners'],
    queryFn: async () => {
      return mockPartners;
    },
  });
};

// Utility functions for KPIs
export const calculateOpsKPIs = (orders: Order[], shipments: Shipment[], incidents: LogisticsIncident[]) => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  
  const shipmentsInTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length;
  const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
  
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
  
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
  
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
