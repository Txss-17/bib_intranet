import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type CatalogPayload = {
  roles?: Array<{
    role_key: string;
    label: string;
    department: string;
    business_pole: string | null;
    owner_type: 'pole_responsible' | 'direction';
    status: 'active';
  }>;

  interfaces?: Array<{
    interface_key: string;
    label: string;
    module: string;
    pole: string;
    path: string;
    status: 'active';
  }>;

  actions?: Array<{
    action_key: string;
    label: string;
  }>;

  scopes?: Array<{
    scope_key: string;
    label: string;
    scope_type:
      | 'global'
      | 'pole'
      | 'portfolio'
      | 'region'
      | 'record'
      | 'custom';
    description: string;
  }>;

  roleScopes?: Array<{
    role_key: string;
    scope_key: string;
    scope_value: string | null;
  }>;
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return json(
      { success: false, error: 'Method not allowed' },
      405,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get(
    'SUPABASE_SERVICE_ROLE_KEY',
  );

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        success: false,
        error: 'Supabase environment unavailable',
      },
      500,
    );
  }

  // 1. Authentifier l'appelant avec son JWT utilisateur.
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json(
      { success: false, error: 'Authentication required' },
      401,
    );
  }

  const token = authHeader
    .replace(/^Bearer\s+/i, '')
    .trim();

  if (!token) {
    return json(
      { success: false, error: 'Authentication token missing' },
      401,
    );
  }

  // Client dédié à la validation du JWT.
  // Ne pas lui transmettre le JWT comme header global.
  const authClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return json(
      { success: false, error: 'Invalid session' },
      401,
    );
  }

  // 2. Client administratif indépendant.
  // Aucun Authorization utilisateur n'est injecté ici.
  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  // 3. Vérifier l'autorisation métier avant toute écriture.
  const {
    data: authorized,
    error: authorizationError,
  } = await adminClient.rpc(
    'is_rbac_catalog_admin',
    {
      p_user_id: user.id,
    },
  );

  if (authorizationError) {
    console.error(
      'RBAC authorization check failed:',
      authorizationError.message,
    );

    return json(
      {
        success: false,
        error: 'Unable to verify RBAC administration permission',
      },
      500,
    );
  }

  if (authorized !== true) {
    return json(
      {
        success: false,
        error: 'RBAC catalog administration not authorized',
      },
      403,
    );
  }

  // 4. Lire et contrôler le corps de la requête.
  let payload: CatalogPayload;

  try {
    payload = await request.json();
  } catch {
    return json(
      { success: false, error: 'Invalid JSON body' },
      400,
    );
  }

  const roles = payload.roles ?? [];
  const interfaces = payload.interfaces ?? [];
  const actions = payload.actions ?? [];
  const scopes = payload.scopes ?? [];
  const roleScopes = payload.roleScopes ?? [];

  if (
    !roles.length ||
    !interfaces.length ||
    !actions.length
  ) {
    return json(
      {
        success: false,
        error: 'Incomplete RBAC catalog',
      },
      400,
    );
  }

  // 5. Synchroniser les rôles.
  const {
    data: roleRows,
    error: roleError,
  } = await adminClient
    .from('access_roles')
    .upsert(roles, {
      onConflict: 'role_key',
    })
    .select('id, role_key');

  if (roleError) {
    console.error('RBAC roles sync failed:', roleError.message);

    return json(
      {
        success: false,
        step: 'roles',
        error: roleError.message,
      },
      500,
    );
  }

  // 6. Synchroniser les interfaces.
  const { error: interfaceError } = await adminClient
    .from('access_interfaces')
    .upsert(interfaces, {
      onConflict: 'interface_key',
    });

  if (interfaceError) {
    console.error(
      'RBAC interfaces sync failed:',
      interfaceError.message,
    );

    return json(
      {
        success: false,
        step: 'interfaces',
        error: interfaceError.message,
      },
      500,
    );
  }

  // 7. Synchroniser les actions.
  const { error: actionError } = await adminClient
    .from('access_actions')
    .upsert(actions, {
      onConflict: 'action_key',
    });

  if (actionError) {
    console.error('RBAC actions sync failed:', actionError.message);

    return json(
      {
        success: false,
        step: 'actions',
        error: actionError.message,
      },
      500,
    );
  }

  // 8. Synchroniser les périmètres.
  const { error: scopeError } = await adminClient
    .from('access_scopes')
    .upsert(scopes, {
      onConflict: 'scope_key',
    });

  if (scopeError) {
    console.error('RBAC scopes sync failed:', scopeError.message);

    return json(
      {
        success: false,
        step: 'scopes',
        error: scopeError.message,
      },
      500,
    );
  }

  // 9. Charger les identifiants réels après synchronisation.
  const [
    interfaceResult,
    actionResult,
    scopeResult,
  ] = await Promise.all([
    adminClient
      .from('access_interfaces')
      .select('id, interface_key'),

    adminClient
      .from('access_actions')
      .select('id, action_key'),

    adminClient
      .from('access_scopes')
      .select('id, scope_key'),
  ]);

  if (interfaceResult.error) {
    return json(
      {
        success: false,
        step: 'interface-identifiers',
        error: interfaceResult.error.message,
      },
      500,
    );
  }

  if (actionResult.error) {
    return json(
      {
        success: false,
        step: 'action-identifiers',
        error: actionResult.error.message,
      },
      500,
    );
  }

  if (scopeResult.error) {
    return json(
      {
        success: false,
        step: 'scope-identifiers',
        error: scopeResult.error.message,
      },
      500,
    );
  }

  const roleMap = new Map(
    (roleRows ?? []).map((row) => [
      row.role_key,
      row.id,
    ]),
  );

  const interfaceMap = new Map(
    (interfaceResult.data ?? []).map((row) => [
      row.interface_key,
      row.id,
    ]),
  );

  const actionMap = new Map(
    (actionResult.data ?? []).map((row) => [
      row.action_key,
      row.id,
    ]),
  );

  const scopeMap = new Map(
    (scopeResult.data ?? []).map((row) => [
      row.scope_key,
      row.id,
    ]),
  );

  // 10. Préparer les associations rôle-périmètre.
  const roleScopeRows: Array<{
    role_id: string;
    scope_id: string;
    scope_value: string | null;
  }> = [];

  const unresolvedRoleScopes: string[] = [];

  for (const item of roleScopes) {
    const roleId = roleMap.get(item.role_key);
    const scopeId = scopeMap.get(item.scope_key);

    if (!roleId || !scopeId) {
      unresolvedRoleScopes.push(
        `${item.role_key}:${item.scope_key}`,
      );
      continue;
    }

    roleScopeRows.push({
      role_id: roleId,
      scope_id: scopeId,
      scope_value: item.scope_value,
    });
  }

  if (unresolvedRoleScopes.length > 0) {
    return json(
      {
        success: false,
        step: 'role-scopes-resolution',
        error: 'Some role/scope references could not be resolved',
        unresolved: unresolvedRoleScopes.slice(0, 20),
        unresolved_count: unresolvedRoleScopes.length,
      },
      500,
    );
  }

  // 11. Écrire les associations.
  if (roleScopeRows.length > 0) {
    const { error: roleScopeError } = await adminClient
      .from('access_role_scopes')
      .upsert(roleScopeRows, {
        onConflict: 'role_id,scope_id,scope_value',
        ignoreDuplicates: true,
      });

    if (roleScopeError) {
      console.error(
        'RBAC role scopes sync failed:',
        roleScopeError.message,
      );

      return json(
        {
          success: false,
          step: 'role-scopes',
          error: roleScopeError.message,
        },
        500,
      );
    }
  }

  return json({
    success: true,
    synchronized: {
      roles: roleMap.size,
      interfaces: interfaceMap.size,
      actions: actionMap.size,
      scopes: scopeMap.size,
      roleScopes: roleScopeRows.length,
    },
    user_id: user.id,
  });
});
