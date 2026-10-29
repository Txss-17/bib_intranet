import type { WorkTask } from '@/hooks/useWorkTasks';

export function matchesTaskView(task: WorkTask, view: string, userId: string | undefined, userPoles: string[], pole = 'all') {
  const taskPoles = task.task_poles || [];
  if (pole !== 'all' && !taskPoles.includes(pole)) return false;
  switch (view) {
    case 'all': return true;
    case 'mine': return !!userId && task.assignee_id === userId;
    case 'general': return taskPoles.length === 0;
    case 'multi': return taskPoles.length > 1;
    case 'pole': return taskPoles.some(p => userPoles.includes(p));
    default: return false;
  }
}
