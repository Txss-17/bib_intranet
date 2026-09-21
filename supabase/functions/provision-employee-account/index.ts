import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const randomPassword = () =>
  `Bib${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}!${Math.floor(
    Math.random() * 90 + 10,
  )}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!url || !serviceKey || !anonKey) {
      return json(
        { error: "Configuration Supabase incomplète" },
        500,
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    const caller = createClient(url, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
    } = await caller.auth.getUser();

    if (!user) {
      return json({ error: "Non authentifié" }, 401);
    }

    const admin = createClient(url, serviceKey);

    /*
     * Le provisionnement d'un collaborateur est une opération sensible.
     *
     * Les personnes autorisées sont :
     * - les administrateurs système ;
     * - la direction ;
     * - Product & Engineering ;
     * - Security & IT.
     *
     * Le contrôle est effectué côté serveur et ne dépend donc pas
     * uniquement du masquage du bouton dans l'interface RH.
     */
    const [{ data: roles }, { data: callerProfile }] = await Promise.all([
      admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id),

      admin
        .from("profiles")
        .select("poles, first_name, last_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    const poles: string[] = Array.isArray(callerProfile?.poles)
      ? (callerProfile.poles as string[])
      : [];

    const hasSystemPrivilege = (roles ?? []).some(
      (role: { role: string }) =>
        role.role === "admin" || role.role === "executive",
    );

    const hasProvisioningPole =
      poles.includes("direction") ||
      poles.includes("product") ||
      poles.includes("security");

    const privileged = hasSystemPrivilege || hasProvisioningPole;

    if (!privileged) {
      return json(
        {
          error:
            "Provisionnement réservé à la Direction, au pôle Product & Engineering ou au pôle Security & IT",
        },
        403,
      );
    }

    const body = await req.json().catch(() => ({}));

    const requestId: string | undefined = body?.requestId;

    if (!requestId || typeof requestId !== "string") {
      return json({ error: "requestId manquant" }, 400);
    }

    const { data: request, error: requestError } = await admin
      .from("hr_employee_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) {
      return json({ error: requestError.message }, 400);
    }

    if (!request) {
      return json({ error: "Dossier introuvable" }, 404);
    }

    if (request.status !== "hr_validated") {
      return json(
        {
          error:
            "Le dossier doit être validé par les RH avant la création du compte",
        },
        409,
      );
    }

    const email: string | null =
      request.work_email ?? request.personal_email;

    if (!email) {
      return json(
        {
          error: "Aucune adresse email sur le dossier",
        },
        400,
      );
    }

    const temporaryPassword = randomPassword();

    let userId: string | null = null;
    let accountAlreadyExisted = false;

    const {
      data: created,
      error: createError,
    } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: request.first_name,
        last_name: request.last_name,
      },
    });

    if (createError) {
      /*
       * Si le compte existe déjà, on réutilise son identifiant.
       * Aucun nouveau mot de passe temporaire n'est alors retourné.
       */
      const { data: list, error: listError } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (listError) {
        return json(
          {
            error: listError.message,
          },
          400,
        );
      }

      const existing = list?.users?.find(
        (candidate) =>
          candidate.email?.toLowerCase() === email.toLowerCase(),
      );

      if (!existing) {
        return json(
          {
            error: createError.message,
          },
          400,
        );
      }

      userId = existing.id;
      accountAlreadyExisted = true;
    } else {
      userId = created.user?.id ?? null;
    }

    if (!userId) {
      return json(
        {
          error: "Compte non créé",
        },
        500,
      );
    }

    /*
     * Synchronisation du profil collaborateur.
     */
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        first_name: request.first_name,
        last_name: request.last_name,
        email,
        position: request.position,
        poles: request.poles,
        seniority: request.seniority,
      })
      .eq("id", userId);

    if (profileError) {
      return json(
        {
          error: `Profil non mis à jour : ${profileError.message}`,
        },
        400,
      );
    }

    /*
     * Attribution du rôle applicatif demandé dans le dossier RH.
     */
    const { error: roleError } = await admin
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role: request.requested_role,
        },
        {
          onConflict: "user_id,role",
        },
      );

    if (roleError) {
      return json(
        {
          error: `Rôle non attribué : ${roleError.message}`,
        },
        400,
      );
    }

    /*
     * Le provisionnement est terminé :
     * compte + profil + rôle.
     */
    const { error: requestUpdateError } = await admin
      .from("hr_employee_requests")
      .update({
        status: "completed",
        work_email: email,
        created_user_id: userId,
        account_created_by: user.id,
        account_created_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (requestUpdateError) {
      return json(
        {
          error: `Dossier RH non finalisé : ${requestUpdateError.message}`,
        },
        400,
      );
    }

    const actorName =
      `${callerProfile?.first_name ?? ""} ${
        callerProfile?.last_name ?? ""
      }`.trim() || "Utilisateur habilité";

    await admin.from("hr_employee_request_events").insert({
      request_id: requestId,
      actor_id: user.id,
      actor_name: actorName,
      action: accountAlreadyExisted
        ? "Compte existant, profil et accès synchronisés"
        : "Compte, profil et accès provisionnés",
      from_status: "hr_validated",
      to_status: "completed",
      note: `Rôle ${request.requested_role} · pôles ${(request.poles ?? []).join(
        ", ",
      )}`,
    });

    /*
     * Notification du pôle RH.
     */
    await admin.from("notifications").insert({
      title: `Compte créé — ${request.first_name} ${request.last_name}`,
      message: `${email} · rôle ${request.requested_role}`,
      type: "success",
      pole_id: "rh",
      action_url: "/pole/rh/onboarding",
    });

    return json({
      ok: true,
      email,
      userId,
      temporaryPassword: accountAlreadyExisted
        ? undefined
        : temporaryPassword,
    });
  } catch (error) {
    console.error(
      "provision-employee-account failed:",
      error,
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inattendue",
      },
      500,
    );
  }
});
