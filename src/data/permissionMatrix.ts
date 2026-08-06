// ---------------------------------------------------------------------------
// MATRICE CENTRALISÉE DES PERMISSIONS (RBAC + restrictions de données)
// Principe du moindre privilège : 4 niveaux de contrôle
//   1. Pôles      -> quels pôles sont visibles
//   2. Pages      -> quelles pages du pôle sont visibles
//   3. Actions    -> lire / créer / modifier / supprimer / publier / valider / administrer
//   4. Données    -> périmètre (filiale, pays, portefeuille)
// Toute l'interface se base sur ce fichier.
// ---------------------------------------------------------------------------

import { moduleNavigations, transversalNavigations, SubNavigationItem } from '@/data/moduleNavigations';
import { jobRoles, JobRole } from '@/data/jobRoles';
import { Seniority } from '@/data/permissionRules';

export type PermissionAction =
  | 'read' | 'create' | 'update' | 'delete' | 'publish' | 'validate' | 'administer';

export const PERMISSION_ACTIONS: { key: PermissionAction; label: string }[] = [
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
  read: false, create: false, update: false, delete: false,
  publish: false, validate: false, administer: false,
};

export const FULL_ACCESS: ActionSet = {
  read: true, create: true, update: true, delete: true,
  publish: true, validate: true, administer: true,
};

export const makeActions = (allowed: PermissionAction[]): ActionSet =>
  PERMISSION_ACTIONS.reduce((acc, a) => {
    acc[a.key] = allowed.includes(a.key);
    return acc;
  }, { ...NO_ACCESS } as ActionSet);

// ---------------------------------------------------------------------------
// Registre des pages : identifiant stable `pole.page` ou `module.page`
// ---------------------------------------------------------------------------

export interface PageDescriptor {
  id: string;        // ex: 'finance.salaries'
  scope: string;     // ex: 'finance' (pôle) ou 'gateway' (module transversal)
  label: string;     // libellé FR
  path: string;
  transversal?: boolean;
}

const buildRegistry = (): PageDescriptor[] => {
  const out: PageDescriptor[] = [];
  const push = (scope: string, items: SubNavigationItem[], transversal = false) => {
    for (const it of items) {
      out.push({ id: `${scope}.${it.id}`, scope, label: it.labelFr, path: it.path, transversal });
    }
  };
  Object.entries(moduleNavigations).forEach(([pole, items]) => push(pole, items));
  Object.entries(transversalNavigations).forEach(([mod, items]) => push(mod, items, true));
  // Pages transversales hors navigation modulaire
  out.push(
    { id: 'app.dashboard', scope: 'app', label: 'Tableau de bord', path: '/', transversal: true },
    { id: 'app.feed', scope: 'app', label: 'Internal Feed', path: '/feed', transversal: true },
    { id: 'app.documents', scope: 'app', label: 'Documents', path: '/documents', transversal: true },
    { id: 'app.compliance-audit', scope: 'app', label: 'Conformité & Audit', path: '/compliance-audit', transversal: true },
    { id: 'app.settings', scope: 'app', label: 'Paramètres', path: '/settings', transversal: true },
    { id: 'admin.roles', scope: 'admin', label: 'Rôles & Permissions', path: '/admin/roles-permissions', transversal: true },
    { id: 'admin.test-accounts', scope: 'admin', label: 'Comptes de test / Visualiser comme', path: '/pole/tech/test-accounts', transversal: true },

  );
  return out;
};

export const pageRegistry: PageDescriptor[] = buildRegistry();

export const getPage = (id: string) => pageRegistry.find((p) => p.id === id);
export const getPageByPath = (path: string) => pageRegistry.find((p) => p.path === path);

// ---------------------------------------------------------------------------
// Pages totalement interdites, sauf aux rôles listés (ids de src/data/jobRoles)
// ---------------------------------------------------------------------------

const TECH_OWNERS = ['ceo', 'cto', 'responsable_tech', 'devops_engineer', 'sre', 'admin_systeme', 'dba', 'architecte_logiciel', 'architecte_cloud', 'dev_backend', 'dev_fullstack', 'rssi'];
const FINANCE_OWNERS = ['ceo', 'cfo', 'comptable', 'controleur_gestion', 'tresorier', 'gestionnaire_paiements'];
const RH_OWNERS = ['ceo', 'directeur_rh', 'responsable_rh', 'gestionnaire_paie', 'gestionnaire_admin_rh'];
const LEGAL_OWNERS = ['ceo', 'juriste', 'conformite_juridique', 'responsable_conformite', 'analyste_rgpd', 'gestionnaire_contrats'];
const ADMIN_OWNERS = ['ceo', 'cto', 'admin_systeme', 'responsable_tech', 'rssi'];

