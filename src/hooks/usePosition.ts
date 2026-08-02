import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmployeePosition, positionInfos } from '@/types/positions';
import { canAccessPole, canAccessScreen, getAccessiblePoles } from '@/data/positionAccess';
import { PoleId } from '@/types';
import { useViewAs } from '@/hooks/useViewAs';

interface UsePositionReturn {
  position: EmployeePosition | undefined;
  positionInfo: typeof positionInfos[EmployeePosition] | undefined;
  isLoading: boolean;
  canAccessPole: (poleId: PoleId) => boolean;
  canAccessScreen: (screenId: string) => boolean;
  accessiblePoles: PoleId[];
  /** Rôle métier simulé via « Visualiser comme », si actif */
  simulatedRoleLabel?: string;
}

export const usePosition = (): UsePositionReturn => {
  const [position, setPosition] = useState<EmployeePosition | undefined>(undefined);
  const [extraPoles, setExtraPoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { role: simulatedRole } = useViewAs();

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('position, poles')
            .eq('id', user.id)
            .single();
          if (profile?.position) setPosition(profile.position as EmployeePosition);
          if (profile?.poles) setExtraPoles(profile.poles as string[]);
        }
      } catch (error) {
        console.error('Error fetching position:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosition();
  }, []);

  // Mode « Visualiser comme » : le rôle métier simulé prend le dessus.
  const effectivePosition = simulatedRole?.position ?? position ?? 'ceo';
  const effectivePoles = simulatedRole ? simulatedRole.poles : extraPoles;

  return {
    position: effectivePosition,
    positionInfo: effectivePosition ? positionInfos[effectivePosition] : undefined,
    isLoading,
    canAccessPole: (poleId: PoleId) => canAccessPole(effectivePosition, poleId, effectivePoles),
    canAccessScreen: (screenId: string) => canAccessScreen(effectivePosition, screenId, effectivePoles),
    accessiblePoles: getAccessiblePoles(effectivePosition, effectivePoles),
    simulatedRoleLabel: simulatedRole?.label,
  };
};
