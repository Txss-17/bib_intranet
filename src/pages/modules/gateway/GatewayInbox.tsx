import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Inbox,
  Mail,
  MailOpen,
  Clock,
  Send,
  ArrowRight,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  useGatewayMessages,
} from '@/hooks/useGatewayMessages';

const statusLabel: Record<string, string> = {
  pending: 'Nouveau',
  validated: 'Validé',
  routed: 'Routé',
  responded: 'Répondu',
  archived: 'Archivé',
};

const statusVariant: Record<string, any> = {
  pending: 'destructive',
  validated: 'secondary',
  routed: 'default',
  responded: 'outline',
  archived: 'outline',
};

const isOutbound = (s: string) =>
  s?.startsWith('[Sortant]');

export default function GatewayInbox() {
  const {
    data: allMessages = [],
    isLoading,
  } = useGatewayMessages();

  // La boîte de réception contient uniquement les messages entrants.
  // Les messages sortants restent accessibles dans Gateway → Réponses.
  const messages = allMessages.filter(
    (m) => !isOutbound(m.subject),
  );

  const newCount = messages.filter(
    (m) => m.status === 'pending',
  ).length;

  const validatedCount = messages.filter(
    (m) => m.status === 'validated',
  ).length;

  const respondedCount = messages.filter(
    (m) => m.status === 'responded',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Réception
          </h1>

          <p className="text-muted-foreground">
            Messages entrants — temps réel
          </p>
        </div>

        <Button asChild className="gap-2">
          <Link to="/modules/gateway/compose">
            <Send className="h-4 w-4" />
            Nouveau message
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-8 w-8 text-primary" />

              <div>
                <p className="text-2xl font-bold">
                  {messages.length}
                </p>

                <p className="text-xs text-muted-foreground">
                  Total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-destructive" />

              <div>
                <p className="text-2xl font-bold">
                  {newCount}
                </p>

                <p className="text-xs text-muted-foreground">
                  À valider
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MailOpen className="h-8 w-8 text-muted-foreground" />

              <div>
                <p className="text-2xl font-bold">
                  {validatedCount}
                </p>

                <p className="text-xs text-muted-foreground">
                  Validés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-500" />

              <div>
                <p className="text-2xl font-bold">
                  {respondedCount}
                </p>

                <p className="text-xs text-muted-foreground">
                  Répondus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Boîte de réception
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun message pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => (
                <Link
                  key={m.id}
                  to={`/modules/gateway/message/${m.id}`}
                  className="group flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {m.subject}
                      </span>

                      <Badge
                        variant={
                          statusVariant[m.status] ??
                          'outline'
                        }
                      >
                        {statusLabel[m.status] ??
                          m.status}
                      </Badge>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.sender_name
                        ? `${m.sender_name} · `
                        : ''}
                      {m.sender_email} ·{' '}
                      {new Date(
                        m.created_at,
                      ).toLocaleString('fr-FR')}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.content}
                    </p>
                  </div>

                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
