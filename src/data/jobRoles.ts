import { EmployeePosition } from '@/types/positions';
import { Seniority } from '@/data/permissionRules';

// ---------------------------------------------------------------------------
// Catalogue complet des rôles métiers Brand in a Box.
// Chaque rôle métier est mappé sur un "poste" technique (EmployeePosition,
// utilisé par le moteur RBAC) + une liste de pôles accessibles + un niveau
// hiérarchique (seniority) qui pilote la matrice de permissions.
// ---------------------------------------------------------------------------

export type JobDepartment =
  | 'direction'
  | 'finance'
  | 'rh'
  | 'supplier'
  | 'marketplace'
  | 'quality'
  | 'logistics'
  | 'support'
  | 'legal'
  | 'marketing'
  | 'sales'
  | 'tech'
  | 'data'
  | 'security'
  | 'admin'
  | 'communication'
  | 'innovation'
  | 'external'
  | 'technical';

export interface JobRole {
  id: string;                    // slug unique, ex: 'ceo', 'comptable'
  label: string;                 // libellé FR
  department: JobDepartment;
  position: EmployeePosition;    // poste technique pour le RBAC
  poles: string[];               // pôles accessibles
  seniority: Seniority;
  readOnly?: boolean;            // profil en lecture seule
  external?: boolean;            // utilisateur externe / compte technique
  priority?: number;             // ordre de développement (1 = premier)
  landing?: string;              // écran d'atterrissage recommandé
}

