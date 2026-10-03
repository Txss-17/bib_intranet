import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Loader2,
  Clock,
  Building2,
  ShieldAlert,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

interface ActivityAccount {
  id: string;
  company_name: string | null;
  last_order_date: string | null;
  risk_level: string | null;
  subscription_status: string | null;
}

interface ActivityEvent {
  id: string;
  action: string;
  user_name: string | null;
  resource: string | null;
  created_at: string;
}

interface ActivityData {
  accounts: ActivityAccount[];
  events: ActivityEvent[];
}

function useSupportActivityMonitoring() {
  return useQuery<ActivityData>({
    queryKey: ['support_activity_monitoring'],
    queryFn: async () => {
      const [accountsResult, eventsResult] = await Promise.all([
        supabase
          .from('user_accounts')
          .select(
            'id, company_name, last_order_date, risk_level, subscription_status',
          )
          .order('last_order_date', {
            ascending: false,
            nullsFirst: false,
          })
          .limit(20),

        supabase
          .from('audit_logs')
          .select(
            'id, action, user_name, resource, created_at',
          )
          .order('created_at', {
            ascending: false,
          })
          .limit(15),
      ]);

      if (accountsResult.error) {
        throw accountsResult.error;
      }

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      return {
        accounts: accountsResult.data ?? [],
        events: eventsResult.data ?? [],
      };
    },
  });
}

const getRiskVariant = (
  risk: string | null,
): 'destructive' | 'outline' => {
  return risk === 'critical' || risk === 'high'
    ? 'destructive'
    : 'outline';
};

const SupportMonitoring = () => {
  const { data, isLoading } =
    useSupportActivityMonitoring();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Activity className="h-8 w-8 text-primary" />
          Suivi clients
        </h1>

        <p className="mt-1 text-muted-foreground">
          Activité récente des comptes et événements utiles au suivi Support & Customer Success.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Building2 className="h-8 w-8 text-primary" />

            <div>
              <p className="text-2xl font-bold">
                {data?.accounts.length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Comptes observés
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-blue-500" />

            <div>
              <p className="text-2xl font-bold">
                {data?.events.length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Événements récents
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <ShieldAlert className="h-8 w-8 text-orange-500" />

            <div>
              <p className="text-2xl font-bold">
                {data?.accounts.filter(
                  (account) =>
                    account.risk_level === 'high' ||
                    account.risk_level === 'critical',
                ).length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Comptes à surveiller
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Derniers comptes actifs
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!data?.accounts.length ? (
              <p className="py-4 text-sm text-muted-foreground">
                Aucun compte récent.
              </p>
            ) : (
              <div className="space-y-2">
                {data.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.company_name || 'Compte sans société'}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Dernière commande :{' '}
                        {account.last_order_date
                          ? new Date(
                              account.last_order_date,
                            ).toLocaleDateString('fr-FR')
                          : '—'}
                      </p>
                    </div>

                    <Badge
                      variant={getRiskVariant(
                        account.risk_level,
                      )}
                    >
                      {account.risk_level || 'low'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Événements système
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!data?.events.length ? (
              <p className="py-4 text-sm text-muted-foreground">
                Aucun événement récent.
              </p>
            ) : (
              <div className="space-y-2">
                {data.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-3 border-b pb-2 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {event.action}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {event.user_name || 'Utilisateur système'}{' '}
                        · {event.resource || 'Ressource non renseignée'}
                      </p>
                    </div>

                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(
                        event.created_at,
                      ).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupportMonitoring;