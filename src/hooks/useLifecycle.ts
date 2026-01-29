import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserAccount = Database['public']['Tables']['user_accounts']['Row'];
type UserAccountInsert = Database['public']['Tables']['user_accounts']['Insert'];
type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];
type Order = Database['public']['Tables']['orders']['Row'];

// ============== USER ACCOUNTS ==============

export const useUserAccounts = (options?: {
  subscriptionStatus?: string;
  riskLevel?: string;
  paymentStatus?: string;
  search?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['user-accounts', options],
    queryFn: async () => {
      let query = supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.subscriptionStatus) {
        query = query.eq('subscription_status', options.subscriptionStatus);
      }
      if (options?.riskLevel) {
        query = query.eq('risk_level', options.riskLevel);
      }
      if (options?.paymentStatus) {
        query = query.eq('payment_status', options.paymentStatus);
      }
      if (options?.search) {
        query = query.or(`company_name.ilike.%${options.search}%,contact_email.ilike.%${options.search}%`);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserAccount[];
    },
  });
};

export const useUserAccountStats = () => {
  return useQuery({
    queryKey: ['user-account-stats'],
    queryFn: async () => {
      const { data: accounts, error } = await supabase
        .from('user_accounts')
        .select('*');

      if (error) throw error;

      const total = accounts?.length || 0;
      const active = accounts?.filter(a => a.subscription_status === 'active') || [];
      const atRisk = accounts?.filter(a => a.risk_level === 'high' || a.risk_level === 'critical') || [];
      const unpaid = accounts?.filter(a => a.payment_status === 'overdue') || [];

      const totalRevenue = accounts?.reduce((sum, a) => sum + (a.revenue || 0), 0) || 0;
      const avgRating = accounts?.length 
        ? accounts.reduce((sum, a) => sum + (a.trustpilot_rating || 0), 0) / accounts.length 
        : 0;

      return {
        totalUsers: total,
        activeUsers: active.length,
        atRiskUsers: atRisk.length,
        unpaidUsers: unpaid.length,
        totalRevenue,
        averageRating: Math.round(avgRating * 10) / 10,
        mrr: totalRevenue / 12, // Simplified MRR calculation
      };
    },
  });
};

export const useAtRiskUsers = () => {
  return useQuery({
    queryKey: ['at-risk-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .or('risk_level.eq.high,risk_level.eq.critical,payment_status.eq.overdue')
        .order('risk_level', { ascending: false });

      if (error) throw error;
      return data as UserAccount[];
    },
  });
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
      queryClient.invalidateQueries({ queryKey: ['at-risk-users'] });
    },
  });
};

// ============== SUPPORT TICKETS ==============

export const useSupportTickets = (options?: {
  status?: string;
  priority?: string;
  category?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['support-tickets', options],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          user_account:user_account_id (
            id,
            company_name,
            contact_email
          )
        `)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useSupportTicketStats = () => {
  return useQuery({
    queryKey: ['support-ticket-stats'],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*');

      if (error) throw error;

      const open = tickets?.filter(t => t.status === 'open') || [];
      const pending = tickets?.filter(t => t.status === 'pending') || [];
      const resolved = tickets?.filter(t => t.status === 'resolved') || [];
      const highPriority = tickets?.filter(t => t.priority === 'high' || t.priority === 'critical') || [];

      // Calculate average response time (simplified)
      const resolvedWithTime = resolved.filter(t => t.created_at && t.resolved_at);
      let avgResponseHours = 0;
      if (resolvedWithTime.length > 0) {
        const totalHours = resolvedWithTime.reduce((sum, t) => {
          const created = new Date(t.created_at!);
          const resolved = new Date(t.resolved_at!);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0);
        avgResponseHours = totalHours / resolvedWithTime.length;
      }

      return {
        totalTickets: tickets?.length || 0,
        openTickets: open.length,
        pendingTickets: pending.length,
        resolvedTickets: resolved.length,
        highPriorityTickets: highPriority.length,
        avgResponseTime: `${Math.round(avgResponseHours)}h`,
      };
    },
  });
};

export const useUpdateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupportTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
    },
  });
};

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: SupportTicketInsert) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
    },
  });
};

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

        if (account.payment_status === 'overdue') {
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
