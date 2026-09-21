import { PoleId } from '@/types';
import { EmployeePosition } from '@/types/positions';
import { isRbacEnforced } from '@/data/permissionMatrix';

export interface PositionAccess {
  poles: PoleId[];
  screens: string[];
  restricted: string[];
}

export const positionAccess: Record<EmployeePosition, PositionAccess> = {
  supplier_manager: {
    poles: ['supplier'],
    screens: [
      'supplier.overview',
      'supplier.applications',
      'supplier.catalog-inbox',
      'supplier.pending',
      'supplier.validated',
      'supplier.suppliers',
      'supplier.certifications',
      'supplier.decisions',
      'supplier.portfolios',
      'supplier.restock-orders',
    ],
    restricted: ['finance.*', 'rh.*'],
  },

  customer_success_manager: {
    poles: ['marketplace', 'support'],
    screens: [
      'marketplace.overview',
      'marketplace.stores',
      'marketplace.products',
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
    restricted: ['finance.*', 'rh.*', 'supplier.*'],
  },

  ops_logistics_manager: {
    poles: ['ops'],
    screens: [
      'ops.overview',
      'ops.pipeline',
      'ops.shipments',
      'ops.stocks',
      'ops.partners',
      'ops.flows',
      'ops.incidents',
      'ops.thresholds',
      'ops.forecast',
      'ops.replenishment',
      'ops.suppliers-lt',
    ],
    restricted: ['finance.*', 'rh.*', 'supplier.decisions'],
  },

  finance_manager: {
    poles: ['finance'],
    screens: [
      'finance.overview',
      'finance.cashflow',
      'finance.transactions',
      'finance.billing',
      'finance.payouts',
      'finance.reconciliation',
      'finance.subscriptions',
      'finance.cards',
      'finance.guarantee',
    ],
    restricted: ['rh.*', 'supplier.*'],
  },

  audit_compliance_lead: {
    poles: ['audit', 'compliance'],
    screens: [
      'audit.overview',
      'audit.field',
      'audit.supplier',
      'audit.ops',
      'audit.reports',
      'audit.nonconformities',
      'audit.corrective-actions',
      'audit.sanctions',
      'compliance.overview',
      'compliance.contracts',
      'compliance.policies',
      'compliance.disputes',
      'compliance.risks',
    ],
    restricted: ['finance.cashflow', 'finance.cards', 'rh.*'],
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
    restricted: ['finance.*', 'supplier.*', 'rh.*'],
  },

  product_engineering_manager: {
    poles: ['product'],
    screens: [
      'product.overview',
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
    restricted: ['finance.*', 'rh.*', 'supplier.*'],
  },

  rh_manager: {
    poles: ['rh'],
    screens: [
      'rh.overview',
      'rh.employees',
      'rh.recruitment',
      'rh.files',
      'rh.onboarding',
      'rh.attendance',
      'rh.leave',
      'rh.training',
      'rh.trips',
      'rh.alerts',
    ],
    restricted: ['finance.*', 'supplier.*'],
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
    restricted: ['finance.*', 'rh.*'],
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
    restricted: ['finance.*', 'rh.*'],
  },

  ceo: {
    poles: [
      'direction',
      'finance',
      'ops',
      'supplier',
      'marketplace',
      'support',
      'marketing',
      'rh',
      'audit',
      'compliance',
      'rse',
      'product',
      'data',
      'security',
    ],
    screens: ['*'],
    restricted: [],
  },
};

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

  if (!extraPoles?.length) {
    return out;
  }

  for (const pole of extraPoles) {
    const position = POLE_DEFAULT_POSITION[pole];

    if (!position) {
      continue;
    }

    for (const screen of positionAccess[position].screens) {
      out.add(screen);
    }
  }

  return out;
};

export const isBuildModeOpen = (): boolean => !isRbacEnforced();

export const canAccessPole = (
  position: EmployeePosition | undefined,
  poleId: PoleId,
  extraPoles?: string[],
): boolean => {
  if (isBuildModeOpen()) {
    return true;
  }

  if (!position) {
    return false;
  }

  if (position === 'ceo') {
    return true;
  }

  if (positionAccess[position].poles.includes(poleId)) {
    return true;
  }

  return Boolean(extraPoles?.includes(poleId));
};

const PUBLIC_SCREENS = new Set<string>([
  'audit.declare',
  'audit.independent',
  'audit.resolution',
]);

export const canAccessScreen = (
  position: EmployeePosition | undefined,
  screenId: string,
  extraPoles?: string[],
): boolean => {
  if (isBuildModeOpen()) {
    return true;
  }

  if (!position) {
    return false;
  }

  if (position === 'ceo') {
    return true;
  }

  if (PUBLIC_SCREENS.has(screenId)) {
    return true;
  }

  const access = positionAccess[position];

  for (const restriction of access.restricted) {
    if (restriction.endsWith('.*')) {
      const prefix = restriction.slice(0, -2);

      if (screenId.startsWith(`${prefix}.`)) {
        if (!(extraPoles && extraPoles.includes(prefix))) {
          return false;
        }
      }
    } else if (restriction === screenId) {
      return false;
    }
  }

  if (
    access.screens.includes(screenId) ||
    access.screens.includes('*')
  ) {
    return true;
  }

  const extraScreens = collectExtraScreens(extraPoles);

  return extraScreens.has(screenId);
};

export const getAccessiblePoles = (
  position: EmployeePosition | undefined,
  extraPoles?: string[],
): PoleId[] => {
  if (isBuildModeOpen()) {
    return [...positionAccess.ceo.poles];
  }

  if (!position) {
    return [];
  }

  const base = positionAccess[position].poles;

  if (!extraPoles?.length) {
    return base;
  }

  const merged = new Set<PoleId>(base);

  for (const pole of extraPoles) {
    merged.add(pole as PoleId);
  }

  return Array.from(merged);
};
