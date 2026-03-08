import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  name: string;
  email: string;
  pole: string;
  position: string;
  status: string;
  start_date: string | null;
  phone: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const from = (table: string) => (supabase as any).from(table);

export const useEmployees = (search?: string) => {
  return useQuery({
    queryKey: ['employees', search],
    queryFn: async () => {
      let query = from('employees').select('*').order('name');
      if (search) {
        query = query.or(`name.ilike.%${search}%,pole.ilike.%${search}%,position.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Employee[];
    },
  });
};

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await from('employees').insert(employee).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Employee> & { id: string }) => {
      const { data, error } = await from('employees').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
};
