import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * Produit & Engineering
 *
 * Ce hook remplace progressivement l'ancien périmètre R&D.
 *
 * IMPORTANT :
 * Les tables Supabase conservent temporairement leurs noms historiques :
 *
 * - rd_reports
 * - rd_recommendations
 *
 * Ces noms seront traités lors de la migration du schéma Supabase.
 */

const db = supabase as unknown as {
  from: (table: string) => any;
};

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ProductRecommendationTargetPole =
  | 'product'
  | 'ops'
  | 'supplier'
  | 'rse';

export interface ProductReport {
  id: string;
  title: string;
  type: string | null;
  status: string | null;
  author_id: string | null;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface ProductRecommendation {
  id: string;
  report_id: string | null;
  detail: string;
  priority: string;
  status: string;
  target_pole: ProductRecommendationTargetPole | null;
  ticket_id: string | null;
  ticket_type: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface ProductTicket {
  recommendation_id: string;
  detail: string;
  priority: string;
  target_pole: string | null;
  created_at: string;
  ticket_id: string;
  ticket_type: string | null;
  ticket_title: string | null;
  ticket_status: string;
  ticket_severity: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
}

export interface ProductProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  full_name: string;
}

/* -------------------------------------------------------------------------- */
/* Rapports Produit & Engineering                                             */
/* -------------------------------------------------------------------------- */

export const useProductReports = () =>
  useQuery({
    queryKey: ['product_reports'],

    queryFn: async (): Promise<ProductReport[]> => {
      const { data, error } = await db
        .from('rd_reports')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as ProductReport[];
    },
  });

export const useCreateProductReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Record<string, unknown>,
    ): Promise<void> => {
      const { data: auth } = await supabase.auth.getUser();

      let authorName: string | null = null;

      if (auth.user?.id) {
        const { data: profile } = await db
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', auth.user.id)
          .maybeSingle();

        if (profile) {
          authorName =
            `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
            null;
        }
      }

      const { error } = await db
        .from('rd_reports')
        .insert({
          ...payload,
          author_id: auth.user?.id ?? null,
          author_name: authorName,
        });

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product_reports'],
      });
    },
  });
};

export const useUpdateProductReportStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }): Promise<void> => {
      const updates: Record<string, unknown> = {
        status,
      };

      if (status === 'published') {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await db
        .from('rd_reports')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product_reports'],
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Recommandations Produit & Engineering                                      */
/* -------------------------------------------------------------------------- */

export const useProductRecommendations = (
  reportId?: string,
) =>
  useQuery({
    queryKey: [
      'product_recommendations',
      reportId ?? 'all',
    ],

    queryFn: async (): Promise<ProductRecommendation[]> => {
      let query = db
        .from('rd_recommendations')
        .select('*')
        .order('created_at', {
          ascending: false,
        });

      if (reportId) {
        query = query.eq('report_id', reportId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data ?? []) as ProductRecommendation[];
    },
  });

export const useCreateProductRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Record<string, unknown>,
    ): Promise<void> => {
      const { data: auth } = await supabase.auth.getUser();

      const { error } = await db
        .from('rd_recommendations')
        .insert({
          ...payload,
          created_by: auth.user?.id ?? null,
        });

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product_recommendations'],
      });
    },
  });
};

export const useUpdateProductRecommendationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }): Promise<void> => {
      const { error } = await db
        .from('rd_recommendations')
        .update({
          status,
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product_recommendations'],
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Tickets issus des recommandations                                          */
/* -------------------------------------------------------------------------- */

export const useProductTickets = () =>
  useQuery({
    queryKey: ['product_tickets'],

    queryFn: async (): Promise<ProductTicket[]> => {
      const {
        data: recommendations,
        error: recommendationsError,
      } = await db
        .from('rd_recommendations')
        .select(
          `
            id,
            detail,
            priority,
            status,
            target_pole,
            ticket_id,
            ticket_type,
            created_at
          `,
        )
        .not('ticket_id', 'is', null)
        .order('created_at', {
          ascending: false,
        });

      if (recommendationsError) {
        throw recommendationsError;
      }

      const ticketIds = (recommendations ?? [])
        .map(
          (recommendation: {
            ticket_id: string | null;
          }) => recommendation.ticket_id,
        )
        .filter(Boolean);

      if (ticketIds.length === 0) {
        return [];
      }

      const {
        data: incidents,
        error: incidentsError,
      } = await db
        .from('audit_incidents')
        .select(
          `
            id,
            title,
            status,
            severity,
            pole_id,
            assigned_to,
            resolved_at,
            updated_at
          `,
        )
        .in('id', ticketIds);

      if (incidentsError) {
        throw incidentsError;
      }

      const assigneeIds = Array.from(
        new Set(
          (incidents ?? [])
            .map(
              (incident: {
                assigned_to: string | null;
              }) => incident.assigned_to,
            )
            .filter(Boolean),
        ),
      );

      const profilesMap: Record<string, string> = {};

      if (assigneeIds.length > 0) {
        const { data: profiles } = await db
          .from('profiles')
          .select(
            'id, first_name, last_name',
          )
          .in('id', assigneeIds);

        (profiles ?? []).forEach(
          (profile: {
            id: string;
            first_name: string | null;
            last_name: string | null;
          }) => {
            profilesMap[profile.id] =
              `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
          },
        );
      }

      const incidentMap: Record<string, any> = {};

      (incidents ?? []).forEach(
        (incident: {
          id: string;
          [key: string]: unknown;
        }) => {
          incidentMap[incident.id] = incident;
        },
      );

      return (recommendations ?? []).map(
        (recommendation: {
          id: string;
          detail: string;
          priority: string;
          target_pole: string | null;
          created_at: string;
          ticket_id: string;
          ticket_type: string | null;
        }): ProductTicket => {
          const incident =
            incidentMap[recommendation.ticket_id];

          return {
            recommendation_id: recommendation.id,
            detail: recommendation.detail,
            priority: recommendation.priority,
            target_pole: recommendation.target_pole,
            created_at: recommendation.created_at,

            ticket_id: recommendation.ticket_id,
            ticket_type: recommendation.ticket_type,

            ticket_title: incident?.title ?? null,
            ticket_status:
              incident?.status ?? 'unknown',
            ticket_severity:
              incident?.severity ?? null,

            assignee_id:
              incident?.assigned_to ?? null,

            assignee_name: incident?.assigned_to
              ? profilesMap[incident.assigned_to] || '—'
              : null,
          };
        },
      );
    },
  });

