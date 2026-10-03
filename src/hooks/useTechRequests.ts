import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

/**
 * Workflow des demandes Produit & Engineering.
 *
 * IMPORTANT :
 * Les tables Supabase conservent actuellement leur nom historique
 * `tech_requests`, `tech_request_comments` et `tech_request_events`.
 *
 * Le renommage SQL sera effectué lors de la prochaine phase de migration
 * du schéma Supabase.
 */

export type ProductRequestStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'done';

export const PRODUCT_REQUEST_STATUS: Record<
  ProductRequestStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  submitted: {
    label: 'Soumise',
    variant: 'secondary',
  },
  under_review: {
    label: 'En revue',
    variant: 'outline',
  },
  accepted: {
    label: 'Validée',
    variant: 'default',
  },
  rejected: {
    label: 'Refusée',
    variant: 'destructive',
  },
  in_progress: {
    label: 'En cours',
    variant: 'outline',
  },
  done: {
    label: 'Livrée',
    variant: 'default',
  },
};

export const PRODUCT_REQUEST_CATEGORIES = [
  {
    value: 'evolution',
    label: 'Évolution fonctionnelle',
  },
  {
    value: 'bug',
    label: 'Anomalie / bug',
  },
  {
    value: 'access',
    label: 'Accès & habilitations',
  },
  {
    value: 'data',
    label: 'Données & reporting',
  },
  {
    value: 'integration',
    label: 'Intégration / API',
  },
  {
    value: 'infra',
    label: 'Infrastructure',
  },
] as const;

export const PRIORITIES = [
  {
    value: 'low',
    label: 'Basse',
  },
  {
    value: 'medium',
    label: 'Normale',
  },
  {
    value: 'high',
    label: 'Haute',
  },
  {
    value: 'critical',
    label: 'Critique',
  },
] as const;

export interface ProductRequest {
  id: string;
  reference: string;
  title: string;
  description: string;

  requester_id: string | null;
  requester_name: string | null;
  requester_pole: string;

  category: string;
  priority: string;
  status: ProductRequestStatus;

  decision_reason: string | null;
  target_date: string | null;

  created_at: string;
  updated_at: string;
}

export interface ProductRequestComment {
  id: string;
  request_id: string;

  author_name: string | null;
  author_pole: string | null;

  body: string;
  created_at: string;
}

export interface ProductRequestEvent {
  id: string;
  request_id: string;

  actor_name: string | null;
  action: string;

  from_status: string | null;
  to_status: string | null;

  note: string | null;
  created_at: string;
}

/**
 * Le client Supabase du projet utilise actuellement des types générés
 * historiques/incomplets pour certaines tables.
 *
 * Le typage strict des tables sera rétabli lorsque les types seront
 * régénérés à partir du schéma Supabase réel.
 */
const db = supabase as unknown as {
  from: (table: string) => any;
};

/**
 * ---------------------------------------------------------------------------
 * REQUÊTES
 * ---------------------------------------------------------------------------
 */

