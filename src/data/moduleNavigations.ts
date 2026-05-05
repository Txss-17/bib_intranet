import { PoleId } from '@/types';

export interface SubNavigationItem {
  id: string;
  label: string;
  labelFr: string;
  path: string;
}

export type ModuleNavigations = Record<PoleId, SubNavigationItem[]>;

export const moduleNavigations: ModuleNavigations = {
  // Direction (Executive)
  direction: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/direction' },
    { id: 'kpi', label: 'Strategic KPIs', labelFr: 'KPI stratégiques', path: '/pole/direction/kpi' },
    { id: 'alerts', label: 'Critical Alerts', labelFr: 'Alertes critiques', path: '/pole/direction/alerts' },
    { id: 'decisions', label: 'Decisions', labelFr: 'Décisions', path: '/pole/direction/decisions' },
    { id: 'access', label: 'Module Access', labelFr: 'Accès lecture modules', path: '/pole/direction/access' },
  ],

  // Finance
  finance: [
    { id: 'overview', label: 'Dashboard', labelFr: 'Dashboard', path: '/pole/finance' },
    { id: 'cashflow', label: 'Real-time Cashflow', labelFr: 'Cashflow temps réel', path: '/pole/finance/cashflow' },
    { id: 'transactions', label: 'Transactions', labelFr: 'Transactions', path: '/pole/finance/transactions' },
    { id: 'supplier-payments', label: 'Supplier Payments', labelFr: 'Paiements fournisseurs', path: '/pole/finance/supplier-payments' },
    { id: 'subscriptions', label: 'Subscriptions', labelFr: 'Abonnements', path: '/pole/finance/subscriptions' },
    { id: 'salaries', label: 'Salaries & Bonuses', labelFr: 'Salaires & Primes', path: '/pole/finance/salaries' },
    { id: 'guarantee', label: 'Guarantee Fund', labelFr: 'Fonds de garantie', path: '/pole/finance/guarantee' },
  ],

  // Ops — Control Tower
  ops: [
    { id: 'overview', label: 'Dashboard', labelFr: 'Vue globale', path: '/pole/ops' },
    { id: 'pipeline', label: 'Order Pipeline', labelFr: 'Cycle commandes', path: '/pole/ops/pipeline' },
    { id: 'stocks', label: 'Distributed Stocks', labelFr: 'Stocks distribués', path: '/pole/ops/stocks' },
    { id: 'catalog', label: 'Product Catalog', labelFr: 'Référentiel produits', path: '/pole/ops/catalog' },
    { id: 'partners', label: 'Partners', labelFr: 'Partenaires', path: '/pole/ops/partners' },
    { id: 'flows', label: 'Sync Flows', labelFr: 'Flux & sync', path: '/pole/ops/flows' },
    { id: 'incidents', label: 'Incidents', labelFr: 'Incidents', path: '/pole/ops/incidents' },
    { id: 'thresholds', label: 'Thresholds & Alerts', labelFr: 'Seuils & alertes', path: '/pole/ops/thresholds' },
    { id: 'forecast', label: 'Demand Forecast', labelFr: 'Prévision demande', path: '/pole/ops/forecast' },
    { id: 'replenishment', label: 'Replenishment', labelFr: 'Réapprovisionnement', path: '/pole/ops/replenishment' },
    { id: 'suppliers-lt', label: 'Supplier Lead Times', labelFr: 'Fournisseurs logistiques', path: '/pole/ops/suppliers-lead-times' },
    { id: 'audit-link', label: 'Audit Link', labelFr: 'Audit ↔ OPS', path: '/pole/ops/audit-link' },
  ],

  // Tech (Système de contrôle distribué)
  tech: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/tech' },
    { id: 'access', label: 'Access & Users', labelFr: 'Accès & utilisateurs', path: '/pole/tech/access' },
    { id: 'vpn', label: 'VPN / Network', labelFr: 'Réseau / VPN', path: '/pole/tech/vpn' },
    { id: 'logs', label: 'Logs & Activity', labelFr: 'Logs & activité', path: '/pole/tech/logs' },
    { id: 'deployments', label: 'Deployments', labelFr: 'Déploiements', path: '/pole/tech/deployments' },
    { id: 'environments', label: 'Environments', labelFr: 'Environnements', path: '/pole/tech/environments' },
    { id: 'security', label: 'Security', labelFr: 'Sécurité', path: '/pole/tech/security' },
    { id: 'dataflow', label: 'Data Flow', labelFr: 'Flux de données', path: '/pole/tech/dataflow' },
    { id: 'received-products', label: 'Received Products', labelFr: 'Réception produits', path: '/pole/tech/received-products' },
    { id: 'catalog', label: 'Catalog', labelFr: 'Catalogue', path: '/pole/tech/catalog' },
    { id: 'infrastructure', label: 'Infrastructure', labelFr: 'Infra', path: '/pole/tech/infrastructure' },
  ],

  // RH
  rh: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/rh' },
    { id: 'employees', label: 'Employees', labelFr: 'Employés', path: '/pole/rh/employees' },
    { id: 'files', label: 'Employee Files', labelFr: 'Dossiers employés', path: '/pole/rh/files' },
    { id: 'alerts', label: 'HR Alerts', labelFr: 'Alertes RH', path: '/pole/rh/alerts' },
    { id: 'onboarding', label: 'Onboarding', labelFr: 'Onboarding', path: '/pole/rh/onboarding' },
    { id: 'attendance', label: 'Attendance', labelFr: 'Pointage', path: '/pole/rh/attendance' },
    { id: 'leave', label: 'Leave', labelFr: 'Congés', path: '/pole/rh/leave' },
    { id: 'training', label: 'Training', labelFr: 'Formations', path: '/pole/rh/training' },
    { id: 'publications', label: 'Publications', labelFr: 'Publications internes', path: '/pole/rh/publications' },
    { id: 'ethics', label: 'Ethics & Whistleblowing', labelFr: 'Éthique & Signalements', path: '/modules/ethics' },
  ],

  // Supplier & Product
  supplier: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/supplier' },
    { id: 'portfolios', label: 'Portfolios', labelFr: 'Portefeuilles', path: '/pole/supplier/portfolios' },
    { id: 'pending', label: 'Pending Products', labelFr: 'Produits en attente', path: '/pole/supplier/pending' },
    { id: 'validated', label: 'Validated Products', labelFr: 'Produits validés', path: '/pole/supplier/validated' },
    { id: 'suppliers', label: 'Supplier Files', labelFr: 'Fiches fournisseurs', path: '/pole/supplier/suppliers' },
    { id: 'certifications', label: 'Certifications', labelFr: 'Certifications', path: '/pole/supplier/certifications' },
    { id: 'decisions', label: 'Decision History', labelFr: 'Historique décisions', path: '/pole/supplier/decisions' },
    { id: 'alerts', label: 'Quality Alerts', labelFr: 'Alertes qualité', path: '/pole/supplier/alerts' },
  ],

  // Audit
  audit: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/audit' },
    { id: 'field', label: 'Field Audits', labelFr: 'Audits terrain', path: '/pole/audit/field' },
    { id: 'supplier', label: 'Supplier Audits', labelFr: 'Audits fournisseurs', path: '/pole/audit/supplier' },
    { id: 'ops', label: 'Ops Audits', labelFr: 'Audits Ops', path: '/pole/audit/ops' },
    { id: 'reports', label: 'Reports', labelFr: 'Rapports', path: '/pole/audit/reports' },
    { id: 'nonconformities', label: 'Non-conformities', labelFr: 'Non-conformités', path: '/pole/audit/nonconformities' },
    { id: 'sanctions', label: 'Sanctions History', labelFr: 'Historique sanctions', path: '/pole/audit/sanctions' },
  ],

  // Compliance & Legal
  compliance: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/compliance' },
    { id: 'contracts', label: 'Contracts', labelFr: 'Contrats', path: '/pole/compliance/contracts' },
    { id: 'policies', label: 'Policies', labelFr: 'Politiques', path: '/pole/compliance/policies' },
    { id: 'disputes', label: 'Disputes', labelFr: 'Litiges', path: '/pole/compliance/disputes' },
    { id: 'risks', label: 'Risk Register', labelFr: 'Registre des risques', path: '/pole/compliance/risks' },
  ],

  // RSE
  rse: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/rse' },
    { id: 'packaging', label: 'Validated Packaging', labelFr: 'Packaging validés', path: '/pole/rse/packaging' },
    { id: 'packaging-lifecycle', label: 'Packaging Lifecycle', labelFr: 'Cycle de vie Packaging', path: '/pole/rse/packaging-lifecycle' },
    { id: 'recycling', label: 'Recycling Stats', labelFr: 'Recyclage (stats)', path: '/pole/rse/recycling' },
    { id: 'points', label: 'Customer Points', labelFr: 'Points clients finaux', path: '/pole/rse/points' },
    { id: 'co2', label: 'CO₂ Impact', labelFr: 'Impact CO₂', path: '/pole/rse/co2' },
    { id: 'esg', label: 'ESG Reports', labelFr: 'Rapports ESG', path: '/pole/rse/esg' },
  ],

  // Marketing & Media
  marketing: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/marketing' },
    { id: 'campaigns', label: 'Campaigns', labelFr: 'Campagnes', path: '/pole/marketing/campaigns' },
    { id: 'content', label: 'Content', labelFr: 'Contenu', path: '/pole/marketing/content' },
    { id: 'podcasts', label: 'Podcasts', labelFr: 'Podcasts', path: '/pole/marketing/podcasts' },
    { id: 'analytics', label: 'Analytics', labelFr: 'Analytiques', path: '/pole/marketing/analytics' },
  ],

  // Risk & Incidents (module retiré)
  risk: [],

  // User & Supplier Lifecycle (Pole 12)
  lifecycle: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/pole/lifecycle' },
    { id: 'onboarding', label: 'Onboarding', labelFr: 'Onboarding', path: '/pole/lifecycle/onboarding' },
    { id: 'monitoring', label: 'Activity Monitoring', labelFr: 'Suivi activité', path: '/pole/lifecycle/monitoring' },
    { id: 'compliance', label: 'Compliance Status', labelFr: 'Statut conformité', path: '/pole/lifecycle/compliance' },
    { id: 'scoring', label: 'Risk Scoring', labelFr: 'Scoring risque', path: '/pole/lifecycle/scoring' },
    { id: 'support', label: 'Support Tickets', labelFr: 'Tickets support', path: '/pole/lifecycle/support' },
  ],

  // R&D (Pole 13)
  rd: [
    { id: 'overview', label: 'Dashboard', labelFr: 'Dashboard', path: '/pole/rd' },
    { id: 'products', label: 'Product Analysis', labelFr: 'Analyse Produits', path: '/pole/rd/products' },
    { id: 'shops', label: 'Shop Analysis', labelFr: 'Analyse Boutiques', path: '/pole/rd/shops' },
    { id: 'suppliers', label: 'Supplier Analysis', labelFr: 'Analyse Fournisseurs', path: '/pole/rd/suppliers' },
    { id: 'frictions', label: 'System Frictions', labelFr: 'Frictions Système', path: '/pole/rd/frictions' },
    { id: 'reports', label: 'Reports & Recommendations', labelFr: 'Rapports & Recommandations', path: '/pole/rd/reports' },
  ],
};

