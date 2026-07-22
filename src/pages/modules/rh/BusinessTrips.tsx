import { useMemo, useState } from 'react';
import { Plane, Plus, Calendar, MapPin, Wallet, CheckCircle2, Clock, XCircle, Loader2, Send, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useBusinessTrips, useCreateBusinessTrip, useSubmitTrip,
  useApproveTrip, useRejectTrip, BusinessTrip,
} from '@/hooks/usePhase4';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const STATUS_META: Record<string, { label: string; className: string; icon: any }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground', icon: FileText },
  submitted: { label: 'Soumis', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  pending: { label: 'En attente', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  approved: { label: 'Approuvé', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Refusé', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  in_progress: { label: 'En cours', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', icon: Plane },
  completed: { label: 'Terminé', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
};

const STATUS_STEPS = ['draft', 'submitted', 'approved', 'completed'];

export default function BusinessTrips() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const canApprove = isAdmin || isManager;
  const { data: trips = [], isLoading } = useBusinessTrips();
  const create = useCreateBusinessTrip();
  const submit = useSubmitTrip();
  const approve = useApproveTrip();
  const reject = useRejectTrip();
  const [open, setOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null);
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    purpose: '', destination: '', start_date: '', end_date: '',
    estimated_budget: '', transport_mode: 'train', accommodation: '', notes: '',
  });

  const filtered = useMemo(() => {
    if (statusTab === 'all') return trips;
    if (statusTab === 'pending') return trips.filter(t => ['submitted', 'pending'].includes(t.status));
    return trips.filter(t => t.status === statusTab);
  }, [trips, statusTab]);

  const counts = useMemo(() => ({
    all: trips.length,
    pending: trips.filter(t => ['submitted', 'pending'].includes(t.status)).length,
    approved: trips.filter(t => t.status === 'approved').length,
    rejected: trips.filter(t => t.status === 'rejected').length,
  }), [trips]);

  const doCreate = (asSubmit: boolean) => {
    if (!form.purpose || !form.destination || !form.start_date || !form.end_date) return;
    create.mutate({
      purpose: form.purpose,
      destination: form.destination,
      start_date: form.start_date,
      end_date: form.end_date,
      estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : null,
      transport_mode: form.transport_mode,
      accommodation: form.accommodation || null,
      notes: form.notes || null,
      submit: asSubmit,
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ purpose: '', destination: '', start_date: '', end_date: '', estimated_budget: '', transport_mode: 'train', accommodation: '', notes: '' });
      },
    });
  };

  const confirmReject = () => {
    if (!rejectDialog || !reason.trim()) return;
    reject.mutate({ id: rejectDialog.id, reason }, {
      onSuccess: () => { setRejectDialog(null); setReason(''); },
    });
  };

  const StatusStepper = ({ trip }: { trip: BusinessTrip }) => {
    const currentIdx = trip.status === 'rejected'
      ? -1
      : STATUS_STEPS.indexOf(trip.status);
    if (trip.status === 'rejected') {
      return (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <XCircle className="h-3.5 w-3.5" />
          Refusé{trip.rejection_reason ? ` — ${trip.rejection_reason}` : ''}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 mt-2 text-xs">
        {STATUS_STEPS.map((s, i) => {
          const meta = STATUS_META[s];
          const done = i <= currentIdx;
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`h-1.5 w-6 rounded-full ${done ? 'bg-primary' : 'bg-muted'}`} />
              {i === currentIdx && <span className="text-muted-foreground">{meta.label}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Plane className="h-7 w-7 text-primary" /> Déplacements professionnels</h1>
          <p className="text-muted-foreground mt-1">Workflow d'approbation avec traçabilité complète.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nouvelle demande</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Demande de déplacement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Objet</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Audit fournisseur Marseille" /></div>
              <div><Label>Destination</Label><Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="Marseille, France" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Départ</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Retour</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Budget estimé (€)</Label><Input type="number" value={form.estimated_budget} onChange={e => setForm({ ...form, estimated_budget: e.target.value })} /></div>
                <div><Label>Transport</Label>
                  <Select value={form.transport_mode} onValueChange={v => setForm({ ...form, transport_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="plane">Avion</SelectItem>
                      <SelectItem value="car">Voiture</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Hébergement</Label><Input value={form.accommodation} onChange={e => setForm({ ...form, accommodation: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button variant="secondary" onClick={() => doCreate(false)} disabled={create.isPending}>Enregistrer brouillon</Button>
              <Button onClick={() => doCreate(true)} disabled={create.isPending}><Send className="h-3.5 w-3.5 mr-1" /> Soumettre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approuvés ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Refusés ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune demande dans cette catégorie.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(t => {
            const meta = STATUS_META[t.status] ?? STATUS_META.pending;
            const Icon = meta.icon;
            const isOwn = t.user_id === user?.id;
            const canDecide = canApprove && ['submitted', 'pending'].includes(t.status) && !isOwn;
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{t.purpose}</h3>
                        <Badge variant="outline" className={meta.className}><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.destination}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t.start_date} → {t.end_date}</span>
                        {t.estimated_budget && <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />{t.estimated_budget} €</span>}
                        {t.transport_mode && <span>· {t.transport_mode}</span>}
                      </div>
                      {t.notes && <p className="text-sm text-muted-foreground mt-2">{t.notes}</p>}
                      <StatusStepper trip={t} />
                    </div>
                    <div className="flex gap-2 items-start">
                      {isOwn && t.status === 'draft' && (
                        <Button size="sm" onClick={() => submit.mutate(t.id)}><Send className="h-3.5 w-3.5 mr-1" /> Soumettre</Button>
                      )}
                      {canDecide && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setRejectDialog({ id: t.id })}>Refuser</Button>
                          <Button size="sm" onClick={() => approve.mutate({ id: t.id })}>Approuver</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={(o) => { if (!o) { setRejectDialog(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Motif du refus</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Précisez la raison du refus (obligatoire)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setReason(''); }}>Annuler</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!reason.trim() || reject.isPending}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
