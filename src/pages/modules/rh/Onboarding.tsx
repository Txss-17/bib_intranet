import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Loader2, CheckCircle2, XCircle, History, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { poles as allPoles } from '@/data/poles';
import { useAuth } from '@/hooks/useAuth';
import {
  HR_STATUS, HR_STEPS, HrEmployeeRequest, useHrEmployeeRequests, useHrOnboardingActions, useHrRequestEvents,
} from '@/hooks/useHrOnboarding';

const POSITIONS = [
  'supplier_manager', 'user_success_manager', 'ops_logistics_manager', 'finance_manager',
  'audit_compliance_lead', 'rse_packaging_manager', 'tech_platform_manager', 'ceo',
  'marketing_manager', 'rh_manager', 'risk_manager', 'rd_manager',
];
const ROLES = ['viewer', 'operator', 'analyst', 'manager', 'executive', 'admin'];
const SENIORITIES = ['junior', 'mid', 'senior', 'lead', 'executive'];

const poleLabel = (id: string) => allPoles.find((p) => p.id === id)?.shortName ?? id;

function NewEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const { create } = useHrOnboardingActions();
  const [form, setForm] = useState({
    first_name: '', last_name: '', personal_email: '', work_email: '',
    position: 'ops_logistics_manager', seniority: 'junior', requested_role: 'viewer',
    contract_type: 'CDI', start_date: '', notes: '',
  });
  const [poles, setPoles] = useState<string[]>([]);

  const submit = async () => {
    await create.mutateAsync({
      ...form,
      start_date: form.start_date || null,
      poles,
    } as Partial<HrEmployeeRequest>);
    setOpen(false);
    setPoles([]);
  };

  const valid = form.first_name.trim() && form.last_name.trim() && (form.work_email.trim() || form.personal_email.trim()) && poles.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Nouveau collaborateur</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dossier collaborateur</DialogTitle>
          <DialogDescription>Créé par les RH, validé en interne, puis transmis à la Tech pour le compte et le rôle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
            <div><Label>Nom</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            <div><Label>Email personnel</Label><Input type="email" value={form.personal_email} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} /></div>
            <div><Label>Email professionnel</Label><Input type="email" value={form.work_email} onChange={(e) => setForm({ ...form, work_email: e.target.value })} placeholder="prenom@brand-in-a-box.space" /></div>
            <div>
              <Label>Poste</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niveau</Label>
              <Select value={form.seniority} onValueChange={(v) => setForm({ ...form, seniority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SENIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rôle applicatif</Label>
              <Select value={form.requested_role} onValueChange={(v) => setForm({ ...form, requested_role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date d'entrée</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
          </div>
          <div>
            <Label>Pôles d'affectation</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {allPoles.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={poles.includes(p.id)}
                    onCheckedChange={(c) => setPoles((prev) => (c ? [...prev, p.id] : prev.filter((x) => x !== p.id)))}
                  />
                  {p.shortName}
                </label>
              ))}
            </div>
          </div>
          <div><Label>Notes RH</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={!valid || create.isPending}>
            {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Soumettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestSheet({ request, canValidate, isTech, onClose }: {
  request: HrEmployeeRequest; canValidate: boolean; isTech: boolean; onClose: () => void;
}) {
  const events = useHrRequestEvents(request.id);
  const { setStatus, provisionAccount } = useHrOnboardingActions();
  const [reason, setReason] = useState('');
  const step = HR_STATUS[request.status].step;

  return (
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2">
          {request.reference}
          <Badge variant={HR_STATUS[request.status].variant}>{HR_STATUS[request.status].label}</Badge>
        </SheetTitle>
        <SheetDescription>{request.first_name} {request.last_name} · {request.position ?? '—'}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div>
          <Progress value={(step / (HR_STEPS.length - 1)) * 100} />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            {HR_STEPS.map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><span className="text-muted-foreground">Email pro :</span> {request.work_email ?? '—'}</p>
          <p><span className="text-muted-foreground">Email perso :</span> {request.personal_email ?? '—'}</p>
          <p><span className="text-muted-foreground">Rôle :</span> {request.requested_role}</p>
          <p><span className="text-muted-foreground">Niveau :</span> {request.seniority}</p>
          <p><span className="text-muted-foreground">Contrat :</span> {request.contract_type ?? '—'}</p>
          <p><span className="text-muted-foreground">Entrée :</span> {request.start_date ?? '—'}</p>
          <p className="col-span-2"><span className="text-muted-foreground">Pôles :</span> {(request.poles ?? []).map(poleLabel).join(', ') || '—'}</p>
        </div>
        {request.notes && <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">{request.notes}</p>}
        {request.rejection_reason && (
          <p className="rounded-md border border-destructive/40 p-3 text-xs text-destructive">Refus : {request.rejection_reason}</p>
        )}

        {(canValidate || isTech) && request.status !== 'completed' && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
            <Textarea className="mt-2" rows={2} placeholder="Motif (obligatoire pour un refus)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              {canValidate && request.status === 'submitted' && (
                <Button size="sm" onClick={() => setStatus.mutate({ request, status: 'hr_validated' })}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Valider (RH)
                </Button>
              )}
              {isTech && request.status === 'hr_validated' && (
                <Button size="sm" disabled={provisionAccount.isPending} onClick={() => provisionAccount.mutate(request)}>
                  {provisionAccount.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-1.5 h-3.5 w-3.5" />}
                  Créer compte & rôle
                </Button>
              )}
              {(canValidate || isTech) && (
                <Button size="sm" variant="destructive" disabled={!reason.trim()}
                  onClick={() => setStatus.mutate({ request, status: 'rejected', reason })}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Refuser
                </Button>
              )}
            </div>
          </div>
        )}

        <Separator />
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Historique
          </p>
          <div className="mt-2 space-y-1.5">
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

export default function Onboarding() {
  const { profile } = useAuth();
  const userPoles = profile?.poles ?? [];
  const canValidate = userPoles.includes('rh') || userPoles.includes('direction');
  const isTech = userPoles.includes('tech');
  const { data: requests = [], isLoading } = useHrEmployeeRequests();
  const [selected, setSelected] = useState<HrEmployeeRequest | null>(null);

  const kpis = useMemo(() => ({
    total: requests.length,
    toValidate: requests.filter((r) => r.status === 'submitted').length,
    toProvision: requests.filter((r) => r.status === 'hr_validated').length,
    done: requests.filter((r) => r.status === 'completed').length,
  }), [requests]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Onboarding & workflow RH → Tech</h1>
          <p className="text-sm text-muted-foreground">
            Création du dossier, validation RH, création du compte et du rôle par la Tech, historique complet.
          </p>
        </div>
        {canValidate && <NewEmployeeDialog />}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Dossiers', value: kpis.total },
          { label: 'À valider (RH)', value: kpis.toValidate },
          { label: 'Comptes à créer (Tech)', value: kpis.toProvision },
          { label: 'Intégrations terminées', value: kpis.done },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dossiers en cours</CardTitle>
          <CardDescription>{HR_STEPS.join(' → ')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucun dossier collaborateur.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf.</TableHead>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Pôles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                    <TableCell>{r.first_name} {r.last_name}</TableCell>
                    <TableCell className="text-xs">{(r.poles ?? []).map(poleLabel).join(', ') || '—'}</TableCell>
                    <TableCell><Badge variant={HR_STATUS[r.status].variant}>{HR_STATUS[r.status].label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
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

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <RequestSheet request={selected} canValidate={canValidate} isTech={isTech} onClose={() => setSelected(null)} />
        )}
      </Sheet>
    </div>
  );
}
