import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Only explicit, active membership in the signed-in RH manager's own case
 * portfolio qualifies an employee for the RH directory and files UI.
 * Never fall back to the company-wide profiles table when this check fails.
 */
export function useMyRhEmployeePortfolioScope() {
  const { user, profile, loading } = useAuth();
  const authorized = !loading && !!user?.id && profile?.id === user.id
    && profile.app_origin === 'connect' && profile.hr_status === 'active'
    && !profile.test_account && (profile.poles ?? []).includes('rh');

  const query = useQuery({
    queryKey: ['rh-my-employee-portfolio-ids', user?.id],
    enabled: authorized,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.rpc('rh_my_portfolio_employee_ids' as never);
      if (error) throw error;
      return [...new Set(((data ?? []) as Array<{ employee_id: string }>)
        .map(row => row.employee_id).filter(Boolean))];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  return {
    ids: authorized && query.isSuccess ? query.data : [],
    ready: authorized && query.isSuccess,
    loading: loading || (authorized && query.isPending),
    error: !loading && (!authorized || query.isError),
    refetch: query.refetch,
  };
}
