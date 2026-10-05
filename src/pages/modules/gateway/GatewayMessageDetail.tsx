import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Lock,
  Reply,
} from 'lucide-react';

import { useMessageRoutingLog } from '@/hooks/useMessageRoutingLog';
import { useUserRole } from '@/hooks/useUserRole';

export default function GatewayMessageDetail() {
  const { messageId } =
    useParams<{ messageId: string }>();

  const navigate = useNavigate();

  const { canViewSensitive } =
    useUserRole();

  const { data: message } = useQuery({
    queryKey: ['gateway-message', messageId],
    enabled: !!messageId,

    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('external_messages')
        .select('*')
        .eq('id', messageId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const { data: log = [] } =
    useMessageRoutingLog(messageId);

  const cc =
    message?.validation_notes?.match(
      /Cc:\s*([^|]+)/i,
    )?.[1]?.trim();

  const bcc =
    message?.validation_notes?.match(
      /Cci:\s*([^|]+)/i,
    )?.[1]?.trim();

  const handleReply = () => {
    if (!message) {
      return;
    }

    navigate('/modules/gateway/compose', {
      state: {
        mode: 'reply',
        message,
      },
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          asChild
        >
          <Link to="/modules/gateway/inbox">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Boîte de réception
          </Link>
        </Button>

        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Mail className="h-6 w-6 text-primary" />
          Détail message
        </h1>
      </div>

      {!message ? (
        <p className="text-sm text-muted-foreground">
          Chargement…
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <CardTitle className="text-base">
                  {message.subject}
                </CardTitle>

                {!message.subject?.startsWith('[Sortant]') && (
                  <Button
                    onClick={handleReply}
                    className="gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    Répondre
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Expéditeur
                  </p>

                  <p className="font-medium">
                    {message.sender_name || '—'}
                  </p>

                  <p className="text-muted-foreground">
                    {message.sender_email}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Statut
                  </p>

                  <Badge variant="secondary">
                    {message.status}
                  </Badge>

                  {message.routed_to_pole && (
                    <Badge
                      variant="outline"
                      className="ml-2"
                    >
                      → {message.routed_to_pole}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase text-muted-foreground">
                  Contenu
                </p>

                <p className="whitespace-pre-wrap rounded-md bg-muted/30 p-3">
                  {message.content}
                </p>
              </div>

              {(cc || bcc) && (
                <div>
                  <p className="mb-1 text-xs uppercase text-muted-foreground">
                    Listes de diffusion
                  </p>

                  {canViewSensitive ? (
                    <div className="space-y-1">
                      {cc && (
                        <p>
                          <span className="font-medium">
                            Cc:
                          </span>{' '}
                          {cc}
                        </p>
                      )}

                      {bcc && (
                        <p>
                          <span className="font-medium">
                            Cci:
                          </span>{' '}
                          {bcc}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Restreint (rôle insuffisant)
                    </p>
                  )}
                </div>
              )}

              {message.validated_by && (
                <p className="text-xs text-muted-foreground">
                  Validé par {message.validated_by}
                </p>
              )}

              {message.response_content && (
                <div>
                  <p className="mb-1 text-xs uppercase text-muted-foreground">
                    Réponse envoyée
                  </p>

                  <p className="whitespace-pre-wrap rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                    {message.response_content}
                  </p>

                  {message.responded_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(
                        message.responded_at,
                      ).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4" />
                Chaîne validation → routage → envoi → réponse
              </CardTitle>
            </CardHeader>

            <CardContent>
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun événement enregistré.
                </p>
              ) : (
                <ol className="relative ml-3 space-y-4 border-l border-border">
                  {[...log].reverse().map((e) => {
                    const performer = (e as any)
                      .performer
                      ? `${(e as any).performer.first_name ?? ''} ${
                          (e as any).performer.last_name ?? ''
                        }`.trim() ||
                        (e as any).performer.email
                      : 'Système';

                    let notes = e.notes;

                    if (!canViewSensitive && notes) {
                      notes = notes
                        .replace(
                          /Cc:\s*[^|]+/gi,
                          'Cc: [restreint]',
                        )
                        .replace(
                          /Cci:\s*[^|]+/gi,
                          'Cci: [restreint]',
                        );
                    }

                    return (
                      <li
                        key={e.id}
                        className="ml-4"
                      >
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {e.action}
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              e.created_at,
                            ).toLocaleString('fr-FR')}
                          </span>
                        </div>

                        <p className="mt-1 text-sm">
                          {performer}
                        </p>

                        {notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {notes}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Conformité RGPD
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {canViewSensitive ? (
                <>
                  <p>
                    • Base légale : Art. 6.1.b/f RGPD
                    (relation contractuelle / intérêt légitime).
                  </p>

                  <p>
                    • Conservation : 36 mois après dernier échange.
                  </p>

                  <p>
                    • Hébergement UE — aucun transfert hors UE.
                  </p>

                  <p>
                    • DPO : dpo@brand-in-a-box.space
                  </p>
                </>
              ) : (
                <p className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Informations RGPD détaillées réservées aux
                  rôles autorisés.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
