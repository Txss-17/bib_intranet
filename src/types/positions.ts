// Phase 1 Employee Positions
export type EmployeePosition = 
  | 'supplier_manager'      // Supplier & Product Manager
  | 'user_success_manager'  // User Success & Risk Manager (Pôle 12)
  | 'ops_logistics_manager' // Ops & Logistics Manager
  | 'finance_manager'       // Finance & Cashflow Manager
  | 'audit_compliance_lead' // Audit, Compliance & Legal Lead
  | 'rse_packaging_manager' // RSE & Packaging Manager
  | 'tech_platform_manager' // Tech Platform Manager
  | 'marketing_manager'     // Marketing & Communication Manager
  | 'rh_manager'            // HR Manager
  | 'risk_manager'          // Risk & Incidents Manager
  | 'rd_manager'            // R&D Manager
  | 'ceo';                  // CEO / Fondatrice

export interface PositionInfo {
  id: EmployeePosition;
  title: string;
  titleFr: string;
  module: string;
  description: string;
}

export const positionInfos: Record<EmployeePosition, PositionInfo> = {
  supplier_manager: {
    id: 'supplier_manager',
    title: 'Supplier & Product Manager',
    titleFr: 'Responsable Fournisseurs & Produits',
    module: 'Supplier & Product Control',
    description: 'Gestion catalogues fournisseurs, validation produits, transmission Tech'
  },
  user_success_manager: {
    id: 'user_success_manager',
    title: 'User Success & Risk Manager',
    titleFr: 'Responsable Succès Client & Risques',
    module: 'User Success & Risk',
    description: 'Gestion comptes utilisateurs, prévention impayés, Trustpilot, support'
  },
  ops_logistics_manager: {
    id: 'ops_logistics_manager',
    title: 'Ops & Logistics Manager',
    titleFr: 'Responsable Ops & Logistique',
    module: 'Ops & Logistics Hub',
    description: 'Commandes, expéditions, incidents logistiques, partenaires'
  },
  finance_manager: {
    id: 'finance_manager',
    title: 'Finance & Cashflow Manager',
    titleFr: 'Responsable Finance & Trésorerie',
    module: 'Finance & Cashflow',
    description: 'Cashflow temps réel, paiements, abonnements, fonds de garantie'
  },
  audit_compliance_lead: {
    id: 'audit_compliance_lead',
    title: 'Audit, Compliance & Legal Lead',
    titleFr: 'Responsable Audit, Conformité & Juridique',
    module: 'Audit & Compliance',
    description: 'Audits terrain, certifications, incidents juridiques, sanctions'
  },
  rse_packaging_manager: {
    id: 'rse_packaging_manager',
    title: 'RSE & Packaging Manager',
    titleFr: 'Responsable RSE & Packaging',
    module: 'RSE & Packaging Lifecycle',
    description: 'Validation packaging, recyclabilité, reporting ESG, transmission Ops'
  },
  tech_platform_manager: {
    id: 'tech_platform_manager',
    title: 'Tech Platform Manager',
    titleFr: 'Responsable Plateforme Tech',
    module: 'Tech & Catalogue',
    description: 'Catalogue produits, site, intranet, sécurité, monitoring'
  },
  marketing_manager: {
    id: 'marketing_manager',
    title: 'Marketing & Communication Manager',
    titleFr: 'Responsable Marketing & Communication',
    module: 'Marketing & Communication',
    description: 'Campagnes, analytics, contenu, podcasts, stratégie de communication'
  },
  rh_manager: {
    id: 'rh_manager',
    title: 'HR Manager',
    titleFr: 'Responsable Ressources Humaines',
    module: 'Ressources Humaines',
    description: 'Recrutement, formation, congés, fiches employés, onboarding'
  },
  risk_manager: {
    id: 'risk_manager',
    title: 'Risk & Incidents Manager',
    titleFr: 'Responsable Risques & Incidents',
    module: 'Risk & Incidents',
    description: 'Registre des risques, incidents actifs, métriques, historique'
  },
  rd_manager: {
    id: 'rd_manager',
    title: 'R&D Manager',
    titleFr: 'Responsable R&D',
    module: 'Recherche & Développement',
    description: 'Études produits, frictions terrain, rapports boutiques, fournisseurs R&D'
  },
  ceo: {
    id: 'ceo',
    title: 'CEO / Fondatrice',
    titleFr: 'CEO / Fondatrice',
    module: 'Executive & Strategy',
    description: 'Vision stratégique, KPI globaux, arbitrage, gouvernance'
  }
};
