import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Search,
  UsersRound,
  Store,
  ArrowRight,
  BriefcaseBusiness,
  UserRound,
  CircleAlert,
  Filter,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  useMarketplaceMerchants,
  useMarketplacePortfolios,
  useMarketplaceShops,
  useMarketplaceMerchantAssignments,
} from '@/hooks/useMarketplace';

type PortfolioFilter = 'all' | 'mine' | 'unassigned' | string;

type MerchantAssignmentRecord = {
  merchant_id: string;
  portfolio_id: string;
  merchant_portfolios?:
    | {
        id: string;
        name: string;
        owner_id: string | null;
        role_scope: string;
        status: 'active' | 'inactive';
        notes: string | null;
      }
    | Array<{
        id: string;
        name: string;
        owner_id: string | null;
        role_scope: string;
        status: 'active' | 'inactive';
        notes: string | null;
      }>
    | null;
};

export default function MerchantPortfolio() {
  const [search, setSearch] = useState('');
  const [portfolioFilter, setPortfolioFilter] =
    useState<PortfolioFilter>('all');

  const { data: merchants = [], isLoading: merchantsLoading } =
    useMarketplaceMerchants(search);

  const { data: portfolios = [], isLoading: portfoliosLoading } =
    useMarketplacePortfolios();

  const { data: shops = [], isLoading: shopsLoading } =
    useMarketplaceShops();

  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
  } = useMarketplaceMerchantAssignments();

  /*
   * L'identifiant du collaborateur connecté n'est pas récupéré
   * ici volontairement.
   *
   * Le filtre "Mon portefeuille" est préparé à partir de owner_id.
   * Lorsque l'identité profil/auth sera centralisée dans un hook
   * Intranet commun, il suffira de comparer owner_id à cet identifiant.
   */
  const currentUserId: string | null = null;

  const assignmentByMerchant = useMemo(() => {
    const map = new Map<string, MerchantAssignmentRecord>();

    for (const assignment of assignments as MerchantAssignmentRecord[]) {
      if (!assignment?.merchant_id) continue;

      map.set(assignment.merchant_id, assignment);
    }

    return map;
  }, [assignments]);

  const portfolioById = useMemo(() => {
    const map = new Map<string, (typeof portfolios)[number]>();

    for (const portfolio of portfolios) {
      map.set(portfolio.id, portfolio);
    }

    return map;
  }, [portfolios]);

  const shopCountByMerchant = useMemo(() => {
    const map = new Map<string, number>();

    for (const shop of shops) {
      if (!shop.merchant_id) continue;

      map.set(
        shop.merchant_id,
        (map.get(shop.merchant_id) ?? 0) + 1,
      );
    }

    return map;
  }, [shops]);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((merchant) => {
      const assignment = assignmentByMerchant.get(
        merchant.id,
      );

      const portfolioId =
        assignment?.portfolio_id ?? null;

      if (portfolioFilter === 'unassigned') {
        if (portfolioId !== null) {
          return false;
        }
      } else if (portfolioFilter === 'mine') {
        if (!currentUserId) {
          return false;
        }

        const portfolio =
          portfolioId
            ? portfolioById.get(portfolioId)
            : null;

        if (
          !portfolio ||
          portfolio.owner_id !== currentUserId
        ) {
          return false;
        }
      } else if (
        portfolioFilter !== 'all' &&
        portfolioId !== portfolioFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    merchants,
    assignmentByMerchant,
    portfolioById,
    portfolioFilter,
    currentUserId,
  ]);

  const assignedMerchantCount = useMemo(() => {
    return merchants.filter((merchant) =>
      assignmentByMerchant.has(merchant.id),
    ).length;
  }, [merchants, assignmentByMerchant]);

  const unassignedMerchantCount =
    merchants.length - assignedMerchantCount;

  const activePortfolioCount = portfolios.filter(
    (portfolio) => portfolio.status === 'active',
  ).length;

  const isLoading =
    merchantsLoading ||
    portfoliosLoading ||
    shopsLoading ||
    assignmentsLoading;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Marchands & portefeuilles
          </h1>

          <p className="text-sm text-muted-foreground">
            Pilotage du marchand comme unité de gestion
            Marketplace, avec l’ensemble de ses boutiques et
            son portefeuille attribué.
          </p>
        </div>

        <Badge variant="outline">
          {portfolios.length} portefeuille
          {portfolios.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <UsersRound className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-2xl font-semibold">
                {merchants.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Marchands
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Store className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-2xl font-semibold">
                {shops.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Boutiques rattachées
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-2xl font-semibold">
                {activePortfolioCount}
              </p>

              <p className="text-xs text-muted-foreground">
                Portefeuilles actifs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CircleAlert className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="text-2xl font-semibold">
                {unassignedMerchantCount}
              </p>

              <p className="text-xs text-muted-foreground">
                Marchands non affectés
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>
              Portefeuille marchand
            </CardTitle>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filtrer par portefeuille
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher une entreprise, un contact ou un email"
                className="pl-9"
              />
            </div>

            <select
              value={portfolioFilter}
              onChange={(event) =>
                setPortfolioFilter(
                  event.target.value as PortfolioFilter,
                )
              }
              className="h-10 rounded-md border bg-background px-3 text-sm"
              aria-label="Filtrer par portefeuille"
            >
              <option value="all">
                Tous les portefeuilles
              </option>

              <option value="unassigned">
                Marchands non affectés
              </option>

              {currentUserId && (
                <option value="mine">
                  Mon portefeuille
                </option>
              )}

              {portfolios.map((portfolio) => (
                <option
                  key={portfolio.id}
                  value={portfolio.id}
                >
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : filteredMerchants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucun marchand ne correspond aux critères
              sélectionnés.
            </div>
          ) : (
            <div className="divide-y">
              {filteredMerchants.map((merchant) => {
                const assignment =
                  assignmentByMerchant.get(merchant.id);

                const portfolio =
                  assignment?.portfolio_id
                    ? portfolioById.get(
                        assignment.portfolio_id,
                      )
                    : null;

                return (
                  <div
                    key={merchant.id}
                    className="flex flex-col gap-4 py-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {merchant.company_name ||
                            'Entreprise non renseignée'}
                        </p>

                        {merchant.risk_level && (
                          <Badge
                            variant={
                              merchant.risk_level === 'high'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            Risque {merchant.risk_level}
                          </Badge>
                        )}

                        {portfolio ? (
                          <Badge variant="secondary">
                            <BriefcaseBusiness className="mr-1 h-3 w-3" />
                            {portfolio.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Non affecté
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {merchant.contact_name ||
                          'Contact non renseigné'}

                        {merchant.contact_email
                          ? ` · ${merchant.contact_email}`
                          : ''}
                      </p>

                      {portfolio && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Portefeuille{' '}
                          {portfolio.status === 'active'
                            ? 'actif'
                            : 'inactif'}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />

                        <div>
                          <p className="font-medium">
                            {shopCountByMerchant.get(
                              merchant.id,
                            ) ?? 0}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            boutique(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />

                        <div>
                          <p className="font-medium">
                            {portfolio?.name ??
                              'Non affecté'}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            portefeuille
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">
                          {Number(
                            merchant.revenue ?? 0,
                          ).toLocaleString('fr-FR')}{' '}
                          €
                        </p>

                        <p className="text-xs text-muted-foreground">
                          CA suivi
                        </p>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                      >
                        <Link
                          to={
                            '/pole/marketplace/merchants/' +
                            merchant.id
                          }
                        >
                          Ouvrir
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
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
