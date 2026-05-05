import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';

export default function GatewayValidation() {
  const { data: messages = [], updateStatus } = useGatewayMessages();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const pending = messages.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validation</h1>
        <p className="text-muted-foreground">Approuver ou rejeter les messages entrants</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{pending.length}</p><p className="text-xs text-muted-foreground">En attente</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{messages.filter(m => m.status === 'validated' || m.status === 'routed' || m.status === 'responded').length}</p><p className="text-xs text-muted-foreground">Validés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{messages.filter(m => m.status === 'archived').length}</p><p className="text-xs text-muted-foreground">Archivés</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Messages en attente de validation</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">Rien à valider.</p> :
            <div className="space-y-3">
              {pending.map(m => (
                <div key={m.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{m.subject}</p>
                      <p className="text-xs text-muted-foreground">{m.sender_name ? `${m.sender_name} · ` : ''}{m.sender_email}</p>
                    </div>
                    <Badge variant="destructive">Nouveau</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.content}</p>
                  <Textarea placeholder="Notes de validation (optionnel)" rows={2}
                    value={notes[m.id] || ''} onChange={e => setNotes({ ...notes, [m.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1 text-green-600"
                      onClick={() => updateStatus.mutate({ id: m.id, patch: { status: 'validated', validation_notes: notes[m.id] || null } })}>
                      <Check className="h-3 w-3" /> Approuver
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive"
                      onClick={() => updateStatus.mutate({ id: m.id, patch: { status: 'archived', validation_notes: notes[m.id] || 'Rejeté' } })}>
                      <X className="h-3 w-3" /> Rejeter
                    </Button>
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
