import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RiskIncident {
  id: string;
  incident_number: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  assignee: string | null;
  description: string | null;
  opened_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const from = (table: string) => (supabase as any).from(table);

export const useRiskIncidents = (search?: string) => {
  return useQuery({
    queryKey: ['risk-incidents', search],
    queryFn: async () => {
      let query = from('risk_incidents').select('*').order('opened_at', { ascending: false });
      if (search) {
        query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RiskIncident[];
    },
  });
};

export const useCreateRiskIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (incident: Omit<RiskIncident, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await from('risk_incidents').insert(incident).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk-incidents'] }),
  });
};

export const useUpdateRiskIncident = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RiskIncident> & { id: string }) => {
      const { data, error } = await from('risk_incidents').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risk-incidents'] }),
  });
};
