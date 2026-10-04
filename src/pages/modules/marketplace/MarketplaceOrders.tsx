import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  Package,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

import { useOrders, type Order, type OrderStatus } from "@/hooks/useOps";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "Préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700",
  confirmed:
    "border-blue-200 bg-blue-50 text-blue-700",
  processing:
    "border-violet-200 bg-violet-50 text-violet-700",
  shipped:
    "border-cyan-200 bg-cyan-50 text-cyan-700",
  delivered:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:
    "border-red-200 bg-red-50 text-red-700",
};

type StatusFilter = "all" | OrderStatus;

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCurrency(
  amount: number,
  currency = "EUR",
) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function MarketplaceOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<StatusFilter>("all");

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useOrders();

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (
        status !== "all" &&
        order.status !== status
      ) {
        return false;
      }

      if (!query) return true;

      return [
        order.order_number,
        order.shop_name,
        order.shop_code,
        order.shipping_method,
        order.tracking_number,
        order.region,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [orders, search, status]);

  const stats = useMemo(() => {
    const total = orders.length;

    const inProgress = orders.filter((order) =>
      [
        "pending",
        "confirmed",
        "processing",
        "shipped",
      ].includes(order.status),
    ).length;

    const delivered = orders.filter(
      (order) => order.status === "delivered",
    ).length;

    const cancelled = orders.filter(
      (order) => order.status === "cancelled",
    ).length;

    const totalValue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce(
        (sum, order) =>
          sum + Number(order.total_amount ?? 0),
        0,
      );

    return {
      total,
      inProgress,
      delivered,
      cancelled,
      totalValue,
    };
  }, [orders]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
  };

  const hasFilters =
    Boolean(search) || status !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          <span>Marketplace</span>
          <span>/</span>
          <span>Commandes</span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Commandes
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Vue commerciale des commandes Marketplace : activité,
          valeur des commandes, boutiques concernées et état
          d'avancement. Les opérations logistiques détaillées restent
          gérées par le pôle Ops.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Commandes"
          value={stats.total}
          icon={ShoppingBag}
        />

        <KpiCard
          label="En cours"
          value={stats.inProgress}
          icon={Clock3}
          tone="warning"
        />

        <KpiCard
          label="Livrées"
          value={stats.delivered}
          icon={CheckCircle2}
          tone="success"
        />

        <KpiCard
          label="Annulées"
          value={stats.cancelled}
          icon={AlertCircle}
          tone="danger"
        />

        <KpiCard
          label="Valeur commerciale"
          value={formatCurrency(stats.totalValue)}
          icon={Package}
        />
      </div>

      {/* Scope */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="font-semibold">
              Lecture Marketplace
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cette page permet au pôle Marketplace de suivre
              l'activité commerciale des commandes. Elle ne remplace
              pas le pipeline opérationnel : préparation, stock,
              expédition, transport et incidents restent sous la
              responsabilité d'Ops.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Commandes Marketplace
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Recherchez une commande, une boutique ou une référence
            de livraison.
          </p>
        </div>

        <div className="border-b bg-muted/20 p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Rechercher une commande, boutique, SKU, suivi..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as StatusFilter,
                  )
                }
                className="h-10 min-w-[220px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">
                  Tous les statuts
                </option>

                <option value="pending">
                  En attente
                </option>

                <option value="confirmed">
                  Confirmées
                </option>

                <option value="processing">
                  En préparation
                </option>

                <option value="shipped">
                  Expédiées
                </option>

                <option value="delivered">
                  Livrées
                </option>

                <option value="cancelled">
                  Annulées
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <AlertCircle className="h-9 w-9 text-destructive" />

            <h3 className="mt-4 font-medium">
              Impossible de charger les commandes
            </h3>

            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Une erreur est survenue lors du chargement des commandes."}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          filteredOrders.length === 0 && (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <ShoppingBag className="h-9 w-9 text-muted-foreground" />

              <h3 className="mt-4 font-medium">
                Aucune commande trouvée
              </h3>

              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Aucune commande ne correspond aux critères actuels.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

        {/* Table */}
        {!isLoading &&
          !isError &&
          filteredOrders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Commande
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Boutique
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Client
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Montant
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Statut
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Commandée le
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Livraison
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
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

function OrderRow({
  order,
}: {
  order: Order;
}) {
  return (
    <tr className="transition hover:bg-muted/20">
      {/* Order */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <div className="font-mono text-xs font-semibold">
              {order.order_number}
            </div>

            {order.platform_id && (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Plateforme : {order.platform_id}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Shop */}
      <td className="px-5 py-4">
        {order.shop_id ? (
          <Link
            to={`/pole/marketplace/stores/${order.shop_id}`}
            className="group"
          >
            <div className="font-medium group-hover:text-primary">
              {order.shop_name || "Boutique"}
            </div>

            {order.shop_code && (
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {order.shop_code}
              </div>
            )}
          </Link>
        ) : (
          <span className="text-muted-foreground">
            Non rattachée
          </span>
        )}
      </td>

      {/* Customer */}
      <td className="px-5 py-4">
        {order.customer_id ? (
          <div>
            <div className="font-medium">
              Client
            </div>

            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {order.customer_id}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">
            Non identifié
          </span>
        )}
      </td>

      {/* Amount */}
      <td className="px-5 py-4">
        <span className="font-medium">
          {formatCurrency(
            Number(order.total_amount ?? 0),
            order.currency,
          )}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
            STATUS_CLASSES[order.status]
          }`}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-muted-foreground">
        {formatDate(
          order.ordered_at ??
            order.created_at,
        )}
      </td>

      {/* Shipping */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />

          <div>
            <div className="text-sm">
              {order.shipping_method ||
                "Standard"}
            </div>

            {order.tracking_number && (
              <div className="font-mono text-[11px] text-muted-foreground">
                {order.tracking_number}
              </div>
            )}
          </div>
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
  value: string | number;
  icon: typeof ShoppingBag;
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

        <Icon
          className={`h-4 w-4 ${iconClass}`}
        />
      </div>

      <div className="mt-2 text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}
