import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FolderKanban, Plus, Search, Trash2 } from 'lucide-react';
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
  ProjectStatus, PROJECT_STATUS_LABELS, WorkProject,
  useWorkModuleActions, useWorkProjects,
} from '@/hooks/useWorkModule';
import { useTaskAssignees } from '@/hooks/useWorkTasks';

const statusVariant = (s: ProjectStatus) =>
  s === 'completed' ? 'default' : s === 'active' ? 'secondary' : 'outline';

export default function WorkProjects() {
  const { data: rows = [], isLoading } = useWorkProjects();
  const { data: people = [] } = useTaskAssignees();
  const { projects } = useWorkModuleActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', pole: '', owner_id: '', due_date: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;

  const filtered = useMemo(
    () =>
      rows.filter(
        (p) =>
          (status === 'all' || (status === 'active' ? p.status !== 'completed' && p.status !== 'cancelled' : p.status === status)) &&
          (!q || `${p.name} ${p.owner_name} ${p.pole}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status],
  );

  const count = (s: ProjectStatus[]) => rows.filter((p) => s.includes(p.status)).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FolderKanban className="h-5 w-5" />
            Projets
          </h1>
          <p className="text-sm text-muted-foreground">Projets transverses : porteur, échéance et avancement.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ['Planification', ['planning']],
          ['Actifs', ['active']],
          ['En pause', ['on_hold']],
          ['Terminés', ['completed']],
          ['Annulés', ['cancelled']],
        ] as [string, ProjectStatus[]][]).map(([l, s]) => (
          <Card key={l}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="text-2xl font-semibold">{count(s)}</p>
            </CardContent>
          </Card>
        ))}
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
            <SelectItem value="active">En cours</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(PROJECT_STATUS_LABELS)
              .filter(([k]) => k !== 'active')
              .map(([k, v]) => (
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
            <p className="p-6 text-sm text-muted-foreground">Aucun projet.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() => setSelId(p.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.owner_name ?? 'Sans porteur'}
                        {p.pole ? ` · ${p.pole}` : ''}
                        {p.due_date ? ` · échéance ${format(new Date(p.due_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                      </span>
                    </span>
                    <Badge variant={statusVariant(p.status)}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
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
            <DialogTitle>Nouveau projet</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
                <Label>Échéance</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Porteur</Label>
              <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!form.name || projects.create.isPending}
              onClick={() =>
                projects.create.mutate(
                  {
                    name: form.name,
                    description: form.description || null,
                    pole: form.pole || null,
                    owner_id: form.owner_id || null,
                    due_date: form.due_date || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ name: '', description: '', pole: '', owner_id: '', due_date: '' });
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
                <SheetTitle>{sel.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <Badge variant={statusVariant(sel.status)}>{PROJECT_STATUS_LABELS[sel.status]}</Badge>
                {sel.description && <p className="whitespace-pre-wrap">{sel.description}</p>}
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Porteur</p>
                    <p className="font-medium">{sel.owner_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Échéance</p>
                    <p className="font-medium">
                      {sel.due_date ? format(new Date(sel.due_date), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[])
                    .filter((s) => s !== sel.status)
                    .map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        disabled={projects.update.isPending}
                        onClick={() => projects.update.mutate({ id: sel.id, status: s })}
                      >
                        → {PROJECT_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={projects.remove.isPending}
                    onClick={() => projects.remove.mutate(sel.id, { onSuccess: () => setSelId(null) })}
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
