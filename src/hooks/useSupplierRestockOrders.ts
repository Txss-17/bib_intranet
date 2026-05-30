import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SupplierRestockOrder {
  id: string;
  supplier_id: string;
  catalog_id: string | null;
  product_name: string;
  quantity: number;
  destination_type: 'warehouse' | 'logistics_partner';
  destination_id: string | null;
  destination_name: string;
  customization_notes: string | null;
  status: 'draft' | 'sent' | 'acknowledged' | 'in_production' | 'shipped' | 'received' | 'cancelled';
  priority: 'high' | 'standard' | 'low';
  due_date: string | null;
  sent_at: string | null;
  acknowledged_at: string | null;
  received_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupplierRestockOrders() {
  return useQuery({
    queryKey: ['supplier_restock_orders'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('supplier_restock_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SupplierRestockOrder[];
    },
  });
}

export function useCreateRestockOrder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SupplierRestockOrder> & {
      supplier_id: string; product_name: string; quantity: number;
      destination_type: 'warehouse' | 'logistics_partner'; destination_name: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('supplier_restock_orders')
        .insert({ ...input, created_by: user?.id })
        .select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Ordre de restock créé');
      qc.invalidateQueries({ queryKey: ['supplier_restock_orders'] });
    },
    onError: (e: any) => toast.error('Erreur', { description: e.message }),
  });
}

export function useUpdateRestockOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SupplierRestockOrder> }) => {
      const update: any = { ...patch };
      if (patch.status === 'sent' && !patch.sent_at) update.sent_at = new Date().toISOString();
      if (patch.status === 'acknowledged' && !patch.acknowledged_at) update.acknowledged_at = new Date().toISOString();
      if (patch.status === 'received' && !patch.received_at) update.received_at = new Date().toISOString();
      const { error } = await (supabase as any).from('supplier_restock_orders').update(update).eq('id', id);
      if (error) throw error;

      // Outbound portal notification on send
      if (patch.status === 'sent') {
        const { data: row } = await (supabase as any)
          .from('supplier_restock_orders').select('supplier_id, product_name, quantity, destination_name').eq('id', id).single();
        if (row) {
          await (supabase as any).from('supplier_portal_notifications').insert({
            supplier_id: row.supplier_id,
            type: 'restock_order',
            title: 'Nouvel ordre de restock',
            body: `${row.product_name} × ${row.quantity} → ${row.destination_name}`,
            reference_table: 'supplier_restock_orders',
            reference_id: id,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success('Ordre mis à jour');
      qc.invalidateQueries({ queryKey: ['supplier_restock_orders'] });
    },
    onError: (e: any) => toast.error('Erreur', { description: e.message }),
  });
}

export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers_list_min'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('suppliers').select('id, name').eq('status', 'active').order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useDestinationOptions() {
  return useQuery({
    queryKey: ['restock_destinations'],
    queryFn: async () => {
      const [partners] = await Promise.all([
        (supabase as any).from('logistics_partners').select('id, name, type').eq('status', 'active').order('name'),
      ]);
      return {
        logistics_partners: (partners.data || []) as { id: string; name: string; type: string }[],
      };
    },
  });
}

export function useCatalogProducts() {
  return useQuery({
    queryKey: ['catalog_products_min'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_catalog').select('id, name, shop_sku, moq').eq('is_active', true).order('name').limit(500);
      if (error) throw error;
      return data || [];
    },
  });
}
