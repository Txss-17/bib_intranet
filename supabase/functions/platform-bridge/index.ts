import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import {
  canUsePlatformBridge,
  supplierProductPayload,
} from "../_shared/platform-payloads.ts";

import { parseRestockRequest, restockMirrorPayload, assertRestockReview } from "../_shared/restock-contract.ts";

// Validate ownership identities before any merchant or shop mutation.
const OwnershipSnapshot = z.object({
  merchants_complete: z.literal(true),
  boutiques_complete: z.literal(true),
  snapshot_at: z.string().datetime({ offset: true }),
  merchants: z.array(z.object({ id: z.string().uuid() }).passthrough()),
  boutiques: z.array(z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
  }).passthrough()),
});

const SavHandoff = z.object({
 issue_id: z.string().uuid(),
 order_id: z.string().uuid(),
 boutique_id: z.string().uuid(),
 merchant_id: z.string().uuid(),
 due_at: z.string().datetime({ offset: true }),
 escalated_at: z.string().datetime({ offset: true }),
 environment: z.enum(["sandbox","live"]),
 reason: z.literal("merchant_silence_48h"),
});

class BridgeError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

// ==========================================================
// VALIDATION DES ACTIONS
// ==========================================================

const Body = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
  }),
  z.object({
    action: z.literal("review_restock"),
    request_id: z.string().uuid(),
    version: z.number().int().min(1),
    status: z.enum(["approved", "rejected"]),
    comment: z.string().max(2000).nullable().optional(),
  }),
  z.object({
    action: z.literal("review_customization"),
    request_id: z.string().uuid(),
    version: z.number().int().min(1),
    status: z.enum(["in_review", "approved", "changes_requested", "rejected"]),
    comment: z.string().max(2000).nullable().optional(),
  }),
  z.object({
    action: z.literal("assign_shipment"),
    platform_order_id: z.string().uuid(),
    platform_submission_id: z.string().uuid(),
  }),

  z.object({
    action: z.literal("pull"),

    since: z.string().datetime().optional(),
  }),

  z.object({
    action: z.literal("push_product"),

    product_id: z.string().uuid(),
  }),

  z.object({
    action: z.literal("push_shop_status"),

    shop_id: z.string().uuid(),
  }),
]);

// ==========================================================
// MAPPING DES STATUTS BOUTIQUES
// ==========================================================
//
// Il n'existe plus de statut test/trial côté Intranet.
// ==========================================================

const SHOP_STATUS: Record<string, string> = {
  draft: "draft",

  pending: "application",

  application: "application",

  review: "review",

  active: "active",

  published: "active",

  inactive: "inactive",

  suspended: "suspended",

  closed: "closed",

  archived: "closed",
};

// ==========================================================
// EDGE FUNCTION
// ==========================================================