export const getModuleNavigation = (poleId: PoleId): SubNavigationItem[] => {
  return moduleNavigations[poleId] || [];
};

// Transversal modules navigation (Ethics, Gateway, etc.)
export const transversalNavigations: Record<string, SubNavigationItem[]> = {
  ethics: [
    { id: 'report', label: 'Report', labelFr: 'Faire un signalement', path: '/modules/ethics' },
    { id: 'dashboard', label: 'Dashboard', labelFr: 'Vue référents', path: '/modules/ethics/dashboard' },
    { id: 'received', label: 'Received Reports', labelFr: 'Signalements reçus', path: '/modules/ethics/received' },
    { id: 'ongoing', label: 'Ongoing Cases', labelFr: 'Dossiers en cours', path: '/modules/ethics/ongoing' },
    { id: 'closed', label: 'Closed Cases', labelFr: 'Clôturés', path: '/modules/ethics/closed' },
    { id: 'stats', label: 'Anonymous Stats', labelFr: 'Statistiques anonymisées', path: '/modules/ethics/stats' },
  ],
  gateway: [
    { id: 'overview', label: 'Overview', labelFr: 'Vue globale', path: '/modules/gateway' },
    { id: 'inbox', label: 'Inbox', labelFr: 'Réception', path: '/modules/gateway/inbox' },
    { id: 'compose', label: 'Compose', labelFr: 'Composer & envoyer', path: '/modules/gateway/compose' },
    { id: 'validation', label: 'Validation', labelFr: 'Validation', path: '/modules/gateway/validation' },
    { id: 'routing', label: 'Routing', labelFr: 'Routage', path: '/modules/gateway/routing' },
    { id: 'responses', label: 'Responses', labelFr: 'Réponses', path: '/modules/gateway/responses' },
    { id: 'journal', label: 'Journal', labelFr: 'Traçabilité', path: '/modules/gateway/journal' },
  ],
};
