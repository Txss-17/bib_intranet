import { PoleId } from '@/types';
import { EmployeePosition } from '@/types/positions';
import { isRbacEnforced } from '@/data/permissionMatrix';

export interface PositionAccess {
  poles: PoleId[];
  screens: string[];
  restricted: string[];
}

export const positionAccess: Record<EmployeePosition, PositionAccess> = {
customer_success_manager: {
  poles: ['marketplace', 'support'],
  screens: [
    'marketplace.overview',
    'marketplace.stores',
    'marketplace.customers',
    'marketplace.orders',
    'marketplace.subscribers',
    'marketplace.favorites',
    'marketplace.rewards',
    'marketplace.recycling',
    'support.overview',
    'support.tickets',
    'support.customer-success',
    'support.monitoring',
    'support.escalations',
  ],
  restricted: ['finance.*', 'rh.*'],
},

rse_impact_manager: {
  poles: ['rse'],
  screens: [
    'rse.overview',
    'rse.packaging',
    'rse.recycling',
    'rse.co2',
    'rse.esg',
  ],
  restricted: ['finance.*'],
},

product_engineering_manager: {
  poles: ['product'],
  screens: [
    'product.overview',
    'product.product',
    'product.roadmap',
    'product.backlog',
    'product.engineering',
    'product.studio',
    'product.integrations',
    'product.documentation',
    'product.innovation',
  ],
  restricted: ['finance.*', 'rh.*'],
},

marketing_communication_manager: {
  poles: ['marketing'],
  screens: [
    'marketing.overview',
    'marketing.campaigns',
    'marketing.content',
    'marketing.crm',
    'marketing.journeys',
    'marketing.analytics',
    'marketing.reputation',
  ],
  restricted: ['finance.salaries', 'rh.*'],
},

security_it_manager: {
  poles: ['security'],
  screens: [
    'security.overview',
    'security.access',
    'security.security',
    'security.infrastructure',
    'security.environments',
    'security.vpn',
    'security.logs',
  ],
  restricted: ['finance.salaries', 'rh.*'],
},

data_bi_manager: {
  poles: ['data'],
  screens: [
    'data.overview',
    'data.kpi',
    'data.reports',
    'data.bi',
    'data.requests',
    'data.versions',
  ],
  restricted: ['finance.salaries', 'rh.confidential'],
},

// Build a union of "implicit" extra access from a list of additional poles
// stored on the profile (profile.poles). For each extra pole, we union in the
// poles + screens of the default position covering that pole.
const POLE_DEFAULT_POSITION: Record<string, EmployeePosition> = {
  direction: 'ceo',
  finance: 'finance_manager',
  ops: 'ops_logistics_manager',
  supplier: 'supplier_manager',
  marketplace: 'customer_success_manager',
  support: 'customer_success_manager',
  marketing: 'marketing_communication_manager',
  rh: 'rh_manager',
  audit: 'audit_compliance_lead',
  compliance: 'audit_compliance_lead',
  rse: 'rse_impact_manager',
  product: 'product_engineering_manager',
  data: 'data_bi_manager',
  security: 'security_it_manager',
};


const collectExtraScreens = (extraPoles?: string[]): Set<string> => {
  const out = new Set<string>();
  if (!extraPoles) return out;
  for (const p of extraPoles) {
    const pos = POLE_DEFAULT_POSITION[p];
    if (!pos) continue;
    for (const s of positionAccess[pos].screens) out.add(s);
  }
  return out;
};

// Le mode construction (accès ouvert) est piloté depuis
// Administration → Rôles & Permissions (interrupteur « Moindre privilège »).
export const isBuildModeOpen = (): boolean => !isRbacEnforced();

export const canAccessPole = (
  position: EmployeePosition | undefined,
  poleId: PoleId,
  extraPoles?: string[],
): boolean => {
  if (isBuildModeOpen()) return true;
  if (!position) return false;
  if (position === 'ceo') return true;
  if (positionAccess[position].poles.includes(poleId)) return true;
  return !!extraPoles && extraPoles.includes(poleId);
};

// Screens that any authenticated employee can access (transversal rights)
const PUBLIC_SCREENS = new Set<string>([
  'audit.declare',           // Anyone can declare an incident
  'audit.independent',       // Independent audit visibility
  'audit.resolution',        // Resolution tracking visibility
]);

export const canAccessScreen = (
  position: EmployeePosition | undefined,
  screenId: string,
  extraPoles?: string[],
): boolean => {
  if (isBuildModeOpen()) return true;
  if (!position) return false;
  if (position === 'ceo') return true;
  if (PUBLIC_SCREENS.has(screenId)) return true;

  const access = positionAccess[position];

  for (const restriction of access.restricted) {
    if (restriction.endsWith('.*')) {
      const prefix = restriction.replace('.*', '');
      if (screenId.startsWith(prefix)) {
        // Allow if the screen's pole is explicitly granted via profile.poles
        if (!(extraPoles && extraPoles.includes(prefix))) return false;
      }
    } else if (restriction === screenId) {
      return false;
    }
  }

  if (access.screens.includes(screenId) || access.screens.includes('*')) return true;

  // Fall back to extra-pole-derived screens
  const extraScreens = collectExtraScreens(extraPoles);
  return extraScreens.has(screenId);
};

export const getAccessiblePoles = (
  position: EmployeePosition | undefined,
  extraPoles?: string[],
): PoleId[] => {
  if (isBuildModeOpen()) return [...positionAccess.ceo.poles];
  if (!position) return [];
  const base = positionAccess[position].poles;
  if (!extraPoles?.length) return base;
  const merged = new Set<PoleId>(base);
  for (const p of extraPoles) merged.add(p as PoleId);
  return Array.from(merged);
};

