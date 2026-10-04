import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Filter,
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

import { SHOP_STATUS_LABELS } from "@/hooks/useShops";

type StatusFilter =
  | "all"
  | "active"
  | "application"
  | "review"
  | "inactive"
  | "suspended"
  | "closed";

type MerchantPerformance = {
  merchantId: string;
  merchantName: string;
  totalShops: number;
  activeShops: number;
  reviewShops: number;
  inactiveShops: number;
  suspendedShops: number;
  closedShops: number;
  completionRate: number;
  categories: string[];
};

const STATUS_ORDER: Array<{
  value: StatusFilter;
  label: string;
}> = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actives" },
  { value: "application", label: "Candidatures" },
  { value: "review", label: "En revue" },
  { value: "inactive", label: "Inactives" },
  { value: "suspended", label: "Suspendues" },
  { value: "closed", label: "Clôturées" },
];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getStatusLabel(status: string) {
  return (
    SHOP_STATUS_LABELS[
      status as keyof typeof SHOP_STATUS_LABELS
    ] ?? status
  );
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

export default function MarketplaceAnalytics() {
  const { data: merchants = [], isLoading: merchantsLoading } =
    useMarketplaceMerchants();

  const { data: shops = [], isLoading: shopsLoading } =
    useMarketplaceShops();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const isLoading = merchantsLoading || shopsLoading;

  const merchantMap = useMemo(() => {
    return new Map(
      merchants.map((merchant) => [merchant.id, merchant]),
    );
  }, [merchants]);

  const portfolio = useMemo<MerchantPerformance[]>(() => {
    const grouped = new Map<string, MerchantPerformance>();

    shops.forEach((shop) => {
      const merchantId = shop.merchant_id;

      if (!merchantId) return;

      const merchant = merchantMap.get(merchantId);

      if (!merchant) return;

      const existing = grouped.get(merchantId);

      const merchantName =
        merchant.company_name ||
        merchant.contact_name ||
        "Marchand sans nom";

      const category = String(shop.category ?? "").trim();
      const status = normalize(shop.status);

      if (!existing) {
        grouped.set(merchantId, {
          merchantId,
          merchantName,
          totalShops: 1,
          activeShops: status === "active" ? 1 : 0,
          reviewShops:
            status === "application" || status === "review"
              ? 1
              : 0,
          inactiveShops:
            status === "inactive" ? 1 : 0,
          suspendedShops:
            status === "suspended" ? 1 : 0,
          closedShops:
            status === "closed" ? 1 : 0,
          completionRate: calculateCompletionRate(shop),
          categories: category ? [category] : [],
        });

        return;
      }

      existing.totalShops += 1;

      if (status === "active") {
        existing.activeShops += 1;
      }

      if (status === "application" || status === "review") {
        existing.reviewShops += 1;
      }

      if (status === "inactive") {
        existing.inactiveShops += 1;
      }

      if (status === "suspended") {
        existing.suspendedShops += 1;
      }

      if (status === "closed") {
        existing.closedShops += 1;
      }

      existing.completionRate =
        calculateAggregateCompletion(
          existing.completionRate,
          existing.totalShops,
          calculateCompletionRate(shop),
        );

      if (category && !existing.categories.includes(category)) {
        existing.categories.push(category);
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      if (b.activeShops !== a.activeShops) {
        return b.activeShops - a.activeShops;
      }

      return b.totalShops - a.totalShops;
    });
  }, [shops, merchantMap]);

  const filteredShops = useMemo(() => {
    const query = normalize(search);

    return shops.filter((shop) => {
      const merchant = shop.merchant_id
        ? merchantMap.get(shop.merchant_id)
        : undefined;

      const merchantName =
        merchant?.company_name ||
        merchant?.contact_name ||
        "";

      const matchesSearch =
        !query ||
        normalize(shop.name).includes(query) ||
        normalize(merchantName).includes(query) ||
        normalize(shop.category).includes(query) ||
        normalize(shop.country).includes(query);

      const status = normalize(shop.status);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "application"
            ? status === "application"
            : status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    shops,
    merchantMap,
    search,
    statusFilter,
  ]);

  const globalStats = useMemo(() => {
    const total = shops.length;

    const active = shops.filter(
      (shop) => normalize(shop.status) === "active",
    ).length;

    const application = shops.filter(
      (shop) => normalize(shop.status) === "application",
    ).length;

    const review = shops.filter(
      (shop) => normalize(shop.status) === "review",
    ).length;

    const inactive = shops.filter(
      (shop) => normalize(shop.status) === "inactive",
    ).length;

    const suspended = shops.filter(
      (shop) => normalize(shop.status) === "suspended",
    ).length;

    const closed = shops.filter(
      (shop) => normalize(shop.status) === "closed",
    ).length;

    const documented = shops.filter(
      (shop) =>
        Boolean(shop.activity_type) &&
        Boolean(shop.activity_description) &&
        Boolean(shop.website_url),
    ).length;

    const documentationRate =
      total > 0
        ? Math.round((documented / total) * 100)
        : 0;

    return {
      total,
      active,
      application,
      review,
      inactive,
      suspended,
      closed,
      documented,
      documentationRate,
    };
  }, [shops]);

  const categoryStats = useMemo(() => {
    const categories = new Map<
      string,
      {
        category: string;
        total: number;
        active: number;
      }
    >();

    shops.forEach((shop) => {
      const category =
        String(shop.category ?? "").trim() ||
        "Non catégorisée";

      const current = categories.get(category);

      if (!current) {
        categories.set(category, {
          category,
          total: 1,
          active:
            normalize(shop.status) === "active"
              ? 1
              : 0,
        });

        return;
      }

      current.total += 1;

      if (normalize(shop.status) === "active") {
        current.active += 1;
      }
    });

    return Array.from(categories.values())
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return b.active - a.active;
      })
      .slice(0, 8);
  }, [shops]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasFilters =
    Boolean(search) || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Performance portefeuille</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Performance portefeuille
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue consolidée des marchands et de leurs boutiques :
            activité, répartition des statuts, qualité des données et
            structure du portefeuille.
          </p>
        </div>

        <Link
          to="/pole/marketplace/merchants"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <UsersRound className="h-4 w-4" />
          Portefeuille marchands
        </Link>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Boutiques"
          value={globalStats.total}
          icon={Store}
        />

        <KpiCard
          label="Boutiques actives"
          value={globalStats.active}
          icon={CheckCircle2}
          tone="success"
        />

        <KpiCard
          label="En revue"
          value={globalStats.review}
          icon={Activity}
          tone="warning"
        />

        <KpiCard
          label="Suspendues"
          value={globalStats.suspended}
          icon={CircleAlert}
          tone="danger"
        />
      </div>

      {/* Secondary indicators */}
      <div className="grid gap-4 lg:grid-cols-3">
        <IndicatorCard
          title="Taux d'activation"
          value={calculateRate(
            globalStats.active,
            globalStats.total,
          )}
          description="Part des boutiques actuellement actives."
          icon={TrendingUp}
        />

        <IndicatorCard
          title="Données documentées"
          value={globalStats.documentationRate}
          description="Activité et site renseignés."
          icon={BarChart3}
        />

        <IndicatorCard
          title="Marchands représentés"
          value={portfolio.length}
          description="Marchands ayant au moins une boutique dans le portefeuille."
          icon={UsersRound}
          suffix=""
        />
      </div>

      {/* Status distribution */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">
              Répartition du portefeuille
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              État actuel des boutiques suivies par Marketplace.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatusMetric
              label="Actives"
              value={globalStats.active}
              status="active"
              total={globalStats.total}
            />

            <StatusMetric
              label="Candidatures"
              value={globalStats.application}
              status="application"
              total={globalStats.total}
            />

            <StatusMetric
              label="En revue"
              value={globalStats.review}
              status="review"
              total={globalStats.total}
            />

            <StatusMetric
              label="Inactives"
              value={globalStats.inactive}
              status="inactive"
              total={globalStats.total}
            />

            <StatusMetric
              label="Suspendues"
              value={globalStats.suspended}
              status="suspended"
              total={globalStats.total}
            />

            <StatusMetric
              label="Clôturées"
              value={globalStats.closed}
              status="closed"
              total={globalStats.total}
            />
          </div>
        </section>

        {/* Categories */}
        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">
              Structure par catégorie
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Principales catégories présentes dans le portefeuille.
            </p>
          </div>

          <div className="divide-y">
            {categoryStats.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucune catégorie disponible.
              </div>
            ) : (
              categoryStats.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.category}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.active} active
                      {item.active > 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {item.total}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Merchant portfolio */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">
                Performance par marchand
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Le niveau d'analyse principal reste le marchand et
                l'ensemble de ses boutiques.
              </p>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {portfolio.length} marchand
              {portfolio.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : portfolio.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
            <UsersRound className="h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 font-medium">
              Aucun portefeuille disponible
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Les boutiques doivent être rattachées à un marchand pour
              apparaître dans cette analyse.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {portfolio.map((merchant) => (
              <MerchantPerformanceRow
                key={merchant.merchantId}
                merchant={merchant}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detailed shop analysis */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">
                Analyse détaillée des boutiques
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Filtrez les boutiques du portefeuille pour examiner leur
                situation individuelle.
              </p>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {filteredShops.length} résultat
              {filteredShops.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-muted/20 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher une boutique, un marchand, une catégorie..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(value as StatusFilter)
              }
              options={STATUS_ORDER}
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

        {filteredShops.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground" />

            <h3 className="mt-3 font-medium">
              Aucun résultat
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Aucune boutique ne correspond aux critères sélectionnés.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Boutique
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Marchand
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Catégorie
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Statut
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Complétude
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredShops.map((shop) => {
                  const merchant = shop.merchant_id
                    ? merchantMap.get(shop.merchant_id)
                    : undefined;

                  const merchantName =
                    merchant?.company_name ||
                    merchant?.contact_name ||
                    "—";

                  const completion =
                    calculateCompletionRate(shop);

                  const status = normalize(shop.status);

                  return (
                    <tr
                      key={shop.id}
                      className="transition hover:bg-muted/20"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
                            <Store className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {shop.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {shop.shop_code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {shop.merchant_id ? (
                          <Link
                            to={`/pole/marketplace/merchants/${shop.merchant_id}`}
                            className="font-medium hover:underline"
                          >
                            {merchantName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">
                            Non rattaché
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-muted-foreground">
                          {shop.category || "Non catégorisée"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            status,
                          )}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-foreground"
                              style={{
                                width: `${completion}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-medium">
                            {completion}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/pole/marketplace/stores/${shop.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MerchantPerformanceRow({
  merchant,
}: {
  merchant: MerchantPerformance;
}) {
  const statusTotal =
    merchant.activeShops +
    merchant.reviewShops +
    merchant.inactiveShops +
    merchant.suspendedShops +
    merchant.closedShops;

  return (
    <div className="p-5 transition hover:bg-muted/20">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-[260px] flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <Link
              to={`/pole/marketplace/merchants/${merchant.merchantId}`}
              className="font-medium hover:underline"
            >
              {merchant.merchantName}
            </Link>

            <p className="mt-0.5 text-xs text-muted-foreground">
              {merchant.totalShops} boutique
              {merchant.totalShops > 1 ? "s" : ""}
              {merchant.categories.length > 0
                ? ` · ${merchant.categories.length} catégorie${
                    merchant.categories.length > 1
                      ? "s"
                      : ""
                  }`
                : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[520px]">
          <MiniMetric
            label="Actives"
            value={merchant.activeShops}
          />

          <MiniMetric
            label="Revue"
            value={merchant.reviewShops}
          />

          <MiniMetric
            label="Inactives"
            value={merchant.inactiveShops}
          />

          <MiniMetric
            label="Suspendues"
            value={merchant.suspendedShops}
          />
        </div>

        <div className="xl:w-48">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Complétude
            </span>

            <span className="font-medium">
              {merchant.completionRate}%
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground"
              style={{
                width: `${merchant.completionRate}%`,
              }}
            />
          </div>
        </div>

        <Link
          to={`/pole/marketplace/merchants/${merchant.merchantId}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Détail
          <TrendingUp className="h-4 w-4" />
        </Link>
      </div>

      {statusTotal < merchant.totalShops && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
          <CircleAlert className="h-3.5 w-3.5" />
          Certains statuts ne sont pas encore représentés dans le
          récapitulatif.
        </div>
      )}
    </div>
  );
}

function StatusMetric({
  label,
  value,
  status,
  total,
}: {
  label: string;
  value: number;
  status: string;
  total: number;
}) {
  const percentage = calculateRate(value, total);

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(
            status,
          )}`}
        >
          {label}
        </span>

        <span className="text-lg font-semibold">
          {value}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>

        <span className="text-[11px] text-muted-foreground">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function IndicatorCard({
  title,
  value,
  description,
  icon: Icon,
  suffix = "%",
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof BarChart3;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>

        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mt-3 text-3xl font-semibold">
        {value}
        {suffix}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-semibold">
        {value}
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-[180px] appearance-none rounded-lg border bg-background py-2 pl-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
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

function calculateRate(value: number, total: number) {
  if (!total) return 0;

  return Math.round((value / total) * 100);
}

function calculateCompletionRate(shop: {
  activity_type?: string | null;
  activity_description?: string | null;
  website_url?: string | null;
  category?: string | null;
  country?: string | null;
}) {
  const fields = [
    shop.activity_type,
    shop.activity_description,
    shop.website_url,
    shop.category,
    shop.country,
  ];

  const completed = fields.filter(
    (field) => Boolean(String(field ?? "").trim()),
  ).length;

  return Math.round((completed / fields.length) * 100);
}

function calculateAggregateCompletion(
  previousAverage: number,
  totalShops: number,
  currentRate: number,
) {
  if (totalShops <= 1) {
    return currentRate;
  }

  return Math.round(
    (previousAverage * (totalShops - 1) + currentRate) /
      totalShops,
  );
}
