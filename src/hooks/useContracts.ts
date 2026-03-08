import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  value: string | null;
  status: string;
  party: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useContracts = (search?: string) => {
  return useQuery({
    queryKey: ['contracts', search],
    queryFn: async () => {
      let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Contract[];
    },
  });
};

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('contracts').insert(contract).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
};

export const useUpdateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase.from('contracts').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
};
