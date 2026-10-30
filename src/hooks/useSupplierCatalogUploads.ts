import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SupplierCatalogUpload {
  id: string;
  supplier_id: string;
  submitted_by_email: string | null;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  version: string | null;
  notes: string | null;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSupplierCatalogUploads() {
  return useQuery({
    queryKey: ['supplier_catalog_uploads'],
    queryFn: async () => {
      const pageSize = 500;
      const all: SupplierCatalogUpload[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await (supabase as any)
          .from('supplier_catalog_uploads')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as SupplierCatalogUpload[];
        all.push(...page);
        if (page.length < pageSize) break;
        offset += pageSize;
      }
      return all;
    },
  });
}

export function useReviewCatalogUpload() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status, notes, supplierId }: {
      id: string; status: 'reviewing' | 'approved' | 'rejected'; notes?: string; supplierId: string;
    }) => {
      const patch: any = { status, review_notes: notes ?? null };
      if (status === 'approved' || status === 'rejected') {
        patch.reviewed_at = new Date().toISOString();
        patch.reviewed_by = user?.id;
      }
      // A decision must not silently replace a concurrent decision.
      // RLS remains the authoritative access control; this only adds a
      // compare-and-set guard for eligible catalogue statuses.
      const { data: changed, error } = await (supabase as any)
        .from('supplier_catalog_uploads')
        .update(patch)
        .eq('id', id)
        .in('status', ['pending', 'reviewing'])
        .select('id');
      if (error) throw error;
      if (!changed?.length) {
        throw new Error('Ce catalogue a déjà été traité ou vous ne pouvez pas le modifier. Actualisez la liste.');
      }

      // The catalogue decision is committed before notification. A failed
      // notification must be visible without encouraging a duplicate decision.
      if (status === 'approved' || status === 'rejected') {
        const { error: notificationError } = await (supabase as any)
          .from('supplier_portal_notifications')
          .insert({
            supplier_id: supplierId,
            type: 'catalog_review',
            title: status === 'approved' ? 'Catalogue approuvé' : 'Catalogue refusé',
            body: notes ?? null,
            reference_table: 'supplier_catalog_uploads',
            reference_id: id,
          });
        return { notificationDelivered: !notificationError };
      }
      return { notificationDelivered: true };
    },
    onSuccess: (result) => {
      if (result.notificationDelivered) {
        toast.success('Décision enregistrée');
      } else {
        toast.warning('Décision enregistrée, mais notification fournisseur non transmise. Vérification nécessaire.');
      }
      qc.invalidateQueries({ queryKey: ['supplier_catalog_uploads'] });
    },
    onError: (e: any) => toast.error('Erreur', { description: e.message }),
  });
}