Deno.serve(async (req) => {
  // ========================================================
  // CORS
  // ========================================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // ========================================================
  // MÉTHODE HTTP
  // ========================================================

  if (req.method !== "POST") {
    return json(
      {
        error: "Method not allowed",
      },
      405,
    );
  }

  // ========================================================
  // CLIENT ADMIN
  // ========================================================

  const url = Deno.env.get("SUPABASE_URL")!;

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // ========================================================
  // AUTHENTIFICATION
  // ========================================================

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return json(
      {
        error: "Unauthorized",
      },
      401,
    );
  }

  const { data: userResult, error: userError } =
    await admin.auth.getUser(token);

  if (userError || !userResult.user) {
    return json(
      {
        error: "Unauthorized",
      },
      401,
    );
  }

  const uid = userResult.user.id;

  // ========================================================
  // PROFIL / AUTORISATIONS
  // ========================================================

  const [{ data: leadership }, { data: profile }] = await Promise.all([
    admin.rpc("is_leadership", {
      _user_id: uid,
    }),

    admin.from("profiles").select("poles").eq("id", uid).maybeSingle(),
  ]);

  const poles: string[] = (profile?.poles as string[]) ?? [];

  // ========================================================
  // PARSE DE LA REQUÊTE
  // ========================================================

  const parsed = Body.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return json(
      {
        error: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const body = parsed.data;

  // ========================================================
  // AUTORISATIONS
  // ========================================================

  const allowed = canUsePlatformBridge(body.action, Boolean(leadership), poles);

  if (!allowed) {
    return json(
      {
        error: "Forbidden",
      },
      403,
    );
  }

  // ========================================================
  // CONFIGURATION BIB PLATFORM
  // ========================================================

  const base = Deno.env.get("BIB_PLATFORM_FUNCTIONS_URL");

  const secret = Deno.env.get("BIB_PLATFORM_BRIDGE_SECRET");

  const configured = Boolean(base && secret);

  // --------------------------------------------------------
  // ACTION STATUS
  // --------------------------------------------------------

  if (body.action === "status") {
    return json({
      configured,
    });
  }

  if (!configured) {
    return json(
      {
        error: "Liaison B.I.B Platform non configurée",
      },
      412,
    );
  }

  // ========================================================
  // APPEL BIB PLATFORM
  // ========================================================

  const callPlatform = async (fn: string, payload: unknown) => {
    const response = await fetch(
      `${base!.replace(/\/$/, "")}/${fn}`,

      {
        signal: AbortSignal.timeout(30_000),

        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "x-bib-bridge-key": secret!,
        },

        body: JSON.stringify(payload),
      },
    );

    const text = await response.text();

    if (!response.ok) {
      throw new BridgeError(`${fn} ${response.status}: ${text.slice(0, 500)}`, response.status === 409 ? 409 : 502);
    }

    return JSON.parse(text);
  };

  // ========================================================
  // CRÉATION DU RUN
  // ========================================================

  const { data: run, error: runError } = await admin
    .from("platform_sync_runs")
    .insert({
      direction: body.action === "pull" ? "pull" : "push",

      action: body.action,

      triggered_by: uid,
    })
    .select("id")
    .single();

  if (runError || !run) {
    return json(
      {
        error: `Impossible d'initialiser la synchronisation : ${
          runError?.message ?? "run introuvable"
        }`,
      },
      500,
    );
  }

  // ========================================================
  // ÉTAT D'EXÉCUTION
  // ========================================================

  const errors: string[] = [];

  let count = 0;
  let reviewedRestock: Record<string, unknown> | undefined;

  const now = new Date().toISOString();

  // ========================================================
  // NOTIFICATIONS
  // ========================================================

  const notifications: Record<string, unknown>[] = [];

  const notify = (
    pole: string,
    title: string,
    message: string,
    actionUrl: string,
    type = "info",
  ) => {
    notifications.push({
      pole_id: pole,

      title: title,

      message: message,

      action_url: actionUrl,

      type: type,
    });
  };

  // ========================================================
  // TRAITEMENT
  // ========================================================

  try {
    // ======================================================
    // PULL BIB PLATFORM → INTRANET
    // ======================================================

    if (body.action === "pull") {
      const data = await callPlatform("intranet-export", {
        since: body.since ?? null,
      });

      const ownership = OwnershipSnapshot.safeParse(data);
      if (!ownership.success)
        throw new Error("Export Platform incomplet : identités marchandes et boutiques requises.");
      const ownershipSnapshotAt = ownership.data.snapshot_at;
      const merchantIds = new Set(ownership.data.merchants.map((merchant) => merchant.id));
      const boutiqueIds = new Set(ownership.data.boutiques.map((boutique) => boutique.id));
      if (merchantIds.size !== ownership.data.merchants.length
          || boutiqueIds.size !== ownership.data.boutiques.length
          || ownership.data.boutiques.some((boutique) => !merchantIds.has(boutique.user_id)))
        throw new Error("Export Platform incohérent : propriétaire manquant ou identités dupliquées.");

      // Build the index from successful import results. An unpaged SELECT would
      // silently lose owners after PostgREST's row limit or a lookup outage.
      const merchantMap = new Map<string, string>();
      const shopMap = new Map<string, string>();

      for (const merchant of data.merchants) {
        const row = {
          platform_id: merchant.id,
          company_name: merchant.company_name ?? merchant.full_name ?? merchant.email ?? "Marchand",
          contact_name: merchant.full_name ?? null,
          contact_email: merchant.email ?? "inconnu@platform",
          subscription_status: merchant.subscription_status ?? null,
          platform_synced_at: ownershipSnapshotAt,
        };
        const { data: existing, error: lookupError } = await admin
          .from("user_accounts").select("id,platform_synced_at").eq("platform_id", merchant.id).maybeSingle();
        if (lookupError) {
          errors.push("Lecture du marchand " + merchant.id + " : " + lookupError.message);
          continue;
        }
        if (existing?.platform_synced_at
            && Date.parse(existing.platform_synced_at) >= Date.parse(ownershipSnapshotAt)) {
          merchantMap.set(merchant.id, existing.id);
          continue;
        }
        let update = existing
          ? admin.from("user_accounts").update(row).eq("id", existing.id)
          : null;
        if (update) update = existing.platform_synced_at
          ? update.eq("platform_synced_at", existing.platform_synced_at)
          : update.is("platform_synced_at", null);
        const result = update
          ? await update.select("id").single()
          : await admin.from("user_accounts").insert(row).select("id").single();
        if (result.error || !result.data?.id) {
          errors.push("Marchand " + merchant.id + " : " + (result.error?.message ?? "résultat manquant"));
          continue;
        }
        merchantMap.set(merchant.id, result.data.id);
        count++;
        if (!existing)
          notify("marketplace", "Nouveau marchand", row.company_name, "/pole/marketplace/merchants");
      }

      for (const boutique of data.boutiques) {
        const merchantId = merchantMap.get(boutique.user_id);
        if (!merchantId) {
          // Preserve any previous link when the owner could not be synchronized.
          errors.push("Boutique " + boutique.id + " : propriétaire non synchronisé.");
          continue;
        }
        const row = {
          platform_id: boutique.id,
          name: boutique.name,
          slug: boutique.slug ?? null,
          merchant_id: merchantId,
          category: boutique.category ?? null,
          subscription_plan: boutique.subscription_plan ?? null,
          status: SHOP_STATUS[boutique.status] ?? "review",
          platform_synced_at: ownershipSnapshotAt,
          app_origin: "platform",
        };
        const { data: existing, error: lookupError } = await admin
          .from("shops").select("id,platform_synced_at").eq("platform_id", boutique.id).maybeSingle();
        if (lookupError) {
          errors.push("Lecture de la boutique " + boutique.id + " : " + lookupError.message);
          continue;
        }
        if (existing?.platform_synced_at
            && Date.parse(existing.platform_synced_at) >= Date.parse(ownershipSnapshotAt)) {
          shopMap.set(boutique.id, existing.id);
          continue;
        }
        let update = existing
          ? admin.from("shops").update(row).eq("id", existing.id)
          : null;
        if (update) update = existing.platform_synced_at
          ? update.eq("platform_synced_at", existing.platform_synced_at)
          : update.is("platform_synced_at", null);
        const result = update
          ? await update.select("id").single()
          : await admin.from("shops").insert({
              ...row,
              shop_code: "BOS-" + String(boutique.id).slice(0, 8).toUpperCase(),
            }).select("id").single();
        if (result.error || !result.data?.id) {
          errors.push("Boutique " + boutique.id + " : " + (result.error?.message ?? "résultat manquant"));
          continue;
        }
        shopMap.set(boutique.id, result.data.id);
        count++;
        if (!existing)
          notify("marketplace", "Nouvelle boutique à examiner", boutique.name, "/pole/marketplace/stores");
      }

      // Catalog ids and boutique-product ids belong to different tables in Platform.
      // Keep one association per boutique product; never overwrite operational products.
      for (const platformProduct of data.products ?? []) {
        const shopId = shopMap.get(platformProduct.boutique_id);
        if (
          !platformProduct.id ||
          !platformProduct.supplier_product_id ||
          !shopId
        ) {
          errors.push(
            "Liaison produit incomplète : " + String(platformProduct.id),
          );
          continue;
        }
        const { data: catalogProduct, error: lookupError } = await admin
          .from("products")
          .select("id")
          .eq("platform_id", platformProduct.supplier_product_id)
          .maybeSingle();
        if (lookupError || !catalogProduct) {
          errors.push(
            "Catalogue fournisseur introuvable : " +
              platformProduct.supplier_product_id,
          );
          continue;
        }
        const { error: linkError } = await admin
          .from("platform_boutique_products")
          .upsert(
            {
              platform_product_id: platformProduct.id,
              platform_supplier_product_id: platformProduct.supplier_product_id,
              intranet_product_id: catalogProduct.id,
              shop_id: shopId,
              platform_boutique_id: platformProduct.boutique_id,
              public_status: platformProduct.status ?? null,
              public_price: platformProduct.public_price ?? null,
              platform_synced_at: now,
            },
            { onConflict: "platform_product_id" },
          );
        if (linkError) errors.push("Liaison produit : " + linkError.message);
        else count++;
      }

      // Restock is an independent merchant workflow, never a supplier purchase or stock credit.
      // Reject incomplete exports instead of recording a successful synchronization watermark.
      if (!Array.isArray(data.restock_requests))
        throw new Error("Export Platform incomplet : demandes de réapprovisionnement absentes");
      for (const raw of data.restock_requests) {
        const request = parseRestockRequest(raw);
        const { data: product, error: mappingError } = await admin.from("products")
          .select("id").eq("id", request.intranet_product_id)
          .eq("platform_id", request.supplier_product_id).maybeSingle();
        if (mappingError || !product)
          throw new Error("Correspondance catalogue introuvable pour la demande " + request.id);
        const { error: mirrorError } = await admin.rpc("upsert_platform_stock_restock_request", {
          p_row: restockMirrorPayload(request),
        });
        if (mirrorError) throw new Error("Demande de réapprovisionnement : " + mirrorError.message);
        count++;
      }

      // Versioned customization requests; unfinished merchant configurations stay private.
      for (const request of data.customization_requests ?? []) {
        const { data: catalogProduct, error: catalogError } = await admin
          .from("products")
          .select("id")
          .eq("platform_id", request.supplier_product_id)
          .maybeSingle();
        if (catalogError || !catalogProduct) {
          errors.push(
            "Catalogue introuvable pour le dossier de personnalisation " +
              request.id,
          );
          continue;
        }
        const { error: requestError } = await admin.rpc(
          "upsert_platform_customization_request",
          {
            p_row: {
              platform_dossier_id: request.id,
              platform_product_id: request.product_id,
              intranet_product_id: catalogProduct.id,
              version: request.version,
              merchant_config: request.merchant_config,
              supplier_status: request.supplier_status,
              supplier_comment: request.supplier_comment,
              source_updated_at: request.updated_at,
            },
          },
        );
        if (requestError)
          errors.push("Dossier de personnalisation : " + requestError.message);
        else count++;
      }

      // ====================================================
      // 3 TER. FAVORIS CLIENTS
      // ====================================================
      //
      // BIB Platform reste la source de vérité.
      //
      // Les favoris sont synchronisés comme un snapshot
      // complet car les tables Platform ne disposent pas
      // de deleted_at ni de journal de suppression.
      //
      // Cette logique reste interne à la synchronisation.
      // Elle n'alimente aucun détail de transmission dans
      // l'interface d'intégration.
      // ====================================================

      const { data: knownFavoriteShops, error: knownFavoriteShopsError } =
        await admin
          .from("shops")
          .select("id, platform_id")
          .not("platform_id", "is", null);

      if (knownFavoriteShopsError) {
        errors.push(
          `favoris clients — index boutiques : ${knownFavoriteShopsError.message}`,
        );
      } else {
        for (const shop of knownFavoriteShops ?? []) {
          if (shop.platform_id) {
            shopMap.set(shop.platform_id, shop.id);
          }
        }
      }

      const favorites = data.customer_favorites;
      if (
        data.favorites_complete !== true ||
        !Array.isArray(favorites) ||
        !data.snapshot_at
      ) {
        throw new Error(
          "Export B.I.B Platform incomplet : snapshot de favoris refusé",
        );
      }
      if (knownFavoriteShopsError) {
        throw new Error(
          "Index boutiques indisponible : ancien snapshot de favoris conservé",
        );
      }
      const favoriteRows = favorites.map(
        (favorite: Record<string, unknown>) => {
          const boutiqueId =
            favorite.platform_boutique_id ??
            (favorite.favorite_type === "boutique" ? favorite.target_id : null);
          return {
            platform_user_id: favorite.user_id,
            favorite_type: favorite.favorite_type,
            platform_target_id: favorite.target_id,
            platform_boutique_id: boutiqueId,
            target_name: favorite.target_name ?? null,
            target_sku: favorite.target_sku ?? null,
            shop_id:
              typeof boutiqueId === "string"
                ? (shopMap.get(boutiqueId) ?? null)
                : null,
            created_at: favorite.created_at ?? data.snapshot_at,
          };
        },
      );
      const { data: favoritesCount, error: favoritesError } = await admin.rpc(
        "replace_platform_favorites",
        {
          p_rows: favoriteRows,
          p_snapshot_at: data.snapshot_at,
        },
      );
      if (favoritesError)
        errors.push("favoris clients : " + favoritesError.message);
      else count += Number(favoritesCount ?? 0);

      // ====================================================
      // 4. COMMANDES
      // ====================================================

      if ((data.orders ?? []).length) {
        const { data: knownShops } = await admin
          .from("shops")
          .select("id, platform_id")
          .not("platform_id", "is", null);

        for (const shop of knownShops ?? []) {
          if (shop.platform_id) {
            shopMap.set(shop.platform_id, shop.id);
          }
        }
      }

      for (const order of data.orders ?? []) {
        const shopId = shopMap.get(order.boutique_id);

        if (!shopId) {
          errors.push(`commande ${order.order_number}: boutique inconnue`);

          continue;
        }

        const row = {
          platform_id: order.id,

          order_number:
            order.order_number ?? `BOS-${String(order.id).slice(0, 8)}`,

          shop_id: shopId,

          total_amount: order.amount ?? 0,

          status:
            order.payment_status === "paid"
              ? (order.logistics_status ?? "paid")
              : (order.payment_status ?? "pending"),

          current_stage: order.logistics_status ?? null,

          region: order.market ?? null,

          platform_synced_at: now,
        };

        const { data: existing } = await admin
          .from("orders")
          .select("id")
          .eq("platform_id", order.id)
          .maybeSingle();

        const { shop_id, ...updateRow } = row;

        const result = existing
          ? await admin.from("orders").update(updateRow).eq("id", existing.id)
          : await admin.from("orders").insert(row);

        if (result.error) {
          errors.push(`commande ${row.order_number}: ${result.error.message}`);
        } else {
          count++;
        }
      }

      // ====================================================
      // 5. TICKETS
      // ====================================================

      for (const ticket of data.tickets ?? []) {
        const row = {
          platform_id: ticket.id,

          subject: ticket.subject ?? "Ticket plateforme",

          description: ticket.message ?? ticket.description ?? null,

          status: ticket.status ?? "open",

          priority: ticket.priority ?? "medium",

          platform_synced_at: now,
        };

        const { data: existing } = await admin
          .from("support_tickets")
          .select("id")
          .eq("platform_id", ticket.id)
          .maybeSingle();

        const result = existing
          ? await admin
              .from("support_tickets")
              .update(row)
              .eq("id", existing.id)
          : await admin.from("support_tickets").insert(row);

        if (result.error) {
          errors.push(`ticket: ${result.error.message}`);
        } else {
          count++;
        }
      }

      // ====================================================
      // 5b. SAV ASSURÉ — TRANSFERT OPÉRATIONNEL APRÈS 48 H
      // ====================================================
      // The seller remains legally responsible; only a private handoff is
      // recorded. ignoreDuplicates preserves assignment and closed decisions.
      const ownerByBoutique = new Map(
        ownership.data.boutiques.map((shop) => [shop.id, shop.user_id]),
      );
      for (const raw of data.sav_escalations ?? []) {
        const parsed = SavHandoff.safeParse(raw);
        if (!parsed.success) {
          errors.push("Transfert SAV rejeté : format source invalide");
          continue;
        }
        const handoff = parsed.data;
        if (ownerByBoutique.get(handoff.boutique_id) !== handoff.merchant_id
          || !merchantIds.has(handoff.merchant_id)
          || Date.parse(handoff.due_at) > Date.parse(handoff.escalated_at)) {
          errors.push("Transfert SAV rejeté : boutique, vendeur ou échéance incohérents");
          continue;
        }
        const { data: inserted, error: saveError } = await admin
          .from("sav_escalation_queue")
          .upsert({
            issue_id: handoff.issue_id,
            platform_order_id: handoff.order_id,
            platform_boutique_id: handoff.boutique_id,
            platform_merchant_id: handoff.merchant_id,
            due_at: handoff.due_at,
            escalated_at: handoff.escalated_at,
            environment: handoff.environment,
            reason: handoff.reason,
          }, { onConflict: "issue_id", ignoreDuplicates: true })
          .select("issue_id");
        if (saveError) {
          errors.push(`Transfert SAV ${handoff.issue_id} : ${saveError.message}`);
          continue;
        }
        if ((inserted ?? []).length > 0) {
          notify(
            "support",
            "SAV assuré : prise en charge BIB nécessaire",
            "Le marchand n'a pas répondu dans le délai de 48 heures. Vérifiez l'escalade et attribuez-la.",
            `/pole/support/escalations?issue=${handoff.issue_id}`,
          );
        }
        count++;
      }

      // ====================================================
      // 6. FOURNISSEURS
      // ====================================================

      for (const application of data.supplier_applications ?? []) {
        const row = {
          platform_id: application.id,

          name:
            application.company_name ??
            application.name ??
            "Candidature fournisseur",

          contact_name: application.contact_name ?? null,

          contact_email: application.contact_email ?? application.email ?? null,

          email: application.contact_email ?? application.email ?? null,

          phone: application.contact_phone ?? application.phone ?? null,

          country: application.country ?? null,

          notes: application.message ?? application.description ?? null,

          platform_synced_at: now,
        };

        const { data: existing } = await admin
          .from("suppliers")
          .select("id")
          .eq("platform_id", application.id)
          .maybeSingle();

        const result = existing
          ? await admin.from("suppliers").update(row).eq("id", existing.id)
          : await admin.from("suppliers").insert({
              ...row,

              status: "pending",

              audit_status: "pending",
            });

        if (result.error) {
          errors.push(`candidature ${row.name}: ${result.error.message}`);
        } else {
          count++;

          if (!existing) {
            notify(
              "supplier",
              "Nouvelle candidature fournisseur",
              row.name,
              "/pole/supplier/applications",
            );
          }
        }
      }

      // ====================================================
      // 7. FLUX FINANCIERS
      // ====================================================

      if (!shopMap.size) {
        const { data: known } = await admin
          .from("shops")
          .select("id, platform_id")
          .not("platform_id", "is", null);

        for (const shop of known ?? []) {
          if (shop.platform_id) {
            shopMap.set(shop.platform_id, shop.id);
          }
        }
      }

      const FIN: Array<[string, string, "income" | "expense", string]> = [
        ["subscriptions", "subscription", "income", "Abonnement"],

        ["commissions", "commission", "income", "Commission"],

        ["payments", "sale", "income", "Paiement"],

        ["fees", "payment_fee", "expense", "Frais de paiement"],

        ["refunds", "refund", "expense", "Remboursement"],

        ["payouts", "merchant_payout", "expense", "Reversement marchand"],
      ];

      for (const [key, category, type, label] of FIN) {
        for (const financial of (data[key] ?? []) as any[]) {
          const amount = Math.abs(Number(financial.amount ?? 0));

          if (!financial.id || !amount) {
            continue;
          }

          const row = {
            platform_id: `${category}:${financial.id}`,

            type: type,

            category: category,

            amount: amount,

            currency: (financial.currency ?? "EUR").toUpperCase(),

            description:
              financial.description ??
              `${label}${financial.plan ? ` — ${financial.plan}` : ""}`,

            reference:
              financial.stripe_id ??
              financial.payment_intent ??
              financial.order_number ??
              financial.reference ??
              null,

            transaction_date: String(
              financial.date ?? financial.created_at ?? now,
            ).slice(0, 10),

            shop_id: financial.boutique_id
              ? (shopMap.get(financial.boutique_id) ?? null)
              : null,

            source: "platform",

            platform_synced_at: now,
          };

          const { error } = await admin.from("cashflows").upsert(row, {
            onConflict: "platform_id",
          });

          if (error) {
            errors.push(`${label} ${financial.id}: ${error.message}`);
          } else {
            count++;
          }
        }
      }

      const financialCount = FIN.reduce(
        (total, [key]) => total + (data[key] ?? []).length,
        0,
      );

      if (financialCount) {
        notify(
          "finance",
          "Flux financiers synchronisés",
          `${financialCount} opérations depuis B.I.B Platform`,
          "/pole/finance",
        );
      }

      // ====================================================
      // 8. NOTIFICATIONS
      // ====================================================

      if (notifications.length) {
        const { error } = await admin
          .from("notifications")
          .insert(notifications);

        if (error) {
          errors.push(`notifications: ${error.message}`);
        }
      }
    }

    if (body.action === "assign_shipment") {
      await callPlatform("intranet-import", {
        type: "shipment_assignment",
        data: {
          order_id: body.platform_order_id,
          submission_id: body.platform_submission_id,
        },
      });
      count = 1;
    }

    if (body.action === "review_restock") {
      const comment = body.comment?.trim() || null;
      if (body.status === "rejected" && !comment)
        throw new BridgeError("Un motif est obligatoire pour refuser une demande.", 400);
      const { data: request, error: requestError } = await admin.from("platform_stock_restock_requests")
        .select("*").eq("id", body.request_id).maybeSingle();
      if (requestError || !request)
        throw new BridgeError("Demande de réapprovisionnement introuvable.", 404);
      // Check product scope using the caller JWT, not a privileged impersonation.
      const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: "Bearer " + token } },
      });
      const { data: permitted, error: permissionError } = await caller.rpc("can_manage_product_customization", {
        p_product_id: request.product_id, p_user_id: uid,
      });
      if (permissionError || permitted !== true)
        throw new BridgeError("Revue non autorisée pour ce portefeuille produit.", 403);
      const replay = request.version === body.version + 1
        && request.status === body.status && request.review_comment === comment;
      if ((!replay && request.version !== body.version) || (!replay && request.status !== "requested"))
        throw new BridgeError("La demande a changé : actualisez la liste.", 409);
      const source = parseRestockRequest({
        ...request, id: request.platform_request_id, product_id: request.platform_product_id,
        supplier_product_id: request.platform_supplier_product_id, intranet_product_id: request.product_id,
        boutique_id: request.platform_boutique_id,
      });
      const response = await callPlatform("intranet-import", {
        type: "restock_review",
        data: { request_id: request.platform_request_id, version: body.version, status: body.status, comment },
      });
      const authoritative = assertRestockReview(source, response.request, body.version, body.status, comment);
      const { error: mirrorError } = await admin.rpc("upsert_platform_stock_restock_request", {
        p_row: restockMirrorPayload(authoritative),
      });
      if (mirrorError)
        throw new BridgeError("Décision transmise, actualisation locale à reprendre : " + mirrorError.message);
      reviewedRestock = { id: authoritative.id, version: authoritative.version, status: authoritative.status };
      count = 1;
    }

    if (body.action === "review_customization") {
      const { data: request, error: requestError } = await admin
        .from("platform_customization_requests")
        .select("*")
        .eq("id", body.request_id)
        .maybeSingle();
      if (requestError || !request)
        throw new Error("Dossier de personnalisation introuvable");
      const { data: allowedReview, error: permissionError } = await admin.rpc(
        "can_manage_product_customization",
        {
          p_product_id: request.intranet_product_id,
          p_user_id: uid,
        },
      );
      if (permissionError || allowedReview !== true)
        throw new Error("Revue non autorisée pour ce portefeuille produit");
      if (request.version !== body.version)
        throw new Error("La version du dossier a changé : rechargez la liste");
      const response = await callPlatform("intranet-import", {
        type: "customization_review",
        data: {
          product_id: request.platform_product_id,
          version: request.version,
          status: body.status,
          comment: body.comment ?? null,
        },
      });
      const review = response.review;
      if (
        !review ||
        review.product_id !== request.platform_product_id ||
        review.version !== request.version ||
        !review.updated_at
      ) {
        throw new Error("Réponse de revue Platform invalide");
      }
      const { error: localError } = await admin.rpc(
        "upsert_platform_customization_request",
        {
          p_row: {
            platform_dossier_id: request.platform_dossier_id,
            platform_product_id: request.platform_product_id,
            intranet_product_id: request.intranet_product_id,
            version: request.version,
            merchant_config: request.merchant_config,
            supplier_status: review.supplier_status,
            supplier_comment: review.supplier_comment,
            source_updated_at: review.updated_at,
          },
        },
      );
      if (localError)
        throw new Error(
          "Décision transmise, synchronisation locale à reprendre : " +
            localError.message,
        );
      count = 1;
    }

    // ======================================================
    // PUSH PRODUIT
    // ======================================================

    if (body.action === "push_product") {
      const { data: product, error } = await admin
        .from("products")
        .select("*")
        .eq("id", body.product_id)
        .single();

      if (error || !product) {
        throw new Error("Produit introuvable");
      }

      // Supplier-pole callers may only publish products of suppliers in their own portfolio.
      const supplierOnly =
        !leadership &&
        !poles.includes("tech") &&
        !poles.includes("marketplace");

      if (supplierOnly) {
        const callerId = userResult.user.id;
        const { data: portfolios } = await admin
          .from("supplier_portfolios")
          .select("id")
          .or(`responsible_id.eq.${callerId},backup_id.eq.${callerId}`);
        const portfolioIds = (portfolios ?? []).map(
          (p: { id: string }) => p.id,
        );
        let query = admin
          .from("portfolio_assignments")
          .select("id")
          .eq("supplier_id", product.supplier_id);
        query = portfolioIds.length
          ? query.or(
              `assigned_to_id.eq.${callerId},portfolio_id.in.(${portfolioIds.join(",")})`,
            )
          : query.eq("assigned_to_id", callerId);
        const { data: owned } = await query.limit(1);
        if (!product.supplier_id || !owned?.length) {
          return json({ error: "Forbidden" }, 403);
        }
      }

      if (
        !["validated", "approved", "active"].includes(String(product.status))
      ) {
        throw new Error("Seuls les produits validés peuvent être publiés");
      }

      const response = await callPlatform(
        "intranet-import",
        supplierProductPayload(product),
      );

      const { error: productUpdateError } = await admin
        .from("products")
        .update({
          platform_id: response.id ?? product.platform_id,

          platform_synced_at: now,

          platform_publish_status: "published",
        })
        .eq("id", product.id);

      if (productUpdateError) {
        throw new Error(
          `Produit synchronisé mais mise à jour locale impossible : ${productUpdateError.message}`,
        );
      }

      count = 1;
    }

    // ======================================================
    // PUSH STATUT BOUTIQUE
    // ======================================================

    if (body.action === "push_shop_status") {
      const { data: shop, error: shopError } = await admin
        .from("shops")
        .select("id, platform_id, status")
        .eq("id", body.shop_id)
        .single();

      if (shopError || !shop) {
        throw new Error("Boutique introuvable");
      }

      if (!shop.platform_id) {
        throw new Error("Boutique non liée à la plateforme");
      }

      // Aucun statut test/trial.

      if (
        [
          "draft",
          "application",
          "review",
          "active",
          "inactive",
          "suspended",
          "closed",
        ].indexOf(shop.status) === -1
      ) {
        throw new Error(`Statut boutique invalide : ${shop.status}`);
      }

      await callPlatform("intranet-import", {
        type: "boutique_status",

        data: {
          platform_id: shop.platform_id,

          status: shop.status,
        },
      });

      const { error: shopUpdateError } = await admin
        .from("shops")
        .update({
          platform_synced_at: now,
        })
        .eq("id", shop.id);

      if (shopUpdateError) {
        throw new Error(
          `Statut envoyé mais mise à jour locale impossible : ${shopUpdateError.message}`,
        );
      }

      count = 1;
    }

    // ======================================================
    // FIN DE SYNCHRONISATION
    // ======================================================
    //
    // L'interface d'intégration ne reçoit PAS le détail
    // des données transmises.
    //
    // Elle exploite uniquement :
    // - le statut ;
    // - le nombre d'éléments traités ;
    // - les erreurs ;
    // - started_at / finished_at pour la durée.
    // ======================================================

    const finalStatus = errors.length ? "partial" : "success";

    const { error: finalUpdateError } = await admin
      .from("platform_sync_runs")
      .update({
        status: finalStatus,

        items_count: count,

        errors: errors,

        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    if (finalUpdateError) {
      throw new Error(
        `Synchronisation terminée mais impossible d'enregistrer son résultat : ${finalUpdateError.message}`,
      );
    }

    // ======================================================
    // ANOMALIE SI SYNCHRONISATION PARTIELLE
    // ======================================================

    if (errors.length) {
      await admin.from("anomalies").insert({
        source: "platform",

        type: "Synchronisation partielle",

        severity: errors.length > 5 ? "high" : "medium",

        title: `Synchronisation B.I.B Platform : ${errors.length} rejet(s)`,

        description: errors.slice(0, 20).join("\n"),

        object_type: "platform_sync_run",

        object_id: run.id,

        created_by: uid,
      });
    }

    // ======================================================
    // RÉPONSE
    // ======================================================

    return json({
      success: true,

      status: finalStatus,

      items: count,

      errors,
      ...(reviewedRestock ? { request: reviewedRestock } : {}),
    });
  } catch (error) {
    // ======================================================
    // ÉCHEC GLOBAL
    // ======================================================

    const message = error instanceof Error ? error.message : String(error);

    const finalErrors = [...errors, message];

    const { error: failureUpdateError } = await admin
      .from("platform_sync_runs")
      .update({
        status: "error",

        items_count: count,

        errors: finalErrors,

        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    // ======================================================
    // ANOMALIE
    // ======================================================

    await admin.from("anomalies").insert({
      source: "platform",

      type: "Échec de synchronisation",

      severity: "high",

      title: `Échec ${body.action} B.I.B Platform`,

      description: message.slice(0, 1000),

      object_type: "platform_sync_run",

      object_id: run.id,

      created_by: uid,
    });

    return json(
      {
        error: failureUpdateError
          ? `${message} — impossible d'enregistrer le résultat de synchronisation : ${failureUpdateError.message}`
          : message,

        status: "error",

        items: count,

        errors: finalErrors,
      },
      error instanceof BridgeError ? error.status : 502,
    );
  }
});
