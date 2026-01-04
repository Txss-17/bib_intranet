// Phase 1 Employee Roles - LINKSY Group
export type EmployeeRole = 
  | 'ceo'                    // CEO / Fondatrice
  | 'coo'                    // COO / Ops Lead
  | 'finance_manager'        // Finance & Cashflow Manager
  | 'compliance_officer'     // Compliance & Risk Officer
  | 'supplier_manager'       // Supplier & Product Validation Manager
  | 'logistics_coordinator'  // Ops & Logistics Coordinator
  | 'rse_manager'           // RSE & Packaging Manager
  | 'rd_manager'            // R&D & Test Stores Manager
  | 'tech_lead'             // Tech Lead & Architect
  | 'support_manager'       // User Success & Support Manager
  | 'brand_manager'         // Brand & Media Manager
  | 'hr_manager';           // HR & Culture Manager

export type EmployeeStatus = 'online' | 'absent' | 'busy' | 'offline';

export interface EmployeeRoleInfo {
  id: EmployeeRole;
  title: string;
  titleFr: string;
  poles: string[];  // Poles this role has access to
  description: string;
}

export const employeeRoles: Record<EmployeeRole, EmployeeRoleInfo> = {
  ceo: {
    id: 'ceo',
    title: 'CEO / Founder',
    titleFr: 'CEO / Fondatrice',
    poles: ['*'], // Access to all poles (read)
    description: 'Vision, arbitrage stratégique, validation finale',
  },
  coo: {
    id: 'coo',
    title: 'COO / Ops Lead',
    titleFr: 'COO / Ops Lead',
    poles: ['direction', 'ops', 'tech', 'supplier', 'logistics'],
    description: 'Coordination globale, gestion incidents',
  },
  finance_manager: {
    id: 'finance_manager',
    title: 'Finance & Cashflow Manager',
    titleFr: 'Finance & Cashflow Manager',
    poles: ['finance'],
    description: 'Comptabilité, cashflow, paiements, levées de fonds',
  },
  compliance_officer: {
    id: 'compliance_officer',
    title: 'Compliance & Risk Officer',
    titleFr: 'Compliance & Risk Officer',
    poles: ['finance', 'compliance', 'audit', 'risk'],
    description: 'CGU/CGV, risques fournisseurs, litiges',
  },
  supplier_manager: {
    id: 'supplier_manager',
    title: 'Supplier & Product Manager',
    titleFr: 'Supplier & Product Validation Manager',
    poles: ['supplier'],
    description: 'Contacts fournisseurs, contrats, validation produits',
  },
  logistics_coordinator: {
    id: 'logistics_coordinator',
    title: 'Logistics Coordinator',
    titleFr: 'Ops & Logistics Coordinator',
    poles: ['ops', 'logistics'],
    description: 'Relation fulfilment, suivi expéditions, incidents',
  },
  rse_manager: {
    id: 'rse_manager',
    title: 'RSE & Packaging Manager',
    titleFr: 'RSE & Packaging Manager',
    poles: ['rse'],
    description: 'Validation packaging, recyclabilité, reporting ESG',
  },
  rd_manager: {
    id: 'rd_manager',
    title: 'R&D & Test Stores Manager',
    titleFr: 'R&D & Test Stores Manager',
    poles: ['marketing', 'ops'],
    description: 'Boutiques tests, analyse performance, agents IA',
  },
  tech_lead: {
    id: 'tech_lead',
    title: 'Tech Lead & Architect',
    titleFr: 'Tech Lead & Architect',
    poles: ['tech'],
    description: 'Site utilisateur, intranet, sécurité, catalogue',
  },
  support_manager: {
    id: 'support_manager',
    title: 'User Success Manager',
    titleFr: 'User Success & Support Manager',
    poles: ['lifecycle'],
    description: 'Support client, Trustpilot, prévention impayés',
  },
  brand_manager: {
    id: 'brand_manager',
    title: 'Brand & Media Manager',
    titleFr: 'Brand & Media Manager',
    poles: ['marketing'],
    description: 'Image LINKSY, podcasts, communication externe',
  },
  hr_manager: {
    id: 'hr_manager',
    title: 'HR & Culture Manager',
    titleFr: 'HR & Culture Manager',
    poles: ['rh'],
    description: 'Recrutement, onboarding, culture interne',
  },
};

export const getEmployeeRole = (roleId: EmployeeRole): EmployeeRoleInfo => {
  return employeeRoles[roleId];
};
