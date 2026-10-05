import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  ShieldCheck,
  Filter,
  Lock,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMessageRoutingLog } from '@/hooks/useMessageRoutingLog';
import { useUserRole } from '@/hooks/useUserRole';
import { ExportButtons } from '@/components/ExportButtons';
import { supabase } from '@/integrations/supabase/client';

const actionColor = (action: string) => {
  if (action.startsWith('outbound')) {
    return 'bg-primary/10 text-primary';
  }

  if (action.startsWith('reply')) {
    return 'bg-emerald-500/10 text-emerald-600';
  }

  if (
    action.includes('validated') ||
    action.includes('approval')
  ) {
    return 'bg-yellow-500/10 text-yellow-700';
  }

  if (
    action.includes('routed') ||
    action.includes('assigned')
  ) {
    return 'bg-blue-500/10 text-blue-600';
  }

  if (
    action.includes('archived') ||
    action.includes('failed')
  ) {
    return 'bg-destructive/10 text-destructive';
  }

  if (
    action.includes('received') ||
    action.includes('inbound')
  ) {
    return 'bg-violet-500/10 text-violet-600';
  }

  return 'bg-muted text-muted-foreground';
};

const actionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'message:received': 'Réception',
    'message:routed': 'Attribution',
    'message:assigned': 'Attribution',
    'message:reassigned': 'Réattribution',
    'reply:sent': 'Réponse envoyée',
    'reply:failed': 'Réponse échouée',
    'outbound:sent': 'Envoi sortant',
    'outbound:failed': 'Envoi échoué',
    'message:archived': 'Archivage',
    'message:validated': 'Validation',
    'approval:requested': 'Approbation demandée',
    'approval:approved': 'Approbation accordée',
    'approval:rejected': 'Approbation refusée',
  };

  return labels[action] ?? action;
};

const sanitizeNotes = (
  notes: string | null,
) => {
  if (!notes) {
    return notes;
  }

  return notes
    .replace(
      /Cc:\s*[^|]+/gi,
      'Cc: [restreint]',
    )
    .replace(
      /Cci:\s*[^|]+/gi,
      'Cci: [restreint]',
    );
};

