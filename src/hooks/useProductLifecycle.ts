import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type LifecycleStatus =
  | 'draft'
  | 'review'
  | 'audit_required'
  | 'audit'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'suspended'
  | 'archived';

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

export const LIFECYCLE_TRANSITIONS: Record<
  LifecycleStatus,
  LifecycleStatus[]
> = {
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
  reason: string;
  decision_type: string;
  decision_by: string;
  decision_at: string;
}

const db = supabase as any;

export const useLifecycleProducts = () =>
  useQuery({
    queryKey: ['product-lifecycle'],
    queryFn: async () => {
      const { data, error } = await db
        .from('products')
        .select(
          `
            id,
            name,
            sku,
            category,
            status,
            lifecycle_status,
            unit_price,
            selling_price,
            margin,
            moq,
            currency,
            supplier_id,
            rejection_reason,
            created_at,
            suppliers(name)
          `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((product: any) => ({
        ...product,
        supplier_name: product.suppliers?.name ?? null,
      })) as LifecycleProduct[];
    },
  });

export const useProductDecisions = (productId?: string) =>
  useQuery({
    queryKey: ['product-decisions', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await db
        .from('product_decisions')
        .select(
          `
            id,
            previous_status,
            new_status,
            reason,
            decision_type,
            decision_by,
            decision_at
          `,
        )
        .eq('product_id', productId)
        .order('decision_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as ProductDecision[];
    },
  });

const getDecisionType = (
  from: LifecycleStatus,
  to: LifecycleStatus,
): string => {
  if (to === 'rejected') return 'rejection';
  if (to === 'archived') return 'archive';

  if (from === 'rejected' && to === 'draft') {
    return 'reactivation';
  }

  if (to === 'approved' || to === 'active') {
    return 'validation';
  }

  return 'validation';
};

export const useLifecycleActions = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = async (productId?: string) => {
    await Promise.all([
      qc.invalidateQueries({
        queryKey: ['product-lifecycle'],
      }),
      qc.invalidateQueries({
        queryKey: ['product-decisions'],
      }),
      productId
        ? qc.invalidateQueries({
            queryKey: ['product-decisions', productId],
          })
        : Promise.resolve(),
    ]);
  };

  const move = useMutation({
    mutationFn: async ({
      id,
      to,
      reason,
    }: {
      id: string;
      to: LifecycleStatus;
      reason?: string;
    }) => {
      if (!user?.id) {
        throw new Error(
          'Utilisateur non authentifié. Impossible d’enregistrer la décision.',
        );
      }

      /*
       * 1. Récupération du statut réel en base.
       * Cela évite de valider une transition à partir d'un état
       * potentiellement obsolète affiché dans l'interface.
       */
      const { data: product, error: productError } = await db
        .from('products')
        .select(
          `
            id,
            lifecycle_status,
            rejection_reason
          `,
        )
        .eq('id', id)
        .single();

      if (productError) throw productError;

      const currentStatus = product.lifecycle_status as LifecycleStatus;

      /*
       * 2. Vérification de la transition autorisée.
       */
      const allowedTransitions =
        LIFECYCLE_TRANSITIONS[currentStatus] ?? [];

      if (!allowedTransitions.includes(to)) {
        throw new Error(
          `Transition impossible : ${LIFECYCLE_LABELS[currentStatus]} → ${LIFECYCLE_LABELS[to]}.`,
        );
      }

      /*
       * 3. Une justification est obligatoire pour un refus.
       */
      const normalizedReason = reason?.trim() ?? '';

      if (to === 'rejected' && !normalizedReason) {
        throw new Error(
          'Une justification est obligatoire pour refuser un produit.',
        );
      }

      /*
       * 4. Préparation de la mise à jour du produit.
       */
      const productPatch: Record<string, unknown> = {
        lifecycle_status: to,
      };

      if (to === 'rejected') {
        productPatch.rejection_reason = normalizedReason;
      } else if (currentStatus === 'rejected' && to === 'draft') {
        productPatch.rejection_reason = null;
      }

      /*
       * 5. Mise à jour du produit.
       */
      const { error: updateError } = await db
        .from('products')
        .update(productPatch)
        .eq('id', id)
        .eq('lifecycle_status', currentStatus);

      if (updateError) throw updateError;

      /*
       * 6. Création d'une vraie entrée d'historique.
       *
       * product_decisions exige :
       * - decision_type
       * - decision_by
       * - reason
       */
      const decisionType = getDecisionType(currentStatus, to);

      const decisionReason =
        normalizedReason ||
        `Transition du cycle produit : ${LIFECYCLE_LABELS[currentStatus]} → ${LIFECYCLE_LABELS[to]}.`;

      const { error: decisionError } = await db
        .from('product_decisions')
        .insert({
          product_id: id,
          decision_type: decisionType,
          previous_status: currentStatus,
          new_status: to,
          decision_by: user.id,
          decision_at: new Date().toISOString(),
          reason: decisionReason,
          details: {
            source: 'ops_product_lifecycle',
            from: currentStatus,
            to,
          },
        });

      /*
       * Le produit a déjà été modifié.
       * Si l'insertion de l'historique échoue, on tente donc
       * immédiatement de restaurer son statut précédent.
       */
      if (decisionError) {
        await db
          .from('products')
          .update({
            lifecycle_status: currentStatus,
            rejection_reason: product.rejection_reason ?? null,
          })
          .eq('id', id);

        throw decisionError;
      }

      return {
        id,
        previousStatus: currentStatus,
        newStatus: to,
      };
    },

    onSuccess: async (result) => {
      await invalidate(result.id);

      toast.success(
        `Étape : ${LIFECYCLE_LABELS[result.newStatus as LifecycleStatus]}`,
      );
    },

    onError: (error: Error) => {
      toast.error('Cycle de vie produit', {
        description:
          error.message ||
          'Impossible de mettre à jour le cycle de vie du produit.',
      });
    },
  });

  return {
    move,
  };
};
```
