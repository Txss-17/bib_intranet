/**
 * Jeux de données fictifs de la Sandbox.
 *
 * Ces données ne sont JAMAIS écrites en base : elles sont générées à la demande
 * et conservées uniquement dans le stockage local de la Sandbox. La Production
 * ne contient que structure, configuration et paramètres.
 */

export type SandboxDomain =
  | 'orders' | 'suppliers' | 'products' | 'stocks' | 'shipments'
  | 'invoices' | 'payments' | 'salaries'
  | 'audits' | 'nonconformities'
  | 'kpis' | 'publications'
  | 'employees' | 'leaves' | 'trips'
  | 'logs' | 'deployments' | 'securityAlerts'
  | 'customers' | 'tickets';

export interface SandboxRecord {
  id: string;
  [key: string]: unknown;
}

const SPACE_DOMAINS: Record<string, SandboxDomain[]> = {
  finance: ['invoices', 'payments', 'salaries'],
  audit: ['audits', 'nonconformities'],
  data: ['kpis', 'publications'],
  rh: ['employees', 'leaves', 'trips'],
  supplier: ['suppliers', 'products', 'stocks'],
  tech: ['logs', 'deployments', 'securityAlerts'],
  marketplace: ['orders', 'customers', 'tickets', 'shipments'],
};

export const domainsForSpace = (space: string): SandboxDomain[] => SPACE_DOMAINS[space] ?? [];

export const DOMAIN_LABELS: Record<SandboxDomain, string> = {
  orders: 'Commandes', suppliers: 'Fournisseurs', products: 'Produits', stocks: 'Stocks',
  shipments: 'Expéditions', invoices: 'Factures', payments: 'Paiements', salaries: 'Salaires',
  audits: 'Audits', nonconformities: 'Non-conformités', kpis: 'KPI', publications: 'Publications',
  employees: 'Collaborateurs', leaves: 'Congés', trips: 'Déplacements', logs: 'Logs',
  deployments: 'Déploiements', securityAlerts: 'Alertes sécurité', customers: 'Clients',
  tickets: 'Tickets support',
};

const FAKE_COMPANIES = ['Nordica Test SAS', 'Iberia Demo SL', 'Alpes Fictif SARL', 'Baltic Mock AB', 'Rhone Sample SA'];
const FAKE_PEOPLE = ['Alex Témoin', 'Nora Fictive', 'Sam Démo', 'Lina Essai', 'Théo Simulé', 'Maya Sandbox'];
const FAKE_PRODUCTS = ['Coffret Test 500g', 'Kit Démo Premium', 'Recharge Fictive', 'Pack Simulation', 'Édition Essai'];
const REGIONS = ['Nord', 'Sud', 'Paris', 'Iberia', 'Baltique'];
const CITIES = ['Lille', 'Lyon', 'Paris', 'Madrid', 'Riga'];

const rand = <T,>(arr: T[], i: number): T => arr[i % arr.length];
const num = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const id = () => `sbx_${crypto.randomUUID()}`;

