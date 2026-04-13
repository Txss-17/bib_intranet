import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: "public" },
  });

  // Create table via raw SQL using the pg_net or direct approach
  const sql = `
    CREATE TABLE IF NOT EXISTS public.media_attachments (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT '',
      file_size INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_attachments' AND policyname = 'Authenticated users can view media attachments') THEN
        CREATE POLICY "Authenticated users can view media attachments" ON public.media_attachments FOR SELECT TO authenticated USING (true);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_attachments' AND policyname = 'Authenticated users can manage media attachments') THEN
        CREATE POLICY "Authenticated users can manage media attachments" ON public.media_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_media_attachments_entity ON public.media_attachments (entity_type, entity_id);
  `;

  // Execute raw SQL via PostgREST rpc
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({}),
  });

  // Alternative: use the postgres connection directly
  // Since we can't run raw SQL via REST, let's use supabase-js to check if table exists
  // and create via a workaround

  // Try querying the table first
  const { error: checkError } = await supabase.from("media_attachments").select("id").limit(1);
  
  if (checkError && checkError.message.includes("does not exist")) {
    return new Response(JSON.stringify({
      success: false,
      message: "Table media_attachments needs to be created via migration. Please approve the migration.",
      sql: sql,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Table media_attachments already exists",
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
