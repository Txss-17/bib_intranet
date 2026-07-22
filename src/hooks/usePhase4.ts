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
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  transport_mode: string | null;
  accommodation: string | null;
  notes: string | null;
  mission_report: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const logApproval = async (
  entity_type: string,
  entity_id: string,
  action: string,
  comment?: string,
  metadata?: Record<string, any>,
) => {
  const { data: user } = await supabase.auth.getUser();
  await supabase.from('approval_history' as any).insert({
    entity_type,
    entity_id,
    action,
    actor_id: user.user?.id ?? null,
    comment: comment ?? null,
    metadata: metadata ?? {},
  });
};

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
    mutationFn: async (payload: Partial<BusinessTrip> & { submit?: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      const { submit, ...rest } = payload;
      const status = submit ? 'submitted' : (rest.status ?? 'draft');
      const { data: inserted, error } = await supabase
        .from('business_trips' as any)
        .insert({
          ...rest,
          user_id: user.user?.id,
          status,
          submitted_at: submit ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      if (submit && inserted) {
        await logApproval('business_trip', (inserted as any).id, 'submitted');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Déplacement enregistré' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export const useSubmitTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_trips' as any)
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await logApproval('business_trip', id, 'submitted');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Déplacement soumis pour approbation' });
    },
  });
};

export const useApproveTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('business_trips' as any)
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.user?.id,
        })
        .eq('id', id);
      if (error) throw error;
      await logApproval('business_trip', id, 'approved', comment);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Déplacement approuvé' });
    },
  });
};

export const useRejectTrip = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('business_trips' as any)
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user.user?.id,
          rejection_reason: reason,
        })
        .eq('id', id);
      if (error) throw error;
      await logApproval('business_trip', id, 'rejected', reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business_trips'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Déplacement refusé' });
    },
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
  status: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
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
      const { data: inserted, error } = await supabase
        .from('corporate_card_transactions' as any)
        .insert({
          ...payload,
          user_id: user.user?.id,
          approval_status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      if (inserted) {
        await logApproval('card_transaction', (inserted as any).id, 'submitted');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card_transactions'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Transaction soumise pour approbation' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export const useApproveTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('corporate_card_transactions' as any)
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.user?.id,
        })
        .eq('id', id);
      if (error) throw error;
      await logApproval('card_transaction', id, 'approved', comment);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card_transactions'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Transaction approuvée' });
    },
  });
};

export const useRejectTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('corporate_card_transactions' as any)
        .update({
          approval_status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user.user?.id,
          rejection_reason: reason,
        })
        .eq('id', id);
      if (error) throw error;
      await logApproval('card_transaction', id, 'rejected', reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card_transactions'] });
      qc.invalidateQueries({ queryKey: ['approval_history'] });
      toast({ title: 'Transaction refusée' });
    },
  });
};

export const useApprovalHistory = (entity_type?: string, entity_id?: string) =>
  useQuery({
    queryKey: ['approval_history', entity_type, entity_id],
    enabled: !!entity_id,
    queryFn: async () => {
      let q = supabase.from('approval_history' as any).select('*').order('created_at', { ascending: false });
      if (entity_type) q = q.eq('entity_type', entity_type);
      if (entity_id) q = q.eq('entity_id', entity_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
