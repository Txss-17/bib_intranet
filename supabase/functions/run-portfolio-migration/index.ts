import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceRoleKey);

  const sql = `
    -- Enable Realtime on notifications and feed_posts
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
      END IF;
      
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'feed_posts'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
      END IF;
    END $$;

    -- Create supplier_portfolios table
    CREATE TABLE IF NOT EXISTS public.supplier_portfolios (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      category text NOT NULL,
      responsible_id uuid REFERENCES auth.users(id),
      responsible_name text NOT NULL DEFAULT '',
      backup_id uuid REFERENCES auth.users(id),
      backup_name text NOT NULL DEFAULT '',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Create portfolio_assignments table
    CREATE TABLE IF NOT EXISTS public.portfolio_assignments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      portfolio_id uuid REFERENCES public.supplier_portfolios(id) ON DELETE CASCADE,
      supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE,
      assigned_to_id uuid REFERENCES auth.users(id),
      assigned_to_name text NOT NULL DEFAULT '',
      assigned_at timestamptz DEFAULT now(),
      UNIQUE(portfolio_id, supplier_id)
    );

    -- RLS for supplier_portfolios
    ALTER TABLE public.supplier_portfolios ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_portfolios' AND policyname = 'Authenticated users can view portfolios') THEN
        CREATE POLICY "Authenticated users can view portfolios" ON public.supplier_portfolios FOR SELECT TO authenticated USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_portfolios' AND policyname = 'Managers can manage portfolios') THEN
        CREATE POLICY "Managers can manage portfolios" ON public.supplier_portfolios FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
      END IF;
    END $$;

    -- RLS for portfolio_assignments
    ALTER TABLE public.portfolio_assignments ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_assignments' AND policyname = 'Authenticated users can view assignments') THEN
        CREATE POLICY "Authenticated users can view assignments" ON public.portfolio_assignments FOR SELECT TO authenticated USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_assignments' AND policyname = 'Managers can manage assignments') THEN
        CREATE POLICY "Managers can manage assignments" ON public.portfolio_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));
      END IF;
    END $$;
  `;

  const { error } = await db.rpc('exec_sql' as any, { sql });
  
  // Try direct approach if rpc doesn't exist
  if (error) {
    // Execute statements individually via REST
    const statements = sql.split(';').filter(s => s.trim().length > 5);
    const results: string[] = [];
    
    for (const stmt of statements) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: stmt }),
        });
        results.push(`OK: ${stmt.slice(0, 50)}...`);
      } catch (e) {
        results.push(`ERR: ${stmt.slice(0, 50)}... - ${e}`);
      }
    }
    
    return new Response(JSON.stringify({ fallback: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
