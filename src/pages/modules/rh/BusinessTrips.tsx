import { useState } from 'react';
import { Plane, Plus, Calendar, MapPin, Wallet, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusinessTrips, useCreateBusinessTrip, useUpdateBusinessTrip } from '@/hooks/usePhase4';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

const statusMeta: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', icon: Clock },
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Refusé', color: 'bg-destructive/20 text-destructive', icon: XCircle },
  in_progress: { label: 'En cours', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400', icon: Plane },
  completed: { label: 'Terminé', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
};

export default function BusinessTrips() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const canApprove = isAdmin || isManager;
  const { data: trips = [], isLoading } = useBusinessTrips();
  const create = useCreateBusinessTrip();
  const update = useUpdateBusinessTrip();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    purpose: '', destination: '', start_date: '', end_date: '',
    estimated_budget: '', transport_mode: 'train', accommodation: '', notes: '',
  });

  const submit = () => {
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
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ purpose: '', destination: '', start_date: '', end_date: '', estimated_budget: '', transport_mode: 'train', accommodation: '', notes: '' });
      }
    });
  };

  const setStatus = (id: string, status: 'approved' | 'rejected') =>
    update.mutate({ id, patch: { status, approved_at: new Date().toISOString(), approved_by: user?.id ?? null } });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Plane className="h-7 w-7 text-primary" /> Déplacements professionnels</h1>
          <p className="text-muted-foreground mt-1">Demandes, validation manager et rapports de mission.</p>
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
              <div><Label>Hébergement</Label><Input value={form.accommodation} onChange={e => setForm({ ...form, accommodation: e.target.value })} placeholder="Hôtel Ibis" /></div>
              <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={create.isPending}>Soumettre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : trips.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucune demande de déplacement.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {trips.map(t => {
            const meta = statusMeta[t.status] ?? statusMeta.pending;
            const Icon = meta.icon;
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{t.purpose}</h3>
                        <Badge className={meta.color}><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.destination}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t.start_date} → {t.end_date}</span>
                        {t.estimated_budget && <span className="flex items-center gap-1"><Wallet className="h-3 w-3" />{t.estimated_budget} €</span>}
                        {t.transport_mode && <span>· {t.transport_mode}</span>}
                      </div>
                      {t.notes && <p className="text-sm text-muted-foreground mt-2">{t.notes}</p>}
                    </div>
                    {canApprove && t.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setStatus(t.id, 'rejected')}>Refuser</Button>
                        <Button size="sm" onClick={() => setStatus(t.id, 'approved')}>Approuver</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
