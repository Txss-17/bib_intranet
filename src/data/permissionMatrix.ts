import { intranetModules, moduleById, resolveIntranetPage } from '@/lib/intranet';
import { applyRemoteOverrides } from '@/data/permissionRules';
import { supabase } from '@/integrations/supabase/client';
import {
  moduleNavigations,
  transversalNavigations,
  ModuleNavigationItem,
} from '@/data/moduleNavigations';
import { jobRoles, JobRole } from '@/data/jobRoles';
import { Seniority } from '@/data/permissionRules';

// ---------------------------------------------------------------------------
// MATRICE CENTRALISÉE DES PERMISSIONS
// RBAC + restrictions de données + actions
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

  Object.entries(moduleNavigations).forEach(([pole, items]) => {
    push(pole, items.items);
  });

  Object.entries(transversalNavigations).forEach(([module, items]) => {
    push(module, (items as any).items ?? items, true);
  });

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

  return intranetModules.map(p => ({ id: p.id, scope: p.scope, label: p.label, path: p.path, transversal: p.transversal }));
};

export const pageRegistry: PageDescriptor[] = buildRegistry();

export const getPage = (
  id: string,
): PageDescriptor | undefined =>
  pageRegistry.find((page) => page.id === id);

export const getPageByPath = (path: string): PageDescriptor | undefined => {
  const definition = resolveIntranetPage(path);
  return definition ? { id: definition.id, scope: definition.scope, label: definition.label, path: definition.path, transversal: definition.transversal } : undefined;
};

// ---------------------------------------------------------------------------
// RÔLES AUTORISÉS POUR LES PAGES SENSIBLES
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

const MARKETPLACE_OWNERS = [
  'ceo',
  'responsable_marketplace',
  'gestionnaire_boutiques',
  'gestionnaire_vendeurs',
  'gestionnaire_commandes',
  'gestionnaire_litiges',
  'gestionnaire_avis',
];

const ADMIN_OWNERS = [
  'ceo',
  'cto',
  'responsable_tech',
  'admin_systeme',
  'rssi',
  'directeur_rh',
  'responsable_rh',
  'gestionnaire_admin_rh',
];

// ---------------------------------------------------------------------------
// PAGES RESTREINTES
// ---------------------------------------------------------------------------

export const RESTRICTED_PAGES: Record<string, string[]> = {
  // Produit et engineering
  'product.engineering': PRODUCT_OWNERS,
  'product.integrations': PRODUCT_OWNERS,
  'product.documentation': PRODUCT_OWNERS,
  'product.studio': PRODUCT_OWNERS,
  'product.innovation': PRODUCT_OWNERS,
  'product.code': PRODUCT_OWNERS,
  'product.console': PRODUCT_OWNERS,

  // Sécurité et informatique
  'security.access': SECURITY_OWNERS,
  'security.security': SECURITY_OWNERS,
  'security.infrastructure': SECURITY_OWNERS,
  'security.environments': SECURITY_OWNERS,
  'security.vpn': SECURITY_OWNERS,
  'security.logs': SECURITY_OWNERS,

  // Administration
  'admin.roles': ADMIN_OWNERS,
  'admin.test-accounts': ADMIN_OWNERS,

  // Finance
  'finance.salaries': [...RH_OWNERS, 'ceo', 'cfo'],
  'finance.cashflow': FINANCE_OWNERS,
  'finance.guarantee': FINANCE_OWNERS,
  'finance.cards': FINANCE_OWNERS,
  'finance.subscriptions': FINANCE_OWNERS,
  'finance.reconciliation': FINANCE_OWNERS,
  'finance.payouts': FINANCE_OWNERS,

  // Ressources humaines
  'rh.employee-files': RH_OWNERS,
  'rh.employees': RH_OWNERS,
  'rh.trips': [...RH_OWNERS, 'ceo', 'cfo'],
  'rh.performance': RH_OWNERS,
  'rh.attendance': RH_OWNERS,
  'rh.portfolio': RH_OWNERS,

  // Conformité
  'compliance.contracts': LEGAL_OWNERS,
  'compliance.disputes': LEGAL_OWNERS,
  'compliance.policies': LEGAL_OWNERS,
  'compliance.risks': LEGAL_OWNERS,

  // Audit
  'audit.reports': AUDIT_OWNERS,
  'audit.nonconformities': AUDIT_OWNERS,
  'audit.corrective-actions': AUDIT_OWNERS,
  'audit.sanctions': AUDIT_OWNERS,

  // Marketplace
  'marketplace.overview': MARKETPLACE_OWNERS,
  'marketplace.merchants': MARKETPLACE_OWNERS,
  'marketplace.portfolio': [
    'ceo',
    'responsable_marketplace',
    'gestionnaire_boutiques',
    'gestionnaire_vendeurs',
  ],
  'marketplace.stores': [
    'ceo',
    'responsable_marketplace',
    'gestionnaire_boutiques',
    'gestionnaire_vendeurs',
  ],
  'marketplace.opportunities': [
    'ceo',
    'responsable_marketplace',
    'gestionnaire_boutiques',
    'gestionnaire_vendeurs',
  ],
  'marketplace.analytics': MARKETPLACE_OWNERS,
  'marketplace.subscriptions': [
    'ceo',
    'responsable_marketplace',
    'gestionnaire_boutiques',
    'gestionnaire_vendeurs',
  ],
  'marketplace.products': [
    'ceo',
    'responsable_marketplace',
    'gestionnaire_boutiques',
    'gestionnaire_vendeurs',
  ],
};

