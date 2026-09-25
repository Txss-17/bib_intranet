import type { LucideIcon } from 'lucide-react';

export interface ModuleNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  description?: string;
  badge?: string;
}

export interface ModuleNavigation {
  id: string;
  label: string;
  description: string;
  items: ModuleNavigationItem[];
}

/**
 * Navigation principale BIB.
 *
 * Architecture cible :
 *
 * 1. Direction
 * 2. Finance
 * 3. Opérations & Logistique
 * 4. Fournisseurs & Produits
 * 5. Marketplace & Customer
 * 6. Support & Customer Success
 * 7. Marketing & Communication
 * 8. RH
 * 9. Qualité & Audit
 * 10. Conformité & Juridique
 * 11. RSE & Impact
 * 12. Produit & Engineering
 * 13. Data & BI
 * 14. Security & IT
 *
 * Les anciennes structures Tech, Lifecycle, R&D et Risk
 * ne sont plus des pôles de navigation.
 */
export const moduleNavigations: Record<
  string,
  ModuleNavigation
> = {
  direction: {
    id: 'direction',
    label: 'Direction',
    description:
      'Pilotage stratégique et gouvernance',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/direction',
        icon: 'LayoutDashboard',
      },
      {
        id: 'strategy',
        label: 'Stratégie & KPIs',
        path: '/pole/direction/strategic-kpis',
        icon: 'Target',
      },
      {
        id: 'alerts',
        label: 'Alertes critiques',
        path: '/pole/direction/critical-alerts',
        icon: 'AlertTriangle',
      },
      {
        id: 'arbitrage',
        label: 'Arbitrages',
        path: '/pole/direction/decision-arbitrage',
        icon: 'Scale',
      },
      {
        id: 'roadmap',
        label: 'Vision & Roadmap',
        path: '/pole/direction/vision-roadmap',
        icon: 'Map',
      },
      {
        id: 'governance',
        label: 'Gouvernance',
        path: '/pole/direction/group-governance',
        icon: 'Building2',
      },
      {
        id: 'reports',
        label: 'Rapports de direction',
        path: '/pole/direction/board-reports',
        icon: 'FileText',
      },
    ],
  },

  finance: {
    id: 'finance',
    label: 'Finance',
    description:
      'Pilotage financier, paiements et facturation',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/finance',
        icon: 'LayoutDashboard',
      },
      {
        id: 'cashflow',
        label: 'Trésorerie',
        path: '/pole/finance/cashflow',
        icon: 'Landmark',
      },
      {
        id: 'transactions',
        label: 'Transactions',
        path: '/pole/finance/transactions',
        icon: 'ArrowLeftRight',
      },
      {
        id: 'billing',
        label: 'Facturation',
        path: '/pole/finance/billing',
        icon: 'Receipt',
      },
      {
        id: 'payouts',
        label: 'Paiements partenaires',
        path: '/pole/finance/payouts',
        icon: 'WalletCards',
      },
      {
        id: 'reconciliation',
        label: 'Rapprochement',
        path: '/pole/finance/reconciliation',
        icon: 'GitCompare',
      },
      {
        id: 'subscriptions',
        label: 'Abonnements',
        path: '/pole/finance/subscriptions',
        icon: 'CreditCard',
      },
      {
        id: 'cards',
        label: 'Cartes',
        path: '/pole/finance/cards',
        icon: 'CreditCard',
      },
      {
        id: 'guarantee',
        label: 'Fonds de garantie',
        path: '/pole/finance/guarantee',
        icon: 'ShieldCheck',
      },
    ],
  },

  ops: {
    id: 'ops',
    label: 'Opérations & Logistique',
    description:
      'Commandes, stocks, expéditions et partenaires',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/ops',
        icon: 'LayoutDashboard',
      },
      {
        id: 'shops',
        label: 'Boutiques & Marchands',
        path: '/pole/ops/shops',
        icon: 'Store',
      },
      {
        id: 'anomalies',
        label: 'Anomalies',
        path: '/pole/ops/anomalies',
        icon: 'AlertTriangle',
      },
      {
        id: 'orders',
        label: 'Commandes',
        path: '/pole/ops/pipeline',
        icon: 'ShoppingBag',
      },

      {
        id: 'shipments',
        label: 'Expéditions',
        path: '/pole/ops/shipments',
        icon: 'Truck',
      },
      {
        id: 'stocks',
        label: 'Stocks',
        path: '/pole/ops/stocks',
        icon: 'Boxes',
      },
      {
        id: 'partners',
        label: 'Partenaires logistiques',
        path: '/pole/ops/partners',
        icon: 'Handshake',
      },
      {
        id: 'flows',
        label: 'Flux & synchronisations',
        path: '/pole/ops/flows',
        icon: 'RefreshCw',
      },
      {
        id: 'incidents',
        label: 'Incidents logistiques',
        path: '/pole/ops/incidents',
        icon: 'AlertTriangle',
      },
      {
        id: 'thresholds',
        label: 'Seuils de stock',
        path: '/pole/ops/thresholds',
        icon: 'Gauge',
      },
      {
        id: 'forecast',
        label: 'Prévisions',
        path: '/pole/ops/forecast',
        icon: 'TrendingUp',
      },
      {
        id: 'replenishment',
        label: 'Réapprovisionnement',
        path: '/pole/ops/replenishment',
        icon: 'PackagePlus',
      },
      {
        id: 'supplier-lead-times',
        label: 'Délais fournisseurs',
        path: '/pole/ops/suppliers-lt',
        icon: 'Timer',
      },
    ],
  },

  supplier: {
    id: 'supplier',
    label: 'Fournisseurs & Produits',
    description:
      'Qualification, produits, catalogues et certifications',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/supplier',
        icon: 'LayoutDashboard',
      },
      {
        id: 'applications',
        label: 'Candidatures',
        path: '/pole/supplier/applications',
        icon: 'ClipboardList',
      },
      {
        id: 'catalog-inbox',
        label: 'Catalogue à contrôler',
        path: '/pole/supplier/catalog-inbox',
        icon: 'Inbox',
      },
      {
        id: 'pending-products',
        label: 'Produits en attente',
        path: '/pole/supplier/pending',
        icon: 'Clock3',
      },
      {
        id: 'validated-products',
        label: 'Produits validés',
        path: '/pole/supplier/validated',
        icon: 'BadgeCheck',
      },
      {
        id: 'portfolios',
        label: 'Portefeuilles',
        path: '/pole/supplier/portfolios',
        icon: 'PackageOpen',
      },
      {
        id: 'certifications',
        label: 'Certifications',
        path: '/pole/supplier/certifications',
        icon: 'FileCheck',
      },
      {
        id: 'decisions',
        label: 'Historique des décisions',
        path: '/pole/supplier/decisions',
        icon: 'History',
      },
      {
        id: 'restock',
        label: 'Réapprovisionnement',
        path: '/pole/supplier/restock-orders',
        icon: 'PackagePlus',
      },
    ],
  },

  marketplace: {
    id: 'marketplace',
    label: 'Marketplace & Customer',
    description:
      'Marketplace, boutiques, clients et engagement',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/marketplace',
        icon: 'LayoutDashboard',
      },
      {
        id: 'stores',
        label: 'Boutiques',
        path: '/pole/marketplace/stores',
        icon: 'Store',
      },
      {
        id: 'products',
        label: 'Produits',
        path: '/pole/marketplace/products',
        icon: 'Package',
      },
      {
        id: 'customers',
        label: 'Clients',
        path: '/pole/marketplace/customers',
        icon: 'Users',
      },
      {
        id: 'orders',
        label: 'Commandes',
        path: '/pole/marketplace/orders',
        icon: 'ShoppingBag',
      },
      {
        id: 'subscriptions',
        label: 'Abonnés BIB',
        path: '/pole/marketplace/subscribers',
        icon: 'BadgeCheck',
      },
      {
        id: 'favorites',
        label: 'Favoris & suivi',
        path: '/pole/marketplace/favorites',
        icon: 'Heart',
      },
      {
        id: 'rewards',
        label: 'Points & récompenses',
        path: '/pole/marketplace/rewards',
        icon: 'Gift',
      },
      {
        id: 'recycling',
        label: 'Recyclage client',
        path: '/pole/marketplace/recycling',
        icon: 'Recycle',
      },
    ],
  },

  support: {
    id: 'support',
    label: 'Support & Customer Success',
    description:
      'Support, accompagnement et qualité de l’expérience',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/support',
        icon: 'LayoutDashboard',
      },
      {
        id: 'tickets',
        label: 'Tickets',
        path: '/pole/support/tickets',
        icon: 'Ticket',
      },
      {
        id: 'customer-success',
        label: 'Customer Success',
        path: '/pole/support/customer-success',
        icon: 'HeartHandshake',
      },
      {
        id: 'monitoring',
        label: 'Suivi clients',
        path: '/pole/support/monitoring',
        icon: 'Activity',
      },
      {
        id: 'escalations',
        label: 'Escalades',
        path: '/pole/support/escalations',
        icon: 'ArrowUpCircle',
      },
    ],
  },

  marketing: {
    id: 'marketing',
    label: 'Marketing & Communication',
    description:
      'Marque, contenu, campagnes, CRM et réputation',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/marketing',
        icon: 'LayoutDashboard',
      },
      {
        id: 'campaigns',
        label: 'Campagnes',
        path: '/pole/marketing/campaigns',
        icon: 'Megaphone',
      },
      {
        id: 'content',
        label: 'Contenus',
        path: '/pole/marketing/content',
        icon: 'FileText',
      },
      {
        id: 'crm',
        label: 'CRM',
        path: '/pole/marketing/crm',
        icon: 'UsersRound',
      },
      {
        id: 'journeys',
        label: 'Parcours & automatisations',
        path: '/pole/marketing/journeys',
        icon: 'Route',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/pole/marketing/analytics',
        icon: 'BarChart3',
      },
      {
        id: 'reputation',
        label: 'Réputation',
        path: '/pole/marketing/reputation',
        icon: 'Star',
      },
    ],
  },

  rh: {
    id: 'rh',
    label: 'Ressources Humaines',
    description:
      'Collaborateurs, recrutement et développement',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/rh',
        icon: 'LayoutDashboard',
      },
      {
        id: 'employees',
        label: 'Collaborateurs',
        path: '/pole/rh/employees',
        icon: 'Users',
      },
      {
        id: 'recruitment',
        label: 'Recrutement',
        path: '/pole/rh/recruitment',
        icon: 'UserPlus',
      },
      {
        id: 'files',
        label: 'Dossiers collaborateurs',
        path: '/pole/rh/files',
        icon: 'FolderOpen',
      },
      {
        id: 'onboarding',
        label: 'Onboarding RH — intégration collaborateur',
        path: '/pole/rh/onboarding',
        icon: 'DoorOpen',
      },
      {
        id: 'attendance',
        label: 'Présences',
        path: '/pole/rh/attendance',
        icon: 'CalendarCheck',
      },
      {
        id: 'leave',
        label: 'Congés',
        path: '/pole/rh/leave',
        icon: 'CalendarDays',
      },
      {
        id: 'training',
        label: 'Formation',
        path: '/pole/rh/training',
        icon: 'GraduationCap',
      },
      {
        id: 'trips',
        label: 'Déplacements',
        path: '/pole/rh/trips',
        icon: 'Plane',
      },
      {
        id: 'alerts',
        label: 'Alertes RH',
        path: '/pole/rh/alerts',
        icon: 'AlertTriangle',
      },
    ],
  },

  audit: {
    id: 'audit',
    label: 'Qualité & Audit',
    description:
      'Audits, contrôles, non-conformités et actions correctives',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/audit',
        icon: 'LayoutDashboard',
      },
      {
        id: 'field',
        label: 'Audits terrain',
        path: '/pole/audit/field',
        icon: 'MapPinCheck',
      },
      {
        id: 'supplier',
        label: 'Audits fournisseurs',
        path: '/pole/audit/supplier',
        icon: 'Factory',
      },
      {
        id: 'operations',
        label: 'Audits opérations',
        path: '/pole/audit/ops',
        icon: 'ClipboardCheck',
      },
      {
        id: 'reports',
        label: 'Rapports',
        path: '/pole/audit/reports',
        icon: 'FileText',
      },
      {
        id: 'nonconformities',
        label: 'Non-conformités',
        path: '/pole/audit/nonconformities',
        icon: 'TriangleAlert',
      },
      {
        id: 'corrective-actions',
        label: 'Actions correctives',
        path: '/pole/audit/corrective-actions',
        icon: 'CheckCircle2',
      },
      {
        id: 'sanctions',
        label: 'Sanctions',
        path: '/pole/audit/sanctions',
        icon: 'Ban',
      },
    ],
  },

  compliance: {
    id: 'compliance',
    label: 'Conformité & Juridique',
    description:
      'Cadre juridique, contrats et conformité',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/compliance',
        icon: 'LayoutDashboard',
      },
      {
        id: 'contracts',
        label: 'Contrats',
        path: '/pole/compliance/contracts',
        icon: 'FileSignature',
      },
      {
        id: 'policies',
        label: 'Politiques',
        path: '/pole/compliance/policies',
        icon: 'ScrollText',
      },
      {
        id: 'disputes',
        label: 'Litiges',
        path: '/pole/compliance/disputes',
        icon: 'Gavel',
      },
      {
        id: 'risks',
        label: 'Registre des risques',
        path: '/pole/compliance/risks',
        icon: 'ShieldAlert',
      },
    ],
  },

  rse: {
    id: 'rse',
    label: 'RSE & Impact',
    description:
      'Recyclage, emballages, environnement et ESG',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/rse',
        icon: 'LayoutDashboard',
      },
      {
        id: 'packaging',
        label: 'Emballages',
        path: '/pole/rse/packaging',
        icon: 'Package',
      },
      {
        id: 'recycling',
        label: 'Recyclage',
        path: '/pole/rse/recycling',
        icon: 'Recycle',
      },
      {
        id: 'co2',
        label: 'Impact CO₂',
        path: '/pole/rse/co2',
        icon: 'Cloud',
      },
      {
        id: 'esg',
        label: 'Reporting ESG',
        path: '/pole/rse/esg',
        icon: 'BarChart3',
      },
    ],
  },

  product: {
    id: 'product',
    label: 'Produit & Engineering',
    description:
      'Produit, développement, plateforme et innovation',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/product',
        icon: 'LayoutDashboard',
      },
      {
        id: 'product',
        label: 'Produit',
        path: '/pole/product/product',
        icon: 'Boxes',
      },
      {
        id: 'roadmap',
        label: 'Roadmap produit',
        path: '/pole/product/roadmap',
        icon: 'Map',
      },
      {
        id: 'backlog',
        label: 'Backlog',
        path: '/pole/product/backlog',
        icon: 'ListTodo',
      },
      {
        id: 'engineering',
        label: 'Engineering',
        path: '/pole/product/engineering',
        icon: 'Code2',
      },
      {
        id: 'studio',
        label: 'Studio',
        path: '/pole/product/studio',
        icon: 'PanelsTopLeft',
      },
      {
        id: 'integrations',
        label: 'Intégrations',
        path: '/pole/product/integrations',
        icon: 'Cable',
      },
      {
        id: 'documentation',
        label: 'Documentation',
        path: '/pole/product/documentation',
        icon: 'BookOpen',
      },
      {
        id: 'innovation',
        label: 'Innovation & R&D',
        path: '/pole/product/innovation',
        icon: 'FlaskConical',
      },
    ],
  },

  data: {
    id: 'data',
    label: 'Data & BI',
    description:
      'Données, KPI, BI et gouvernance de la donnée',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/data',
        icon: 'LayoutDashboard',
      },
      {
        id: 'kpi',
        label: 'Catalogue KPI',
        path: '/pole/data/kpi',
        icon: 'Gauge',
      },
      {
        id: 'reports',
        label: 'Rapports',
        path: '/pole/data/reports',
        icon: 'FileBarChart',
      },
      {
        id: 'bi',
        label: 'Business Intelligence',
        path: '/pole/data/bi',
        icon: 'BarChart3',
      },
      {
        id: 'requests',
        label: 'Demandes Data',
        path: '/pole/data/requests',
        icon: 'Inbox',
      },
      {
        id: 'versions',
        label: 'Versions & gouvernance',
        path: '/pole/data/versions',
        icon: 'GitBranch',
      },
    ],
  },

  security: {
    id: 'security',
    label: 'Security & IT',
    description:
      'Sécurité, accès, infrastructure et systèmes IT',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/pole/security',
        icon: 'LayoutDashboard',
      },
      {
        id: 'access',
        label: 'Accès & identités',
        path: '/pole/security/access',
        icon: 'KeyRound',
      },
      {
        id: 'security',
        label: 'Sécurité',
        path: '/pole/security/security',
        icon: 'ShieldCheck',
      },
      {
        id: 'infrastructure',
        label: 'Infrastructure',
        path: '/pole/security/infrastructure',
        icon: 'Server',
      },
      {
        id: 'environments',
        label: 'Environnements',
        path: '/pole/security/environments',
        icon: 'Layers3',
      },
      {
        id: 'vpn',
        label: 'VPN',
        path: '/pole/security/vpn',
        icon: 'Shield',
      },
      {
        id: 'logs',
        label: 'Logs & supervision',
        path: '/pole/security/logs',
        icon: 'ScrollText',
      },
    ],
  },
};

