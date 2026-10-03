import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertOctagon, Plus, Search, Trash2 } from 'lucide-react';
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
  ESCALATION_SEVERITY_LABELS, ESCALATION_STATUS_LABELS, EscalationSeverity, EscalationStatus,
  useWorkEscalations, useWorkModuleActions,
} from '@/hooks/useWorkModule';
import { useTaskAssignees } from '@/hooks/useWorkTasks';

const statusVariant = (s: EscalationStatus) =>
  s === 'resolved' ? 'default' : s === 'acknowledged' ? 'secondary' : 'outline';
const severityVariant = (s: EscalationSeverity) =>
  s === 'critical' || s === 'high' ? 'destructive' : 'outline';

export default function WorkEscalations() {
  const { data: rows = [], isLoading } = useWorkEscalations();
  const { data: people = [] } = useTaskAssignees();
  const { escalations } = useWorkModuleActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('open');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', pole: '', severity: 'medium', assigned_to: '' });
  const [edit, setEdit] = useState({ title: '', description: '', pole: '', severity: 'medium', assigned_to: '', resolution_note: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;
  useEffect(() => {
    if (sel)
      setEdit({
        title: sel.title,
        description: sel.description ?? '',
        pole: sel.pole ?? '',
        severity: sel.severity,
        assigned_to: sel.assigned_to ?? '',
        resolution_note: sel.resolution_note ?? '',
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId, sel?.id, sel?.status]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (e) =>
          (status === 'all' || (status === 'open' ? e.status !== 'resolved' : e.status === status)) &&
          (!q || `${e.title} ${e.raised_by_name} ${e.assigned_name} ${e.pole}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status],
  );

  const count = (s: EscalationStatus[]) => rows.filter((e) => s.includes(e.status)).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <AlertOctagon className="h-5 w-5" />
            Escalades
          </h1>
          <p className="text-sm text-muted-foreground">Points bloquants remontés : gravité, prise en charge et résolution.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle escalade
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([
          ['Ouvertes', ['open']],
          ['Prises en charge', ['acknowledged']],
          ['Résolues', ['resolved']],
        ] as [string, EscalationStatus[]][]).map(([l, s]) => (
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
            <SelectItem value="open">Non résolues</SelectItem>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(ESCALATION_STATUS_LABELS).map(([k, v]) => (
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
            <p className="p-6 text-sm text-muted-foreground">Aucune escalade.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((e) => (
                <li key={e.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() => setSelId(e.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.raised_by_name ?? '—'}
                        {e.assigned_name ? ` → ${e.assigned_name}` : ''}
                        {e.pole ? ` · ${e.pole}` : ''}
                        {` · ${format(new Date(e.created_at), 'dd MMM yyyy', { locale: fr })}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={severityVariant(e.severity)}>{ESCALATION_SEVERITY_LABELS[e.severity]}</Badge>
                      <Badge variant={statusVariant(e.status)}>{ESCALATION_STATUS_LABELS[e.status]}</Badge>
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
            <DialogTitle>Nouvelle escalade</DialogTitle>
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
                <Label>Gravité</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESCALATION_SEVERITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assigner à</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm({ ...form, assigned_to: v })}>
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
              disabled={!form.title || escalations.create.isPending}
              onClick={() =>
                escalations.create.mutate(
                  {
                    title: form.title,
                    description: form.description || null,
                    pole: form.pole || null,
                    severity: form.severity,
                    assigned_to: form.assigned_to || null,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ title: '', description: '', pole: '', severity: 'medium', assigned_to: '' });
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
                  <Badge variant={statusVariant(sel.status)}>{ESCALATION_STATUS_LABELS[sel.status]}</Badge>
                  <Badge variant={severityVariant(sel.severity)}>{ESCALATION_SEVERITY_LABELS[sel.severity]}</Badge>
                </div>
                <div className="grid gap-3 rounded-md border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Modifier l'escalade</p>
                  <div>
                    <Label>Titre</Label>
                    <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Pôle</Label>
                      <Input value={edit.pole} onChange={(e) => setEdit({ ...edit, pole: e.target.value })} />
                    </div>
                    <div>
                      <Label>Gravité</Label>
                      <Select value={edit.severity} onValueChange={(v) => setEdit({ ...edit, severity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ESCALATION_SEVERITY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Assignée à</Label>
                    <Select value={edit.assigned_to || 'none'} onValueChange={(v) => setEdit({ ...edit, assigned_to: v === 'none' ? '' : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personne</SelectItem>
                        {people.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Note de résolution</Label>
                    <Textarea
                      value={edit.resolution_note}
                      placeholder="Obligatoire pour passer en « Résolue »"
                      onChange={(e) => setEdit({ ...edit, resolution_note: e.target.value })}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!edit.title || escalations.update.isPending}
                    onClick={() =>
                      escalations.update.mutate({
                        id: sel.id,
                        title: edit.title,
                        description: edit.description || null,
                        pole: edit.pole || null,
                        severity: edit.severity,
                        assigned_to: edit.assigned_to || null,
                        resolution_note: edit.resolution_note || null,
                      })
                    }
                  >
                    Enregistrer les modifications
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Remontée par</p>
                    <p className="font-medium">{sel.raised_by_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Résolue le</p>
                    <p className="font-medium">{sel.resolved_at ? format(new Date(sel.resolved_at), 'dd MMM yyyy HH:mm', { locale: fr }) : '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sel.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={escalations.update.isPending}
                      onClick={() => escalations.update.mutate({ id: sel.id, status: 'acknowledged' })}
                    >
                      → Prise en charge
                    </Button>
                  )}
                  {sel.status !== 'resolved' && (
                    <Button
                      size="sm"
                      disabled={!edit.resolution_note.trim() || escalations.update.isPending}
                      onClick={() =>
                        escalations.update.mutate({
                          id: sel.id,
                          status: 'resolved',
                          resolved_at: new Date().toISOString(),
                          resolution_note: edit.resolution_note.trim(),
                        })
                      }
                    >
                      → Résolue
                    </Button>
                  )}
                  {sel.status === 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={escalations.update.isPending}
                      onClick={() => escalations.update.mutate({ id: sel.id, status: 'open', resolved_at: null })}
                    >
                      Rouvrir
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={escalations.remove.isPending}
                    onClick={() => escalations.remove.mutate(sel.id, { onSuccess: () => setSelId(null) })}
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
