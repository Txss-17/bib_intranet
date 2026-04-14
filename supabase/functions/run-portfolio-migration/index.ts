import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

  // Use pg to run raw SQL
  const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
  const sql = postgres(dbUrl);

  const results: string[] = [];

  try {
    // Enable Realtime
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'feed_posts') THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
        END IF;
      END $$;
    `);
    results.push("Realtime enabled on notifications and feed_posts");

    // Create supplier_portfolios
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.supplier_portfolios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        category text NOT NULL,
        responsible_id uuid,
        responsible_name text NOT NULL DEFAULT '',
        backup_id uuid,
        backup_name text NOT NULL DEFAULT '',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `);
    results.push("Created supplier_portfolios table");

    // Create portfolio_assignments
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.portfolio_assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        portfolio_id uuid REFERENCES public.supplier_portfolios(id) ON DELETE CASCADE,
        supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
        assigned_to_id uuid,
        assigned_to_name text NOT NULL DEFAULT '',
        assigned_at timestamptz DEFAULT now(),
        UNIQUE(portfolio_id, supplier_id)
      );
    `);
    results.push("Created portfolio_assignments table");

    // RLS for supplier_portfolios
    await sql.unsafe(`ALTER TABLE public.supplier_portfolios ENABLE ROW LEVEL SECURITY;`);
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_portfolios' AND policyname = 'Authenticated users can view portfolios') THEN
          CREATE POLICY "Authenticated users can view portfolios" ON public.supplier_portfolios FOR SELECT TO authenticated USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_portfolios' AND policyname = 'Managers can manage portfolios') THEN
          CREATE POLICY "Managers can manage portfolios" ON public.supplier_portfolios FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
        END IF;
      END $$;
    `);
    results.push("RLS policies for supplier_portfolios");

    // RLS for portfolio_assignments
    await sql.unsafe(`ALTER TABLE public.portfolio_assignments ENABLE ROW LEVEL SECURITY;`);
    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_assignments' AND policyname = 'Authenticated users can view assignments') THEN
          CREATE POLICY "Authenticated users can view assignments" ON public.portfolio_assignments FOR SELECT TO authenticated USING (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_assignments' AND policyname = 'Managers can manage assignments') THEN
          CREATE POLICY "Managers can manage assignments" ON public.portfolio_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
        END IF;
      END $$;
    `);
    results.push("RLS policies for portfolio_assignments");

    await sql.end();
  } catch (e) {
    results.push(`Error: ${e.message}`);
    try { await sql.end(); } catch {}
    return new Response(JSON.stringify({ success: false, results, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
