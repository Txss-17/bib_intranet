import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Filter,
  Mail,
  Search,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

import { useMarketplaceCustomers } from "@/hooks/useMarketplace";

type CustomerFilter = "all" | "active" | "high_value";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(
  value: number,
  currency = "EUR",
) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function MarketplaceCustomers() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<CustomerFilter>("all");

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
  } = useMarketplaceCustomers(search);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (filter === "active") {
        return customer.last_order_date
          ? Date.now() -
              new Date(
                customer.last_order_date,
              ).getTime() <=
              90 * 24 * 60 * 60 * 1000
          : false;
      }

      if (filter === "high_value") {
        return customer.total_spent >= 250;
      }

      return true;
    });
  }, [customers, filter]);

  const stats = useMemo(() => {
    const total = customers.length;

    const active = customers.filter(
      (customer) => {
        if (!customer.last_order_date) {
          return false;
        }

        return (
          Date.now() -
            new Date(
              customer.last_order_date,
            ).getTime() <=
          90 * 24 * 60 * 60 * 1000
        );
      },
    ).length;

    const highValue = customers.filter(
      (customer) =>
        customer.total_spent >= 250,
    ).length;

    const totalRevenue = customers.reduce(
      (sum, customer) =>
        sum + customer.total_spent,
      0,
    );

    const totalOrders = customers.reduce(
      (sum, customer) =>
        sum + customer.order_count,
      0,
    );

    return {
      total,
      active,
      highValue,
      totalRevenue,
      totalOrders,
    };
  }, [customers]);

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  const hasFilters =
    Boolean(search) || filter !== "all";

  const handleContactCustomer = (
    customer: {
      contact_name: string | null;
      contact_email: string | null;
    },
  ) => {
    if (!customer.contact_email) {
      return;
    }

    navigate("/modules/gateway/compose", {
      state: {
        to: customer.contact_email,
        recipientName:
          customer.contact_name ||
          customer.contact_email,
        subject: "Contact client — Marketplace",
        message: `Bonjour ${
          customer.contact_name || ""
        },

Je vous contacte au nom de B.I.B concernant votre activité sur la Marketplace.

Bien cordialement,
`,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Clients</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Clients
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue commerciale des clients ayant
            effectué au moins une commande sur la
            marketplace. Cette vue sert à comprendre
            l'activité client, la valeur commerciale
            et les comportements d'achat.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Clients"
          value={stats.total}
          icon={Users}
        />

        <KpiCard
          label="Actifs 90 jours"
          value={stats.active}
          icon={Users}
          tone="success"
        />

        <KpiCard
          label="Clients forte valeur"
          value={stats.highValue}
          icon={Users}
          tone="warning"
        />

        <KpiCard
          label="Commandes"
          value={stats.totalOrders}
          icon={ShoppingBag}
        />

        <KpiCard
          label="CA des clients"
          value={formatCurrency(
            stats.totalRevenue,
          )}
          icon={ShoppingBag}
        />
      </div>

      {/* Scope */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="font-semibold">
              Lecture client Marketplace
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              La Marketplace analyse ici les clients
              ayant réellement commandé. Les données
              sont agrégées depuis les commandes
              enregistrées dans BIB. Les comptes
              marchands rattachés à une boutique sont
              exclus de cette vue afin de séparer le
              périmètre marchand du périmètre client.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Base clients
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Recherchez un client ou segmentez la base
            selon son activité.
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
                placeholder="Rechercher par nom ou adresse e-mail..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(
                    event.target
                      .value as CustomerFilter,
                  )
                }
                className="h-10 min-w-[220px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">
                  Tous les clients
                </option>

                <option value="active">
                  Actifs sur 90 jours
                </option>

                <option value="high_value">
                  Forte valeur ≥ 250 €
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
        {isLoading && (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4, 5].map(
              (item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-lg bg-muted"
                />
              ),
            )}
          </div>
        )}

        {/* Error */}
        {!isLoading && isError && (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <Users className="h-9 w-9 text-destructive" />

            <h3 className="mt-4 font-medium">
              Impossible de charger les clients
            </h3>

            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Une erreur est survenue lors du chargement des données clients."}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading &&
          !isError &&
          filteredCustomers.length === 0 && (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <Users className="h-9 w-9 text-muted-foreground" />

              <h3 className="mt-4 font-medium">
                Aucun client trouvé
              </h3>

              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Aucun client ne correspond aux critères
                actuels.
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
          )}

        {/* Table */}
        {!isLoading &&
          !isError &&
          filteredCustomers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-sm">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Client
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Commandes
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Dépenses
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Dernière commande
                    </th>

                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Client depuis
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                      Contact
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredCustomers.map(
                    (customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        onContact={
                          handleContactCustomer
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}

function CustomerRow({
  customer,
  onContact,
}: {
  customer: {
    id: string;
    contact_name: string | null;
    contact_email: string | null;
    created_at: string | null;
    last_order_date: string | null;
    order_count: number;
    total_spent: number;
    currency: string;
  };
  onContact: (customer: {
    contact_name: string | null;
    contact_email: string | null;
  }) => void;
}) {
  const displayName =
    customer.contact_name ||
    customer.contact_email ||
    "Client sans nom";

  const isHighValue =
    customer.total_spent >= 250;

  return (
    <tr className="transition hover:bg-muted/20">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-background">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="font-medium">
              {displayName}
            </div>

            {customer.contact_email && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {customer.contact_email}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-medium">
          {customer.order_count}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatCurrency(
              customer.total_spent,
              customer.currency,
            )}
          </span>

          {isHighValue && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Forte valeur
            </span>
          )}
        </div>
      </td>

      <td className="px-5 py-4 text-muted-foreground">
        {formatDate(
          customer.last_order_date,
        )}
      </td>

      <td className="px-5 py-4 text-muted-foreground">
        {formatDate(customer.created_at)}
      </td>

      <td className="px-5 py-4 text-right">
        {customer.contact_email ? (
          <button
            type="button"
            onClick={() =>
              onContact(customer)
            }
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Mail className="h-3.5 w-3.5" />
            Contacter
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            —
          </span>
        )}
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
  icon: typeof Users;
  tone?: "default" | "success" | "warning";
}) {
  const iconClass =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
        ? "text-amber-600"
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
```
