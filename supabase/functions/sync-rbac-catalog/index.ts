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
    owner_type:
      | 'pole_responsible'
      | 'direction';
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
        'Content-Type':
          'application/json',
      },
    },
  );

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return json(
      {
        success: false,
        error: 'Method not allowed',
      },
      405,
    );
  }

  const supabaseUrl =
    Deno.env.get('SUPABASE_URL');

  const serviceRoleKey =
    Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return json(
      {
        success: false,
        error:
          'Supabase environment unavailable',
      },
      500,
    );
  }

  const authHeader =
    request.headers.get(
      'Authorization',
    );

  if (!authHeader) {
    return json(
      {
        success: false,
        error: 'Authentication required',
      },
      401,
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
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
    error: userError,
  } =
    await supabase.auth.getUser(
      authHeader.replace(
        /^Bearer\s+/i,
        '',
      ),
    );

  if (userError || !user) {
    return json(
      {
        success: false,
        error: 'Invalid session',
      },
      401,
    );
  }

  /*
   * La fonction est volontairement réservée
   * aux comptes autorisés à administrer le RBAC.
   *
   * Les fonctions métier existantes
   * is_leadership / has_role sont utilisées
   * directement côté SQL.
   */

  const { data: authorized } =
    await supabase.rpc(
      'is_rbac_catalog_admin',
      {
        p_user_id: user.id,
      },
    );

  if (!authorized) {
    return json(
      {
        success: false,
        error:
          'RBAC catalog administration not authorized',
      },
      403,
    );
  }

  let payload: CatalogPayload;

  try {
    payload =
      (await request.json()) as CatalogPayload;
  } catch {
    return json(
      {
        success: false,
        error: 'Invalid JSON body',
      },
      400,
    );
  }

  const roles =
    payload.roles ?? [];

  const interfaces =
    payload.interfaces ?? [];

  const actions =
    payload.actions ?? [];

  const scopes =
    payload.scopes ?? [];

  const roleScopes =
    payload.roleScopes ?? [];

  if (
    !roles.length ||
    !interfaces.length ||
    !actions.length
  ) {
    return json(
      {
        success: false,
        error:
          'Incomplete RBAC catalog',
      },
      400,
    );
  }

  /*
   * --------------------------------------------------------
   * ROLES
   * --------------------------------------------------------
   */

  const {
    data: roleRows,
    error: roleError,
  } = await supabase
    .from('access_roles')
    .upsert(
      roles,
      {
        onConflict:
          'role_key',
      },
    )
    .select(
      'id, role_key',
    );

  if (roleError) {
    return json(
      {
        success: false,
        step: 'roles',
        error: roleError.message,
      },
      500,
    );
  }

  /*
   * --------------------------------------------------------
   * INTERFACES
   * --------------------------------------------------------
   */

  const {
    error: interfaceError,
  } = await supabase
    .from('access_interfaces')
    .upsert(
      interfaces,
      {
        onConflict:
          'interface_key',
      },
    );

  if (interfaceError) {
    return json(
      {
        success: false,
        step: 'interfaces',
        error:
          interfaceError.message,
      },
      500,
    );
  }

  /*
   * --------------------------------------------------------
   * ACTIONS
   * --------------------------------------------------------
   */

  const {
    error: actionError,
  } = await supabase
    .from('access_actions')
    .upsert(
      actions,
      {
        onConflict:
          'action_key',
      },
    );

  if (actionError) {
    return json(
      {
        success: false,
        step: 'actions',
        error: actionError.message,
      },
      500,
    );
  }

  /*
   * --------------------------------------------------------
   * SCOPES
   * --------------------------------------------------------
   */

  const {
    error: scopeError,
  } = await supabase
    .from('access_scopes')
    .upsert(
      scopes,
      {
        onConflict:
          'scope_key',
      },
    );

  if (scopeError) {
    return json(
      {
        success: false,
        step: 'scopes',
        error: scopeError.message,
      },
      500,
    );
  }

  /*
   * --------------------------------------------------------
   * IDENTIFIANTS
   * --------------------------------------------------------
   */

  const {
    data: interfaceRows,
    error:
      interfaceReadError,
  } = await supabase
    .from('access_interfaces')
    .select(
      'id, interface_key',
    );

  if (interfaceReadError) {
    return json(
      {
        success: false,
        step:
          'interface-identifiers',
        error:
          interfaceReadError.message,
      },
      500,
    );
  }

  const {
    data: actionRows,
    error:
      actionReadError,
  } = await supabase
    .from('access_actions')
    .select(
      'id, action_key',
    );

  if (actionReadError) {
    return json(
      {
        success: false,
        step:
          'action-identifiers',
        error:
          actionReadError.message,
      },
      500,
    );
  }

  const {
    data: scopeRows,
    error:
      scopeReadError,
  } = await supabase
    .from('access_scopes')
    .select(
      'id, scope_key',
    );

  if (scopeReadError) {
    return json(
      {
        success: false,
        step:
          'scope-identifiers',
        error:
          scopeReadError.message,
      },
      500,
    );
  }

  const roleMap = new Map(
    (roleRows ?? []).map(
      (row) => [
        row.role_key,
        row.id,
      ],
    ),
  );

  const interfaceMap = new Map(
    (interfaceRows ?? []).map(
      (row) => [
        row.interface_key,
        row.id,
      ],
    ),
  );

  const actionMap = new Map(
    (actionRows ?? []).map(
      (row) => [
        row.action_key,
        row.id,
      ],
    ),
  );

  const scopeMap = new Map(
    (scopeRows ?? []).map(
      (row) => [
        row.scope_key,
        row.id,
      ],
    ),
  );

  /*
   * --------------------------------------------------------
   * PERMISSIONS
   *
   * On ne copie pas aveuglément les permissions dans cette
   * étape.
   *
   * Les permissions par interface dépendent encore du moteur
   * resolvePagePermissions() et des RESTRICTED_PAGES.
   *
   * On crée d'abord le catalogue.
   * --------------------------------------------------------
   */

  /*
   * --------------------------------------------------------
   * ROLE SCOPES
   * --------------------------------------------------------
   */

  const roleScopeRows =
    roleScopes
      .map((item) => ({
        role_id:
          roleMap.get(
            item.role_key,
          ),
        scope_id:
          scopeMap.get(
            item.scope_key,
          ),
        scope_value:
          item.scope_value,
      }))
      .filter(
        (
          item,
        ): item is {
          role_id: string;
          scope_id: string;
          scope_value:
            | string
            | null;
        } =>
          Boolean(
            item.role_id &&
            item.scope_id,
          ),
      );

  if (roleScopeRows.length) {
    const {
      error:
        roleScopeError,
    } = await supabase
      .from('access_role_scopes')
      .upsert(
        roleScopeRows,
        {
          onConflict:
            'role_id,scope_id,scope_value',
        },
      );

    if (roleScopeError) {
      return json(
        {
          success: false,
          step:
            'role-scopes',
          error:
            roleScopeError.message,
        },
        500,
      );
    }
  }

  return json({
    success: true,
    synchronized: {
      roles: roleMap.size,
      interfaces:
        interfaceMap.size,
      actions: actionMap.size,
      scopes: scopeMap.size,
      roleScopes:
        roleScopeRows.length,
    },
    user_id: user.id,
  });
});