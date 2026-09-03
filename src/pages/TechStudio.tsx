import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Send, Loader2, History, MessageSquare, CheckCircle2, XCircle, Wrench, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useAuth } from '@/hooks/useAuth';
import { poles as allPoles } from '@/data/poles';
import {
  PRIORITIES, TECH_REQUEST_CATEGORIES, TECH_REQUEST_STATUS, TechRequest, TechRequestStatus,
  useTechRequestActions, useTechRequestThread, useTechRequests,
} from '@/hooks/useTechRequests';
import { HR_STATUS, useHrEmployeeRequests, useHrOnboardingActions } from '@/hooks/useHrOnboarding';

const poleLabel = (id?: string | null) => allPoles.find((p) => p.id === id)?.shortName ?? id ?? '—';

function NewRequestDialog({ defaultPole }: { defaultPole: string }) {
  const [open, setOpen] = useState(false);
  const { create } = useTechRequestActions();
  const [form, setForm] = useState({
    title: '', description: '', requester_pole: defaultPole,
    category: 'evolution', priority: 'medium', target_date: '',
  });

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    await create.mutateAsync({ ...form, target_date: form.target_date || null });
    setOpen(false);
    setForm({ title: '', description: '', requester_pole: defaultPole, category: 'evolution', priority: 'medium', target_date: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Nouvelle demande</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demande au Tech Studio</DialogTitle>
          <DialogDescription>Décrivez le besoin de votre pôle. La Tech valide, commente et suit l'avancement.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="tr-title">Objet</Label>
            <Input id="tr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : ajouter un export CSV des réassorts" />
          </div>
          <div>
            <Label htmlFor="tr-desc">Description & impact métier</Label>
            <Textarea id="tr-desc" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pôle demandeur</Label>
              <Select value={form.requester_pole} onValueChange={(v) => setForm({ ...form, requester_pole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allPoles.map((p) => <SelectItem key={p.id} value={p.id}>{p.shortName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TECH_REQUEST_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tr-date">Échéance souhaitée</Label>
              <Input id="tr-date" type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending || !form.title.trim() || !form.description.trim()}>
            {create.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Transmettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDetail({ request, isTech, onClose }: { request: TechRequest; isTech: boolean; onClose: () => void }) {
  const { comments, events } = useTechRequestThread(request.id);
  const { changeStatus, comment } = useTechRequestActions();
  const [body, setBody] = useState('');
  const [reason, setReason] = useState('');

  const act = (status: TechRequestStatus) => changeStatus.mutate({ request, status, reason: reason || undefined });

  return (
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {request.reference}
          <Badge variant={TECH_REQUEST_STATUS[request.status].variant}>{TECH_REQUEST_STATUS[request.status].label}</Badge>
        </SheetTitle>
        <SheetDescription>
          {poleLabel(request.requester_pole)} · {request.requester_name ?? '—'} · {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">{request.title}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{request.description}</p>
        </div>
        {request.decision_reason && (
          <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            Motif de décision : {request.decision_reason}
          </p>
        )}

        {isTech && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validation Tech</p>
            <Textarea className="mt-2" rows={2} placeholder="Motif / précision (obligatoire pour un refus)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => act('under_review')}>En revue</Button>
              <Button size="sm" onClick={() => act('accepted')}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Valider</Button>
              <Button size="sm" variant="outline" onClick={() => act('in_progress')}><Wrench className="mr-1.5 h-3.5 w-3.5" /> En cours</Button>
              <Button size="sm" variant="outline" onClick={() => act('done')}>Livrée</Button>
              <Button size="sm" variant="destructive" disabled={!reason.trim()} onClick={() => act('rejected')}>
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Refuser
              </Button>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Commentaires
          </p>
          <div className="mt-2 space-y-2">
            {(comments.data ?? []).map((c) => (
              <div key={c.id} className="rounded-md border border-border p-2.5">
                <p className="text-xs font-medium">{c.author_name} <span className="text-muted-foreground">· {poleLabel(c.author_pole)} · {format(new Date(c.created_at), 'dd/MM HH:mm')}</span></p>
                <p className="mt-1 text-sm whitespace-pre-line">{c.body}</p>
              </div>
            ))}
            {!comments.data?.length && <p className="text-sm text-muted-foreground">Aucun commentaire.</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Écrire un commentaire…" />
            <Button size="sm" disabled={!body.trim() || comment.isPending}
              onClick={async () => { await comment.mutateAsync({ requestId: request.id, body }); setBody(''); }}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Historique
          </p>
          <div className="mt-2 space-y-2">
            {(events.data ?? []).map((e) => (
              <div key={e.id} className="text-xs">
                <span className="text-muted-foreground">{format(new Date(e.created_at), 'dd/MM HH:mm')} · </span>
                <span className="font-medium">{e.actor_name}</span> — {e.action}
                {e.note && <span className="text-muted-foreground"> ({e.note})</span>}
              </div>
            ))}
            {!events.data?.length && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
          </div>
        </div>

        <Button variant="ghost" className="w-full" onClick={onClose}>Fermer</Button>
      </div>
    </SheetContent>
  );
}

export default function TechStudio() {
  const { profile } = useAuth();
  const isTech = (profile?.poles ?? []).includes('tech');
  const { data: requests = [], isLoading } = useTechRequests();
  const hrRequests = useHrEmployeeRequests();
  const { provisionAccount } = useHrOnboardingActions();

  const [selected, setSelected] = useState<TechRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [poleFilter, setPoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => requests.filter((r) =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      (poleFilter === 'all' || r.requester_pole === poleFilter) &&
      (!search || `${r.reference} ${r.title}`.toLowerCase().includes(search.toLowerCase()))),
    [requests, statusFilter, poleFilter, search],
  );

  const kpis = useMemo(() => ({
    total: requests.length,
    open: requests.filter((r) => ['submitted', 'under_review'].includes(r.status)).length,
    running: requests.filter((r) => ['accepted', 'in_progress'].includes(r.status)).length,
    done: requests.filter((r) => r.status === 'done').length,
  }), [requests]);

  const pendingAccounts = (hrRequests.data ?? []).filter((r) => r.status === 'hr_validated');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tech Studio</h1>
          <p className="text-sm text-muted-foreground">
            Centre de demandes inter-pôles : soumission, validation, commentaires et historique.
          </p>
        </div>
        <NewRequestDialog defaultPole={profile?.poles?.[0] ?? 'ops'} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Demandes', value: kpis.total },
          { label: 'À traiter', value: kpis.open },
          { label: 'En cours', value: kpis.running },
          { label: 'Livrées', value: kpis.done },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
          {isTech && (
            <TabsTrigger value="accounts">
              Comptes à créer{pendingAccounts.length ? ` (${pendingAccounts.length})` : ''}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input className="max-w-xs" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(TECH_REQUEST_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={poleFilter} onValueChange={setPoleFilter}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Pôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pôles</SelectItem>
                    {allPoles.map((p) => <SelectItem key={p.id} value={p.id}>{p.shortName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune demande.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Réf.</TableHead>
                      <TableHead>Objet</TableHead>
                      <TableHead>Pôle</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                        <TableCell className="max-w-[280px] truncate">{r.title}</TableCell>
                        <TableCell>{poleLabel(r.requester_pole)}</TableCell>
                        <TableCell className="capitalize">{PRIORITIES.find((p) => p.value === r.priority)?.label ?? r.priority}</TableCell>
                        <TableCell><Badge variant={TECH_REQUEST_STATUS[r.status].variant}>{TECH_REQUEST_STATUS[r.status].label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelected(r)}>Ouvrir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isTech && (
          <TabsContent value="accounts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dossiers validés par les RH</CardTitle>
                <CardDescription>Créer le compte, le profil et le rôle du collaborateur.</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAccounts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Aucun compte à créer.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Réf.</TableHead>
                        <TableHead>Collaborateur</TableHead>
                        <TableHead>Pôles</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAccounts.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                          <TableCell>
                            {r.first_name} {r.last_name}
                            <span className="block text-xs text-muted-foreground">{r.work_email ?? r.personal_email}</span>
                          </TableCell>
                          <TableCell className="text-xs">{(r.poles ?? []).map(poleLabel).join(', ') || '—'}</TableCell>
                          <TableCell><Badge variant="outline">{r.requested_role}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" disabled={provisionAccount.isPending} onClick={() => provisionAccount.mutate(r)}>
                              {provisionAccount.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                              Créer le compte
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Statuts suivis : {Object.values(HR_STATUS).map((s) => s.label).join(' → ')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && <RequestDetail request={selected} isTech={isTech} onClose={() => setSelected(null)} />}
      </Sheet>
    </div>
  );
}
