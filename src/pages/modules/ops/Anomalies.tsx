import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Bell, Check, Clock, Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  AiSuggestion, Anomaly, AnomalySeverity, AnomalyStatus, ANOMALY_SOURCES, ANOMALY_STATUS_LABELS, ANOMALY_TRANSITIONS,
  isOverdue, NOTIF_KIND_LABELS, requestTriage, SEVERITY_LABELS, useAnomalies, useAnomalyActions, useAnomalyEvents,
  useAnomalyNotifications, useAssignees,
} from '@/hooks/useAnomalies';

const sevVariant = (s: AnomalySeverity) =>
  s === 'critical' || s === 'high' ? 'destructive' : s === 'medium' ? 'secondary' : 'outline';
const toLocalInput = (iso: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '');
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const TEAMS = ['Ops', 'Qualité', 'Finance'];

const emptyForm = {
  title: '', source: 'orders', type: '', severity: 'medium', description: '', object_type: '', object_id: '',
  owner_id: '', due_at: '', reminder_at: '', category: '', team: 'Ops',
};

export default function Anomalies() {
  const { user } = useAuth() as any;
  const { data: rows = [], isLoading } = useAnomalies();
  const { data: people = [] } = useAssignees();
  const { data: allNotifs = [] } = useAnomalyNotifications();
  const { create, setStatus, comment, update } = useAnomalyActions();
  const [view, setView] = useState('all');
  const [q, setQ] = useState('');
  const [status, setStatusFilter] = useState<string>('active');
  const [source, setSource] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [note, setNote] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [checks, setChecks] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [aiDecision, setAiDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: events = [] } = useAnomalyEvents(selected?.id);
  const { data: notifs = [] } = useAnomalyNotifications(selected?.id);

  const nameOf = (id: string | null) => {
    const p = people.find((x) => x.id === id);
    return p ? [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email : '—';
  };

  const filtered = useMemo(() => rows.filter((r) =>
    (view !== 'overdue' || isOverdue(r)) &&
    (view !== 'mine' || r.owner_id === user?.id) &&
    (status === 'all' || (status === 'active' ? !['resolved', 'closed'].includes(r.status) : r.status === status)) &&
    (source === 'all' || r.source === source) &&
    (!q || `${r.reference} ${r.title} ${r.type} ${r.category ?? ''}`.toLowerCase().includes(q.toLowerCase()))),
  [rows, q, status, source, view, user?.id]);

  const kpi = (fn: (a: Anomaly) => boolean) => rows.filter(fn).length;
  const current = selected ? rows.find((r) => r.id === selected.id) ?? selected : null;

  const resetDialog = () => { setForm(emptyForm); setChecks([]); setSuggestion(null); setAiDecision(null); };

  const suggest = async () => {
    setAiLoading(true);
    try {
      const s = await requestTriage(form.description, form.team);
      setSuggestion(s); setAiDecision(null);
    } catch (e) {
      toast.error('Suggestion IA', { description: (e as Error).message });
    } finally { setAiLoading(false); }
  };
  const acceptSuggestion = () => {
    if (!suggestion) return;
    setForm({ ...form, source: suggestion.source, severity: suggestion.severity, category: suggestion.category,
      type: form.type || suggestion.category, title: form.title || suggestion.title });
    setChecks(suggestion.checks);
    setAiDecision('accepted');
  };

  const submit = () => {
    const modified = suggestion && aiDecision === 'accepted' && (
      form.source !== suggestion.source || form.severity !== suggestion.severity || form.category !== suggestion.category ||
      JSON.stringify(checks) !== JSON.stringify(suggestion.checks));
    create.mutate({
      title: form.title, source: form.source, type: form.type, severity: form.severity as AnomalySeverity,
      description: form.description || null, object_type: form.object_type || null, object_id: form.object_id || null,
      owner_id: form.owner_id || null, due_at: fromLocalInput(form.due_at), reminder_at: fromLocalInput(form.reminder_at),
      category: form.category || null, checks: checks.filter(Boolean),
      ai_suggestion: suggestion, ai_decision: suggestion ? (aiDecision === 'accepted' ? (modified ? 'modified' : 'accepted') : 'rejected') : null,
      ai_validated_by: suggestion ? user?.id : null, ai_validated_at: suggestion ? new Date().toISOString() : null,
    } as any, { onSuccess: () => { setOpen(false); resetDialog(); } });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><AlertTriangle className="h-5 w-5" />Anomalies</h1>
          <p className="text-sm text-muted-foreground">Registre transversal : commandes, paiements, factures, stocks, fournisseurs, audits, logistique, tech.</p>
        </div>
        <Button onClick={() => { resetDialog(); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Déclarer une anomalie</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Ouvertes', kpi((a) => a.status === 'open')],
          ['En cours', kpi((a) => ['investigating', 'action_required'].includes(a.status))],
          ['En retard', kpi(isOverdue)],
          ['Critiques actives', kpi((a) => a.severity === 'critical' && !['resolved', 'closed'].includes(a.status))],
          ['Résolues / clôturées', kpi((a) => ['resolved', 'closed'].includes(a.status))],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="mine">Assignées à moi</TabsTrigger>
          <TabsTrigger value="overdue">En retard ({kpi(isOverdue)})</TabsTrigger>
          <TabsTrigger value="notifications">Historique des notifications</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === 'notifications' ? (
        <Card><CardContent className="p-0">
          {allNotifs.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Aucune notification envoyée pour l'instant.</p> : (
            <ul className="divide-y">
              {allNotifs.map((n) => {
                const a = rows.find((r) => r.id === n.anomaly_id);
                return (
                  <li key={n.id}>
                    <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50" onClick={() => a && setSelected(a)}>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a?.reference ?? '—'} · {n.message}</span>
                        <span className="text-xs text-muted-foreground">À {nameOf(n.recipient_id)} · {format(new Date(n.sent_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                      </span>
                      <Badge variant={n.kind === 'overdue' ? 'destructive' : 'outline'}>{NOTIF_KIND_LABELS[n.kind] ?? n.kind}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent></Card>
      ) : (
        <>
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
                          <span className="text-xs text-muted-foreground">
                            {a.reference} · {ANOMALY_SOURCES[a.source]} · {a.category ?? a.type} · {nameOf(a.owner_id)}
                            {a.due_at && ` · échéance ${format(new Date(a.due_at), 'dd MMM HH:mm', { locale: fr })}`}
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-2">
                          {isOverdue(a) && <Badge variant="destructive"><Clock className="mr-1 h-3 w-3" />En retard</Badge>}
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
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Déclarer une anomalie</DialogTitle>
            <DialogDescription>Décrivez le problème, puis demandez une suggestion à Lovable AI. Vous validez ou corrigez avant d'enregistrer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Équipe</Label>
                <Select value={form.team} onValueChange={(v) => setForm({ ...form, team: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="col-span-2"><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} placeholder="Que s'est-il passé ? Quelle commande, quel produit, quel montant…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button type="button" variant="secondary" size="sm" className="mt-2" disabled={form.description.trim().length < 10 || aiLoading} onClick={suggest}>
                {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Suggérer catégorie, priorité et vérifications
              </Button>
            </div>

            {suggestion && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium">Suggestion IA</span>
                  <Badge variant="secondary">{ANOMALY_SOURCES[suggestion.source]}</Badge>
                  <Badge variant="outline">{suggestion.category}</Badge>
                  <Badge variant={sevVariant(suggestion.severity)}>{SEVERITY_LABELS[suggestion.severity]}</Badge>
                  {aiDecision && <Badge variant="outline">{aiDecision === 'accepted' ? 'Appliquée' : 'Écartée'}</Badge>}
                </div>
                <p className="text-muted-foreground">{suggestion.rationale}</p>
                <ul className="mt-2 list-disc pl-5">{suggestion.checks.map((c, i) => <li key={i}>{c}</li>)}</ul>
                {!aiDecision && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={acceptSuggestion}><Check className="mr-1 h-4 w-4" />Appliquer</Button>
                    <Button size="sm" variant="outline" onClick={() => setAiDecision('rejected')}><X className="mr-1 h-4 w-4" />Écarter</Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div><Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ANOMALY_SOURCES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Priorité</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SEVERITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Catégorie</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            </div>
            <div><Label>Type</Label><Input placeholder="ex. écart de montant, rupture, retard…" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Objet concerné</Label><Input placeholder="commande, facture…" value={form.object_type} onChange={(e) => setForm({ ...form, object_type: e.target.value })} /></div>
              <div><Label>Référence objet</Label><Input value={form.object_id} onChange={(e) => setForm({ ...form, object_id: e.target.value })} /></div>
            </div>
            <div>
              <Label>Vérifications à effectuer</Label>
              {checks.map((c, i) => (
                <div key={i} className="mt-1 flex gap-2">
                  <Input value={c} onChange={(e) => setChecks(checks.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button size="icon" variant="ghost" onClick={() => setChecks(checks.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" className="mt-1" onClick={() => setChecks([...checks, ''])}><Plus className="mr-1 h-4 w-4" />Ajouter</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Responsable</Label>
                <Select value={form.owner_id || 'none'} onValueChange={(v) => setForm({ ...form, owner_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non assignée</SelectItem>
                    {people.map((p) => <SelectItem key={p.id} value={p.id}>{nameOf(p.id)}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label>Échéance</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
              <div><Label>Rappel</Label><Input type="datetime-local" value={form.reminder_at} onChange={(e) => setForm({ ...form, reminder_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.title || !form.type || create.isPending || (!!suggestion && !aiDecision)} onClick={submit}>Enregistrer</Button>
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
                  {isOverdue(current) && <Badge variant="destructive">En retard</Badge>}
                  <Badge variant={sevVariant(current.severity)}>{SEVERITY_LABELS[current.severity]}</Badge>
                  <Badge variant="outline">{ANOMALY_STATUS_LABELS[current.status]}</Badge>
                  <Badge variant="secondary">{ANOMALY_SOURCES[current.source]}</Badge>
                  {current.category && <Badge variant="outline">{current.category}</Badge>}
                </div>
                <p className="text-muted-foreground">{current.reference} · {current.type}{current.object_type ? ` · ${current.object_type} ${current.object_id ?? ''}` : ''}</p>
                {current.description && <p>{current.description}</p>}
                {current.ai_suggestion && (
                  <p className="text-xs text-muted-foreground">
                    Suggestion IA {current.ai_decision === 'accepted' ? 'appliquée' : current.ai_decision === 'modified' ? 'appliquée puis corrigée' : 'écartée'} par {nameOf((current as any).ai_validated_by)}
                    {current.ai_validated_at && ` le ${format(new Date(current.ai_validated_at), 'dd MMM HH:mm', { locale: fr })}`}.
                  </p>
                )}
                {current.checks?.length > 0 && (
                  <div><p className="mb-1 font-medium">Vérifications</p><ul className="list-disc pl-5">{current.checks.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                )}

                <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                  <div className="col-span-2"><Label>Responsable</Label>
                    <Select value={current.owner_id ?? 'none'} onValueChange={(v) => update.mutate({ id: current.id, patch: { owner_id: v === 'none' ? null : v } })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Non assignée</SelectItem>
                        {people.map((p) => <SelectItem key={p.id} value={p.id}>{nameOf(p.id)}</SelectItem>)}
                      </SelectContent>
                    </Select></div>
                  <div><Label>Échéance</Label><Input type="datetime-local" defaultValue={toLocalInput(current.due_at)} key={`d${current.due_at}`}
                    onBlur={(e) => { const v = fromLocalInput(e.target.value); if (v !== current.due_at) update.mutate({ id: current.id, patch: { due_at: v, last_reminded_at: null } }); }} /></div>
                  <div><Label>Rappel</Label><Input type="datetime-local" defaultValue={toLocalInput(current.reminder_at)} key={`r${current.reminder_at}`}
                    onBlur={(e) => { const v = fromLocalInput(e.target.value); if (v !== current.reminder_at) update.mutate({ id: current.id, patch: { reminder_at: v, last_reminded_at: null } }); }} /></div>
                  {current.due_at && <p className="col-span-2 text-xs text-muted-foreground">
                    Échéance {formatDistanceToNow(new Date(current.due_at), { addSuffix: true, locale: fr })}. Rappel automatique 24 h avant (ou à la date choisie), puis chaque jour en cas de retard.
                  </p>}
                </div>

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
                  <p className="mb-2 flex items-center gap-1 font-medium"><Bell className="h-4 w-4" />Notifications envoyées</p>
                  {notifs.length === 0 ? <p className="text-xs text-muted-foreground">Aucune.</p> : (
                    <ul className="space-y-1">
                      {notifs.map((n) => (
                        <li key={n.id} className="text-xs">
                          <span className="text-muted-foreground">{format(new Date(n.sent_at), 'dd MMM HH:mm', { locale: fr })}</span> · {NOTIF_KIND_LABELS[n.kind] ?? n.kind} → {nameOf(n.recipient_id)}
                        </li>
                      ))}
                    </ul>
                  )}
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
