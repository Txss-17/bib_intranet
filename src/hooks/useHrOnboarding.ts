import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';


// ============================================================
// TYPES
// ============================================================

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


// ============================================================
// REQUEST
// ============================================================

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

  status: HrRequestStatus;

  rejection_reason: string | null;

  notes: string | null;

  manager_id?: string | null;

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


// ============================================================
// DATABASE
// ============================================================

const db = supabase as unknown as {
  from: (table: string) => any;
};


// ============================================================
// REQUESTS
// ============================================================

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


// ============================================================
// EVENTS
// ============================================================

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


// ============================================================
// ACTIONS
// ============================================================

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
      queryKey: [
        'hr_employee_requests',
      ],
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


  // ==========================================================
  // EVENT LOGGING
  // ==========================================================

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

        from_status:
          extra?.from ?? null,

        to_status:
          extra?.to ?? null,

        note:
          extra?.note ?? null,
      });

    if (error) {
      throw error;
    }
  };


  // ==========================================================
  // CREATE REQUEST
  // ==========================================================

  const create = useMutation({
    mutationFn: async (
      payload: Partial<HrEmployeeRequest>,
    ): Promise<HrEmployeeRequest> => {
      const normalizedPayload = {
        ...payload,

        collaborator_type:
          payload.collaborator_type ??
          'internal',

        start_date:
          payload.start_date || null,

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
            ] ??
            data.collaborator_type
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

        description:
          error.message,

        variant: 'destructive',
      });
    },
  });


  // ==========================================================
  // STATUS
  // ==========================================================

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
          reason ?? null;
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

        `Statut : ${
          HR_STATUS[status].label
        }`,

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

        description:
          error.message,

        variant: 'destructive',
      });
    },
  });


  // ==========================================================
  // PROVISION ACCOUNT
  // ==========================================================

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
            requestId:
              request.id,
          },
        },
      );


      if (error) {
        throw error;
      }


      if (
        (data as {
          error?: string;
        })?.error
      ) {
        throw new Error(
          (data as {
            error: string;
          }).error,
        );
      }


      /*
       * La fonction serveur est responsable de :
       *
       * - créer le compte Auth ;
       * - créer/synchroniser profiles ;
       * - renseigner collaborator_type ;
       * - renseigner hr_status ;
       * - attribuer les pôles ;
       * - attribuer le rôle ;
       * - finaliser le dossier RH.
       */


      return data as {
        email: string;

        userId?: string;

        accountAlreadyExisted?: boolean;

        temporaryPassword?: string;
      };
    },


    onSuccess: (data) => {
      invalidate();

      toast({
        title:
          'Compte collaborateur créé',

        description:
          `${data.email}` +
          (
            data.temporaryPassword
              ? ` · mot de passe temporaire : ${data.temporaryPassword}`
              : ''
          ),
      });
    },


    onError: (error: Error) => {
      toast({
        title:
          'Création du compte impossible',

        description:
          error.message,

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
    
