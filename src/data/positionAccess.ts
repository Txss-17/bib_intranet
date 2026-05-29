import { PoleId } from '@/types';
import { EmployeePosition } from '@/types/positions';

export interface PositionAccess {
  poles: PoleId[];
  screens: string[];
  restricted: string[];
}

export const positionAccess: Record<EmployeePosition, PositionAccess> = {
  supplier_manager: {
    poles: ['supplier'],
    screens: [
      'supplier.overview', 'supplier.inbox-catalogues', 'supplier.fiche-fournisseur',
      'supplier.validation-produit', 'supplier.pending', 'supplier.validated',
      'supplier.suppliers', 'supplier.certifications', 'supplier.decisions',
      'supplier.alerts', 'supplier.transmission-tech'
    ],
    restricted: ['finance.*', 'lifecycle.comptes-utilisateurs', 'rh.*']
  },
  user_success_manager: {
    poles: ['lifecycle'],
    screens: [
      'lifecycle.overview', 'lifecycle.user-accounts', 'lifecycle.risk-alerts',
      'lifecycle.email-campaigns', 'lifecycle.trustpilot', 'lifecycle.support',
      'lifecycle.onboarding', 'lifecycle.monitoring', 'lifecycle.scoring',
      'audit.independent', 'audit.declare', 'audit.resolution'
    ],
    restricted: ['supplier.negotiations', 'rh.*', 'finance.salaries']
  },
  ops_logistics_manager: {
    poles: ['ops'],
    screens: [
      'ops.overview', 'ops.orders', 'ops.shipments', 'ops.logistics',
      'ops.incidents', 'ops.partners', 'ops.packaging-instructions', 'ops.daily-reports'
    ],
    restricted: ['lifecycle.comptes-utilisateurs', 'supplier.decisions']
  },
  finance_manager: {
    poles: ['finance'],
    screens: [
      'finance.overview', 'finance.cashflow', 'finance.transactions',
      'finance.supplier-payments', 'finance.subscriptions', 'finance.salaries',
      'finance.guarantee', 'finance.expenses', 'finance.fundraising', 'finance.reports'
    ],
    restricted: ['rh.confidential', 'supplier.product-details']
  },
  audit_compliance_lead: {
    poles: ['audit', 'compliance'],
    screens: [
      'audit.overview', 'audit.field', 'audit.supplier', 'audit.ops',
      'audit.reports', 'audit.nonconformities', 'audit.sanctions',
      'audit.independent', 'audit.declare', 'audit.resolution',
      'compliance.overview', 'compliance.contracts', 'compliance.policies',
      'compliance.disputes', 'compliance.risks',
      'supplier.dossiers', 'supplier.certifications'
    ],
    restricted: ['finance.cashflow', 'lifecycle.support-daily']
  },
  rse_packaging_manager: {
    poles: ['rse'],
    screens: [
      'rse.overview', 'rse.packaging', 'rse.packaging-validation', 'rse.recycling',
      'rse.points', 'rse.co2', 'rse.esg', 'rse.transmission-ops', 'modules.packaging'
    ],
    restricted: ['finance.*', 'supplier.negotiations']
  },
  tech_platform_manager: {
    poles: ['tech'],
    screens: [
      'tech.overview', 'tech.access', 'tech.vpn', 'tech.logs',
      'tech.deployments', 'tech.environments', 'tech.security', 'tech.dataflow',
      'tech.catalog', 'tech.product-catalogue', 'tech.user-site',
      'tech.intranet', 'tech.infrastructure', 'tech.logs-monitoring'
    ],
    restricted: ['rh.decisions', 'finance.arbitrage']
  },
  marketing_manager: {
    poles: ['marketing'],
    screens: [
      'marketing.overview', 'marketing.campaigns', 'marketing.analytics',
      'marketing.content', 'marketing.podcasts'
    ],
    restricted: ['finance.salaries', 'rh.*', 'supplier.negotiations']
  },
  rh_manager: {
    poles: ['rh'],
    screens: [
      'rh.overview', 'rh.employees', 'rh.employee-files', 'rh.leave',
      'rh.attendance', 'rh.training', 'rh.onboarding', 'rh.publications', 'rh.alerts'
    ],
    restricted: ['finance.cashflow', 'supplier.*']
  },
  risk_manager: {
    poles: ['risk'],
    screens: [
      'risk.overview', 'risk.active-incidents', 'risk.history',
      'risk.metrics', 'risk.register'
    ],
    restricted: ['finance.salaries', 'rh.confidential']
  },
  rd_manager: {
    poles: ['rd', 'supplier', 'lifecycle'],
    screens: [
      'rd.overview', 'rd.products', 'rd.frictions', 'rd.reports',
      'rd.shops', 'rd.suppliers', 'rd.tickets'
    ],
    restricted: ['finance.*', 'rh.*']
  },
  ceo: {
    poles: [
      'direction', 'finance', 'ops', 'tech', 'rh', 'supplier',
      'audit', 'compliance', 'rse', 'marketing', 'risk', 'lifecycle'
    ],
    screens: ['*'],
    restricted: []
  }
};

export const canAccessPole = (position: EmployeePosition | undefined, poleId: PoleId): boolean => {
  if (!position) return false;
  if (position === 'ceo') return true;
  return positionAccess[position].poles.includes(poleId);
};

// Screens that any authenticated employee can access (transversal rights)
const PUBLIC_SCREENS = new Set<string>([
  'audit.declare',           // Anyone can declare an incident
  'audit.independent',       // Independent audit visibility
  'audit.resolution',        // Resolution tracking visibility
]);

export const canAccessScreen = (position: EmployeePosition | undefined, screenId: string): boolean => {
  if (!position) return false;
  if (position === 'ceo') return true;
  if (PUBLIC_SCREENS.has(screenId)) return true;

  const access = positionAccess[position];

  for (const restriction of access.restricted) {
    if (restriction.endsWith('.*')) {
      const prefix = restriction.replace('.*', '');
      if (screenId.startsWith(prefix)) return false;
    } else if (restriction === screenId) {
      return false;
    }
  }

  return access.screens.includes(screenId) || access.screens.includes('*');
};

export const getAccessiblePoles = (position: EmployeePosition | undefined): PoleId[] => {
  if (!position) return [];
  return positionAccess[position].poles;
};
