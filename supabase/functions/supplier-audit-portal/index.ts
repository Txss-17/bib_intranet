import { createClient } from "npm:@supabase/supabase-js@2";
import { createSupplierAuditPortalHandler } from "../_shared/supplier-audit-portal-handler.mjs";

Deno.serve(
  createSupplierAuditPortalHandler({
    secret: Deno.env.get("BIB_PLATFORM_BRIDGE_SECRET"),
    getAdmin: () =>
      createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      ),
  }),
);
