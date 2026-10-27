import { useMemo, useState } from "react";
import { Package, Search, Settings2, Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useQualifiedCatalog,
  type QualifiedCatalogProduct,
} from "@/hooks/useCatalogCustomization";
import { usePlatformActions } from "@/hooks/usePlatformSync";
import { usePermissions } from "@/hooks/usePermissions";
import { getPageByPath } from "@/data/permissionMatrix";
import {
  parseCustomizationCapabilities,
  hasCustomization,
} from "@/lib/productCustomization";
import { CatalogCustomizationDialog } from "@/components/product/CatalogCustomizationDialog";
import { CustomizationReviewQueue } from "@/components/product/CustomizationReviewQueue";
import { RestockReviewQueue } from "@/components/product/RestockReviewQueue";

const qualified = (product: QualifiedCatalogProduct) => {
  try {
    return hasCustomization(
      parseCustomizationCapabilities(product.customization_capabilities),
    );
  } catch {
    return false;
  }
};
export default function ValidatedProducts() {
  const query = useQualifiedCatalog();
  const { pushProduct } = usePlatformActions();
  const permissions = usePermissions();
  const page = getPageByPath("/pole/supplier/validated");
  const canUpdate = !!page && permissions.can(page.id, "update");
  const canPublish = !!page && permissions.can(page.id, "publish");
  const canReview = !!page && permissions.can(page.id, "validate");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<QualifiedCatalogProduct | null>(
    null,
  );
  const products = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(
    () =>
      products.filter((product) => {
        const text = [
          product.name,
          product.sku,
          product.category,
          product.suppliers?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("fr");
        return (
          text.includes(search.trim().toLocaleLowerCase("fr")) &&
          (filter === "all" ||
            (filter === "customizable" && qualified(product)) ||
            (filter === "unqualified" && !qualified(product)))
        );
      }),
    [products, search, filter],
  );
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-secondary p-3">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Produits validés</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Catalogue fournisseur, capacités de personnalisation et
              transmission à BIB Platform.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Références validées", products.length],
          ["Personnalisation qualifiée", products.filter(qualified).length],
          [
            "Transmises à Platform",
            products.filter(
              (product) => product.platform_publish_status === "published",
            ).length,
          ],
        ].map(([label, value]) => (
          <div key={label} className="enterprise-card p-5">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {query.isLoading ? "…" : query.isError ? "—" : value}
            </p>
          </div>
        ))}
      </section>
      <div className="enterprise-card flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            aria-label="Rechercher un produit validé"
            placeholder="Produit, SKU, catégorie ou fournisseur…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrer les capacités"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">Toutes les références</option>
          <option value="customizable">Personnalisation qualifiée</option>
          <option value="unqualified">Capacités à qualifier</option>
        </select>
      </div>
      {query.isLoading ? (
        <p
          role="status"
          className="enterprise-card p-6 text-sm text-muted-foreground"
        >
          Chargement du catalogue…
        </p>
      ) : query.isError ? (
        <div
          role="alert"
          className="enterprise-card p-6 text-sm text-destructive"
        >
          Le catalogue n’a pas pu être chargé. Réessayez ; aucune liste fictive
          ne remplace les données du serveur.
        </div>
      ) : !filtered.length ? (
        <div className="enterprise-card p-10 text-center text-sm text-muted-foreground">
          Aucune référence validée ne correspond aux filtres dans votre
          périmètre.
        </div>
      ) : (
        <div className="enterprise-card overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
              <tr>
                {[
                  "Produit",
                  "Fournisseur",
                  "Tarif catalogue",
                  "MOQ",
                  "Personnalisation",
                  "Actions",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="px-4 py-4">
                    <p className="font-medium">{product.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.sku ?? "SKU non renseigné"}
                      {product.category ? " · " + product.category : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {product.suppliers?.name ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    {product.selling_price != null && product.currency
                      ? new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: product.currency,
                        }).format(product.selling_price)
                      : "À confirmer"}
                  </td>
                  <td className="px-4 py-4">{product.moq ?? "À confirmer"}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {qualified(product)
                        ? "Options qualifiées"
                        : "À qualifier"}
                    </span>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {product.platform_publish_status === "published"
                        ? "Transmis à Platform"
                        : "À transmettre"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canUpdate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(product)}
                        >
                          <Settings2 className="mr-1.5 h-4 w-4" />
                          Capacités
                        </Button>
                      )}
                      {canPublish && (
                        <Button
                          size="sm"
                          disabled={pushProduct.isPending}
                          onClick={() => pushProduct.mutate(product.id)}
                        >
                          <Send className="mr-1.5 h-4 w-4" />
                          Transmettre
                        </Button>
                      )}
                      {!canUpdate && !canPublish && (
                        <span className="text-xs text-muted-foreground">
                          Lecture seule
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CustomizationReviewQueue canReview={canReview} />
      <RestockReviewQueue canReview={canReview} />
      <CatalogCustomizationDialog
        product={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
