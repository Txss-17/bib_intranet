import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';
import { useGatewayMessages } from '@/hooks/useGatewayMessages';

const POLES = ['direction','finance','ops','tech','rh','supplier','audit','compliance','rse','marketing','risk','lifecycle'] as const;

export default function GatewayRouting() {
  const { data: messages = [], updateStatus } = useGatewayMessages();
  const [selectedPole, setSelectedPole] = useState<Record<string, string>>({});
  const validated = messages.filter(m => m.status === 'validated');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Routage</h1>
        <p className="text-muted-foreground">Attribuer les messages validés aux pôles</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ArrowRightLeft className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{validated.length}</p><p className="text-xs text-muted-foreground">À router</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{messages.filter(m => m.status === 'routed').length}</p><p className="text-xs text-muted-foreground">Routés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{messages.filter(m => m.status === 'responded').length}</p><p className="text-xs text-muted-foreground">Traités</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Messages validés en attente de routage</CardTitle></CardHeader>
        <CardContent>
          {validated.length === 0 ? <p className="text-sm text-muted-foreground">Aucun message à router.</p> :
            <div className="space-y-3">
              {validated.map(m => (
                <div key={m.id} className="p-3 border border-border rounded-lg flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{m.subject}</p>
                    <p className="text-xs text-muted-foreground">{m.sender_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedPole[m.id] || ''} onValueChange={v => setSelectedPole({ ...selectedPole, [m.id]: v })}>
                      <SelectTrigger className="w-[160px]"><SelectValue placeholder="Choisir un pôle" /></SelectTrigger>
                      <SelectContent>{POLES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" disabled={!selectedPole[m.id]}
                      onClick={() => updateStatus.mutate({ id: m.id, patch: { status: 'routed', routed_to_pole: selectedPole[m.id] as any } })}>
                      Router
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Déjà routés</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {messages.filter(m => m.status === 'routed').map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 border border-border rounded">
                <span className="text-sm truncate">{m.subject}</span>
                <Badge variant="outline">{m.routed_to_pole}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
