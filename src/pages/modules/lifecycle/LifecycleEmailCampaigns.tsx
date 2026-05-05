import React, { useState } from 'react';
import { Mail, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useLifecycleEmailCampaigns, useCreateEmailCampaign } from '@/hooks/useNewModules';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const Page = () => {
  const { data, isLoading } = useLifecycleEmailCampaigns();
  const create = useCreateEmailCampaign();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', audience: '', body: '' });

  const submit = async () => {
    try {
      await create.mutateAsync({ ...form, status: 'draft' });
      toast.success('Campagne créée');
      setOpen(false);
      setForm({ name: '', subject: '', audience: '', body: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Mail className="h-8 w-8" /> Campagnes email</h1>
          <p className="text-muted-foreground mt-1">Campagnes Lifecycle ciblées</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouvelle campagne</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer une campagne email</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom interne</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Objet</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>Audience</Label><Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} placeholder="ex: clients_inactifs_30j" /></div>
              <div><Label>Corps du message</Label><Textarea rows={5} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={!form.name || create.isPending}>Enregistrer brouillon</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Card>
          <CardHeader><CardTitle>Campagnes ({data?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data ?? []).map((c: any) => (
              <div key={c.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{c.name}</span><Badge variant="outline">{c.status}</Badge></div>
                  <p className="text-sm text-muted-foreground">{c.subject} — {c.audience}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Envois: {c.sent_count ?? 0}</div>
                  <div>Ouverture: {c.open_rate ?? 0}%</div>
                </div>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucune campagne</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function LifecycleEmailCampaignsPage() {
  return <ProtectedScreen screenId="lifecycle.email-campaigns"><Page /></ProtectedScreen>;
}
