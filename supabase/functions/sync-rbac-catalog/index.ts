import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RolePayload = {
  role_key: string;
  label: string;
  department: string;
  business_pole: string | null;
  owner_type: 'pole_responsible' | 'direction';
  status: 'active' | 'draft' | 'inactive' | 'archived';
  description?: string | null;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'executive' | null;
  is_external?: boolean;
  read_only?: boolean;
  poles?: string[];
  landing_path?: string | null;
};

type InterfacePayload = {
  interface_key: string;
  label: string;
  module: string;
  pole: string;
  path: string;
  status: 'active' | 'draft' | 'inactive' | 'archived';
};

type ActionPayload = {
  action_key: string;
  label: string;
  description?: string | null;
};

type ScopePayload = {
  scope_key: string;
  label: string;
  scope_type: 'global' | 'pole' | 'portfolio' | 'region' | 'record' | 'custom';
  description: string;
};

type RoleScopePayload = {
  role_key: string;
  scope_key: string;
  scope_value: string | null;
};

type CatalogPayload = {
  roles?: RolePayload[];
  interfaces?: InterfacePayload[];
  actions?: ActionPayload[];
  scopes?: ScopePayload[];
  roleScopes?: RoleScopePayload[];
};

type IdRow = {
  id: string;
  role_key?: string;
  interface_key?: string;
  action_key?: string;
  scope_key?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(step: string, message: string, status = 500) {
  return json(
    {
      success: false,
      step,
      error: message,
    },
    status,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidKey(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_-]{2,100}$/.test(value)
  );
}

function isNonEmptyString(
  value: unknown,
  maxLength = 200,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function hasUniqueKeys<T>(
  rows: T[],
  keyOf: (row: T) => string,
): boolean {
  const seen = new Set<string>();

  for (const row of rows) {
    const key = keyOf(row);

    if (seen.has(key)) return false;
    seen.add(key);
  }

  return true;
}

function validatePayload(payload: CatalogPayload): string | null {
  const roles = payload.roles ?? [];
  const interfaces = payload.interfaces ?? [];
  const actions = payload.actions ?? [];
  const scopes = payload.scopes ?? [];
  const roleScopes = payload.roleScopes ?? [];

  if (
    roles.length === 0 ||
    interfaces.length === 0 ||
    actions.length === 0 ||
    scopes.length === 0
  ) {
    return 'Catalogue incomplet : rôles, interfaces, actions et périmètres sont requis.';
  }

  if (
    roles.length > 1000 ||
    interfaces.length > 5000 ||
    actions.length > 100 ||
    scopes.length > 100 ||
    roleScopes.length > 10000
  ) {
    return 'Le catalogue dépasse les limites autorisées.';
  }

  if (!hasUniqueKeys(roles, (row) => row.role_key)) {
    return 'Des clés de rôle sont dupliquées.';
  }

  if (!hasUniqueKeys(interfaces, (row) => row.interface_key)) {
    return 'Des clés d’interface sont dupliquées.';
  }

  if (!hasUniqueKeys(actions, (row) => row.action_key)) {
    return 'Des clés d’action sont dupliquées.';
  }

  if (!hasUniqueKeys(scopes, (row) => row.scope_key)) {
    return 'Des clés de périmètre sont dupliquées.';
  }

  for (const role of roles) {
    if (
      !isValidKey(role.role_key) ||
      !isNonEmptyString(role.label, 150) ||
      !isNonEmptyString(role.department, 150) ||
      !['pole_responsible', 'direction'].includes(role.owner_type) ||
      !['active', 'draft', 'inactive', 'archived'].includes(role.status)
    ) {
      return `Définition invalide pour le rôle « ${role.role_key ?? 'inconnu'} ».`;
    }

    if (
      role.seniority != null &&
      !['junior', 'mid', 'senior', 'lead', 'executive'].includes(
        role.seniority,
      )
    ) {
      return `Séniorité invalide pour le rôle « ${role.role_key} ».`;
    }

    if (
      role.poles !== undefined &&
      (!Array.isArray(role.poles) ||
        role.poles.some((pole) => typeof pole !== 'string'))
    ) {
      return `Liste de pôles invalide pour « ${role.role_key} ».`;
    }
  }

  for (const item of interfaces) {
    if (
      !isValidKey(item.interface_key) ||
      !isNonEmptyString(item.label, 200) ||
      !isNonEmptyString(item.path, 500) ||
      !['active', 'draft', 'inactive', 'archived'].includes(item.status)
    ) {
      return `Définition invalide pour l’interface « ${item.interface_key ?? 'inconnue'} ».`;
    }
  }

  for (const action of actions) {
    if (
      !isValidKey(action.action_key) ||
      !isNonEmptyString(action.label, 150)
    ) {
      return `Définition d’action invalide : ${action.action_key ?? 'inconnue'}.`;
    }
  }

  const validScopeTypes = [
    'global',
    'pole',
    'portfolio',
    'region',
    'record',
    'custom',
  ];

  for (const scope of scopes) {
    if (
      !isValidKey(scope.scope_key) ||
      !isNonEmptyString(scope.label, 150) ||
      !validScopeTypes.includes(scope.scope_type)
    ) {
      return `Définition de périmètre invalide : ${scope.scope_key ?? 'inconnu'}.`;
    }
  }

  const roleKeys = new Set(roles.map((role) => role.role_key));
  const scopeKeys = new Set(scopes.map((scope) => scope.scope_key));

  for (const item of roleScopes) {
    if (
      !roleKeys.has(item.role_key) ||
      !scopeKeys.has(item.scope_key) ||
      (item.scope_value !== null &&
        typeof item.scope_value !== 'string')
    ) {
      return `Référence de périmètre invalide : ${item.role_key}:${item.scope_key}.`;
    }
  }

  return null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return errorResponse(
      'method',
      'Seule la méthode POST est autorisée.',
      405,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase server environment variables.');

    return errorResponse(
      'configuration',
      'Configuration serveur Supabase incomplète.',
      500,
    );
  }

  const authorization = request.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return errorResponse(
      'authentication',
      'Une session authentifiée est obligatoire.',
      401,
    );
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return errorResponse(
      'authentication',
      'Jeton de session manquant.',
      401,
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    return errorResponse(
      'authentication',
      'Session invalide ou expirée.',
      401,
    );
  }

  // Le client service_role est réservé à la fonction serveur.
  // Le droit d'administrer le catalogue est contrôlé indépendamment.
  const {
    data: authorized,
    error: authorizationError,
  } = await adminClient.rpc('is_rbac_catalog_admin', {
    p_user_id: user.id,
  });

  if (authorizationError) {
    console.error(
      'RBAC authorization RPC failed:',
      authorizationError.message,
    );

    return errorResponse(
      'authorization',
      'Impossible de vérifier les droits RBAC. Vérifiez la migration is_rbac_catalog_admin.',
      500,
    );
  }

  if (authorized !== true) {
    return errorResponse(
      'authorization',
      'Vous ne disposez pas des droits nécessaires pour synchroniser le catalogue.',
      403,
    );
  }

  let payload: CatalogPayload;

  try {
    const rawBody: unknown = await request.json();

    if (!isObject(rawBody)) {
      return errorResponse('payload', 'Le corps JSON doit être un objet.', 400);
    }

    payload = rawBody as CatalogPayload;
  } catch {
    return errorResponse('payload', 'Le corps JSON est invalide.', 400);
  }

  const validationError = validatePayload(payload);

  if (validationError) {
    return errorResponse('validation', validationError, 400);
  }

  const roles = payload.roles!;
  const interfaces = payload.interfaces!;
  const actions = payload.actions!;
  const scopes = payload.scopes!;
  const roleScopes = payload.roleScopes ?? [];

  try {
    // 1. Rôles : upsert sur la clé métier.
    const { error: rolesError } = await adminClient
      .from('access_roles')
      .upsert(roles, { onConflict: 'role_key' });

    if (rolesError) {
      console.error('RBAC roles upsert failed:', rolesError.message);
      return errorResponse('roles', rolesError.message);
    }

    // 2. Interfaces : aucun effacement des interfaces existantes.
    const { error: interfacesError } = await adminClient
      .from('access_interfaces')
      .upsert(interfaces, { onConflict: 'interface_key' });

    if (interfacesError) {
      console.error(
        'RBAC interfaces upsert failed:',
        interfacesError.message,
      );

      return errorResponse('interfaces', interfacesError.message);
    }

    // 3. Actions.
    const { error: actionsError } = await adminClient
      .from('access_actions')
      .upsert(actions, { onConflict: 'action_key' });

    if (actionsError) {
      console.error('RBAC actions upsert failed:', actionsError.message);
      return errorResponse('actions', actionsError.message);
    }

    // 4. Périmètres.
    const { error: scopesError } = await adminClient
      .from('access_scopes')
      .upsert(scopes, { onConflict: 'scope_key' });

    if (scopesError) {
      console.error('RBAC scopes upsert failed:', scopesError.message);
      return errorResponse('scopes', scopesError.message);
    }

    // 5. Charger les identifiants réels, sans les déduire des clés.
    const [
      rolesResult,
      interfacesResult,
      actionsResult,
      scopesResult,
    ] = await Promise.all([
      adminClient.from('access_roles').select('id, role_key'),
      adminClient.from('access_interfaces').select('id, interface_key'),
      adminClient.from('access_actions').select('id, action_key'),
      adminClient.from('access_scopes').select('id, scope_key'),
    ]);

    for (const [step, result] of [
      ['role-identifiers', rolesResult],
      ['interface-identifiers', interfacesResult],
      ['action-identifiers', actionsResult],
      ['scope-identifiers', scopesResult],
    ] as const) {
      if (result.error) {
        console.error(`RBAC ${step} failed:`, result.error.message);
        return errorResponse(step, result.error.message);
      }
    }

    const roleMap = new Map(
      ((rolesResult.data ?? []) as IdRow[]).map((row) => [
        row.role_key!,
        row.id,
      ]),
    );

    const interfaceMap = new Map(
      ((interfacesResult.data ?? []) as IdRow[]).map((row) => [
        row.interface_key!,
        row.id,
      ]),
    );

    const actionMap = new Map(
      ((actionsResult.data ?? []) as IdRow[]).map((row) => [
        row.action_key!,
        row.id,
      ]),
    );

    const scopeMap = new Map(
      ((scopesResult.data ?? []) as IdRow[]).map((row) => [
        row.scope_key!,
        row.id,
      ]),
    );

    const roleScopeRows: Array<{
      role_id: string;
      scope_id: string;
      scope_value: string | null;
    }> = [];

    const uniqueScopeRows = new Set<string>();

    for (const item of roleScopes) {
      const roleId = roleMap.get(item.role_key);
      const scopeId = scopeMap.get(item.scope_key);

      if (!roleId || !scopeId) {
        return errorResponse(
          'role-scopes-resolution',
          `Référence introuvable : ${item.role_key}:${item.scope_key}.`,
        );
      }

      const uniqueKey =
        `${roleId}|${scopeId}|${item.scope_value ?? ''}`;

      if (uniqueScopeRows.has(uniqueKey)) continue;
      uniqueScopeRows.add(uniqueKey);

      roleScopeRows.push({
        role_id: roleId,
        scope_id: scopeId,
        scope_value: item.scope_value,
      });
    }

    // Ne remplacer les périmètres que pour les rôles explicitement fournis.
    // Les rôles personnalisés absents de ce payload ne sont pas touchés.
    const suppliedRoleIds = [
      ...new Set(
        roles
          .map((role) => roleMap.get(role.role_key))
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    for (const roleId of suppliedRoleIds) {
      const { error: deleteError } = await adminClient
        .from('access_role_scopes')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) {
        console.error(
          'RBAC role scopes cleanup failed:',
          deleteError.message,
        );

        return errorResponse('role-scopes-delete', deleteError.message);
      }
    }

    if (roleScopeRows.length > 0) {
      const { error: insertError } = await adminClient
        .from('access_role_scopes')
        .insert(roleScopeRows);

      if (insertError) {
        console.error(
          'RBAC role scopes insert failed:',
          insertError.message,
        );

        return errorResponse('role-scopes-insert', insertError.message);
      }
    }

    // Journaliser la synchronisation.
    const { error: historyError } = await adminClient
      .from('access_change_history')
      .insert({
        actor_id: user.id,
        change_type: 'catalog_sync',
        previous_value: null,
        new_value: {
          roles: roles.length,
          interfaces: interfaces.length,
          actions: actions.length,
          scopes: scopes.length,
          roleScopes: roleScopeRows.length,
        },
        reason: 'Synchronisation du catalogue RBAC',
      });

    if (historyError) {
      // L'échec du journal est visible dans les logs, mais ne masque pas
      // une synchronisation qui a déjà réussi.
      console.error(
        'RBAC audit log insert failed:',
        historyError.message,
      );
    }

    return json({
      success: true,
      synchronized: {
        roles: roles.length,
        interfaces: interfaces.length,
        actions: actions.length,
        scopes: scopes.length,
        roleScopes: roleScopeRows.length,
      },
    });
  } catch (error) {
    console.error('Unexpected RBAC synchronization error:', error);

    return errorResponse(
      'unexpected',
      error instanceof Error
        ? error.message
        : 'Erreur inattendue pendant la synchronisation.',
    );
  }
});
