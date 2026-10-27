import { z } from "npm:zod@3";
import {
  parseCustomizationCapabilities,
  parseCustomizationTerms,
  parseCatalogDetails,
} from "./customization-contract.ts";

const Product = z.object({
  id: z.string().uuid(),
  platform_id: z.string().uuid().nullish(),
  updated_at: z.string().datetime({ offset: true }),
  name: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(100),
  selling_price: z.number().finite().min(0),
  description: z.string().max(5000).nullish(),
  image_url: z.string().url().nullish(),
  moq: z.number().int().min(1).nullish(),
  margin: z.number().int().min(0).max(1000).nullish(),
});

export function supplierProductPayload(input: unknown) {
  const product = Product.parse(input);
  const source = input as Record<string, unknown>;
  const capabilities = parseCustomizationCapabilities(
    source.customization_capabilities,
  );
  const terms = parseCustomizationTerms(source.customization_terms);
  const details = parseCatalogDetails({
    origin: source.origin,
    weight: source.weight,
    dimensions: source.dimensions,
    ingredients: source.ingredients,
    shelf_life: source.shelf_life,
    gallery: source.gallery,
  });
  return {
    type: "supplier_product" as const,
    data: {
      intranet_id: product.id,
      ...(product.platform_id ? { platform_id: product.platform_id } : {}),
      source_updated_at: product.updated_at,
      name: product.name,
      category: product.category,
      base_price: product.selling_price,
      description: product.description ?? null,
      image_url: product.image_url ?? null,
      ...(product.moq == null ? {} : { moq: product.moq }),
      ...(product.margin == null ? {} : { max_margin_percent: product.margin }),
      // A country of origin is not a commercial deployment zone.
      market: "EU",
      customization_capabilities: capabilities,
      customization_terms: terms,
      catalog_details: details,
      is_active: true,
    },
  };
}

export function canUsePlatformBridge(
  action: string,
  leadership: boolean,
  poles: string[],
) {
  if (action === "review_customization" || action === "review_restock")
    return (
      leadership ||
      poles.includes("tech") ||
      poles.includes("supplier") ||
      poles.includes("product")
    );
  if (action === "assign_shipment")
    return leadership || poles.includes("tech") || poles.includes("ops");
  const manage =
    leadership || poles.includes("tech") || poles.includes("marketplace");
  return (
    manage ||
    (poles.includes("supplier") && ["status", "push_product"].includes(action))
  );
}
