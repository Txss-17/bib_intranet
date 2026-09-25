import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ClipboardCheck, Plus, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourceBadge } from '@/components/audit/SourceBadge';
import {
  AuditMission, MissionStatus, MISSION_LABELS, MISSION_STEPS, MISSION_TRANSITIONS,
  useAuditMissions, useAuditors, useMissionActions, useMissionEvents,
} from '@/hooks/useAuditMissions';

const statusVariant = (s: MissionStatus) =>
  s === 'non_compliant' ? 'destructive' : s === 'compliant' || s === 'closed' ? 'default' : 'outline';

export default function AuditMissions() {
  const { data: rows = [], isLoading } = useAuditMissions();
  const { data: auditors = [] } = useAuditors();
  const { create, update } = useMissionActions();
  const [q, setQ] = useState('');
  const [step, setStep] = useState<string>('open');
  const [open, setOpen] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [form, setForm] = useState({ target_name: '', target_type: 'supplier', audit_type: 'quality', scheduled_date: '' });
  const [reason, setReason] = useState('');
  const [corrective, setCorrective] = useState({ action: '', due: '' });

  const sel = rows.find((r) => r.id === selId) ?? null;
  const { data: events = [] } = useMissionEvents(sel?.id);
  const name = (id: string | null) => {
    const p = auditors.find((a: any) => a.id === id);
    return p ? `${p.first_name} ${p.last_name}` : '—';
  };

  const filtered = useMemo(() => rows.filter((r) =>
    (step === 'all' || (step === 'open' ? r.workflow_status !== 'closed' : r.workflow_status === step)) &&
    (!q || `${r.mission_reference} ${r.target_name}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, step]);

  const count = (s: MissionStatus[]) => rows.filter((r) => s.includes(r.workflow_status)).length;

  const move = (m: AuditMission, to: MissionStatus) => {
    if (['non_compliant', 'compliant'].includes(to) && !reason) return;
    if (to === 'corrective_action' && !corrective.action) return;
    update.mutate({
      id: m.id, workflow_status: to,
      ...(reason ? { decision_reason: reason } : {}),
      ...(to === 'corrective_action' ? { corrective_action: corrective.action, corrective_due_date: corrective.due || null } : {}),
    }, { onSuccess: () => { setReason(''); setCorrective({ action: '', due: '' }); } });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><ClipboardCheck className="h-5 w-5" />Suivi des missions</h1>
          <p className="text-sm text-muted-foreground">Mission → planification → affectation → terrain (Audit Hub) → synchronisation → analyse → décision → action corrective → clôture.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle mission</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ['À planifier / affecter', ['mission', 'planned']],
          ['Sur le terrain', ['assigned', 'in_field']],
          ['À analyser', ['synced', 'analysis']],
          ['Non conformes / actions', ['non_compliant', 'corrective_action']],
          ['Clôturées', ['closed', 'compliant']],
        ] as [string, MissionStatus[]][]).map(([l, s]) => (
          <Card key={l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{count(s)}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={step} onValueChange={setStep}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">En cours</SelectItem>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(MISSION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Chargement…</p> : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune mission.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50" onClick={() => setSelId(m.id)}>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.target_name ?? 'Cible'}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.mission_reference} · {m.audit_type} · Auditeur : {name(m.auditor_id)}
                        {m.scheduled_date ? ` · ${format(new Date(m.scheduled_date), 'dd MMM yyyy', { locale: fr })}` : ''}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <SourceBadge origin={m.app_origin} />
                      <Badge variant={statusVariant(m.workflow_status)}>{MISSION_LABELS[m.workflow_status]}</Badge>
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
          <DialogHeader><DialogTitle>Nouvelle mission d’audit</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Cible (fournisseur, entrepôt, produit…)</Label><Input value={form.target_name} onChange={(e) => setForm({ ...form, target_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type de cible</Label>
                <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Fournisseur</SelectItem>
                    <SelectItem value="warehouse">Entrepôt</SelectItem>
                    <SelectItem value="product">Produit</SelectItem>
                    <SelectItem value="partner">Partenaire logistique</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label>Type d’audit</Label>
                <Select value={form.audit_type} onValueChange={(v) => setForm({ ...form, audit_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality">Qualité</SelectItem>
                    <SelectItem value="compliance">Conformité</SelectItem>
                    <SelectItem value="rse">RSE</SelectItem>
                    <SelectItem value="logistics">Logistique</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
          </div>
          <DialogFooter>
            <Button disabled={!form.target_name || create.isPending}
              onClick={() => create.mutate({ ...form, scheduled_date: null } as any, { onSuccess: () => { setOpen(false); setForm({ ...form, target_name: '' }); } })}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader><SheetTitle>{sel.target_name}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap gap-1">
                  {MISSION_STEPS.map((s) => {
                    const idx = MISSION_STEPS.indexOf(sel.workflow_status);
                    const reached = idx === -1 || MISSION_STEPS.indexOf(s) <= idx;
                    return <Badge key={s} variant={reached ? 'default' : 'outline'}>{MISSION_LABELS[s]}</Badge>;
                  })}
                  {!MISSION_STEPS.includes(sel.workflow_status) && <Badge variant={statusVariant(sel.workflow_status)}>{MISSION_LABELS[sel.workflow_status]}</Badge>}
                </div>
                <p className="text-muted-foreground">{sel.mission_reference} · <SourceBadge origin={sel.app_origin} /></p>

                {['mission', 'planned'].includes(sel.workflow_status) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date prévue</Label>
                      <Input type="date" defaultValue={sel.scheduled_date ?? ''} onBlur={(e) => e.target.value && update.mutate({ id: sel.id, scheduled_date: e.target.value })} /></div>
                    <div><Label>Auditeur</Label>
                      <Select value={sel.auditor_id ?? ''} onValueChange={(v) => update.mutate({ id: sel.id, auditor_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>{auditors.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.first_name} {a.last_name}</SelectItem>)}</SelectContent>
                      </Select></div>
                  </div>
                )}

                {(sel.findings || sel.score !== null) && (
                  <div className="rounded-md border p-3">
                    <p className="font-medium">Résultats terrain {sel.score !== null && `· score ${sel.score}/100`}</p>
                    {sel.findings && <p className="mt-1 whitespace-pre-wrap">{sel.findings}</p>}
                  </div>
                )}
                {sel.corrective_action && (
                  <div className="rounded-md border p-3">
                    <p className="font-medium">Action corrective{sel.corrective_due_date ? ` · échéance ${format(new Date(sel.corrective_due_date), 'dd MMM yyyy', { locale: fr })}` : ''}</p>
                    <p className="mt-1">{sel.corrective_action}</p>
                  </div>
                )}
                {sel.anomaly_id && <p className="text-xs text-muted-foreground">Anomalie ouverte automatiquement (Opérations → Anomalies).</p>}

                {sel.workflow_status === 'analysis' && (
                  <div><Label>Motif de la décision (obligatoire)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
                )}
                {sel.workflow_status === 'non_compliant' && (
                  <div className="grid gap-2">
                    <Label>Action corrective demandée</Label>
                    <Textarea value={corrective.action} onChange={(e) => setCorrective({ ...corrective, action: e.target.value })} />
                    <Input type="date" value={corrective.due} onChange={(e) => setCorrective({ ...corrective, due: e.target.value })} />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {MISSION_TRANSITIONS[sel.workflow_status].map((to) => {
                    const needsReason = ['compliant', 'non_compliant'].includes(to) && !reason;
                    const needsAction = to === 'corrective_action' && !corrective.action;
                    const needsAssign = to === 'assigned' && (!sel.auditor_id || !sel.scheduled_date);
                    return (
                      <Button key={to} size="sm" variant={to === 'non_compliant' ? 'destructive' : 'default'}
                        disabled={update.isPending || needsReason || needsAction || needsAssign}
                        onClick={() => move(sel, to)}>
                        → {MISSION_LABELS[to]}
                      </Button>
                    );
                  })}
                </div>
                {sel.workflow_status === 'planned' && (!sel.auditor_id || !sel.scheduled_date) && (
                  <p className="text-xs text-muted-foreground">Choisissez une date et un auditeur pour affecter la mission.</p>
                )}

                <div>
                  <p className="mb-2 font-medium">Historique</p>
                  <ul className="space-y-2">
                    {events.map((e) => (
                      <li key={e.id} className="border-l-2 pl-3">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(e.created_at), 'dd MMM HH:mm', { locale: fr })}{e.origin === 'audit_hub' ? ' · Audit Hub' : ''}
                        </span>
                        <p>{e.from_status ? `${MISSION_LABELS[e.from_status as MissionStatus]} → ` : ''}{MISSION_LABELS[e.to_status as MissionStatus] ?? e.to_status}</p>
                        {e.message && e.message !== 'Création' && <p className="text-muted-foreground">{e.message}</p>}
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
