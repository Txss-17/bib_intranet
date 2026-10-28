import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmployeePosition, positionInfos } from '@/types/positions';
import { resolvePositionAccess } from '@/data/positionAccess';
import { PoleId } from '@/types';
import { useViewAs } from '@/hooks/useViewAs';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface UsePositionReturn {
  position: EmployeePosition | undefined;
  positionInfo: typeof positionInfos[EmployeePosition] | undefined;
  isLoading: boolean;
  canAccessPole: (poleId: PoleId) => boolean;
  canAccessScreen: (screenId: string) => boolean;
  accessiblePoles: PoleId[];
  simulatedRoleLabel?: string;
}

interface PositionProfile {
  position: unknown;
  poles: unknown;
}

export const usePosition = (): UsePositionReturn => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: rolesLoading } = useUserRole();
  const { role: simulatedRole } = useViewAs();
  const profile = useQuery({
    queryKey: ['position-access-profile', user?.id],
    enabled: !!user?.id,
    staleTime: 15_000,
    retryOnMount: false,
    refetchInterval: 30_000,
    queryFn: async (): Promise<PositionProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('position, poles')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
  const isLoading = authLoading || (!!user?.id && (profile.isLoading || rolesLoading));
  const access = resolvePositionAccess({
    authenticated: !!user?.id,
    loading: isLoading,
    position: profile.isError ? undefined : profile.data?.position,
    poles: profile.isError ? [] : profile.data?.poles,
    isAdmin,
    simulation: simulatedRole,
  });

  return {
    ...access,
    positionInfo: access.position ? positionInfos[access.position] : undefined,
    isLoading,
    simulatedRoleLabel: simulatedRole?.label,
  };
};
