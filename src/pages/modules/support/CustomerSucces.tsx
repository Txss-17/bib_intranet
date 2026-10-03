import { useMemo, useState } from 'react';
import {
  Building2,
  Search,
  Users,
  AlertTriangle,
  CreditCard,
  Activity,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
  useUserAccounts,
  useUserAccountStats,
} from '@/hooks/useLifecycle';

import type { Database } from '@/integrations/supabase/types';

type UserAccount = Database['public']['Tables']['user_accounts']['Row'];

const CustomerSuccess = () => {
  const [search, setSearch] = useState('');

  const {
    data: accounts = [],
    isLoading,
  } = useUserAccounts({
    limit: 50,
  });

  const { data: stats } = useUserAccountStats();

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    if (!normalizedSearch) {
      return accounts;
    }

    return accounts.filter((account: UserAccount) => {
      const company = account.company_name?.toLowerCase() ?? '';
      const email = account.contact_email?.toLowerCase() ?? '';

      return (
        company.includes(normalizedSearch) ||
        email.includes(normalizedSearch)
      );
    });
  }, [accounts, search]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Users className="h-8 w-8 text-primary" />
          Customer Success
        </h1>

        <p className="mt-1 text-muted-foreground">
          Accompagnement des clients, santé des comptes et suivi des situations à risque.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Building2 className="h-8 w-8 text-primary" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.totalUsers ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Comptes suivis
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Activity className="h-8 w-8 text-emerald-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.activeUsers ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Comptes actifs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.atRiskUsers ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Comptes à risque
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CreditCard className="h-8 w-8 text-destructive" />

            <div>
              <p className="text-2xl font-bold">
                {stats?.unpaidUsers ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Paiements en retard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portefeuille clients</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Rechercher une société ou un contact..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
            />
          </div>

          {filteredAccounts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun compte correspondant.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account: UserAccount) => {
                const risk =
                  account.risk_level === 'critical'
                    ? 'Critique'
                    : account.risk_level === 'high'
                      ? 'Élevé'
                      : account.risk_level === 'medium'
                        ? 'Moyen'
                        : 'Faible';

                const riskVariant =
                  account.risk_level === 'critical' ||
                  account.risk_level === 'high'
                    ? 'destructive'
                    : 'outline';

                return (
                  <div
                    key={account.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {account.company_name || 'Compte sans société'}
                      </p>

                      <p className="truncate text-sm text-muted-foreground">
                        {account.contact_email || 'Contact non renseigné'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {account.subscription_status || 'Inconnu'}
                      </Badge>

                      <Badge variant={riskVariant}>
                        Risque {risk}
                      </Badge>

                      {account.payment_status === 'overdue' && (
                        <Badge variant="destructive">
                          Paiement en retard
                        </Badge>
                      )}
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
};

export default CustomerSuccess;