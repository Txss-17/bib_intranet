import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MediaAttachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string | null;
}

const from = (table: string) => (supabase as any).from(table);

export const useMediaAttachments = (entityType: string, entityId?: string) => {
  return useQuery({
    queryKey: ['media_attachments', entityType, entityId],
    queryFn: async () => {
      let query = from('media_attachments').select('*').eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MediaAttachment[];
    },
    enabled: !!entityType,
  });
};

export const useSaveMediaAttachments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityType, entityId, files }: {
      entityType: string;
      entityId: string;
      files: { name: string; url: string; type: string; size: number }[];
    }) => {
      // Do not insert a new attachment set when deletion was rejected by
      // permissions, otherwise the user may see duplicate or stale documents.
      // A fully atomic replacement still requires a server-side transaction.
      const { error: deleteError } = await from('media_attachments')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
      if (deleteError) throw deleteError;

      if (files.length === 0) return [];
      
      const rows = files.map(f => ({
        entity_type: entityType,
        entity_id: entityId,
        file_name: f.name,
        file_url: f.url,
        file_type: f.type,
        file_size: f.size,
      }));
      
      const { data, error } = await from('media_attachments').insert(rows).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['media_attachments', vars.entityType] });
    },
  });
};
