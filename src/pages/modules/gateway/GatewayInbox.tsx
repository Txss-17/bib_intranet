import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox, Mail, MailOpen, Clock, Plus, Send } from 'lucide-react';
import { useGatewayMessages, GatewayMessage } from '@/hooks/useGatewayMessages';

const statusLabel: Record<string, string> = {
  pending: 'Nouveau', validated: 'Validé', routed: 'Routé', responded: 'Répondu', archived: 'Archivé',
};
const statusVariant: Record<string, any> = {
  pending: 'destructive', validated: 'secondary', routed: 'default', responded: 'outline', archived: 'outline',
};

export default function GatewayInbox() {
  const { data: messages = [], isLoading, createMessage } = useGatewayMessages();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sender_email: '', sender_name: '', subject: '', content: '' });

  const newCount = messages.filter(m => m.status === 'pending').length;
  const validatedCount = messages.filter(m => m.status === 'validated').length;
  const respondedCount = messages.filter(m => m.status === 'responded').length;

  const handleCreate = async () => {
    await createMessage.mutateAsync(form);
    setForm({ sender_email: '', sender_name: '', subject: '', content: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Réception</h1>
          <p className="text-muted-foreground">Messages entrants — temps réel</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nouveau message</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Saisir un message entrant</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email expéditeur *</Label><Input type="email" value={form.sender_email} onChange={e => setForm({ ...form, sender_email: e.target.value })} /></div>
                <div><Label>Nom expéditeur</Label><Input value={form.sender_name} onChange={e => setForm({ ...form, sender_name: e.target.value })} /></div>
              </div>
              <div><Label>Objet *</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              <div><Label>Contenu *</Label><Textarea rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={!form.sender_email || !form.subject || !form.content || createMessage.isPending}>
                Enregistrer & accuser réception
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Inbox className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{newCount}</p><p className="text-xs text-muted-foreground">À valider</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MailOpen className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{validatedCount}</p><p className="text-xs text-muted-foreground">Validés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{respondedCount}</p><p className="text-xs text-muted-foreground">Répondus</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Boîte de réception</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> :
            messages.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message. Cliquez « Nouveau message » pour saisir un message entrant.</p> :
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className="flex items-start justify-between gap-3 p-3 border border-border rounded-lg hover:bg-muted/40">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{m.subject}</span>
                      <Badge variant={statusVariant[m.status]}>{statusLabel[m.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.sender_name ? `${m.sender_name} · ` : ''}{m.sender_email} · {new Date(m.created_at).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
