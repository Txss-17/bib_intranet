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
      const { data, error } = await (supabase as any)
        .from('supplier_catalog_uploads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SupplierCatalogUpload[];
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
      const { error } = await (supabase as any).from('supplier_catalog_uploads').update(patch).eq('id', id);
      if (error) throw error;

      // Notify supplier portal
      if (status === 'approved' || status === 'rejected') {
        await (supabase as any).from('supplier_portal_notifications').insert({
          supplier_id: supplierId,
          type: 'catalog_review',
          title: status === 'approved' ? 'Catalogue approuvé' : 'Catalogue refusé',
          body: notes ?? null,
          reference_table: 'supplier_catalog_uploads',
          reference_id: id,
        });
      }
    },
    onSuccess: () => {
      toast.success('Décision enregistrée');
      qc.invalidateQueries({ queryKey: ['supplier_catalog_uploads'] });
    },
    onError: (e: any) => toast.error('Erreur', { description: e.message }),
  });
}
