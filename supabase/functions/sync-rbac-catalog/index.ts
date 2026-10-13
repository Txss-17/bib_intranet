
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

type CatalogPayload = {
  roles?: RolePayload[];
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

function isValidRole(role: RolePayload): boolean {
  return (
    /^[a-zA-Z0-9_-]{2,80}$/.test(role.role_key) &&
    role.label.trim().length > 0 &&
    role.label.trim().length <= 150 &&
    role.department.trim().length > 0 &&
    ['pole_responsible', 'direction'].includes(role.owner_type) &&
    ['active', 'draft', 'inactive', 'archived'].includes(role.status)
  );
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(
      { success: false, error: 'Méthode non autorisée.' },
      405,
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      {
        success: false,
        error: 'Configuration Supabase indisponible.',
      },
      500,
    );
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json(
      { success: false, error: 'Authentification requise.' },
      401,
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return json(
      { success: false, error: 'Jeton de session manquant.' },
      401,
    );
  }

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
      { success: false, error: 'Session invalide ou expirée.' },
      401,
    );
  }

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

  const {
    data: authorized,
    error: authorizationError,
  } = await adminClient.rpc('is_rbac_catalog_admin', {
    p_user_id: user.id,
  });

  if (authorizationError) {
    console.error(
      'RBAC authorization check failed:',
      authorizationError.message,
    );

    return json(
      {
        success: false,
        error: 'Impossible de vérifier les droits d’administration RBAC.',
      },
      500,
    );
  }

  if (authorized !== true) {
    return json(
      {
        success: false,
        error: 'Vous n’êtes pas autorisé à administrer le catalogue RBAC.',
      },
      403,
    );
  }

  let payload: CatalogPayload;

  try {
    payload = await request.json();
  } catch {
    return json(
      { success: false, error: 'Corps JSON invalide.' },
      400,
    );
  }

  const roles = payload.roles ?? [];
  const interfaces = payload.interfaces ?? [];
  const actions = payload.actions ?? [];
  const scopes = payload.scopes ?? [];
  const roleScopes = payload.roleScopes ?? [];

  if (!roles.length || !interfaces.length || !actions.length || !scopes.length) {
    return json(
      {
        success: false,
        error: 'Catalogue incomplet : rôles, interfaces, actions et périmètres sont requis.',
      },
      400,
    );
  }

  const roleKeys = new Set<string>();

  for (const role of roles) {
    if (!isValidRole(role)) {
      return json(
        {
          success: false,
          step: 'validate-roles',
          error: `Définition invalide pour le rôle « ${role.role_key || 'sans identifiant'} ».`,
        },
        400,
      );
    }

    if (roleKeys.has(role.role_key)) {
      return json(
        {
          success: false,
          step: 'validate-roles',
          error: `Clé de rôle dupliquée : ${role.role_key}.`,
        },
        400,
      );
    }

    roleKeys.add(role.role_key);
  }

  const interfaceKeys = new Set<string>();

  for (const item of interfaces) {
    if (!item.interface_key || !item.label || !item.path) {
      return json(
        {
          success: false,
          step: 'validate-interfaces',
          error: 'Une interface possède une clé, un libellé ou un chemin vide.',
        },
        400,
      );
    }

    if (interfaceKeys.has(item.interface_key)) {
      return json(
        {
          success: false,
          step: 'validate-interfaces',
          error: `Clé d’interface dupliquée : ${item.interface_key}.`,
        },
        400,
      );
    }

    interfaceKeys.add(item.interface_key);
  }

  const {
    data: roleRows,
    error: roleError,
  } = await adminClient
    .from('access_roles')
    .upsert(roles, { onConflict: 'role_key' })
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

  const { error: interfaceError } = await adminClient
    .from('access_interfaces')
    .upsert(interfaces, { onConflict: 'interface_key' });

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

  const { error: actionError } = await adminClient
    .from('access_actions')
    .upsert(actions, { onConflict: 'action_key' });

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

  const { error: scopeError } = await adminClient
    .from('access_scopes')
    .upsert(scopes, { onConflict: 'scope_key' });

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

  const [
    roleResult,
    interfaceResult,
    actionResult,
    scopeResult,
  ] = await Promise.all([
    adminClient.from('access_roles').select('id, role_key'),
    adminClient.from('access_interfaces').select('id, interface_key'),
    adminClient.from('access_actions').select('id, action_key'),
    adminClient.from('access_scopes').select('id, scope_key'),
  ]);

  for (const [step, result] of [
    ['role-identifiers', roleResult],
    ['interface-identifiers', interfaceResult],
    ['action-identifiers', actionResult],
    ['scope-identifiers', scopeResult],
  ] as const) {
    if (result.error) {
      return json(
        {
          success: false,
          step,
          error: result.error.message,
        },
        500,
      );
    }
  }

  const roleMap = new Map(
    (roleResult.data ?? []).map((row) => [row.role_key, row.id]),
  );
  const interfaceMap = new Map(
    (interfaceResult.data ?? []).map((row) => [row.interface_key, row.id]),
  );
  const actionMap = new Map(
    (actionResult.data ?? []).map((row) => [row.action_key, row.id]),
  );
  const scopeMap = new Map(
    (scopeResult.data ?? []).map((row) => [row.scope_key, row.id]),
  );

  const roleScopeRows: Array<{
    role_id: string;
    scope_id: string;
    scope_value: string | null;
  }> = [];

  const unresolved: string[] = [];
  const scopeRolesToReplace = new Set<string>();
  const uniqueScopeKeys = new Set<string>();

  for (const item of roleScopes) {
    const roleId = roleMap.get(item.role_key);
    const scopeId = scopeMap.get(item.scope_key);

    if (!roleId || !scopeId) {
      unresolved.push(`${item.role_key}:${item.scope_key}`);
      continue;
    }

    const uniqueKey = `${item.role_key}|${item.scope_key}|${item.scope_value ?? ''}`;

    if (uniqueScopeKeys.has(uniqueKey)) {
      continue;
    }

    uniqueScopeKeys.add(uniqueKey);
    scopeRolesToReplace.add(roleId);

    roleScopeRows.push({
      role_id: roleId,
      scope_id: scopeId,
      scope_value: item.scope_value,
    });
  }

  if (unresolved.length > 0) {
    return json(
      {
        success: false,
        step: 'role-scopes-resolution',
        error: 'Certaines références de rôle ou de périmètre sont introuvables.',
        unresolved: unresolved.slice(0, 20),
        unresolved_count: unresolved.length,
      },
      500,
    );
  }

  // Remplacer les périmètres des rôles explicitement présents dans le payload.
  // Les rôles personnalisés absents du payload restent inchangés.
  for (const roleId of scopeRolesToReplace) {
    const { error } = await adminClient
      .from('access_role_scopes')
      .delete()
      .eq('role_id', roleId);

    if (error) {
      return json(
        {
          success: false,
          step: 'role-scopes-delete',
          error: error.message,
        },
        500,
      );
    }
  }

  if (roleScopeRows.length > 0) {
    const { error } = await adminClient
      .from('access_role_scopes')
      .insert(roleScopeRows);

    if (error) {
      console.error('RBAC role scopes sync failed:', error.message);

      return json(
        {
          success: false,
          step: 'role-scopes-insert',
          error: error.message,
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

