// ---------------------------------------------------------------------------
// MATRICE CENTRALISÉE DES PERMISSIONS
// RBAC + restrictions de données + actions
// ---------------------------------------------------------------------------
//
// Architecture BIB :
//
// 1. Pôles
//    -> quels pôles sont visibles
//
// 2. Pages
//    -> quelles pages du pôle sont visibles
//
// 3. Actions
//    -> lire / créer / modifier / supprimer / publier / valider / administrer
//
// 4. Données
//    -> régions / filiales / enregistrements propres
//
// Toute l'interface s'appuie sur cette matrice.
// La sécurité réelle doit également être appliquée côté backend / RLS.
// ---------------------------------------------------------------------------

import {
  moduleNavigations,
  transversalNavigations,
  ModuleNavigationItem,
} from '@/data/moduleNavigations';

import {
  jobRoles,
  JobRole,
} from '@/data/jobRoles';

import {
  Seniority,
} from '@/data/permissionRules';

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'validate'
  | 'administer';

export const PERMISSION_ACTIONS: {
  key: PermissionAction;
  label: string;
}[] = [
  { key: 'read', label: 'Lire' },
  { key: 'create', label: 'Créer' },
  { key: 'update', label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
  { key: 'publish', label: 'Publier' },
  { key: 'validate', label: 'Valider' },
  { key: 'administer', label: 'Administrer' },
];

export type ActionSet = Record<PermissionAction, boolean>;

export const NO_ACCESS: ActionSet = {
  read: false,
  create: false,
  update: false,
  delete: false,
  publish: false,
  validate: false,
  administer: false,
};

export const FULL_ACCESS: ActionSet = {
  read: true,
  create: true,
  update: true,
  delete: true,
  publish: true,
  validate: true,
  administer: true,
};

export const makeActions = (
  allowed: PermissionAction[],
): ActionSet =>
  PERMISSION_ACTIONS.reduce(
    (acc, action) => {
      acc[action.key] = allowed.includes(action.key);
      return acc;
    },
    { ...NO_ACCESS } as ActionSet,
  );

// ---------------------------------------------------------------------------
// REGISTRE DES PAGES
// ---------------------------------------------------------------------------
//
// Identifiant stable :
//   pole.page
//   module.page
//
// Exemple :
//   finance.cashflow
//   product.engineering
//   security.infrastructure
//   gateway.messages
// ---------------------------------------------------------------------------

export interface PageDescriptor {
  id: string;
  scope: string;
  label: string;
  path: string;
  transversal?: boolean;
}

const buildRegistry = (): PageDescriptor[] => {
  const out: PageDescriptor[] = [];

  const push = (
    scope: string,
    items: ModuleNavigationItem[],
    transversal = false,
  ) => {
    for (const item of items) {
      out.push({
        id: `${scope}.${item.id}`,
        scope,
        label: item.label,
        path: item.path,
        transversal,
      });
    }
  };

  Object.entries(moduleNavigations).forEach(
    ([pole, items]) => {
      push(pole, items.items);
    },
  );

  Object.entries(transversalNavigations).forEach(
    ([module, items]) => {
      push(module, (items as any).items ?? items, true);
    },
  );

  // -------------------------------------------------------------------------
  // Pages transversales hors navigation modulaire
  // -------------------------------------------------------------------------

  out.push(
    {
      id: 'app.dashboard',
      scope: 'app',
      label: 'Tableau de bord',
      path: '/',
      transversal: true,
    },
    {
      id: 'app.feed',
      scope: 'app',
      label: 'Internal Feed',
      path: '/feed',
      transversal: true,
    },
    {
      id: 'app.documents',
      scope: 'app',
      label: 'Documents',
      path: '/documents',
      transversal: true,
    },
    {
      id: 'app.compliance-audit',
      scope: 'app',
      label: 'Conformité & Audit',
      path: '/compliance-audit',
      transversal: true,
    },
    {
      id: 'app.settings',
      scope: 'app',
      label: 'Paramètres',
      path: '/settings',
      transversal: true,
    },

    // Administration
    {
      id: 'admin.roles',
      scope: 'admin',
      label: 'Rôles & Permissions',
      path: '/admin/roles-permissions',
      transversal: true,
    },
    {
      id: 'admin.test-accounts',
      scope: 'admin',
      label: 'Comptes de test / Visualiser comme',
      path: '/admin/test-accounts',
      transversal: true,
    },
  );

  return out;
};

export const pageRegistry: PageDescriptor[] =
  buildRegistry();

export const getPage = (
  id: string,
): PageDescriptor | undefined =>
  pageRegistry.find((page) => page.id === id);

export const getPageByPath = (
  path: string,
): PageDescriptor | undefined =>
  pageRegistry.find((page) => page.path === path);

// ---------------------------------------------------------------------------
// PROFILS AUTORISÉS POUR LES PAGES SENSIBLES
// ---------------------------------------------------------------------------
//
// Une page présente dans cette liste n'est accessible qu'aux rôles explicitement
// autorisés.
//
// IMPORTANT : les noms de pôles ne sont plus utilisés ici comme mécanisme
// d'autorisation. Le rôle doit être explicitement autorisé.
// ---------------------------------------------------------------------------

const PRODUCT_OWNERS = [
  'ceo',
  'cto',
  'responsable_tech',
  'product_manager',
  'product_owner',
  'devops_engineer',
  'sre',
  'admin_systeme',
  'dba',
  'architecte_logiciel',
  'architecte_cloud',
  'dev_backend',
  'dev_fullstack',
  'rssi',
  'ingenieur_cybersecurite',
];

const SECURITY_OWNERS = [
  'ceo',
  'cto',
  'responsable_tech',
  'rssi',
  'ingenieur_cybersecurite',
  'analyste_cyber',
  'gestionnaire_iam',
  'admin_systeme',
  'devops_engineer',
  'sre',
  'architecte_cloud',
  'dba',
];

const FINANCE_OWNERS = [
  'ceo',
  'cfo',
  'comptable',
  'controleur_gestion',
  'analyste_financier',
  'tresorier',
  'gestionnaire_paiements',
  'gestionnaire_facturation',
];

const RH_OWNERS = [
  'ceo',
  'directeur_rh',
  'responsable_rh',
  'gestionnaire_paie',
  'gestionnaire_admin_rh',
  'charge_recrutement',
];

const LEGAL_OWNERS = [
  'ceo',
  'juriste',
  'conformite_juridique',
  'responsable_conformite',
  'analyste_rgpd',
  'gestionnaire_contrats',
];

const AUDIT_OWNERS = [
  'ceo',
  'directeur_qualite',
  'responsable_qualite',
  'auditeur_qualite',
  'auditeur_terrain',
  'responsable_conformite',
  'conformite_juridique',
];

const ADMIN_OWNERS = [
  'ceo',
  'cto',
  'responsable_tech',
  'admin_systeme',
  'rssi',
  'directeur_rh',
  'responsable_rh',
];

// ---------------------------------------------------------------------------
// PAGES RESTREINTES
// ---------------------------------------------------------------------------

export const RESTRICTED_PAGES: Record<
  string,
  string[]
> = {
  // -------------------------------------------------------------------------
  // PRODUIT & ENGINEERING
  // -------------------------------------------------------------------------

  'product.engineering': PRODUCT_OWNERS,
  'product.integrations': PRODUCT_OWNERS,
  'product.documentation': PRODUCT_OWNERS,
  'product.studio': PRODUCT_OWNERS,
  'product.innovation': PRODUCT_OWNERS,
  'product.code': PRODUCT_OWNERS,
  'product.console': PRODUCT_OWNERS,

  // -------------------------------------------------------------------------
  // SECURITY & IT
  // -------------------------------------------------------------------------

  'security.access': SECURITY_OWNERS,
  'security.security': SECURITY_OWNERS,
  'security.infrastructure': SECURITY_OWNERS,
  'security.environments': SECURITY_OWNERS,
  'security.vpn': SECURITY_OWNERS,
  'security.logs': SECURITY_OWNERS,

  // -------------------------------------------------------------------------
  // ADMINISTRATION
  // -------------------------------------------------------------------------

  'admin.roles': ADMIN_OWNERS,
  'admin.test-accounts': ADMIN_OWNERS,

  // -------------------------------------------------------------------------
  // FINANCE
  // -------------------------------------------------------------------------

  'finance.salaries': RH_OWNERS.concat([
    'ceo',
    'cfo',
  ]),

  'finance.cashflow': FINANCE_OWNERS,

  'finance.guarantee': FINANCE_OWNERS,

  'finance.cards': FINANCE_OWNERS,

  'finance.subscriptions': FINANCE_OWNERS,

  'finance.reconciliation': FINANCE_OWNERS,

  'finance.payouts': FINANCE_OWNERS,

  // -------------------------------------------------------------------------
  // RH
  // -------------------------------------------------------------------------

  'rh.employee-files': RH_OWNERS,

  'rh.employees': RH_OWNERS,

  'rh.trips': RH_OWNERS.concat([
    'ceo',
    'cfo',
  ]),

  'rh.performance': RH_OWNERS,

  'rh.attendance': RH_OWNERS,

  // -------------------------------------------------------------------------
  // CONFORMITÉ
  // -------------------------------------------------------------------------

  'compliance.contracts': LEGAL_OWNERS,

  'compliance.disputes': LEGAL_OWNERS,

  'compliance.policies': LEGAL_OWNERS,

  'compliance.risks': LEGAL_OWNERS,

  // -------------------------------------------------------------------------
  // AUDIT
  // -------------------------------------------------------------------------

  'audit.reports': AUDIT_OWNERS,

  'audit.nonconformities': AUDIT_OWNERS,

  'audit.corrective-actions': AUDIT_OWNERS,

  'audit.sanctions': AUDIT_OWNERS,
};

// ---------------------------------------------------------------------------
// ACTIONS PAR NIVEAU HIÉRARCHIQUE
// ---------------------------------------------------------------------------

export const SENIORITY_ACTIONS: Record<
  Seniority,
  ActionSet
> = {
  junior: makeActions([
    'read',
  ]),

  mid: makeActions([
    'read',
    'create',
    'update',
  ]),

  senior: makeActions([
    'read',
    'create',
    'update',
    'delete',
    'validate',
  ]),

  lead: makeActions([
    'read',
    'create',
    'update',
    'delete',
    'validate',
    'publish',
  ]),

  executive: {
    ...FULL_ACCESS,
  },
};

// ---------------------------------------------------------------------------
// RESTRICTIONS DE DONNÉES
// ---------------------------------------------------------------------------

export interface DataScope {
  /**
   * null = toutes les régions
   */
  regions: string[] | null;

  /**
   * null = toutes les filiales
   */
  subsidiaries: string[] | null;

  /**
   * Limite aux enregistrements appartenant à l'utilisateur.
   */
  ownRecordsOnly: boolean;
}

export const GLOBAL_SCOPE: DataScope = {
  regions: null,
  subsidiaries: null,
  ownRecordsOnly: false,
};

export const ROLE_DATA_SCOPES: Record<
  string,
  Partial<DataScope>
> = {
  gestionnaire_fournisseurs: {
    regions: ['FR'],
  },

  acheteur: {
    regions: [
      'FR',
      'DE',
      'ES',
      'IT',
      'BE',
      'NL',
    ],
  },

  account_manager: {
    ownRecordsOnly: true,
  },

  business_developer: {
    ownRecordsOnly: true,
  },

  ext_fournisseur: {
    ownRecordsOnly: true,
  },

  ext_vendeur: {
    ownRecordsOnly: true,
  },

  ext_client_entreprise: {
    ownRecordsOnly: true,
  },

  ext_client_particulier: {
    ownRecordsOnly: true,
  },

  ext_prestataire: {
    ownRecordsOnly: true,
  },

  ext_auditeur: {
    ownRecordsOnly: true,
  },
};

export const getDataScope = (
  role?: JobRole | null,
): DataScope => {
  if (!role) {
    return GLOBAL_SCOPE;
  }

  const byId =
    ROLE_DATA_SCOPES[role.id] || {};

  const inferred: Partial<DataScope> = {};

  const regionMatch =
    /_(france|allemagne|espagne|italie)$/.exec(
      role.id,
    );

  if (regionMatch) {
    const regionMap: Record<
      string,
      string
    > = {
      france: 'FR',
      allemagne: 'DE',
      espagne: 'ES',
      italie: 'IT',
    };

    inferred.regions = [
      regionMap[regionMatch[1]],
    ];
  }

  if (role.external) {
    inferred.ownRecordsOnly = true;
  }

  return {
    ...GLOBAL_SCOPE,
    ...inferred,
    ...byId,
  };
};

// ---------------------------------------------------------------------------
// MATRICE ÉDITABLE
// ---------------------------------------------------------------------------

const MATRIX_KEY =
  'bib.permission_matrix.v1';

const HISTORY_KEY =
  'bib.permission_matrix.history.v1';

const ENFORCE_KEY =
  'bib.rbac_enforced.v1';

export const MATRIX_EVENT =
  'permission-matrix-changed';

/**
 * roleId -> pageId -> ActionSet partiel
 */
export type MatrixOverrides = Record<
  string,
  Record<string, Partial<ActionSet>>
>;

export interface MatrixHistoryEntry {
  at: string;
  actor: string;
  roleId: string;
  pageId: string;
  action: PermissionAction;
  value: boolean;
}

export const loadMatrixOverrides =
  (): MatrixOverrides => {
    try {
      return JSON.parse(
        localStorage.getItem(
          MATRIX_KEY,
        ) || '{}',
      );
    } catch {
      return {};
    }
  };

export const saveMatrixOverrides = (
  matrix: MatrixOverrides,
) => {
  localStorage.setItem(
    MATRIX_KEY,
    JSON.stringify(matrix),
  );

  window.dispatchEvent(
    new Event(MATRIX_EVENT),
  );
};

export const loadMatrixHistory =
  (): MatrixHistoryEntry[] => {
    try {
      return JSON.parse(
        localStorage.getItem(
          HISTORY_KEY,
        ) || '[]',
      );
    } catch {
      return [];
    }
  };

export const appendMatrixHistory = (
  entries: MatrixHistoryEntry[],
) => {
  const next = [
    ...entries,
    ...loadMatrixHistory(),
  ].slice(0, 500);

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(next),
  );

  window.dispatchEvent(
    new Event(MATRIX_EVENT),
  );
};