export const RESTRICTED_PAGES: Record<string, string[]> = {
  // Tech — outils sensibles
  'tech.logs': TECH_OWNERS,
  'tech.environments': TECH_OWNERS,
  'tech.security': TECH_OWNERS,
  'tech.access': TECH_OWNERS,
  'tech.vpn': TECH_OWNERS,
  'tech.dataflow': TECH_OWNERS,
  'tech.infrastructure': TECH_OWNERS,
  'tech.sandbox': TECH_OWNERS,
  'tech.test-accounts': TECH_OWNERS,
  'tech.integrations': TECH_OWNERS,
  'tech.code': TECH_OWNERS,
  'tech.supervision': TECH_OWNERS,
  'tech.documentation': TECH_OWNERS,
  'tech.console': TECH_OWNERS,
  // Administration
  'admin.roles': ADMIN_OWNERS.concat(['directeur_rh', 'responsable_rh']),
  'admin.test-accounts': ADMIN_OWNERS,
  'admin.permissions-matrix': ADMIN_OWNERS.concat(['directeur_rh', 'responsable_rh']),
  // Finance — comptabilité, salaires, budgets
  'finance.salaries': RH_OWNERS.concat(['ceo', 'cfo', 'responsable_finance']),
  'finance.cashflow': FINANCE_OWNERS,
  'finance.guarantee': FINANCE_OWNERS,
  'finance.cards': FINANCE_OWNERS,
  'finance.subscriptions': FINANCE_OWNERS,
  // RH — dossiers, évaluations, recrutement
  'rh.employee-files': RH_OWNERS,
  'rh.employees': RH_OWNERS,
  'rh.trips': RH_OWNERS.concat(['ceo', 'cfo']),
  // Juridique / conformité
  'compliance.contracts': LEGAL_OWNERS,
  'compliance.disputes': LEGAL_OWNERS,
  'compliance.policies': LEGAL_OWNERS,
  'compliance.risks': LEGAL_OWNERS,
};

// ---------------------------------------------------------------------------
// Droits par défaut : niveau hiérarchique -> actions accordées sur ses pages
// ---------------------------------------------------------------------------

export const SENIORITY_ACTIONS: Record<Seniority, ActionSet> = {
  junior:    makeActions(['read']),
  mid:       makeActions(['read', 'create', 'update']),
  senior:    makeActions(['read', 'create', 'update', 'delete', 'validate']),
  lead:      makeActions(['read', 'create', 'update', 'delete', 'validate', 'publish']),
  executive: { ...FULL_ACCESS },
};

// ---------------------------------------------------------------------------
// Restrictions de données (niveau 4) : périmètre par rôle
// ---------------------------------------------------------------------------

export interface DataScope {
  /** null = toutes les régions */
  regions: string[] | null;
  /** null = toutes les filiales */
  subsidiaries: string[] | null;
  /** limite aux enregistrements dont l'utilisateur est propriétaire */
  ownRecordsOnly: boolean;
}

export const GLOBAL_SCOPE: DataScope = { regions: null, subsidiaries: null, ownRecordsOnly: false };

