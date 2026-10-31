import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type PoleCollaborator = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  poles: string[];
  eligible: boolean;
};

/**
 * Single staff directory for all 14 poles. Membership and assignment eligibility
 * are different: the server checks department visibility and workflow permissions.
 * p_pole must be explicit; a missing pole never enumerates all employees.
 */
export function usePoleCollaborators(pole: string | null, page: string, action = 'update', enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pole-collaborators', user?.id, pole, page, action],
    enabled: !!user && !!pole && enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<PoleCollaborator[]> => {
      const { data, error } = await supabase.rpc('list_pole_collaborators' as never, {
        p_pole: pole,
        p_page: page,
        p_action: action,
      } as never);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Annuaire du pôle indisponible.');
      return data as PoleCollaborator[];
    },
  });
}

export const collaboratorName = (p: Pick<PoleCollaborator,'first_name'|'last_name'|'id'>) =>
  [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.id;
