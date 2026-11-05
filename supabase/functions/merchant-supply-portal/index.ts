import { createClient } from "npm:@supabase/supabase-js@2";
import { createMerchantSupplyPortal } from "../_shared/merchant-supply-portal-handler.mjs";
Deno.serve(createMerchantSupplyPortal({
 secret:Deno.env.get("BIB_PLATFORM_BRIDGE_SECRET"),environment:Deno.env.get("BIB_SUPPLY_ENVIRONMENT"),
 getAdmin:()=>createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}}),
}));
