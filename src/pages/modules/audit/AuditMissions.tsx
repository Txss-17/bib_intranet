import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
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
  const { data: rows = [], isLoading, isError, refetch } = useAuditMissions();
  const { user } = useAuth(); const { can } = usePermissions();
  const mayCreate = can('audit.missions', 'create');
  const mayUpdate = can('audit.missions', 'update') || can('audit.field', 'update');
  const mayValidate = can('audit.missions', 'validate') || can('audit.field', 'validate');
  const [params, setParams] = useSearchParams();
  const { data: auditors = [] } = useAuditors();
  const { create, update } = useMissionActions();
  const [q, setQ] = useState('');
  const [step, setStep] = useState<string>('open');
  const open = params.get('new') === '1' && mayCreate;
  const setOpen = (value: boolean) => { const next = new URLSearchParams(params); if (value) next.set('new', '1'); else next.delete('new'); setParams(next, { replace: true }); };
  const selId = params.get('mission');
  const setSelId = (value: string | null) => { const next = new URLSearchParams(params); if (value) next.set('mission', value); else next.delete('mission'); setParams(next, { replace: true }); setReason(''); setResults(null); setProof(null); setDraftRevision(null); };
  const [form, setForm] = useState({ target_name: '', target_type: 'supplier', audit_type: 'quality', scheduled_date: '', auditor_id: '' });
  const [reason, setReason] = useState('');
  const [draftRevision, setDraftRevision] = useState<number | null>(null);
  const [results, setResults] = useState<{ findings: string; recommendations: string; score: string } | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [corrective, setCorrective] = useState({ action: '', due: '' });
  useEffect(() => { setReason(''); setResults(null); setProof(null); setDraftRevision(null); setCorrective({ action: '', due: '' }); }, [selId]);

  const sel = rows.find((r) => r.id === selId) ?? null;
  const { data: events = [], isError: eventsError } = useMissionEvents(sel?.id);
  const name = (id: string | null) => {
    const p = auditors.find((a) => a.id === id);
    return p ? `${p.first_name} ${p.last_name}` : '—';
  };

  const filtered = useMemo(() => rows.filter((r) =>
    (step === 'all' || (step === 'open' ? r.workflow_status !== 'closed' : r.workflow_status === step)) &&
    (!q || `${r.mission_reference} ${r.target_name}`.toLowerCase().includes(q.toLowerCase()))), [rows, q, step]);

  const canEdit = !!sel && mayUpdate && (mayValidate || sel.created_by === user?.id || sel.auditor_id === user?.id);
  const staleDraft = !!sel && draftRevision !== null && draftRevision !== sel.revision;
  const canDecide = !!sel && mayValidate && sel.created_by !== user?.id && sel.auditor_id !== user?.id;
  const count = (s: MissionStatus[]) => rows.filter((r) => s.includes(r.workflow_status)).length;

  const move = (m: AuditMission, to: MissionStatus) => {
    if (update.isPending || (draftRevision !== null && draftRevision !== m.revision)) return;
    if (['non_compliant', 'compliant', 'closed'].includes(to) && !reason.trim()) return;
    if (to === 'corrective_action' && !corrective.action) return;
    update.mutate({
      id: m.id, revision: draftRevision ?? m.revision, workflow_status: to,
      ...(['compliant', 'non_compliant'].includes(to) ? { decision_reason: reason.trim() } : {}),
      ...(reason ? { change_note: reason.trim() } : {}),
      ...(to === 'corrective_action' ? { corrective_action: corrective.action, corrective_due_date: corrective.due || null } : {}),
    }, { onSuccess: () => { setReason(''); setCorrective({ action: '', due: '' }); setResults(null); setProof(null); setDraftRevision(null); } });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><ClipboardCheck className="h-5 w-5" />Suivi des missions</h1>
          <p className="text-sm text-muted-foreground">Mission → planification → affectation → terrain (Audit Hub) → synchronisation → analyse → décision → action corrective → clôture.</p>
        </div>
        <Button disabled={!mayCreate} onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nouvelle mission</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {([
          ['À planifier / affecter', ['mission', 'planned']],
          ['Sur le terrain', ['assigned', 'in_field']],
          ['À analyser', ['synced', 'analysis']],
          ['Non conformes / actions', ['non_compliant', 'corrective_action']],
          ['Clôturées', ['closed', 'compliant']],
        ] as [string, MissionStatus[]][]).map(([l, s]) => (
          <Card key={l}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{isError ? '—' : count(s)}</p></CardContent></Card>
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

      {isError && <p role="alert">Missions indisponibles. <Button variant="link" onClick={() => void refetch()}>Réessayer</Button></p>}
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
                      <SourceBadge source={m.app_origin} />
                      <Badge variant={statusVariant(m.workflow_status)}>{MISSION_LABELS[m.workflow_status]}</Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={value => !create.isPending && setOpen(value)}>
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
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date prévue</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
              <div><Label>Auditeur</Label>
                <Select value={form.auditor_id} onValueChange={(v) => setForm({ ...form, auditor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>{auditors.map((a) => <SelectItem key={a.id} value={a.id}>{a.first_name} {a.last_name} · {a.email}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <p className="text-xs text-muted-foreground">Choisissez une date et un auditeur pour affecter la mission. Le retour terrain alimente ensuite l’analyse et la décision.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={!mayCreate || !form.target_name.trim() || create.isPending}
              onClick={() => create.mutate({ ...form, scheduled_date: form.scheduled_date || null, auditor_id: form.auditor_id || null }, { onSuccess: () => { setOpen(false); setForm({ ...form, target_name: '' }); } })}>
              Créer en brouillon
            </Button>
            <Button disabled={!mayCreate || !form.target_name.trim() || !form.scheduled_date || !form.auditor_id || create.isPending}
              onClick={() => create.mutate({ ...form, workflow_status: 'assigned' }, { onSuccess: () => { setOpen(false); setForm({ ...form, target_name: '' }); } })}>
              Affecter la mission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selId} onOpenChange={(o) => !o && setSelId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selId && !sel && !isLoading && <p role="alert" className="mt-8">Mission indisponible ou accès refusé.</p>}
          {sel && (
            <>
              <SheetHeader><SheetTitle>{sel.target_name}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-5 text-sm">{draftRevision != null && draftRevision !== sel.revision && <p role="alert">La mission a été modifiée. Rouvrez-la pour reprendre avec la version actuelle.</p>}
                <div className="flex flex-wrap gap-1">
                  {MISSION_STEPS.map((s) => {
                    const idx = MISSION_STEPS.indexOf(sel.workflow_status);
                    const reached = idx === -1 || MISSION_STEPS.indexOf(s) <= idx;
                    return <Badge key={s} variant={reached ? 'default' : 'outline'}>{MISSION_LABELS[s]}</Badge>;
                  })}
                  {!MISSION_STEPS.includes(sel.workflow_status) && <Badge variant={statusVariant(sel.workflow_status)}>{MISSION_LABELS[sel.workflow_status]}</Badge>}
                </div>
                <p className="text-muted-foreground">{sel.mission_reference} · <SourceBadge source={sel.app_origin} /></p>

                {canEdit && ['mission', 'planned', 'assigned'].includes(sel.workflow_status) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Date prévue</Label>
                      <Input key={`${sel.id}:${sel.revision}`} disabled={update.isPending} type="date" defaultValue={sel.scheduled_date ?? ''} onBlur={(e) => !staleDraft && e.target.value && e.target.value !== (sel.scheduled_date ?? '') && update.mutate({ id: sel.id, revision: sel.revision, scheduled_date: e.target.value })} /></div>
                    <div><Label>Auditeur</Label>
                      <Select disabled={update.isPending || staleDraft} value={sel.auditor_id ?? ''} onValueChange={(v) => { if (!staleDraft && v !== sel.auditor_id) update.mutate({ id: sel.id, revision: sel.revision, auditor_id: v }); }}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>{auditors.map((a) => <SelectItem key={a.id} value={a.id}>{a.first_name} {a.last_name} · {a.email}</SelectItem>)}</SelectContent>
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
                {sel.anomaly_id && <div><p className="text-xs text-muted-foreground">Anomalie Ops associée.</p>{can('ops.anomalies', 'read') && <Button variant="link" className="px-0" asChild><Link to={`/pole/ops/anomalies?anomaly=${sel.anomaly_id}`}>Ouvrir l’anomalie Ops</Link></Button>}</div>}

                {canDecide && ['analysis', 'compliant', 'corrective_action'].includes(sel.workflow_status) && (
                  <div><Label>Compte rendu de décision ou de clôture (obligatoire)</Label><Textarea value={reason} onChange={(e) => { setReason(e.target.value); setDraftRevision(current => current ?? sel.revision); }} /></div>
                )}
                {canEdit && sel.workflow_status === 'non_compliant' && (
                  <div className="grid gap-2">
                    <Label>Action corrective demandée</Label>
                    <Textarea value={corrective.action} onChange={(e) => { setCorrective({ ...corrective, action: e.target.value }); setDraftRevision(current => current ?? sel.revision); }} />
                    <Input type="date" value={corrective.due} onChange={(e) => { setCorrective({ ...corrective, due: e.target.value }); setDraftRevision(current => current ?? sel.revision); }} />
                  </div>
                )}

                {canEdit && ['in_field','synced','analysis'].includes(sel.workflow_status) && <div className="space-y-2 rounded border p-3"><Label>Constats terrain</Label><Textarea maxLength={20000} value={results?.findings ?? sel.findings ?? ''} onChange={event => { setDraftRevision(current => current ?? sel.revision); setResults({ findings: event.target.value, recommendations: results?.recommendations ?? sel.recommendations ?? '', score: results?.score ?? (sel.score == null ? '' : String(sel.score)) }); }} /><Label>Recommandations</Label><Textarea maxLength={10000} value={results?.recommendations ?? sel.recommendations ?? ''} onChange={event => { setDraftRevision(current => current ?? sel.revision); setResults({ findings: results?.findings ?? sel.findings ?? '', recommendations: event.target.value, score: results?.score ?? (sel.score == null ? '' : String(sel.score)) }); }} /><Label>Score sur 100 (facultatif)</Label><Input type="number" min={0} max={100} value={results?.score ?? (sel.score == null ? '' : String(sel.score))} onChange={event => { setDraftRevision(current => current ?? sel.revision); setResults({ findings: results?.findings ?? sel.findings ?? '', recommendations: results?.recommendations ?? sel.recommendations ?? '', score: event.target.value }); }} /><Button disabled={update.isPending || staleDraft || !results || results.score !== '' && (!Number.isInteger(Number(results.score)) || Number(results.score) < 0 || Number(results.score) > 100)} onClick={() => results && update.mutate({ id: sel.id, revision: draftRevision ?? sel.revision, findings: results.findings.trim() || null, recommendations: results.recommendations.trim() || null, score: results.score === '' ? null : Number(results.score) }, { onSuccess: () => { setResults(null); setProof(null); setReason(''); setCorrective({ action: '', due: '' }); setDraftRevision(null); } })}>Enregistrer les résultats</Button></div>}
                {canEdit && sel.workflow_status === 'corrective_action' && <div className="space-y-2 rounded border p-3"><Label>Preuve de correction et vérification effectuée</Label><Textarea maxLength={10000} value={proof ?? sel.correction_evidence ?? ''} onChange={event => { setProof(event.target.value); setDraftRevision(current => current ?? sel.revision); }} /><Button disabled={update.isPending || staleDraft || proof == null || !proof.trim()} onClick={() => update.mutate({ id: sel.id, revision: draftRevision ?? sel.revision, correction_evidence: proof?.trim() }, { onSuccess: () => { setProof(null); setResults(null); setReason(''); setCorrective({ action: '', due: '' }); setDraftRevision(null); } })}>Enregistrer la preuve</Button></div>}
                {sel.correction_evidence && <div><p className="font-medium">Preuve de correction enregistrée</p><p className="whitespace-pre-wrap">{sel.correction_evidence}</p></div>}
                {sel.decision_reason && <div><p className="font-medium">Décision</p><p className="whitespace-pre-wrap">{sel.decision_reason}</p></div>}
                <div className="flex flex-wrap gap-2">
                  {(MISSION_TRANSITIONS[sel.workflow_status] ?? []).filter(to => ['compliant', 'non_compliant', 'closed'].includes(to) ? canDecide : canEdit).map((to) => {
                    const needsReason = ['compliant', 'non_compliant', 'closed'].includes(to) && !reason.trim();
                    const needsAction = to === 'corrective_action' && !corrective.action;
                    const needsAssign = to === 'assigned' && (!sel.auditor_id || !sel.scheduled_date);
                    return (
                      <Button key={to} size="sm" variant={to === 'non_compliant' ? 'destructive' : 'default'}
                        disabled={update.isPending || staleDraft || needsReason || needsAction || needsAssign || ['compliant','non_compliant'].includes(to) && !sel.findings?.trim() || to === 'closed' && sel.workflow_status === 'corrective_action' && !sel.correction_evidence?.trim()}
                        onClick={() => move(sel, to)}>
                        {to === 'assigned' ? 'Affecter la mission' : `→ ${MISSION_LABELS[to]}`}
                      </Button>
                    );
                  })}
                </div>
                {['mission', 'planned'].includes(sel.workflow_status) && (!sel.auditor_id || !sel.scheduled_date) && (
                  <p className="text-xs text-muted-foreground">Choisissez une date et un auditeur pour affecter la mission.</p>
                )}

                <div>
                  <p className="mb-2 font-medium">Historique</p>
                  {eventsError && <p role="alert">Historique indisponible.</p>}
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
