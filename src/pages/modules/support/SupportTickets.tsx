import { useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Archive, MessageSquare, Pencil, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExportButtons } from '@/components/ExportButtons';
import SupportTicketForm from '@/components/forms/SupportTicketForm';
import SupportTicketDiscussion from '@/components/operations/SupportTicketDiscussion';
import { ProductRequestButton } from '@/components/product/ProductRequestButton';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useSupportTickets, useSupportTicketStats, useSupportAssignees, useSupportActions } from '@/hooks/useSupportTickets';
import { SUPPORT_STATUS, SUPPORT_PRIORITY, SUPPORT_CATEGORY, SUPPORT_NEXT, SupportTicketWithAccount, SupportTicketFields, SupportStatus, supportTransitionNeedsNote, supportTransitionPatch, resolutionDuration } from '@/lib/supportTickets';

export default function SupportTickets() {
  const query = useSupportTickets();
  const stats = useSupportTicketStats();
  const people = useSupportAssignees();
  const actions = useSupportActions();
  const { user } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.toLowerCase());
  const [status, setStatus] = useState('active');
  const [view, setView] = useState('all');
  const [editing, setEditing] = useState<SupportTicketWithAccount | null | undefined>();
  const [note, setNote] = useState('');
  const rows = query.data || [];
  const selectedId = params.get('ticket');
  const accountFilter = params.get('account');
  const selected = rows.find(ticket => ticket.id === selectedId);
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('ticket', id); else next.delete('ticket');
    setParams(next, { replace: true }); setNote('');
  };
  const manager = isSuperAdmin || can('support.tickets', 'validate');
  const canUpdate = can('support.tickets', 'update');
  const pending = actions.update.isPending || actions.archive.isPending;
  const owns = !!selected && (selected.created_by === user?.id || selected.assigned_to === user?.id || manager);
  const active = !!selected && !selected.archived_at && !['resolved', 'closed'].includes(selected.status || 'open');
  const editable = active && owns && canUpdate;
  const mayTransition = !!selected && !selected.archived_at && canUpdate && (manager || selected.assigned_to === user?.id);
  const visible = rows.filter(ticket => (!accountFilter || ticket.user_account_id === accountFilter) && (status === 'archived' ? !!ticket.archived_at : !ticket.archived_at)
    && (status === 'all' || status === 'archived' || (status === 'active' ? !['resolved', 'closed'].includes(ticket.status || 'open') : ticket.status === status))
    && (view === 'all' || view === 'mine' && ticket.assigned_to === user?.id || view === 'unassigned' && !ticket.assigned_to)
    && `${ticket.subject} ${ticket.description} ${ticket.user_account?.company_name || ''}`.toLowerCase().includes(deferredSearch));
  const assignee = (id: string | null) => id ? people.data?.find(person => person.id === id)?.name || 'Compte indisponible' : 'Non attribué';
  const save = (input: SupportTicketFields) => {
    if (editing) actions.update.mutate({ id: editing.id, revision: editing.revision, patch: input }, { onSuccess: () => setEditing(undefined) });
    else actions.create.mutate(input, { onSuccess: () => setEditing(undefined) });
  };
  const transition = (next: SupportStatus) => {
    if (!selected) return;
    actions.update.mutate({ id: selected.id, revision: selected.revision, patch: supportTransitionPatch(selected.status, next, note) }, { onSuccess: () => setNote('') });
  };
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="flex items-center gap-3 text-3xl font-bold"><MessageSquare className="h-7 w-7 text-primary" />Support client</h1><p className="mt-1 text-sm text-muted-foreground">Attribution des tickets, suivi interne et résolutions documentées.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); void stats.refetch(); void people.refetch(); }}>Actualiser</Button><ExportButtons filename="tickets-support" title="Tickets Support" columns={[{ header: 'ID', accessor: 'id' }, { header: 'Sujet', accessor: 'subject' }, { header: 'Statut', accessor: 'status' }, { header: 'Priorité', accessor: 'priority' }, { header: 'Création', accessor: 'created_at' }]} data={query.isError || query.isLoading ? [] : visible} /><Button disabled={!can('support.tickets', 'create') || query.isError || query.isLoading} onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" />Nouveau ticket</Button></div>
      </div>
      {stats.isError && <p role="alert">Indicateurs indisponibles. <Button variant="link" onClick={() => void stats.refetch()}>Réessayer</Button></p>}
      <p className="text-xs text-muted-foreground">Indicateurs de tous les tickets accessibles non archivés.</p>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {([['Ouverts', stats.data?.openTickets], ['En cours', stats.data?.inProgressTickets], ['En attente', stats.data?.pendingTickets], ['Résolus', stats.data?.resolvedTickets], ['Fermés', stats.data?.closedTickets]] as const).map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-2xl font-semibold">{value ?? '—'}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}
        <Card><CardContent className="p-4"><p className="text-xl font-semibold">{resolutionDuration(stats.data?.avgResolutionHours)}</p><p className="text-xs text-muted-foreground">Délai moyen de résolution</p><p className="mt-1 text-xs text-muted-foreground">{stats.data ? `${stats.data.resolutionSamples} ticket(s) avec une durée connue` : '—'}</p></CardContent></Card>
      </div>
      {accountFilter && <p className="text-sm text-muted-foreground">Vue filtrée sur un compte client. <Button variant="link" onClick={() => { const next = new URLSearchParams(params); next.delete('account'); setParams(next, { replace: true }); }}>Voir tous les comptes</Button></p>}
      <div className="flex flex-wrap gap-3">
        <Input className="min-w-56 flex-1" aria-label="Rechercher un ticket" placeholder="Rechercher un sujet ou un client…" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} />
        <Select value={view} onValueChange={setView}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Accessibles</SelectItem><SelectItem value="mine">Mes tickets</SelectItem><SelectItem value="unassigned">Non attribués</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">À traiter</SelectItem><SelectItem value="all">Tous les actifs</SelectItem><SelectItem value="archived">Archives</SelectItem>{Object.entries(SUPPORT_STATUS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
      </div>
      {query.isLoading && <p role="status">Chargement…</p>}
      {query.isError && <p role="alert">Tickets indisponibles. <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></p>}
      {!query.isLoading && !query.isError && visible.length === 0 && <p className="py-6 text-muted-foreground">Aucun ticket dans cette vue.</p>}
      {!query.isError && !query.isLoading && <ul className="divide-y rounded border">
        {visible.map(ticket => <li key={ticket.id}><button className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-muted/40" onClick={() => select(ticket.id)}><span><span className="block font-medium">{ticket.subject}</span><span className="text-xs text-muted-foreground">{ticket.user_account?.company_name || (ticket.user_account_id ? 'Compte inaccessible' : 'Compte non rattaché')} · {assignee(ticket.assigned_to)}</span></span><span className="flex gap-2"><Badge variant={ticket.priority === 'critical' ? 'destructive' : 'outline'}>{SUPPORT_PRIORITY[ticket.priority as keyof typeof SUPPORT_PRIORITY] || ticket.priority || 'Priorité non renseignée'}</Badge><Badge variant="outline">{ticket.archived_at ? 'Archivé' : SUPPORT_STATUS[ticket.status as SupportStatus] || ticket.status || 'Statut non renseigné'}</Badge></span></button></li>)}
      </ul>}
      {editing !== undefined && <SupportTicketForm key={editing?.id || 'new'} open ticket={editing} pending={actions.create.isPending || actions.update.isPending} onOpenChange={open => !open && setEditing(undefined)} onSubmit={save} />}
      <Sheet open={!!selectedId} onOpenChange={open => !open && select(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selected ? <><SheetHeader><SheetTitle>{selected.subject}</SheetTitle></SheetHeader><div className="mt-5 space-y-5 text-sm">
            <div className="flex gap-2"><Badge variant="outline">{selected.archived_at ? 'Archivé' : SUPPORT_STATUS[selected.status as SupportStatus] || selected.status || 'Statut non renseigné'}</Badge><Badge variant="outline">{SUPPORT_CATEGORY[selected.category as keyof typeof SUPPORT_CATEGORY] || selected.category}</Badge></div>
            <p className="whitespace-pre-wrap break-words">{selected.description}</p>
            <p>Responsable : {assignee(selected.assigned_to)}</p>
            <p>Compte client : {selected.user_account?.company_name || (selected.user_account_id ? 'Compte inaccessible' : 'Non rattaché')}</p>
            {selected.resolution && <div className="rounded border p-3"><h2 className="font-medium">Résolution</h2><p className="mt-1 whitespace-pre-wrap">{selected.resolution}</p>{selected.resolved_at && <p className="mt-1 text-xs text-muted-foreground">{new Date(selected.resolved_at).toLocaleString('fr-FR')}</p>}</div>}
            <div className="flex flex-wrap gap-2">
              {active && canUpdate && !selected.assigned_to && <Button variant="outline" disabled={pending} onClick={() => actions.update.mutate({ id: selected.id, revision: selected.revision, patch: { assigned_to: user!.id } })}>Me l’attribuer</Button>}
              {editable && <Button variant="outline" onClick={() => setEditing(selected)}><Pencil className="mr-2 h-4 w-4" />Modifier</Button>}
              {active && <ProductRequestButton pole="support" category="bug" defaultTitle={`Ticket support ${selected.id.slice(0, 8)} — ${selected.subject}`} defaultDescription={`Ticket : ${selected.id}\nClient : ${selected.user_account?.company_name || 'Non renseigné'}\n\n${selected.description}`} defaultPriority={selected.priority === 'high' || selected.priority === 'critical' ? 'high' : 'medium'} label="Transmettre au Product" variant="ghost" />}
            </div>
            {mayTransition && <div className="space-y-3 rounded border p-3"><Label htmlFor="support-transition">Compte rendu de résolution ou motif de transition</Label><Textarea id="support-transition" value={note} maxLength={5000} onChange={event => setNote(event.target.value)} /><div className="flex flex-wrap gap-2">{(SUPPORT_NEXT[selected.status as SupportStatus] || []).filter(next => next !== 'open' || selected.status !== 'closed' || manager).map(next => <Button key={next} variant="outline" disabled={pending || supportTransitionNeedsNote(selected.status, next) && !note.trim()} onClick={() => transition(next)}>{next === 'open' ? 'Rouvrir' : SUPPORT_STATUS[next]}</Button>)}</div></div>}
            {!selected.archived_at && owns && can('support.tickets', 'delete') && <Button variant="outline" disabled={pending} onClick={() => { if (window.confirm('Archiver ce ticket en conservant ses notes et son historique ?')) actions.archive.mutate(selected, { onSuccess: () => select(null) }); }}><Archive className="mr-2 h-4 w-4" />Archiver</Button>}
            <SupportTicketDiscussion key={selected.id} ticket={selected} canComment={active && canUpdate} people={people.data || []} />
          </div></> : query.isLoading ? <p className="mt-8" role="status">Chargement…</p> : <p className="mt-8">Ticket indisponible ou accès refusé. <Button variant="link" onClick={() => select(null)}>Revenir à la liste</Button></p>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
