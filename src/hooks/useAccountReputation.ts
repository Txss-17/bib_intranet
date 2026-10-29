import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { accountReputation, ReputationAccount } from '@/lib/accountReputation';

export function useAccountReputation() {
  const { user, profile } = useAuth();
  return useQuery({
    queryKey: ['account-reputation', user?.id, profile?.test_account === true],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const accounts: ReputationAccount[] = [];
      let cursor: string | undefined;
      for (;;) {
        let query = supabase.from('user_accounts').select('id,company_name,trustpilot_rating').order('id').limit(500);
        if (cursor) query = query.gt('id', cursor);
        const { data, error } = await query;
        if (error) throw error;
        accounts.push(...(data || []));
        if (!data || data.length < 500) break;
        cursor = data[data.length - 1].id;
      }
      return accountReputation(accounts);
    },
  });
}