// ---------------------------------------------------------------------------
// ÉTAT DU RBAC
// ---------------------------------------------------------------------------

/**
 * Le RBAC est-il actuellement appliqué ?
 *
 * "off" = mode construction / développement.
 * "on"  = mode RBAC normal.
 */
export const isRbacEnforced = (): boolean => {
  try {
    return (
      localStorage.getItem(
        ENFORCE_KEY,
      ) !== 'off'
    );
  } catch {
    return true;
  }
};

export const setRbacEnforced = (
  enabled: boolean,
) => {
  try {
    localStorage.setItem(
      ENFORCE_KEY,
      enabled ? 'on' : 'off',
    );
  } catch {
    // localStorage indisponible
  }

  window.dispatchEvent(
    new Event(MATRIX_EVENT),
  );
};

// ---------------------------------------------------------------------------
// PAGES PUBLIQUES / TRANSVERSALES
// ---------------------------------------------------------------------------
//
// Ces pages ne dépendent pas du pôle métier de l'utilisateur.
// Elles restent néanmoins soumises aux règles spécifiques lorsqu'une page
// est explicitement restreinte.
// ---------------------------------------------------------------------------

const PUBLIC_PAGES = new Set<string>([
  'app.dashboard',
  'app.feed',
  'app.documents',

  'ethics.report',
  'independent-audit.declare',
]);

