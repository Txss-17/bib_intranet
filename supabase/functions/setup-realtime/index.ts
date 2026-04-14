import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sql = `
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_text: sql }).maybeSingle();
  
  // Try direct approach
  const res1 = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify({ sql_text: sql }),
    }
  );

  return new Response(JSON.stringify({ status: 'realtime_setup_attempted' }), {
    headers: { "Content-Type": "application/json" },
  });
});
