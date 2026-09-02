import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const randomPassword = () =>
  `Bib${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}!${Math.floor(Math.random() * 90 + 10)}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Non authentifié" }, 401);

    const admin = createClient(url, serviceKey);

    // Seuls la Tech, l'admin ou la direction peuvent créer un compte.
    const [{ data: roles }, { data: callerProfile }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", user.id),
      admin.from("profiles").select("poles, first_name, last_name").eq("id", user.id).maybeSingle(),
    ]);
    const poles: string[] = (callerProfile?.poles ?? []) as string[];
    const privileged = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "executive")
      || poles.includes("tech") || poles.includes("direction");
    if (!privileged) return json({ error: "Réservé au pôle Tech et à la direction" }, 403);

    const body = await req.json().catch(() => ({}));
    const requestId: string | undefined = body?.requestId;
    if (!requestId || typeof requestId !== "string") return json({ error: "requestId manquant" }, 400);

    const { data: request, error: reqErr } = await admin
      .from("hr_employee_requests").select("*").eq("id", requestId).maybeSingle();
    if (reqErr) return json({ error: reqErr.message }, 400);
    if (!request) return json({ error: "Dossier introuvable" }, 404);
    if (request.status !== "hr_validated") {
      return json({ error: "Le dossier doit être validé par les RH avant création du compte" }, 409);
    }

    const email: string | null = request.work_email ?? request.personal_email;
    if (!email) return json({ error: "Aucune adresse email sur le dossier" }, 400);

    const temporaryPassword = randomPassword();
    let userId: string | null = null;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { first_name: request.first_name, last_name: request.last_name },
    });

    if (createErr) {
      // Compte déjà existant : on le réutilise
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) return json({ error: createErr.message }, 400);
      userId = existing.id;
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) return json({ error: "Compte non créé" }, 500);

    await admin.from("profiles").update({
      first_name: request.first_name,
      last_name: request.last_name,
      email,
      position: request.position,
      poles: request.poles,
      seniority: request.seniority,
    }).eq("id", userId);

    await admin.from("user_roles").upsert(
      { user_id: userId, role: request.requested_role },
      { onConflict: "user_id,role" },
    );

    await admin.from("hr_employee_requests").update({
      status: "completed",
      work_email: email,
      created_user_id: userId,
      account_created_by: user.id,
      account_created_at: new Date().toISOString(),
    }).eq("id", requestId);

    await admin.from("hr_employee_request_events").insert({
      request_id: requestId,
      actor_id: user.id,
      actor_name: `${callerProfile?.first_name ?? ""} ${callerProfile?.last_name ?? ""}`.trim() || "Tech",
      action: "Compte, profil et rôle provisionnés",
      from_status: "hr_validated",
      to_status: "completed",
      note: `Rôle ${request.requested_role} · pôles ${(request.poles ?? []).join(", ")}`,
    });

    await admin.from("notifications").insert({
      title: `Compte créé — ${request.first_name} ${request.last_name}`,
      message: `${email} · rôle ${request.requested_role}`,
      type: "success",
      pole_id: "rh",
      action_url: "/pole/rh/onboarding",
    });

    return json({ ok: true, email, userId, temporaryPassword: createErr ? undefined : temporaryPassword });
  } catch (e) {
    console.error("provision-employee-account failed:", e);
    return json({ error: e instanceof Error ? e.message : "Erreur inattendue" }, 500);
  }
});
