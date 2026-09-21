import { EmployeePosition } from '@/types/positions';
import { Seniority } from '@/data/permissionRules';

// ---------------------------------------------------------------------------
// Catalogue des rôles métiers Brand in a Box
//
// Architecture cible :
// direction
// finance
// ops
// supplier
// marketplace
// support
// marketing
// rh
// audit
// compliance
// rse
// product
// data
// security
//
// Les anciens pôles tech / lifecycle / rd / risk ne doivent plus être
// utilisés comme périmètres fonctionnels.
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
  id: string;
  label: string;
  department: JobDepartment;
  position: EmployeePosition;
  poles: string[];
  seniority: Seniority;
  readOnly?: boolean;
  external?: boolean;
  priority?: number;
  landing?: string;
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
  { id: 'tech', label: 'Produit & Engineering' },
  { id: 'data', label: 'Data & BI' },
  { id: 'security', label: 'Security & IT' },
  { id: 'admin', label: 'Administration' },
  { id: 'communication', label: 'Communication' },
  { id: 'innovation', label: 'Innovation' },
  { id: 'external', label: 'Utilisateurs externes' },
  { id: 'technical', label: 'Comptes techniques' },
];

const ALL_POLES = [
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
];

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------

export const jobRoles: JobRole[] = [
  // -------------------------------------------------------------------------
  // DIRECTION
  // -------------------------------------------------------------------------

  {
    id: 'ceo',
    label: 'CEO',
    department: 'direction',
    position: 'ceo',
    poles: ALL_POLES,
    seniority: 'executive',
    priority: 1,
    landing: '/pole/direction',
  },

  {
    id: 'coo',
    label: 'COO — Directeur des opérations',
    department: 'direction',
    position: 'ops_logistics_manager',
    poles: ['direction', 'ops', 'supplier', 'marketplace', 'support'],
    seniority: 'executive',
    landing: '/pole/ops',
  },

  {
    id: 'cto',
    label: 'CTO — Directeur technique',
    department: 'direction',
    position: 'tech_platform_manager',
    poles: ['direction', 'product', 'data', 'security'],
    seniority: 'executive',
    landing: '/pole/product',
  },

  {
    id: 'cfo',
    label: 'CFO — Directeur financier',
    department: 'direction',
    position: 'finance_manager',
    poles: ['direction', 'finance', 'compliance'],
    seniority: 'executive',
    landing: '/pole/finance',
  },

  {
    id: 'cdo',
    label: 'CDO — Chief Data Officer',
    department: 'direction',
    position: 'data_analyst',
    poles: ['direction', 'data', 'product'],
    seniority: 'executive',
    landing: '/pole/data',
  },

  {
    id: 'directeur_rh',
    label: 'Directeur RH',
    department: 'direction',
    position: 'rh_manager',
    poles: ['direction', 'rh'],
    seniority: 'executive',
    landing: '/pole/rh',
  },

  {
    id: 'directeur_qualite',
    label: 'Directeur Qualité',
    department: 'direction',
    position: 'audit_compliance_lead',
    poles: ['direction', 'audit', 'compliance', 'supplier'],
    seniority: 'executive',
    landing: '/pole/audit',
  },

  {
    id: 'directeur_marketplace',
    label: 'Directeur Marketplace',
    department: 'direction',
    position: 'user_success_manager',
    poles: ['direction', 'marketplace', 'support', 'marketing'],
    seniority: 'executive',
    landing: '/pole/marketplace',
  },

  // -------------------------------------------------------------------------
  // FINANCE
  // -------------------------------------------------------------------------

  {
    id: 'comptable',
    label: 'Comptable',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance'],
    seniority: 'mid',
    priority: 7,
    landing: '/pole/finance/transactions',
  },

  {
    id: 'controleur_gestion',
    label: 'Contrôleur de gestion',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance', 'data'],
    seniority: 'senior',
    landing: '/pole/finance',
  },

  {
    id: 'analyste_financier',
    label: 'Analyste financier',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance', 'data'],
    seniority: 'mid',
    landing: '/pole/finance/cashflow',
  },

  {
    id: 'tresorier',
    label: 'Trésorier',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance'],
    seniority: 'senior',
    landing: '/pole/finance/cashflow',
  },

  {
    id: 'gestionnaire_facturation',
    label: 'Gestionnaire de facturation',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance'],
    seniority: 'junior',
    landing: '/pole/finance/transactions',
  },

  {
    id: 'gestionnaire_remboursements',
    label: 'Gestionnaire des remboursements',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance', 'support', 'marketplace'],
    seniority: 'junior',
    landing: '/pole/finance/transactions',
  },

  {
    id: 'gestionnaire_paiements',
    label: 'Gestionnaire Stripe / Paiements',
    department: 'finance',
    position: 'finance_manager',
    poles: ['finance'],
    seniority: 'mid',
    priority: 8,
    landing: '/pole/finance/transactions',
  },

  // -------------------------------------------------------------------------
  // RH
  // -------------------------------------------------------------------------

  {
    id: 'responsable_rh',
    label: 'Responsable RH',
    department: 'rh',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'lead',
    priority: 13,
    landing: '/pole/rh',
  },

  {
    id: 'charge_recrutement',
    label: 'Chargé de recrutement',
    department: 'rh',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'mid',
    landing: '/pole/rh/recruitment',
  },

  {
    id: 'gestionnaire_paie',
    label: 'Gestionnaire paie',
    department: 'rh',
    position: 'rh_manager',
    poles: ['rh', 'finance'],
    seniority: 'senior',
    landing: '/pole/rh/employees',
  },

  {
    id: 'gestionnaire_admin_rh',
    label: 'Gestionnaire administratif RH',
    department: 'rh',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'junior',
    landing: '/pole/rh/employees',
  },

  {
    id: 'responsable_formation',
    label: 'Responsable formation',
    department: 'rh',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'mid',
    landing: '/pole/rh/training',
  },

  // -------------------------------------------------------------------------
  // FOURNISSEURS & PRODUITS
  // -------------------------------------------------------------------------

  {
    id: 'responsable_fournisseurs',
    label: 'Responsable fournisseurs',
    department: 'supplier',
    position: 'supplier_manager',
    poles: ['supplier'],
    seniority: 'lead',
    priority: 3,
    landing: '/pole/supplier',
  },

  {
    id: 'gestionnaire_fournisseurs',
    label: 'Gestionnaire fournisseurs',
    department: 'supplier',
    position: 'supplier_manager',
    poles: ['supplier', 'ops'],
    seniority: 'mid',
    priority: 4,
    landing: '/pole/supplier',
  },

  {
    id: 'responsable_catalogue',
    label: 'Responsable catalogue produits',
    department: 'supplier',
    position: 'supplier_manager',
    poles: ['supplier', 'product'],
    seniority: 'lead',
    landing: '/pole/supplier/validated',
  },

  {
    id: 'gestionnaire_catalogue',
    label: 'Gestionnaire catalogue',
    department: 'supplier',
    position: 'supplier_manager',
    poles: ['supplier'],
    seniority: 'junior',
    landing: '/pole/supplier/pending',
  },

  {
    id: 'conformite_fournisseurs',
    label: 'Responsable conformité fournisseurs',
    department: 'supplier',
    position: 'audit_compliance_lead',
    poles: ['supplier', 'compliance', 'audit'],
    seniority: 'senior',
    landing: '/pole/supplier/certifications',
  },

  {
    id: 'acheteur',
    label: 'Acheteur',
    department: 'supplier',
    position: 'supplier_manager',
    poles: ['supplier', 'ops'],
    seniority: 'mid',
    landing: '/pole/supplier/restock-orders',
  },

  // -------------------------------------------------------------------------
  // MARKETPLACE
  // -------------------------------------------------------------------------

  {
    id: 'responsable_marketplace',
    label: 'Responsable marketplace',
    department: 'marketplace',
    position: 'user_success_manager',
    poles: ['marketplace', 'ops', 'marketing'],
    seniority: 'lead',
    priority: 11,
    landing: '/pole/marketplace',
  },

  {
    id: 'gestionnaire_boutiques',
    label: 'Gestionnaire boutiques',
    department: 'marketplace',
    position: 'user_success_manager',
    poles: ['marketplace'],
    seniority: 'mid',
    landing: '/pole/marketplace/stores',
  },

  {
    id: 'gestionnaire_vendeurs',
    label: 'Gestionnaire vendeurs',
    department: 'marketplace',
    position: 'user_success_manager',
    poles: ['marketplace', 'supplier'],
    seniority: 'mid',
    landing: '/pole/marketplace/stores',
  },

  {
    id: 'gestionnaire_commandes',
    label: 'Gestionnaire commandes',
    department: 'marketplace',
    position: 'ops_logistics_manager',
    poles: ['marketplace', 'ops'],
    seniority: 'junior',
    landing: '/pole/marketplace/orders',
  },

  {
    id: 'gestionnaire_litiges',
    label: 'Gestionnaire litiges',
    department: 'marketplace',
    position: 'audit_compliance_lead',
    poles: ['marketplace', 'support', 'compliance'],
    seniority: 'mid',
    landing: '/pole/support/escalations',
  },

  {
    id: 'gestionnaire_avis',
    label: 'Gestionnaire avis',
    department: 'marketplace',
    position: 'user_success_manager',
    poles: ['marketplace', 'marketing'],
    seniority: 'junior',
    landing: '/pole/marketplace/stores',
  },

  // -------------------------------------------------------------------------
  // QUALITÉ & AUDIT
  // -------------------------------------------------------------------------

  {
    id: 'responsable_qualite',
    label: 'Responsable qualité',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['audit', 'compliance', 'supplier'],
    seniority: 'lead',
    priority: 5,
    landing: '/pole/audit',
  },

  {
    id: 'auditeur_qualite',
    label: 'Auditeur qualité',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['audit'],
    seniority: 'mid',
    priority: 6,
    landing: '/pole/audit',
  },

  {
    id: 'auditeur_terrain',
    label: 'Auditeur terrain',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['audit', 'supplier', 'ops'],
    seniority: 'mid',
    landing: '/pole/audit/field',
  },

  {
    id: 'responsable_conformite',
    label: 'Responsable conformité',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['compliance', 'audit'],
    seniority: 'lead',
    landing: '/pole/compliance',
  },

  {
    id: 'gestionnaire_nc',
    label: 'Gestionnaire non-conformités',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['audit'],
    seniority: 'junior',
    landing: '/pole/audit/nonconformities',
  },

  {
    id: 'gestionnaire_certifications',
    label: 'Gestionnaire certifications',
    department: 'quality',
    position: 'audit_compliance_lead',
    poles: ['audit', 'supplier'],
    seniority: 'mid',
    landing: '/pole/audit/supplier',
  },

  // -------------------------------------------------------------------------
  // OPÉRATIONS & LOGISTIQUE
  // -------------------------------------------------------------------------

  {
    id: 'responsable_logistique',
    label: 'Responsable logistique',
    department: 'logistics',
    position: 'ops_logistics_manager',
    poles: ['ops'],
    seniority: 'lead',
    priority: 17,
    landing: '/pole/ops',
  },

  {
    id: 'gestionnaire_transport',
    label: 'Gestionnaire transport',
    department: 'logistics',
    position: 'ops_logistics_manager',
    poles: ['ops'],
    seniority: 'mid',
    landing: '/pole/ops/shipments',
  },

  {
    id: 'gestionnaire_entrepots',
    label: 'Gestionnaire entrepôts',
    department: 'logistics',
    position: 'ops_logistics_manager',
    poles: ['ops'],
    seniority: 'mid',
    landing: '/pole/ops/stocks',
  },

  {
    id: 'gestionnaire_stocks',
    label: 'Gestionnaire stocks',
    department: 'logistics',
    position: 'ops_logistics_manager',
    poles: ['ops', 'supplier'],
    seniority: 'junior',
    landing: '/pole/ops/stocks',
  },

  {
    id: 'coordinateur_expeditions',
    label: 'Coordinateur expéditions',
    department: 'logistics',
    position: 'ops_logistics_manager',
    poles: ['ops'],
    seniority: 'junior',
    landing: '/pole/ops/pipeline',
  },

  // -------------------------------------------------------------------------
  // SUPPORT & CUSTOMER SUCCESS
  // -------------------------------------------------------------------------

  {
    id: 'responsable_support',
    label: 'Responsable support',
    department: 'support',
    position: 'user_success_manager',
    poles: ['support', 'marketplace'],
    seniority: 'lead',
    priority: 12,
    landing: '/pole/support',
  },

  {
    id: 'technicien_support',
    label: 'Technicien support',
    department: 'support',
    position: 'user_success_manager',
    poles: ['support', 'product'],
    seniority: 'mid',
    landing: '/pole/support/tickets',
  },

  {
    id: 'conseiller_client',
    label: 'Conseiller client',
    department: 'support',
    position: 'user_success_manager',
    poles: ['support'],
    seniority: 'junior',
    landing: '/pole/support/tickets',
  },

  {
    id: 'gestionnaire_tickets',
    label: 'Gestionnaire tickets',
    department: 'support',
    position: 'user_success_manager',
    poles: ['support'],
    seniority: 'junior',
    landing: '/pole/support/tickets',
  },

  {
    id: 'community_support',
    label: 'Community Support',
    department: 'support',
    position: 'user_success_manager',
    poles: ['support', 'marketing'],
    seniority: 'junior',
    landing: '/pole/support/tickets',
  },

  // -------------------------------------------------------------------------
  // JURIDIQUE / CONFORMITÉ
  // -------------------------------------------------------------------------

  {
    id: 'juriste',
    label: 'Juriste',
    department: 'legal',
    position: 'audit_compliance_lead',
    poles: ['compliance'],
    seniority: 'senior',
    priority: 14,
    landing: '/pole/compliance',
  },

  {
    id: 'conformite_juridique',
    label: 'Responsable conformité juridique',
    department: 'legal',
    position: 'audit_compliance_lead',
    poles: ['compliance', 'audit'],
    seniority: 'lead',
    landing: '/pole/compliance/policies',
  },

  {
    id: 'gestionnaire_contrats',
    label: 'Gestionnaire contrats',
    department: 'legal',
    position: 'audit_compliance_lead',
    poles: ['compliance'],
    seniority: 'mid',
    landing: '/pole/compliance/contracts',
  },

  {
    id: 'gestionnaire_docusign',
    label: 'Gestionnaire DocuSign',
    department: 'legal',
    position: 'audit_compliance_lead',
    poles: ['compliance', 'product'],
    seniority: 'junior',
    landing: '/pole/compliance/contracts',
  },

  // -------------------------------------------------------------------------
  // MARKETING
  // -------------------------------------------------------------------------

  {
    id: 'responsable_marketing',
    label: 'Responsable marketing',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing'],
    seniority: 'lead',
    priority: 15,
    landing: '/pole/marketing',
  },

  {
    id: 'growth_manager',
    label: 'Growth Manager',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing', 'data'],
    seniority: 'senior',
    landing: '/pole/marketing/analytics',
  },

  {
    id: 'content_manager',
    label: 'Content Manager',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing'],
    seniority: 'mid',
    landing: '/pole/marketing/content',
  },

  {
    id: 'seo_manager',
    label: 'SEO Manager',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing', 'data'],
    seniority: 'mid',
    landing: '/pole/marketing/analytics',
  },

  {
    id: 'social_media_manager',
    label: 'Social Media Manager',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing'],
    seniority: 'junior',
    landing: '/pole/marketing/content',
  },

  {
    id: 'crm_manager',
    label: 'CRM Manager',
    department: 'marketing',
    position: 'marketing_manager',
    poles: ['marketing', 'marketplace', 'support'],
    seniority: 'mid',
    landing: '/pole/marketing/crm',
  },

  // -------------------------------------------------------------------------
  // COMMERCIAL
  // -------------------------------------------------------------------------

  {
    id: 'responsable_commercial',
    label: 'Responsable commercial',
    department: 'sales',
    position: 'user_success_manager',
    poles: ['marketplace', 'marketing'],
    seniority: 'lead',
    priority: 16,
    landing: '/pole/marketplace',
  },

  {
    id: 'business_developer',
    label: 'Business Developer',
    department: 'sales',
    position: 'user_success_manager',
    poles: ['marketplace', 'marketing'],
    seniority: 'mid',
    landing: '/pole/marketplace/stores',
  },

  {
    id: 'account_manager',
    label: 'Account Manager',
    department: 'sales',
    position: 'user_success_manager',
    poles: ['marketplace', 'support'],
    seniority: 'mid',
    landing: '/pole/marketplace/stores',
  },

  {
    id: 'customer_success_manager',
    label: 'Customer Success Manager',
    department: 'sales',
    position: 'user_success_manager',
    poles: ['support', 'marketplace'],
    seniority: 'senior',
    landing: '/pole/support/customer-success',
  },

  // -------------------------------------------------------------------------
  // PRODUCT & ENGINEERING
  // -------------------------------------------------------------------------

  {
    id: 'responsable_tech',
    label: 'Responsable Produit & Engineering',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'data', 'security'],
    seniority: 'lead',
    priority: 2,
    landing: '/pole/product',
  },

  {
    id: 'product_manager',
    label: 'Product Manager',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'data', 'marketing'],
    seniority: 'senior',
    landing: '/pole/product',
  },

  {
    id: 'product_owner',
    label: 'Product Owner',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'data'],
    seniority: 'senior',
    landing: '/pole/product/backlog',
  },

  {
    id: 'scrum_master',
    label: 'Scrum Master',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/backlog',
  },

  {
    id: 'dev_frontend',
    label: 'Développeur Front-end',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/engineering',
  },

  {
    id: 'dev_backend',
    label: 'Développeur Back-end',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/engineering',
  },

  {
    id: 'dev_fullstack',
    label: 'Développeur Full Stack',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/engineering',
  },

  {
    id: 'dev_mobile',
    label: 'Développeur Mobile',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/engineering',
  },

  {
    id: 'ux_designer',
    label: 'UX Designer',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'marketing'],
    seniority: 'mid',
    landing: '/pole/product/studio',
  },

  {
    id: 'ui_designer',
    label: 'UI Designer',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'marketing'],
    seniority: 'mid',
    landing: '/pole/product/studio',
  },

  {
    id: 'product_designer',
    label: 'Product Designer',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'marketing'],
    seniority: 'senior',
    landing: '/pole/product/studio',
  },

  {
    id: 'qa_engineer',
    label: 'QA Engineer',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'audit'],
    seniority: 'mid',
    landing: '/pole/product/engineering',
  },

  {
    id: 'testeur_logiciel',
    label: 'Testeur logiciel',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product'],
    seniority: 'junior',
    landing: '/pole/product/engineering',
  },

  {
    id: 'devops_engineer',
    label: 'DevOps Engineer',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'senior',
    landing: '/pole/security/infrastructure',
  },

  {
    id: 'sre',
    label: 'Site Reliability Engineer (SRE)',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'senior',
    landing: '/pole/security/infrastructure',
  },

  {
    id: 'admin_systeme',
    label: 'Administrateur système',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['security'],
    seniority: 'senior',
    landing: '/pole/security/access',
  },

  {
    id: 'dba',
    label: 'Administrateur base de données (DBA)',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'data', 'security'],
    seniority: 'senior',
    landing: '/pole/security/infrastructure',
  },

  {
    id: 'architecte_logiciel',
    label: 'Architecte logiciel',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'lead',
    landing: '/pole/product/engineering',
  },

  {
    id: 'architecte_cloud',
    label: 'Architecte cloud',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'lead',
    landing: '/pole/security/infrastructure',
  },

  {
    id: 'ingenieur_cybersecurite',
    label: 'Ingénieur cybersécurité',
    department: 'tech',
    position: 'tech_platform_manager',
    poles: ['security', 'compliance', 'product'],
    seniority: 'senior',
    landing: '/pole/security/security',
  },

  // -------------------------------------------------------------------------
  // DATA & BI
  // -------------------------------------------------------------------------

  {
    id: 'responsable_data',
    label: 'Responsable Data',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'product'],
    seniority: 'lead',
    landing: '/pole/data',
  },

  {
    id: 'data_analyst',
    label: 'Data Analyst',
    department: 'data',
    position: 'data_analyst',
    poles: ['data'],
    seniority: 'mid',
    priority: 9,
    landing: '/pole/data',
  },

  {
    id: 'business_analyst',
    label: 'Business Analyst',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'finance', 'marketplace'],
    seniority: 'mid',
    landing: '/pole/data/reports',
  },

  {
    id: 'data_engineer',
    label: 'Data Engineer',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'product'],
    seniority: 'senior',
    landing: '/pole/data/bi',
  },

  {
    id: 'analytics_engineer',
    label: 'Analytics Engineer',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'product'],
    seniority: 'mid',
    landing: '/pole/data/bi',
  },

  {
    id: 'data_scientist',
    label: 'Data Scientist',
    department: 'data',
    position: 'data_analyst',
    poles: ['data'],
    seniority: 'senior',
    landing: '/pole/data/reports',
  },

  {
    id: 'bi_developer',
    label: 'BI Developer',
    department: 'data',
    position: 'data_analyst',
    poles: ['data'],
    seniority: 'mid',
    priority: 10,
    landing: '/pole/data/bi',
  },

  {
    id: 'data_steward',
    label: 'Data Steward',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'compliance'],
    seniority: 'mid',
    landing: '/pole/data/kpi',
  },

  {
    id: 'data_quality_manager',
    label: 'Data Quality Manager',
    department: 'data',
    position: 'data_analyst',
    poles: ['data', 'audit'],
    seniority: 'senior',
    landing: '/pole/data/versions',
  },

  // -------------------------------------------------------------------------
  // SECURITY & IT
  // -------------------------------------------------------------------------

  {
    id: 'rssi',
    label: 'RSSI',
    department: 'security',
    position: 'risk_manager',
    poles: ['security', 'product', 'compliance'],
    seniority: 'lead',
    landing: '/pole/security',
  },

  {
    id: 'analyste_cyber',
    label: 'Analyste cybersécurité',
    department: 'security',
    position: 'risk_manager',
    poles: ['security'],
    seniority: 'mid',
    landing: '/pole/security/security',
  },

  {
    id: 'gestionnaire_iam',
    label: 'Gestionnaire IAM',
    department: 'security',
    position: 'tech_platform_manager',
    poles: ['security'],
    seniority: 'mid',
    landing: '/pole/security/access',
  },

  {
    id: 'analyste_rgpd',
    label: 'Analyste conformité RGPD',
    department: 'security',
    position: 'audit_compliance_lead',
    poles: ['compliance', 'security'],
    seniority: 'mid',
    landing: '/pole/compliance/policies',
  },

  // -------------------------------------------------------------------------
  // ADMINISTRATION
  // -------------------------------------------------------------------------

  {
    id: 'office_manager',
    label: 'Office Manager',
    department: 'admin',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'mid',
    landing: '/pole/rh',
  },

  {
    id: 'assistant_administratif',
    label: 'Assistant administratif',
    department: 'admin',
    position: 'rh_manager',
    poles: ['rh'],
    seniority: 'junior',
    landing: '/documents',
  },

  // -------------------------------------------------------------------------
  // COMMUNICATION
  // -------------------------------------------------------------------------

  {
    id: 'responsable_communication',
    label: 'Responsable communication',
    department: 'communication',
    position: 'marketing_manager',
    poles: ['marketing'],
    seniority: 'lead',
    landing: '/pole/marketing',
  },

  {
    id: 'relations_presse',
    label: 'Relations presse',
    department: 'communication',
    position: 'marketing_manager',
    poles: ['marketing'],
    seniority: 'mid',
    landing: '/pole/marketing/content',
  },

  // -------------------------------------------------------------------------
  // INNOVATION
  // -------------------------------------------------------------------------

  {
    id: 'responsable_innovation',
    label: 'Responsable innovation',
    department: 'innovation',
    position: 'rd_manager',
    poles: ['product', 'supplier', 'data'],
    seniority: 'lead',
    landing: '/pole/product/innovation',
  },

  {
    id: 'chef_projet_innovation',
    label: 'Chef de projet innovation',
    department: 'innovation',
    position: 'rd_manager',
    poles: ['product'],
    seniority: 'mid',
    landing: '/pole/product/innovation',
  },

  // -------------------------------------------------------------------------
  // UTILISATEURS EXTERNES
  // -------------------------------------------------------------------------

  {
    id: 'ext_fournisseur',
    label: 'Fournisseur (externe)',
    department: 'external',
    position: 'supplier_manager',
    poles: ['supplier'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/supplier/pending',
  },

  {
    id: 'ext_vendeur',
    label: 'Vendeur Marketplace (externe)',
    department: 'external',
    position: 'user_success_manager',
    poles: ['marketplace'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/marketplace',
  },

  {
    id: 'ext_client_entreprise',
    label: 'Client entreprise',
    department: 'external',
    position: 'user_success_manager',
    poles: ['marketplace', 'support'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/support',
  },

  {
    id: 'ext_client_particulier',
    label: 'Client particulier',
    department: 'external',
    position: 'user_success_manager',
    poles: ['marketplace', 'support'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/support',
  },

  {
    id: 'ext_auditeur',
    label: 'Auditeur externe',
    department: 'external',
    position: 'audit_compliance_lead',
    poles: ['audit'],
    seniority: 'mid',
    external: true,
    readOnly: true,
    landing: '/modules/independent-audit',
  },

  {
    id: 'ext_prestataire',
    label: 'Prestataire',
    department: 'external',
    position: 'ops_logistics_manager',
    poles: ['ops'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/ops',
  },

  {
    id: 'ext_investisseur',
    label: 'Investisseur (lecture seule)',
    department: 'external',
    position: 'ceo',
    poles: ['direction', 'finance', 'data'],
    seniority: 'executive',
    external: true,
    readOnly: true,
    landing: '/pole/direction',
  },

  // -------------------------------------------------------------------------
  // COMPTES TECHNIQUES
  // -------------------------------------------------------------------------

  {
    id: 'svc_api',
    label: 'Compte API',
    department: 'technical',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/security/logs',
  },

  {
    id: 'svc_webhook',
    label: 'Compte Webhook',
    department: 'technical',
    position: 'tech_platform_manager',
    poles: ['product', 'security'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/security/logs',
  },

  {
    id: 'svc_robot',
    label: 'Robot d’automatisation',
    department: 'technical',
    position: 'tech_platform_manager',
    poles: ['product', 'ops'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/ops/flows',
  },

  {
    id: 'svc_stripe',
    label: 'Connecteur Stripe',
    department: 'technical',
    position: 'finance_manager',
    poles: ['finance', 'product', 'security'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/finance/transactions',
  },

  {
    id: 'svc_google',
    label: 'Connecteur Google Workspace',
    department: 'technical',
    position: 'tech_platform_manager',
    poles: ['product', 'security', 'rh'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/security/access',
  },

  {
    id: 'svc_supabase',
    label: 'Connecteur Supabase',
    department: 'technical',
    position: 'tech_platform_manager',
    poles: ['product', 'data', 'security'],
    seniority: 'junior',
    external: true,
    readOnly: true,
    landing: '/pole/security/infrastructure',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getJobRole = (
  id: string | null | undefined,
): JobRole | undefined =>
  id ? jobRoles.find((r) => r.id === id) : undefined;

export const rolesByDepartment = (
  dept: JobDepartment,
): JobRole[] =>
  jobRoles.filter((r) => r.department === dept);

export const priorityRoles = (): JobRole[] =>
  jobRoles
    .filter((r) => r.priority)
    .sort((a, b) => (a.priority! - b.priority!));

export const testAccountEmail = (role: JobRole) =>
  `${role.id.replace(/_/g, '-')}.test@brand-in-a-box.space`;

export const TEST_ACCOUNT_PASSWORD = 'BibTest!2026';
