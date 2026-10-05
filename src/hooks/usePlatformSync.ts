import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformSyncRun {
  id: string;
  direction: string;
  action: string;
  triggered_by: string | null;
  status: "running" | "success" | "partial" | "error" | string;
  items_count: number | null;
  errors: unknown;
  started_at: string;
  finished_at: string | null;
}

interface PlatformStatus {
  configured: boolean;
}

interface PlatformSyncResponse {
  success?: boolean;
  status?: "success" | "partial" | "error" | string;
  items?: number;
  errors?: unknown[];
  error?: string;
}

const invokePlatformBridge = async (
  body: Record<string, unknown>,
): Promise<PlatformSyncResponse> => {
  const { data, error } = await supabase.functions.invoke(
    "platform-bridge",
    {
      body,
    },
  );

  if (error) {
    let message = error.message;

    try {
      const context = await (error as any).context?.json?.();

      if (context?.error) {
        message =
          typeof context.error === "string"
            ? context.error
            : JSON.stringify(context.error);
      }
    } catch {
      // Ignore invalid/non-JSON error responses.
    }

    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : JSON.stringify(data.error),
    );
  }

  return data as PlatformSyncResponse;
};

/**
 * État de configuration de la liaison BIB Platform ↔ BIB Intranet.
 */
export const usePlatformStatus = () =>
  useQuery<PlatformStatus>({
    queryKey: ["platform-bridge-status"],
    queryFn: async () => {
      const data = await invokePlatformBridge({
        action: "status",
      });

      return {
        configured: Boolean(data?.configured),
      };
    },
    retry: false,
  });

/**
 * Historique des synchronisations.
 *
 * L'historique est volontairement limité au résultat opérationnel
 * de chaque synchronisation :
 * - statut
 * - nombre d'éléments
 * - erreurs
 * - dates
 *
 * Les données détaillées transmises par BIB Platform ne sont pas
 * exposées dans ce hook.
 */
export const usePlatformSyncRuns = () =>
  useQuery<PlatformSyncRun[]>({
    queryKey: ["platform-sync-runs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("platform_sync_runs")
        .select(
          [
            "id",
            "direction",
            "action",
            "triggered_by",
            "status",
            "items_count",
            "errors",
            "started_at",
            "finished_at",
          ].join(", "),
        )
        .order("started_at", {
          ascending: false,
        })
        .limit(20);

      if (error) {
        throw error;
      }

      return (data ?? []) as PlatformSyncRun[];
    },
  });

/**
 * Invalidation des données susceptibles d'avoir changé après
 * une synchronisation Platform → Intranet.
 */
const invalidatePlatformData = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["platform-sync-runs"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["shops"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["orders"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["products"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["validated-products"],
    }),
    queryClient.invalidateQueries({
      queryKey: ["marketplace-favorites"],
    }),
  ]);
};

/**
 * Actions disponibles pour la liaison BIB Platform.
 */
export const usePlatformActions = () => {
  const queryClient = useQueryClient();

  const onError = (error: Error) => {
    toast.error("Liaison B.I.B Platform", {
      description: error.message,
    });
  };

  const onSettled = async () => {
    await invalidatePlatformData(queryClient);
  };

  const pull = useMutation({
    mutationFn: async () => {
      return invokePlatformBridge({
        action: "pull",
      });
    },

    onSuccess: async (result) => {
      const status = result.status ?? "success";
      const items = result.items ?? 0;
      const errors = Array.isArray(result.errors)
        ? result.errors
        : [];

      if (status === "success") {
        toast.success("Synchronisation terminée", {
          description:
            items === 1
              ? "1 élément synchronisé."
              : `${items} éléments synchronisés.`,
        });
      } else if (status === "partial") {
        toast.warning("Synchronisation partielle", {
          description:
            errors.length > 0
              ? `${items} élément(s) traité(s), ${errors.length} anomalie(s).`
              : `${items} élément(s) traité(s) avec des anomalies.`,
        });
      } else {
        toast.error("Synchronisation en erreur", {
          description:
            errors.length > 0
              ? `${errors.length} erreur(s) détectée(s).`
              : "La synchronisation n'a pas pu être terminée.",
        });
      }

      await invalidatePlatformData(queryClient);
    },

    onError,

    onSettled,
  });

  const pushProduct = useMutation({
    mutationFn: async (productId: string) => {
      return invokePlatformBridge({
        action: "push_product",
        product_id: productId,
      });
    },

    onSuccess: async (result) => {
      const status = result.status ?? "success";

      if (status === "success") {
        toast.success("Produit transmis à B.I.B Platform");
      } else if (status === "partial") {
        toast.warning("Transmission partielle", {
          description: "Le produit a été traité avec une anomalie.",
        });
      } else {
        toast.error("Transmission en erreur", {
          description:
            "Le produit n'a pas pu être transmis correctement.",
        });
      }

      await invalidatePlatformData(queryClient);
    },

    onError,

    onSettled,
  });

  const pushShopStatus = useMutation({
    mutationFn: async ({
      shopId,
      status,
    }: {
      shopId: string;
      status: string;
    }) => {
      return invokePlatformBridge({
        action: "push_shop_status",
        shop_id: shopId,
        status,
      });
    },

    onSuccess: async (result) => {
      const status = result.status ?? "success";

      if (status === "success") {
        toast.success("Statut de la boutique transmis");
      } else if (status === "partial") {
        toast.warning("Transmission partielle", {
          description:
            "Le statut de la boutique a été traité avec une anomalie.",
        });
      } else {
        toast.error("Transmission en erreur", {
          description:
            "Le statut de la boutique n'a pas pu être transmis correctement.",
        });
      }

      await invalidatePlatformData(queryClient);
    },

    onError,

    onSettled,
  });

  return {
    pull,
    pushProduct,
    pushShopStatus,
  };
};
