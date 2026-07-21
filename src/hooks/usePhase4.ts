import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BusinessTrip {
  id: string;
  user_id: string;
  manager_id: string | null;
  purpose: string;
  destination: string;
  start_date: string;
  end_date: string;
  estimated_budget: number | null;
  actual_cost: number | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  transport_mode: string | null;
  accommodation: string | null;
  notes: string | null;
  mission_report: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useBusinessTrips = () =>
  useQuery({
    queryKey: ['business_trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_trips' as any)
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BusinessTrip[];
    },
  });

export const useCreateBusinessTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BusinessTrip>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('business_trips' as any).insert({
        ...payload,
        user_id: user.user?.id,
        status: payload.status ?? 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      toast({ title: 'Déplacement créé', description: 'Demande envoyée pour validation.' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export const useUpdateBusinessTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BusinessTrip> }) => {
      const { error } = await supabase.from('business_trips' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      toast({ title: 'Déplacement mis à jour' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export interface CorporateCard {
  id: string;
  user_id: string;
  card_number_masked: string;
  card_type: string;
  status: 'active' | 'suspended' | 'cancelled';
  monthly_limit: number;
  allowed_categories: string[];
  activated_at: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardTransaction {
  id: string;
  card_id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: string | null;
  merchant: string;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const useCorporateCards = () =>
  useQuery({
    queryKey: ['corporate_cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('corporate_cards' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CorporateCard[];
    },
  });

export const useCardTransactions = (cardId?: string) =>
  useQuery({
    queryKey: ['card_transactions', cardId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('corporate_card_transactions' as any).select('*').order('transaction_date', { ascending: false });
      if (cardId) q = q.eq('card_id', cardId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CardTransaction[];
    },
  });

export const useCreateCardTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CardTransaction>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('corporate_card_transactions' as any).insert({
        ...payload,
        user_id: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card_transactions'] });
      toast({ title: 'Transaction ajoutée' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};
