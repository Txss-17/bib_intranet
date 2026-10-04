import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LifecycleStatus =
  | 'draft' | 'review' | 'audit_required' | 'audit'
  | 'approved' | 'rejected' | 'active' | 'suspended' | 'archived';

export const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  draft: 'Brouillon',
  review: 'En revue',
  audit_required: 'Audit requis',
  audit: 'En audit',
  approved: 'Validé',
  rejected: 'Refusé',
  active: 'Actif',
  suspended: 'Suspendu',
  archived: 'Archivé',
};

export const LIFECYCLE_TRANSITIONS: Record<LifecycleStatus, LifecycleStatus[]> = {
  draft: ['review', 'archived'],
  review: ['audit_required', 'approved', 'rejected', 'draft'],
  audit_required: ['audit', 'rejected'],
  audit: ['approved', 'rejected'],
  approved: ['active', 'archived'],
  rejected: ['draft', 'archived'],
  active: ['suspended', 'archived'],
  suspended: ['active', 'archived'],
  archived: [],
};

export interface LifecycleProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  status: string | null;
  lifecycle_status: LifecycleStatus;
  unit_price: number | null;
  selling_price: number | null;
  margin: number | null;
  moq: number | null;
  currency: string | null;
  supplier_id: string | null;
  supplier_name?: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface ProductDecision {
  id: string;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  decision_at: string;
}

const db = supabase as any;

export const useLifecycleProducts = () =>
  useQuery({
    queryKey: ['product-lifecycle'],
    queryFn: async () => {
      const { data, error } = await db
        .from('products')
        .select('id, name, sku, category, status, lifecycle_status, unit_price, selling_price, margin, moq, currency, supplier_id, rejection_reason, created_at, suppliers(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        supplier_name: p.suppliers?.name ?? null,
      })) as LifecycleProduct[];
    },
  });

export const useProductDecisions = (productId?: string) =>
  useQuery({
    queryKey: ['product-decisions', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await db
        .from('product_decisions')
        .select('id, previous_status, new_status, reason, decision_at')
        .eq('product_id', productId)
        .order('decision_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProductDecision[];
    },
  });

export const useLifecycleActions = () => {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ['product-lifecycle'] });
    qc.invalidateQueries({ queryKey: ['product-decisions'] });
  };
  const onError = (e: Error) => toast.error('Cycle de vie produit', { description: e.message });

  const move = useMutation({
    mutationFn: async ({ id, to, reason }: { id: string; to: LifecycleStatus; reason?: string }) => {
      const patch: any = { lifecycle_status: to };
      if (to === 'rejected' && reason) patch.rejection_reason = reason;
      const { error } = await db.from('products').update(patch).eq('id', id);
      if (error) throw error;
      if (reason) {
        await db
          .from('product_decisions')
          .update({ reason })
          .eq('product_id', id)
          .eq('new_status', to)
          .is('reason', null);
      }
    },
    onSuccess: (_d, v) => {
      toast.success(`Étape : ${LIFECYCLE_LABELS[v.to]}`);
      done();
    },
    onError,
  });

  return { move };
};
