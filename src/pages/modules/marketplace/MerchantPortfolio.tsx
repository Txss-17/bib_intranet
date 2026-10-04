import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  Search,
  UsersRound,
  Store,
  ArrowRight,
  BriefcaseBusiness,
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
} from '@/hooks/useMarketplace';

export default function MerchantPortfolio() {
  const [search, setSearch] = useState('');

  const { data: merchants = [], isLoading } =
    useMarketplaceMerchants(search);

  const { data: portfolios = [] } =
    useMarketplacePortfolios();

  const { data: shops = [] } =
    useMarketplaceShops();

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Marchands & portefeuilles
          </h1>

          <p className="text-sm text-muted-foreground">
            Pilotage du marchand comme unité de gestion Marketplace,
            avec l’ensemble de ses boutiques.
          </p>
        </div>

        <Badge variant="outline">
          {portfolios.length} portefeuille
          {portfolios.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
                {
                  portfolios.filter(
                    (portfolio) =>
                      portfolio.status === 'active',
                  ).length
                }
              </p>

              <p className="text-xs text-muted-foreground">
                Portefeuilles actifs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Portefeuille marchand
          </CardTitle>

          <div className="relative max-w-md">
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
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Chargement…
            </p>
          ) : merchants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Aucun marchand trouvé.
            </div>
          ) : (
            <div className="divide-y">
              {merchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
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
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {merchant.contact_name ||
                        'Contact non renseigné'}

                      {merchant.contact_email
                        ? ` · ${merchant.contact_email}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
