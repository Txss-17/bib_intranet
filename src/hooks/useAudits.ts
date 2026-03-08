import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OpsAudit {
  id: string;
  process: string;
  scope: string;
  auditor: string;
  date: string;
  status: string;
  score: number | null;
  recommendations: number | null;
  findings: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SupplierAudit {
  id: string;
  supplier: string;
  category: string;
  auditor: string;
  date: string;
  status: string;
  score: number | null;
  findings: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Ops Audits
export const useOpsAudits = (search?: string) => {
  return useQuery({
    queryKey: ['ops-audits', search],
    queryFn: async () => {
      let query = supabase.from('ops_audits').select('*').order('date', { ascending: false });
      if (search) {
        query = query.or(`process.ilike.%${search}%,scope.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as OpsAudit[];
    },
  });
};

export const useCreateOpsAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (audit: Omit<OpsAudit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('ops_audits').insert(audit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ops-audits'] }),
  });
};

export const useUpdateOpsAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OpsAudit> & { id: string }) => {
      const { data, error } = await supabase.from('ops_audits').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ops-audits'] }),
  });
};

// Supplier Audits
export const useSupplierAudits = (search?: string) => {
  return useQuery({
    queryKey: ['supplier-audits', search],
    queryFn: async () => {
      let query = supabase.from('supplier_audits').select('*').order('date', { ascending: false });
      if (search) {
        query = query.or(`supplier.ilike.%${search}%,category.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as SupplierAudit[];
    },
  });
};

export const useCreateSupplierAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (audit: Omit<SupplierAudit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('supplier_audits').insert(audit).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-audits'] }),
  });
};

export const useUpdateSupplierAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierAudit> & { id: string }) => {
      const { data, error } = await supabase.from('supplier_audits').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supplier-audits'] }),
  });
};
