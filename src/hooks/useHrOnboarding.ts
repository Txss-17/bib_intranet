import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export type CollaboratorType =
  | 'internal'
  | 'external'
  | 'provider'
  | 'consultant'
  | 'apprentice'
  | 'intern'
  | 'other';

export type HrRequestStatus =
  | 'draft'
  | 'submitted'
  | 'hr_validated'
  | 'account_created'
  | 'completed'
  | 'rejected';

export const COLLABORATOR_TYPE_LABELS: Record<
  CollaboratorType,
  string
> = {
  internal: 'Interne',
  external: 'Externe',
  provider: 'Prestataire',
  consultant: 'Consultant',
  apprentice: 'Alternant',
  intern: 'Stagiaire',
  other: 'Autre',
};

export const HR_STATUS: Record<
  HrRequestStatus,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline';
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
    label: 'Validé RH',
    variant: 'outline',
    step: 2,
  },
  account_created: {
    label: 'Compte créé',
    variant: 'outline',
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

  collaborator_type: CollaboratorType;

  position: string | null;
  poles: string[];

  seniority: string;
  requested_role: string;

  contract_type: string | null;
  start_date: string | null;

  manager_id: string | null;

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

export interface HrReferent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string | null;
  poles: string[] | null;
  hr_status: string | null;
  test_account: boolean;
}

export interface HrAccessRole {
  id: string;
  role_key: string;
  label: string;
  business_pole: string | null;
  department: string | null;
  status: string;
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
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as HrEmployeeRequest[];
    },
  });


export interface HrPositionCatalogItem {
  id: string;
  position_key: string;
  label: string;
  pole_id: string;
  description: string | null;
  active: boolean;
}

