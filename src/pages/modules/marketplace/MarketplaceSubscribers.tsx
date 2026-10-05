import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CreditCard,
  Filter,
  Search,
  Store,
  UsersRound,
  X,
} from "lucide-react";

import {
  useMarketplaceMerchants,
  useMarketplaceShops,
} from "@/hooks/useMarketplace";

type SubscriberRow = {
  merchantId: string;
  merchantName: string;
  merchantEmail: string | null;
  shopId: string;
  shopName: string;
  subscriptionPlan: string;
  status: string;
  category: string;
  country: string;
};

type SubscriberFilter =
  | "all"
  | "active"
  | "inactive"
  | "advanced";

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function formatPlan(plan: string) {
  const normalized = normalize(plan);

  const labels: Record<string, string> = {
    basic: "Basic",
    starter: "Starter",
    standard: "Standard",
    pro: "Pro",
    premium: "Premium",
    enterprise: "Enterprise",
  };

  return labels[normalized] ?? plan;
}

function getPlanClasses(plan: string) {
  const normalized = normalize(plan);

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

function isAdvancedPlan(plan: string) {
  const normalized = normalize(plan);

  return (
    normalized === "pro" ||
    normalized === "premium" ||
    normalized === "enterprise"
  );
}

export default function MarketplaceSubscribers() {
  const {
    data: merchants = [],
    isLoading: merchantsLoading,
  } = useMarketplaceMerchants();

  const {
    data: shops = [],
    isLoading: shopsLoading,
  } = useMarketplaceShops();

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<SubscriberFilter>("all");

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

  const rows = useMemo<SubscriberRow[]>(() => {
    return shops
      .filter((shop) => {
        const plan = normalize(shop.subscription_plan);

        return (
          Boolean(shop.merchant_id) &&
          Boolean(plan) &&
          plan !== "none" &&
          plan !== "free"
        );
      })
      .map((shop) => {
        const merchant = shop.merchant_id
          ? merchantMap.get(shop.merchant_id)
          : undefined;

        return {
          merchantId: shop.merchant_id as string,
          merchantName:
            merchant?.company_name ||
            merchant?.contact_name ||
            "Marchand sans nom",
          merchantEmail:
            merchant?.contact_email || null,
          shopId: shop.id,
          shopName: shop.name,
          subscriptionPlan:
            shop.subscription_plan as string,
          status: normalize(shop.status),
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

      let matchesFilter = true;

      if (filter === "active") {
        matchesFilter = row.status === "active";
      }

      if (filter === "inactive") {
        matchesFilter =
          row.status === "inactive" ||
          row.status === "suspended" ||
          row.status === "closed";
      }

      if (filter === "advanced") {
        matchesFilter = isAdvancedPlan(
          row.subscriptionPlan,
        );
      }

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const stats = useMemo(() => {
    const active = rows.filter(
      (row) => row.status === "active",
    ).length;

    const inactive = rows.filter(
      (row) =>
        row.status === "inactive" ||
        row.status === "suspended" ||
        row.status === "closed",
    ).length;

    const advanced = rows.filter((row) =>
      isAdvancedPlan(row.subscriptionPlan),
    ).length;

    const uniqueMerchants = new Set(
      rows.map((row) => row.merchantId),
    ).size;

    return {
      total: rows.length,
      active,
      inactive,
      advanced,
      uniqueMerchants,
    };
  }, [rows]);

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const hasFilters =
    Boolean(search) || filter !== "all";

  const contactSubscriber = (row: SubscriberRow) => {
    if (!row.merchantEmail) return;

    navigate("/modules/gateway/compose", {
      state: {
        to: row.merchantEmail,
        recipientName: row.merchantName,
        subject: `Suivi de votre abonnement — ${row.shopName}`,
        message: `Bonjour ${row.merchantName},

Je vous contacte au nom de B.I.B concernant la boutique « ${row.shopName} ».

Nous souhaitons effectuer un point sur votre abonnement actuel (${formatPlan(
          row.subscriptionPlan,
        )}) et nous assurer que les fonctionnalités et services associés correspondent bien à vos besoins.

Nous pouvons également vous présenter, si nécessaire, les possibilités d'évolution ou les services complémentaires disponibles.

Bien cordialement,

Équipe Marketplace
B.I.B`,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Abonnés</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Marchands abonnés
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue opérationnelle des boutiques disposant actuellement
            d'une offre Marketplace. Cette interface permet au pôle
            Marketplace de suivre le portefeuille abonné et de
            maintenir la relation commerciale avec les marchands.
          </p>
        </div>

        <Link
          to="/pole/marketplace/subscriptions"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <CreditCard className="h-4 w-4" />
          Abonnements & add-ons
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Boutiques abonnées"
          value={stats.total}
          icon={Store}
        />

        <KpiCard
          label="Abonnées actives"
          value={stats.active}
          icon={BadgeCheck}
          tone="success"
        />

        <KpiCard
          label="Offres avancées"
          value={stats.advanced}
          icon={CreditCard}
        />

        <KpiCard
          label="Marchands concernés"
          value={stats.uniqueMerchants}
          icon={Building2}
        />
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Portefeuille des abonnés
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Seules les boutiques disposant d'une offre renseignée
            sont affichées dans cette vue.
          </p>
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

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target.value as SubscriberFilter,
                  )
                }
                className="h-10 min-w-[210px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">
                  Tous les abonnés
                </option>
                <option value="active">
                  Abonnés actifs
                </option>
                <option value="inactive">
                  Inactifs / suspendus
                </option>
                <option value="advanced">
                  Offres avancées
                </option>
              </select>
            </div>

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

        {/* Loading */}
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
              Aucun abonné trouvé
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Aucune boutique abonnée ne correspond aux critères
              sélectionnés.
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
                    Statut
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Catégorie
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredRows.map((row) => (
                  <tr
                    key={row.shopId}
                    className="transition hover:bg-muted/20"
                  >
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

                        {row.merchantEmail ? (
                          <button
                            type="button"
                            onClick={() =>
                              contactSubscriber(row)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                          >
                            Contacter
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Operational note */}
      <section className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />

          <div>
            <h2 className="font-medium">
              Rôle de cette vue
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Le pôle Marketplace utilise cette vue pour suivre les
              marchands déjà abonnés, maintenir la relation commerciale
              et identifier les opportunités d'évolution d'offre ou
              d'add-on. Les échanges externes passent par Gateway.
            </p>
          </div>
        </div>
      </section>
    </div>
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
  tone?: "default" | "success";
}) {
  const iconClass =
    tone === "success"
      ? "text-emerald-600"
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
