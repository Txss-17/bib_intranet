import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'manager' | 'viewer';

export const useUserRole = () => {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);
      if (error) return [];
      return (data || []).map((r: any) => r.role as AppRole);
    },
  });

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const canViewSensitive = isAdmin || isManager;
  const canExportAudit = isAdmin || isManager;

  return { roles, isAdmin, isManager, canViewSensitive, canExportAudit, isLoading };
};
