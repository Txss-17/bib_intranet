import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type KpiFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type KpiStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export interface KpiCatalogRow {
  id: string;
  name: string;
  description: string | null;
  formula: string | null;
  source: string | null;
  frequency: KpiFrequency | null;
  owner_id: string | null;
  version: string;
  pole_access: string[];
  status: KpiStatus;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useKpiCatalog = () =>
  useQuery({
    queryKey: ['kpi_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_catalog' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KpiCatalogRow[];
    },
  });

export const useCreateKpi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<KpiCatalogRow>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('kpi_catalog' as any).insert({
        ...payload,
        created_by: user.user?.id ?? null,
        owner_id: payload.owner_id ?? user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi_catalog'] });
      toast({ title: 'KPI créé', description: 'Ajouté au catalogue.' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export interface PublicationRequestRow {
  id: string;
  title: string;
  description: string | null;
  request_type: 'kpi' | 'dashboard' | 'feature' | 'fix' | 'maintenance';
  related_kpi_id: string | null;
  status: 'draft' | 'data_validated' | 'tech_queued' | 'in_dev' | 'testing' | 'deployed' | 'archived' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requested_by: string | null;
  tech_assignee: string | null;
  target_deploy_date: string | null;
  deployed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const usePublicationRequests = () =>
  useQuery({
    queryKey: ['publication_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publication_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PublicationRequestRow[];
    },
  });

export const useUpdateRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PublicationRequestRow['status'] }) => {
      const patch: any = { status };
      if (status === 'deployed') patch.deployed_at = new Date().toISOString();
      const { error } = await supabase.from('publication_requests' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publication_requests'] });
      qc.invalidateQueries({ queryKey: ['publications'] });
      toast({ title: 'Statut mis à jour' });
    },
  });
};

export const useCreateRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PublicationRequestRow>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('publication_requests' as any).insert({
        ...payload,
        requested_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publication_requests'] });
      toast({ title: 'Demande créée' });
    },
  });
};

export interface PublicationRow {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  type: 'technical' | 'news' | 'hr' | 'finance' | 'legal' | 'security' | 'data';
  subtype: string | null;
  version: string;
  visibility_scope: 'all' | 'subsidiary' | 'pole' | 'team' | 'role' | 'user';
  visibility_targets: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  publish_at: string | null;
  available_at: string | null;
  archive_at: string | null;
  author_pole: string | null;
  created_at: string;
  updated_at: string;
}

export const usePublications = (filters?: { type?: string }) =>
  useQuery({
    queryKey: ['publications', filters],
    queryFn: async () => {
      let q = supabase.from('publications' as any).select('*').order('publish_at', { ascending: false, nullsFirst: false });
      if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PublicationRow[];
    },
  });

export const useCreatePublication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PublicationRow>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase.from('publications' as any).insert({
        ...payload,
        author_id: user.user?.id ?? null,
      }).select().single();
      if (error) throw error;

      // Multi-channel dispatch: intranet notifications targeted by visibility scope
      const pub = inserted as any;
      if (pub && (pub.status === 'published' || pub.status === 'scheduled')) {
        try {
          const scope = pub.visibility_scope as string;
          const targets: string[] = pub.visibility_targets ?? [];
          const baseNotif = {
            title: `Nouveauté : ${pub.title}`,
            message: pub.summary ?? 'Une nouvelle publication est disponible.',
            type: 'info' as const,
            pole_id: pub.author_pole ?? null,
            action_url: '/feed?tab=news',
            metadata: { publication_id: pub.id, publication_type: pub.type },
          };
          if (scope === 'user' && targets.length) {
            await supabase.from('notifications' as any).insert(
              targets.map((uid) => ({ ...baseNotif, user_id: uid }))
            );
          } else if (scope === 'pole' && targets.length) {
            const { data: profs } = await (supabase as any)
              .from('profiles')
              .select('id, poles')
              .overlaps('poles', targets);
            const ids = (profs ?? []).map((p: any) => p.id);
            if (ids.length) {
              await supabase.from('notifications' as any).insert(
                ids.map((uid: string) => ({ ...baseNotif, user_id: uid }))
              );
            }
          } else {
            await supabase.from('notifications' as any).insert({ ...baseNotif, user_id: null });
          }
        } catch (e) {
          console.warn('Notification dispatch failed', e);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['publications'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Publication créée', description: 'Notifications envoyées aux destinataires.' });
    },
    onError: (e: any) =>
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export interface BacklogRow {
  id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high' | 'strategic';
  complexity: 'xs' | 's' | 'm' | 'l' | 'xl';
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' | 'cancelled';
  labels: string[] | null;
  created_at: string;
}

export const useTechBacklog = () =>
  useQuery({
    queryKey: ['tech_backlog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_backlog' as any)
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as BacklogRow[];
    },
  });

export const useCreateBacklogItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BacklogRow>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('tech_backlog' as any).insert({
        ...payload,
        created_by: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tech_backlog'] });
      toast({ title: 'Item ajouté au backlog' });
    },
  });
};

export const useKpiVersions = (kpiId?: string) =>
  useQuery({
    queryKey: ['kpi_versions', kpiId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('kpi_versions' as any).select('*').order('created_at', { ascending: false });
      if (kpiId) q = q.eq('kpi_id', kpiId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