export default function GatewayJournal() {
  const {
    data: entries = [],
    isLoading,
  } = useMessageRoutingLog();

  const {
    canViewSensitive,
    canExportAudit,
    isLoading: rolesLoading,
  } = useUserRole();

  const [period, setPeriod] =
    useState<
      'all' | '24h' | '7d' | '30d'
    >('all');

  const [actionFilter, setActionFilter] =
    useState<string>('all');

  const [sender, setSender] =
    useState('');

  const [recipient, setRecipient] =
    useState('');

  const filtered = useMemo(() => {
    const now = Date.now();

    const cutoff: Record<
      string,
      number
    > = {
      '24h': now - 86400000,
      '7d': now - 7 * 86400000,
      '30d': now - 30 * 86400000,
    };

    return entries.filter((entry) => {
      if (
        period !== 'all' &&
        new Date(entry.created_at).getTime() <
          cutoff[period]
      ) {
        return false;
      }

      if (
        actionFilter !== 'all' &&
        !entry.action.startsWith(
          actionFilter,
        )
      ) {
        return false;
      }

      const performer = (
        entry as any
      ).performer
        ? `${(entry as any).performer.first_name ?? ''} ${
            (entry as any).performer.last_name ?? ''
          } ${(entry as any).performer.email ?? ''}`.toLowerCase()
        : '';

      if (
        sender &&
        !performer.includes(
          sender.toLowerCase(),
        )
      ) {
        return false;
      }

      if (recipient) {
        const message =
          (entry as any).message;

        const haystack = `
          ${message?.sender_email ?? ''}
          ${message?.subject ?? ''}
          ${entry.notes ?? ''}
        `.toLowerCase();

        if (
          !haystack.includes(
            recipient.toLowerCase(),
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    entries,
    period,
    actionFilter,
    sender,
    recipient,
  ]);

  const exportData = filtered.map(
    (entry) => {
      const performer = (
        entry as any
      ).performer
        ? `${(entry as any).performer.first_name ?? ''} ${
            (entry as any).performer.last_name ?? ''
          }`.trim() ||
          (entry as any).performer.email
        : 'Système';

      const message =
        (entry as any).message;

      return {
        date: new Date(
          entry.created_at,
        ).toLocaleString('fr-FR'),

        action:
          actionLabel(entry.action),

        from_status:
          entry.from_status ?? '',

        to_status:
          entry.to_status ?? '',

        performer,

        subject:
          message?.subject ?? '',

        target:
          message?.sender_email ?? '',

        notes: canViewSensitive
          ? entry.notes ?? ''
          : sanitizeNotes(
              entry.notes,
            ) ?? '',
      };
    },
  );

  const handleExportTrace =
    async () => {
      try {
        const { data: user } =
          await supabase.auth.getUser();

        await (
          supabase as any
        )
          .from('audit_logs')
          .insert({
            action:
              'export:gateway_journal',

            resource:
              'message_routing_log',

            user_id:
              user.user?.id ?? null,

            user_name:
              user.user?.email ??
              'unknown',

            details: {
              count:
                filtered.length,

              period,

              actionFilter,

              sender,

              recipient,
            },
          });
      } catch {
        // Le journal d'export ne doit pas
        // bloquer l'export utilisateur.
      }
    };

  if (
    !rolesLoading &&
    !canViewSensitive
  ) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="enterprise-card p-12 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-semibold">
            Accès restreint
          </h2>

          <p className="text-sm text-muted-foreground">
            Le journal de traçabilité
            est réservé aux rôles
            autorisés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ---------------------------------------------------------------- */}
      {/* HEADER                                                           */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-primary" />

            Journal de traçabilité
          </h1>

          <p className="mt-1 text-muted-foreground">
            Historique des communications
            Gateway : réception, attribution,
            traitement, approbation, réponse
            et envoi.
          </p>
        </div>

        {canExportAudit && (
          <div
            onClick={
              handleExportTrace
            }
          >
            <ExportButtons
              filename={`gateway-journal-${new Date()
                .toISOString()
                .slice(0, 10)}`}
              title="Journal de traçabilité Gateway"
              poleName="B.I.B Intranet"
              columns={[
                {
                  header: 'Date',
                  accessor: 'date',
                },
                {
                  header: 'Action',
                  accessor: 'action',
                },
                {
                  header: 'De',
                  accessor: 'from_status',
                },
                {
                  header: 'Vers',
                  accessor: 'to_status',
                },
                {
                  header: 'Acteur',
                  accessor: 'performer',
                },
                {
                  header: 'Sujet',
                  accessor: 'subject',
                },
                {
                  header: 'Cible',
                  accessor: 'target',
                },
                {
                  header: 'Notes',
                  accessor: 'notes',
                },
              ]}
              data={exportData}
            />
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* PRINCIPLE                                                         */}
      {/* ---------------------------------------------------------------- */}

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Principe de fonctionnement
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Le Gateway trace les opérations
              réalisées sur les communications
              externes. Une validation n'est
              enregistrée que lorsqu'une
              approbation spécifique est
              réellement requise.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* FILTERS                                                          */}
      {/* ---------------------------------------------------------------- */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />

            Filtres
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Select
            value={period}
            onValueChange={(
              value: any,
            ) =>
              setPeriod(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Période" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Toutes périodes
              </SelectItem>

              <SelectItem value="24h">
                Dernières 24h
              </SelectItem>

              <SelectItem value="7d">
                7 jours
              </SelectItem>

              <SelectItem value="30d">
                30 jours
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={actionFilter}
            onValueChange={
              setActionFilter
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Action" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                Toutes actions
              </SelectItem>

              <SelectItem value="message">
                Réception / traitement
              </SelectItem>

              <SelectItem value="reply">
                Réponses
              </SelectItem>

              <SelectItem value="outbound">
                Envois sortants
              </SelectItem>

              <SelectItem value="approval">
                Approbations
              </SelectItem>

              <SelectItem value="status">
                Statuts
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Acteur interne"
            value={sender}
            onChange={(event) =>
              setSender(
                event.target.value,
              )
            }
          />

          <Input
            placeholder="Email ou sujet"
            value={recipient}
            onChange={(event) =>
              setRecipient(
                event.target.value,
              )
            }
          />
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* EVENTS                                                           */}
      {/* ---------------------------------------------------------------- */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />

            Événements (
            {filtered.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ScrollText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                Aucun événement
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Aucun événement ne
                correspond aux filtres
                sélectionnés.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(
                (entry) => {
                  const performer = (
                    entry as any
                  ).performer
                    ? `${(entry as any).performer.first_name ?? ''} ${
                        (entry as any).performer.last_name ?? ''
                      }`.trim() ||
                      (entry as any)
                        .performer
                        .email
                    : 'Système';

                  const message =
                    (entry as any)
                      .message;

                  const displayedNotes =
                    canViewSensitive
                      ? entry.notes
                      : sanitizeNotes(
                          entry.notes,
                        );

                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={actionColor(
                                entry.action,
                              )}
                              variant="secondary"
                            >
                              {actionLabel(
                                entry.action,
                              )}
                            </Badge>

                            {entry.from_status &&
                              entry.to_status && (
                                <span className="text-xs text-muted-foreground">
                                  {
                                    entry.from_status
                                  }{' '}
                                  →
                                  {
                                    entry.to_status
                                  }
                                </span>
                              )}

                            {!entry.from_status &&
                              entry.to_status && (
                                <span className="text-xs text-muted-foreground">
                                  →
                                  {
                                    entry.to_status
                                  }
                                </span>
                              )}

                            {entry.message_id && (
                              <Link
                                to={`/modules/gateway/message/${entry.message_id}`}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Eye className="h-3 w-3" />
                                Détail
                              </Link>
                            )}
                          </div>

                          {message?.subject && (
                            <p className="mt-1.5 truncate text-sm font-medium">
                              {message.subject}
                            </p>
                          )}

                          {message?.sender_email && (
                            <p className="text-xs text-muted-foreground">
                              {message.sender_email}
                            </p>
                          )}

                          {displayedNotes && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {displayedNotes}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium">
                            {performer}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              entry.created_at,
                            ).toLocaleString(
                              'fr-FR',
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
