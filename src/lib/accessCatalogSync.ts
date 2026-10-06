import { supabase } from '@/integrations/supabase/client';
import {
  pageRegistry,
  PERMISSION_ACTIONS,
  ROLE_DATA_SCOPES,
} from '@/data/permissionMatrix';
import { jobRoles } from '@/data/jobRoles';

type AccessCatalogPayload = {
  roles: Array<{
    role_key: string;
    label: string;
    department: string;
    business_pole: string | null;
    owner_type: 'pole_responsible' | 'direction';
    status: 'active';
  }>;

  interfaces: Array<{
    interface_key: string;
    label: string;
    module: string;
    pole: string;
    path: string;
    status: 'active';
  }>;

  actions: Array<{
    action_key: string;
    label: string;
  }>;

  scopes: Array<{
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

  roleScopes: Array<{
    role_key: string;
    scope_key: string;
    scope_value: string | null;
  }>;
};

const ACTION_LABELS: Record<
  string,
  string
> = {
  read: 'Lire',
  create: 'Créer',
  update: 'Modifier',
  delete: 'Supprimer',
  publish: 'Publier',
  validate: 'Valider',
  administer: 'Administrer',
};

const POLE_LABELS: Record<
  string,
  string
> = {
  direction: 'Direction',
  finance: 'Finance',
  ops: 'Opérations & Logistique',
  supplier: 'Fournisseurs & Produits',
  marketplace: 'Marketplace & Customer',
  support: 'Support & Customer Success',
  marketing: 'Marketing & Communication',
  rh: 'Ressources Humaines',
  audit: 'Qualité & Audit',
  compliance: 'Conformité & Juridique',
  rse: 'RSE & Impact',
  product: 'Produit & Engineering',
  data: 'Data & BI',
  security: 'Security & IT',
};

const SCOPE_DEFINITIONS: AccessCatalogPayload['scopes'] =
  [
    {
      scope_key: 'global',
      label: 'Global',
      scope_type: 'global',
      description:
        'Ensemble du périmètre autorisé.',
    },
    {
      scope_key: 'pole',
      label: 'Pôle',
      scope_type: 'pole',
      description:
        'Données relevant du ou des pôles attribués.',
    },
    {
      scope_key: 'portfolio',
      label: 'Portefeuille',
      scope_type: 'portfolio',
      description:
        'Données du portefeuille attribué au collaborateur.',
    },
    {
      scope_key: 'own_records',
      label: 'Mes enregistrements',
      scope_type: 'record',
      description:
        'Enregistrements appartenant au collaborateur.',
    },
    {
      scope_key: 'region',
      label: 'Région',
      scope_type: 'region',
      description:
        'Périmètre régional défini par la valeur associée.',
    },
    {
      scope_key: 'subsidiary',
      label: 'Filiale',
      scope_type: 'custom',
      description:
        'Périmètre d’une filiale déterminée.',
    },
  ];

const getPrimaryPole = (
  role: (typeof jobRoles)[number],
): string | null => {
  const firstPole = role.poles?.[0];

  if (!firstPole) {
    return null;
  }

  return firstPole;
};

const getOwnerType = (
  role: (typeof jobRoles)[number],
): 'pole_responsible' | 'direction' => {
  if (
    role.id === 'ceo' ||
    role.id.startsWith('svc_') ||
    role.external
  ) {
    return 'direction';
  }

  return 'pole_responsible';
};

const buildPayload =
  (): AccessCatalogPayload => {
    const roles = jobRoles.map((role) => ({
      role_key: role.id,
      label: role.label,
      department: role.department,
      business_pole: getPrimaryPole(role),
      owner_type: getOwnerType(role),
      status: 'active' as const,
    }));

    const interfaces = pageRegistry.map(
      (page) => ({
        interface_key: page.id,
        label: page.label,
        module: page.scope,
        pole:
          page.scope in POLE_LABELS
            ? page.scope
            : page.transversal
              ? 'transversal'
              : page.scope,
        path: page.path,
        status: 'active' as const,
      }),
    );

    const actions =
      PERMISSION_ACTIONS.map((action) => ({
        action_key: action.key,
        label:
          ACTION_LABELS[action.key] ??
          action.label,
      }));

    const roleScopes: AccessCatalogPayload['roleScopes'] =
      [];

    Object.entries(
      ROLE_DATA_SCOPES,
    ).forEach(([roleKey, scope]) => {
      if (scope.ownRecordsOnly) {
        roleScopes.push({
          role_key: roleKey,
          scope_key: 'own_records',
          scope_value: null,
        });
      }

      if (scope.regions?.length) {
        scope.regions.forEach((region) => {
          roleScopes.push({
            role_key: roleKey,
            scope_key: 'region',
            scope_value: region,
          });
        });
      }
    });

    return {
      roles,
      interfaces,
      actions,
      scopes: SCOPE_DEFINITIONS,
      roleScopes,
    };
  };

export const syncAccessCatalog =
  async () => {
    const payload = buildPayload();

    const {
      data,
      error,
    } = await supabase.functions.invoke(
      'sync-rbac-catalog',
      {
        body: payload,
      },
    );

    if (error) {
      throw error;
    }

    return data;
  };

export const getAccessCatalogPreview =
  () => {
    const payload = buildPayload();

    return {
      roles: payload.roles.length,
      interfaces:
        payload.interfaces.length,
      actions: payload.actions.length,
      scopes: payload.scopes.length,
      roleScopes:
        payload.roleScopes.length,
      payload,
    };
  };
