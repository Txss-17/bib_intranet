 /**
  * Jeux de données fictifs de la Sandbox.
  *
  * Ces données ne sont JAMAIS écrites en base :
  * elles sont générées à la demande et conservées uniquement
  * dans le stockage local de la Sandbox.
  *
  * La Production ne contient que structure, configuration
  * et paramètres.
  */

export type SandboxDomain =
  | 'orders'
  | 'suppliers'
  | 'products'
  | 'stocks'
  | 'shipments'
  | 'invoices'
  | 'payments'
  | 'salaries'
  | 'audits'
  | 'nonconformities'
  | 'kpis'
  | 'publications'
  | 'employees'
  | 'leaves'
  | 'trips'
  | 'logs'
  | 'deployments'
  | 'securityAlerts'
  | 'customers'
  | 'tickets';

export interface SandboxRecord {
  id: string;
  [key: string]: unknown;
}

/**
 * Domaines associés à chaque espace Sandbox.
 *
 * Architecture cible :
 *
 * Product & Engineering
 * → logs
 * → deployments
 *
 * Security & IT
 * → securityAlerts
 */
const SPACE_DOMAINS: Record<
  string,
  SandboxDomain[]
> = {
  finance: [
    'invoices',
    'payments',
    'salaries',
  ],

  audit: [
    'audits',
    'nonconformities',
  ],

  data: [
    'kpis',
    'publications',
  ],

  rh: [
    'employees',
    'leaves',
    'trips',
  ],

  supplier: [
    'suppliers',
    'products',
    'stocks',
  ],

  product: [
    'logs',
    'deployments',
  ],

  security: [
    'securityAlerts',
  ],

  marketplace: [
    'orders',
    'customers',
    'tickets',
    'shipments',
  ],
};

export const domainsForSpace = (
  space: string,
): SandboxDomain[] =>
  SPACE_DOMAINS[space] ?? [];

export const DOMAIN_LABELS: Record<
  SandboxDomain,
  string
> = {
  orders: 'Commandes',

  suppliers: 'Fournisseurs',

  products: 'Produits',

  stocks: 'Stocks',

  shipments: 'Expéditions',

  invoices: 'Factures',

  payments: 'Paiements',

  salaries: 'Salaires',

  audits: 'Audits',

  nonconformities: 'Non-conformités',

  kpis: 'KPI',

  publications: 'Publications',

  employees: 'Collaborateurs',

  leaves: 'Congés',

  trips: 'Déplacements',

  logs: 'Logs Engineering',

  deployments: 'Déploiements',

  securityAlerts: 'Alertes sécurité',

  customers: 'Clients',

  tickets: 'Tickets support',
};

const FAKE_COMPANIES = [
  'Nordica Test SAS',
  'Iberia Demo SL',
  'Alpes Fictif SARL',
  'Baltic Mock AB',
  'Rhone Sample SA',
];

const FAKE_PEOPLE = [
  'Alex Témoin',
  'Nora Fictive',
  'Sam Démo',
  'Lina Essai',
  'Théo Simulé',
  'Maya Sandbox',
];

const FAKE_PRODUCTS = [
  'Coffret Test 500g',
  'Kit Démo Premium',
  'Recharge Fictive',
  'Pack Simulation',
  'Édition Essai',
];

const REGIONS = [
  'Nord',
  'Sud',
  'Paris',
  'Iberia',
  'Baltique',
];

const CITIES = [
  'Lille',
  'Lyon',
  'Paris',
  'Madrid',
  'Riga',
];

const rand = <T,>(
  array: T[],
  index: number,
): T => array[index % array.length];

const num = (
  min: number,
  max: number,
) =>
  Math.round(
    (min + Math.random() * (max - min)) * 100,
  ) / 100;

const daysAgo = (days: number) =>
  new Date(
    Date.now() - days * 86_400_000,
  ).toISOString();

const id = () =>
  `sbx_${crypto.randomUUID()}`;

const BUILDERS: Record<
  SandboxDomain,
  (index: number) => SandboxRecord
