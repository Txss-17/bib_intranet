import { createClient } from "npm:@supabase/supabase-js@2";
import { createLegalGovernanceBridgeHandler } from "../_shared/legal-governance-bridge-handler.mjs";

Deno.serve(
  createLegalGovernanceBridgeHandler({
    url:
      (Deno.env.get("BIB_PLATFORM_FUNCTIONS_URL") ?? "").replace(/\/$/, "") +
      "/legal-governance-import",
    secret: Deno.env.get("BIB_PLATFORM_BRIDGE_SECRET"),
    getCaller: (token: string) =>
      createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        },
      ),
    getAdmin: () =>
      createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      ),
  }),
);