export const jobDepartments: { id: JobDepartment; label: string }[] = [
  { id: 'direction', label: 'Direction' },
  { id: 'finance', label: 'Finance' },
  { id: 'rh', label: 'Ressources Humaines' },
  { id: 'supplier', label: 'Fournisseurs & Produits' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'quality', label: 'Qualité & Audit' },
  { id: 'logistics', label: 'Logistique' },
  { id: 'support', label: 'Support' },
  { id: 'legal', label: 'Juridique' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Commercial' },
  { id: 'tech', label: 'Tech' },
  { id: 'data', label: 'Data & Analytics' },
  { id: 'security', label: 'Sécurité' },
  { id: 'admin', label: 'Administration' },
  { id: 'communication', label: 'Communication' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'external', label: 'Utilisateurs externes' },
  { id: 'technical', label: 'Comptes techniques' },
];

const ALL_POLES = [
  'direction', 'finance', 'ops', 'tech', 'rh', 'supplier',
  'audit', 'compliance', 'rse', 'marketing', 'risk', 'lifecycle', 'data',
];

export const jobRoles: JobRole[] = [
  // ---------------- Direction ----------------
  { id: 'ceo', label: 'CEO', department: 'direction', position: 'ceo', poles: ALL_POLES, seniority: 'executive', priority: 1, landing: '/pole/direction' },
  { id: 'coo', label: 'COO — Directeur des opérations', department: 'direction', position: 'ops_logistics_manager', poles: ['direction', 'ops', 'supplier', 'lifecycle', 'risk'], seniority: 'executive', landing: '/pole/ops' },
  { id: 'cto', label: 'CTO — Directeur technique', department: 'direction', position: 'tech_platform_manager', poles: ['direction', 'tech', 'data'], seniority: 'executive', landing: '/pole/tech' },
  { id: 'cfo', label: 'CFO — Directeur financier', department: 'direction', position: 'finance_manager', poles: ['direction', 'finance', 'compliance'], seniority: 'executive', landing: '/pole/finance' },
  { id: 'cdo', label: 'CDO — Chief Data Officer', department: 'direction', position: 'data_analyst', poles: ['direction', 'data', 'tech'], seniority: 'executive', landing: '/pole/data' },
  { id: 'directeur_rh', label: 'Directeur RH', department: 'direction', position: 'rh_manager', poles: ['direction', 'rh'], seniority: 'executive', landing: '/pole/rh' },
  { id: 'directeur_qualite', label: 'Directeur Qualité', department: 'direction', position: 'audit_compliance_lead', poles: ['direction', 'audit', 'compliance', 'supplier'], seniority: 'executive', landing: '/pole/audit' },
  { id: 'directeur_marketplace', label: 'Directeur Marketplace', department: 'direction', position: 'user_success_manager', poles: ['direction', 'lifecycle', 'ops', 'marketing'], seniority: 'executive', landing: '/pole/lifecycle' },

  // ---------------- Finance ----------------
  { id: 'comptable', label: 'Comptable', department: 'finance', position: 'finance_manager', poles: ['finance'], seniority: 'mid', priority: 7, landing: '/pole/finance/transactions' },
  { id: 'controleur_gestion', label: 'Contrôleur de gestion', department: 'finance', position: 'finance_manager', poles: ['finance', 'data'], seniority: 'senior', landing: '/pole/finance' },
  { id: 'analyste_financier', label: 'Analyste financier', department: 'finance', position: 'finance_manager', poles: ['finance', 'data'], seniority: 'mid', landing: '/pole/finance/cashflow' },
  { id: 'tresorier', label: 'Trésorier', department: 'finance', position: 'finance_manager', poles: ['finance'], seniority: 'senior', landing: '/pole/finance/cashflow' },
  { id: 'gestionnaire_facturation', label: 'Gestionnaire de facturation', department: 'finance', position: 'finance_manager', poles: ['finance'], seniority: 'junior', landing: '/pole/finance/transactions' },
  { id: 'gestionnaire_remboursements', label: 'Gestionnaire des remboursements', department: 'finance', position: 'finance_manager', poles: ['finance', 'lifecycle'], seniority: 'junior', landing: '/pole/finance/transactions' },
  { id: 'gestionnaire_paiements', label: 'Gestionnaire Stripe / Paiements', department: 'finance', position: 'finance_manager', poles: ['finance'], seniority: 'mid', priority: 8, landing: '/pole/finance/supplier-payments' },

  // ---------------- RH ----------------
  { id: 'responsable_rh', label: 'Responsable RH', department: 'rh', position: 'rh_manager', poles: ['rh'], seniority: 'lead', priority: 13, landing: '/pole/rh' },
  { id: 'charge_recrutement', label: 'Chargé de recrutement', department: 'rh', position: 'rh_manager', poles: ['rh'], seniority: 'mid', landing: '/pole/rh/onboarding' },
  { id: 'gestionnaire_paie', label: 'Gestionnaire paie', department: 'rh', position: 'rh_manager', poles: ['rh', 'finance'], seniority: 'senior', landing: '/pole/finance/salaries' },
  { id: 'gestionnaire_admin_rh', label: 'Gestionnaire administratif RH', department: 'rh', position: 'rh_manager', poles: ['rh'], seniority: 'junior', landing: '/pole/rh/employees' },
  { id: 'responsable_formation', label: 'Responsable formation', department: 'rh', position: 'rh_manager', poles: ['rh'], seniority: 'mid', landing: '/pole/rh/training' },

  // ---------------- Fournisseurs & Produits ----------------
  { id: 'responsable_fournisseurs', label: 'Responsable fournisseurs', department: 'supplier', position: 'supplier_manager', poles: ['supplier'], seniority: 'lead', priority: 3, landing: '/pole/supplier' },
  { id: 'gestionnaire_fournisseurs', label: 'Gestionnaire fournisseurs', department: 'supplier', position: 'supplier_manager', poles: ['supplier', 'ops'], seniority: 'mid', priority: 4, landing: '/pole/supplier/suppliers' },
  { id: 'responsable_catalogue', label: 'Responsable catalogue produits', department: 'supplier', position: 'supplier_manager', poles: ['supplier', 'tech'], seniority: 'lead', landing: '/pole/supplier/validated' },
  { id: 'gestionnaire_catalogue', label: 'Gestionnaire catalogue', department: 'supplier', position: 'supplier_manager', poles: ['supplier'], seniority: 'junior', landing: '/pole/supplier/pending' },
  { id: 'conformite_fournisseurs', label: 'Responsable conformité fournisseurs', department: 'supplier', position: 'audit_compliance_lead', poles: ['supplier', 'compliance', 'audit'], seniority: 'senior', landing: '/pole/supplier/certifications' },
  { id: 'acheteur', label: 'Acheteur', department: 'supplier', position: 'supplier_manager', poles: ['supplier', 'ops'], seniority: 'mid', landing: '/pole/supplier/restock-orders' },

  // ---------------- Marketplace ----------------
  { id: 'responsable_marketplace', label: 'Responsable marketplace', department: 'marketplace', position: 'user_success_manager', poles: ['lifecycle', 'ops', 'marketing'], seniority: 'lead', priority: 11, landing: '/pole/lifecycle' },
  { id: 'gestionnaire_boutiques', label: 'Gestionnaire boutiques', department: 'marketplace', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'mid', landing: '/pole/lifecycle/user-accounts' },
  { id: 'gestionnaire_vendeurs', label: 'Gestionnaire vendeurs', department: 'marketplace', position: 'user_success_manager', poles: ['lifecycle', 'supplier'], seniority: 'mid', landing: '/pole/lifecycle/user-accounts' },
  { id: 'gestionnaire_commandes', label: 'Gestionnaire commandes', department: 'marketplace', position: 'ops_logistics_manager', poles: ['ops', 'lifecycle'], seniority: 'junior', landing: '/pole/ops/orders' },
  { id: 'gestionnaire_litiges', label: 'Gestionnaire litiges', department: 'marketplace', position: 'audit_compliance_lead', poles: ['compliance', 'lifecycle'], seniority: 'mid', landing: '/modules/compliance/disputes' },
  { id: 'gestionnaire_avis', label: 'Gestionnaire avis', department: 'marketplace', position: 'user_success_manager', poles: ['lifecycle', 'marketing'], seniority: 'junior', landing: '/pole/lifecycle/trustpilot' },

  // ---------------- Qualité & Audit ----------------
  { id: 'responsable_qualite', label: 'Responsable qualité', department: 'quality', position: 'audit_compliance_lead', poles: ['audit', 'compliance', 'supplier'], seniority: 'lead', priority: 5, landing: '/pole/audit' },
  { id: 'auditeur_qualite', label: 'Auditeur qualité', department: 'quality', position: 'audit_compliance_lead', poles: ['audit'], seniority: 'mid', priority: 6, landing: '/pole/audit' },
  { id: 'auditeur_terrain', label: 'Auditeur terrain', department: 'quality', position: 'audit_compliance_lead', poles: ['audit'], seniority: 'mid', landing: '/pole/audit' },
  { id: 'responsable_conformite', label: 'Responsable conformité', department: 'quality', position: 'audit_compliance_lead', poles: ['compliance', 'audit'], seniority: 'lead', landing: '/compliance-audit' },
  { id: 'gestionnaire_nc', label: 'Gestionnaire non-conformités', department: 'quality', position: 'audit_compliance_lead', poles: ['audit'], seniority: 'junior', landing: '/pole/audit' },
  { id: 'gestionnaire_certifications', label: 'Gestionnaire certifications', department: 'quality', position: 'audit_compliance_lead', poles: ['audit', 'supplier'], seniority: 'mid', landing: '/pole/supplier/certifications' },

  // ---------------- Logistique ----------------
  { id: 'responsable_logistique', label: 'Responsable logistique', department: 'logistics', position: 'ops_logistics_manager', poles: ['ops'], seniority: 'lead', priority: 17, landing: '/pole/ops' },
  { id: 'gestionnaire_transport', label: 'Gestionnaire transport', department: 'logistics', position: 'ops_logistics_manager', poles: ['ops'], seniority: 'mid', landing: '/pole/ops/shipments' },
  { id: 'gestionnaire_entrepots', label: 'Gestionnaire entrepôts', department: 'logistics', position: 'ops_logistics_manager', poles: ['ops'], seniority: 'mid', landing: '/pole/ops/stocks' },
  { id: 'gestionnaire_stocks', label: 'Gestionnaire stocks', department: 'logistics', position: 'ops_logistics_manager', poles: ['ops', 'supplier'], seniority: 'junior', landing: '/pole/ops/thresholds' },
  { id: 'coordinateur_expeditions', label: 'Coordinateur expéditions', department: 'logistics', position: 'ops_logistics_manager', poles: ['ops'], seniority: 'junior', landing: '/pole/ops/pipeline' },

  // ---------------- Support ----------------
  { id: 'responsable_support', label: 'Responsable support', department: 'support', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'lead', priority: 12, landing: '/pole/lifecycle/support' },
  { id: 'technicien_support', label: 'Technicien support', department: 'support', position: 'user_success_manager', poles: ['lifecycle', 'tech'], seniority: 'mid', landing: '/pole/lifecycle/support' },
  { id: 'conseiller_client', label: 'Conseiller client', department: 'support', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'junior', landing: '/pole/lifecycle/support' },
  { id: 'gestionnaire_tickets', label: 'Gestionnaire tickets', department: 'support', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'junior', landing: '/pole/lifecycle/support' },
  { id: 'community_support', label: 'Community Support', department: 'support', position: 'user_success_manager', poles: ['lifecycle', 'marketing'], seniority: 'junior', landing: '/pole/lifecycle/trustpilot' },

  // ---------------- Juridique ----------------
  { id: 'juriste', label: 'Juriste', department: 'legal', position: 'audit_compliance_lead', poles: ['compliance'], seniority: 'senior', priority: 14, landing: '/modules/compliance' },
  { id: 'conformite_juridique', label: 'Responsable conformité juridique', department: 'legal', position: 'audit_compliance_lead', poles: ['compliance', 'audit'], seniority: 'lead', landing: '/modules/compliance/policies' },
  { id: 'gestionnaire_contrats', label: 'Gestionnaire contrats', department: 'legal', position: 'audit_compliance_lead', poles: ['compliance'], seniority: 'mid', landing: '/modules/compliance/contracts' },
  { id: 'gestionnaire_docusign', label: 'Gestionnaire DocuSign', department: 'legal', position: 'audit_compliance_lead', poles: ['compliance', 'tech'], seniority: 'junior', landing: '/modules/compliance/contracts' },

  // ---------------- Marketing ----------------
  { id: 'responsable_marketing', label: 'Responsable marketing', department: 'marketing', position: 'marketing_manager', poles: ['marketing'], seniority: 'lead', priority: 15, landing: '/pole/marketing' },
  { id: 'growth_manager', label: 'Growth Manager', department: 'marketing', position: 'marketing_manager', poles: ['marketing', 'data'], seniority: 'senior', landing: '/pole/marketing/analytics' },
  { id: 'content_manager', label: 'Content Manager', department: 'marketing', position: 'marketing_manager', poles: ['marketing'], seniority: 'mid', landing: '/pole/marketing/content' },
  { id: 'seo_manager', label: 'SEO Manager', department: 'marketing', position: 'marketing_manager', poles: ['marketing', 'data'], seniority: 'mid', landing: '/pole/marketing/analytics' },
  { id: 'social_media_manager', label: 'Social Media Manager', department: 'marketing', position: 'marketing_manager', poles: ['marketing'], seniority: 'junior', landing: '/pole/marketing/content' },
  { id: 'crm_manager', label: 'CRM Manager', department: 'marketing', position: 'marketing_manager', poles: ['marketing', 'lifecycle'], seniority: 'mid', landing: '/pole/lifecycle/emails' },

  // ---------------- Commercial ----------------
  { id: 'responsable_commercial', label: 'Responsable commercial', department: 'sales', position: 'user_success_manager', poles: ['lifecycle', 'marketing'], seniority: 'lead', priority: 16, landing: '/pole/lifecycle' },
  { id: 'business_developer', label: 'Business Developer', department: 'sales', position: 'user_success_manager', poles: ['lifecycle', 'marketing'], seniority: 'mid', landing: '/pole/lifecycle/user-accounts' },
  { id: 'account_manager', label: 'Account Manager', department: 'sales', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'mid', landing: '/pole/lifecycle/user-accounts' },
  { id: 'customer_success_manager', label: 'Customer Success Manager', department: 'sales', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'senior', landing: '/pole/lifecycle/scoring' },

  // ---------------- Tech ----------------
  { id: 'responsable_tech', label: 'Responsable Tech', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'data'], seniority: 'lead', priority: 2, landing: '/pole/tech' },
  { id: 'product_manager', label: 'Product Manager', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'data', 'marketing'], seniority: 'senior', landing: '/pole/tech' },
  { id: 'product_owner', label: 'Product Owner', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'data'], seniority: 'senior', landing: '/pole/data/backlog' },
  { id: 'scrum_master', label: 'Scrum Master', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'mid', landing: '/pole/data/backlog' },
  { id: 'dev_frontend', label: 'Développeur Front-end', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'mid', landing: '/pole/tech/deployments' },
  { id: 'dev_backend', label: 'Développeur Back-end', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'mid', landing: '/pole/tech/deployments' },
  { id: 'dev_fullstack', label: 'Développeur Full Stack', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'mid', landing: '/pole/tech/deployments' },
  { id: 'dev_mobile', label: 'Développeur Mobile', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'mid', landing: '/pole/tech/deployments' },
  { id: 'ux_designer', label: 'UX Designer', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'marketing'], seniority: 'mid', landing: '/pole/tech' },
  { id: 'ui_designer', label: 'UI Designer', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'marketing'], seniority: 'mid', landing: '/pole/tech' },
  { id: 'product_designer', label: 'Product Designer', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'marketing'], seniority: 'senior', landing: '/pole/tech' },
  { id: 'qa_engineer', label: 'QA Engineer', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'audit'], seniority: 'mid', landing: '/pole/tech/logs' },
  { id: 'testeur_logiciel', label: 'Testeur logiciel', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'junior', landing: '/pole/tech/logs' },
  { id: 'devops_engineer', label: 'DevOps Engineer', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'senior', landing: '/pole/tech/infrastructure' },
  { id: 'sre', label: 'Site Reliability Engineer (SRE)', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'risk'], seniority: 'senior', landing: '/pole/tech/infrastructure' },
  { id: 'admin_systeme', label: 'Administrateur système', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'senior', landing: '/pole/tech/access' },
  { id: 'dba', label: 'Administrateur base de données (DBA)', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'data'], seniority: 'senior', landing: '/pole/tech/infrastructure' },
  { id: 'architecte_logiciel', label: 'Architecte logiciel', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'lead', landing: '/pole/tech' },
  { id: 'architecte_cloud', label: 'Architecte cloud', department: 'tech', position: 'tech_platform_manager', poles: ['tech'], seniority: 'lead', landing: '/pole/tech/infrastructure' },
  { id: 'ingenieur_cybersecurite', label: 'Ingénieur cybersécurité', department: 'tech', position: 'tech_platform_manager', poles: ['tech', 'risk', 'compliance'], seniority: 'senior', landing: '/pole/tech/security' },

  // ---------------- Data & Analytics ----------------
  { id: 'responsable_data', label: 'Responsable Data', department: 'data', position: 'data_analyst', poles: ['data', 'tech'], seniority: 'lead', landing: '/pole/data' },
  { id: 'data_analyst', label: 'Data Analyst', department: 'data', position: 'data_analyst', poles: ['data'], seniority: 'mid', priority: 9, landing: '/pole/data' },
  { id: 'business_analyst', label: 'Business Analyst', department: 'data', position: 'data_analyst', poles: ['data', 'finance'], seniority: 'mid', landing: '/pole/data/reports' },
  { id: 'data_engineer', label: 'Data Engineer', department: 'data', position: 'data_analyst', poles: ['data', 'tech'], seniority: 'senior', landing: '/pole/data/bi/sources' },
  { id: 'analytics_engineer', label: 'Analytics Engineer', department: 'data', position: 'data_analyst', poles: ['data', 'tech'], seniority: 'mid', landing: '/pole/data/bi/sources' },
  { id: 'data_scientist', label: 'Data Scientist', department: 'data', position: 'data_analyst', poles: ['data'], seniority: 'senior', landing: '/pole/data/reports' },
  { id: 'bi_developer', label: 'BI Developer', department: 'data', position: 'data_analyst', poles: ['data'], seniority: 'mid', priority: 10, landing: '/pole/data/bi' },
  { id: 'data_steward', label: 'Data Steward', department: 'data', position: 'data_analyst', poles: ['data', 'compliance'], seniority: 'mid', landing: '/pole/data/kpi' },
  { id: 'data_quality_manager', label: 'Data Quality Manager', department: 'data', position: 'data_analyst', poles: ['data', 'audit'], seniority: 'senior', landing: '/pole/data/versions' },

  // ---------------- Sécurité ----------------
  { id: 'rssi', label: 'RSSI', department: 'security', position: 'risk_manager', poles: ['risk', 'tech', 'compliance'], seniority: 'lead', landing: '/pole/risk' },
  { id: 'analyste_cyber', label: 'Analyste cybersécurité', department: 'security', position: 'risk_manager', poles: ['risk', 'tech'], seniority: 'mid', landing: '/pole/tech/security' },
  { id: 'gestionnaire_iam', label: 'Gestionnaire IAM', department: 'security', position: 'tech_platform_manager', poles: ['tech', 'risk'], seniority: 'mid', landing: '/pole/tech/access' },
  { id: 'analyste_rgpd', label: 'Analyste conformité RGPD', department: 'security', position: 'audit_compliance_lead', poles: ['compliance', 'risk'], seniority: 'mid', landing: '/modules/compliance/policies' },

  // ---------------- Administration ----------------
  { id: 'office_manager', label: 'Office Manager', department: 'admin', position: 'rh_manager', poles: ['rh'], seniority: 'mid', landing: '/pole/rh' },
  { id: 'assistant_administratif', label: 'Assistant administratif', department: 'admin', position: 'rh_manager', poles: ['rh'], seniority: 'junior', landing: '/documents' },

  // ---------------- Communication ----------------
  { id: 'responsable_communication', label: 'Responsable communication', department: 'communication', position: 'marketing_manager', poles: ['marketing'], seniority: 'lead', landing: '/pole/marketing' },
  { id: 'relations_presse', label: 'Relations presse', department: 'communication', position: 'marketing_manager', poles: ['marketing'], seniority: 'mid', landing: '/pole/marketing/content' },

  // ---------------- Innovation ----------------
  { id: 'responsable_innovation', label: 'Responsable innovation', department: 'innovation', position: 'rd_manager', poles: ['rd', 'supplier', 'lifecycle'], seniority: 'lead', landing: '/pole/rd' },
  { id: 'chef_projet_innovation', label: 'Chef de projet innovation', department: 'innovation', position: 'rd_manager', poles: ['rd'], seniority: 'mid', landing: '/pole/rd/products' },

  // ---------------- Utilisateurs externes ----------------
  { id: 'ext_fournisseur', label: 'Fournisseur (externe)', department: 'external', position: 'supplier_manager', poles: ['supplier'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/supplier/pending' },
  { id: 'ext_vendeur', label: 'Vendeur Marketplace (externe)', department: 'external', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/lifecycle' },
  { id: 'ext_client_entreprise', label: 'Client entreprise', department: 'external', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/lifecycle/support' },
  { id: 'ext_client_particulier', label: 'Client particulier', department: 'external', position: 'user_success_manager', poles: ['lifecycle'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/lifecycle/support' },
  { id: 'ext_auditeur', label: 'Auditeur externe', department: 'external', position: 'audit_compliance_lead', poles: ['audit'], seniority: 'mid', external: true, readOnly: true, landing: '/modules/independent-audit' },
  { id: 'ext_prestataire', label: 'Prestataire', department: 'external', position: 'ops_logistics_manager', poles: ['ops'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/ops' },
  { id: 'ext_investisseur', label: 'Investisseur (lecture seule)', department: 'external', position: 'ceo', poles: ['direction', 'finance'], seniority: 'executive', external: true, readOnly: true, landing: '/pole/direction' },

  // ---------------- Comptes techniques ----------------
  { id: 'svc_api', label: 'Compte API', department: 'technical', position: 'tech_platform_manager', poles: ['tech'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/tech/logs' },
  { id: 'svc_webhook', label: 'Compte Webhook', department: 'technical', position: 'tech_platform_manager', poles: ['tech'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/tech/logs' },
  { id: 'svc_robot', label: 'Robot d’automatisation', department: 'technical', position: 'tech_platform_manager', poles: ['tech', 'ops'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/ops/flows' },
  { id: 'svc_stripe', label: 'Connecteur Stripe', department: 'technical', position: 'finance_manager', poles: ['finance', 'tech'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/finance/transactions' },
  { id: 'svc_google', label: 'Connecteur Google Workspace', department: 'technical', position: 'tech_platform_manager', poles: ['tech', 'rh'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/tech/access' },
  { id: 'svc_supabase', label: 'Connecteur Supabase', department: 'technical', position: 'tech_platform_manager', poles: ['tech', 'data'], seniority: 'junior', external: true, readOnly: true, landing: '/pole/tech/infrastructure' },
];

export const getJobRole = (id: string | null | undefined): JobRole | undefined =>
  id ? jobRoles.find((r) => r.id === id) : undefined;

export const rolesByDepartment = (dept: JobDepartment): JobRole[] =>
  jobRoles.filter((r) => r.department === dept);

// Rôles prioritaires (ordre de développement / de test)
export const priorityRoles = (): JobRole[] =>
  jobRoles.filter((r) => r.priority).sort((a, b) => (a.priority! - b.priority!));

// Email d'un compte de test dérivé du rôle
export const testAccountEmail = (role: JobRole) =>
  `${role.id.replace(/_/g, '-')}.test@brand-in-a-box.space`;

export const TEST_ACCOUNT_PASSWORD = 'BibTest!2026';
