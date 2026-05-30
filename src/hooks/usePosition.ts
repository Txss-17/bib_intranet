import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmployeePosition, positionInfos } from '@/types/positions';
import { canAccessPole, canAccessScreen, getAccessiblePoles } from '@/data/positionAccess';
import { PoleId } from '@/types';

interface UsePositionReturn {
  position: EmployeePosition | undefined;
  positionInfo: typeof positionInfos[EmployeePosition] | undefined;
  isLoading: boolean;
  canAccessPole: (poleId: PoleId) => boolean;
  canAccessScreen: (screenId: string) => boolean;
  accessiblePoles: PoleId[];
}

export const usePosition = (): UsePositionReturn => {
  const [position, setPosition] = useState<EmployeePosition | undefined>(undefined);
  const [extraPoles, setExtraPoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // For development/demo purposes, default to CEO if no position set
  const effectivePosition = position || 'ceo';

  return {
    position: effectivePosition,
    positionInfo: effectivePosition ? positionInfos[effectivePosition] : undefined,
    isLoading,
    canAccessPole: (poleId: PoleId) => canAccessPole(effectivePosition, poleId, extraPoles),
    canAccessScreen: (screenId: string) => canAccessScreen(effectivePosition, screenId, extraPoles),
    accessiblePoles: getAccessiblePoles(effectivePosition, extraPoles),
  };
};
