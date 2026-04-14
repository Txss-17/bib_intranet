import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

Deno.serve(async (req) => {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not set" }), { status: 500 });
  }

  const sql = postgres(dbUrl, { max: 1 });
  const results: any[] = [];

  try {
    // Create feed_posts table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.feed_posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        author_name text NOT NULL,
        author_role text NOT NULL DEFAULT '',
        pole_id public.pole_id DEFAULT NULL,
        title text NOT NULL,
        content text NOT NULL,
        type text NOT NULL DEFAULT 'update',
        visibility text NOT NULL DEFAULT 'company',
        reactions integer DEFAULT 0,
        comments integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    results.push({ action: 'create feed_posts table', status: 'ok' });

    await sql.unsafe(`ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY`);
    try { await sql.unsafe(`CREATE POLICY "Authenticated users can view feed posts" ON public.feed_posts FOR SELECT TO authenticated USING (true)`); } catch (_) {}
    try { await sql.unsafe(`CREATE POLICY "Authenticated users can create feed posts" ON public.feed_posts FOR INSERT TO authenticated WITH CHECK (true)`); } catch (_) {}
    try { await sql.unsafe(`CREATE POLICY "Authors can update own posts" ON public.feed_posts FOR UPDATE TO authenticated USING (author_id = auth.uid())`); } catch (_) {}
    results.push({ action: 'feed_posts RLS', status: 'ok' });

    // Create documents table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS public.documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        type text NOT NULL DEFAULT 'report',
        pole_id public.pole_id DEFAULT NULL,
        version text NOT NULL DEFAULT '1.0',
        status text NOT NULL DEFAULT 'draft',
        access_level text NOT NULL DEFAULT 'public',
        file_url text DEFAULT NULL,
        file_size integer DEFAULT 0,
        modified_by text DEFAULT NULL,
        uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    results.push({ action: 'create documents table', status: 'ok' });

    await sql.unsafe(`ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY`);
    try { await sql.unsafe(`CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT TO authenticated USING (true)`); } catch (_) {}
    try { await sql.unsafe(`CREATE POLICY "Managers and admins can manage documents" ON public.documents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))`); } catch (_) {}
    results.push({ action: 'documents RLS', status: 'ok' });

  } catch (e: any) {
    results.push({ action: 'error', detail: e.message });
  } finally {
    await sql.end();
  }

  return new Response(JSON.stringify({ success: true, results }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
