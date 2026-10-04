import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Merchant = {
  id: string;
  platform_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  payment_status: string | null;
  risk_level: string | null;
  revenue: number | null;
  trustpilot_rating: number | null;
  last_order_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MerchantPortfolio = {
  id: string;
  name: string;
  owner_id: string | null;
  role_scope: string;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantAssignment = {
  id: string;
  merchant_id: string;
  portfolio_id: string;
  assigned_by: string | null;
  assigned_at: string;
  ended_at: string | null;
  reason: string | null;
};

export type MarketplaceShop = {
  id: string;
  platform_id: string | null;
  shop_code: string;
  name: string;
  slug: string | null;
  merchant_id: string | null;
  activity_type: string | null;
  activity_description: string | null;
  website_url: string | null;
  country: string | null;
  category: string | null;
  status:
    | 'draft'
    | 'application'
    | 'review'
    | 'active'
    | 'inactive'
    | 'suspended'
    | 'closed';
  subscription_plan: string | null;
  commission_rate: number | null;
  activated_at: string | null;
  inactive_at: string | null;
  suspended_at: string | null;
  closed_at: string | null;
  suspension_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceDocument = {
  id: string;
  document_name: string;
  document_type: string;
  confidentiality_level: string;
  drive_file_id: string | null;
  drive_url: string | null;
  merchant_id: string | null;
  shop_id: string | null;
  related_pole: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  status: string;
  imported_from_drive: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantCommunication = {
  id: string;
  merchant_id: string;
  shop_id: string | null;
  portfolio_id: string | null;
  template_id: string | null;
  situation: string;
  recipient: string;
  subject: string;
  body: string;
  signature: string;
  sent_by: string | null;
  sent_at: string | null;
  status: 'draft' | 'sent' | 'failed' | 'cancelled';
  gateway_message_ref: string | null;
  created_at: string;
  updated_at: string;
};

const SHOP_FIELDS = `
  id,
  platform_id,
  shop_code,
  name,
  slug,
  merchant_id,
  activity_type,
  activity_description,
  website_url,
  country,
  category,
  status,
  subscription_plan,
  commission_rate,
  activated_at,
  inactive_at,
  suspended_at,
  closed_at,
  suspension_reason,
  notes,
  created_at,
  updated_at
`;

export function useMarketplaceMerchants(search = '') {
  return useQuery({
    queryKey: ['marketplace', 'merchants', search],
    queryFn: async () => {
      let query = supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        const term = search.trim();
        query = query.or(
          `company_name.ilike.%${term}%,contact_name.ilike.%${term}%,contact_email.ilike.%${term}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data ?? []) as Merchant[];
    },
  });
}

export function useMarketplaceMerchant(merchantId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'merchant', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('id', merchantId!)
        .single();

      if (error) throw error;

      return data as Merchant;
    },
  });
}

export function useMerchantShops(merchantId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'merchant-shops', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select(SHOP_FIELDS)
        .eq('merchant_id', merchantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as MarketplaceShop[];
    },
  });
}

export function useMarketplaceShops() {
  return useQuery({
    queryKey: ['marketplace', 'shops'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select(SHOP_FIELDS)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as MarketplaceShop[];
    },
  });
}

export function useMarketplaceShop(shopId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'shop', shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shops')
        .select(SHOP_FIELDS)
        .eq('id', shopId!)
        .single();

      if (error) throw error;

      return data as MarketplaceShop;
    },
  });
}

export function useMerchantPortfolio(merchantId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'portfolio-assignment', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('merchant_portfolio_assignments')
        .select(`
          id,
          merchant_id,
          portfolio_id,
          assigned_by,
          assigned_at,
          ended_at,
          reason,
          merchant_portfolios (
            id,
            name,
            owner_id,
            role_scope,
            status,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq('merchant_id', merchantId!)
        .is('ended_at', null)
        .maybeSingle();

      if (error) throw error;

      return data ?? null;
    },
  });
}

export function useMarketplacePortfolios() {
  return useQuery({
    queryKey: ['marketplace', 'portfolios'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('merchant_portfolios')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return (data ?? []) as MerchantPortfolio[];
    },
  });
}

export function useAssignMerchantPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      merchantId,
      portfolioId,
      reason,
    }: {
      merchantId: string;
      portfolioId: string;
      reason?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { error: closeError } = await (supabase as any)
        .from('merchant_portfolio_assignments')
        .update({
          ended_at: new Date().toISOString(),
          reason: reason || 'Réaffectation du portefeuille',
        })
        .eq('merchant_id', merchantId)
        .is('ended_at', null);

      if (closeError) throw closeError;

      const { error } = await (supabase as any)
        .from('merchant_portfolio_assignments')
        .insert({
          merchant_id: merchantId,
          portfolio_id: portfolioId,
          assigned_by: user.user?.id ?? null,
          reason: reason || null,
        });

      if (error) throw error;
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['marketplace', 'portfolio-assignment', variables.merchantId],
      });

      queryClient.invalidateQueries({
        queryKey: ['marketplace', 'portfolios'],
      });

      toast.success('Portefeuille marchand mis à jour.');
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useShopDocuments(shopId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'shop-documents', shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('shop_activity_documents')
        .select('*')
        .eq('shop_id', shopId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data ?? [];
    },
  });
}

export function useMerchantCommunications(merchantId?: string) {
  return useQuery({
    queryKey: ['marketplace', 'communications', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('merchant_communications')
        .select('*')
        .eq('merchant_id', merchantId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as MerchantCommunication[];
    },
  });
}

export function useMerchantCommunicationTemplates() {
  return useQuery({
    queryKey: ['marketplace', 'communication-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('merchant_communication_templates')
        .select('*')
        .eq('active', true)
        .order('label', { ascending: true });

      if (error) throw error;

      return data ?? [];
    },
  });
}
