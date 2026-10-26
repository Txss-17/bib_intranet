import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  CustomizationCapabilities,
  CustomizationTerms,
} from "@/lib/productCustomization";

export interface QualifiedCatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  status: string;
  moq: number | null;
  selling_price: number | null;
  currency: string | null;
  suppliers: { name: string } | null;
  updated_at: string;
  platform_publish_status: string | null;
  platform_id: string | null;
  customization_capabilities?: unknown;
  customization_terms?: unknown;
}
export interface CustomizationReviewRequest {
  id: string;
  version: number;
  intranet_product_id: string;
  merchant_config: Record<string, string>;
  supplier_status: string;
  supplier_comment: string | null;
  source_updated_at: string;
  products: { name: string } | null;
}
export function useQualifiedCatalog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["validated-products", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<QualifiedCatalogProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*,suppliers(name)")
        .in("status", ["validated", "approved", "active"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as QualifiedCatalogProduct[];
    },
  });
}
export function useSaveCatalogCustomization() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      productId: string;
      capabilities: CustomizationCapabilities;
      terms: CustomizationTerms;
    }) => {
      // The generated schema predates migration 0029; the RPC payload is defined above and checked on the server.
      const { data, error } = await supabase.rpc(
        "save_catalog_customization" as never,
        {
          p_product_id: input.productId,
          p_capabilities: input.capabilities,
          p_terms: input.terms,
        } as never,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["validated-products"] });
      void cache.invalidateQueries({ queryKey: ["product-lifecycle"] });
    },
  });
}
export function useCustomizationReviewRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["customization-review-requests", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CustomizationReviewRequest[]> => {
      const { data, error } = await supabase
        .from("platform_customization_requests" as never)
        .select(
          "id,version,intranet_product_id,merchant_config,supplier_status,supplier_comment,source_updated_at,products(name)",
        )
        .neq("supplier_status", "not_requested")
        .order("source_updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as CustomizationReviewRequest[];
    },
  });
}
