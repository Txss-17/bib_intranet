import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type HrRequestStatus =
  | 'draft'
  | 'submitted'
  | 'hr_validated'
  | 'account_created'
  | 'completed'
  | 'rejected';

export const HR_STATUS: Record<
  HrRequestStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    step: number;
  }
> = {
  draft: {
    label: 'Brouillon',
    variant: 'secondary',
    step: 0,
  },
  submitted: {
    label: 'Soumis RH',
    variant: 'outline',
    step: 1,
  },
  hr_validated: {
    label: 'Validé RH — prêt pour provisionnement',
    variant: 'outline',
    step: 2,
  },
  account_created: {
    label: 'Compte et accès créés',
    variant: 'default',
    step: 3,
  },
  completed: {
    label: 'Intégration terminée',
    variant: 'default',
    step: 4,
  },
  rejected: {
    label: 'Refusé',
    variant: 'destructive',
    step: 0,
  },
};

export const HR_STEPS = [
  'Dossier',
  'Validation RH',
  'Création du compte',
  'Rôle & accès',
  'Terminé',
];

export interface HrEmployeeRequest {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  personal_email: string | null;
  work_email: string | null;
  position: string | null;
  poles: string[];
  seniority: string;
  requested_role: string;
  contract_type: string | null;
  start_date: string | null;
  status: HrRequestStatus;
  rejection_reason: string | null;
  notes: string | null;
  created_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HrRequestEvent {
  id: string;
  actor_name: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
}

const db = supabase as unknown as {
  from: (table: string) => any;
};

export const useHrEmployeeRequests = () =>
  useQuery({
    queryKey: ['hr_employee_requests'],
    queryFn: async (): Promise<HrEmployeeRequest[]> => {
      const { data, error } = await db
        .from('hr_employee_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as HrEmployeeRequest[];
    },
  });

export const useHrRequestEvents = (requestId?: string) =>
  useQuery({
    queryKey: ['hr_employee_request_events', requestId],
    enabled: !!requestId,
    queryFn: async (): Promise<HrRequestEvent[]> => {
      const { data, error } = await db
        .from('hr_employee_request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []) as HrRequestEvent[];
    },
  });

export const useHrOnboardingActions = () => {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const actorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Utilisateur';

  const invalidate = (id?: string) => {
    qc.invalidateQueries({
      queryKey: ['hr_employee_requests'],
    });

    if (id) {
      qc.invalidateQueries({
        queryKey: ['hr_employee_request_events', id],
      });
    }
  };

  const logEvent = async (
    requestId: string,
    action: string,
    extra?: {
      from?: string;
      to?: string;
      note?: string;
    },
  ) => {
    await db.from('hr_employee_request_events').insert({
      request_id: requestId,
      actor_id: user?.id,
      actor_name: actorName,
      action,
      from_status: extra?.from ?? null,
      to_status: extra?.to ?? null,
      note: extra?.note ?? null,
    });
  };

  const create = useMutation({
    mutationFn: async (
      payload: Partial<HrEmployeeRequest>,
    ): Promise<HrEmployeeRequest> => {
      const { data, error } = await db
        .from('hr_employee_requests')
        .insert({
          ...payload,
          created_by: user?.id,
          status: 'submitted',
        })
        .select('*')
        .single();

      if (error) throw error;

      await logEvent(data.id, 'Dossier collaborateur créé', {
        to: 'submitted',
      });

      return data as HrEmployeeRequest;
    },

    onSuccess: (request) => {
      invalidate(request.id);

      toast({
        title: 'Dossier créé',
        description: `${request.reference} · ${request.first_name} ${request.last_name}`,
      });
    },

    onError: (error: Error) =>
      toast({
        title: 'Création impossible',
        description: error.message,
        variant: 'destructive',
      }),
  });

  const setStatus = useMutation({
    mutationFn: async (params: {
      request: HrEmployeeRequest;
      status: HrRequestStatus;
      reason?: string;
    }) => {
      const patch: Record<string, unknown> = {
        status: params.status,
      };

      if (params.status === 'hr_validated') {
        patch.hr_validated_by = user?.id;
        patch.hr_validated_at = new Date().toISOString();
      }

      if (params.status === 'rejected') {
        patch.rejection_reason = params.reason ?? null;
      }

      const { error } = await db
        .from('hr_employee_requests')
        .update(patch)
        .eq('id', params.request.id);

      if (error) throw error;

      await logEvent(
        params.request.id,
        `Statut : ${HR_STATUS[params.status].label}`,
        {
          from: params.request.status,
          to: params.status,
          note: params.reason,
        },
      );

      return params;
    },

    onSuccess: (params) => {
      invalidate(params.request.id);

      toast({
        title: `${params.request.reference} — ${HR_STATUS[params.status].label}`,
      });
    },

    onError: (error: Error) =>
      toast({
        title: 'Mise à jour impossible',
        description: error.message,
        variant: 'destructive',
      }),
  });

  /**
   * Provisionnement du compte collaborateur.
   *
   * La création réelle est réalisée côté serveur par la fonction
   * Supabase sécurisée. Elle prend en charge :
   * - le compte d'authentification ;
   * - le profil collaborateur ;
   * - le rôle ;
   * - les pôles ;
   * - la finalisation du dossier RH.
   *
   * L'autorisation effective est donc contrôlée côté serveur.
   */
  const provisionAccount = useMutation({
    mutationFn: async (request: HrEmployeeRequest) => {
      const { data, error } = await supabase.functions.invoke(
        'provision-employee-account',
        {
          body: {
            requestId: request.id,
          },
        },
      );

      if (error) throw error;

      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }

      await logEvent(
        request.id,
        'Compte, profil et accès provisionnés',
        {
          from: request.status,
          to: 'completed',
        },
      );

      return data as {
        email: string;
        temporaryPassword?: string;
      };
    },

    onSuccess: (data) => {
      invalidate();

      toast({
        title: 'Compte collaborateur créé',
        description: `${data.email}${
          data.temporaryPassword
            ? ` · mot de passe temporaire : ${data.temporaryPassword}`
            : ''
        }`,
      });
    },

    onError: (error: Error) =>
      toast({
        title: 'Création du compte impossible',
        description: error.message,
        variant: 'destructive',
      }),
  });

  return {
    create,
    setStatus,
    provisionAccount,
  };
};
