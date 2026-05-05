import React, { useState } from 'react';
import { ShieldAlert, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLifecycleRiskAlerts, useCreateRiskAlert } from '@/hooks/useNewModules';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const sevColor = (s: string) =>
  s === 'critical' ? 'bg-destructive text-destructive-foreground'
  : s === 'high' ? 'bg-orange-500 text-white'
  : s === 'medium' ? 'bg-yellow-500 text-black'
  : 'bg-muted';

const ManagedRiskAlerts = () => {
  const { data, isLoading } = useLifecycleRiskAlerts();
  const create = useCreateRiskAlert();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'inactivity', severity: 'medium', company: '' });

  const submit = async () => {
    try {
      await create.mutateAsync(form);
      toast.success('Alerte créée');
      setOpen(false);
      setForm({ title: '', description: '', type: 'inactivity', severity: 'medium', company: '' });
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><ShieldAlert className="h-8 w-8 text-destructive" /> Alertes risque</h1>
          <p className="text-muted-foreground mt-1">Suivi manuel et automatique des alertes Lifecycle</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouvelle alerte</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Déclarer une alerte risque</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Titre</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Société</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Paiement</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="inactivity">Inactivité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Sévérité</Label>
                  <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={!form.title || create.isPending}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Card>
          <CardHeader><CardTitle>Alertes actives ({data?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data ?? []).map((a: any) => (
              <div key={a.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    <Badge className={sevColor(a.severity)}>{a.severity}</Badge>
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.company} — {a.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucune alerte</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function ManagedRiskAlertsPage() {
  return <ProtectedScreen screenId="lifecycle.risk-alerts"><ManagedRiskAlerts /></ProtectedScreen>;
}
