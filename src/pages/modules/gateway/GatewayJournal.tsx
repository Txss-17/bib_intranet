import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText, ShieldCheck } from 'lucide-react';
import { useMessageRoutingLog } from '@/hooks/useMessageRoutingLog';

const actionColor = (a: string) => {
  if (a.startsWith('outbound')) return 'bg-primary/10 text-primary';
  if (a.startsWith('reply')) return 'bg-emerald-500/10 text-emerald-600';
  if (a.includes('validated')) return 'bg-yellow-500/10 text-yellow-700';
  if (a.includes('routed')) return 'bg-blue-500/10 text-blue-600';
  if (a.includes('archived')) return 'bg-destructive/10 text-destructive';
  return 'bg-muted text-muted-foreground';
};

export default function GatewayJournal() {
  const { data: entries = [], isLoading } = useMessageRoutingLog();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Journal de traçabilité
        </h1>
        <p className="text-muted-foreground">
          Historique complet — validation, routage, envoi, réponse. Accessible aux rôles autorisés.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Événements ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <div className="space-y-2">
              {entries.map(e => {
                const performer = (e as any).performer
                  ? `${(e as any).performer.first_name ?? ''} ${(e as any).performer.last_name ?? ''}`.trim() || (e as any).performer.email
                  : 'Système';
                const msg = (e as any).message;
                return (
                  <div key={e.id} className="p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={actionColor(e.action)} variant="secondary">{e.action}</Badge>
                          {e.from_status && e.to_status && (
                            <span className="text-xs text-muted-foreground">{e.from_status} → {e.to_status}</span>
                          )}
                          {!e.from_status && e.to_status && (
                            <span className="text-xs text-muted-foreground">→ {e.to_status}</span>
                          )}
                        </div>
                        {msg?.subject && (
                          <p className="text-sm font-medium mt-1.5 truncate">{msg.subject}</p>
                        )}
                        {msg?.sender_email && (
                          <p className="text-xs text-muted-foreground">{msg.sender_email}</p>
                        )}
                        {e.notes && <p className="text-xs text-muted-foreground mt-1.5">{e.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium">{performer}</p>
                        <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
