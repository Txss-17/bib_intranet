import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'À faire',
  in_progress: 'En cours',
  review: 'En revue',
  completed: 'Terminée',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

export interface WorkTask {
  id: string;
  title: string;
  description: string | null;
  pole: string | null;
  task_poles: string[];
  objective: string | null;
  updated_at: string;
  archived_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name?: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const db = supabase;

export const useWorkTasks = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['work-tasks', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('work_tasks')
        .select('*, assignee:profiles!work_tasks_assignee_id_fkey(first_name, last_name)')
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        assignee_name: t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name}` : null,
      })) as WorkTask[];
    },
  });
};

export const useTaskAssignees = () =>
  useQuery({
    queryKey: ['task-assignees'],
    queryFn: async () => {
      const { data, error } = await db.from('profiles').select('id, first_name, last_name, email').order('first_name');
      if (error) throw error;
      return (data || []) as { id: string; first_name: string; last_name: string; email: string }[];
    },
  });

export const useWorkTaskActions = () => {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['work-tasks'] });
  const onError = (e: Error) => toast.error('Tâches', { description: e.message });

  const create = useMutation({
    mutationFn: async (input: Pick<WorkTask, 'title' | 'description' | 'objective' | 'task_poles' | 'priority' | 'assignee_id' | 'due_date'>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Connexion requise.');
      const { error } = await db.from('work_tasks').insert({ ...input, title: input.title.trim(), created_by: user.user.id }).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Tâche créée'); done(); },
    onError,
  });

  const update = useMutation({
    mutationFn: async ({ id, updated_at, ...patch }: Partial<WorkTask> & { id: string; updated_at: string }) => {
      const { error } = await db.from('work_tasks').update(patch).eq('id', id).eq('updated_at', updated_at).select('id').single();
      if (error) throw new Error('Modification refusée ou tâche modifiée par un collègue. Actualisez puis réessayez.');
    },
    onSuccess: () => { toast.success('Tâche mise à jour'); done(); },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (task: WorkTask) => {
      const { error } = await db.from('work_tasks').update({ archived_at: new Date().toISOString() }).eq('id', task.id).eq('updated_at', task.updated_at).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Tâche archivée'); done(); },
    onError,
  });

  return { create, update, remove };
};


export function useWorkTaskPermissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['work-task-permissions', user?.id], enabled: !!user,
    staleTime: 15000, refetchInterval: 30000,
    queryFn: async (): Promise<Record<'read' | 'create' | 'update' | 'delete', boolean>> => {
      const { data, error } = await db.rpc('get_work_task_permissions');
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Droits indisponibles.');
      return { read: data.read === true, create: data.create === true, update: data.update === true, delete: data.delete === true };
    },
  });
}

export function useWorkTaskDiscussion(taskId: string) {
  const qc = useQueryClient();
  const comments = useQuery({
    queryKey: ['work-task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await db.from('work_task_comments').select('id,body,author_id,created_at').eq('task_id', taskId).order('created_at');
      if (error) throw error;
      return data as { id: string; body: string; author_id: string; created_at: string }[];
    },
  });
  const history = useQuery({
    queryKey: ['work-task-history', taskId],
    queryFn: async () => {
      const { data, error } = await db.from('work_task_history').select('id,action,actor_id,created_at,before_state,after_state').eq('task_id', taskId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; action: string; actor_id: string | null; created_at: string; before_state: WorkTask | null; after_state: WorkTask }[];
    },
  });
  const addComment = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await db.from('work_task_comments').insert({ task_id: taskId, body: body.trim() }).select('id').single();
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-task-comments', taskId] }),
    onError: () => toast.error('Commentaire non enregistré. Réessayez.'),
  });
  return { comments, history, addComment };
}
