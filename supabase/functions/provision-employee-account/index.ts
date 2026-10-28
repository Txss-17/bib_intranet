import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (
  body: unknown,
  status = 200,
) =>
  new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );

const isDuplicateEmailError = (
  error: {
    message?: string;
    status?: number;
    code?: string;
  },
) => {
  const message =
    (
      error.message ?? ''
    ).toLowerCase();

  return (
    error.code === 'email_exists' ||
    error.status === 422 ||
    message.includes(
      'already registered',
    ) ||
    message.includes(
      'already exists',
    ) ||
    message.includes(
      'user already',
    )
  );
};


Deno.serve(
  async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(
        null,
        {
          headers: corsHeaders,
        },
      );
    }

    try {
      const url =
        Deno.env.get(
          'SUPABASE_URL',
        );

      const serviceKey =
        Deno.env.get(
          'SUPABASE_SERVICE_ROLE_KEY',
        );

      const anonKey =
        Deno.env.get(
          'SUPABASE_ANON_KEY',
        );

      if (
        !url ||
        !serviceKey ||
        !anonKey
      ) {
        return json(
          {
            error:
              'Configuration Supabase incomplète.',
          },
          500,
        );
      }


      const authHeader =
        req.headers.get(
          'Authorization',
        ) ?? '';


      const caller =
        createClient(
          url,
          anonKey,
          {
            global: {
              headers: {
                Authorization:
                  authHeader,
              },
            },
          },
        );


      const {
        data: {
          user,
        },
      } =
        await caller.auth.getUser();


      if (!user) {
        return json(
          {
            error:
              'Non authentifié.',
          },
          401,
        );
      }


      const admin =
        createClient(
          url,
          serviceKey,
        );


      /*
       * Autorisation serveur.
       */
      const [
        rolesResult,
        profileResult,
      ] = await Promise.all([
        admin
          .from('user_roles')
          .select('role')
          .eq(
            'user_id',
            user.id,
          ),

        admin
          .from('profiles')
          .select(
            'poles, first_name, last_name',
          )
          .eq(
            'id',
            user.id,
          )
          .maybeSingle(),
      ]);


      if (
        rolesResult.error
      ) {
        return json(
          {
            error:
              `Impossible de vérifier les rôles : ${rolesResult.error.message}`,
          },
          500,
        );
      }


      if (
        profileResult.error
      ) {
        return json(
          {
            error:
              `Impossible de vérifier le profil : ${profileResult.error.message}`,
          },
          500,
        );
      }


      const callerPoles:
        string[] =
        Array.isArray(
          profileResult.data?.poles,
        )
          ? profileResult.data.poles
          : [];


       if (!callerPoles.includes('rh')) {
        return json(
          {
            error:
               'Création de comptes et envoi des invitations réservés aux RH.',
          },
          403,
        );
      }


      const body =
        await req
          .json()
          .catch(
            () => ({}),
          );


      const requestId:
        string | undefined =
        body?.requestId;


      if (
        !requestId ||
        typeof requestId !==
          'string'
      ) {
        return json(
          {
            error:
              'requestId manquant.',
          },
          400,
        );
      }


      const {
        data: request,
        error: requestError,
      } =
        await admin
          .from(
            'hr_employee_requests',
          )
          .select('*')
          .eq(
            'id',
            requestId,
          )
          .maybeSingle();


      if (requestError) {
        return json(
          {
            error:
              requestError.message,
          },
          400,
        );
      }


      if (!request) {
        return json(
          {
            error:
              'Dossier RH introuvable.',
          },
          404,
        );
      }


      // Existing-account changes use caller-authorized SQL before ANY invitation.
      if (request.request_kind === 'mutation') {
        const { data: mutation, error: mutationError } = await caller.rpc('apply_hr_employee_mutation', { p_request_id: request.id });
        if (mutationError) return json({ error: mutationError.message }, mutationError.code === '42501' ? 403 : 409);
        if (!mutation || mutation.requestId !== request.id || !mutation.accessAssignmentId || mutation.invitationSent !== false || mutation.userId !== request.target_user_id)
          return json({ error: 'La mutation n’a pas été confirmée.' }, 502);
        return json({ ...mutation, accountAlreadyExisted: true, email: request.work_email });
      }
      const { data: mayApply, error: applyPermissionError } = await caller.rpc('can_hr_employee_mutation_action', { p_action: 'apply' });
      if (applyPermissionError || mayApply !== true)
        return json({ error: 'Vos droits RH ne permettent pas de provisionner ce dossier.' }, 403);

      if (
        request.status ===
          'completed' ||
        request.created_user_id
      ) {
        return json(
          {
            error:
              'Le dossier RH est déjà provisionné.',
          },
          409,
        );
      }


      if (
        request.status !==
        'hr_validated'
      ) {
        return json(
          {
            error:
              'Le dossier doit être validé par les RH avant le provisionnement.',
          },
          409,
        );
      }


      const email =
        (
          request.work_email ??
          request.personal_email ??
          ''
        )
          .trim()
          .toLowerCase();


      if (!email) {
        return json(
          {
            error:
              'Aucune adresse email valide.',
          },
          400,
        );
      }


      if (
        !(request.position_key ?? request.position)
      ) {
        return json(
          {
            error:
              'Aucune fonction définie.',
          },
          400,
        );
      }


      if (
        !Array.isArray(
          request.poles,
        ) ||
        request.poles.length ===
          0
      ) {
        return json(
          {
            error:
              'Aucun pôle défini.',
          },
          400,
        );
      }


      if (
        !request.requested_role
      ) {
        return json(
          {
            error:
              'Aucun rôle RBAC défini.',
          },
          400,
        );
      }


      /*
       * Compatibilité poste / pôle via le catalogue RH.
       * Contrôle serveur indépendant du formulaire.
       */
      const {
        data: positionCatalogEntry,
        error: positionCatalogError,
      } = await admin
        .from('rh_position_catalog')
        .select('position_key, label, pole_id, active')
        .eq('position_key', request.position_key ?? request.position)
        .maybeSingle();

      if (positionCatalogError) {
        return json(
          {
            error:
              `Impossible de vérifier le catalogue des postes : ${positionCatalogError.message}`,
          },
          500,
        );
      }

      if (!positionCatalogEntry) {
        return json(
          {
            error:
              `Le poste "${request.position_key ?? request.position}" n'existe pas dans le catalogue RH.`,
          },
          400,
        );
      }

      if (positionCatalogEntry.active !== true) {
        return json(
          {
            error:
              `Le poste "${positionCatalogEntry.label}" est désactivé.`,
          },
          400,
        );
      }

      const requiredPole = positionCatalogEntry.pole_id;

      if (
        !Array.isArray(request.poles) ||
        !request.poles.includes(requiredPole)
      ) {
        return json(
          {
            error:
              `Le poste "${positionCatalogEntry.label}" exige le pôle "${requiredPole}".`,
          },
          400,
        );
      }


      /*
       * Référent RH.
       */
      if (
        request.manager_id
      ) {
        const {
          data: manager,
          error: managerError,
        } =
          await admin
            .from('profiles')
            .select(`
              id,
              first_name,
              last_name,
              position,
              poles,
              hr_status,
              test_account
            `)
            .eq(
              'id',
              request.manager_id,
            )
            .maybeSingle();


        if (
          managerError
        ) {
          return json(
            {
              error:
                `Impossible de vérifier le référent : ${managerError.message}`,
            },
            400,
          );
        }


        const managerIsValid = Boolean(
          manager &&
          manager.test_account === false &&
          ['active', 'onboarding'].includes(
            manager.hr_status ?? 'active',
          ) &&
          manager.position === 'rh_manager' &&
          Array.isArray(manager.poles) &&
          manager.poles.includes('rh')
        );
        
        if (!managerIsValid) {
          return json(
            {
              error: 'Le référent RH sélectionné n’est plus éligible.',
            },
            400,
          );
        }
      }



      /*
       * Rôle RBAC réel.
       */
      const {
        data: accessRole,
        error: roleError,
      } =
        await admin
          .from(
            'access_roles',
          )
          .select(
            `
              id,
              role_key,
              label,
              business_pole,
              status
            `,
          )
          .eq(
            'role_key',
            request.requested_role,
          )
          .eq(
            'status',
            'active',
          )
          .maybeSingle();


      if (
        roleError
      ) {
        return json(
          {
            error:
              `Impossible de vérifier le rôle RBAC : ${roleError.message}`,
          },
          400,
        );
      }


      if (!accessRole) {
        return json(
          {
            error:
              `Rôle RBAC introuvable ou inactif : ${request.requested_role}`,
          },
          400,
        );
      }


      if (
        accessRole.business_pole &&
        !request.poles.includes(
          accessRole.business_pole,
        )
      ) {
        return json(
          {
            error:
              `Le rôle ${accessRole.label} appartient au pôle ${accessRole.business_pole}, absent du dossier.`,
          },
          400,
        );
      }


      /*
       * Compte Auth.
       *
       * Nouveau collaborateur :
       * invitation email Supabase.
       *
       * Aucun mot de passe temporaire n'est généré ni retourné.
       */
      let userId:
        string | null =
        null;

      let accountAlreadyExisted =
        false;

      let invitationSent =
        false;


      const { data: emailExists, error: accountCheckError } = await admin.rpc('hr_account_email_exists', { p_email: email });
      if (accountCheckError || typeof emailExists !== 'boolean')
        return json({ error: 'La disponibilité du compte n’a pas pu être vérifiée.' }, 502);
      if (emailExists)
        return json({ error: 'Ce compte existe déjà. Sélectionnez son identité dans le parcours de mutation RH.' }, 409);

      // Existing unconfirmed Auth users retain their metadata in the invite endpoint.
      // A fresh attempt nonce proves this response created this identity, including races.
      const onboardingAttemptNonce = crypto.randomUUID();
      const {
        data: invited,
        error:
          inviteError,
      } =
        await admin.auth.admin
          .inviteUserByEmail(
            email,
            {
              data: {
                first_name:
                  request.first_name,
                last_name:
                  request.last_name,
                app_origin:
                  'connect',
                hr_onboarding_request_id: request.id,
                hr_onboarding_attempt_nonce: onboardingAttemptNonce,
              },
              redirectTo:
                'https://workspace.brand-in-a-box.space/reset-password',
            },
          );


      if (
        inviteError
      ) {
        if (
          !isDuplicateEmailError(
            inviteError,
          )
        ) {
          return json(
            {
              error:
                inviteError.message,
            },
            400,
          );
        }


        // A duplicate is never an authorization to attach an existing account.
        return json({ error: 'Ce compte existe déjà. Utilisez une mutation RH avec son identifiant vérifié.' }, 409);
      } else {
        userId =
          invited.user?.id ??
          null;

        invitationSent =
          Boolean(userId);
      }


      if (invited.user?.user_metadata?.hr_onboarding_request_id !== request.id ||
          invited.user?.user_metadata?.hr_onboarding_attempt_nonce !== onboardingAttemptNonce)
        return json({ error: 'Le compte renvoyé n’est pas rattaché à cette création RH. Aucun accès n’a été modifié.' }, 409);

      if (!userId) {
        return json(
          {
            error:
              'Le compte Auth n’a pas pu être créé ou retrouvé.',
          },
          500,
        );
      }


      /*
       * Le trigger Auth doit avoir créé le profil.
       */
      const {
        data: profile,
        error:
          profileLookupError,
      } =
        await admin
          .from('profiles')
          .select('id')
          .eq(
            'id',
            userId,
          )
          .maybeSingle();


      if (
        profileLookupError
      ) {
        return json(
          {
            error:
              `Impossible de vérifier le profil : ${profileLookupError.message}`,
          },
          500,
        );
      }


      if (!profile) {
        return json(
          {
            error:
              'Le compte Auth existe mais le profil BIB est introuvable.',
          },
          500,
        );
      }


      /*
       * Le statut RH dépend de la date d'entrée.
       */
      const today =
        new Date()
          .toISOString()
          .slice(
            0,
            10,
          );


      const hrStatus =
        request.start_date &&
        request.start_date >
          today
          ? 'onboarding'
          : 'active';


      const {
        error:
          profileError,
      } =
        await admin
          .from('profiles')
          .update({
            first_name:
              request.first_name,
            last_name:
              request.last_name,
            email,
            position:
              request.position,
            position_key: request.position_key ?? request.position,
            poles:
              request.poles,
            seniority:
              request.seniority,
            collaborator_type:
              request.collaborator_type ??
              'internal',
            hr_status:
              hrStatus,
            manager_id:
              request.manager_id ??
              null,
            work_mode:
              request.work_mode ?? null,
            subsidiary:
              request.subsidiary ?? null,
          })
          .eq(
            'id',
            userId,
          );

      /*
       * Chartes, politiques et documents rattachés au dossier.
       */
      const attachedDocs: Array<{ name?: string; document_type?: string; document_url?: string | null }> =
        Array.isArray(request.attached_documents) ? request.attached_documents : [];
      if (attachedDocs.length > 0) {
        const { data: existingDocs } = await admin
          .from('rh_employee_documents')
          .select('name')
          .eq('employee_id', userId);
        const existingNames = new Set((existingDocs ?? []).map((d: { name: string }) => d.name));
        const docRows = attachedDocs
          .filter((d) => d?.name && !existingNames.has(d.name))
          .map((d) => ({
            employee_id: userId,
            name: String(d.name).slice(0, 200),
            document_type: d.document_type ?? 'charte',
            source: 'onboarding',
            document_url: d.document_url ?? null,
            description: 'Rattaché lors de l’onboarding RH — à prendre connaissance',
            document_date: new Date().toISOString().slice(0, 10),
            status: 'active',
            created_by: user.id,
          }));
        if (docRows.length) {
          const { error: docsError } = await admin.from('rh_employee_documents').insert(docRows);
          if (docsError) console.error('attach documents failed:', docsError.message);
        }
      }


      if (
        profileError
      ) {
        return json(
          {
            error:
              `Profil non mis à jour : ${profileError.message}`,
          },
          400,
        );
      }


      /*
       * Étape intermédiaire :
       * Compte existant maintenant ;
       */
      const {
        error:
          accountStatusError,
      } =
        await admin
          .from(
            'hr_employee_requests',
          )
          .update({
            status:
              'account_created',
            work_email:
              email,
            created_user_id:
              userId,
            account_created_by:
              user.id,
            account_created_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            requestId,
          )
          .eq(
            'status',
            'hr_validated',
          );


      if (
        accountStatusError
      ) {
        return json(
          {
            error:
              `Compte créé mais dossier non avancé : ${accountStatusError.message}`,
          },
          400,
        );
      }


      /*
       * Détermination du scope.
       *
       * S'il existe exactement un scope
       * déclaré pour le rôle, on l'applique.
       *
       * S'il n'y en a aucun, l'affectation
       * reste sans scope explicite.
       *
       * Plusieurs scopes nécessitent une
       * affectation complémentaire dans
       * Accès & permissions.
       */
      const {
        data: roleScopes,
        error:
          roleScopesError,
      } =
        await admin
          .from(
            'access_role_scopes',
          )
          .select(
            `
              scope_id,
              scope_value
            `,
          )
          .eq(
            'role_id',
            accessRole.id,
          );


      if (
        roleScopesError
      ) {
        return json(
          {
            error:
              `Impossible de vérifier le périmètre du rôle : ${roleScopesError.message}`,
          },
          400,
        );
      }

      if (
        (roleScopes ?? [])
          .length > 1
      ) {
        return json(
          {
            error:
              `Le rôle ${accessRole.label} possède plusieurs périmètres. L’affectation doit être finalisée depuis Accès & permissions.`,
          },
          409,
        );
      }

      if (!accountAlreadyExisted) {
        // Bloc existant :
        // Détermination du scope
        // Vérification des affectations
        // Création éventuelle de l'affectation RBAC
        // Historique RBAC
      }


      const selectedScope =
        roleScopes?.[0] ??
        null;


      /*
       * Une seule affectation active
       * par collaborateur / rôle / scope.
       */
      const {
        data:
          existingAssignment,
        error:
          existingAssignmentError,
      } =
        await admin
          .from(
            'access_assignments',
          )
          .select('id')
          .eq(
            'employee_id',
            userId,
          )
          .eq(
            'role_id',
            accessRole.id,
          )
          .eq(
            'status',
            'active',
          )
          .maybeSingle();


      if (
        existingAssignmentError
      ) {
        return json(
          {
            error:
              `Impossible de vérifier l’affectation RBAC : ${existingAssignmentError.message}`,
          },
          400,
        );
      }


      let accessAssignmentId:
        string | null =
        existingAssignment?.id ??
        null;


      if (
        !existingAssignment
      ) {
        const {
          data:
            assignment,
          error:
            assignmentError,
        } =
          await admin
            .from(
              'access_assignments',
            )
            .insert({
              employee_id:
                userId,
              role_id:
                accessRole.id,
              scope_id:
                selectedScope?.scope_id ??
                null,
              scope_value:
                selectedScope?.scope_value ??
                null,
              status:
                'active',
              starts_at:
                new Date().toISOString(),
              assigned_by:
                user.id,
            })
            .select('id')
            .single();


        if (
          assignmentError
        ) {
          return json(
            {
              error:
                `Compte créé mais affectation RBAC impossible : ${assignmentError.message}`,
            },
            400,
          );
        }


        accessAssignmentId =
          assignment.id;
      }


      /*
       * Historique RBAC.
       */
      await admin
        .from(
          'access_change_history',
        )
        .insert({
          actor_id:
            user.id,
          employee_id:
            userId,
          role_id:
            accessRole.id,
          assignment_id:
            accessAssignmentId,
          change_type:
            'onboarding_provision',
          previous_value:
            null,
          new_value: {
            role_key:
              accessRole.role_key,
            scope_id:
              selectedScope?.scope_id ??
              null,
            scope_value:
              selectedScope?.scope_value ??
              null,
          },
          reason:
            `Provisionnement RH ${request.reference}`,
        });


      /*
       * Finalisation.
       */
      const {
        error:
          completedError,
      } =
        await admin
          .from(
            'hr_employee_requests',
          )
          .update({
            status:
              'completed',
          })
          .eq(
            'id',
            requestId,
          )
          .eq(
            'status',
            'account_created',
          );


      if (
        completedError
      ) {
        return json(
          {
            error:
              `Accès provisionnés mais dossier non finalisé : ${completedError.message}`,
          },
          400,
        );
      }


      const actorName =
        `${profileResult.data?.first_name ?? ''} ${
          profileResult.data?.last_name ?? ''
        }`.trim() ||
        'Utilisateur habilité';


      /*
       * Journal d'audit des comptes : qui a créé / invité, rôles et permissions.
       */
      const { data: grantedPerms } = await admin
        .from('access_permissions')
        .select('allowed, access_interfaces!inner(interface_key), access_actions!inner(action_key)')
        .eq('role_id', accessRole.id)
        .eq('allowed', true)
        .limit(2000);
      const permissionSummary: Record<string, string[]> = {};
      (grantedPerms ?? []).forEach((r: any) => {
        const k = r.access_interfaces?.interface_key;
        if (k) (permissionSummary[k] ??= []).push(r.access_actions?.action_key);
      });
      const auditBase = {
        actor_id: user.id,
        actor_name: actorName,
        target_user_id: userId,
        target_email: email,
        request_id: requestId,
      };
      const { error: auditError } = await admin.from('hr_account_audit_log').insert([
        {
          ...auditBase,
          action: accountAlreadyExisted ? 'collaborator_synced' : 'collaborator_invited',
          details: {
            position: request.position_key ?? request.position,
            poles: request.poles,
            seniority: request.seniority,
            invitation_sent: invitationSent,
            documents: (Array.isArray(request.attached_documents) ? request.attached_documents : []).map((d: any) => d?.name),
          },
        },
        {
          ...auditBase,
          action: 'access_role_assigned',
          role_key: accessRole.role_key,
          details: { role_label: accessRole.label, access_assignment_id: accessAssignmentId },
        },
        {
          ...auditBase,
          action: 'permissions_assigned',
          role_key: accessRole.role_key,
          details: { pages: Object.keys(permissionSummary).length, permissions: permissionSummary },
        },
      ]);
      if (auditError) console.error('account audit failed:', auditError.message);

      await admin
        .from(
          'hr_employee_request_events',
        )
        .insert({
          request_id:
            requestId,
          actor_id:
            user.id,
          actor_name:
            actorName,
          action:
            accountAlreadyExisted
              ? 'Compte existant synchronisé, profil et RBAC mis à jour'
              : 'Compte invité, profil et RBAC provisionnés',
          from_status:
            'account_created',
          to_status:
            'completed',
          note:
            `Rôle ${accessRole.role_key} · pôles ${(
              request.poles ??
              []
            ).join(', ')}`,
        });


      /*
       * Notification RH.
       */
      await admin
        .from(
          'notifications',
        )
        .insert({
          user_id:
            request.manager_id ??
            user.id,
          title:
            `Onboarding terminé — ${request.first_name} ${request.last_name}`,
          message:
            `${email} · rôle ${accessRole.label}`,
          type:
            'success',
          pole_id:
            'rh',
          action_url:
            '/pole/rh/onboarding',
        });


      return json({
        ok: true,
        email,
        userId,
        accountAlreadyExisted,
        invitationSent,
        accessAssignmentId,
      });

    } catch (
      error
    ) {
      console.error(
        'provision-employee-account failed:',
        error,
      );

      return json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Erreur inattendue.',
        },
        500,
      );
    }
  },
);
