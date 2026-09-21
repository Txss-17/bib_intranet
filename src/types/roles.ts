// Phase 1 Employee Roles - LINKSY Group
export type EmployeeRole =
  | 'ceo'
  | 'finance_manager'
  | 'supplier_manager'
  | 'ops_logistics_manager'
  | 'customer_success_manager'
  | 'audit_compliance_lead'
  | 'rse_impact_manager'
  | 'product_engineering_manager'
  | 'marketing_communication_manager'
  | 'rh_manager'
  | 'data_bi_manager'
  | 'security_it_manager';

export type EmployeeStatus = 'online' | 'absent' | 'busy' | 'offline';

export interface EmployeeRoleInfo {
  id: EmployeeRole;
  title: string;
  titleFr: string;
  poles: string[];
  description: string;
}

export const employeeRoles: Record<EmployeeRole, EmployeeRoleInfo> = {
  ceo: {
    id: 'ceo',
    title: 'CEO / Founder',
    titleFr: 'CEO / Direction',
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
    description:
      'Vision stratégique, arbitrage, gouvernance et validation des décisions structurantes.',
  },

  finance_manager: {
    id: 'finance_manager',
    title: 'Finance Manager',
    titleFr: 'Responsable Finance',
    poles: ['finance'],
    description:
      'Gestion financière, trésorerie, facturation, paiements, rapprochements et reporting financier.',
  },

  supplier_manager: {
    id: 'supplier_manager',
    title: 'Supplier & Product Validation Manager',
    titleFr: 'Responsable Fournisseurs & Produits',
    poles: ['supplier'],
    description:
      'Gestion des candidatures fournisseurs, validation des catalogues, certifications et décisions fournisseurs.',
  },

  ops_logistics_manager: {
    id: 'ops_logistics_manager',
    title: 'Operations & Logistics Manager',
    titleFr: 'Responsable Opérations & Logistique',
    poles: ['ops'],
    description:
      'Pilotage des flux opérationnels, expéditions, stocks, partenaires logistiques et incidents.',
  },

  customer_success_manager: {
    id: 'customer_success_manager',
    title: 'Customer Success Manager',
    titleFr: 'Responsable Marketplace & Customer Success',
    poles: ['marketplace', 'support'],
    description:
      'Gestion de l’expérience client, marketplace, commandes, abonnés, support et fidélisation.',
  },

  audit_compliance_lead: {
    id: 'audit_compliance_lead',
    title: 'Audit & Compliance Lead',
    titleFr: 'Responsable Audit & Conformité',
    poles: ['audit', 'compliance'],
    description:
      'Contrôles, audits, non-conformités, actions correctives, contrats, politiques et conformité.',
  },

  rse_impact_manager: {
    id: 'rse_impact_manager',
    title: 'RSE & Impact Manager',
    titleFr: 'Responsable RSE & Impact',
    poles: ['rse'],
    description:
      'Packaging, recyclage, impact carbone, indicateurs ESG et programmes RSE.',
  },

  product_engineering_manager: {
    id: 'product_engineering_manager',
    title: 'Product & Engineering Manager',
    titleFr: 'Responsable Produit & Engineering',
    poles: ['product'],
    description:
      'Produit, roadmap, backlog, engineering, intégrations, documentation et innovation.',
  },

  marketing_communication_manager: {
    id: 'marketing_communication_manager',
    title: 'Marketing & Communication Manager',
    titleFr: 'Responsable Marketing & Communication',
    poles: ['marketing'],
    description:
      'Campagnes, contenus, CRM, parcours, communication, analytics et réputation.',
  },

  rh_manager: {
    id: 'rh_manager',
    title: 'HR Manager',
    titleFr: 'Responsable RH',
    poles: ['rh'],
    description:
      'Recrutement, dossiers collaborateurs, Onboarding RH — intégration collaborateur, présence, congés et formation.',
  },

  data_bi_manager: {
    id: 'data_bi_manager',
    title: 'Data & BI Manager',
    titleFr: 'Responsable Data & BI',
    poles: ['data'],
    description:
      'KPI, reporting, business intelligence, demandes data et gouvernance des versions.',
  },

  security_it_manager: {
    id: 'security_it_manager',
    title: 'Security & IT Manager',
    titleFr: 'Responsable Security & IT',
    poles: ['security'],
    description:
      'Accès, sécurité, infrastructure, environnements, VPN et journalisation.',
  },
};

export const getEmployeeRole = (
  roleId: EmployeeRole,
): EmployeeRoleInfo => {
  return employeeRoles[roleId];
};
