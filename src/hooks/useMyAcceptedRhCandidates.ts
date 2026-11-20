import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AcceptedRhCandidate = {
 id: string;
 full_name: string;
 email: string | null;
 position_key: string;
 owner_id: string;
};

/** Only accepted applications explicitly owned by the signed-in HR agent. */
export function useMyAcceptedRhCandidates(enabled = true) {
 const { user, profile, loading } = useAuth();
 const isHr = !!user && !!profile && profile.id === user.id &&
   profile.app_origin === 'connect' && !profile.test_account &&
   profile.hr_status === 'active' && (profile.poles ?? []).includes('rh');
 return useQuery({
   queryKey: ['my-accepted-rh-candidates', user?.id],
   enabled: enabled && !loading && isHr,
   staleTime: 20_000,
   queryFn: async (): Promise<AcceptedRhCandidate[]> => {
     const { data, error } = await supabase.from('hr_candidates')
       .select('id,full_name,email,position_key,owner_id')
       .eq('owner_id', user!.id).eq('status','accepted').order('created_at',{ascending:false}).limit(200);
     if (error) throw error;
     return (data ?? []) as AcceptedRhCandidate[];
   }
 });
}
