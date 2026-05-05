import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquareReply, CheckCheck } from 'lucide-react';
import { useGatewayMessages, GatewayMessage } from '@/hooks/useGatewayMessages';

export default function GatewayResponses() {
  const { data: messages = [], sendReply } = useGatewayMessages();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const toRespond = messages.filter(m => m.status === 'routed');
  const responded = messages.filter(m => m.status === 'responded');

  const handleSend = async (m: GatewayMessage) => {
    const response = drafts[m.id]?.trim();
    if (!response) return;
    await sendReply.mutateAsync({ msg: m, response });
    setDrafts(d => ({ ...d, [m.id]: '' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réponses</h1>
        <p className="text-muted-foreground">Rédiger et envoyer les réponses aux expéditeurs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MessageSquareReply className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{toRespond.length}</p><p className="text-xs text-muted-foreground">À répondre</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{responded.length}</p><p className="text-xs text-muted-foreground">Envoyés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCheck className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Messages à traiter</CardTitle></CardHeader>
        <CardContent>
          {toRespond.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message routé en attente.</p> :
            <div className="space-y-4">
              {toRespond.map(m => (
                <div key={m.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{m.subject}</p>
                      <p className="text-xs text-muted-foreground">{m.sender_name ? `${m.sender_name} · ` : ''}{m.sender_email}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">« {m.content} »</p>
                    </div>
                    <Badge variant="outline">{m.routed_to_pole}</Badge>
                  </div>
                  <Textarea placeholder="Rédiger la réponse…" rows={4}
                    value={drafts[m.id] || ''} onChange={e => setDrafts({ ...drafts, [m.id]: e.target.value })} />
                  <Button size="sm" className="gap-2" onClick={() => handleSend(m)}
                    disabled={!drafts[m.id]?.trim() || sendReply.isPending}>
                    <Send className="h-3 w-3" /> Envoyer la réponse
                  </Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique des réponses</CardTitle></CardHeader>
        <CardContent>
          {responded.length === 0 ? <p className="text-sm text-muted-foreground">Aucune réponse envoyée.</p> :
            <div className="space-y-2">
              {responded.map(m => (
                <div key={m.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{m.subject}</p>
                    <span className="text-xs text-muted-foreground">{m.responded_at && new Date(m.responded_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">→ {m.sender_email}</p>
                  <p className="text-xs mt-1 line-clamp-2">{m.response_content}</p>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
