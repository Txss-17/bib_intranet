import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type RestockStatus =
  | "requested"
  | "approved"
  | "ordered"
  | "received"
  | "rejected"
  | "cancelled";

export type RestockView = "requested" | "history";

export interface PlatformRestockRequest {
  id: string;
  platform_request_id: string;
  product_id: string;
  platform_product_id: string;
  platform_supplier_product_id: string;
  platform_boutique_id: string;
  boutique_name: string | null;
  product_name: string;
  requested_quantity: number;
  catalog_moq: number;
  status: RestockStatus;
  note: string | null;
  review_comment: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  platform_synced_at: string;
  products: { name: string; sku: string | null } | null;
}

export function usePlatformRestockRequests(view: RestockView) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["platform-restock-requests", user?.id, view],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async (): Promise<PlatformRestockRequest[]> => {
      // Migration 0030 is newer than the generated Supabase types.
      let request = supabase
        .from("platform_stock_restock_requests" as never)
        .select(
          "id,platform_request_id,product_id,platform_product_id,platform_supplier_product_id,platform_boutique_id,boutique_name,product_name,requested_quantity,catalog_moq,status,note,review_comment,version,created_at,updated_at,platform_synced_at,products(name,sku)",
        );
      request =
        view === "requested"
          ? request.eq("status", "requested")
          : request.neq("status", "requested");
      const { data, error } = await request
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as PlatformRestockRequest[];
    },
  });
}
