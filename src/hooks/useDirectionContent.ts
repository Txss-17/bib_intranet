import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const db = supabase as any;

export const useIsLeadership = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-leadership', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await db.rpc('is_leadership', { _user_id: user!.id });
      return !!data;
    },
  });
};

export interface RoadmapObjective { name: string; completed: boolean }
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
}
export interface RoadmapHistory {
  id: string;
  item_title: string | null;
  action: 'create' | 'update' | 'delete';
  old_value: any;
  new_value: any;
  performed_by: string | null;
  performer_name?: string | null;
  created_at: string;
}

export const useRoadmapItems = () =>
  useQuery({
    queryKey: ['roadmap-items'],
    queryFn: async () => {
      const { data, error } = await db.from('direction_roadmap_items').select('*').order('sort_order');
      if (error) throw error;
      return (data || []).map((r: any) => ({ ...r, objectives: Array.isArray(r.objectives) ? r.objectives : [] })) as RoadmapItem[];
    },
  });

export const useRoadmapHistory = (enabled: boolean) =>
  useQuery({
    queryKey: ['roadmap-history'],
    enabled,
    queryFn: async () => {
      const { data, error } = await db.from('direction_roadmap_history').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      const ids = [...new Set((data || []).map((r: any) => r.performed_by).filter(Boolean))];
      const names: Record<string, string> = {};
      if (ids.length) {
        const { data: p } = await db.from('profiles').select('id, first_name, last_name').in('id', ids);
        (p || []).forEach((x: any) => { names[x.id] = `${x.first_name} ${x.last_name}`; });
      }
      return (data || []).map((r: any) => ({ ...r, performer_name: r.performed_by ? names[r.performed_by] ?? null : null })) as RoadmapHistory[];
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
        const { error } = id
          ? await db.from('direction_roadmap_items').update(patch).eq('id', id)
          : await db.from('direction_roadmap_items').insert(patch);
        if (error) throw error;
      },
      onSuccess: () => done('Roadmap enregistrée'),
      onError,
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await db.from('direction_roadmap_items').delete().eq('id', id);
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
      const { data, error } = await db.from('governance_documents').select('*').order('created_at', { ascending: false });
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
        const { error } = await db.from('governance_documents').insert({
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
        const { error } = await db.from('governance_documents').delete().eq('id', doc.id);
        if (error) throw error;
      },
      onSuccess: () => { toast.success('Document supprimé'); refresh(); },
      onError,
    }),
  };
};

export const openGovernanceDoc = async (doc: GovernanceDoc) => {
  const { data, error } = await supabase.storage.from('governance-documents').createSignedUrl(doc.file_path, 300);
  if (error || !data) { toast.error('Lecture impossible', { description: error?.message }); return; }
  window.open(data.signedUrl, '_blank', 'noopener');
};