/* -------------------------------------------------------------------------- */
/* Conversion recommandation → ticket                                         */
/* -------------------------------------------------------------------------- */

export const useConvertProductRecommendationToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recommendation,
      targetPole,
    }: {
      recommendation: ProductRecommendation;
      targetPole: ProductRecommendationTargetPole;
    }) => {
      const { data: auth } =
        await supabase.auth.getUser();

      const titlePrefix =
        '[Produit & Engineering]';

      const description =
        `Issue de la recommandation Produit & Engineering #${recommendation.id}\n\n${recommendation.detail}`;

      const { data: incident, error: incidentError } =
        await db
          .from('audit_incidents')
          .insert({
            title: `${titlePrefix} ${recommendation.detail.slice(
              0,
              80,
            )}`,

            description,

            category: 'operational',

            severity:
              recommendation.priority === 'critical'
                ? 'critical'
                : recommendation.priority === 'high'
                  ? 'high'
                  : 'medium',

            pole_id: targetPole,

            declared_by: auth.user?.id ?? null,
          })
          .select()
          .single();

      if (incidentError) {
        throw incidentError;
      }

      const { error: recommendationError } =
        await db
          .from('rd_recommendations')
          .update({
            status: 'in_progress',
            target_pole: targetPole,
            ticket_type: 'audit_incident',
            ticket_id: incident.id,
          })
          .eq('id', recommendation.id);

      if (recommendationError) {
        throw recommendationError;
      }

      return incident;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['product_recommendations'],
      });

      queryClient.invalidateQueries({
        queryKey: ['product_tickets'],
      });

      queryClient.invalidateQueries({
        queryKey: ['audit_incidents'],
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Détail d'un ticket Produit & Engineering                                   */
/* -------------------------------------------------------------------------- */

export const useProductTicket = (
  ticketId?: string,
) =>
  useQuery({
    queryKey: ['product_ticket', ticketId],

    enabled: Boolean(ticketId),

    queryFn: async () => {
      const {
        data: incident,
        error: incidentError,
      } = await db
        .from('audit_incidents')
        .select('*')
        .eq('id', ticketId)
        .maybeSingle();

      if (incidentError) {
        throw incidentError;
      }

      if (!incident) {
        return null;
      }

      const { data: recommendation } =
        await db
          .from('rd_recommendations')
          .select('*')
          .eq('ticket_id', ticketId)
          .maybeSingle();

      let report = null;

      if (recommendation?.report_id) {
        const { data } =
          await db
            .from('rd_reports')
            .select(
              'id, title, type',
            )
            .eq(
              'id',
              recommendation.report_id,
            )
            .maybeSingle();

        report = data;
      }

      let assignee = null;

      if (incident.assigned_to) {
        const { data } =
          await db
            .from('profiles')
            .select(
              'id, first_name, last_name, email',
            )
            .eq(
              'id',
              incident.assigned_to,
            )
            .maybeSingle();

        assignee = data;
      }

      const { data: history } =
        await db
          .from('audit_logs')
          .select('*')
          .eq(
            'resource',
            'audit_incident',
          )
          .eq(
            'resource_id',
            ticketId,
          )
          .order('created_at', {
            ascending: false,
          });

      return {
        incident,
        recommendation,
        report,
        assignee,
        history: history ?? [],
      };
    },
  });

/* -------------------------------------------------------------------------- */
/* Profils — sélection des responsables                                       */
/* -------------------------------------------------------------------------- */

export const useProductProfiles = () =>
  useQuery({
    queryKey: ['product_profiles'],

    queryFn: async (): Promise<ProductProfile[]> => {
      const { data, error } = await db
        .from('profiles')
        .select(
          'id, first_name, last_name, email',
        )
        .order('first_name');

      if (error) {
        throw error;
      }

      return (data ?? []).map(
        (profile: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
        }) => ({
          ...profile,

          full_name:
            `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
            profile.email ||
            'Utilisateur',
        }),
      );
    },
  });

/* -------------------------------------------------------------------------- */
/* Mise à jour d'un ticket                                                    */
/* -------------------------------------------------------------------------- */

export const useUpdateProductTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      updates,
      changeNote,
    }: {
      ticketId: string;
      updates: Record<string, unknown>;
      changeNote: string;
    }) => {
      const { data: auth } =
        await supabase.auth.getUser();

      const cleaned = {
        ...updates,
      };

      if (
        updates.status === 'resolved' &&
        !updates.resolved_at
      ) {
        cleaned.resolved_at =
          new Date().toISOString();
      }

      const { error } = await db
        .from('audit_incidents')
        .update(cleaned)
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      let userName: string | null = null;

      if (auth.user?.id) {
        const { data: profile } =
          await db
            .from('profiles')
            .select(
              'first_name, last_name',
            )
            .eq(
              'id',
              auth.user.id,
            )
            .maybeSingle();

        if (profile) {
          userName =
            `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
            null;
        }
      }

      const { error: historyError } =
        await db
          .from('audit_logs')
          .insert({
            resource: 'audit_incident',
            resource_id: ticketId,

            action:
              'product_ticket_update',

            user_id:
              auth.user?.id ?? null,

            user_name: userName,

            details: {
              changes: updates,
              note: changeNote,
            },
          });

      if (historyError) {
        throw historyError;
      }
    },

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'product_ticket',
          variables.ticketId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ['product_tickets'],
      });

      queryClient.invalidateQueries({
        queryKey: ['audit_incidents'],
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Compatibilité temporaire                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Alias historiques.
 *
 * Ils seront supprimés lorsque les anciens écrans R&D auront été migrés.
 */

export const useRDReports = useProductReports;

export const useCreateRDReport =
  useCreateProductReport;

export const useUpdateRDReportStatus =
  useUpdateProductReportStatus;

export const useRDRecommendations =
  useProductRecommendations;

export const useCreateRDRecommendation =
  useCreateProductRecommendation;

export const useUpdateRecommendationStatus =
  useUpdateProductRecommendationStatus;

export const useRDTickets =
  useProductTickets;

export const useConvertRecommendationToTicket =
  useConvertProductRecommendationToTicket;

export const useRDTicket =
  useProductTicket;

export const useProfiles =
  useProductProfiles;

export const useUpdateRDTicket =
  useUpdateProductTicket;