import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'expiring' | 'expired' | 'terminated';

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Brouillon', sent: 'Envoyé', signed: 'Signé', active: 'Actif',
  expiring: 'Expire bientôt', expired: 'Expiré', terminated: 'Résilié',
};

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  type: string;
  shop_id: string | null;
  supplier_id: string | null;
  party: string | null;
  start_date: string | null;
  end_date: string | null;
  value: string | null;
  status: ContractStatus;
  signed_at: string | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  shop?: { id: string; name: string; shop_code: string } | null;
}

export type ContractInput = Partial<Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'shop'>>;

const from = (table: string) => (supabase as any).from(table);

export const useContracts = (search?: string, shopId?: string) => {
  return useQuery({
    queryKey: ['contracts', search, shopId],
    queryFn: async () => {
      let query = from('contracts').select('*, shop:shops(id, name, shop_code)').order('created_at', { ascending: false });
      if (search) query = query.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%`);
      if (shopId) query = query.eq('shop_id', shopId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Contract[];
    },
  });
};

const clean = (c: ContractInput) => {
  const out: any = { ...c };
  ['start_date', 'end_date', 'shop_id', 'supplier_id'].forEach((k) => { if (out[k] === '') out[k] = null; });
  if ((out.status === 'signed' || out.status === 'active') && !out.signed_at) out.signed_at = new Date().toISOString();
  return out;
};

export const useCreateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contract: ContractInput) => {
      const { data, error } = await from('contracts').insert(clean(contract)).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); qc.invalidateQueries({ queryKey: ['shops'] }); },
  });
};

export const useUpdateContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ContractInput & { id: string }) => {
      const { data, error } = await from('contracts').update(clean(updates)).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contracts'] }); qc.invalidateQueries({ queryKey: ['shops'] }); },
  });
};
