import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShipmentRecord {
  id: string;
  order_id: string | null;
  tracking_number: string | null;
  carrier: string;
  status: string;
  origin_address: string | null;
  destination_address: string | null;
  weight_kg: number | null;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  shipping_cost: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useShipmentRecords = (options?: { status?: string; carrier?: string }) => {
  return useQuery({
    queryKey: ['shipment-records', options],
    queryFn: async () => {
      let query = supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (options?.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }
      if (options?.carrier && options.carrier !== 'all') {
        query = query.eq('carrier', options.carrier);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ShipmentRecord[];
    },
  });
};

export const useCreateShipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shipment: Omit<ShipmentRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('shipments').insert(shipment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shipment-records'] }),
  });
};

export const useUpdateShipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShipmentRecord> & { id: string }) => {
      const { data, error } = await supabase.from('shipments').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shipment-records'] }),
  });
};
