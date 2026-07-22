import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type BIStatus = 'draft' | 'validation' | 'published' | 'archived';

export interface BIDashboard {
  id: string;
  name: string;
  description: string | null;
  pole_id: string | null;
  status: BIStatus;
  version: string;
  owner_id: string | null;
  template_id: string | null;
  layout: any;
  pages: Array<{ id: string; name: string }>;
  target_filiale: string | null;
  target_pole: string | null;
  target_role: string | null;
  target_users: string[];
  publish_at: string | null;
  archive_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BIWidget {
  id: string;
  dashboard_id: string;
  page_id: string;
  type: string;
  title: string | null;
  config: any;
  x: number;
  y: number;
  w: number;
  h: number;
  kpi_id: string | null;
  data_source: string | null;
}

export interface BITemplate {
  id: string;
  name: string;
  description: string | null;
  pole_id: string | null;
  icon: string | null;
  preset: any;
}

export interface BIDataSource {
  id: string;
  name: string;
  type: 'kpi' | 'sql_view' | 'api' | 'dataset' | 'export' | 'custom';
  description: string | null;
  config: any;
  owner_id: string | null;
}

export interface BIVersion {
  id: string;
  dashboard_id: string;
  version: string;
  snapshot: any;
  kpis_added: string[];
  kpis_removed: string[];
  author_id: string | null;
  note: string | null;
  created_at: string;
}

export const useDashboards = () =>
  useQuery({
    queryKey: ['bi_dashboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bi_dashboards' as any)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BIDashboard[];
    },
  });

export const useDashboard = (id?: string) =>
  useQuery({
    queryKey: ['bi_dashboard', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('bi_dashboards' as any).select('*').eq('id', id).single();
      if (error) throw error;
      return data as unknown as BIDashboard;
    },
  });

export const useDashboardWidgets = (dashboardId?: string) =>
  useQuery({
    queryKey: ['bi_widgets', dashboardId],
    enabled: !!dashboardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bi_dashboard_widgets' as any)
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BIWidget[];
    },
  });

export const useCreateDashboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BIDashboard>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('bi_dashboards' as any).insert({
        ...payload,
        owner_id: user.user?.id ?? null,
      }).select().single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bi_dashboards'] });
      toast({ title: 'Tableau de bord créé' });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
};

export const useUpdateDashboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BIDashboard> }) => {
      const { error } = await supabase.from('bi_dashboards' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['bi_dashboards'] });
      qc.invalidateQueries({ queryKey: ['bi_dashboard', v.id] });
    },
  });
};

export const useDuplicateDashboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: src } = await supabase.from('bi_dashboards' as any).select('*').eq('id', id).single();
      if (!src) throw new Error('Dashboard introuvable');
      const s: any = src;
      const { data: copy, error } = await supabase.from('bi_dashboards' as any).insert({
        name: s.name + ' (copie)',
        description: s.description,
        pole_id: s.pole_id,
        status: 'draft',
        version: 'v1.0',
        owner_id: user.user?.id ?? null,
        template_id: s.template_id,
        layout: s.layout,
        pages: s.pages,
      }).select().single();
      if (error) throw error;
      const { data: widgets } = await supabase.from('bi_dashboard_widgets' as any).select('*').eq('dashboard_id', id);
      if (widgets && (widgets as any[]).length) {
        await supabase.from('bi_dashboard_widgets' as any).insert(
          (widgets as any[]).map((w: any) => ({
            dashboard_id: (copy as any).id,
            page_id: w.page_id, type: w.type, title: w.title,
            config: w.config, x: w.x, y: w.y, w: w.w, h: w.h,
            kpi_id: w.kpi_id, data_source: w.data_source,
          }))
        );
      }
      return copy as any;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bi_dashboards'] });
      toast({ title: 'Tableau dupliqué' });
    },
  });
};

export const useArchiveDashboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bi_dashboards' as any)
        .update({ status: 'archived', archive_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bi_dashboards'] });
      toast({ title: 'Tableau archivé' });
    },
  });
};

export const usePublishDashboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'submit' | 'publish' | 'schedule'; publish_at?: string }) => {
      const patch: any = {};
      if (action === 'submit') patch.status = 'validation';
      if (action === 'publish') { patch.status = 'published'; patch.published_at = new Date().toISOString(); }
      const { error } = await supabase.from('bi_dashboards' as any).update(patch).eq('id', id);
      if (error) throw error;

      // Create a linked publication_request so it flows into Tech backlog
      if (action === 'submit') {
        const { data: user } = await supabase.auth.getUser();
        const { data: dash } = await supabase.from('bi_dashboards' as any).select('name, description').eq('id', id).single();
        await supabase.from('publication_requests' as any).insert({
          title: `Dashboard BI : ${(dash as any)?.name ?? ''}`,
          description: (dash as any)?.description ?? null,
          request_type: 'dashboard',
          status: 'data_validated',
          priority: 'medium',
          requested_by: user.user?.id ?? null,
          notes: `Rattaché au dashboard BI ${id}`,
        });
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['bi_dashboards'] });
      qc.invalidateQueries({ queryKey: ['bi_dashboard', v.id] });
      qc.invalidateQueries({ queryKey: ['publication_requests'] });
      toast({ title: v.action === 'submit' ? 'Envoyé en validation' : 'Publié' });
    },
  });
};

export const useUpsertWidget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (widget: Partial<BIWidget> & { dashboard_id: string }) => {
      if (widget.id) {
        const { id, ...patch } = widget;
        const { error } = await supabase.from('bi_dashboard_widgets' as any).update(patch).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bi_dashboard_widgets' as any).insert(widget);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['bi_widgets', v.dashboard_id] }),
  });
};

export const useDeleteWidget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dashboard_id }: { id: string; dashboard_id: string }) => {
      const { error } = await supabase.from('bi_dashboard_widgets' as any).delete().eq('id', id);
      if (error) throw error;
      return { dashboard_id };
    },
    onSuccess: (res) => qc.invalidateQueries({ queryKey: ['bi_widgets', res.dashboard_id] }),
  });
};

export const useTemplates = () =>
  useQuery({
    queryKey: ['bi_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bi_templates' as any).select('*').order('name');
      if (error) throw error;
      return (data ?? []) as unknown as BITemplate[];
    },
  });

export const useDataSources = () =>
  useQuery({
    queryKey: ['bi_data_sources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bi_data_sources' as any).select('*').order('name');
      if (error) throw error;
      return (data ?? []) as unknown as BIDataSource[];
    },
  });

export const useCreateDataSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<BIDataSource>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('bi_data_sources' as any).insert({
        ...payload,
        owner_id: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bi_data_sources'] });
      toast({ title: 'Source de données créée' });
    },
  });
};

export const useVersions = (dashboardId?: string) =>
  useQuery({
    queryKey: ['bi_versions', dashboardId],
    enabled: !!dashboardId,
    queryFn: async () => {
      const { data, error } = await supabase.from('bi_dashboard_versions' as any)
        .select('*').eq('dashboard_id', dashboardId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BIVersion[];
    },
  });

export const useSaveVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dashboard_id, version, snapshot, note }: { dashboard_id: string; version: string; snapshot: any; note?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('bi_dashboard_versions' as any).insert({
        dashboard_id, version, snapshot, note: note ?? null,
        author_id: user.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['bi_versions', v.dashboard_id] });
      toast({ title: 'Version enregistrée' });
    },
  });
};
