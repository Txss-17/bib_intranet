import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Filter,
  Package,
  Search,
  Store,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

import {
  useMarketplaceMerchants,
  useMarketplaceShops,
} from "@/hooks/useMarketplace";

type SubscriptionFilter =
  | "all"
  | "configured"
  | "missing"
  | "active"
  | "inactive";

type SubscriptionRow = {
  merchantId: string;
  merchantName: string;
  shopId: string;
  shopName: string;
  status: string;
  subscriptionPlan: string | null;
  hasSubscription: boolean;
  category: string;
  country: string;
  merchantEmail: string | null;
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function formatPlan(plan: string | null) {
  if (!plan) return "Non renseigné";

  const normalized = normalize(plan);

  const labels: Record<string, string> = {
    none: "Aucune offre",
    free: "Sans abonnement",
    basic: "Basic",
    starter: "Starter",
    standard: "Standard",
    pro: "Pro",
    premium: "Premium",
    enterprise: "Enterprise",
  };

  return labels[normalized] ?? plan;
}

function getPlanClasses(plan: string | null) {
  if (!plan) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  const normalized = normalize(plan);

  if (
    normalized === "none" ||
    normalized === "free"
  ) {
    return "bg-slate-50 text-slate-600 border-slate-200";
  }

  if (
    normalized === "premium" ||
    normalized === "enterprise" ||
    normalized === "pro"
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return "bg-blue-50 text-blue-700 border-blue-200";
}

function getStatusClasses(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "application":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "review":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "inactive":
      return "bg-slate-50 text-slate-600 border-slate-200";

    case "suspended":
      return "bg-red-50 text-red-700 border-red-200";

    case "closed":
      return "bg-zinc-100 text-zinc-600 border-zinc-200";

    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Brouillon",
    application: "Candidature",
    review: "En revue",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspendue",
    closed: "Clôturée",
  };

  return labels[status] ?? status;
}

export default function MarketplaceSubscriptions() {
  const {
    data: merchants = [],
    isLoading: merchantsLoading,
  } = useMarketplaceMerchants();

  const {
    data: shops = [],
    isLoading: shopsLoading,
  } = useMarketplaceShops();

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] =
    useState<SubscriptionFilter>("all");
  
  const navigate = useNavigate();
  
  const isLoading =
    merchantsLoading || shopsLoading;

  const merchantMap = useMemo(() => {
    return new Map(
      merchants.map((merchant) => [
        merchant.id,
        merchant,
      ]),
    );
  }, [merchants]);

  const rows = useMemo<SubscriptionRow[]>(() => {
    return shops
      .filter((shop) => Boolean(shop.merchant_id))
      .map((shop) => {
        const merchant = shop.merchant_id
          ? merchantMap.get(shop.merchant_id)
          : undefined;

        const subscriptionPlan =
          shop.subscription_plan || null;

        const normalizedPlan =
          normalize(subscriptionPlan);

        const hasSubscription =
          Boolean(subscriptionPlan) &&
          normalizedPlan !== "none" &&
          normalizedPlan !== "free";

        return {
          merchantId: shop.merchant_id as string,
          merchantName:
            merchant?.company_name ||
            merchant?.contact_name ||
            "Marchand sans nom",
          shopId: shop.id,
          shopName: shop.name,
          status: normalize(shop.status),
          subscriptionPlan,
          hasSubscription,
          category:
            shop.category || "Non catégorisée",
          country:
            shop.country || "Non renseigné",
        };
      });
  }, [shops, merchantMap]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        normalize(row.merchantName).includes(query) ||
        normalize(row.shopName).includes(query) ||
        normalize(row.subscriptionPlan).includes(query) ||
        normalize(row.category).includes(query);

      let matchesPlan = true;

      if (planFilter === "configured") {
        matchesPlan = row.hasSubscription;
      }

      if (planFilter === "missing") {
        matchesPlan = !row.hasSubscription;
      }

      if (planFilter === "active") {
        matchesPlan = row.status === "active";
      }

      if (planFilter === "inactive") {
        matchesPlan =
          row.status === "inactive" ||
          row.status === "suspended" ||
          row.status === "closed";
      }

      return matchesSearch && matchesPlan;
    });
  }, [rows, search, planFilter]);

  const stats = useMemo(() => {
    const configured = rows.filter(
      (row) => row.hasSubscription,
    ).length;

    const missing = rows.filter(
      (row) => !row.hasSubscription,
    ).length;

    const active = rows.filter(
      (row) => row.status === "active",
    ).length;

    const activeWithoutSubscription =
      rows.filter(
        (row) =>
          row.status === "active" &&
          !row.hasSubscription,
      ).length;

    const premium = rows.filter((row) => {
      const plan = normalize(row.subscriptionPlan);

      return (
        plan === "premium" ||
        plan === "enterprise" ||
        plan === "pro"
      );
    }).length;

    const uniqueMerchants = new Set(
      rows.map((row) => row.merchantId),
    ).size;

    return {
      total: rows.length,
      configured,
      missing,
      active,
      activeWithoutSubscription,
      premium,
      uniqueMerchants,
    };
  }, [rows]);

  const planDistribution = useMemo(() => {
    const distribution = new Map<
      string,
      {
        label: string;
        value: number;
      }
    >();

    rows.forEach((row) => {
      const key = normalize(
        row.subscriptionPlan,
      ) || "missing";

      const label =
        key === "missing"
          ? "Non renseigné"
          : formatPlan(row.subscriptionPlan);

      const current = distribution.get(key);

      if (current) {
        current.value += 1;
      } else {
        distribution.set(key, {
          label,
          value: 1,
        });
      }
    });

    return Array.from(distribution.values()).sort(
      (a, b) => b.value - a.value,
    );
  }, [rows]);

  const clearFilters = () => {
    setSearch("");
    setPlanFilter("all");
  };

  const hasFilters =
    Boolean(search) || planFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Abonnements & add-ons</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Abonnements & add-ons marchands
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue commerciale des offres associées aux marchands et à leurs
            boutiques. Cette page sert au suivi et au développement du
            portefeuille ; la facturation reste gérée par les systèmes
            dédiés.
          </p>
        </div>

        <Link
          to="/pole/marketplace/merchants"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <UsersRound className="h-4 w-4" />
          Voir les marchands
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Boutiques suivies"
          value={stats.total}
          icon={Store}
        />

        <KpiCard
          label="Offre renseignée"
          value={stats.configured}
          icon={BadgeCheck}
          tone="success"
        />

        <KpiCard
          label="Offre à clarifier"
          value={stats.missing}
          icon={AlertCircle}
          tone="warning"
        />

        <KpiCard
          label="Actives sans offre"
          value={stats.activeWithoutSubscription}
          icon={TrendingUp}
          tone="danger"
        />

        <KpiCard
          label="Offres avancées"
          value={stats.premium}
          icon={CircleDollarSign}
        />
      </div>

      {/* Commercial interpretation */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CommercialCard
          icon={TrendingUp}
          title="Potentiel commercial"
          value={stats.activeWithoutSubscription}
          description="Boutiques actives dont l'offre n'est pas clairement renseignée."
        />

        <CommercialCard
          icon={Building2}
          title="Marchands concernés"
          value={stats.uniqueMerchants}
          description="Marchands représentés dans la vue abonnements."
        />

        <CommercialCard
          icon={Package}
          title="Offres avancées"
          value={stats.premium}
          description="Boutiques associées à une offre Pro, Premium ou Enterprise."
        />
      </div>

      {/* Distribution */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Répartition des offres
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Répartition basée sur le plan actuellement renseigné dans le
            portefeuille Marketplace.
          </p>
        </div>

        {planDistribution.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Aucune donnée d'abonnement disponible.
          </div>
        ) : (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {planDistribution.map((plan) => {
              const percentage =
                stats.total > 0
                  ? Math.round(
                      (plan.value / stats.total) * 100,
                    )
                  : 0;

              return (
                <div
                  key={plan.label}
                  className="rounded-lg border bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {plan.label}
                    </span>

                    <span className="text-lg font-semibold">
                      {plan.value}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {percentage}% du portefeuille
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">
              Suivi des boutiques
            </h2>

            <p className="text-xs text-muted-foreground">
              Analysez les offres boutique par boutique et remontez ensuite
              au niveau du marchand.
            </p>
          </div>
        </div>

        <div className="border-b bg-muted/20 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher un marchand, une boutique ou une offre..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <FilterSelect
              value={planFilter}
              onChange={(value) =>
                setPlanFilter(
                  value as SubscriptionFilter,
                )
              }
              options={[
                {
                  value: "all",
                  label: "Toutes les situations",
                },
                {
                  value: "configured",
                  label: "Offre renseignée",
                },
                {
                  value: "missing",
                  label: "Offre à clarifier",
                },
                {
                  value: "active",
                  label: "Boutiques actives",
                },
                {
                  value: "inactive",
                  label: "Inactives / suspendues",
                },
              ]}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 font-medium">
              Aucun résultat
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Aucune boutique ne correspond aux critères sélectionnés.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Boutique
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Marchand
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Offre
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Statut boutique
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Catégorie
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredRows.map((row) => (
                  <SubscriptionRowItem
                    key={row.shopId}
                    row={row}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SubscriptionRowItem({
  row,
}: {
  row: SubscriptionRow;
}) {
  return (
    <tr className="transition hover:bg-muted/20">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
            <Store className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <Link
              to={`/pole/marketplace/stores/${row.shopId}`}
              className="font-medium hover:underline"
            >
              {row.shopName}
            </Link>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.country}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <Link
          to={`/pole/marketplace/merchants/${row.merchantId}`}
          className="font-medium hover:underline"
        >
          {row.merchantName}
        </Link>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getPlanClasses(
            row.subscriptionPlan,
          )}`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          {formatPlan(row.subscriptionPlan)}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
            row.status,
          )}`}
        >
          {getStatusLabel(row.status)}
        </span>
      </td>

      <td className="px-5 py-4">
        <span className="text-muted-foreground">
          {row.category}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Link
            to={`/pole/marketplace/merchants/${row.merchantId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Marchand
            <UsersRound className="h-3.5 w-3.5" />
          </Link>

          <Link
            to={`/pole/marketplace/stores/${row.shopId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Boutique
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Store;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const iconClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
        : tone === "danger"
          ? "text-red-600"
          : "text-muted-foreground";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {label}
        </span>

        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>

      <div className="mt-2 text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}

function CommercialCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof TrendingUp;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {title}
        </span>

        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mt-3 text-3xl font-semibold">
        {value}
      </div>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <div className="relative">
      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-10 min-w-[210px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
