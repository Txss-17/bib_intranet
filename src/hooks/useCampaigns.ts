import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { readAllPages } from '@/lib/operationsMetrics';

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
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['campaigns', user?.id, profile?.test_account === true, search],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows = await readAllPages<Campaign>(cursor => {
        let query = from('campaigns').select('*').order('id').limit(500);
        if (search) query = query.or(`name.ilike.%${search}%,type.ilike.%${search}%`);
        if (cursor) query = query.gt('id', cursor);
        return query;
      });
      return rows.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
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
