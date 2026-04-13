import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabase.rpc("exec_sql", {
    query: ""
  }).maybeSingle();

  // Use direct SQL via REST
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  // Create table using raw SQL through pg
  const pgRes = await fetch(`${supabaseUrl}/pg`, {
    headers: { Authorization: `Bearer ${serviceRoleKey}` },
  });

  return new Response(JSON.stringify({ 
    message: "Use migration tool instead" 
  }), { headers: { "Content-Type": "application/json" } });
});
