import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PersonalPortfolioDetails } from './PersonalPortfolioDetails';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * After login, display portfolios belonging to the authenticated collaborator.
 * All queries are constrained by auth.user.id and the database RLS remains the
 * authority. Never read all staff assignments and filter on the client.
 */
type OwnPortfolio = { id: string; label: string; pole: string; path: string; source: string };
const routes: Record<string, string> = {
  supplier: '/pole/supplier/portfolios',
  marketplace: '/pole/marketplace/portfolio',
  ops: '/pole/ops',
  rh: '/pole/rh/portfolio',
};

async function loadOwnPortfolios(userId: string): Promise<OwnPortfolio[]> {
  const [rbac, supplier, merchant, cases] = await Promise.all([
    supabase.from('access_portfolio_assignments')
      .select('id,portfolio_id,assignment_status,starts_at,ends_at,portfolio:access_business_portfolios(id,label_snapshot,status,portfolio_type:access_portfolio_types(label,business_pole,status))')
      .eq('employee_id', userId).eq('assignment_status', 'active')
      .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString()),
    supabase.from('supplier_portfolios')
      .select('id,category,responsible_id,backup_id')
      .or(`responsible_id.eq.${userId},backup_id.eq.${userId}`)
      .is('archived_at', null),
    supabase.from('merchant_portfolios')
      .select('id,name,status,role_scope').eq('owner_id', userId).eq('status', 'active'),
    supabase.from('bib_case_portfolios')
      .select('id,name,pole,status').eq('owner_id', userId).eq('status', 'active'),
  ]);
  const failure = [rbac, supplier, merchant, cases].find(result => result.error);
  if (failure?.error) throw failure.error;

  const rows: OwnPortfolio[] = [];
  for (const assignment of rbac.data ?? []) {
    // PostgREST embedded relationship is expected to be one-to-one.
    const p = Array.isArray(assignment.portfolio) ? assignment.portfolio[0] : assignment.portfolio;
    const t = p?.portfolio_type && (Array.isArray(p.portfolio_type) ? p.portfolio_type[0] : p.portfolio_type);
    if (!p || p.status !== 'active' || !t || t.status !== 'active') continue;
    const pole = t.business_pole ?? '';
    rows.push({ id: p.id, label: p.label_snapshot || t.label || 'Portefeuille', pole, path: routes[pole] || '/', source: 'rbac' });
  }
  for (const p of supplier.data ?? []) {
    rows.push({ id: p.id, label: p.category || 'Fournisseurs', pole: 'supplier', path: routes.supplier, source: 'supplier' });
  }
  for (const p of merchant.data ?? []) {
    if (p.role_scope !== 'marketplace') continue;
    rows.push({ id: p.id, label: p.name || 'Marchands', pole: 'marketplace', path: routes.marketplace, source: 'merchant' });
  }
  for (const p of cases.data ?? []) {
    rows.push({ id: p.id, label: p.name || 'Dossier', pole: p.pole, path: routes[p.pole] || '/', source: 'case' });
  }
  const unique = new Map<string, OwnPortfolio>();
  for (const row of rows) unique.set(row.source + ':' + row.id, row);
  return [...unique.values()].sort((a, b) => a.pole.localeCompare(b.pole) || a.label.localeCompare(b.label));
}

export function MyAssignedPortfolios() {
  const { user, profile, loading } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const identityReady = !loading && !!user?.id && profile?.id === user.id &&
    profile.app_origin === 'connect' && profile.hr_status === 'active' && !profile.test_account;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['my-assigned-portfolios', user?.id],
    queryFn: () => loadOwnPortfolios(user!.id),
    enabled: identityReady,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  if (!identityReady) return null;
  return (
    <Card data-testid="my-assigned-portfolios" className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <BriefcaseBusiness className="h-5 w-5" /> Mes portefeuilles
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Attributions associées à votre compte connecté, dans vos pôles autorisés.
          </p>
        </div>
        <Button variant="outline" size="sm" aria-label="Actualiser mes portefeuilles"
          onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Chargement de vos portefeuilles…</p>
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">Impossible de vérifier vos portefeuilles. Réessayez ; aucune liste partielle n'est affichée.</p>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">Aucun portefeuille actif ne vous est encore attribué. Le responsable de votre pôle effectue les attributions.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map(p => {
              const itemKey = p.source + ':' + p.id;
              const isOpen = expanded === itemKey;
              return (
                <li key={itemKey} className="rounded-lg border p-3">
                  <p className="font-medium">{p.label}</p>
                  <p className="mb-2 text-xs text-muted-foreground">Pôle : {p.pole}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" size="sm"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : itemKey)}>
                      {isOpen ? 'Masquer les détails' : 'Voir les dossiers et le suivi'}
                    </Button>
                    <Link className="text-sm font-medium text-primary underline underline-offset-4"
                      to={p.path}>Ouvrir le pôle</Link>
                  </div>
                  {isOpen && <PersonalPortfolioDetails key={itemKey}
                    reference={p} onClose={() => setExpanded(null)} />}
                </li>
              );
            })}        </ul>
        )}
      </CardContent>
    </Card>
  );
}
