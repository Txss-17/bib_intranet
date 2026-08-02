import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PASSWORD = "BibTest!2026";

interface RoleSpec {
  id: string;
  label: string;
  email: string;
  position: string;
  poles: string[];
  seniority: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // --- caller must be an authenticated admin ---
    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(url, serviceKey);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Réservé aux administrateurs" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const specs: RoleSpec[] = Array.isArray(body?.roles) ? body.roles : [];
    if (!specs.length) {
      return new Response(JSON.stringify({ error: "Aucun rôle fourni" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const spec of specs) {
      let userId: string | null = null;

      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: spec.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          first_name: spec.label,
          last_name: "(test)",
          test_account: true,
          job_role: spec.id,
        },
      });

      if (createErr) {
        // already exists -> find it and reset the password
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === spec.email.toLowerCase());
        if (!existing) { errors.push(`${spec.email}: ${createErr.message}`); continue; }
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, { password: PASSWORD, email_confirm: true });
        updated++;
      } else {
        userId = newUser.user!.id;
        created++;
      }

      const { error: profileErr } = await admin.from("profiles").upsert({
        id: userId,
        email: spec.email,
        first_name: spec.label,
        last_name: "(test)",
        position: spec.position,
        poles: spec.poles,
        seniority: spec.seniority,
      }, { onConflict: "id" });
      if (profileErr) errors.push(`${spec.email} profil: ${profileErr.message}`);

      await admin.from("user_roles").upsert(
        { user_id: userId, role: "viewer" },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    return new Response(JSON.stringify({ created, updated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