export const useHrPositionCatalog = (poleId?: string) =>
  useQuery({
    queryKey: ['rh-position-catalog', poleId ?? 'all'],

    queryFn: async (): Promise<HrPositionCatalogItem[]> => {
      let query = db
        .from('rh_position_catalog')
        .select('id, position_key, label, pole_id, description, active')
        .eq('active', true)
        .order('label', { ascending: true });

      if (poleId) {
        query = query.eq('pole_id', poleId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data ?? []) as HrPositionCatalogItem[];
    },
  });

/**
 * Référents RH.
 *
 * On ne charge volontairement PAS tous les profiles.
 *
 * Un référent doit être :
 * - actif ou en onboarding ;
 * - rattaché au pôle RH ;
 * - responsable RH.
 */

export const useHrReferents = () =>
  useQuery({
    queryKey: ['rh-onboarding-referents'],

    queryFn: async (): Promise<HrReferent[]> => {
      const { data, error } = await db
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position,
          poles,
          hr_status,
          test_account
        `)
        .eq('test_account', false)
        .eq('position', 'rh_manager')
        .in('hr_status', ['active', 'onboarding'])
        .contains('poles', ['rh'])
        .order('first_name', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as HrReferent[];
    },
  });


/**
 * Catalogue RBAC réel.
 *
 * Le formulaire ne propose plus les anciens rôles
 * viewer/operator/etc. comme s'ils constituaient le catalogue
 * métier.
 */
export const useHrAccessRoles = (
  poles: string[] = [],
) =>
  useQuery({
    queryKey: [
      'rh-onboarding-access-roles',
      poles,
    ],

    queryFn: async (): Promise<HrAccessRole[]> => {
      const { data, error } = await db
        .from('access_roles')
        .select(`
          id,
          role_key,
          label,
          business_pole,
          department,
          status
        `)
        .eq('status', 'active')
        .order('label', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const selectedPoles = new Set(poles);

      return ((data ?? []) as HrAccessRole[]).filter(
        (role) =>
          !role.business_pole ||
          selectedPoles.has(role.business_pole),
      );
    },

    enabled: true,
  });


export const useHrRequestEvents = (
  requestId?: string,
) =>
  useQuery({
    queryKey: [
      'hr_employee_request_events',
      requestId,
    ],

    enabled: Boolean(requestId),

    queryFn: async (): Promise<HrRequestEvent[]> => {
      const { data, error } = await db
        .from('hr_employee_request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as HrRequestEvent[];
    },
  });


export const useHrOnboardingActions = () => {
  const queryClient = useQueryClient();

  const {
    user,
    profile,
  } = useAuth();

  const actorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Utilisateur';

  const invalidate = (
    requestId?: string,
  ) => {
    queryClient.invalidateQueries({
      queryKey: ['hr_employee_requests'],
    });

    queryClient.invalidateQueries({
      queryKey: ['rh-collaborators'],
    });

    queryClient.invalidateQueries({
      queryKey: ['employees'],
    });

    if (requestId) {
      queryClient.invalidateQueries({
        queryKey: [
          'hr_employee_request_events',
          requestId,
        ],
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
    const { error } = await db
      .from('hr_employee_request_events')
      .insert({
        request_id: requestId,
        actor_id: user?.id ?? null,
        actor_name: actorName,
        action,
        from_status: extra?.from ?? null,
        to_status: extra?.to ?? null,
        note: extra?.note ?? null,
      });

    if (error) {
      throw error;
    }
  };


  const create = useMutation({
    mutationFn: async (
      payload: Partial<HrEmployeeRequest>,
    ): Promise<HrEmployeeRequest> => {
      if (!payload.first_name?.trim()) {
        throw new Error('Le prénom est obligatoire.');
      }

      if (!payload.last_name?.trim()) {
        throw new Error('Le nom est obligatoire.');
      }

      if (
        !payload.work_email?.trim() &&
        !payload.personal_email?.trim()
      ) {
        throw new Error(
          'Un email professionnel ou personnel est obligatoire.',
        );
      }

      if (
        !Array.isArray(payload.poles) ||
        payload.poles.length === 0
      ) {
        throw new Error(
          'Au moins un pôle doit être sélectionné.',
        );
      }

      if (!payload.position) {
        throw new Error('La fonction est obligatoire.');
      }

      if (!payload.requested_role) {
        throw new Error(
          'Le rôle d’accès est obligatoire.',
        );
      }

      const normalizedPayload = {
        ...payload,

        first_name:
          payload.first_name.trim(),

        last_name:
          payload.last_name.trim(),

        personal_email:
          payload.personal_email?.trim() || null,

        work_email:
          payload.work_email?.trim() || null,

        collaborator_type:
          payload.collaborator_type ??
          'internal',

        start_date:
          payload.start_date || null,

        manager_id:
          payload.manager_id || null,

        status: 'submitted',

        created_by:
          user?.id ?? null,
      };

      const {
        data,
        error,
      } = await db
        .from('hr_employee_requests')
        .insert(normalizedPayload)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      await logEvent(
        data.id,
        'Dossier collaborateur créé',
        {
          to: 'submitted',
          note: `Type : ${
            COLLABORATOR_TYPE_LABELS[
              data.collaborator_type as CollaboratorType
            ] ?? data.collaborator_type
          }`,
        },
      );

      return data as HrEmployeeRequest;
    },

    onSuccess: (request) => {
      invalidate(request.id);

      toast({
        title: 'Dossier créé',
        description:
          `${request.reference} · ` +
          `${request.first_name} ${request.last_name}`,
      });
    },

    onError: (error: Error) => {
      toast({
        title: 'Création impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const setStatus = useMutation({
    mutationFn: async ({
      request,
      status,
      reason,
    }: {
      request: HrEmployeeRequest;
      status: HrRequestStatus;
      reason?: string;
    }) => {
      const allowedTransitions: Record<
        HrRequestStatus,
        HrRequestStatus[]
      > = {
        draft: ['submitted', 'rejected'],
        submitted: ['hr_validated', 'rejected'],
        hr_validated: ['rejected'],
        account_created: ['completed', 'rejected'],
        completed: [],
        rejected: ['submitted'],
      };

      if (
        !allowedTransitions[
          request.status
        ]?.includes(status)
      ) {
        throw new Error(
          `Transition interdite : ${request.status} → ${status}`,
        );
      }

      if (
        status === 'rejected' &&
        !reason?.trim()
      ) {
        throw new Error(
          'Un motif est obligatoire pour un refus.',
        );
      }

      const patch: Record<string, unknown> = {
        status,
      };

      if (status === 'hr_validated') {
        patch.hr_validated_by =
          user?.id ?? null;

        patch.hr_validated_at =
          new Date().toISOString();
      }

      if (status === 'rejected') {
        patch.rejection_reason =
          reason?.trim() ?? null;
      }

      const {
        error,
      } = await db
        .from('hr_employee_requests')
        .update(patch)
        .eq('id', request.id);

      if (error) {
        throw error;
      }

      await logEvent(
        request.id,
        `Statut : ${HR_STATUS[status].label}`,
        {
          from: request.status,
          to: status,
          note: reason,
        },
      );

      return {
        request,
        status,
      };
    },

    onSuccess: ({
      request,
      status,
    }) => {
      invalidate(request.id);

      toast({
        title:
          `${request.reference} — ` +
          `${HR_STATUS[status].label}`,
      });
    },

    onError: (error: Error) => {
      toast({
        title: 'Mise à jour impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const provisionAccount = useMutation({
    mutationFn: async (
      request: HrEmployeeRequest,
    ) => {
      const {
        data,
        error,
      } = await supabase.functions.invoke(
        'provision-employee-account',
        {
          body: {
            requestId: request.id,
          },
        },
      );

      if (error) {
        throw error;
      }

      if (
        (data as { error?: string })?.error
      ) {
        throw new Error(
          (data as { error: string }).error,
        );
      }

      return data as {
        email: string;
        userId: string;
        accountAlreadyExisted: boolean;
        invitationSent: boolean;
        accessAssignmentId: string | null;
      };
    },

    onSuccess: (data) => {
      invalidate();

      toast({
        title: 'Provisionnement terminé',
        description:
          data.invitationSent
            ? `${data.email} — invitation envoyée.`
            : `${data.email} — compte existant synchronisé.`,
      });
    },

    onError: (error: Error) => {
      toast({
        title:
          'Provisionnement impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  return {
    create,
    setStatus,
    provisionAccount,
  };
};
