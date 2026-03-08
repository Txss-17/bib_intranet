import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Dispute {
  id: string;
  dispute_number: string;
  subject: string;
  party: string;
  type: string;
  amount: string | null;
  priority: string;
  status: string;
  description: string | null;
  open_date: string | null;
  resolved_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useDisputes = (search?: string) => {
  return useQuery({
    queryKey: ['disputes', search],
    queryFn: async () => {
      let query = supabase.from('disputes').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`subject.ilike.%${search}%,party.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Dispute[];
    },
  });
};

export const useCreateDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dispute: Omit<Dispute, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('disputes').insert(dispute).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
};

export const useUpdateDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Dispute> & { id: string }) => {
      const { data, error } = await supabase.from('disputes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disputes'] }),
  });
};
