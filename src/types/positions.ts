export type EmployeePosition =
  | 'supplier_manager'
  | 'customer_success_manager'
  | 'ops_logistics_manager'
  | 'finance_manager'
  | 'audit_compliance_lead'
  | 'rse_impact_manager'
  | 'product_engineering_manager'
  | 'marketing_communication_manager'
  | 'rh_manager'
  | 'data_bi_manager'
  | 'security_it_manager'
  | 'ceo';

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
    module: 'Fournisseurs & Produits',
    description:
      'Qualification des fournisseurs, contrôle des catalogues, validation des produits et certifications.',
  },

  customer_success_manager: {
    id: 'customer_success_manager',
    title: 'Customer Success Manager',
    titleFr: 'Responsable Support & Customer Success',
    module: 'Support & Customer Success',
    description:
      'Support, accompagnement client, suivi de la satisfaction et gestion des escalades.',
  },

  ops_logistics_manager: {
    id: 'ops_logistics_manager',
    title: 'Operations & Logistics Manager',
    titleFr: 'Responsable Opérations & Logistique',
    module: 'Opérations & Logistique',
    description:
      'Commandes, stocks, expéditions, partenaires logistiques et incidents opérationnels.',
  },

  finance_manager: {
    id: 'finance_manager',
    title: 'Finance Manager',
    titleFr: 'Responsable Finance',
    module: 'Finance',
    description:
      'Trésorerie, transactions, facturation, paiements, rapprochements et abonnements.',
  },

  audit_compliance_lead: {
    id: 'audit_compliance_lead',
    title: 'Audit, Compliance & Legal Lead',
    titleFr: 'Responsable Qualité, Audit & Conformité',
    module: 'Qualité & Audit / Conformité & Juridique',
    description:
      'Audits, contrôles, conformité, contrats, risques juridiques et actions correctives.',
  },

  rse_impact_manager: {
    id: 'rse_impact_manager',
    title: 'RSE & Impact Manager',
    titleFr: 'Responsable RSE & Impact',
    module: 'RSE & Impact',
    description:
      'Recyclage, emballages, impact environnemental, indicateurs ESG et reporting RSE.',
  },

  product_engineering_manager: {
    id: 'product_engineering_manager',
    title: 'Product & Engineering Manager',
    titleFr: 'Responsable Produit & Engineering',
    module: 'Produit & Engineering',
    description:
      'Produit, roadmap, backlog, développement, intégrations, documentation et innovation.',
  },

  marketing_communication_manager: {
    id: 'marketing_communication_manager',
    title: 'Marketing & Communication Manager',
    titleFr: 'Responsable Marketing & Communication',
    module: 'Marketing & Communication',
    description:
      'Campagnes, contenu, CRM, parcours clients, communication et réputation.',
  },

  rh_manager: {
    id: 'rh_manager',
    title: 'Human Resources Manager',
    titleFr: 'Responsable Ressources Humaines',
    module: 'Ressources Humaines',
    description:
      'Collaborateurs, recrutement, dossiers RH, onboarding, congés, formation et déplacements.',
  },

  data_bi_manager: {
    id: 'data_bi_manager',
    title: 'Data & BI Manager',
    titleFr: 'Responsable Data & BI',
    module: 'Data & BI',
    description:
      'KPI, gouvernance de la donnée, reporting, BI, demandes Data et qualité des données.',
  },

  security_it_manager: {
    id: 'security_it_manager',
    title: 'Security & IT Manager',
    titleFr: 'Responsable Security & IT',
    module: 'Security & IT',
    description:
      'Identités, accès, sécurité, infrastructure, environnements, VPN et supervision.',
  },

  ceo: {
    id: 'ceo',
    title: 'CEO',
    titleFr: 'CEO / Direction',
    module: 'Direction',
    description:
      'Vision stratégique, arbitrages, gouvernance, pilotage global et décisions de direction.',
  },
};
