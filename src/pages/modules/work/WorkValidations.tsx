import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Plus, Search, Trash2, XCircle } from 'lucide-react';
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
  VALIDATION_STATUS_LABELS, ValidationStatus, useWorkModuleActions, useWorkValidations,
} from '@/hooks/useWorkModule';
import { useTaskAssignees } from '@/hooks/useWorkTasks';
import { useAuth } from '@/hooks/useAuth';

const statusVariant = (s: ValidationStatus) =>
  s === 'approved' ? 'default' : s === 'rejected' ? 'destructive' : 'secondary';

export default function WorkValidations() {
  const { user } = useAuth();
  const { data: rows = [], isLoading } = useWorkValidations();
  const { data: people = [] } = useTaskAssignees();
  const { validations } = useWorkModuleActions();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('pending');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [form, setForm] = useState({ title: '', description: '', pole: '', validator_id: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;

  const filtered = useMemo(
    () =>
      rows.filter(
        (v) =>
          (status === 'all' || v.status === status) &&
          (!q || `${v.title} ${v.requester_name} ${v.validator_name} ${v.pole}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, q, status],
  );

  const count = (s: ValidationStatus[]) => rows.filter((v) => s.includes(v.status)).length;
  const canDecide = sel && sel.status === 'pending' && (sel.validator_id === user?.id);

  const decide = (decision: 'approved' | 'rejected') => {
    if (!sel) return;
    if (decision === 'rejected' && !note.trim()) return;
    validations.update.mutate(
      { id: sel.id, status: decision, decided_at: new Date().toISOString(), decision_note: note.trim() || null },
      { onSuccess: () => setNote('') },
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Validations
          </h1>
          <p className="text-sm text-muted-foreground">Demandes de validation : soumission, approbation ou rejet motivé.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([
          ['En attente', ['pending']],
          ['Approuvées', ['approved']],
          ['Rejetées', ['rejected']],
        ] as [string, ValidationStatus[]][]).map(([l, s]) => (
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
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(VALIDATION_STATUS_LABELS).map(([k, v]) => (
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
            <p className="p-6 text-sm text-muted-foreground">Aucune demande.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((v) => (
                <li key={v.id}>
                  <button
                    className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50"
                    onClick={() => { setSelId(v.id); setNote(''); }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{v.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.requester_name ?? '—'} → {v.validator_name ?? '—'}
                        {v.pole ? ` · ${v.pole}` : ''}
                        {` · ${format(new Date(v.created_at), 'dd MMM yyyy', { locale: fr })}`}
                      </span>
                    </span>
                    <Badge variant={statusVariant(v.status)}>{VALIDATION_STATUS_LABELS[v.status]}</Badge>
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
            <DialogTitle>Nouvelle demande de validation</DialogTitle>
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
                <Label>Validateur</Label>
                <Select value={form.validator_id} onValueChange={(v) => setForm({ ...form, validator_id: v })}>
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
              disabled={!form.title || !form.validator_id || validations.create.isPending}
              onClick={() =>
                validations.create.mutate(
                  {
                    title: form.title,
                    description: form.description || null,
                    pole: form.pole || null,
                    validator_id: form.validator_id,
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setForm({ title: '', description: '', pole: '', validator_id: '' });
                    },
                  },
                )
              }
            >
              Soumettre
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
                <Badge variant={statusVariant(sel.status)}>{VALIDATION_STATUS_LABELS[sel.status]}</Badge>
                {sel.description && <p className="whitespace-pre-wrap">{sel.description}</p>}
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Demandeur</p>
                    <p className="font-medium">{sel.requester_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Validateur</p>
                    <p className="font-medium">{sel.validator_name ?? '—'}</p>
                  </div>
                </div>
                {sel.decided_at && (
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">
                      Décision du {format(new Date(sel.decided_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {sel.decision_note && <p className="mt-1 whitespace-pre-wrap">{sel.decision_note}</p>}
                  </div>
                )}
                {canDecide && (
                  <div className="space-y-3 rounded-md border p-3">
                    <Label>Note de décision {`(obligatoire en cas de rejet)`}</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={validations.update.isPending} onClick={() => decide('approved')}>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={validations.update.isPending || !note.trim()}
                        onClick={() => decide('rejected')}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={validations.remove.isPending}
                  onClick={() => validations.remove.mutate(sel.id, { onSuccess: () => setSelId(null) })}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
