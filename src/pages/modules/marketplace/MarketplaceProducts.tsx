import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Filter,
  Package,
  Search,
  Store,
  UsersRound,
  X,
} from "lucide-react";

import {
  useMarketplaceMerchants,
  useMarketplaceShops,
} from "@/hooks/useMarketplace";

type ProductStatus = "active" | "inactive" | "draft" | "unknown";

type ProductView = {
  id: string;
  name: string;
  sku: string | null;
  status: ProductStatus;
  category: string;
  shopId: string | null;
  shopName: string | null;
  merchantId: string | null;
  merchantName: string | null;
};

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getStatusLabel(status: ProductStatus) {
  switch (status) {
    case "active":
      return "Actif";
    case "inactive":
      return "Inactif";
    case "draft":
      return "Brouillon";
    default:
      return "Non renseigné";
  }
}

function getStatusClasses(status: ProductStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive":
      return "bg-slate-50 text-slate-600 border-slate-200";
    case "draft":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function resolveProductStatus(product: any): ProductStatus {
  const status = normalize(
    product.status ??
      product.product_status ??
      product.lifecycle_status,
  );

  if (
    status === "active" ||
    status === "published" ||
    status === "available"
  ) {
    return "active";
  }

  if (
    status === "inactive" ||
    status === "archived" ||
    status === "disabled"
  ) {
    return "inactive";
  }

  if (
    status === "draft" ||
    status === "pending"
  ) {
    return "draft";
  }

  return "unknown";
}

export default function MarketplaceProducts() {
  const {
    data: merchants = [],
    isLoading: merchantsLoading,
  } = useMarketplaceMerchants();

  const {
    data: shops = [],
    isLoading: shopsLoading,
  } = useMarketplaceShops();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | ProductStatus>("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

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

  /*
   * Important:
   *
   * The current Marketplace hooks do not necessarily expose a unified
   * product catalogue yet. We therefore build the page around the
   * product information that may already be attached to marketplace
   * shop records, without inventing a second product schema here.
   *
   * When the canonical product/catalog hook is connected, this mapping
   * should be replaced by that hook rather than duplicating product data.
   */
  const products = useMemo<ProductView[]>(() => {
    const result: ProductView[] = [];

    shops.forEach((shop: any) => {
      const shopProducts =
        Array.isArray(shop.products)
          ? shop.products
          : [];

      shopProducts.forEach((product: any) => {
        const merchant = shop.merchant_id
          ? merchantMap.get(shop.merchant_id)
          : undefined;

        result.push({
          id:
            String(product.id ?? "") ||
            `${shop.id}-${product.name ?? "product"}`,
          name:
            product.name ||
            product.product_name ||
            "Produit sans nom",
          sku:
            product.sku ||
            product.product_sku ||
            null,
          status: resolveProductStatus(product),
          category:
            product.category ||
            shop.category ||
            "Non catégorisée",
          shopId: shop.id,
          shopName: shop.name || null,
          merchantId: shop.merchant_id || null,
          merchantName:
            merchant?.company_name ||
            merchant?.contact_name ||
            null,
        });
      });
    });

    return result;
  }, [shops, merchantMap]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter(Boolean),
      ),
    ).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = normalize(search);

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        normalize(product.name).includes(query) ||
        normalize(product.sku).includes(query) ||
        normalize(product.shopName).includes(query) ||
        normalize(product.merchantName).includes(query) ||
        normalize(product.category).includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        product.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        product.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    statusFilter,
    categoryFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter(
        (product) => product.status === "active",
      ).length,
      inactive: products.filter(
        (product) => product.status === "inactive",
      ).length,
      draft: products.filter(
        (product) => product.status === "draft",
      ).length,
      shops: new Set(
        products
          .map((product) => product.shopId)
          .filter(Boolean),
      ).size,
    };
  }, [products]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const hasFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Marketplace</span>
            <span>/</span>
            <span>Produits</span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Produits
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Vue Marketplace du catalogue produit : découverte, rattachement
            aux boutiques et lecture commerciale. Le stock, la préparation,
            les mouvements et la logistique restent pilotés par Ops.
          </p>
        </div>

        <Link
          to="/pole/marketplace/stores"
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Store className="h-4 w-4" />
          Voir les boutiques
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Produits"
          value={stats.total}
          icon={Package}
        />

        <KpiCard
          label="Actifs"
          value={stats.active}
          icon={Package}
          tone="success"
        />

        <KpiCard
          label="Inactifs"
          value={stats.inactive}
          icon={Package}
        />

        <KpiCard
          label="Brouillons"
          value={stats.draft}
          icon={Package}
          tone="warning"
        />

        <KpiCard
          label="Boutiques concernées"
          value={stats.shops}
          icon={Store}
        />
      </div>

      {/* Catalogue scope */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </div>

          <div>
            <h2 className="font-semibold">
              Lecture commerciale du catalogue
            </h2>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Marketplace utilise cette vue pour comprendre quels produits
              sont exposés par quels marchands et quelles boutiques. Les
              décisions de stock et d'exécution opérationnelle ne sont pas
              prises depuis cette page.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">
            Catalogue Marketplace
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Recherchez et segmentez les produits disponibles dans le
            périmètre Marketplace.
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
                placeholder="Rechercher un produit, SKU, boutique ou marchand..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={(value) =>
                setStatusFilter(
                  value as "all" | ProductStatus,
                )
              }
              options={[
                {
                  value: "all",
                  label: "Tous les statuts",
                },
                {
                  value: "active",
                  label: "Actifs",
                },
                {
                  value: "inactive",
                  label: "Inactifs",
                },
                {
                  value: "draft",
                  label: "Brouillons",
                },
              ]}
            />

            <FilterSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                {
                  value: "all",
                  label: "Toutes les catégories",
                },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
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
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <Package className="h-9 w-9 text-muted-foreground" />

            <h3 className="mt-4 font-medium">
              Aucun produit disponible dans cette vue
            </h3>

            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Soit aucun produit n'est actuellement rattaché aux boutiques
              exposées par le hook Marketplace, soit les filtres ne
              correspondent à aucun résultat.
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    Produit
                  </th>

                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                    SKU
                  </th>

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

                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
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

function ProductRow({
  product,
}: {
  product: ProductView;
}) {
  return (
    <tr className="transition hover:bg-muted/20">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>

          <span className="font-medium">
            {product.name}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-mono text-xs text-muted-foreground">
          {product.sku || "—"}
        </span>
      </td>

      <td className="px-5 py-4">
        {product.shopId ? (
          <Link
            to={`/pole/marketplace/stores/${product.shopId}`}
            className="font-medium hover:underline"
          >
            {product.shopName}
          </Link>
        ) : (
          <span className="text-muted-foreground">
            Non rattachée
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        {product.merchantId ? (
          <Link
            to={`/pole/marketplace/merchants/${product.merchantId}`}
            className="font-medium hover:underline"
          >
            {product.merchantName}
          </Link>
        ) : (
          <span className="text-muted-foreground">
            Non rattaché
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="text-muted-foreground">
          {product.category}
        </span>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
            product.status,
          )}`}
        >
          {getStatusLabel(product.status)}
        </span>
      </td>

      <td className="px-5 py-4 text-right">
        {product.shopId ? (
          <Link
            to={`/pole/marketplace/stores/${product.shopId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Boutique
          </Link>
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
  value: number;
  icon: typeof Package;
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
        className="h-10 min-w-[200px] appearance-none rounded-lg border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
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