// ---------------------------------------------------------------------------
// ACTIONS PAR NIVEAU HIÉRARCHIQUE
// ---------------------------------------------------------------------------

export const SENIORITY_ACTIONS: Record<Seniority, ActionSet> = {
  junior: makeActions(['read']),
  mid: makeActions(['read', 'create', 'update']),
  senior: makeActions(['read', 'create', 'update', 'delete', 'validate']),
  lead: makeActions([
    'read',
    'create',
    'update',
    'delete',
    'validate',
    'publish',
  ]),
  executive: { ...FULL_ACCESS },
};

// ---------------------------------------------------------------------------
// RESTRICTIONS DE DONNÉES
// ---------------------------------------------------------------------------

export interface DataScope {
  /** null signifie toutes les régions. */
  regions: string[] | null;
  /** null signifie toutes les filiales. */
  subsidiaries: string[] | null;
  /** Limite aux enregistrements appartenant à l'utilisateur. */
  ownRecordsOnly: boolean;
}

export const GLOBAL_SCOPE: DataScope = {
  regions: null,
  subsidiaries: null,
  ownRecordsOnly: false,
};

export const ROLE_DATA_SCOPES: Record<string, Partial<DataScope>> = {
  gestionnaire_fournisseurs: {
    regions: ['FR'],
  },
  acheteur: {
    regions: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL'],
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
  if (!role) return GLOBAL_SCOPE;

  const byId = ROLE_DATA_SCOPES[role.id] || {};
  const inferred: Partial<DataScope> = {};

  const regionMatch =
    /_(france|allemagne|espagne|italie)$/.exec(role.id);

  if (regionMatch) {
    const regionMap: Record<string, string> = {
      france: 'FR',
      allemagne: 'DE',
      espagne: 'ES',
      italie: 'IT',
    };

    inferred.regions = [regionMap[regionMatch[1]]];
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

const MATRIX_KEY = 'bib.permission_matrix.v1';
const HISTORY_KEY = 'bib.permission_matrix.history.v1';
const ENFORCE_KEY = 'bib.rbac_enforced.v1';
const TEST_MATRIX_KEY = 'bib.permission_matrix.test.v1';
const TEST_ENFORCE_KEY = 'bib.rbac_enforced.test.v1';
const TEST_HISTORY_KEY = 'bib.permission_matrix.history.test.v1';

export const MATRIX_EVENT = 'permission-matrix-changed';

/** roleId -> pageId -> permissions partielles. */
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

export const loadMatrixOverrides = (): MatrixOverrides => {
  try {
    return JSON.parse(localStorage.getItem(MATRIX_KEY) || '{}');
  } catch {
    return {};
  }
};

export const saveMatrixOverrides = (matrix: MatrixOverrides) => {
  try {
    localStorage.setItem(MATRIX_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event(MATRIX_EVENT));
    void pushPermissionSetting('matrix_overrides', matrix);
  } catch {
    // Le stockage local peut être indisponible.
  }
};

/** Matrice exclusivement réservée aux comptes de test. */
export const loadTestMatrixOverrides = (): MatrixOverrides => {
  try {
    return JSON.parse(localStorage.getItem(TEST_MATRIX_KEY) || '{}');
  } catch {
    return {};
  }
};

/** Enregistre les permissions de test sans modifier la matrice globale. */
export const saveTestMatrixOverrides = (matrix: MatrixOverrides) => {
  try {
    localStorage.setItem(TEST_MATRIX_KEY, JSON.stringify(matrix));
    window.dispatchEvent(new Event(MATRIX_EVENT));
    void pushPermissionSetting('test_matrix_overrides', matrix);
  } catch {
    // Le stockage local peut être indisponible.
  }
};

export const isTestRbacEnforced = (): boolean => {
  try {
    return localStorage.getItem(TEST_ENFORCE_KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setTestRbacEnforced = (enabled: boolean) => {
  try {
    localStorage.setItem(TEST_ENFORCE_KEY, enabled ? 'on' : 'off');
  } catch {
    // localStorage indisponible.
  }

  window.dispatchEvent(new Event(MATRIX_EVENT));
  void pushPermissionSetting('test_rbac_enforced', enabled);
};

export const loadMatrixHistory = (): MatrixHistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const appendMatrixHistory = (entries: MatrixHistoryEntry[]) => {
  const next = [...entries, ...loadMatrixHistory()].slice(0, 500);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(MATRIX_EVENT));
  } catch {
    // Stockage local indisponible.
  }
};

/** Historique isolé de la matrice expérimentale. */
export const loadTestMatrixHistory = (): MatrixHistoryEntry[] => {
  try {
    return JSON.parse(localStorage.getItem(TEST_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const appendTestMatrixHistory = (entries: MatrixHistoryEntry[]) => {
  const next = [...entries, ...loadTestMatrixHistory()].slice(0, 500);

  try {
    localStorage.setItem(TEST_HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(MATRIX_EVENT));
  } catch {
    // Stockage local indisponible.
  }
};

// ---------------------------------------------------------------------------
// ÉTAT DU RBAC
// ---------------------------------------------------------------------------

/**
 * Le RBAC réel reste toujours appliqué.
 * Le mode expérimental des comptes de test est séparé.
 */
export const isRbacEnforced = (): boolean => true;

export const setRbacEnforced = (enabled: boolean) => {
  try {
    localStorage.setItem(ENFORCE_KEY, enabled ? 'on' : 'off');
  } catch {
    // localStorage indisponible.
  }

  window.dispatchEvent(new Event(MATRIX_EVENT));
  void pushPermissionSetting('rbac_enforced', enabled);
};

// ---------------------------------------------------------------------------
// SYNCHRONISATION BACKEND
// ---------------------------------------------------------------------------

const pushPermissionSetting = async (
  key: string,
  value: unknown,
) => {
  const { error } = await (supabase as any)
    .from('permission_settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    console.error(
      '[permissions] synchronisation refusée',
      error.message,
    );
  }
};

let syncIsTest = false;

const TEST_SETTING_KEYS = new Set([
  'test_matrix_overrides',
  'test_rbac_enforced',
]);

const applyRemoteSetting = (key: string, value: unknown) => {
  // Les comptes réels ignorent les réglages expérimentaux.
  if (TEST_SETTING_KEYS.has(key) && !syncIsTest) return;

  try {
    if (key === 'matrix_overrides') {
      localStorage.setItem(MATRIX_KEY, JSON.stringify(value ?? {}));
    }

    if (key === 'sensitive_rules') {
      applyRemoteOverrides(value as any);
    }

    if (key === 'rbac_enforced') {
      localStorage.setItem(ENFORCE_KEY, value === false ? 'off' : 'on');
    }

    if (key === 'test_matrix_overrides') {
      localStorage.setItem(TEST_MATRIX_KEY, JSON.stringify(value ?? {}));
    }

    if (key === 'test_rbac_enforced') {
      localStorage.setItem(
        TEST_ENFORCE_KEY,
        value === false ? 'off' : 'on',
      );
    }
  } catch {
    // Stockage local indisponible.
  }

  window.dispatchEvent(new Event(MATRIX_EVENT));
};

let syncStarted = false;

/** Charge les permissions depuis la base et écoute les changements temps réel. */
export const startPermissionSync = (isTestAccount = false) => {
  const db = supabase as any;
  const switchedToTest = isTestAccount && !syncIsTest;

  syncIsTest = isTestAccount;

  if (!isTestAccount) {
    // Un compte réel ne conserve aucun réglage test actif.
    try {
      localStorage.removeItem(TEST_MATRIX_KEY);
      localStorage.removeItem(TEST_ENFORCE_KEY);
    } catch {
      // Stockage local indisponible.
    }
  }

  if (syncStarted && !switchedToTest) return;

  const firstStart = !syncStarted;
  syncStarted = true;

  void db
    .from('permission_settings')
    .select('key, value')
    .then(({ data }: any) => {
      (data || []).forEach((row: any) => {
        applyRemoteSetting(row.key, row.value);
      });
    });

  if (!firstStart) return;

  db
    .channel('permission-settings-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'permission_settings',
      },
      (payload: any) => {
        if (payload.new?.key) {
          applyRemoteSetting(payload.new.key, payload.new.value);
        }
      },
    )
    .subscribe();
};

// ---------------------------------------------------------------------------
// PAGES PUBLIQUES / TRANSVERSALES
// ---------------------------------------------------------------------------

export const PUBLIC_PAGES = new Set<string>([
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

  /** Pôles réellement attribués à l'utilisateur. */
  poles: string[];

  /** Niveau hiérarchique. */
  seniority: Seniority;

  /** Administrateur technique global. */
  isSuperAdmin?: boolean;

  /**
   * Surcharges choisies par l'appelant.
   * Les restrictions structurelles restent prioritaires.
   */
  overrides?: MatrixOverrides;

  /** Seuls les comptes de test peuvent désactiver l'application du RBAC. */
  enforced?: boolean;

  /** Permissions enregistrées en base (page → actions) : source de vérité si présentes. */
  dbPermissions?: Record<string, Partial<ActionSet>>;
}

// ---------------------------------------------------------------------------
// MOTEUR DE RÉSOLUTION
// ---------------------------------------------------------------------------

export const resolvePagePermissions = (
  pageId: string,
  ctx: ResolveContext,
): ActionSet => {
  pageId = moduleById(pageId)?.id || pageId;
  const page = getPage(pageId);

  // Les surcharges sont fournies par usePermissions.ts.
  // Aucune lecture de profil ni sélection de matrice n'est effectuée ici.
  const roleOverrides = ctx.role
    ? ctx.overrides?.[ctx.role.id]?.[pageId]
    : undefined;

  const apply = (base: ActionSet): ActionSet =>
    roleOverrides
      ? {
          ...base,
          ...roleOverrides,
        }
      : base;

  // Le mode de test désactivé ne donne pas automatiquement accès.
  if (ctx.enforced === false) {
    return { ...NO_ACCESS };
  }

  // Administrateur réel (hors simulation) : accès complet.
  if (ctx.isSuperAdmin) {
    return { ...FULL_ACCESS };
  }

  // Une page inconnue est toujours refusée.
  if (!page) {
    return { ...NO_ACCESS };
  }

  // Matrice enregistrée depuis Rôles & Permissions : elle fait foi.
  const saved = ctx.dbPermissions?.[pageId];
  if (saved) {
    return apply({ ...NO_ACCESS, ...saved });
  }

  // Niveau 1 : contrôle du périmètre métier.
  const inScope =
    page.transversal === true ||
    ctx.poles.includes(page.scope);

  if (!inScope && !(PUBLIC_PAGES.has(pageId) || moduleById(pageId)?.public === true)) {
    return { ...NO_ACCESS };
  }

  // Niveau 2 : contrôle des rôles autorisés pour les pages sensibles.
  const owners = RESTRICTED_PAGES[pageId] || (moduleById(pageId) as unknown as { restrictedRoles?: string[] })?.restrictedRoles;

  if (owners?.length && !(ctx.role && owners.includes(ctx.role.id))) {
    return { ...NO_ACCESS };
  }

  // Les pages d'administration doivent déclarer une liste de rôles autorisés.
  if (page.scope === 'admin' && !owners) {
    return { ...NO_ACCESS };
  }

  // Niveau 3 : permissions d'action.
  if ((PUBLIC_PAGES.has(pageId) || moduleById(pageId)?.public === true) || (moduleById(pageId) as unknown as { public?: boolean })?.public) {
    return apply(makeActions(['read', 'create']));
  }

  const base =
    SENIORITY_ACTIONS[ctx.seniority] ?? SENIORITY_ACTIONS.junior;

  if (ctx.role?.readOnly) {
    return apply(makeActions(['read']));
  }

  return apply({ ...base });
};

// ---------------------------------------------------------------------------
// RÔLES POUVANT ACCÉDER À UNE PAGE
// ---------------------------------------------------------------------------

export const rolesForPage = (pageId: string): JobRole[] =>
  jobRoles.filter((role) =>
    resolvePagePermissions(pageId, {
      role,
      poles: role.poles,
      seniority: role.seniority,
    }).read,
  );