const BUILDERS: Record<SandboxDomain, (i: number) => SandboxRecord> = {
  orders: (i) => ({
    id: id(), order_number: `SBX-${1000 + i}`, region: rand(REGIONS, i),
    status: rand(['pending', 'processing', 'shipped', 'delivered'], i),
    total_amount: num(45, 890), currency: 'EUR', customer: rand(FAKE_COMPANIES, i),
    ordered_at: daysAgo(i % 45),
  }),
  shipments: (i) => ({
    id: id(), tracking_number: `SBXTRK${20000 + i}`, carrier: rand(['DemoExpress', 'TestPost', 'MockFret'], i),
    status: rand(['label_created', 'in_transit', 'delivered'], i), destination: rand(CITIES, i),
    shipped_at: daysAgo(i % 30),
  }),
  suppliers: (i) => ({
    id: id(), name: rand(FAKE_COMPANIES, i), country: rand(['FR', 'ES', 'LV', 'IT'], i),
    status: rand(['active', 'pending', 'suspended'], i), score: Math.floor(num(55, 98)),
    contact_email: `contact${i}@sandbox.invalid`, created_at: daysAgo(i % 200),
  }),
  products: (i) => ({
    id: id(), name: rand(FAKE_PRODUCTS, i), sku: `SBX-SKU-${100 + i}`,
    unit_price: num(4, 42), selling_price: num(4, 42) * 1.2,
    status: rand(['draft', 'validated', 'rejected'], i), category: rand(['épicerie', 'boisson', 'hygiène'], i),
  }),
  stocks: (i) => ({
    id: id(), sku: `SBX-SKU-${100 + i}`, warehouse: rand(CITIES, i),
    quantity: Math.floor(num(0, 420)), min_threshold: 25, ideal_stock: 200,
  }),
  invoices: (i) => ({
    id: id(), reference: `SBX-INV-${500 + i}`, supplier: rand(FAKE_COMPANIES, i),
    amount: num(120, 9800), currency: 'EUR', status: rand(['draft', 'pending', 'paid', 'overdue'], i),
    due_date: daysAgo(-(i % 30)),
  }),
  payments: (i) => ({
    id: id(), reference: `SBX-PAY-${700 + i}`, beneficiary: rand(FAKE_COMPANIES, i),
    amount: num(80, 5400), method: rand(['transfer', 'card', 'sepa'], i),
    status: rand(['scheduled', 'executed', 'failed'], i), executed_at: daysAgo(i % 60),
  }),
  salaries: (i) => ({
    id: id(), employee: rand(FAKE_PEOPLE, i), gross_monthly: num(2100, 6800),
    department: rand(['ops', 'finance', 'tech', 'rh'], i), period: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
  }),
  audits: (i) => ({
    id: id(), reference: `SBX-AUD-${300 + i}`, target: rand(FAKE_COMPANIES, i),
    type: rand(['field', 'supplier', 'ops'], i), status: rand(['planned', 'in_progress', 'completed'], i),
    score: Math.floor(num(48, 99)), scheduled_at: daysAgo(-(i % 21)),
  }),
  nonconformities: (i) => ({
    id: id(), reference: `SBX-NC-${400 + i}`, severity: rand(['low', 'medium', 'high', 'critical'], i),
    status: rand(['open', 'in_progress', 'closed'], i), description: 'Écart constaté en simulation',
    detected_at: daysAgo(i % 40),
  }),
  kpis: (i) => ({
    id: id(), code: `SBX_KPI_${i + 1}`, name: `KPI simulé ${i + 1}`, unit: rand(['%', '€', 'j', 'u'], i),
    value: num(1, 100), target: num(50, 120), owner_pole: rand(['ops', 'finance', 'data'], i),
  }),
  publications: (i) => ({
    id: id(), title: `Publication de test ${i + 1}`, status: rand(['draft', 'review', 'published'], i),
    visibility_scope: rand(['company', 'pole'], i), published_at: daysAgo(i % 50),
  }),
  employees: (i) => ({
    id: id(), full_name: rand(FAKE_PEOPLE, i), email: `demo${i}@sandbox.invalid`,
    position: rand(['ops_logistics_manager', 'finance_manager', 'tech_platform_manager'], i),
    seniority: rand(['junior', 'mid', 'senior'], i), hired_at: daysAgo(200 + i * 12),
  }),
  leaves: (i) => ({
    id: id(), employee: rand(FAKE_PEOPLE, i), type: rand(['paid', 'sick', 'unpaid'], i),
    status: rand(['pending', 'approved', 'refused'], i), days: Math.floor(num(1, 12)), start_at: daysAgo(-(i % 25)),
  }),
  trips: (i) => ({
    id: id(), employee: rand(FAKE_PEOPLE, i), destination: rand(CITIES, i),
    budget: num(220, 2400), status: rand(['submitted', 'approved', 'refused', 'completed'], i),
    departure_at: daysAgo(-(i % 35)),
  }),
  logs: (i) => ({
    id: id(), level: rand(['info', 'warn', 'error'], i), source: rand(['api', 'worker', 'edge'], i),
    message: `Événement simulé #${i + 1}`, at: daysAgo(i % 7),
  }),
  deployments: (i) => ({
    id: id(), version: `v1.${i}.0`, environment: rand(['dev', 'staging', 'production'], i),
    status: rand(['success', 'failed', 'rolled_back'], i), deployed_at: daysAgo(i % 30),
  }),
  securityAlerts: (i) => ({
    id: id(), title: `Alerte simulée ${i + 1}`, severity: rand(['low', 'medium', 'high', 'critical'], i),
    status: rand(['open', 'investigating', 'resolved'], i), detected_at: daysAgo(i % 20),
  }),
  customers: (i) => ({
    id: id(), company: rand(FAKE_COMPANIES, i), contact: rand(FAKE_PEOPLE, i),
    email: `client${i}@sandbox.invalid`, plan: rand(['starter', 'growth', 'scale'], i),
    health_score: Math.floor(num(30, 99)),
  }),
  tickets: (i) => ({
    id: id(), reference: `SBX-TCK-${900 + i}`, subject: `Demande de test ${i + 1}`,
    priority: rand(['low', 'medium', 'high'], i), status: rand(['open', 'pending', 'resolved'], i),
    opened_at: daysAgo(i % 15),
  }),
};

/** Génère un jeu de données fictif pour un domaine. */
export const generateDomain = (domain: SandboxDomain, count = 12): SandboxRecord[] =>
  Array.from({ length: count }, (_, i) => BUILDERS[domain](i));

/** Génère tous les jeux de données d'un espace Sandbox. */
export const generateSpaceDatasets = (space: string): Record<string, SandboxRecord[]> => {
  const out: Record<string, SandboxRecord[]> = {};
  domainsForSpace(space).forEach((d) => {
    out[d] = generateDomain(d, 8 + Math.floor(Math.random() * 14));
  });
  return out;
};
