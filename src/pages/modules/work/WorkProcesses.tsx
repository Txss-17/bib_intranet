import { useMemo, useState } from 'react';
import { ListOrdered, Plus, Search, Trash2 } from 'lucide-react';
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
  PROCESS_STATUS_LABELS, ProcessStatus, useWorkModuleActions, useWorkProcesses,
} from '@/hooks/useWorkModule';
import { useTaskAssignees } from '@/hooks/useWorkTasks';

const statusVariant = (s: ProcessStatus) =>
  s === 'active' ? 'default' : s === 'draft' ? 'secondary' : 'outline';

export default function WorkProcesses() {
  const { data: rows = [], isLoading } = useWorkProcesses();
  const { data: people = [] } = useTaskAssignees();
  const { processes } = useWorkModuleActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', pole: '', owner_id: '', steps: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;

  const filtered = useMemo(
    () =>
      rows.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (!q || `${p.name} ${p.owner_name} ${p.pole}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status],
  );

  const count = (s: ProcessStatus[]) => rows.filter((p) => s.includes(p.status)).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ListOrdered className="h-5 w-5" />
            Processus
          </h1>
          <p className="text-sm text-muted-foreground">Procédures internes : étapes, responsable et statut.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau processus
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([
          ['Brouillons', ['draft']],
          ['Actifs', ['active']],
          ['Retirés', ['deprecated']],
        ] as [string, ProcessStatus[]][]).map(([l, s]) => (
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
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(PROCESS_STATUS_LABELS).map(([k, v]) => (
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
            <p className="p-6 text-sm text-muted-foreground">Aucun processus.</p>
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
                        {p.owner_name ?? 'Sans responsable'}
                        {p.pole ? ` · ${p.pole}` : ''}
                        {` · ${p.steps.length} étape${p.steps.length > 1 ? 's' : ''}`}
                      </span>
                    </span>
                    <Badge variant={statusVariant(p.status)}>{PROCESS_STATUS_LABELS[p.status]}</Badge>
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
            <DialogTitle>Nouveau processus</DialogTitle>
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
            <div>
              <Label>Étapes (une par ligne)</Label>
              <Textarea
                value={form.steps}
                onChange={(e) => setForm({ ...form, steps: e.target.value })}
                placeholder={'1. Réception\n2. Contrôle\n3. Validation'}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pôle</Label>
                <Input value={form.pole} onChange={(e) => setForm({ ...form, pole: e.target.value })} placeholder="ops, finance…" />
              </div>
              <div>
                <Label>Responsable</Label>
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
          </div>
          <DialogFooter>
            <Button
              disabled={!form.name || processes.create.isPending}
              onClick={() =>
                processes.create.mutate(
                  {
                    name: form.name,
                    description: form.description || null,
                    pole: form.pole || null,
                    owner_id: form.owner_id || null,
                    steps: form.steps
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((label) => ({ label })),
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ name: '', description: '', pole: '', owner_id: '', steps: '' });
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
                <Badge variant={statusVariant(sel.status)}>{PROCESS_STATUS_LABELS[sel.status]}</Badge>
                {sel.description && <p className="whitespace-pre-wrap">{sel.description}</p>}
                {sel.steps.length > 0 && (
                  <ol className="list-decimal space-y-1 rounded-md border p-3 pl-8">
                    {sel.steps.map((s, i) => (
                      <li key={i}>{s.label}</li>
                    ))}
                  </ol>
                )}
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Responsable</p>
                  <p className="font-medium">{sel.owner_name ?? '—'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[])
                    .filter((s) => s !== sel.status)
                    .map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant="outline"
                        disabled={processes.update.isPending}
                        onClick={() => processes.update.mutate({ id: sel.id, status: s })}
                      >
                        → {PROCESS_STATUS_LABELS[s]}
                      </Button>
                    ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={processes.remove.isPending}
                    onClick={() => processes.remove.mutate(sel.id, { onSuccess: () => setSelId(null) })}
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
