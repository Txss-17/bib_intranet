import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Random, never-shared password: test accounts are opened via a one-time admin sign-in link.
const randomPassword = () => {
  const b = new Uint8Array(24); crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)) + "Aa1!";
};
const TEST_EMAIL_RE = /\.test@brand-in-a-box\.space$/i;

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

    // One-time sign-in for an existing test account (admin only, test emails only).
    if (body?.action === "sign_in") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      if (!TEST_EMAIL_RE.test(email)) {
        return new Response(JSON.stringify({ error: "Compte de test invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: prof } = await admin.from("profiles").select("test_account").ilike("email", email).maybeSingle();
      if (!prof?.test_account) {
        return new Response(JSON.stringify({ error: "Compte de test introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkErr || !link?.properties?.hashed_token) {
        return new Response(JSON.stringify({ error: "Connexion impossible" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ token_hash: link.properties.hashed_token }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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
        password: randomPassword(),
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
        await admin.auth.admin.updateUserById(userId, { password: randomPassword(), email_confirm: true });
        updated++;
      } else {
        userId = newUser.user!.id;
        created++;
      }

      const { error: profileErr } = await admin
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: spec.email,
            first_name: spec.label,
            last_name: "(test)",
            position: spec.position,
            poles: spec.poles,
            seniority: spec.seniority,
      
            // Les comptes générés par cet outil sont
            // exclusivement des comptes techniques de test.
            test_account: true,
          },
          {
            onConflict: "id",
          },
        );

    return new Response(JSON.stringify({ created, updated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
