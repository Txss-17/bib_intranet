import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Cashflow = Database['public']['Tables']['cashflows']['Row'];
type CashflowInsert = Database['public']['Tables']['cashflows']['Insert'];
type SupplierPayment = Database['public']['Tables']['supplier_payments']['Row'];
type SupplierPaymentInsert = Database['public']['Tables']['supplier_payments']['Insert'];
type Salary = Database['public']['Tables']['salaries']['Row'];
type SalaryInsert = Database['public']['Tables']['salaries']['Insert'];
type GuaranteeFundEntry = Database['public']['Tables']['guarantee_fund']['Row'];
type GuaranteeFundInsert = Database['public']['Tables']['guarantee_fund']['Insert'];
type FundraisingRound = Database['public']['Tables']['fundraising_rounds']['Row'];

// ============== CASHFLOWS ==============

export const useCashflows = (options?: { 
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['cashflows', options],
    queryFn: async () => {
      let query = supabase
        .from('cashflows')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
      }
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.startDate) {
        query = query.gte('transaction_date', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('transaction_date', options.endDate);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cashflow[];
    },
  });
};

export const useCashflowStats = () => {
  return useQuery({
    queryKey: ['cashflow-stats'],
    queryFn: async () => {
      const { data: cashflows, error } = await supabase
        .from('cashflows')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const incomes = cashflows?.filter(c => c.type === 'income') || [];
      const expenses = cashflows?.filter(c => c.type === 'expense') || [];

      const totalIncome = incomes.reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalExpense = expenses.reduce((sum, c) => sum + (c.amount || 0), 0);
      const balance = totalIncome - totalExpense;

      // Monthly stats
      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyIncomes = incomes.filter(c => c.transaction_date?.startsWith(thisMonth));
      const monthlyExpenses = expenses.filter(c => c.transaction_date?.startsWith(thisMonth));
      const monthlyIncome = monthlyIncomes.reduce((sum, c) => sum + (c.amount || 0), 0);
      const monthlyExpense = monthlyExpenses.reduce((sum, c) => sum + (c.amount || 0), 0);

      // Burn rate (average monthly expenses over last 3 months)
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const recentExpenses = expenses.filter(c => new Date(c.transaction_date) >= threeMonthsAgo);
      const burnRate = recentExpenses.reduce((sum, c) => sum + (c.amount || 0), 0) / 3;

      // Runway (months of runway at current burn rate)
      const runway = burnRate > 0 ? Math.round(balance / burnRate) : 0;

      return {
        totalIncome,
        totalExpense,
        balance,
        monthlyIncome,
        monthlyExpense,
        burnRate,
        runway,
        transactionCount: cashflows?.length || 0,
      };
    },
  });
};

export const useCreateCashflow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cashflow: CashflowInsert) => {
      const { data, error } = await supabase
        .from('cashflows')
        .insert(cashflow)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashflows'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-stats'] });
    },
  });
};

// ============== SUPPLIER PAYMENTS ==============

export const useSupplierPayments = (options?: {
  status?: string;
  supplierId?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['supplier-payments', options],
    queryFn: async () => {
      let query = supabase
        .from('supplier_payments')
        .select(`
          *,
          suppliers:supplier_id (
            id,
            name,
            contact_email
          )
        `)
        .order('due_date', { ascending: true });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.supplierId) {
        query = query.eq('supplier_id', options.supplierId);
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

export const useSupplierPaymentStats = () => {
  return useQuery({
    queryKey: ['supplier-payment-stats'],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('supplier_payments')
        .select('*');

      if (error) throw error;

      const pending = payments?.filter(p => p.status === 'pending') || [];
      const overdue = payments?.filter(p => p.status === 'overdue') || [];
      const scheduled = payments?.filter(p => p.status === 'scheduled') || [];
      const paid = payments?.filter(p => p.status === 'paid') || [];

      return {
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, p) => sum + (p.amount || 0), 0),
        scheduledCount: scheduled.length,
        scheduledAmount: scheduled.reduce((sum, p) => sum + (p.amount || 0), 0),
        paidCount: paid.length,
        paidAmount: paid.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalCount: payments?.length || 0,
      };
    },
  });
};