// ---------------------------------------------------------------------------
// CONTEXTE DE RÉSOLUTION
// ---------------------------------------------------------------------------

export interface ResolveContext {
  role?: JobRole | null;

  /**
   * Pôles réellement attribués au rôle/utilisateur.
   */
  poles: string[];

  /**
   * Niveau hiérarchique.
   */
  seniority: Seniority;

  /**
   * Administrateur technique global.
   */
  isSuperAdmin?: boolean;

  /**
   * Surcharges de la matrice.
   */
  overrides?: MatrixOverrides;
}

// ---------------------------------------------------------------------------
// MOTEUR DE RÉSOLUTION
// ---------------------------------------------------------------------------

export const resolvePagePermissions = (
  pageId: string,
  ctx: ResolveContext,
): ActionSet => {
  const page = getPage(pageId);

  const overrides =
    ctx.overrides ??
    loadMatrixOverrides();

  const roleOverrides =
    ctx.role
      ? overrides[ctx.role.id]?.[pageId]
      : undefined;

  const apply = (
    base: ActionSet,
  ): ActionSet =>
    roleOverrides
      ? {
          ...base,
          ...roleOverrides,
        }
      : base;

  // -------------------------------------------------------------------------
  // Mode construction / super-admin
  // -------------------------------------------------------------------------

  if (
    !isRbacEnforced() ||
    ctx.isSuperAdmin
  ) {
    return apply({
      ...FULL_ACCESS,
    });
  }

  // -------------------------------------------------------------------------
  // Page inconnue
  // -------------------------------------------------------------------------

  if (!page) {
    return apply({
      ...NO_ACCESS,
    });
  }

  // -------------------------------------------------------------------------
  // NIVEAU 1 — PÔLE
  // -------------------------------------------------------------------------

  const inScope =
    page.transversal ||
    ctx.poles.includes(page.scope);

  if (
    !inScope &&
    !PUBLIC_PAGES.has(pageId)
  ) {
    return apply({
      ...NO_ACCESS,
    });
  }

  // -------------------------------------------------------------------------
  // NIVEAU 2 — PAGE RESTREINTE
  // -------------------------------------------------------------------------

  const owners =
    RESTRICTED_PAGES[pageId];

  if (
    owners &&
    !(
      ctx.role &&
      owners.includes(ctx.role.id)
    )
  ) {
    return apply({
      ...NO_ACCESS,
    });
  }

  // -------------------------------------------------------------------------
  // ADMINISTRATION
  // -------------------------------------------------------------------------
  //
  // Les pages admin doivent obligatoirement avoir une liste explicite
  // de rôles autorisés.
  // -------------------------------------------------------------------------

  if (
    page.scope === 'admin' &&
    !owners
  ) {
    return apply({
      ...NO_ACCESS,
    });
  }

  // -------------------------------------------------------------------------
  // PAGES PUBLIQUES
  // -------------------------------------------------------------------------

  if (
    PUBLIC_PAGES.has(pageId)
  ) {
    return apply(
      makeActions([
        'read',
        'create',
      ]),
    );
  }

  // -------------------------------------------------------------------------
  // NIVEAU 3 — ACTIONS
  // -------------------------------------------------------------------------

  const base =
    SENIORITY_ACTIONS[
      ctx.seniority
    ] ??
    SENIORITY_ACTIONS.junior;

  const result = {
    ...base,
  };

  // -------------------------------------------------------------------------
  // COMPTES EXTERNES / LECTURE SEULE
  // -------------------------------------------------------------------------

  if (ctx.role?.readOnly) {
    return apply(
      makeActions([
        'read',
      ]),
    );
  }

  return apply(result);
};

// ---------------------------------------------------------------------------
// RÔLES POUVANT ACCÉDER À UNE PAGE
// ---------------------------------------------------------------------------

export const rolesForPage = (
  pageId: string,
): JobRole[] =>
  jobRoles.filter((role) =>
    resolvePagePermissions(
      pageId,
      {
        role,
        poles: role.poles,
        seniority: role.seniority,
      },
    ).read,
  );
