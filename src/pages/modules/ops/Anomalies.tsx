import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Anomaly, AnomalySeverity, AnomalyStatus, ANOMALY_SOURCES, ANOMALY_STATUS_LABELS, ANOMALY_TRANSITIONS,
  SEVERITY_LABELS, useAnomalies, useAnomalyActions, useAnomalyEvents,
} from '@/hooks/useAnomalies';

const sevVariant = (s: AnomalySeverity) =>
  s === 'critical' || s === 'high' ? 'destructive' : s === 'medium' ? 'secondary' : 'outline';

export default function Anomalies() {
  const { data: rows = [], isLoading } = useAnomalies();
  const { create, setStatus, comment } = useAnomalyActions();
  const [q, setQ] = useState('');
  const [status, setStatusFilter] = useState<string>('active');
  const [source, setSource] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [note, setNote] = useState('');
  const [form, setForm] = useState({ title: '', source: 'orders', type: '', severity: 'medium', description: '', object_type: '', object_id: '' });
  const { data: events = [] } = useAnomalyEvents(selected?.id);

  const filtered = useMemo(() => rows.filter((r) =>
    (status === 'all' || (status === 'active' ? !['resolved', 'closed'].includes(r.status) : r.status === status)) &&
    (source === 'all' || r.source === source) &&
    (!q || `${r.reference} ${r.title} ${r.type}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, status, source]);

  const kpi = (fn: (a: Anomaly) => boolean) => rows.filter(fn).length;
  const current = selected ? rows.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><AlertTriangle className="h-5 w-5" />Anomalies</h1>
          <p className="text-sm text-muted-foreground">Registre transversal : commandes, paiements, factures, stocks, fournisseurs, audits, logistique, tech.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Déclarer une anomalie</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Ouvertes', kpi((a) => a.status === 'open')],
          ['En cours', kpi((a) => ['investigating', 'action_required'].includes(a.status))],
          ['Critiques actives', kpi((a) => a.severity === 'critical' && !['resolved', 'closed'].includes(a.status))],
          ['Résolues / clôturées', kpi((a) => ['resolved', 'closed'].includes(a.status))],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="all">Tous statuts</SelectItem>
            {Object.entries(ANOMALY_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes sources</SelectItem>
            {Object.entries(ANOMALY_SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Chargement…</p> : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune anomalie.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((a) => (
                <li key={a.id}>
                  <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50" onClick={() => setSelected(a)}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">{a.reference} · {ANOMALY_SOURCES[a.source]} · {a.type} · {format(new Date(a.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                    </span>
                    <span className="flex shrink-0 gap-2">
                      <Badge variant={sevVariant(a.severity)}>{SEVERITY_LABELS[a.severity]}</Badge>
                      <Badge variant="outline">{ANOMALY_STATUS_LABELS[a.status]}</Badge>
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
          <DialogHeader><DialogTitle>Déclarer une anomalie</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ANOMALY_SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Gravité</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SEVERITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div><Label>Type</Label><Input placeholder="ex. écart de montant, rupture, retard…" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Objet concerné</Label><Input placeholder="commande, facture…" value={form.object_type} onChange={(e) => setForm({ ...form, object_type: e.target.value })} /></div>
              <div><Label>Référence objet</Label><Input value={form.object_id} onChange={(e) => setForm({ ...form, object_id: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={!form.title || !form.type || create.isPending} onClick={() =>
              create.mutate({ ...form, severity: form.severity as AnomalySeverity, object_type: form.object_type || null, object_id: form.object_id || null } as any,
                { onSuccess: () => { setOpen(false); setForm({ ...form, title: '', type: '', description: '', object_type: '', object_id: '' }); } })}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!current} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {current && (
            <>
              <SheetHeader><SheetTitle>{current.title}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={sevVariant(current.severity)}>{SEVERITY_LABELS[current.severity]}</Badge>
                  <Badge variant="outline">{ANOMALY_STATUS_LABELS[current.status]}</Badge>
                  <Badge variant="secondary">{ANOMALY_SOURCES[current.source]}</Badge>
                </div>
                <p className="text-muted-foreground">{current.reference} · {current.type}{current.object_type ? ` · ${current.object_type} ${current.object_id ?? ''}` : ''}</p>
                {current.description && <p>{current.description}</p>}

                <Textarea placeholder="Commentaire / motif" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {ANOMALY_TRANSITIONS[current.status].map((s) => (
                    <Button key={s} size="sm" variant={s === 'closed' ? 'outline' : 'default'} disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: current.id, status: s, comment: note || undefined }, { onSuccess: () => setNote('') })}>
                      → {ANOMALY_STATUS_LABELS[s as AnomalyStatus]}
                    </Button>
                  ))}
                  <Button size="sm" variant="secondary" disabled={!note || comment.isPending}
                    onClick={() => comment.mutate({ id: current.id, message: note }, { onSuccess: () => setNote('') })}>Commenter</Button>
                </div>

                <div>
                  <p className="mb-2 font-medium">Historique</p>
                  <ul className="space-y-2">
                    {events.map((e) => (
                      <li key={e.id} className="border-l-2 pl-3">
                        <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), 'dd MMM HH:mm', { locale: fr })}</span>
                        <p>{e.kind === 'status'
                          ? `${ANOMALY_STATUS_LABELS[e.from_status as AnomalyStatus] ?? ''} → ${ANOMALY_STATUS_LABELS[e.to_status as AnomalyStatus] ?? ''}`
                          : e.kind === 'created' ? 'Création' : e.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
