import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformSyncRun {
  id: string;
  direction: 'pull' | 'push';
  action: string;
  status: 'running' | 'success' | 'partial' | 'error';
  items_count: number;
  errors: string[];
  started_at: string;
  finished_at: string | null;
}

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('platform-bridge', { body });
  if (error) {
    let msg = error.message;
    try { const ctx = await (error as any).context?.json?.(); if (ctx?.error) msg = typeof ctx.error === 'string' ? ctx.error : JSON.stringify(ctx.error); } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
};

export const usePlatformStatus = () =>
  useQuery({
    queryKey: ['platform-bridge-status'],
    queryFn: async () => (await invoke({ action: 'status' })) as { configured: boolean },
    retry: false,
  });

export const usePlatformSyncRuns = () =>
  useQuery({
    queryKey: ['platform-sync-runs'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('platform_sync_runs').select('*').order('started_at', { ascending: false }).limit(20);
      if (error) throw error;
      return (data || []) as PlatformSyncRun[];
    },
  });

export const usePlatformActions = () => {
  const qc = useQueryClient();
  const done = () => {
    ['platform-sync-runs', 'shops', 'orders', 'products', 'validated-products'].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }));
  };
  const onError = (e: Error) => toast.error('Liaison B.I.B Platform', { description: e.message });

  const pull = useMutation({
    mutationFn: () => invoke({ action: 'pull' }),
    onSuccess: (d: any) => { toast.success(`Synchronisation terminée — ${d.items} élément(s)`, { description: d.errors?.length ? `${d.errors.length} anomalie(s)` : undefined }); done(); },
    onError, onSettled: done,
  });
  const pushProduct = useMutation({
    mutationFn: (product_id: string) => invoke({ action: 'push_product', product_id }),
    onSuccess: () => { toast.success('Produit publié au catalogue B.I.B Platform'); done(); },
    onError, onSettled: done,
  });
  const pushShopStatus = useMutation({
    mutationFn: (shop_id: string) => invoke({ action: 'push_shop_status', shop_id }),
    onSuccess: () => { toast.success('Statut transmis à B.I.B Platform'); done(); },
    onError, onSettled: done,
  });
  return { pull, pushProduct, pushShopStatus };
};
