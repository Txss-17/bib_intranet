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

const isDuplicateEmailError = (error: {
  message?: string;
  status?: number;
  code?: string;
}) => {
  const message = (error.message ?? "").toLowerCase();

  return (
    error.code === "email_exists" ||
    error.status === 422 ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already")
  );
};

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
     * Le contrôle est effectué côté serveur.
     */
    const [{ data: roles, error: rolesError }, { data: callerProfile, error: callerProfileError }] =
      await Promise.all([
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

    if (rolesError) {
      return json(
        {
          error: `Impossible de vérifier les rôles : ${rolesError.message}`,
        },
        500,
      );
    }

    if (callerProfileError) {
      return json(
        {
          error: `Impossible de vérifier le profil : ${callerProfileError.message}`,
        },
        500,
      );
    }

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

    /*
     * Protection contre un double provisionnement.
     */
    if (request.status === "completed" || request.created_user_id) {
      return json(
        {
          error:
            "Le dossier RH est déjà provisionné.",
          userId: request.created_user_id ?? undefined,
        },
        409,
      );
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

    if (!request.position) {
      return json(
        {
          error: "Aucune fonction n'est définie sur le dossier RH",
        },
        400,
      );
    }

    if (!Array.isArray(request.poles) || request.poles.length === 0) {
      return json(
        {
          error: "Aucun pôle n'est défini sur le dossier RH",
        },
        400,
      );
    }

    if (!request.requested_role) {
      return json(
        {
          error: "Aucun rôle applicatif n'est défini sur le dossier RH",
        },
        400,
      );
    }

    const temporaryPassword = randomPassword();

    let userId: string | null = null;
    let accountAlreadyExisted = false;

    /*
     * Création du compte Auth.
     *
     * Le trigger handle_new_user() crée automatiquement :
     * - le profil ;
     * - le rôle viewer par défaut.
     */
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
        app_origin: "bos",
      },
    });

    if (createError) {
      /*
       * Une erreur de création n'est considérée comme un doublon
       * que si elle correspond explicitement à ce cas.
       */
      if (!isDuplicateEmailError(createError)) {
        return json(
          {
            error: createError.message,
          },
          createError.status && createError.status >= 400
            ? createError.status
            : 400,
        );
      }

      /*
       * Le compte existe déjà : récupération de son identifiant.
       */
      const { data: list, error: listError } =
        await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (listError) {
        return json(
          {
            error: `Compte existant détecté mais impossible à retrouver : ${listError.message}`,
          },
          500,
        );
      }

      const existing = list?.users?.find(
        (candidate) =>
          candidate.email?.toLowerCase() === email.toLowerCase(),
      );

      if (!existing) {
        return json(
          {
            error:
              "Un compte semble déjà exister avec cette adresse email, mais son identifiant n'a pas pu être retrouvé.",
          },
          409,
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
     * Le trigger crée le profil lors de la création Auth.
     *
     * Pour un compte déjà existant, le profil doit également exister.
     */
    const { data: existingProfile, error: existingProfileError } =
      await admin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

    if (existingProfileError) {
      return json(
        {
          error: `Impossible de vérifier le profil : ${existingProfileError.message}`,
        },
        500,
      );
    }

    if (!existingProfile) {
      return json(
        {
          error:
            "Le compte Auth existe mais son profil BIB est introuvable. Le provisionnement a été interrompu.",
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
     * Vérification que le rôle demandé est un rôle applicatif valide.
     */
    const allowedRoles = new Set([
      "admin",
      "executive",
      "manager",
      "analyst",
      "operator",
      "viewer",
    ]);

    if (!allowedRoles.has(request.requested_role)) {
      return json(
        {
          error: `Rôle applicatif invalide : ${request.requested_role}`,
        },
        400,
      );
    }

    /*
     * Le trigger attribue déjà "viewer".
     *
     * On ajoute uniquement le rôle demandé s'il n'est pas déjà présent.
     * Cela évite de dépendre d'un conflit unique user_id + role.
     */
    const { data: existingRoles, error: existingRolesError } =
      await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

    if (existingRolesError) {
      return json(
        {
          error: `Impossible de vérifier les rôles : ${existingRolesError.message}`,
        },
        400,
      );
    }

    const hasRequestedRole = (existingRoles ?? []).some(
      (role: { role: string }) => role.role === request.requested_role,
    );

    if (!hasRequestedRole) {
      const { error: roleError } = await admin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: request.requested_role,
        });

      if (roleError) {
        return json(
          {
            error: `Rôle non attribué : ${roleError.message}`,
          },
          400,
        );
      }
    }

    /*
     * Finalisation du dossier RH.
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
      .eq("id", requestId)
      .eq("status", "hr_validated");

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

    /*
     * Journalisation de l'opération.
     */
    const { error: eventError } = await admin
      .from("hr_employee_request_events")
      .insert({
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

    if (eventError) {
      console.error(
        "Impossible d'enregistrer l'événement RH :",
        eventError,
      );
    }

    /*
     * Notification du pôle RH.
     */
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        title: `Compte créé — ${request.first_name} ${request.last_name}`,
        message: `${email} · rôle ${request.requested_role}`,
        type: "success",
        pole_id: "rh",
        action_url: "/pole/rh/onboarding",
      });

    if (notificationError) {
      console.error(
        "Impossible d'envoyer la notification RH :",
        notificationError,
      );
    }

    return json({
      ok: true,
      email,
      userId,
      accountAlreadyExisted,
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
