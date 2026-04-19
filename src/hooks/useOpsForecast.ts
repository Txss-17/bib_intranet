import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierLeadTime {
  id: string;
  catalog_id: string;
  supplier_name: string;
  supplier_contact: string | null;
  lead_time_days: number;
  moq: number;
  unit_price: number | null;
  currency: string;
  reliability_score: number;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product_catalog?: { id: string; shop_sku: string; name: string } | null;
}

export interface DemandForecast {
  id: string;
  catalog_id: string;
  region: string | null;
  avg_daily_sales_7d: number;
  projected_sales_7d: number;
  trend_percent: number;
  confidence_level: 'low' | 'medium' | 'high';
  sample_size: number;
  computed_at: string;
  product_catalog?: { id: string; shop_sku: string; name: string } | null;
}

export interface StockThreshold {
  id: string;
  catalog_id: string;
  partner_id: string;
  quantity: number;
  min_threshold: number;
  ideal_stock: number;
  supplier_lead_time_days: number;
  product_catalog?: { id: string; shop_sku: string; name: string } | null;
  logistics_partners?: { id: string; name: string; region: string | null } | null;
}

// ===== QUERIES =====

export const useSupplierLeadTimes = () =>
  useQuery({
    queryKey: ['ops', 'supplier_lead_times'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_lead_times')
        .select('*, product_catalog(id, shop_sku, name)')
        .order('is_primary', { ascending: false })
        .order('reliability_score', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupplierLeadTime[];
    },
  });

export const useDemandForecasts = () =>
  useQuery({
    queryKey: ['ops', 'demand_forecasts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_forecasts')
        .select('*, product_catalog(id, shop_sku, name)')
        .order('computed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DemandForecast[];
    },
  });

export const useStockThresholds = () =>
  useQuery({
    queryKey: ['ops', 'stock_thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_stocks')
        .select('id, catalog_id, partner_id, quantity, min_threshold, ideal_stock, supplier_lead_time_days, product_catalog(id, shop_sku, name), logistics_partners(id, name, region)')
        .order('quantity', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as StockThreshold[];
    },
  });

// ===== MUTATIONS =====

export const useUpdateStockThresholds = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; min_threshold: number; ideal_stock: number; supplier_lead_time_days: number }) => {
      const { error } = await supabase
        .from('partner_stocks')
        .update({
          min_threshold: vars.min_threshold,
          ideal_stock: vars.ideal_stock,
          supplier_lead_time_days: vars.supplier_lead_time_days,
        })
        .eq('id', vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'stock_thresholds'] });
      qc.invalidateQueries({ queryKey: ['ops', 'partner_stocks'] });
      toast.success('Seuils mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpsertSupplierLeadTime = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: Partial<SupplierLeadTime> & { catalog_id: string; supplier_name: string }) => {
      const payload = {
        catalog_id: vars.catalog_id,
        supplier_name: vars.supplier_name,
        supplier_contact: vars.supplier_contact ?? null,
        lead_time_days: vars.lead_time_days ?? 7,
        moq: vars.moq ?? 1,
        unit_price: vars.unit_price ?? null,
        reliability_score: vars.reliability_score ?? 80,
        is_primary: vars.is_primary ?? false,
        notes: vars.notes ?? null,
      };
      if (vars.id) {
        const { error } = await supabase.from('supplier_lead_times').update(payload).eq('id', vars.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('supplier_lead_times').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'supplier_lead_times'] });
      toast.success('Fournisseur enregistré');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteSupplierLeadTime = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_lead_times').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops', 'supplier_lead_times'] });
      toast.success('Fournisseur supprimé');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// ===== RPC ACTIONS =====

export const useRecomputeForecasts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('calculate_demand_forecast');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['ops', 'demand_forecasts'] });
      toast.success(`${count} prévisions mises à jour`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDetectReplenishment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('detect_replenishment_needs');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['ops', 'replenishment'] });
      toast.success(count > 0 ? `${count} suggestions créées` : 'Aucun nouveau besoin détecté');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
