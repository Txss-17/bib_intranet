import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  
  const { Client } = await import("https://deno.land/x/postgres@v0.19.3/mod.ts");
  const client = new Client(dbUrl);
  await client.connect();
  
  try {
    await client.queryArray(`
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
    `);

    await client.queryArray(`ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;`);

    await client.queryArray(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_attachments' AND policyname = 'Authenticated users can view media attachments') THEN
          CREATE POLICY "Authenticated users can view media attachments" ON public.media_attachments FOR SELECT TO authenticated USING (true);
        END IF;
      END $$;
    `);

    await client.queryArray(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_attachments' AND policyname = 'Authenticated users can manage media attachments') THEN
          CREATE POLICY "Authenticated users can manage media attachments" ON public.media_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);

    await client.queryArray(`CREATE INDEX IF NOT EXISTS idx_media_attachments_entity ON public.media_attachments (entity_type, entity_id);`);

    return new Response(JSON.stringify({ success: true, message: "Table media_attachments created successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    await client.end();
  }
});
