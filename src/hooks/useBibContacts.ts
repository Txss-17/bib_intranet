import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { positionInfos, EmployeePosition } from '@/types/positions';

export type BibContact = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  position: EmployeePosition | null;
  fullName: string;
  positionLabel: string;
};

export const useBibContacts = () => {
  return useQuery({
    queryKey: ['bib-contacts'],
    queryFn: async (): Promise<BibContact[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, position')
        .order('first_name', { ascending: true });
      if (error) throw error;
      return (data || []).map((p: any) => {
        const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
        const info = p.position ? positionInfos[p.position as EmployeePosition] : undefined;
        return {
          id: p.id,
          email: p.email,
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? '',
          position: p.position ?? null,
          fullName: fullName || p.email,
          positionLabel: info?.titleFr ?? '',
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCurrentBibContact = () => {
  return useQuery({
    queryKey: ['bib-contacts', 'me'],
    queryFn: async (): Promise<BibContact | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, position')
        .eq('id', u.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const p: any = data;
      const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
      const info = p.position ? positionInfos[p.position as EmployeePosition] : undefined;
      return {
        id: p.id,
        email: p.email,
        first_name: p.first_name ?? '',
        last_name: p.last_name ?? '',
        position: p.position ?? null,
        fullName: fullName || p.email,
        positionLabel: info?.titleFr ?? '',
      };
    },
  });
};
