import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAuthLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['auth_logs', limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('auth_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useEdgeFunctionLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['edge_function_logs', limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('edge_function_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useVpnAccess = () => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['vpn_access'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vpn_access').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await (supabase as any).from('vpn_access').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vpn_access'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data, error } = await (supabase as any).from('vpn_access').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vpn_access'] }),
  });

  return { ...list, create, update };
};

export const useSecurityAlerts = () => {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['security_alerts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('security_alerts').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data, error } = await (supabase as any).from('security_alerts').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['security_alerts'] }),
  });

  return { ...list, update };
};

export const useTechAccess = () => {
  return useQuery({
    queryKey: ['tech_access_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, position, poles, avatar_url')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};
