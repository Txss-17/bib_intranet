import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useIsLeadership = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-leadership', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_leadership', { _user_id: user!.id });
      if (error) throw error;
      return !!data;
    },
  });
};

export interface RoadmapObjective { name: string; completed: boolean; start_date?: string | null; end_date?: string | null }
export interface RoadmapItem {
  id: string;
  kind: 'milestone' | 'priority';
  phase: string | null;
  title: string;
  status: string;
  progress: number;
  weight: number;
  objectives: RoadmapObjective[];
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
}
export interface RoadmapHistory {
  id: string;
  item_title: string | null;
  action: 'create' | 'update' | 'delete';
  old_value: Json | null;
  new_value: Json | null;
  performed_by: string | null;
  performer_name?: string | null;
  created_at: string;
}

export const useRoadmapItems = () =>
  useQuery({
    queryKey: ['roadmap-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('direction_roadmap_items').select('*').order('sort_order');
      if (error) throw error;
      return (data || []).map((row) => ({
        ...row,
        objectives: Array.isArray(row.objectives)
          ? row.objectives.filter(
              (objective): objective is Record<string, Json> =>
                typeof objective === 'object' &&
                objective !== null &&
                !Array.isArray(objective),
            ).map((objective) => ({
              name: typeof objective.name === 'string' ? objective.name : '',
              completed: objective.completed === true,
              start_date: typeof objective.start_date === 'string' ? objective.start_date : null,
              end_date: typeof objective.end_date === 'string' ? objective.end_date : null,
            }))
          : [],
      })) as RoadmapItem[];
    },
  });

export const useRoadmapHistory = (enabled: boolean) =>
  useQuery({
    queryKey: ['roadmap-history'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('direction_roadmap_history').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const ids = [...new Set(data.map((row) => row.performed_by).filter((id): id is string => Boolean(id)))];
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', ids);
        if (profileError) throw profileError;
        profiles.forEach((profile) => {
          names[profile.id] = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
        });
      }
      return data.map((row) => ({
        ...row,
        performer_name: row.performed_by ? names[row.performed_by] ?? null : null,
      })) as RoadmapHistory[];
    },
  });

export const useRoadmapActions = () => {
  const qc = useQueryClient();
  const done = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['roadmap-items'] });
    qc.invalidateQueries({ queryKey: ['roadmap-history'] });
  };
  const onError = (e: Error) => toast.error('Roadmap', { description: e.message });
  return {
    save: useMutation({
      mutationFn: async ({ id, ...patch }: Partial<RoadmapItem>) => {
        const objectives = patch.objectives?.map((objective) => ({
          name: objective.name,
          completed: objective.completed,
          start_date: objective.start_date ?? null,
          end_date: objective.end_date ?? null,
        }));

        if (id) {
          const { error } = await supabase
            .from('direction_roadmap_items')
            .update({ ...patch, objectives })
            .eq('id', id);
          if (error) throw error;
          return;
        }

        if (!patch.title) {
          throw new Error('Le titre est obligatoire pour créer un élément de roadmap.');
        }

        const { error } = await supabase
          .from('direction_roadmap_items')
          .insert({ ...patch, title: patch.title, objectives });
        if (error) throw error;
      },
      onSuccess: () => done('Roadmap enregistrée'),
      onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('direction_roadmap_items').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => done('Élément supprimé'),
      onError,
    }),
  };
};

export interface GovernanceDoc {
  id: string; name: string; version: string | null; file_path: string;
  file_type: string | null; file_size: number | null; created_at: string;
}

export const useGovernanceDocs = (enabled: boolean) =>
  useQuery({
    queryKey: ['governance-docs'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('governance_documents').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as GovernanceDoc[];
    },
  });

export const useGovernanceDocActions = () => {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['governance-docs'] });
  const onError = (e: Error) => toast.error('Documents', { description: e.message });
  return {
    upload: useMutation({
      mutationFn: async ({ file, name, version }: { file: File; name: string; version: string }) => {
        const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
        const { error: e1 } = await supabase.storage.from('governance-documents').upload(path, file, { contentType: file.type });
        if (e1) throw e1;
        const { error } = await supabase.from('governance_documents').insert({
          name: name || file.name, version: version || null, file_path: path, file_type: file.type, file_size: file.size,
        });
        if (error) {
          await supabase.storage.from('governance-documents').remove([path]);
          throw error;
        }
      },
      onSuccess: () => { toast.success('Document ajouté'); refresh(); },
      onError,
    }),
    remove: useMutation({
      mutationFn: async (doc: GovernanceDoc) => {
        await supabase.storage.from('governance-documents').remove([doc.file_path]);
        const { error } = await supabase.from('governance_documents').delete().eq('id', doc.id);
        if (error) throw error;
      },
      onSuccess: () => { toast.success('Document supprimé'); refresh(); },
      onError,
    }),
  };
};

export const openGovernanceDoc = async (doc: GovernanceDoc) => {
  const { data, error } = await supabase.storage.from('governance-documents').createSignedUrl(doc.file_path, 60);
  if (error || !data) { toast.error('Lecture impossible', { description: error?.message }); return; }
  window.open(data.signedUrl, '_blank', 'noopener');
};

export interface GovernanceBlock {
  id: string; kind: 'entity' | 'board_member'; name: string; subtitle: string | null;
  description: string | null; detail: string | null; status: string; sort_order: number;
}

export const useGovernanceBlocks = () =>
  useQuery({
    queryKey: ['governance-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('governance_blocks').select('*').order('sort_order');
      if (error) throw error;
      return (data || []) as GovernanceBlock[];
    },
  });

export const useGovernanceBlockActions = () => {
  const qc = useQueryClient();
  const done = (m: string) => { toast.success(m); qc.invalidateQueries({ queryKey: ['governance-blocks'] }); };
  const onError = (e: Error) => toast.error('Gouvernance', { description: e.message });
  return {
    save: useMutation({
      mutationFn: async ({ id, ...patch }: Partial<GovernanceBlock>) => {
        if (id) {
          const { error } = await supabase
            .from('governance_blocks')
            .update(patch)
            .eq('id', id);
          if (error) throw error;
          return;
        }

        if (!patch.kind || !patch.name) {
          throw new Error('Le type et le nom sont obligatoires pour créer un bloc de gouvernance.');
        }

        const { error } = await supabase
          .from('governance_blocks')
          .insert({ ...patch, kind: patch.kind, name: patch.name });
        if (error) throw error;
      },
      onSuccess: () => done('Bloc enregistré'),
      onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from('governance_blocks').delete().eq('id', id);
        if (error) throw error;
      },
      onSuccess: () => done('Bloc supprimé'),
      onError,
    }),
  };
};
