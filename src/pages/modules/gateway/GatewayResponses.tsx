import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Send, MessageSquareReply, CheckCheck, AlertTriangle, Clock, Ban } from 'lucide-react';
import { useGatewayMessages, GatewayMessage } from '@/hooks/useGatewayMessages';
import { useOutboundDelivery, DeliveryStatus } from '@/hooks/useOutboundDelivery';

const isOutbound = (s: string) => s?.startsWith('[Sortant]');

const deliveryConfig: Record<DeliveryStatus, { label: string; variant: any; icon: any; tone: string }> = {
  sent: { label: 'Livré', variant: 'default', icon: CheckCheck, tone: 'text-green-500' },
  pending: { label: 'En cours…', variant: 'secondary', icon: Clock, tone: 'text-muted-foreground' },
  bounced: { label: 'Bounce', variant: 'destructive', icon: AlertTriangle, tone: 'text-destructive' },
  failed: { label: 'Échec', variant: 'destructive', icon: AlertTriangle, tone: 'text-destructive' },
  dlq: { label: 'Échec', variant: 'destructive', icon: AlertTriangle, tone: 'text-destructive' },
  suppressed: { label: 'Bloqué (RGPD)', variant: 'outline', icon: Ban, tone: 'text-amber-500' },
  unknown: { label: '—', variant: 'outline', icon: Clock, tone: 'text-muted-foreground' },
};

const DeliveryBadge = ({ status, error }: { status: DeliveryStatus; error?: string | null }) => {
  const cfg = deliveryConfig[status] ?? deliveryConfig.unknown;
  const Icon = cfg.icon;
  return (
    <div className="flex flex-col items-end gap-1">
      <Badge variant={cfg.variant} className="gap-1">
        <Icon className="h-3 w-3" /> {cfg.label}
      </Badge>
      {error && <span className="text-xs text-destructive max-w-xs text-right">{error}</span>}
    </div>
  );
};

export default function GatewayResponses() {
  const { data: messages = [], sendReply } = useGatewayMessages();
  const { data: deliveries = [] } = useOutboundDelivery();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const toRespond = messages.filter(m => m.status === 'routed' && !isOutbound(m.subject));
  const replied = messages.filter(m => m.status === 'responded' && !isOutbound(m.subject));
  const outbound = messages.filter(m => isOutbound(m.subject));

  // Map: recipient_email → latest delivery status
  const deliveryMap = useMemo(() => {
    const m = new Map<string, { status: DeliveryStatus; error: string | null }>();
    for (const d of deliveries) {
      m.set(d.recipient_email.toLowerCase(), { status: d.status, error: d.error_message });
    }
    return m;
  }, [deliveries]);

  const getDelivery = (email: string) =>
    deliveryMap.get(email.toLowerCase()) ?? { status: 'unknown' as DeliveryStatus, error: null };

  const handleSend = async (m: GatewayMessage) => {
    const response = drafts[m.id]?.trim();
    if (!response) return;
    await sendReply.mutateAsync({ msg: m, response });
    setDrafts(d => ({ ...d, [m.id]: '' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réponses & Envois</h1>
        <p className="text-muted-foreground">Réponses aux entrants et historique des envois sortants — statut de livraison réel</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MessageSquareReply className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{toRespond.length}</p><p className="text-xs text-muted-foreground">À répondre</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{replied.length}</p><p className="text-xs text-muted-foreground">Réponses envoyées</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{outbound.length}</p><p className="text-xs text-muted-foreground">Envois sortants</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCheck className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-muted-foreground">Total</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="reply">
        <TabsList>
          <TabsTrigger value="reply">À répondre ({toRespond.length})</TabsTrigger>
          <TabsTrigger value="replied">Historique réponses ({replied.length})</TabsTrigger>
          <TabsTrigger value="outbound">Envois sortants ({outbound.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reply">
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
        </TabsContent>

        <TabsContent value="replied">
          <Card>
            <CardHeader><CardTitle>Historique des réponses</CardTitle></CardHeader>
            <CardContent>
              {replied.length === 0 ? <p className="text-sm text-muted-foreground">Aucune réponse envoyée.</p> :
                <div className="space-y-2">
                  {replied.map(m => {
                    const d = getDelivery(m.sender_email);
                    return (
                      <div key={m.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{m.subject}</p>
                            <p className="text-xs text-muted-foreground">→ {m.sender_email}</p>
                            <p className="text-xs mt-1 line-clamp-2">{m.response_content}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">{m.responded_at && new Date(m.responded_at).toLocaleString('fr-FR')}</span>
                            <DeliveryBadge status={d.status} error={d.error} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outbound">
          <Card>
            <CardHeader>
              <CardTitle>Envois sortants — Statut de livraison</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Les statuts <strong>Bounce</strong> ou <strong>Bloqué (RGPD)</strong> signifient que l'email <strong>n'est pas arrivé</strong> chez le destinataire (adresse invalide, désinscrit, ou plainte).
              </p>
            </CardHeader>
            <CardContent>
              {outbound.length === 0 ? <p className="text-sm text-muted-foreground">Aucun envoi sortant.</p> :
                <div className="space-y-2">
                  {outbound.map(m => {
                    const d = getDelivery(m.sender_email);
                    return (
                      <div key={m.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{m.subject.replace(/^\[Sortant\]\s*/, '')}</p>
                            <p className="text-xs text-muted-foreground">→ {m.sender_name ? `${m.sender_name} · ` : ''}{m.sender_email}</p>
                            <p className="text-xs mt-1 line-clamp-2">{m.content}</p>
                            {m.validation_notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.validation_notes}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString('fr-FR')}</span>
                            <DeliveryBadge status={d.status} error={d.error} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
