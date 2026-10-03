import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * Données transversales exploitées par :
 *
 * - Security & IT
 *   - journaux d'authentification
 *   - accès VPN
 *   - alertes de sécurité
 *   - annuaire des accès
 *
 * - Produit & Engineering
 *   - journaux Edge Functions
 *
 * Les noms de tables Supabase restent historiques pour le moment.
 * Le renommage éventuel du schéma sera effectué dans une migration dédiée.
 */

const db = supabase as unknown as {
  from: (table: string) => any;
};

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuthLog {
  id: string;
  user_id: string | null;
  action: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface EdgeFunctionLog {
  id: string;
  function_name: string | null;
  level: string | null;
  message: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface VpnAccess {
  id: string;
  user_id: string | null;
  status: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface SecurityAlert {
  id: string;
  severity: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface SecurityAccessUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  position: string | null;
  poles: string[] | null;
  avatar_url: string | null;
}

/* -------------------------------------------------------------------------- */
/* Security & IT — Auth logs                                                  */
/* -------------------------------------------------------------------------- */

export const useSecurityAuthLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['security_auth_logs', limit],

    queryFn: async (): Promise<AuthLog[]> => {
      const { data, error } = await db
        .from('auth_logs')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data ?? []) as AuthLog[];
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Produit & Engineering — Edge Function logs                                 */
/* -------------------------------------------------------------------------- */

export const useProductEdgeFunctionLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['product_edge_function_logs', limit],

    queryFn: async (): Promise<EdgeFunctionLog[]> => {
      const { data, error } = await db
        .from('edge_function_logs')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data ?? []) as EdgeFunctionLog[];
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Security & IT — VPN                                                       */
/* -------------------------------------------------------------------------- */

export const useSecurityVpnAccess = () => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['security_vpn_access'],

    queryFn: async (): Promise<VpnAccess[]> => {
      const { data, error } = await db
        .from('vpn_access')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as VpnAccess[];
    },
  });

  const create = useMutation({
    mutationFn: async (
      payload: Record<string, unknown>,
    ): Promise<VpnAccess> => {
      const { data, error } = await db
        .from('vpn_access')
        .insert(payload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as VpnAccess;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security_vpn_access'],
      });
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      [key: string]: unknown;
    }): Promise<VpnAccess> => {
      const { data, error } = await db
        .from('vpn_access')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as VpnAccess;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security_vpn_access'],
      });
    },
  });

  return {
    ...list,
    create,
    update,
  };
};

/* -------------------------------------------------------------------------- */
/* Security & IT — Security alerts                                            */
/* -------------------------------------------------------------------------- */

export const useSecurityAlerts = () => {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ['security_alerts'],

    queryFn: async (): Promise<SecurityAlert[]> => {
      const { data, error } = await db
        .from('security_alerts')
        .select('*')
        .order('created_at', {
          ascending: false,
        })
        .limit(200);

      if (error) {
        throw error;
      }

      return (data ?? []) as SecurityAlert[];
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      [key: string]: unknown;
    }): Promise<SecurityAlert> => {
      const { data, error } = await db
        .from('security_alerts')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as SecurityAlert;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['security_alerts'],
      });
    },
  });

  return {
    ...list,
    update,
  };
};

/* -------------------------------------------------------------------------- */
/* Security & IT — Annuaire des accès                                         */
/* -------------------------------------------------------------------------- */

export const useSecurityAccess = () => {
  return useQuery({
    queryKey: ['security_access_users'],

    queryFn: async (): Promise<SecurityAccessUser[]> => {
      const { data, error } = await db
        .from('profiles')
        .select(
          'id, first_name, last_name, email, position, poles, avatar_url',
        )
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as SecurityAccessUser[];
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Compatibilité temporaire                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Ces alias permettent aux anciens écrans encore rattachés au module Tech
 * de continuer à compiler pendant la migration vers les 14 pôles.
 *
 * Ils seront supprimés après migration des consommateurs.
 */

export const useAuthLogs = useSecurityAuthLogs;

export const useEdgeFunctionLogs =
  useProductEdgeFunctionLogs;

export const useVpnAccess =
  useSecurityVpnAccess;

export const useTechAccess =
  useSecurityAccess;