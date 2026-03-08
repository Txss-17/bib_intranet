import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  campaign_number: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  budget: string | null;
  spent: string | null;
  status: string;
  target_audience: string | null;
  objective: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const from = (table: string) => (supabase as any).from(table);

export const useCampaigns = (search?: string) => {
  return useQuery({
    queryKey: ['campaigns', search],
    queryFn: async () => {
      let query = from('campaigns').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Campaign[];
    },
  });
};

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await from('campaigns').insert(campaign).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};

export const useUpdateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await from('campaigns').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};
