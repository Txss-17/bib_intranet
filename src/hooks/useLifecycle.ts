import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { customerSuccessStats } from '@/lib/customerSuccess';
import type { Database } from '@/integrations/supabase/types';

type UserAccount = Database['public']['Tables']['user_accounts']['Row'];
type UserAccountInsert = Database['public']['Tables']['user_accounts']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];

// ============== USER ACCOUNTS ==============

export const useUserAccounts = (options?: {
  subscriptionStatus?: string;
  riskLevel?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
}) => {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['user-accounts', user?.id, profile?.test_account === true, options],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const rows: UserAccount[] = [];
      let cursor: string | undefined;
      for (;;) {
        let query = supabase.from('user_accounts').select('*').order('id').limit(500);
        if (options?.subscriptionStatus) query = query.eq('subscription_status', options.subscriptionStatus);
        if (options?.riskLevel) query = query.eq('risk_level', options.riskLevel);
        if (options?.paymentStatus === 'current') query = query.in('payment_status', ['ok', 'current']);
        else if (options?.paymentStatus === 'overdue') query = query.in('payment_status', ['overdue', 'critical']);
        else if (options?.paymentStatus) query = query.eq('payment_status', options.paymentStatus);
        if (options?.search) {
          const search = options.search.replace(/[,%()]/g, ' ').trim();
          if (search) query = query.or(`company_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
        }
        if (cursor) query = query.gt('id', cursor);
        const { data, error } = await query;
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < 500) break;
        cursor = data[data.length - 1].id;
      }
      rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '') || b.id.localeCompare(a.id));
      return options?.limit ? rows.slice(0, options.limit) : rows;
    },
  });
};

export const useUserAccountStats = () => {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['user-account-stats', user?.id, profile?.test_account === true], enabled: !!user && !!profile,
    queryFn: async () => {
      type Account = Pick<UserAccount, 'id' | 'company_name' | 'subscription_status' | 'risk_level' | 'payment_status' | 'trustpilot_rating'>;
      const accounts: Account[] = [];
      let cursor: string | undefined;
      for (;;) {
        let query = supabase.from('user_accounts').select('id,company_name,subscription_status,risk_level,payment_status,trustpilot_rating').order('id').limit(500);
        if (cursor) query = query.gt('id', cursor);
        const { data, error } = await query;
        if (error) throw error;
        accounts.push(...(data || []));
        if (!data || data.length < 500) break;
        cursor = data[data.length - 1].id;
      }
      return customerSuccessStats(accounts);
    },
  });
};

export const useAtRiskUsers = () => {
  const accounts = useUserAccounts();
  return { ...accounts, data: accounts.data?.filter(account => account.risk_level === 'high' || account.risk_level === 'critical' || ['late', 'overdue', 'critical'].includes(account.payment_status || '')) };
};

export const useUpdateUserAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['user-account-stats'] });
      queryClient.invalidateQueries({ queryKey: ['account-reputation'] });
      queryClient.invalidateQueries({ queryKey: ['at-risk-users'] });
    },
  });
};

// Support ticket mutations use their server workflow.
export { useSupportTickets, useSupportTicketStats } from '@/hooks/useSupportTickets';

// ============== ORDERS (for lifecycle context) ==============

export const useUserOrders = (userAccountId?: string) => {
  return useQuery({
    queryKey: ['user-orders', userAccountId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('ordered_at', { ascending: false });

      if (userAccountId) {
        query = query.eq('user_account_id', userAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!userAccountId || userAccountId === undefined,
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      const pending = orders?.filter(o => o.status === 'pending') || [];
      const shipped = orders?.filter(o => o.status === 'shipped') || [];
      const delivered = orders?.filter(o => o.status === 'delivered') || [];

      const totalAmount = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      return {
        totalOrders: orders?.length || 0,
        pendingOrders: pending.length,
        shippedOrders: shipped.length,
        deliveredOrders: delivered.length,
        totalRevenue: totalAmount,
      };
    },
  });
};

// ============== RISK ALERTS (computed from user accounts) ==============

export const useRiskAlerts = () => {
  return useQuery({
    queryKey: ['risk-alerts'],
    queryFn: async () => {
      const { data: accounts, error } = await supabase
        .from('user_accounts')
        .select('*')
        .or('risk_level.eq.high,risk_level.eq.critical,payment_status.eq.overdue');

      if (error) throw error;

      // Transform user accounts into risk alerts
      const alerts = (accounts || []).map(account => {
        let alertType = 'inactivity';
        let message = 'Risque détecté';
        let severity = 'medium';

        if (['late', 'overdue', 'critical'].includes(account.payment_status || '')) {
          alertType = 'payment';
          message = 'Paiement en retard';
          severity = account.risk_level === 'critical' ? 'critical' : 'high';
        } else if (account.risk_level === 'critical') {
          alertType = 'stock';
          message = 'Stock non écoulé critique';
          severity = 'critical';
        } else if (account.risk_level === 'high') {
          alertType = 'inactivity';
          message = 'Inactivité prolongée';
          severity = 'high';
        }

        return {
          id: account.id,
          type: alertType,
          company: account.company_name,
          message,
          amount: account.revenue || 0,
          severity,
          date: account.last_order_date || account.created_at,
        };
      });

      return alerts;
    },
  });
};
