// This server catalog deliberately ignores identity fields supplied by the browser.
export interface TestAccountSpec {
  id: string;
  label: string;
  position: string;
  poles: readonly string[];
  seniority: string;
  email: string;
}
export const testAccountSpecs: readonly TestAccountSpec[] = [
  {
    "id": "ceo",
    "label": "CEO",
    "position": "ceo",
    "poles": [
      "direction",
      "finance",
      "ops",
      "supplier",
      "marketplace",
      "support",
      "marketing",
      "rh",
      "audit",
      "compliance",
      "rse",
      "product",
      "data",
      "security"
    ],
    "seniority": "executive",
    "email": "ceo.test@brand-in-a-box.space"
  },
  {
    "id": "coo",
    "label": "COO — Directeur des opérations",
    "position": "ops_logistics_manager",
    "poles": [
      "direction",
      "ops",
      "supplier",
      "marketplace",
      "support"
    ],
    "seniority": "executive",
    "email": "coo.test@brand-in-a-box.space"
  },
  {
    "id": "cto",
    "label": "CTO — Directeur technique",
    "position": "product_engineering_manager",
    "poles": [
      "direction",
      "product",
      "data",
      "security"
    ],
    "seniority": "executive",
    "email": "cto.test@brand-in-a-box.space"
  },
  {
    "id": "cfo",
    "label": "CFO — Directeur financier",
    "position": "finance_manager",
    "poles": [
      "direction",
      "finance",
      "compliance"
    ],
    "seniority": "executive",
    "email": "cfo.test@brand-in-a-box.space"
  },
  {
    "id": "cdo",
    "label": "CDO — Chief Data Officer",
    "position": "data_bi_manager",
    "poles": [
      "direction",
      "data",
      "product"
    ],
    "seniority": "executive",
    "email": "cdo.test@brand-in-a-box.space"
  },
  {
    "id": "directeur_rh",
    "label": "Directeur RH",
    "position": "rh_manager",
    "poles": [
      "direction",
      "rh"
    ],
    "seniority": "executive",
    "email": "directeur-rh.test@brand-in-a-box.space"
  },
  {
    "id": "directeur_qualite",
    "label": "Directeur Qualité",
    "position": "audit_compliance_lead",
    "poles": [
      "direction",
      "audit",
      "compliance",
      "supplier"
    ],
    "seniority": "executive",
    "email": "directeur-qualite.test@brand-in-a-box.space"
  },
  {
    "id": "directeur_marketplace",
    "label": "Directeur Marketplace",
    "position": "customer_success_manager",
    "poles": [
      "direction",
      "marketplace",
      "support",
      "marketing"
    ],
    "seniority": "executive",
    "email": "directeur-marketplace.test@brand-in-a-box.space"
  },
  {
    "id": "comptable",
    "label": "Comptable",
    "position": "finance_manager",
    "poles": [
      "finance"
    ],
    "seniority": "mid",
    "email": "comptable.test@brand-in-a-box.space"
  },
  {
    "id": "controleur_gestion",
    "label": "Contrôleur de gestion",
    "position": "finance_manager",
    "poles": [
      "finance",
      "data"
    ],
    "seniority": "senior",
    "email": "controleur-gestion.test@brand-in-a-box.space"
  },
  {
    "id": "analyste_financier",
    "label": "Analyste financier",
    "position": "finance_manager",
    "poles": [
      "finance",
      "data"
    ],
    "seniority": "mid",
    "email": "analyste-financier.test@brand-in-a-box.space"
  },
  {
    "id": "tresorier",
    "label": "Trésorier",
    "position": "finance_manager",
    "poles": [
      "finance"
    ],
    "seniority": "senior",
    "email": "tresorier.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_facturation",
    "label": "Gestionnaire de facturation",
    "position": "finance_manager",
    "poles": [
      "finance"
    ],
    "seniority": "junior",
    "email": "gestionnaire-facturation.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_remboursements",
    "label": "Gestionnaire des remboursements",
    "position": "finance_manager",
    "poles": [
      "finance",
      "support",
      "marketplace"
    ],
    "seniority": "junior",
    "email": "gestionnaire-remboursements.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_paiements",
    "label": "Gestionnaire Stripe / Paiements",
    "position": "finance_manager",
    "poles": [
      "finance"
    ],
    "seniority": "mid",
    "email": "gestionnaire-paiements.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_rh",
    "label": "Responsable RH",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "lead",
    "email": "responsable-rh.test@brand-in-a-box.space"
  },
  {
    "id": "charge_recrutement",
    "label": "Chargé de recrutement",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "mid",
    "email": "charge-recrutement.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_paie",
    "label": "Gestionnaire paie",
    "position": "rh_manager",
    "poles": [
      "rh",
      "finance"
    ],
    "seniority": "senior",
    "email": "gestionnaire-paie.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_admin_rh",
    "label": "Gestionnaire administratif RH",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "junior",
    "email": "gestionnaire-admin-rh.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_formation",
    "label": "Responsable formation",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "mid",
    "email": "responsable-formation.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_fournisseurs",
    "label": "Responsable fournisseurs",
    "position": "supplier_manager",
    "poles": [
      "supplier"
    ],
    "seniority": "lead",
    "email": "responsable-fournisseurs.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_fournisseurs",
    "label": "Gestionnaire fournisseurs",
    "position": "supplier_manager",
    "poles": [
      "supplier",
      "ops"
    ],
    "seniority": "mid",
    "email": "gestionnaire-fournisseurs.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_catalogue",
    "label": "Responsable catalogue produits",
    "position": "supplier_manager",
    "poles": [
      "supplier",
      "product"
    ],
    "seniority": "lead",
    "email": "responsable-catalogue.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_catalogue",
    "label": "Gestionnaire catalogue",
    "position": "supplier_manager",
    "poles": [
      "supplier"
    ],
    "seniority": "junior",
    "email": "gestionnaire-catalogue.test@brand-in-a-box.space"
  },
  {
    "id": "conformite_fournisseurs",
    "label": "Responsable conformité fournisseurs",
    "position": "audit_compliance_lead",
    "poles": [
      "supplier",
      "compliance",
      "audit"
    ],
    "seniority": "senior",
    "email": "conformite-fournisseurs.test@brand-in-a-box.space"
  },
  {
    "id": "acheteur",
    "label": "Acheteur",
    "position": "supplier_manager",
    "poles": [
      "supplier",
      "ops"
    ],
    "seniority": "mid",
    "email": "acheteur.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_marketplace",
    "label": "Responsable marketplace",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "ops",
      "marketing"
    ],
    "seniority": "lead",
    "email": "responsable-marketplace.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_boutiques",
    "label": "Gestionnaire boutiques",
    "position": "customer_success_manager",
    "poles": [
      "marketplace"
    ],
    "seniority": "mid",
    "email": "gestionnaire-boutiques.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_vendeurs",
    "label": "Gestionnaire vendeurs",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "supplier"
    ],
    "seniority": "mid",
    "email": "gestionnaire-vendeurs.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_commandes",
    "label": "Gestionnaire commandes",
    "position": "ops_logistics_manager",
    "poles": [
      "marketplace",
      "ops"
    ],
    "seniority": "junior",
    "email": "gestionnaire-commandes.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_litiges",
    "label": "Gestionnaire litiges",
    "position": "audit_compliance_lead",
    "poles": [
      "marketplace",
      "support",
      "compliance"
    ],
    "seniority": "mid",
    "email": "gestionnaire-litiges.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_avis",
    "label": "Gestionnaire avis",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "marketing"
    ],
    "seniority": "junior",
    "email": "gestionnaire-avis.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_qualite",
    "label": "Responsable qualité",
    "position": "audit_compliance_lead",
    "poles": [
      "audit",
      "compliance",
      "supplier"
    ],
    "seniority": "lead",
    "email": "responsable-qualite.test@brand-in-a-box.space"
  },
  {
    "id": "auditeur_qualite",
    "label": "Auditeur qualité",
    "position": "audit_compliance_lead",
    "poles": [
      "audit"
    ],
    "seniority": "mid",
    "email": "auditeur-qualite.test@brand-in-a-box.space"
  },
  {
    "id": "auditeur_terrain",
    "label": "Auditeur terrain",
    "position": "audit_compliance_lead",
    "poles": [
      "audit",
      "supplier",
      "ops"
    ],
    "seniority": "mid",
    "email": "auditeur-terrain.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_conformite",
    "label": "Responsable conformité",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance",
      "audit"
    ],
    "seniority": "lead",
    "email": "responsable-conformite.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_nc",
    "label": "Gestionnaire non-conformités",
    "position": "audit_compliance_lead",
    "poles": [
      "audit"
    ],
    "seniority": "junior",
    "email": "gestionnaire-nc.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_certifications",
    "label": "Gestionnaire certifications",
    "position": "audit_compliance_lead",
    "poles": [
      "audit",
      "supplier"
    ],
    "seniority": "mid",
    "email": "gestionnaire-certifications.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_logistique",
    "label": "Responsable logistique",
    "position": "ops_logistics_manager",
    "poles": [
      "ops"
    ],
    "seniority": "lead",
    "email": "responsable-logistique.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_transport",
    "label": "Gestionnaire transport",
    "position": "ops_logistics_manager",
    "poles": [
      "ops"
    ],
    "seniority": "mid",
    "email": "gestionnaire-transport.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_entrepots",
    "label": "Gestionnaire entrepôts",
    "position": "ops_logistics_manager",
    "poles": [
      "ops"
    ],
    "seniority": "mid",
    "email": "gestionnaire-entrepots.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_stocks",
    "label": "Gestionnaire stocks",
    "position": "ops_logistics_manager",
    "poles": [
      "ops",
      "supplier"
    ],
    "seniority": "junior",
    "email": "gestionnaire-stocks.test@brand-in-a-box.space"
  },
  {
    "id": "coordinateur_expeditions",
    "label": "Coordinateur expéditions",
    "position": "ops_logistics_manager",
    "poles": [
      "ops"
    ],
    "seniority": "junior",
    "email": "coordinateur-expeditions.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_support",
    "label": "Responsable support",
    "position": "customer_success_manager",
    "poles": [
      "support",
      "marketplace"
    ],
    "seniority": "lead",
    "email": "responsable-support.test@brand-in-a-box.space"
  },
  {
    "id": "technicien_support",
    "label": "Technicien support",
    "position": "customer_success_manager",
    "poles": [
      "support",
      "product"
    ],
    "seniority": "mid",
    "email": "technicien-support.test@brand-in-a-box.space"
  },
  {
    "id": "conseiller_client",
    "label": "Conseiller client",
    "position": "customer_success_manager",
    "poles": [
      "support"
    ],
    "seniority": "junior",
    "email": "conseiller-client.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_tickets",
    "label": "Gestionnaire tickets",
    "position": "customer_success_manager",
    "poles": [
      "support"
    ],
    "seniority": "junior",
    "email": "gestionnaire-tickets.test@brand-in-a-box.space"
  },
  {
    "id": "community_support",
    "label": "Community Support",
    "position": "customer_success_manager",
    "poles": [
      "support",
      "marketing"
    ],
    "seniority": "junior",
    "email": "community-support.test@brand-in-a-box.space"
  },
  {
    "id": "juriste",
    "label": "Juriste",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance"
    ],
    "seniority": "senior",
    "email": "juriste.test@brand-in-a-box.space"
  },
  {
    "id": "conformite_juridique",
    "label": "Responsable conformité juridique",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance",
      "audit"
    ],
    "seniority": "lead",
    "email": "conformite-juridique.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_contrats",
    "label": "Gestionnaire contrats",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance"
    ],
    "seniority": "mid",
    "email": "gestionnaire-contrats.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_docusign",
    "label": "Gestionnaire DocuSign",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance",
      "product"
    ],
    "seniority": "junior",
    "email": "gestionnaire-docusign.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_marketing",
    "label": "Responsable marketing",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing"
    ],
    "seniority": "lead",
    "email": "responsable-marketing.test@brand-in-a-box.space"
  },
  {
    "id": "growth_manager",
    "label": "Growth Manager",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing",
      "data"
    ],
    "seniority": "senior",
    "email": "growth-manager.test@brand-in-a-box.space"
  },
  {
    "id": "content_manager",
    "label": "Content Manager",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing"
    ],
    "seniority": "mid",
    "email": "content-manager.test@brand-in-a-box.space"
  },
  {
    "id": "seo_manager",
    "label": "SEO Manager",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing",
      "data"
    ],
    "seniority": "mid",
    "email": "seo-manager.test@brand-in-a-box.space"
  },
  {
    "id": "social_media_manager",
    "label": "Social Media Manager",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing"
    ],
    "seniority": "junior",
    "email": "social-media-manager.test@brand-in-a-box.space"
  },
  {
    "id": "crm_manager",
    "label": "CRM Manager",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing",
      "marketplace",
      "support"
    ],
    "seniority": "mid",
    "email": "crm-manager.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_commercial",
    "label": "Responsable commercial",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "marketing"
    ],
    "seniority": "lead",
    "email": "responsable-commercial.test@brand-in-a-box.space"
  },
  {
    "id": "business_developer",
    "label": "Business Developer",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "marketing"
    ],
    "seniority": "mid",
    "email": "business-developer.test@brand-in-a-box.space"
  },
  {
    "id": "account_manager",
    "label": "Account Manager",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "support"
    ],
    "seniority": "mid",
    "email": "account-manager.test@brand-in-a-box.space"
  },
  {
    "id": "customer_success_manager",
    "label": "Customer Success Manager",
    "position": "customer_success_manager",
    "poles": [
      "support",
      "marketplace"
    ],
    "seniority": "senior",
    "email": "customer-success-manager.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_tech",
    "label": "Responsable Produit & Engineering",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "data",
      "security"
    ],
    "seniority": "lead",
    "email": "responsable-tech.test@brand-in-a-box.space"
  },
  {
    "id": "product_manager",
    "label": "Product Manager",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "data",
      "marketing"
    ],
    "seniority": "senior",
    "email": "product-manager.test@brand-in-a-box.space"
  },
  {
    "id": "product_owner",
    "label": "Product Owner",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "data"
    ],
    "seniority": "senior",
    "email": "product-owner.test@brand-in-a-box.space"
  },
  {
    "id": "scrum_master",
    "label": "Scrum Master",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "scrum-master.test@brand-in-a-box.space"
  },
  {
    "id": "dev_frontend",
    "label": "Développeur Front-end",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "dev-frontend.test@brand-in-a-box.space"
  },
  {
    "id": "dev_backend",
    "label": "Développeur Back-end",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "dev-backend.test@brand-in-a-box.space"
  },
  {
    "id": "dev_fullstack",
    "label": "Développeur Full Stack",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "dev-fullstack.test@brand-in-a-box.space"
  },
  {
    "id": "dev_mobile",
    "label": "Développeur Mobile",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "dev-mobile.test@brand-in-a-box.space"
  },
  {
    "id": "ux_designer",
    "label": "UX Designer",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "marketing"
    ],
    "seniority": "mid",
    "email": "ux-designer.test@brand-in-a-box.space"
  },
  {
    "id": "ui_designer",
    "label": "UI Designer",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "marketing"
    ],
    "seniority": "mid",
    "email": "ui-designer.test@brand-in-a-box.space"
  },
  {
    "id": "product_designer",
    "label": "Product Designer",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "marketing"
    ],
    "seniority": "senior",
    "email": "product-designer.test@brand-in-a-box.space"
  },
  {
    "id": "qa_engineer",
    "label": "QA Engineer",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "audit"
    ],
    "seniority": "mid",
    "email": "qa-engineer.test@brand-in-a-box.space"
  },
  {
    "id": "testeur_logiciel",
    "label": "Testeur logiciel",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "junior",
    "email": "testeur-logiciel.test@brand-in-a-box.space"
  },
  {
    "id": "devops_engineer",
    "label": "DevOps Engineer",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "senior",
    "email": "devops-engineer.test@brand-in-a-box.space"
  },
  {
    "id": "sre",
    "label": "Site Reliability Engineer (SRE)",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "senior",
    "email": "sre.test@brand-in-a-box.space"
  },
  {
    "id": "admin_systeme",
    "label": "Administrateur système",
    "position": "product_engineering_manager",
    "poles": [
      "security"
    ],
    "seniority": "senior",
    "email": "admin-systeme.test@brand-in-a-box.space"
  },
  {
    "id": "dba",
    "label": "Administrateur base de données (DBA)",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "data",
      "security"
    ],
    "seniority": "senior",
    "email": "dba.test@brand-in-a-box.space"
  },
  {
    "id": "architecte_logiciel",
    "label": "Architecte logiciel",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "lead",
    "email": "architecte-logiciel.test@brand-in-a-box.space"
  },
  {
    "id": "architecte_cloud",
    "label": "Architecte cloud",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "lead",
    "email": "architecte-cloud.test@brand-in-a-box.space"
  },
  {
    "id": "ingenieur_cybersecurite",
    "label": "Ingénieur cybersécurité",
    "position": "product_engineering_manager",
    "poles": [
      "security",
      "compliance",
      "product"
    ],
    "seniority": "senior",
    "email": "ingenieur-cybersecurite.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_data",
    "label": "Responsable Data",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "product"
    ],
    "seniority": "lead",
    "email": "responsable-data.test@brand-in-a-box.space"
  },
  {
    "id": "data_bi_manager",
    "label": "Data Analyst",
    "position": "data_bi_manager",
    "poles": [
      "data"
    ],
    "seniority": "mid",
    "email": "data-bi-manager.test@brand-in-a-box.space"
  },
  {
    "id": "business_analyst",
    "label": "Business Analyst",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "finance",
      "marketplace"
    ],
    "seniority": "mid",
    "email": "business-analyst.test@brand-in-a-box.space"
  },
  {
    "id": "data_engineer",
    "label": "Data Engineer",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "product"
    ],
    "seniority": "senior",
    "email": "data-engineer.test@brand-in-a-box.space"
  },
  {
    "id": "analytics_engineer",
    "label": "Analytics Engineer",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "product"
    ],
    "seniority": "mid",
    "email": "analytics-engineer.test@brand-in-a-box.space"
  },
  {
    "id": "data_scientist",
    "label": "Data Scientist",
    "position": "data_bi_manager",
    "poles": [
      "data"
    ],
    "seniority": "senior",
    "email": "data-scientist.test@brand-in-a-box.space"
  },
  {
    "id": "bi_developer",
    "label": "BI Developer",
    "position": "data_bi_manager",
    "poles": [
      "data"
    ],
    "seniority": "mid",
    "email": "bi-developer.test@brand-in-a-box.space"
  },
  {
    "id": "data_steward",
    "label": "Data Steward",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "compliance"
    ],
    "seniority": "mid",
    "email": "data-steward.test@brand-in-a-box.space"
  },
  {
    "id": "data_quality_manager",
    "label": "Data Quality Manager",
    "position": "data_bi_manager",
    "poles": [
      "data",
      "audit"
    ],
    "seniority": "senior",
    "email": "data-quality-manager.test@brand-in-a-box.space"
  },
  {
    "id": "rssi",
    "label": "RSSI",
    "position": "security_it_manager",
    "poles": [
      "security",
      "product",
      "compliance"
    ],
    "seniority": "lead",
    "email": "rssi.test@brand-in-a-box.space"
  },
  {
    "id": "analyste_cyber",
    "label": "Analyste cybersécurité",
    "position": "security_it_manager",
    "poles": [
      "security"
    ],
    "seniority": "mid",
    "email": "analyste-cyber.test@brand-in-a-box.space"
  },
  {
    "id": "gestionnaire_iam",
    "label": "Gestionnaire IAM",
    "position": "product_engineering_manager",
    "poles": [
      "security"
    ],
    "seniority": "mid",
    "email": "gestionnaire-iam.test@brand-in-a-box.space"
  },
  {
    "id": "analyste_rgpd",
    "label": "Analyste conformité RGPD",
    "position": "audit_compliance_lead",
    "poles": [
      "compliance",
      "security"
    ],
    "seniority": "mid",
    "email": "analyste-rgpd.test@brand-in-a-box.space"
  },
  {
    "id": "office_manager",
    "label": "Office Manager",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "mid",
    "email": "office-manager.test@brand-in-a-box.space"
  },
  {
    "id": "assistant_administratif",
    "label": "Assistant administratif",
    "position": "rh_manager",
    "poles": [
      "rh"
    ],
    "seniority": "junior",
    "email": "assistant-administratif.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_communication",
    "label": "Responsable communication",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing"
    ],
    "seniority": "lead",
    "email": "responsable-communication.test@brand-in-a-box.space"
  },
  {
    "id": "relations_presse",
    "label": "Relations presse",
    "position": "marketing_communication_manager",
    "poles": [
      "marketing"
    ],
    "seniority": "mid",
    "email": "relations-presse.test@brand-in-a-box.space"
  },
  {
    "id": "responsable_innovation",
    "label": "Responsable innovation",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "supplier",
      "data"
    ],
    "seniority": "lead",
    "email": "responsable-innovation.test@brand-in-a-box.space"
  },
  {
    "id": "chef_projet_innovation",
    "label": "Chef de projet innovation",
    "position": "product_engineering_manager",
    "poles": [
      "product"
    ],
    "seniority": "mid",
    "email": "chef-projet-innovation.test@brand-in-a-box.space"
  },
  {
    "id": "ext_fournisseur",
    "label": "Fournisseur (externe)",
    "position": "supplier_manager",
    "poles": [
      "supplier"
    ],
    "seniority": "junior",
    "email": "ext-fournisseur.test@brand-in-a-box.space"
  },
  {
    "id": "ext_vendeur",
    "label": "Vendeur Marketplace (externe)",
    "position": "customer_success_manager",
    "poles": [
      "marketplace"
    ],
    "seniority": "junior",
    "email": "ext-vendeur.test@brand-in-a-box.space"
  },
  {
    "id": "ext_client_entreprise",
    "label": "Client entreprise",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "support"
    ],
    "seniority": "junior",
    "email": "ext-client-entreprise.test@brand-in-a-box.space"
  },
  {
    "id": "ext_client_particulier",
    "label": "Client particulier",
    "position": "customer_success_manager",
    "poles": [
      "marketplace",
      "support"
    ],
    "seniority": "junior",
    "email": "ext-client-particulier.test@brand-in-a-box.space"
  },
  {
    "id": "ext_auditeur",
    "label": "Auditeur externe",
    "position": "audit_compliance_lead",
    "poles": [
      "audit"
    ],
    "seniority": "mid",
    "email": "ext-auditeur.test@brand-in-a-box.space"
  },
  {
    "id": "ext_prestataire",
    "label": "Prestataire",
    "position": "ops_logistics_manager",
    "poles": [
      "ops"
    ],
    "seniority": "junior",
    "email": "ext-prestataire.test@brand-in-a-box.space"
  },
  {
    "id": "ext_investisseur",
    "label": "Investisseur (lecture seule)",
    "position": "ceo",
    "poles": [
      "direction",
      "finance",
      "data"
    ],
    "seniority": "executive",
    "email": "ext-investisseur.test@brand-in-a-box.space"
  },
  {
    "id": "svc_api",
    "label": "Compte API",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "junior",
    "email": "svc-api.test@brand-in-a-box.space"
  },
  {
    "id": "svc_webhook",
    "label": "Compte Webhook",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security"
    ],
    "seniority": "junior",
    "email": "svc-webhook.test@brand-in-a-box.space"
  },
  {
    "id": "svc_robot",
    "label": "Robot d’automatisation",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "ops"
    ],
    "seniority": "junior",
    "email": "svc-robot.test@brand-in-a-box.space"
  },
  {
    "id": "svc_stripe",
    "label": "Connecteur Stripe",
    "position": "finance_manager",
    "poles": [
      "finance",
      "product",
      "security"
    ],
    "seniority": "junior",
    "email": "svc-stripe.test@brand-in-a-box.space"
  },
  {
    "id": "svc_google",
    "label": "Connecteur Google Workspace",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "security",
      "rh"
    ],
    "seniority": "junior",
    "email": "svc-google.test@brand-in-a-box.space"
  },
  {
    "id": "svc_supabase",
    "label": "Connecteur Supabase",
    "position": "product_engineering_manager",
    "poles": [
      "product",
      "data",
      "security"
    ],
    "seniority": "junior",
    "email": "svc-supabase.test@brand-in-a-box.space"
  }
];