export const useProductRequests = () =>
  useQuery({
    queryKey: ['product_requests'],
    queryFn: async (): Promise<ProductRequest[]> => {
      const { data, error } = await db
        .from('tech_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as ProductRequest[];
    },
  });

export const useProductRequestThread = (requestId?: string) => {
  const comments = useQuery({
    queryKey: ['product_request_comments', requestId],
    enabled: Boolean(requestId),

    queryFn: async (): Promise<ProductRequestComment[]> => {
      const { data, error } = await db
        .from('tech_request_comments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as ProductRequestComment[];
    },
  });

  const events = useQuery({
    queryKey: ['product_request_events', requestId],
    enabled: Boolean(requestId),

    queryFn: async (): Promise<ProductRequestEvent[]> => {
      const { data, error } = await db
        .from('tech_request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as ProductRequestEvent[];
    },
  });

  return {
    comments,
    events,
  };
};

/**
 * ---------------------------------------------------------------------------
 * ACTIONS
 * ---------------------------------------------------------------------------
 */

export const useProductRequestActions = () => {
  const queryClient = useQueryClient();

  const { user, profile } = useAuth();

  const actorName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : 'Utilisateur';

  const invalidate = (requestId?: string) => {
    queryClient.invalidateQueries({
      queryKey: ['product_requests'],
    });

    if (!requestId) {
      return;
    }

    queryClient.invalidateQueries({
      queryKey: ['product_request_comments', requestId],
    });

    queryClient.invalidateQueries({
      queryKey: ['product_request_events', requestId],
    });
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
      .from('tech_request_events')
      .insert({
        request_id: requestId,
        actor_id: user?.id,
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

  /**
   * Création d'une demande Produit & Engineering.
   */
  const create = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      requester_pole: string;
      category: string;
      priority: string;
      target_date?: string | null;
    }): Promise<ProductRequest> => {
      const { data, error } = await db
        .from('tech_requests')
        .insert({
          ...payload,
          requester_id: user?.id,
          requester_name: actorName,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      await logEvent(data.id, 'Demande créée', {
        to: 'submitted',
      });

      return data as ProductRequest;
    },

    onSuccess: (request) => {
      invalidate(request.id);

      toast({
        title: 'Demande transmise au pôle Produit & Engineering',
        description: `${request.reference} · ${request.title}`,
      });
    },

    onError: (error: Error) => {
      toast({
        title: 'Envoi impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * Changement de statut d'une demande.
   */
  const changeStatus = useMutation({
    mutationFn: async (payload: {
      request: ProductRequest;
      status: ProductRequestStatus;
      reason?: string;
    }) => {
      const patch: Record<string, unknown> = {
        status: payload.status,
      };

      if (
        payload.status === 'accepted' ||
        payload.status === 'rejected'
      ) {
        patch.decision_reason = payload.reason ?? null;
        patch.decided_by = user?.id;
        patch.decided_at = new Date().toISOString();
      }

      const { error } = await db
        .from('tech_requests')
        .update(patch)
        .eq('id', payload.request.id);

      if (error) {
        throw error;
      }

      await logEvent(
        payload.request.id,
        `Statut : ${PRODUCT_REQUEST_STATUS[payload.status].label}`,
        {
          from: payload.request.status,
          to: payload.status,
          note: payload.reason,
        },
      );

      return payload;
    },

    onSuccess: (payload) => {
      invalidate(payload.request.id);

      toast({
        title: `${payload.request.reference} — ${PRODUCT_REQUEST_STATUS[payload.status].label}`,
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

  /**
   * Ajout d'un commentaire dans le fil de la demande.
   */
  const comment = useMutation({
    mutationFn: async (payload: {
      requestId: string;
      body: string;
    }) => {
      const { error } = await db
        .from('tech_request_comments')
        .insert({
          request_id: payload.requestId,
          author_id: user?.id,
          author_name: actorName,
          author_pole: profile?.poles?.[0] ?? null,
          body: payload.body,
        });

      if (error) {
        throw error;
      }

      await logEvent(
        payload.requestId,
        'Commentaire ajouté',
      );

      return payload;
    },

    onSuccess: (payload) => {
      invalidate(payload.requestId);
    },

    onError: (error: Error) => {
      toast({
        title: 'Commentaire refusé',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    create,
    changeStatus,
    comment,
  };
};

/**
 * ---------------------------------------------------------------------------
 * COMPATIBILITÉ TEMPORAIRE
 * ---------------------------------------------------------------------------
 *
 * TechStudio.tsx et d'autres écrans historiques utilisent encore les anciens
 * noms. Ces alias évitent de casser le build pendant la migration des écrans.
 *
 * Ils pourront être supprimés lorsque tous les consommateurs auront migré
 * vers les noms Produit & Engineering.
 */

export type TechRequestStatus = ProductRequestStatus;

export const TECH_REQUEST_STATUS = PRODUCT_REQUEST_STATUS;

export const TECH_REQUEST_CATEGORIES = PRODUCT_REQUEST_CATEGORIES;

export type TechRequest = ProductRequest;

export type TechRequestComment = ProductRequestComment;

export type TechRequestEvent = ProductRequestEvent;

export const useTechRequests = useProductRequests;

export const useTechRequestThread = useProductRequestThread;

export const useTechRequestActions = useProductRequestActions;