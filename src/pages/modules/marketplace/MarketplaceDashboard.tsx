import { Link } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  useMarketplaceCustomers,
  useMarketplaceMerchants,
  useMarketplaceShops,
} from "@/hooks/useMarketplace";
import { useMarketplaceFavorites } from "@/hooks/useMarketplaceFavorites";
import { useOrders } from "@/hooks/useOps";
import { supabase } from "@/integrations/supabase/client";

function KpiCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
        Ouvrir
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

const statusLabels: Record<string, string> = {
  active: "Actives",
  review: "En revue",
  application: "Candidatures",
  draft: "Brouillons",
  inactive: "Inactives",
  suspended: "Suspendues",
  closed: "Fermées",
};

export default function MarketplaceDashboard() {
  const { data: merchants = [], isLoading: merchantsLoading } =
    useMarketplaceMerchants();

  const { data: shops = [], isLoading: shopsLoading } =
    useMarketplaceShops();

  const { data: customers = [], isLoading: customersLoading } =
    useMarketplaceCustomers();

  const { data: favorites = [], isLoading: favoritesLoading } =
    useMarketplaceFavorites();

  const { data: orders = [], isLoading: ordersLoading } =
    useOrders();

  const { data: syncRun, isLoading: syncLoading } = useQuery({
    queryKey: ["marketplace", "dashboard", "last-platform-sync"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_sync_runs")
        .select(
          "status, items_count, started_at, finished_at"
        )
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ["marketplace", "dashboard", "subscribers"],

    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscriptions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "active")
        .eq("kind", "customer");

      if (error) {
        return 0;
      }

      return count ?? 0;
    },
  });

  const activeShops = shops.filter(
    (shop) => shop.status === "active"
  ).length;

  const statusCounts = shops.reduce<Record<string, number>>(
    (acc, shop) => {
      acc[shop.status] = (acc[shop.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const loading =
    merchantsLoading ||
    shopsLoading ||
    customersLoading ||
    favoritesLoading ||
    ordersLoading;

  const lastSyncLabel = syncRun?.finished_at
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(syncRun.finished_at))
    : "Aucune synchronisation enregistrée";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="h-4 w-4" />
            <span>Marketplace</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Dashboard Marketplace
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Pilotage du portefeuille marchands, des boutiques et de
            l’activité commerciale Marketplace.
          </p>
        </div>

        <Link
          to="/pole/marketplace/opportunities"
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted/50"
        >
          <TrendingUp className="h-4 w-4" />
          Voir les opportunités
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Marchands suivis"
          value={loading ? "…" : merchants.length}
          icon={UsersRound}
          href="/pole/marketplace/merchants"
        />

        <KpiCard
          label="Boutiques"
          value={loading ? "…" : shops.length}
          icon={Store}
          href="/pole/marketplace/stores"
        />

        <KpiCard
          label="Boutiques actives"
          value={loading ? "…" : activeShops}
          icon={BadgeCheck}
          href="/pole/marketplace/stores"
        />

        <KpiCard
          label="Clients"
          value={loading ? "…" : customers.length}
          icon={Users}
          href="/pole/marketplace/customers"
        />

        <KpiCard
          label="Produits"
          value="Voir le module"
          icon={Package}
          href="/pole/marketplace/products"
        />

        <KpiCard
          label="Commandes"
          value={loading ? "…" : orders.length}
          icon={ShoppingBag}
          href="/pole/marketplace/orders"
        />

        <KpiCard
          label="Abonnés BIB"
          value={subscriberCount}
          icon={BadgeCheck}
          href="/pole/marketplace/subscribers"
        />

        <KpiCard
          label="Favoris"
          value={loading ? "…" : favorites.length}
          icon={Heart}
          href="/pole/marketplace/favorites"
        />
      </div>

      {/* Portfolio + Integration */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="État du portefeuille"
          description="Répartition actuelle des boutiques suivies par le pôle Marketplace."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "active",
              "review",
              "application",
              "draft",
              "inactive",
              "suspended",
            ].map((status) => (
              <Link
                key={status}
                to="/pole/marketplace/stores"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30"
              >
                <span className="text-sm">
                  {statusLabels[status]}
                </span>

                <span className="text-sm font-semibold">
                  {statusCounts[status] ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section
          title="Synchronisation BIB Platform"
          description="Résumé technique uniquement. Le détail métier reste géré dans les modules Marketplace."
        >
          {syncLoading ? (
            <div className="text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : syncRun ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Dernier résultat
                </span>

                <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                  {syncRun.status === "success"
                    ? "Succès"
                    : syncRun.status === "partial"
                      ? "Partiel"
                      : syncRun.status === "error"
                        ? "Erreur"
                        : syncRun.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Dernière exécution
                </span>

                <span className="text-sm font-medium">
                  {lastSyncLabel}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Éléments traités
                </span>

                <span className="text-sm font-medium">
                  {syncRun.items_count ?? 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              Aucune exécution enregistrée.
            </div>
          )}

          <Link
            to="/integration"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:underline"
          >
            Voir l’intégration
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Section>
      </div>

      {/* Quick access */}
      <Section
        title="Accès rapides"
        description="Les données détaillées sont gérées dans leurs modules métier respectifs."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Marchands & portefeuilles",
              "/pole/marketplace/merchants",
              UsersRound,
            ],
            [
              "Boutiques",
              "/pole/marketplace/stores",
              Store,
            ],
            [
              "Opportunités",
              "/pole/marketplace/opportunities",
              TrendingUp,
            ],
            [
              "Produits",
              "/pole/marketplace/products",
              Package,
            ],
            [
              "Clients",
              "/pole/marketplace/customers",
              Users,
            ],
            [
              "Commandes",
              "/pole/marketplace/orders",
              ShoppingBag,
            ],
            [
              "Abonnements & add-ons",
              "/pole/marketplace/subscriptions",
              BadgeCheck,
            ],
            [
              "Favoris & suivi",
              "/pole/marketplace/favorites",
              Heart,
            ],
          ].map(([label, href, Icon]) => (
            <Link
              key={String(href)}
              to={String(href)}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium hover:bg-muted/30"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{String(label)}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}