export const ROLE_DATA_SCOPES: Record<string, Partial<DataScope>> = {
  gestionnaire_fournisseurs: { regions: ['FR'] },
  acheteur: { regions: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL'] },
  account_manager: { ownRecordsOnly: true },
  business_developer: { ownRecordsOnly: true },
  ext_fournisseur: { ownRecordsOnly: true },
  ext_vendeur: { ownRecordsOnly: true },
  ext_client_entreprise: { ownRecordsOnly: true },
  ext_client_particulier: { ownRecordsOnly: true },
  ext_prestataire: { ownRecordsOnly: true },
};

export const getDataScope = (role?: JobRole | null): DataScope => {
  if (!role) return GLOBAL_SCOPE;
  const byId = ROLE_DATA_SCOPES[role.id] || {};
  const inferred: Partial<DataScope> = {};
  const m = /_(france|allemagne|espagne|italie)$/.exec(role.id);
  if (m) inferred.regions = [{ france: 'FR', allemagne: 'DE', espagne: 'ES', italie: 'IT' }[m[1]]!];
  if (role.external) inferred.ownRecordsOnly = true;
  return { ...GLOBAL_SCOPE, ...inferred, ...byId };
};

// ---------------------------------------------------------------------------
// Surcharges persistées (matrice éditable) + historique des modifications
// ---------------------------------------------------------------------------

const MATRIX_KEY = 'bib.permission_matrix.v1';
const HISTORY_KEY = 'bib.permission_matrix.history.v1';
const ENFORCE_KEY = 'bib.rbac_enforced.v1';
export const MATRIX_EVENT = 'permission-matrix-changed';

/** roleId -> pageId -> ActionSet partiel */
export type MatrixOverrides = Record<string, Record<string, Partial<ActionSet>>>;

export interface MatrixHistoryEntry {
  at: string;
  actor: string;
  roleId: string;
  pageId: string;
  action: PermissionAction;
  value: boolean;
}

export const loadMatrixOverrides = (): MatrixOverrides => {
  try { return JSON.parse(localStorage.getItem(MATRIX_KEY) || '{}'); } catch { return {}; }
};

export const saveMatrixOverrides = (m: MatrixOverrides) => {
  localStorage.setItem(MATRIX_KEY, JSON.stringify(m));
  window.dispatchEvent(new Event(MATRIX_EVENT));
};

export const loadMatrixHistory = (): MatrixHistoryEntry[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};

export const appendMatrixHistory = (entries: MatrixHistoryEntry[]) => {
  const next = [...entries, ...loadMatrixHistory()].slice(0, 500);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(MATRIX_EVENT));
};

/** Le RBAC est-il appliqué ? (mode construction = désactivé) */
export const isRbacEnforced = (): boolean => {
  try { return localStorage.getItem(ENFORCE_KEY) !== 'off'; } catch { return true; }
};

export const setRbacEnforced = (on: boolean) => {
  try { localStorage.setItem(ENFORCE_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
  window.dispatchEvent(new Event(MATRIX_EVENT));
};

// ---------------------------------------------------------------------------
// Moteur de résolution
// ---------------------------------------------------------------------------

const PUBLIC_PAGES = new Set<string>([
  'app.dashboard', 'app.feed', 'app.documents', 'app.settings',
  'ethics.report', 'independent-audit.declare',
]);

export interface ResolveContext {
  role?: JobRole | null;
  poles: string[];
  seniority: Seniority;
  /** admin technique : accès total */
  isSuperAdmin?: boolean;
  overrides?: MatrixOverrides;
}

export const resolvePagePermissions = (pageId: string, ctx: ResolveContext): ActionSet => {
  const page = getPage(pageId);
  const overrides = ctx.overrides ?? loadMatrixOverrides();
  const ov = ctx.role ? overrides[ctx.role.id]?.[pageId] : undefined;

  const apply = (base: ActionSet): ActionSet => (ov ? { ...base, ...ov } : base);

  if (!isRbacEnforced() || ctx.isSuperAdmin) return apply({ ...FULL_ACCESS });
  if (!page) return apply({ ...NO_ACCESS });

  // Niveau 1 — pôle
  const inScope = page.transversal || ctx.poles.includes(page.scope);
  if (!inScope && !PUBLIC_PAGES.has(pageId)) return apply({ ...NO_ACCESS });

  // Niveau 2 — page interdite sauf profils listés
  const owners = RESTRICTED_PAGES[pageId];
  if (owners && !(ctx.role && owners.includes(ctx.role.id))) return apply({ ...NO_ACCESS });

  // Les pages d'administration doivent être explicitement listées ci-dessus
  if (page.scope === 'admin' && !owners) return apply({ ...NO_ACCESS });

  if (PUBLIC_PAGES.has(pageId)) return apply(makeActions(['read', 'create']));

  // Niveau 3 — actions selon le niveau hiérarchique
  const base = SENIORITY_ACTIONS[ctx.seniority] ?? SENIORITY_ACTIONS.junior;
  const result = { ...base };
  if (ctx.role?.readOnly) return apply(makeActions(['read']));
  return apply(result);
};

export const rolesForPage = (pageId: string): JobRole[] =>
  jobRoles.filter((r) => resolvePagePermissions(pageId, {
    role: r, poles: r.poles, seniority: r.seniority,
  }).read);
