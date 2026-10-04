// src/pages/modules/marketplace/MarketplaceOpportunities.tsx

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileWarning,
  Filter,
  Lightbulb,
  Search,
  ShieldAlert,
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

type OpportunityType =
  | "performance"
  | "documentation"
  | "subscription"
  | "development"
  | "risk"
  | "activation";

type OpportunityPriority = "high" | "medium" | "low";

type Opportunity = {
  id: string;
  merchantId: string;
  merchantName: string;
  shopId?: string;
  shopName?: string;
  type: OpportunityType;
  priority: OpportunityPriority;
  title: string;
  description: string;
  recommendation: string;
};

const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  performance: "Performance",
  documentation: "Documentation",
  subscription: "Abonnement",
  development: "Développement",
  risk: "Risque",
  activation: "Activation",
};

const OPPORTUNITY_PRIORITY_LABELS: Record<OpportunityPriority, string> = {
  high: "Prioritaire",
  medium: "À traiter",
  low: "À surveiller",
};

function getPriorityClasses(priority: OpportunityPriority) {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-700 border-red-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getTypeIcon(type: OpportunityType) {
  switch (type) {
    case "performance":
      return TrendingUp;
    case "documentation":
      return FileWarning;
    case "subscription":
      return CircleDollarSign;
    case "development":
      return Lightbulb;
    case "risk":
      return ShieldAlert;
    case "activation":
      return Store;
    default:
      return Lightbulb;
  }
}

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

export default function MarketplaceOpportunities() {
  const { data: merchants = [], isLoading: merchantsLoading } =
    useMarketplaceMerchants();

  const { data: shops = [], isLoading: shopsLoading } =
    useMarketplaceShops();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | OpportunityType>("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | OpportunityPriority
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "review" | "inactive"
  >("all");

  const isLoading = merchantsLoading || shopsLoading;

  const merchantMap = useMemo(() => {
    return new Map(
      merchants.map((merchant) => [
        merchant.id,
        merchant,
      ]),
    );
  }, [merchants]);

  const opportunities = useMemo<Opportunity[]>(() => {
    const generated: Opportunity[] = [];

    shops.forEach((shop) => {
      const merchantId = shop.merchant_id;
      if (!merchantId) return;

      const merchant = merchantMap.get(merchantId);
      if (!merchant) return;

      const merchantName =
        merchant.company_name ||
        merchant.contact_name ||
        "Marchand sans nom";

      const shopName = shop.name || "Boutique sans nom";

      const subscriptionPlan = normalize(shop.subscription_plan);
      const status = normalize(shop.status);
      const category = normalize(shop.category);

      /*
       * 1. Activation
       *
       * Une boutique en candidature ou en revue constitue une opportunité
       * de conversion/activation pour le gestionnaire Marketplace.
       */
      if (status === "application" || status === "review") {
        generated.push({
          id: `activation-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "activation",
          priority: status === "review" ? "high" : "medium",
          title:
            status === "review"
              ? "Boutique en attente de décision"
              : "Candidature à accompagner",
          description:
            status === "review"
              ? `${shopName} est actuellement en revue et peut nécessiter une intervention du Marketplace.`
              : `${shopName} est en candidature et nécessite un suivi pour progresser dans le parcours.`,
          recommendation:
            "Vérifier les éléments disponibles, identifier les blocages et définir la prochaine action avec le marchand.",
        });
      }

      /*
       * 2. Inactivité
       */
      if (status === "inactive") {
        generated.push({
          id: `inactive-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "performance",
          priority: "high",
          title: "Boutique inactive à réactiver",
          description:
            `${shopName} n'est plus active et représente une opportunité de réactivation.`,
          recommendation:
            "Analyser la cause de l'inactivité puis proposer un plan de reprise adapté au marchand.",
        });
      }

      /*
       * 3. Risque / suspension
       */
      if (status === "suspended") {
        generated.push({
          id: `risk-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "risk",
          priority: "high",
          title: "Boutique suspendue",
          description:
            `${shopName} est suspendue. Le compte marchand doit être examiné avant toute perspective de développement.`,
          recommendation:
            "Identifier le motif de suspension, vérifier les éléments attendus et coordonner la résolution avec les pôles concernés.",
        });
      }

      /*
       * 4. Abonnement / développement commercial
       *
       * On ne force pas de règle tarifaire métier ici : la page identifie
       * simplement les boutiques sans offre clairement renseignée.
       */
      if (
        status === "active" &&
        (!subscriptionPlan ||
          subscriptionPlan === "none" ||
          subscriptionPlan === "free")
      ) {
        generated.push({
          id: `subscription-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "subscription",
          priority: "medium",
          title: "Potentiel d'évolution d'abonnement",
          description:
            `${shopName} est active mais ne présente pas d'offre d'abonnement clairement renseignée.`,
          recommendation:
            "Évaluer les besoins du marchand et vérifier si une formule ou un add-on Marketplace apporte une valeur pertinente.",
        });
      }

      /*
       * 5. Données d'activité incomplètes
       */
      if (
        status === "active" &&
        (!shop.activity_type || !shop.activity_description)
      ) {
        generated.push({
          id: `documentation-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "documentation",
          priority: "medium",
          title: "Informations boutique incomplètes",
          description:
            `${shopName} ne dispose pas de toutes les informations d'activité attendues dans le dossier Marketplace.`,
          recommendation:
            "Compléter les informations d'activité avant d'utiliser ces données pour l'analyse commerciale ou la segmentation.",
        });
      }

      /*
       * 6. Développement par catégorie
       *
       * La catégorie est utilisée comme signal de segmentation, sans
       * inventer de métriques de performance absentes de la base.
       */
      if (
        status === "active" &&
        !category
      ) {
        generated.push({
          id: `development-${shop.id}`,
          merchantId,
          merchantName,
          shopId: shop.id,
          shopName,
          type: "development",
          priority: "low",
          title: "Segmentation à compléter",
          description:
            `${shopName} est active mais sa catégorie n'est pas renseignée.`,
          recommendation:
            "Compléter la catégorie afin de permettre une analyse cohérente du portefeuille et des opportunités.",
        });
      }
    });

    /*
     * 7. Opportunité au niveau marchand
     *
     * Un marchand possédant plusieurs boutiques actives peut être étudié
     * globalement pour un accompagnement commercial.
     */
    const shopsByMerchant = new Map<string, typeof shops>();

    shops.forEach((shop) => {
      if (!shop.merchant_id) return;

      const current = shopsByMerchant.get(shop.merchant_id) ?? [];
      current.push(shop);
      shopsByMerchant.set(shop.merchant_id, current);
    });

    shopsByMerchant.forEach((merchantShops, merchantId) => {
      const merchant = merchantMap.get(merchantId);
      if (!merchant) return;

      const activeShops = merchantShops.filter(
        (shop) => normalize(shop.status) === "active",
      );

      if (activeShops.length >= 2) {
        generated.push({
          id: `portfolio-${merchantId}`,
          merchantId,
          merchantName:
            merchant.company_name ||
            merchant.contact_name ||
            "Marchand sans nom",
          type: "development",
          priority: "medium",
          title: "Potentiel de développement portefeuille",
          description:
            `Le marchand dispose de ${activeShops.length} boutiques actives pouvant être analysées comme un portefeuille unique.`,
          recommendation:
            "Étudier les performances et besoins communs aux boutiques afin d'identifier les leviers de développement pertinents pour le marchand et pour BIB.",
        });
      }
    });

    return generated;
  }, [shops, merchantMap]);

  const filteredOpportunities = useMemo(() => {
    const query = normalize(search);

    return opportunities.filter((opportunity) => {
      const matchesSearch =
        !query ||
        normalize(opportunity.merchantName).includes(query) ||
        normalize(opportunity.shopName).includes(query) ||
        normalize(opportunity.title).includes(query) ||
        normalize(opportunity.description).includes(query);

      const matchesType =
        typeFilter === "all" || opportunity.type === typeFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        opportunity.priority === priorityFilter;

      const matchesStatus = (() => {
        if (statusFilter === "all") return true;

        if (!opportunity.shopId) return false;

        const shop = shops.find((item) => item.id === opportunity.shopId);
        if (!shop) return false;

        const status = normalize(shop.status);

        if (statusFilter === "active") return status === "active";
        if (statusFilter === "review") {
          return status === "application" || status === "review";
        }
        if (statusFilter === "inactive") {
          return status === "inactive" || status === "suspended";
        }

        return true;
      })();

      return (
        matchesSearch &&
        matchesType &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [
    opportunities,
    search,
    typeFilter,
    priorityFilter,
    statusFilter,
    shops,
  ]);

  const stats = useMemo(() => {
    const high = opportunities.filter(
      (item) => item.priority === "high",
    ).length;

    const medium = opportunities.filter(
      (item) => item.priority === "medium",
    ).length;

    const activation = opportunities.filter(
      (item) => item.type === "activation",
    ).length;

    const development = opportunities.filter(
      (item) =>
        item.type === "development" ||
        item.type === "subscription",
    ).length;

    return {
      total: opportunities.length,
      high,
      medium,
      activation,
      development,
    };
  }, [opportunities]);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPriorityFilter("all");
    setStatusFilter("all");
  };

  const hasFilters =
    search ||
    typeFilter !== "all" ||
    priorityFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Opportunités & développement</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Opportunités & développement
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Identifier les besoins des marchands et de leurs boutiques,
            prioriser les situations à traiter et repérer les leviers de
            développement utiles au marchand comme à BIB.
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
          label="Opportunités"
          value={stats.total}
          icon={Lightbulb}
        />

        <KpiCard
          label="Prioritaires"
          value={stats.high}
          icon={AlertTriangle}
          tone="danger"
        />

        <KpiCard
          label="À traiter"
          value={stats.medium}
          icon={BarChart3}
          tone="warning"
        />

        <KpiCard
          label="Activation"
          value={stats.activation}
          icon={Store}
        />

        <KpiCard
          label="Développement"
          value={stats.development}
          icon={CircleDollarSign}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un marchand, une boutique ou une opportunité..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <FilterSelect
            value={typeFilter}
            onChange={(value) =>
              setTypeFilter(value as "all" | OpportunityType)
            }
            options={[
              { value: "all", label: "Tous les types" },
              ...Object.entries(OPPORTUNITY_TYPE_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              ),
            ]}
          />

          <FilterSelect
            value={priorityFilter}
            onChange={(value) =>
              setPriorityFilter(
                value as "all" | OpportunityPriority,
              )
            }
            options={[
              { value: "all", label: "Toutes les priorités" },
              ...Object.entries(OPPORTUNITY_PRIORITY_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              ),
            ]}
          />

          <FilterSelect
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(
                value as
                  | "all"
                  | "active"
                  | "review"
                  | "inactive",
              )
            }
            options={[
              { value: "all", label: "Tous les statuts" },
              { value: "active", label: "Boutiques actives" },
              { value: "review", label: "En candidature / revue" },
              { value: "inactive", label: "Inactives / suspendues" },
            ]}
          />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Signaux détectés</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Les opportunités sont des signaux d'analyse et ne constituent
              pas automatiquement une action commerciale.
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {filteredOpportunities.length} résultat
            {filteredOpportunities.length > 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-medium">
              Aucune opportunité correspondant aux filtres
            </h3>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Modifiez les filtres ou réinitialisez la recherche pour
              consulter les autres signaux du portefeuille Marketplace.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredOpportunities.map((opportunity) => {
              const Icon = getTypeIcon(opportunity.type);

              return (
                <OpportunityRow
                  key={opportunity.id}
                  opportunity={opportunity}
                  icon={Icon}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityRow({
  opportunity,
  icon: Icon,
}: {
  opportunity: Opportunity;
  icon: typeof Lightbulb;
}) {
  return (
    <div className="p-5 transition hover:bg-muted/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{opportunity.title}</h3>

              <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {OPPORTUNITY_TYPE_LABELS[opportunity.type]}
              </span>

              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getPriorityClasses(
                  opportunity.priority,
                )}`}
              >
                {OPPORTUNITY_PRIORITY_LABELS[opportunity.priority]}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {opportunity.merchantName}
              </span>

              {opportunity.shopName && (
                <span className="inline-flex items-center gap-1">
                  <Store className="h-3.5 w-3.5" />
                  {opportunity.shopName}
                </span>
              )}
            </div>

            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              {opportunity.description}
            </p>

            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">Recommandation : </span>
              <span className="text-muted-foreground">
                {opportunity.recommendation}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 xl:pt-1">
          <Link
            to={`/pole/marketplace/merchants/${opportunity.merchantId}`}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Marchand
            <ArrowRight className="h-4 w-4" />
          </Link>

          {opportunity.shopId && (
            <Link
              to={`/pole/marketplace/stores/${opportunity.shopId}`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Boutique
              <Store className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
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
  icon: typeof Lightbulb;
  tone?: "default" | "danger" | "warning";
}) {
  const iconClass =
    tone === "danger"
      ? "text-red-600"
      : tone === "warning"
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>

        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>

      <div className="mt-2 text-2xl font-semibold">{value}</div>
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
        className="h-10 min-w-[170px] appearance-none rounded-lg border bg-background py-2 pl-3 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
