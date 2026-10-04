import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ShopActivityDocumentStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export interface ShopActivityDocument {
  id: string;
  shop_id: string;

  document_type: string;
  title: string;

  document_url: string | null;

  status: ShopActivityDocumentStatus;

  issued_at: string | null;
  expires_at: string | null;

  reviewed_by: string | null;
  reviewed_at: string | null;

  rejection_reason: string | null;

  metadata: Record<string, unknown>;

  created_at: string;
  updated_at: string;
}

export const SHOP_ACTIVITY_DOCUMENT_STATUS_LABELS: Record<
  ShopActivityDocumentStatus,
  string
> = {
  pending: 'À vérifier',
  approved: 'Validé',
  rejected: 'Rejeté',
};

export const useShopActivityDocuments = (
  shopId?: string,
) =>
  useQuery({
    queryKey: [
      'shops',
      'activity-documents',
      shopId,
    ],

    enabled: !!shopId,

    queryFn: async () => {
      const db = supabase as any;

      const {
        data,
        error,
      } = await db
        .from('shop_activity_documents')
        .select(`
          id,
          shop_id,
          document_type,
          title,
          document_url,
          status,
          issued_at,
          expires_at,
          reviewed_by,
          reviewed_at,
          rejection_reason,
          metadata,
          created_at,
          updated_at
        `)
        .eq('shop_id', shopId!)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as ShopActivityDocument[];
    },
  });

export const useReviewShopActivityDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      documentId: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      const {
        documentId,
        status,
        rejectionReason,
      } = params;

      if (
        status === 'rejected' &&
        !rejectionReason?.trim()
      ) {
        throw new Error(
          'Une justification est obligatoire pour rejeter un document.',
        );
      }

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'Utilisateur non authentifié.',
        );
      }

      const db = supabase as any;

      const {
        error,
      } = await db
        .from('shop_activity_documents')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at:
            new Date().toISOString(),
          rejection_reason:
            status === 'rejected'
              ? rejectionReason!.trim()
              : null,
        })
        .eq('id', documentId);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'shops',
          'activity-documents',
        ],
      });

      toast.success(
        'Document mis à jour',
      );
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
