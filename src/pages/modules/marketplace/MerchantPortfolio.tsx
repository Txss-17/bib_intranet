import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Mail,
  Search,
  Store,
  Users,
} from 'lucide-react';

import {
  useMarketplaceMerchants,
  useMarketplacePortfolios,
  useMerchantShops,
} from '@/hooks/useMarketplace';

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspendue',
  closed: 'Clôturée',
  review: 'En revue',
  application: 'Candidature',
  draft: 'Brouillon',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
      {statusLabel[status] ?? status}
    </span>
  );
}

function MerchantRow({
  merchant,
  shopCount,
}: {
  merchant: any;
  shopCount: number;
}) {
  return (
    <Link
      to={`/pole/marketplace/merchants/${merchant.id}`}
      className="block rounded-xl border bg-card p-4 transition hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <h3 className="truncate font-semibold">
              {merchant.company_name || 'Marchand sans nom'}
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {merchant.contact_name || 'Contact non renseigné'}
          </p>

          {merchant.contact_email && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {merchant.contact_email}
            </div>
          )}
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {merchant.subscription_status && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
            Abonnement : {merchant.subscription_status}
          </span>
        )}

        {merchant.risk_level && (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
            Risque : {merchant.risk_level}
          </span>
        )}

        <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
          {shopCount} boutique{shopCount > 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  );
}

export default function MerchantPortfolio() {
  const [search, setSearch] = useState('');
  const [portfolioFilter, setPortfolioFilter] = useState('all');

  const { data: merchants = [], isLoading } =
    useMarketplaceMerchants(search);

  const { data: portfolios = [] } =
    useMarketplacePortfolios();

  const { data: allShops = [] } =
    useMerchantShops(undefined);

  const shopCountByMerchant = useMemo(() => {
    const map = new Map<string, number>();

    for (const shop of allShops) {
      if (!shop.merchant_id) continue;

      map.set(
        shop.merchant_id,
        (map.get(shop.merchant_id) ?? 0) + 1,
      );
    }

    return map;
  }, [allShops]);

  const filteredMerchants = useMemo(() => {
    if (portfolioFilter === 'all') return merchants;

    return merchants;
  }, [merchants, portfolioFilter]);

  const stats = useMemo(() => {
    const totalShops = allShops.length;

    const activeShops = allShops.filter(
      (shop) => shop.status === 'active',
    ).length;

    const needsAttention = allShops.filter(
      (shop) =>
        ['application', 'review', 'suspended'].includes(
          shop.status,
        ),
    ).length;

    return {
      merchants: merchants.length,
      shops: totalShops,
      activeShops,
      needsAttention,
    };
  }, [merchants, allShops]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              Marchands & portefeuilles
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Un marchand constitue l’unité de gestion du portefeuille
              Marketplace. Ses boutiques suivent ce même périmètre.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Marchands
            </span>
            <Users className="h-4 w-4" />
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {stats.merchants}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Boutiques
            </span>
            <Store className="h-4 w-4" />
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {stats.shops}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Boutiques actives
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {stats.activeShops}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              À traiter
            </span>
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {stats.needsAttention}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un marchand..."
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={portfolioFilter}
          onChange={(event) =>
            setPortfolioFilter(event.target.value)
          }
          className="h-10 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="all">
            Tous les portefeuilles
          </option>

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

      {isLoading ? (
        <div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Chargement des marchands…
        </div>
      ) : filteredMerchants.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />

          <h2 className="mt-3 font-medium">
            Aucun marchand trouvé
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Aucun marchand ne correspond aux critères actuels.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMerchants.map((merchant) => (
            <MerchantRow
              key={merchant.id}
              merchant={merchant}
              shopCount={
                shopCountByMerchant.get(merchant.id) ?? 0
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
