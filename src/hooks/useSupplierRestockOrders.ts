import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase as typedSupabase } from '@/integrations/supabase/client';
// Supplier tables are not yet in the generated schema types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = typedSupabase as any;

import { useAuth } from '@/hooks/useAuth';
import { readAllPages } from '@/lib/operationsMetrics';
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
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['supplier_restock_orders', user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows = await readAllPages<SupplierRestockOrder>(cursor => {
        let query = supabase.from('supplier_restock_orders').select('*').order('id').limit(500);
        if (cursor) query = query.gt('id', cursor);
        return query;
      });
      return rows.sort((left, right) => right.created_at.localeCompare(left.created_at));
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
      const { data, error } = await supabase
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
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  });
}

export function useUpdateRestockOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SupplierRestockOrder> }) => {
      const update: Record<string, unknown> = { ...patch };
      if (patch.status === 'sent' && !patch.sent_at) update.sent_at = new Date().toISOString();
      if (patch.status === 'acknowledged' && !patch.acknowledged_at) update.acknowledged_at = new Date().toISOString();
      if (patch.status === 'received' && !patch.received_at) update.received_at = new Date().toISOString();
      const { error } = await supabase.from('supplier_restock_orders').update(update).eq('id', id);
      if (error) throw error;

      // Outbound portal notification on send
      if (patch.status === 'sent') {
        const { data: row, error: rowError } = await supabase
          .from('supplier_restock_orders').select('supplier_id, product_name, quantity, destination_name').eq('id', id).single();
        if (rowError) throw rowError;
        if (row) {
          const { error: notificationError } = await supabase.from('supplier_portal_notifications').insert({
            supplier_id: row.supplier_id,
            type: 'restock_order',
            title: 'Nouvel ordre de restock',
            body: `${row.product_name} × ${row.quantity} → ${row.destination_name}`,
            reference_table: 'supplier_restock_orders',
            reference_id: id,
          });
          if (notificationError) throw notificationError;
        }
      }
    },
    onSuccess: () => {
      toast.success('Ordre mis à jour');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['supplier_restock_orders'] }),
    onError: (e: Error) => toast.error('Erreur', { description: e.message }),
  });
}

export function useSuppliersList() {
  return useQuery({
    queryKey: ['suppliers_list_min'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('logistics_partners')
        .select('id, name, type')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return {
        logistics_partners: data || [],
      };
    },
  });
}

export function useCatalogProducts() {
  return useQuery({
    queryKey: ['catalog_products_min'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_catalog').select('id, name, shop_sku, moq').eq('is_active', true).order('name').limit(500);
      if (error) throw error;
      return data || [];
    },
  });
}
