import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardList, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkTasks, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, type WorkTask } from '@/hooks/useWorkTasks';

function dueLabel(value: string | null) {
  if (!value) return 'Sans échéance';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Échéance indisponible' :
    date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function WorkTasksOverview() {
  const { user, profile } = useAuth();
  const { poles, isSuperAdmin, canViewPath } = usePermissions();
  const { data: tasks = [], isLoading, isError } = useWorkTasks();
  const userPoles = poles.length ? poles : profile?.poles ?? [];
  const leadership = isSuperAdmin || userPoles.includes('direction') || profile?.position === 'ceo';
  const canReadTasks = canViewPath('/work/tasks');

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    if (task.archived_at || task.status === 'completed') return false;
    if (leadership) return true;
    if (task.assignee_id === user?.id) return true;
    const scopes = [...(task.task_poles ?? []),task.pole].filter(Boolean);
    return scopes.some(pole => userPoles.includes(String(pole)));
  }).sort((a,b) => {
    const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    const dateCompare = aDue - bDue;
    if (dateCompare !== 0) return dateCompare;
    const weight = (t: WorkTask) => ({critical:0,high:1,medium:2,low:3})[t.priority] ?? 4;
    return weight(a)-weight(b);
  }),[tasks,leadership,user?.id,userPoles.join('|')]);

  if (!canReadTasks) return null;
  const upcoming = visibleTasks.filter(t => t.status === 'pending').length;
  const active = visibleTasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;

  return (
    <section aria-labelledby="dashboard-my-work" className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="dashboard-my-work" className="flex items-center gap-2 text-base font-semibold">
            <ClipboardList className="h-4 w-4 text-primary" /> Tâches et échéances
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Uniquement les tâches auxquelles votre compte est autorisé à accéder.
          </p>
        </div>
        <Link className="inline-flex items-center gap-1 text-xs font-medium text-primary underline" to="/work/tasks">
          Mes tâches <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      {isLoading ? <p className="mt-4 text-sm text-muted-foreground">Chargement des tâches réelles…</p>
      : isError ? <div className="mt-4 flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4"/>Impossible de vérifier les tâches. Aucun chiffre de remplacement n'est affiché.</div>
      : <>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{active}</strong> en cours ou en revue</span>
          <span><strong className="text-foreground">{upcoming}</strong> à démarrer</span>
        </div>
        {visibleTasks.length === 0
          ? <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Aucune tâche en cours ou à venir dans votre périmètre.</div>
          : <ul className="mt-3 divide-y divide-border/70">
              {visibleTasks.slice(0,6).map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {TASK_STATUS_LABELS[task.status] ?? task.status} · {TASK_PRIORITY_LABELS[task.priority] ?? task.priority} · {task.pole ?? (task.task_poles ?? []).join(', ') || 'Transversale'}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />{dueLabel(task.due_date)}</span>
              </li>)}
            </ul>}
        {visibleTasks.length > 6 && <p className="mt-2 text-xs text-muted-foreground">{visibleTasks.length-6} autre(s) tâche(s) dans votre espace de travail.</p>}
      </>}
    </section>
  );
}