export const useUpdateSupplierPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SupplierPayment> & { id: string }) => {
      const { data, error } = await supabase
        .from('supplier_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payment-stats'] });
    },
  });
};

// ============== SALARIES ==============

export const useSalaries = (options?: {
  month?: number;
  year?: number;
  status?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['salaries', options],
    queryFn: async () => {
      let query = supabase
        .from('salaries')
        .select(`
          *,
          employee:employee_id (
            id,
            first_name,
            last_name,
            email,
            position
          )
        `)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (options?.month) {
        query = query.eq('period_month', options.month);
      }
      if (options?.year) {
        query = query.eq('period_year', options.year);
      }
      if (options?.status) {
        query = query.eq('status', options.status);
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

export const useSalaryStats = (year?: number) => {
  const currentYear = year || new Date().getFullYear();
  return useQuery({
    queryKey: ['salary-stats', currentYear],
    queryFn: async () => {
      const { data: salaries, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('period_year', currentYear);

      if (error) throw error;

      const totalGross = salaries?.reduce((sum, s) => sum + (s.gross_amount || 0), 0) || 0;
      const totalNet = salaries?.reduce((sum, s) => sum + (s.net_amount || 0), 0) || 0;
      const totalBonuses = salaries?.reduce((sum, s) => sum + (s.bonuses || 0), 0) || 0;
      const pending = salaries?.filter(s => s.status === 'pending') || [];
      const paid = salaries?.filter(s => s.status === 'paid') || [];

      return {
        yearlyGross: totalGross,
        yearlyNet: totalNet,
        yearlyBonuses: totalBonuses,
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, s) => sum + (s.net_amount || 0), 0),
        paidCount: paid.length,
        averageSalary: salaries?.length ? totalGross / salaries.length : 0,
      };
    },
  });
};

export const useUpdateSalary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Salary> & { id: string }) => {
      const { data, error } = await supabase
        .from('salaries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      queryClient.invalidateQueries({ queryKey: ['salary-stats'] });
    },
  });
};

// ============== GUARANTEE FUND ==============

export const useGuaranteeFund = (options?: {
  type?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['guarantee-fund', options],
    queryFn: async () => {
      let query = supabase
        .from('guarantee_fund')
        .select(`
          *,
          user_account:related_user_id (
            id,
            company_name,
            contact_email
          )
        `)
        .order('transaction_date', { ascending: false });

      if (options?.type) {
        query = query.eq('type', options.type);
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

export const useGuaranteeFundStats = () => {
  return useQuery({
    queryKey: ['guarantee-fund-stats'],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('guarantee_fund')
        .select('*');

      if (error) throw error;

      const deposits = entries?.filter(e => e.type === 'deposit') || [];
      const withdrawals = entries?.filter(e => e.type === 'withdrawal') || [];
      const adjustments = entries?.filter(e => e.type === 'adjustment') || [];

      const totalDeposits = deposits.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalWithdrawals = withdrawals.reduce((sum, e) => sum + (e.amount || 0), 0);
      const adjustmentTotal = adjustments.reduce((sum, e) => sum + (e.amount || 0), 0);
      const balance = totalDeposits - totalWithdrawals + adjustmentTotal;

      return {
        balance,
        totalDeposits,
        totalWithdrawals,
        adjustmentTotal,
        transactionCount: entries?.length || 0,
      };
    },
  });
};

export const useCreateGuaranteeFundEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: GuaranteeFundInsert) => {
      const { data, error } = await supabase
        .from('guarantee_fund')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-fund'] });
      queryClient.invalidateQueries({ queryKey: ['guarantee-fund-stats'] });
    },
  });
};

// ============== FUNDRAISING ==============

export const useFundraisingRounds = () => {
  return useQuery({
    queryKey: ['fundraising-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fundraising_rounds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FundraisingRound[];
    },
  });
};