/**
 * Modules transversaux BIB.
 *
 * Ils ne dépendent pas d’un pôle métier unique.
 */
export const transversalNavigations: Record<
  string,
  ModuleNavigation
> = {
  work: {
    id: 'work',
    label: 'Travail',
    description:
      'Tâches, projets, processus et activités',
    items: [
      {
        id: 'tasks',
        label: 'Tâches',
        path: '/work/tasks',
        icon: 'ListTodo',
      },
      {
        id: 'projects',
        label: 'Projets',
        path: '/work/projects',
        icon: 'FolderKanban',
      },
      {
        id: 'processes',
        label: 'Processus',
        path: '/work/processes',
        icon: 'Workflow',
      },
      {
        id: 'validations',
        label: 'Validations',
        path: '/work/validations',
        icon: 'CheckCheck',
      },
      {
        id: 'escalations',
        label: 'Escalades',
        path: '/work/escalations',
        icon: 'ArrowUpCircle',
      },
      {
        id: 'activities',
        label: 'Activités',
        path: '/work/activities',
        icon: 'Activity',
      },
    ],
  },

  notifications: {
    id: 'notifications',
    label: 'Notifications',
    description:
      'Alertes et notifications système',
    items: [
      {
        id: 'all',
        label: 'Toutes les notifications',
        path: '/notifications',
        icon: 'Bell',
      },
    ],
  },

  gateway: {
    id: 'gateway',
    label: 'Gateway & Messages',
    description:
      'Centre opérationnel des communications',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/modules/gateway',
        icon: 'Inbox',
      },
      {
        id: 'inbox',
        label: 'Boîte de réception',
        path: '/modules/gateway/inbox',
        icon: 'Inbox',
      },
      {
        id: 'compose',
        label: 'Nouveau message',
        path: '/modules/gateway/compose',
        icon: 'PenLine',
      },
      {
        id: 'routing',
        label: 'Routage',
        path: '/modules/gateway/routing',
        icon: 'GitBranch',
      },
      {
        id: 'validation',
        label: 'Validations',
        path: '/modules/gateway/validation',
        icon: 'CheckCheck',
      },
      {
        id: 'responses',
        label: 'Réponses',
        path: '/modules/gateway/responses',
        icon: 'Reply',
      },
      {
        id: 'journal',
        label: 'Journal',
        path: '/modules/gateway/journal',
        icon: 'History',
      },
    ],
  },

  documents: {
    id: 'documents',
    label: 'Documents',
    description:
      'Documents et pièces liés aux activités BIB',
    items: [
      {
        id: 'all',
        label: 'Tous les documents',
        path: '/documents',
        icon: 'Files',
      },
    ],
  },

  feed: {
    id: 'feed',
    label: 'Fil interne',
    description:
      'Informations et communications internes',
    items: [
      {
        id: 'all',
        label: 'Fil interne',
        path: '/feed',
        icon: 'Rss',
      },
    ],
  },

  ethics: {
    id: 'ethics',
    label: 'Éthique & Signalements',
    description:
      'Signalements éthiques et traitement confidentiel',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/modules/ethics',
        icon: 'ShieldAlert',
      },
      {
        id: 'report',
        label: 'Nouveau signalement',
        path: '/modules/ethics/report',
        icon: 'Flag',
      },
      {
        id: 'received',
        label: 'Signalements reçus',
        path: '/modules/ethics/received',
        icon: 'Inbox',
      },
      {
        id: 'ongoing',
        label: 'En cours',
        path: '/modules/ethics/ongoing',
        icon: 'Clock3',
      },
      {
        id: 'closed',
        label: 'Clôturés',
        path: '/modules/ethics/closed',
        icon: 'ArchiveCheck',
      },
      {
        id: 'stats',
        label: 'Statistiques',
        path: '/modules/ethics/stats',
        icon: 'BarChart3',
      },
    ],
  },

  independentAudit: {
    id: 'independent-audit',
    label: 'Audit indépendant',
    description:
      'Déclarations et suivi des incidents soumis à audit',
    items: [
      {
        id: 'overview',
        label: 'Vue d’ensemble',
        path: '/modules/independent-audit',
        icon: 'Scale',
      },
      {
        id: 'incident',
        label: 'Déclarer un incident',
        path: '/modules/independent-audit/incident',
        icon: 'TriangleAlert',
      },
      {
        id: 'resolution',
        label: 'Suivi des résolutions',
        path: '/modules/independent-audit/resolution',
        icon: 'CheckCircle2',
      },
    ],
  },

  permissions: {
    id: 'permissions',
    label: 'Rôles & Permissions',
    description:
      'Gestion des rôles, droits et périmètres d’accès',
    items: [
      {
        id: 'roles',
        label: 'Rôles & permissions',
        path: '/admin/roles-permissions',
        icon: 'ShieldCheck',
      },
    ],
  },
};

export default moduleNavigations;

export const getModuleNavigation = (poleId: string): (ModuleNavigationItem & { labelFr?: string })[] =>
  (moduleNavigations[poleId]?.items ?? []).map((i) => ({ ...i, labelFr: i.label }));