> = {
  orders: (index) => ({
    id: id(),

    order_number:
      `SBX-${1000 + index}`,

    region: rand(
      REGIONS,
      index,
    ),

    status: rand(
      [
        'pending',
        'processing',
        'shipped',
        'delivered',
      ],
      index,
    ),

    total_amount: num(
      45,
      890,
    ),

    currency: 'EUR',

    customer: rand(
      FAKE_COMPANIES,
      index,
    ),

    ordered_at: daysAgo(
      index % 45,
    ),
  }),

  shipments: (index) => ({
    id: id(),

    tracking_number:
      `SBXTRK${20000 + index}`,

    carrier: rand(
      [
        'DemoExpress',
        'TestPost',
        'MockFret',
      ],
      index,
    ),

    status: rand(
      [
        'label_created',
        'in_transit',
        'delivered',
      ],
      index,
    ),

    destination: rand(
      CITIES,
      index,
    ),

    shipped_at: daysAgo(
      index % 30,
    ),
  }),

  suppliers: (index) => ({
    id: id(),

    name: rand(
      FAKE_COMPANIES,
      index,
    ),

    country: rand(
      [
        'FR',
        'ES',
        'LV',
        'IT',
      ],
      index,
    ),

    status: rand(
      [
        'active',
        'pending',
        'suspended',
      ],
      index,
    ),

    score: Math.floor(
      num(55, 98),
    ),

    contact_email:
      `contact${index}@sandbox.invalid`,

    created_at: daysAgo(
      index % 200,
    ),
  }),

  products: (index) => ({
    id: id(),

    name: rand(
      FAKE_PRODUCTS,
      index,
    ),

    sku:
      `SBX-SKU-${100 + index}`,

    unit_price: num(
      4,
      42,
    ),

    selling_price:
      num(4, 42) * 1.2,

    status: rand(
      [
        'draft',
        'validated',
        'rejected',
      ],
      index,
    ),

    category: rand(
      [
        'épicerie',
        'boisson',
        'hygiène',
      ],
      index,
    ),
  }),

  stocks: (index) => ({
    id: id(),

    sku:
      `SBX-SKU-${100 + index}`,

    warehouse: rand(
      CITIES,
      index,
    ),

    quantity: Math.floor(
      num(0, 420),
    ),

    min_threshold: 25,

    ideal_stock: 200,
  }),

  invoices: (index) => ({
    id: id(),

    reference:
      `SBX-INV-${500 + index}`,

    supplier: rand(
      FAKE_COMPANIES,
      index,
    ),

    amount: num(
      120,
      9800,
    ),

    currency: 'EUR',

    status: rand(
      [
        'draft',
        'pending',
        'paid',
        'overdue',
      ],
      index,
    ),

    due_date: daysAgo(
      -(index % 30),
    ),
  }),

  payments: (index) => ({
    id: id(),

    reference:
      `SBX-PAY-${700 + index}`,

    beneficiary: rand(
      FAKE_COMPANIES,
      index,
    ),

    amount: num(
      80,
      5400,
    ),

    method: rand(
      [
        'transfer',
        'card',
        'sepa',
      ],
      index,
    ),

    status: rand(
      [
        'scheduled',
        'executed',
        'failed',
      ],
      index,
    ),

    executed_at: daysAgo(
      index % 60,
    ),
  }),

  salaries: (index) => ({
    id: id(),

    employee: rand(
      FAKE_PEOPLE,
      index,
    ),

    gross_monthly: num(
      2100,
      6800,
    ),

    department: rand(
      [
        'ops',
        'finance',
        'product',
        'security',
        'rh',
      ],
      index,
    ),

    period:
      `2026-${String(
        (index % 12) + 1,
      ).padStart(2, '0')}`,
  }),

  audits: (index) => ({
    id: id(),

    reference:
      `SBX-AUD-${300 + index}`,

    target: rand(
      FAKE_COMPANIES,
      index,
    ),

    type: rand(
      [
        'field',
        'supplier',
        'ops',
      ],
      index,
    ),

    status: rand(
      [
        'planned',
        'in_progress',
        'completed',
      ],
      index,
    ),

    score: Math.floor(
      num(48, 99),
    ),

    scheduled_at: daysAgo(
      -(index % 21),
    ),
  }),

  nonconformities: (index) => ({
    id: id(),

    reference:
      `SBX-NC-${400 + index}`,

    severity: rand(
      [
        'low',
        'medium',
        'high',
        'critical',
      ],
      index,
    ),

    status: rand(
      [
        'open',
        'in_progress',
        'closed',
      ],
      index,
    ),

    description:
      'Écart constaté en simulation',

    detected_at: daysAgo(
      index % 40,
    ),
  }),

  kpis: (index) => ({
    id: id(),

    code:
      `SBX_KPI_${index + 1}`,

    name:
      `KPI simulé ${index + 1}`,

    unit: rand(
      [
        '%',
        '€',
        'j',
        'u',
      ],
      index,
    ),

    value: num(
      1,
      100,
    ),

    target: num(
      50,
      120,
    ),

    owner_pole: rand(
      [
        'ops',
        'finance',
        'data',
      ],
      index,
    ),
  }),

  publications: (index) => ({
    id: id(),

    title:
      `Publication de test ${index + 1}`,

    status: rand(
      [
        'draft',
        'review',
        'published',
      ],
      index,
    ),

    visibility_scope: rand(
      [
        'company',
        'pole',
      ],
      index,
    ),

    published_at: daysAgo(
      index % 50,
    ),
  }),

  employees: (index) => ({
    id: id(),

    full_name: rand(
      FAKE_PEOPLE,
      index,
    ),

    email:
      `demo${index}@sandbox.invalid`,

    position: rand(
      [
        'ops_logistics_manager',
        'finance_manager',
        'supplier_manager',
        'customer_success_manager',
        'audit_compliance_lead',
        'rse_impact_manager',
        'product_engineering_manager',
        'marketing_communication_manager',
        'rh_manager',
        'data_bi_manager',
        'security_it_manager',
      ],
      index,
    ),

    seniority: rand(
      [
        'junior',
        'mid',
        'senior',
      ],
      index,
    ),

    hired_at: daysAgo(
      200 + index * 12,
    ),
  }),

  leaves: (index) => ({
    id: id(),

    employee: rand(
      FAKE_PEOPLE,
      index,
    ),

    type: rand(
      [
        'paid',
        'sick',
        'unpaid',
      ],
      index,
    ),

    status: rand(
      [
        'pending',
        'approved',
        'refused',
      ],
      index,
    ),

    days: Math.floor(
      num(1, 12),
    ),

    start_at: daysAgo(
      -(index % 25),
    ),
  }),

  trips: (index) => ({
    id: id(),

    employee: rand(
      FAKE_PEOPLE,
      index,
    ),

    destination: rand(
      CITIES,
      index,
    ),

    budget: num(
      220,
      2400,
    ),

    status: rand(
      [
        'submitted',
        'approved',
        'refused',
        'completed',
      ],
      index,
    ),

    departure_at: daysAgo(
      -(index % 35),
    ),
  }),

  logs: (index) => ({
    id: id(),

    level: rand(
      [
        'info',
        'warn',
        'error',
      ],
      index,
    ),

    source: rand(
      [
        'api',
        'worker',
        'edge',
      ],
      index,
    ),

    message:
      `Événement Engineering simulé #${index + 1}`,

    at: daysAgo(
      index % 7,
    ),
  }),

  deployments: (index) => ({
    id: id(),

    version:
      `v1.${index}.0`,

    environment: rand(
      [
        'dev',
        'staging',
        'production',
      ],
      index,
    ),

    status: rand(
      [
        'success',
        'failed',
        'rolled_back',
      ],
      index,
    ),

    deployed_at: daysAgo(
      index % 30,
    ),
  }),

  securityAlerts: (index) => ({
    id: id(),

    title:
      `Alerte sécurité simulée ${index + 1}`,

    severity: rand(
      [
        'low',
        'medium',
        'high',
        'critical',
      ],
      index,
    ),

    status: rand(
      [
        'open',
        'investigating',
        'resolved',
      ],
      index,
    ),

    detected_at: daysAgo(
      index % 20,
    ),
  }),

  customers: (index) => ({
    id: id(),

    company: rand(
      FAKE_COMPANIES,
      index,
    ),

    contact: rand(
      FAKE_PEOPLE,
      index,
    ),

    email:
      `client${index}@sandbox.invalid`,

    plan: rand(
      [
        'starter',
        'growth',
        'scale',
      ],
      index,
    ),

    health_score: Math.floor(
      num(30, 99),
    ),
  }),

  tickets: (index) => ({
    id: id(),

    reference:
      `SBX-TCK-${900 + index}`,

    subject:
      `Demande de test ${index + 1}`,

    priority: rand(
      [
        'low',
        'medium',
        'high',
      ],
      index,
    ),

    status: rand(
      [
        'open',
        'pending',
        'resolved',
      ],
      index,
    ),

    opened_at: daysAgo(
      index % 15,
    ),
  }),
};

/**
 * Génère un jeu de données fictif pour un domaine.
 */
export const generateDomain = (
  domain: SandboxDomain,
  count = 12,
): SandboxRecord[] =>
  Array.from(
    {
      length: count,
    },
    (_, index) =>
      BUILDERS[domain](index),
  );

/**
 * Génère tous les jeux de données d'un espace Sandbox.
 */
export const generateSpaceDatasets = (
  space: string,
): Record<
  string,
  SandboxRecord[]
> => {
  const output: Record<
    string,
    SandboxRecord[]
  > = {};

  domainsForSpace(space).forEach(
    (domain) => {
      output[domain] = generateDomain(
        domain,
        8 +
          Math.floor(
            Math.random() * 14,
          ),
      );
    },
  );

  return output;
};
