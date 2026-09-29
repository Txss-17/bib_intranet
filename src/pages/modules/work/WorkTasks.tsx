import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckSquare, Plus, Search, Trash2 } from 'lucide-react';
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
  useTaskAssignees, useWorkTaskActions, useWorkTasks,
} from '@/hooks/useWorkTasks';

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
  const { data: rows = [], isLoading } = useWorkTasks();
  const { data: people = [] } = useTaskAssignees();
  const { create, update, remove } = useWorkTaskActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', pole: '', priority: 'medium', assignee_id: '', due_date: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;

  const filtered = useMemo(
    () =>
      rows.filter(
        (t) =>
          (status === 'all' || (status === 'open' ? t.status !== 'completed' : t.status === status)) &&
          (!q || `${t.title} ${t.assignee_name} ${t.pole}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status],
  );

  const count = (s: TaskStatus[]) => rows.filter((t) => s.includes(t.status)).length;
  const late = rows.filter(isLate).length;

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
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
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
            <SelectItem value="all">Toutes</SelectItem>
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
                        {t.pole ? ` · ${t.pole}` : ''}
                        {t.due_date ? ` · échéance ${format(new Date(t.due_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                        {isLate(t) ? ' · en retard' : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={priorityVariant(t.priority)}>{TASK_PRIORITY_LABELS[t.priority]}</Badge>
                      <Badge variant={statusVariant(t.status)}>{TASK_STATUS_LABELS[t.status]}</Badge>
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
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pôle</Label>
                <Input value={form.pole} onChange={(e) => setForm({ ...form, pole: e.target.value })} placeholder="ops, finance…" />
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
                <Label>Responsable</Label>
                <Select value={form.assignee_id} onValueChange={(v) => setForm({ ...form, assignee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Échéance</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!form.title || create.isPending}
              onClick={() =>
                create.mutate(
                  {
                    title: form.title,
                    description: form.description || null,
                    pole: form.pole || null,
                    priority: form.priority as TaskPriority,
                    assignee_id: form.assignee_id || null,
                    due_date: form.due_date || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ title: '', description: '', pole: '', priority: 'medium', assignee_id: '', due_date: '' });
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
                  <Badge variant={statusVariant(sel.status)}>{TASK_STATUS_LABELS[sel.status]}</Badge>
                  <Badge variant={priorityVariant(sel.priority)}>{TASK_PRIORITY_LABELS[sel.priority]}</Badge>
                  {isLate(sel) && <Badge variant="destructive">En retard</Badge>}
                </div>
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
                      value={sel.assignee_id ?? ''}
                      onValueChange={(v) => update.mutate({ id: sel.id, assignee_id: v || null })}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {people.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Échéance</Label>
                    <Input
                      type="date"
                      defaultValue={sel.due_date ?? ''}
                      onBlur={(e) => update.mutate({ id: sel.id, due_date: e.target.value || null })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {NEXT[sel.status].map((to) => (
                    <Button
                      key={to}
                      size="sm"
                      variant={to === 'completed' ? 'default' : 'outline'}
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: sel.id, status: to })}
                    >
                      → {TASK_STATUS_LABELS[to]}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(sel.id, { onSuccess: () => setSelId(null) })}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
