```tsx
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ShipmentStatus =
  | 'preparing'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned';

export interface ShipmentRecord {
  id: string;
  order_id: string | null;
  tracking_number: string | null;
  carrier: string;
  status: ShipmentStatus;
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

const db = supabase as any;

export const useShipmentRecords = (
  options?: {
    status?: string;
    carrier?: string;
  },
) =>
  useQuery({
    queryKey: ['shipment-records', options],
    queryFn: async () => {
      let query = db
        .from('shipments')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (
        options?.status &&
        options.status !== 'all'
      ) {
        query = query.eq(
          'status',
          options.status,
        );
      }

      if (
        options?.carrier &&
        options.carrier !== 'all'
      ) {
        query = query.eq(
          'carrier',
          options.carrier,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []) as ShipmentRecord[];
    },
  });

export const useCreateShipment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      shipment: Omit<
        ShipmentRecord,
        'id' | 'created_at' | 'updated_at'
      >,
    ) => {
      if (!shipment.carrier?.trim()) {
        throw new Error(
          'Le transporteur est obligatoire.',
        );
      }

      if (!shipment.destination_address?.trim()) {
        throw new Error(
          'La destination est obligatoire.',
        );
      }

      if (
        shipment.weight_kg !== null &&
        shipment.weight_kg !== undefined &&
        shipment.weight_kg < 0
      ) {
        throw new Error(
          'Le poids ne peut pas être négatif.',
        );
      }

      if (
        shipment.shipping_cost !== null &&
        shipment.shipping_cost !== undefined &&
        shipment.shipping_cost < 0
      ) {
        throw new Error(
          'Le coût de transport ne peut pas être négatif.',
        );
      }

      const { data, error } = await db
        .from('shipments')
        .insert({
          ...shipment,
          carrier: shipment.carrier.trim(),
          destination_address:
            shipment.destination_address.trim(),
          tracking_number:
            shipment.tracking_number?.trim() ||
            null,
        })
        .select()
        .single();

      if (error) throw error;

      return data as ShipmentRecord;
    },

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['shipment-records'],
      }),
  });
};

export const useUpdateShipment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ShipmentRecord> & {
      id: string;
    }) => {
      if (!id) {
        throw new Error(
          'Identifiant d’expédition manquant.',
        );
      }

      if (
        updates.weight_kg !== undefined &&
        updates.weight_kg !== null &&
        updates.weight_kg < 0
      ) {
        throw new Error(
          'Le poids ne peut pas être négatif.',
        );
      }

      if (
        updates.shipping_cost !== undefined &&
        updates.shipping_cost !== null &&
        updates.shipping_cost < 0
      ) {
        throw new Error(
          'Le coût de transport ne peut pas être négatif.',
        );
      }

      const patch: Record<string, unknown> = {
        ...updates,
      };

      if (typeof patch.carrier === 'string') {
        patch.carrier = patch.carrier.trim();
      }

      if (
        typeof patch.destination_address ===
        'string'
      ) {
        patch.destination_address =
          patch.destination_address.trim();
      }

      if (
        typeof patch.tracking_number ===
        'string'
      ) {
        patch.tracking_number =
          patch.tracking_number.trim() || null;
      }

      const { data, error } = await db
        .from('shipments')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as ShipmentRecord;
    },

    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['shipment-records'],
      }),
  });
};
```
