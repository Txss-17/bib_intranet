import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlatformSyncDetails {
  pull?: {
    received?: {
      merchants?: number;
      boutiques?: number;
      orders?: number;
      tickets?: number;
      supplier_applications?: number;
      financials?: number;
      customer_favorites?: {
        total?: number;
        products?: number;
        boutiques?: number;
      };
    };
  };

  favorites?: {
    mode?: 'full_snapshot' | string;
    received?: number;
    products?: number;
    boutiques?: number;
    snapshot_replaced?: boolean;
  };

  summary?: {
    items_count?: number;
    errors_count?: number;
    duration_ms?: number;
  };

  [key: string]: unknown;
}

export interface PlatformSyncRun {
  id: string;
  direction: 'pull' | 'push';
  action: string;
  status: 'running' | 'success' | 'partial' | 'error';
  items_count: number;
  errors: string[];
  details: PlatformSyncDetails | null;
  started_at: string;
  finished_at: string | null;
}

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(
    'platform-bridge',
    { body },
  );

  if (error) {
    let msg = error.message;

    try {
      const ctx = await (error as any).context?.json?.();

      if (ctx?.error) {
        msg =
          typeof ctx.error === 'string'
            ? ctx.error
            : JSON.stringify(ctx.error);
      }
    } catch {
      // Ignore parsing errors.
    }

    throw new Error(msg);
  }

  return data;
};

export const usePlatformStatus = () =>
  useQuery({
    queryKey: ['platform-bridge-status'],

    queryFn: async () =>
      (await invoke({
        action: 'status',
      })) as {
        configured: boolean;
      },

    retry: false,
  });

export const usePlatformSyncRuns = () =>
  useQuery({
    queryKey: ['platform-sync-runs'],

    queryFn: async () => {
      const {
        data,
        error,
      } = await (supabase as any)
        .from('platform_sync_runs')
        .select('*')
        .order('started_at', {
          ascending: false,
        })
        .limit(20);

      if (error) {
        throw error;
      }

      return (data || []) as PlatformSyncRun[];
    },
  });

export const usePlatformActions = () => {
  const qc = useQueryClient();

  const done = () => {
    [
      'platform-sync-runs',
      'shops',
      'orders',
      'products',
      'validated-products',
      'marketplace-customer-favorites',
    ].forEach((key) =>
      qc.invalidateQueries({
        queryKey: [key],
      }),
    );
  };

  const onError = (error: Error) => {
    toast.error(
      'Liaison B.I.B Platform',
      {
        description: error.message,
      },
    );
  };

  const pull = useMutation({
    mutationFn: () =>
      invoke({
        action: 'pull',
      }),

    onSuccess: (data: any) => {
      const errors =
        Array.isArray(data?.errors)
          ? data.errors
          : [];

      toast.success(
        'Synchronisation terminée',
        {
          description:
            `${data?.items ?? 0} élément(s) synchronisé(s)` +
            (errors.length
              ? ` · ${errors.length} anomalie(s)`
              : ''),
        },
      );

      done();
    },

    onError,

    onSettled: done,
  });

  const pushProduct = useMutation({
    mutationFn: (
      product_id: string,
    ) =>
      invoke({
        action: 'push_product',
        product_id,
      }),

    onSuccess: () => {
      toast.success(
        'Produit publié au catalogue B.I.B Platform',
      );

      done();
    },

    onError,

    onSettled: done,
  });

  const pushShopStatus = useMutation({
    mutationFn: (
      shop_id: string,
    ) =>
      invoke({
        action: 'push_shop_status',
        shop_id,
      }),

    onSuccess: () => {
      toast.success(
        'Statut transmis à B.I.B Platform',
      );

      done();
    },

    onError,

    onSettled: done,
  });

  return {
    pull,
    pushProduct,
    pushShopStatus,
  };
};