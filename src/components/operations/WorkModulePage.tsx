import { useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { usePoleCollaborators } from '@/hooks/usePoleCollaborators';
import { poles as allPoles } from '@/data/poles';
import { useWorkModuleRows, useWorkModuleActions, useWorkModulePeople, WorkModuleKind, WorkVersion, PROJECT_STATUS_LABELS, PROCESS_STATUS_LABELS, VALIDATION_STATUS_LABELS, ESCALATION_STATUS_LABELS, ESCALATION_SEVERITY_LABELS } from '@/hooks/useWorkModule';
import WorkHistoryCard from './WorkHistoryCard';
const definitions = { projects: { title: 'Projets', one: 'Projet', description: 'Responsables, échéances et avancement des projets.', statuses: PROJECT_STATUS_LABELS }, processes: { title: 'Processus', one: 'Processus', description: 'Procédures, étapes et versions publiées.', statuses: PROCESS_STATUS_LABELS }, validations: { title: 'Validations', one: 'Demande', description: 'Demandes, validateurs distincts et décisions motivées.', statuses: VALIDATION_STATUS_LABELS }, escalations: { title: 'Escalades', one: 'Escalade', description: 'Blocages, prise en charge et résolution documentée.', statuses: ESCALATION_STATUS_LABELS } };
export interface WorkRow extends WorkVersion {
    name?: string;
    title?: string;
    description?: string | null;
    pole?: string | null;
    status: string;
    created_by?: string | null;
    requester_id?: string | null;
    raised_by?: string | null;
    owner_id?: string | null;
    owner_name?: string | null;
    validator_id?: string | null;
    validator_name?: string | null;
    requester_name?: string | null;
    assigned_to?: string | null;
    assigned_name?: string | null;
    raised_by_name?: string | null;
    due_date?: string | null;
    steps?: {
        label: string;
    }[];
    severity?: string;
    decision_note?: string | null;
    resolution_note?: string | null;
    decided_at?: string | null;
    resolved_at?: string | null;
    created_at: string;
}
const transitions: Record<WorkModuleKind, Record<string, string[]>> = { projects: { planning: ['active', 'on_hold', 'cancelled'], active: ['on_hold', 'completed', 'cancelled'], on_hold: ['active', 'cancelled'], completed: ['planning'], cancelled: ['planning'] }, processes: { draft: ['active'], active: ['draft', 'deprecated'], deprecated: ['draft'] }, validations: { pending: ['approved', 'rejected'] }, escalations: { open: ['acknowledged'], acknowledged: ['resolved'], resolved: ['open'] } };
const closed: Record<WorkModuleKind, string[]> = { projects: ['completed', 'cancelled'], processes: ['deprecated'], validations: ['approved', 'rejected'], escalations: ['resolved'] };
const creator = (r: WorkRow) => r.created_by || r.requester_id || r.raised_by;
const target = (r: WorkRow) => r.owner_id || r.validator_id || r.assigned_to;
const name = (r: WorkRow) => r.name || r.title || 'Sans titre';
const targetName = (r: WorkRow) => r.owner_name || r.validator_name || r.assigned_name || 'Non attribué';
const requiresNote = (kind: WorkModuleKind, r: WorkRow, status: string) => kind === 'validations' ? status === 'rejected' : kind === 'processes' ? r.status !== 'draft' : kind === 'projects' ? status === 'cancelled' || closed.projects.includes(r.status) : status === 'resolved' || r.status === 'resolved';
export default function WorkModulePage({ kind, defaultPole, title }: {
    kind: WorkModuleKind;
    defaultPole?: string;
    title?: string;
}) {
    const definition = definitions[kind];
    const query = useWorkModuleRows<WorkRow>(kind);
    const rows = query.data || [];
    const actions = useWorkModuleActions(kind);
    const { user, profile } = useAuth();
    const { can, isSuperAdmin } = usePermissions();
    const page = 'work.' + kind;
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('record');
    const select = (id: string | null) => { const next = new URLSearchParams(params); if (id)
        next.set('record', id);
    else
        next.delete('record'); setParams(next, { replace: true }); setNote(''); };
    const [search, setSearch] = useState('');
    const deferred = useDeferredValue(search);
    const [status, setStatus] = useState('open');
    const [view, setView] = useState('all');
    const [editing, setEditing] = useState<WorkRow | null | undefined>();
    const [note, setNote] = useState('');
    const selected = rows.find(r => r.id === selectedId);
    const visible = rows.filter(r => (!defaultPole || r.pole === defaultPole) && (status === 'archived' ? !!r.archived_at : !r.archived_at) && (status === 'all' || status === 'archived' || (status === 'open' ? !closed[kind].includes(r.status) : r.status === status)) && (view === 'all' || view === 'mine' && (creator(r) === user?.id || target(r) === user?.id) || view === 'pole' && !!r.pole && profile?.poles?.includes(r.pole as never)) && `${name(r)} ${r.description || ''} ${targetName(r)} ${r.pole || ''}`.toLowerCase().includes(deferred.toLowerCase()));
    const own = !!selected && (creator(selected) === user?.id || target(selected) === user?.id || isSuperAdmin);
    const scopeManager = !!selected && (isSuperAdmin || !!selected.pole && !!profile?.poles?.includes(selected.pole as never) && can(page, kind === 'processes' ? 'publish' : 'validate'));
    const editable = !!selected && !selected.archived_at && own && can(page, 'update') && (kind === 'processes' ? selected.status === 'draft' : kind === 'validations' ? selected.status === 'pending' : !closed[kind].includes(selected.status));
    const available = (r: WorkRow) => (transitions[kind][r.status] || []).filter(next => !r.archived_at && (kind === 'validations' ? can(page, 'validate') && r.validator_id === user?.id && r.requester_id !== user?.id : kind === 'processes' ? can(page, 'publish') && (own || scopeManager) : can(page, 'update') && (own || scopeManager)) && !(kind === 'projects' && closed.projects.includes(r.status) && !can(page, 'validate')) && !(kind === 'escalations' && next !== 'open' && r.assigned_to && r.assigned_to !== user?.id && !scopeManager));
    const transition = (r: WorkRow, next: string) => actions.update.mutate({ id: r.id, revision: r.revision, status: next, change_note: note }, { onSuccess: () => setNote('') });
    return <div className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">{title || definition.title}</h1><p className="text-sm text-muted-foreground">{definition.description}</p></div><Button disabled={!can(page, 'create')} onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4"/>Nouveau · {definition.one.toLowerCase()}</Button></div>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Object.entries(definition.statuses).map(([key, label]) => <div key={key} className="rounded border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{rows.filter(r => !r.archived_at && (!defaultPole || r.pole === defaultPole) && r.status === key).length}</p></div>)}</div>
 <div className="flex flex-wrap gap-3"><Input className="min-w-48 flex-1" placeholder="Rechercher…" aria-label="Rechercher dans le module Travail" maxLength={200} value={search} onChange={e => setSearch(e.target.value)}/><Select value={view} onValueChange={setView}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Accessibles</SelectItem><SelectItem value="mine">Mes suivis</SelectItem><SelectItem value="pole">Mes pôles</SelectItem></SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">En cours</SelectItem><SelectItem value="all">Tous les actifs</SelectItem><SelectItem value="archived">Archives</SelectItem>{Object.entries(definition.statuses).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
 {query.isLoading && <p role="status">Chargement…</p>}{query.isError && <p role="alert">Chargement impossible. <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></p>}{!query.isError && !query.isLoading && visible.length === 0 && <p className="text-muted-foreground">Aucun élément dans cette vue.</p>}<ul className="divide-y rounded border">{visible.map(r => <li key={r.id}><button className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-muted/50" onClick={() => select(r.id)}><span><span className="block font-medium">{name(r)}</span><span className="text-xs text-muted-foreground">{targetName(r)}{r.pole ? ` · ${r.pole}` : ''}{r.due_date ? ` · ${r.due_date}` : ''}</span></span><span className="flex gap-2">{r.severity && <Badge variant="outline">{ESCALATION_SEVERITY_LABELS[r.severity as keyof typeof ESCALATION_SEVERITY_LABELS]}</Badge>}<Badge variant="outline">{r.archived_at ? 'Archivé' : (definition.statuses as Record<string, string>)[r.status]}</Badge></span></button></li>)}</ul>
 {editing !== undefined && <WorkEditor key={editing?.id || 'new'} kind={kind} row={editing || undefined} defaultPole={defaultPole} pending={actions.create.isPending || actions.update.isPending} close={() => setEditing(undefined)} save={(input, base) => base ? actions.update.mutate({ id: base.id, revision: base.revision, ...input }, { onSuccess: () => setEditing(undefined) }) : actions.create.mutate(input, { onSuccess: () => setEditing(undefined) })}/>}
 <Sheet open={!!selectedId} onOpenChange={open => !open && select(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl">{selected ? <><SheetHeader><SheetTitle>{name(selected)}</SheetTitle></SheetHeader><div className="mt-5 space-y-4 text-sm"><Badge variant="outline">{selected.archived_at ? 'Archivé' : (definition.statuses as Record<string, string>)[selected.status]}</Badge><p className="whitespace-pre-wrap">{selected.description || 'Aucune description.'}</p><p>{kind === 'validations' ? 'Validateur' : 'Responsable'} : {targetName(selected)}</p>{selected.due_date && <p>Échéance : {selected.due_date}</p>}{selected.steps?.length > 0 && <ol className="list-inside list-decimal space-y-2">{selected.steps.map((step, i) => <li key={i}>{step.label}</li>)}</ol>}{selected.decided_at && <p>Décision du {new Date(selected.decided_at).toLocaleString('fr-FR')}</p>}{selected.decision_note && <p className="whitespace-pre-wrap">{selected.decision_note}</p>}{selected.resolved_at && <p>Résolue le {new Date(selected.resolved_at).toLocaleString('fr-FR')}</p>}{selected.resolution_note && <p className="whitespace-pre-wrap">{selected.resolution_note}</p>}{editable && <Button variant="outline" onClick={() => setEditing(selected)}><Pencil className="mr-2 h-4 w-4"/>{kind === 'validations' ? 'Changer le validateur' : 'Modifier'}</Button>}
 {available(selected).length > 0 && <div className="space-y-3 rounded border p-3"><Label htmlFor="work-note">Motif de décision ou de transition</Label><Textarea id="work-note" value={note} maxLength={5000} onChange={e => setNote(e.target.value)}/><div className="flex flex-wrap gap-2">{available(selected).map(next => <Button key={next} variant={next === 'rejected' || next === 'cancelled' ? 'destructive' : 'outline'} disabled={actions.update.isPending || requiresNote(kind, selected, next) && !note.trim()} onClick={() => transition(selected, next)}>{(definition.statuses as Record<string, string>)[next]}</Button>)}</div></div>}
 {!selected.archived_at && (own || scopeManager) && can(page, 'delete') && <Button variant="outline" disabled={actions.remove.isPending} onClick={() => { if (window.confirm('Archiver cet élément en conservant son historique ?'))
            actions.remove.mutate(selected, { onSuccess: () => select(null) }); }}><Archive className="mr-2 h-4 w-4"/>Archiver</Button>}<WorkHistoryCard kind={kind} id={selected.id}/></div></> : query.isLoading ? <p className="mt-8 text-sm" role="status">Chargement…</p> : <p className="mt-8 text-sm">Cet élément n’est plus accessible. <Button variant="link" onClick={() => select(null)}>Revenir à la liste</Button></p>}</SheetContent></Sheet>
 </div>;
}
function WorkEditor({ kind, row, defaultPole, pending, close, save }: {
    kind: WorkModuleKind;
    row?: WorkRow;
    defaultPole?: string;
    pending: boolean;
    close: () => void;
    save: (input: Record<string, unknown>, base?: WorkRow) => void;
}) {
    const [base] = useState(row);
    const { user, profile } = useAuth();
    const { poles, isSuperAdmin } = usePermissions();
    const people = useWorkModulePeople(kind);
    const isCeo = profile?.position === 'ceo' && profile?.test_account !== true;
    const [memberPole, setMemberPole] = useState<string>(
        row?.pole || defaultPole || poles[0] || (isCeo ? 'direction' : '')
    );
    const directory = usePoleCollaborators(memberPole || null, `work.${kind}`, kind === 'validations' ? 'validate' : 'update');
    const poleOptions = allPoles.filter(p => isSuperAdmin || isCeo || poles.includes(p.id));
    const personColumn = kind === 'validations' ? 'validator_id' : kind === 'escalations' ? 'assigned_to' : 'owner_id';
    const [form, setForm] = useState({ title: row ? name(row) : '', description: row?.description || '', pole: row?.pole || defaultPole || '', person: row?.owner_id || row?.validator_id || row?.assigned_to || 'none', due: row?.due_date || '', steps: (row?.steps || []).map(s => s.label).join('\n'), severity: row?.severity || 'medium', resolution: row?.resolution_note || '' });
    const change = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
    const assignedToPole = (p: { id: string }) =>
        !!directory.data?.some(m => m.id === p.id && m.eligible);
    const availablePeople = (people.data || []).filter(p =>
        assignedToPole(p) && (kind !== 'validations' || p.id !== (base?.requester_id || user?.id))
    );
    const members = directory.data || [];
    const submit = () => { if (base && kind === 'validations') {
        save({ validator_id: form.person }, base);
        return;
    } const input: Record<string, unknown> = { [kind === 'projects' || kind === 'processes' ? 'name' : 'title']: form.title.trim(), description: form.description.trim() || null, pole: form.pole || null, [personColumn]: form.person === 'none' ? null : form.person }; if (kind === 'projects')
        input.due_date = form.due || null; if (kind === 'processes')
        input.steps = form.steps.split('\n').map(label => label.trim()).filter(Boolean).map(label => ({ label })); if (kind === 'escalations') {
        input.severity = form.severity;
        if (base)
            input.resolution_note = form.resolution.trim() || null;
    } save(input, base); };
    return <Dialog open onOpenChange={open => !open && !pending && close()}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{base ? 'Modifier' : 'Créer'} · {definitions[kind].one}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={e => { e.preventDefault(); submit(); }}>{!(base && kind === 'validations') && <><div><Label htmlFor="work-title">{kind === 'projects' || kind === 'processes' ? 'Nom' : 'Titre'}</Label><Input id="work-title" required maxLength={255} value={form.title} onChange={e => change('title', e.target.value)}/></div><div><Label htmlFor="work-description">Description</Label><Textarea id="work-description" maxLength={20000} value={form.description} onChange={e => change('description', e.target.value)}/></div><div><Label>Pôle</Label><Select value={form.pole || 'none'} onValueChange={value => { change('pole', value === 'none' ? '' : value); setMemberPole(value === 'none' ? (poles[0] || (isCeo ? 'direction' : '')) : value); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sans pôle défini</SelectItem>{poleOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div></>}
 <div className="space-y-2 rounded-md border p-3">
   <Label>Membres du pôle</Label>
   <Select value={memberPole} onValueChange={setMemberPole}>
     <SelectTrigger aria-label="Filtrer les membres par pôle"><SelectValue placeholder="Choisir un pôle"/></SelectTrigger>
     <SelectContent>
       {poleOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
     </SelectContent>
   </Select>
   {directory.isLoading ? <p role="status" className="text-xs text-muted-foreground">Chargement des membres…</p> :
    directory.isError ? <p role="alert" className="text-xs text-destructive">Annuaire indisponible : vérifiez le déploiement de la migration 0074 et les droits d'accès du compte. {directory.error instanceof Error ? directory.error.message : ''}</p> :
    <p className="text-xs text-muted-foreground">
      {members.length} membre(s) du pôle · {members.filter(p => p.eligible).length} autorisé(s) à recevoir ce dossier.
    </p>}
   {!directory.isError && !directory.isLoading && members.length > 0 &&
      <div className="max-h-32 overflow-y-auto text-xs">
       {members.map(p => <div key={p.id} className="flex justify-between gap-2 border-b py-1">
         <span>{[p.first_name,p.last_name].filter(Boolean).join(' ') || p.id}</span>
         <span className={p.eligible ? 'text-muted-foreground' : 'text-amber-600'}>
           {p.eligible ? 'Affectable' : 'Droits insuffisants'}
         </span>
       </div>)}
      </div>}
   <p className="text-xs text-muted-foreground">Le pôle recense ses membres actifs. L'affectation exige en plus les droits métier vérifiés côté serveur.</p>
 </div>
 <div><Label>{kind === 'validations' ? 'Validateur distinct du demandeur' : 'Responsable'}</Label><Select value={form.person} onValueChange={value => change('person', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{kind !== 'validations' && <SelectItem value="none">Non attribué</SelectItem>}{availablePeople.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select>{people.isError && <p role="alert" className="text-sm">Liste des responsables autorisés indisponible.</p>}</div>
 {kind === 'projects' && <div><Label htmlFor="work-due">Échéance</Label><Input id="work-due" type="date" value={form.due} onChange={e => change('due', e.target.value)}/></div>}{kind === 'processes' && <div><Label htmlFor="work-steps">Étapes, une par ligne</Label><Textarea id="work-steps" rows={6} maxLength={50000} value={form.steps} onChange={e => change('steps', e.target.value)}/></div>}{kind === 'escalations' && <><div><Label>Gravité</Label><Select value={form.severity} onValueChange={v => change('severity', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ESCALATION_SEVERITY_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>{base && <div><Label htmlFor="work-resolution">Éléments de résolution en préparation</Label><Textarea id="work-resolution" maxLength={5000} value={form.resolution} onChange={e => change('resolution', e.target.value)}/></div>}</>}
 <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={close}>Annuler</Button><Button disabled={pending || !form.title.trim() || kind === 'validations' && form.person === 'none'}>{pending ? 'Enregistrement…' : base ? 'Enregistrer' : 'Créer'}</Button></div></form></DialogContent></Dialog>;
}
