import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckSquare, Plus, Search, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  TaskPriority, TaskStatus, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, WorkTask,
  useWorkTaskActions, useWorkTasks, useWorkTaskPermissions, useWorkTaskDiscussion,
} from '@/hooks/useWorkTasks';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { poles } from '@/data/poles';
import { usePoleCollaborators, collaboratorName } from '@/hooks/usePoleCollaborators';
import { matchesTaskView } from '@/lib/workTasks';

const statusVariant = (s: TaskStatus) =>
  s === 'completed' ? 'default' : s === 'in_progress' ? 'secondary' : 'outline';
const priorityVariant = (p: TaskPriority) =>
  p === 'critical' || p === 'high' ? 'destructive' : 'outline';

const NEXT: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress', 'completed'],
  in_progress: ['review', 'completed', 'pending'],
  review: ['completed', 'in_progress'],
  completed: ['in_progress'],
};

const isLate = (t: WorkTask) =>
  t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());

export default function WorkTasks() {
  const { data: rows = [], isLoading, isError, refetch } = useWorkTasks();
  const { user, profile } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  const { data: rights, isError: rightsError, refetch: refetchRights } = useWorkTaskPermissions();
  const allowed = (action: 'create' | 'update' | 'delete') => rights?.[action] === true && can('work.tasks', action);
  const [scope, setScope] = useState('mine');
  const [poleFilter, setPoleFilter] = useState('all');
  const [assigneePole, setAssigneePole] = useState<string>(() => profile?.poles?.[0] || 'direction');
  useEffect(() => {
    // Profile may arrive after the first render; avoid querying another pole.
    if (profile?.poles?.length && !isSuperAdmin && !profile.poles.includes(assigneePole)) {
      setAssigneePole(profile.poles[0]);
    }
  }, [profile?.poles, isSuperAdmin, assigneePole]);
  const { data: people = [], isError: peopleError } = usePoleCollaborators(
    assigneePole, 'work.tasks', 'read',
  );
  const { create, update, remove } = useWorkTaskActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selId = searchParams.get('task');
  const setSelId = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('task', id); else next.delete('task');
    setSearchParams(next, { replace: true });
  };
  const [form, setForm] = useState({ title: '', description: '', objective: '', task_poles: [] as string[], priority: 'medium', assignee_id: '', due_date: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;

  const ownsSelection = !!sel && (sel.created_by === user?.id || sel.assignee_id === user?.id || isSuperAdmin || profile?.poles?.includes('direction'));
  const canEdit = allowed('update') && ownsSelection && !sel?.archived_at;
  const selectablePoles = poles.filter(p => isSuperAdmin || profile?.poles?.includes('direction') || profile?.poles?.includes(p.id));

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          (status === 'archived' ? !!t.archived_at : !t.archived_at) && matchesTaskView(t, scope, user?.id, profile?.poles || [], poleFilter) &&
          (status === 'all' || status === 'archived' || (status === 'open' ? t.status !== 'completed' : t.status === status)) &&
          (!q || `${t.title} ${t.description || ""} ${t.objective || ""} ${t.assignee_name} ${(t.task_poles || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status, scope, poleFilter, user?.id, profile?.poles],
  );

  const count = (s: TaskStatus[]) => rows.filter((t) => !t.archived_at && s.includes(t.status)).length;
  const late = rows.filter(t => !t.archived_at && isLate(t)).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CheckSquare className="h-5 w-5" />
            Tâches
          </h1>
          <p className="text-sm text-muted-foreground">Tâches transverses : attribution, priorités, échéances et suivi.</p>
        </div>
        <Button disabled={!allowed('create')} onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      {(isError || rightsError) && <div role="alert" className="rounded-md border border-destructive p-4">Impossible de charger les tâches ou vos droits. <Button variant="outline" onClick={() => { void refetch(); void refetchRights(); }}>Actualiser</Button></div>}
      <div className="flex flex-wrap gap-2" aria-label="Vues des tâches">
        {[['mine', 'Mes tâches'], ['general', 'Général'], ['pole', 'Mes pôles'], ['multi', 'Multi-pôles'], ['all', 'Toutes les tâches accessibles']].map(([key, label]) => (
          <Button key={key} variant={scope === key ? 'default' : 'outline'} onClick={() => setScope(key)}>{label}</Button>
        ))}
        <Select value={poleFilter} onValueChange={setPoleFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Par pôle" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tous les pôles accessibles</SelectItem>{poles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ['À faire', ['pending']],
          ['En cours', ['in_progress']],
          ['En revue', ['review']],
          ['Terminées', ['completed']],
        ] as [string, TaskStatus[]][]).map(([l, s]) => (
          <Card key={l}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-2xl font-semibold">{count(s)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En retard</p>
            <p className={`text-2xl font-semibold ${late > 0 ? 'text-destructive' : ''}`}>{late}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">En cours</SelectItem>
            <SelectItem value="all">Toutes</SelectItem><SelectItem value="archived">Archives</SelectItem>
            {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune tâche.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() => setSelId(t.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.assignee_name ?? 'Non assignée'}
                        {t.task_poles?.length ? ` · ${t.task_poles.join(', ')}` : ' · Général'}
                        {t.due_date ? ` · échéance ${format(new Date(t.due_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                        {isLate(t) ? ' · en retard' : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={priorityVariant(t.priority)}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                      <Badge variant={statusVariant(t.status)}>{t.archived_at ? 'Archivée' : TASK_STATUS_LABELS[t.status]}</Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Objectif attendu</Label>
              <Textarea maxLength={5000} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} />
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pôles concernés</Label>
                <div className="max-h-36 overflow-y-auto rounded border p-2">
                  {selectablePoles.map(p => <label key={p.id} className="flex gap-2 py-1 text-sm"><input type="checkbox" checked={form.task_poles.includes(p.id)} onChange={e => setForm({ ...form, task_poles: e.target.checked ? [...form.task_poles, p.id] : form.task_poles.filter(id => id !== p.id) })} />{p.shortName}</label>)}
                </div><p className="text-xs text-muted-foreground">Aucun pôle : tâche générale.</p>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pôle du responsable</Label>
                <Select value={assigneePole} onValueChange={v => { setAssigneePole(v); setForm(f => ({ ...f, assignee_id: '' })); }}>
                  <SelectTrigger aria-label="Pôle des collaborateurs"><SelectValue /></SelectTrigger>
                  <SelectContent>{selectablePoles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <Label>Responsable</Label>
                <Select value={form.assignee_id} onValueChange={(v) => setForm({ ...form, assignee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assignée</SelectItem>
                    {people.filter(p => p.eligible).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{collaboratorName(p)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {peopleError && <p role="alert" className="text-xs text-destructive">Annuaire indisponible. Vérifiez les permissions et la migration 0074.</p>}
              </div>
              <div>
                <Label>Échéance</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!form.title.trim() || create.isPending || !allowed('create')}
              onClick={() =>
                create.mutate(
                  {
                    title: form.title,
                    description: form.description || null,
                    task_poles: form.task_poles,
                    objective: form.objective || null,
                    priority: form.priority as TaskPriority,
                    assignee_id: !form.assignee_id || form.assignee_id === 'none' ? null : form.assignee_id,
                    due_date: form.due_date || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setScope('all');
                      setForm({ title: '', description: '', objective: '', task_poles: [] as string[], priority: 'medium', assignee_id: '', due_date: '' });
                    },
                  },
                )
              }
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(sel.status)}>{sel.archived_at ? 'Archivée' : TASK_STATUS_LABELS[sel.status]}</Badge>
                  <Badge variant={priorityVariant(sel.priority)}>{TASK_PRIORITY_LABELS[sel.priority]}</Badge>
                  {!sel.archived_at && isLate(sel) && <Badge variant="destructive">En retard</Badge>}
                </div>
                <TaskContentEditor key={`${sel.id}-${sel.updated_at}`} task={sel} disabled={!canEdit || update.isPending} save={patch => update.mutate({ id: sel.id, updated_at: sel.updated_at, ...patch })} />
                {sel.objective && <p className="whitespace-pre-wrap"><strong>Objectif : </strong>{sel.objective}</p>}
                {sel.description && <p className="whitespace-pre-wrap">{sel.description}</p>}
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="font-medium">{sel.assignee_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Échéance</p>
                    <p className="font-medium">
                      {sel.due_date ? format(new Date(sel.due_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Responsable</Label>
                    <Select
                      disabled={!canEdit || update.isPending}
                      value={sel.assignee_id ?? 'none'}
                      onValueChange={(v) => update.mutate({ id: sel.id, updated_at: sel.updated_at, assignee_id: v === 'none' ? null : v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assignée</SelectItem>
                    {people.filter(p => p.eligible).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{collaboratorName(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Échéance</Label>
                    <Input
                      type="date"
                      key={`${sel.id}-${sel.due_date}`}
                      disabled={!canEdit || update.isPending}
                      defaultValue={sel.due_date ?? ''}
                      onBlur={(e) => { if ((e.target.value || null) !== sel.due_date) update.mutate({ id: sel.id, updated_at: sel.updated_at, due_date: e.target.value || null }); }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {NEXT[sel.status].map((to) => (
                    <Button
                      key={to}
                      size="sm"
                      variant={to === 'completed' ? 'default' : 'outline'}
                      disabled={update.isPending || !canEdit}
                      onClick={() => update.mutate({ id: sel.id, updated_at: sel.updated_at, status: to })}
                    >
                      → {TASK_STATUS_LABELS[to]}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={remove.isPending || !allowed('delete') || !canEdit}
                    onClick={() => { if (window.confirm('Archiver cette tâche ? Son historique sera conservé.')) remove.mutate(sel, { onSuccess: () => setSelId(null) }); }}
                  >
                    <Archive className="mr-1 h-4 w-4" />
                    Archiver
                  </Button>
                </div>
                <TaskDiscussion key={sel.id} taskId={sel.id} canComment={allowed('update') && !sel.archived_at} people={people} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}


function TaskContentEditor({ task, disabled, save }: { task: WorkTask; disabled: boolean; save: (patch: Partial<WorkTask>) => void }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [objective, setObjective] = useState(task.objective || '');
  const [priority, setPriority] = useState(task.priority);
  if (disabled) return null;
  return <details><summary className="cursor-pointer font-medium">Modifier le contenu</summary><div className="mt-3 space-y-2">
    <Label>Titre</Label><Input maxLength={255} value={title} onChange={e => setTitle(e.target.value)} />
    <Label>Priorité</Label><Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TASK_PRIORITY_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
    <Label>Objectif attendu</Label><Textarea maxLength={5000} value={objective} onChange={e => setObjective(e.target.value)} />
    <Label>Description</Label><Textarea maxLength={20000} value={description} onChange={e => setDescription(e.target.value)} />
    <Button disabled={!title.trim()} onClick={() => save({ priority, title: title.trim(), objective: objective || null, description: description || null })}>Enregistrer le contenu</Button>
  </div></details>;
}

function TaskDiscussion({ taskId, canComment, people }: { taskId: string; canComment: boolean; people: { id: string; first_name: string; last_name: string }[] }) {
  const { comments, history, addComment } = useWorkTaskDiscussion(taskId);
  const [body, setBody] = useState('');
  const author = (id: string | null) => { const p = people.find(p => p.id === id); return p ? `${p.first_name} ${p.last_name}` : 'Collaborateur'; };
  const fields = { title: 'Titre', description: 'Description', objective: 'Objectif', status: 'Statut', priority: 'Priorité', assignee_id: 'Responsable', due_date: 'Échéance', task_poles: 'Pôles', archived_at: 'Archivage' };
  return <div className="space-y-4 border-t pt-4">
    <h2 className="font-semibold">Commentaires</h2>
    {comments.isLoading && <p>Chargement…</p>}
    {comments.isError && <p role="alert">Commentaires indisponibles. <button onClick={() => void comments.refetch()}>Réessayer</button></p>}
    {comments.data?.length === 0 && <p className="text-muted-foreground">Aucun commentaire.</p>}
    {comments.data?.map(c => <div key={c.id} className="rounded border p-3"><p className="text-xs text-muted-foreground">{author(c.author_id)} · {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</p><p className="whitespace-pre-wrap">{c.body}</p></div>)}
    {canComment && <div className="space-y-2"><Label htmlFor="task-comment">Nouveau commentaire</Label><Textarea id="task-comment" value={body} maxLength={5000} onChange={e => setBody(e.target.value)} disabled={addComment.isPending} /><Button disabled={!body.trim() || addComment.isPending} onClick={() => addComment.mutate(body, { onSuccess: () => setBody('') })}>Ajouter le commentaire</Button></div>}
    <h2 className="font-semibold">Historique</h2>
    {history.isLoading && <p>Chargement…</p>}
    {history.isError && <p role="alert">Historique indisponible. <button onClick={() => void history.refetch()}>Réessayer</button></p>}
    {history.data?.map(h => <details key={h.id} className="rounded border p-3"><summary className="cursor-pointer">{h.action === 'imported' ? 'État existant repris' : h.action === 'created' ? 'Création' : h.action === 'archived' ? 'Archivage' : 'Modification'} · {author(h.actor_id)} · {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</summary>
      <dl className="mt-2 space-y-1">{Object.entries(fields).filter(([key]) => JSON.stringify(h.before_state?.[key]) !== JSON.stringify(h.after_state[key])).map(([key, label]) => <div key={key}><dt className="font-medium">{label}</dt><dd className="whitespace-pre-wrap break-words">{JSON.stringify(h.before_state?.[key] ?? '—')} → {JSON.stringify(h.after_state[key] ?? '—')}</dd></div>)}</dl>
    </details>)}
  </div>;
}
