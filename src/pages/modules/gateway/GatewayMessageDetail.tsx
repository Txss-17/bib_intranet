import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, ShieldCheck, Lock } from 'lucide-react';
import { useMessageRoutingLog } from '@/hooks/useMessageRoutingLog';
import { useUserRole } from '@/hooks/useUserRole';

export default function GatewayMessageDetail() {
  const { messageId } = useParams<{ messageId: string }>();
  const { canViewSensitive } = useUserRole();

  const { data: message } = useQuery({
    queryKey: ['gateway-message', messageId],
    enabled: !!messageId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('external_messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: log = [] } = useMessageRoutingLog(messageId);

  const cc = message?.validation_notes?.match(/Cc:\s*([^|]+)/i)?.[1]?.trim();
  const bcc = message?.validation_notes?.match(/Cci:\s*([^|]+)/i)?.[1]?.trim();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/modules/gateway/journal"><ArrowLeft className="h-4 w-4 mr-1" /> Journal</Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Détail message
        </h1>
      </div>

      {!message ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{message.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Expéditeur</p>
                  <p className="font-medium">{message.sender_name || '—'}</p>
                  <p className="text-muted-foreground">{message.sender_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Statut</p>
                  <Badge variant="secondary">{message.status}</Badge>
                  {message.routed_to_pole && (
                    <Badge variant="outline" className="ml-2">→ {message.routed_to_pole}</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">Contenu</p>
                <p className="whitespace-pre-wrap p-3 bg-muted/30 rounded-md">{message.content}</p>
              </div>

              {(cc || bcc) && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Listes de diffusion</p>
                  {canViewSensitive ? (
                    <div className="space-y-1">
                      {cc && <p><span className="font-medium">Cc:</span> {cc}</p>}
                      {bcc && <p><span className="font-medium">Cci:</span> {bcc}</p>}
                    </div>
                  ) : (
                    <p className="text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Restreint (rôle insuffisant)</p>
                  )}
                </div>
              )}

              {message.validated_by && (
                <p className="text-xs text-muted-foreground">Validé par {message.validated_by}</p>
              )}

              {message.response_content && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Réponse envoyée</p>
                  <p className="whitespace-pre-wrap p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md">{message.response_content}</p>
                  {message.responded_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.responded_at).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" /> Chaîne validation → routage → envoi → réponse
              </CardTitle>
            </CardHeader>
            <CardContent>
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {[...log].reverse().map(e => {
                    const performer = (e as any).performer
                      ? `${(e as any).performer.first_name ?? ''} ${(e as any).performer.last_name ?? ''}`.trim() || (e as any).performer.email
                      : 'Système';
                    let notes = e.notes;
                    if (!canViewSensitive && notes) {
                      notes = notes.replace(/Cc:\s*[^|]+/gi, 'Cc: [restreint]').replace(/Cci:\s*[^|]+/gi, 'Cci: [restreint]');
                    }
                    return (
                      <li key={e.id} className="ml-4">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{e.action}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-sm mt-1">{performer}</p>
                        {notes && <p className="text-xs text-muted-foreground mt-0.5">{notes}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conformité RGPD</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              {canViewSensitive ? (
                <>
                  <p>• Base légale : Art. 6.1.b/f RGPD (relation contractuelle / intérêt légitime).</p>
                  <p>• Conservation : 36 mois après dernier échange.</p>
                  <p>• Hébergement UE — aucun transfert hors UE.</p>
                  <p>• DPO : dpo@brand-in-a-box.space</p>
                </>
              ) : (
                <p className="flex items-center gap-1"><Lock className="h-3 w-3" /> Informations RGPD détaillées réservées aux rôles autorisés.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
