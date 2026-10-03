import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name?: string | null;
  created_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

const db = supabase as any;

export const useWorkTasks = () =>
  useQuery({
    queryKey: ['work-tasks'],
    queryFn: async () => {
      const { data, error } = await db
        .from('work_tasks')
        .select('*, assignee:profiles!work_tasks_assignee_id_fkey(first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        assignee_name: t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name}` : null,
      })) as WorkTask[];
    },
  });

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
    mutationFn: async (input: Partial<WorkTask>) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await db.from('work_tasks').insert({ ...input, created_by: user.user?.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Tâche créée'); done(); },
    onError,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<WorkTask> & { id: string }) => {
      if (patch.status === 'completed') patch.completed_at = new Date().toISOString();
      if (patch.status && patch.status !== 'completed') patch.completed_at = null;
      const { error } = await db.from('work_tasks').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Tâche mise à jour'); done(); },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('work_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Tâche supprimée'); done(); },
    onError,
  });

  return { create, update, remove };
};
