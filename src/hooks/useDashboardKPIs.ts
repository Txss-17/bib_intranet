import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Metric } from '@/types';

export interface DashboardKPI extends Metric {
  poles: string[];
  domain: string;
  href?: string;
}

const db = supabase as unknown as {
  from: (t: string) => any;
};

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

const count = async (
  table: string,
  build?: (q: any) => any,
): Promise<number> => {
  let q = db.from(table).select('id', { count: 'exact', head: true });

  if (build) {
    q = build(q);
  }

  const { count: c } = await q;

  return c ?? 0;
};

const trend = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

/** Indicateurs clés des modules de pilotage (boutiques, anomalies, rapprochement, audits, cycle produit, travail). */
const moduleKPIs = async (): Promise<DashboardKPI[]> => {
  const now = new Date().toISOString();
  const [shopsActive, shopsTest, anomaliesOpen, anomaliesOverdue, reconGaps, auditsToAnalyse, auditsNC,
    productsInReview, escalationsOpen, tasksOpen, validationsPending, contractsPending] = await Promise.all([
    count('shops', (q) => q.eq('status', 'active')),
    count('shops', (q) => q.eq('status', 'test')),
    count('anomalies', (q) => q.not('status', 'in', '(resolved,closed)')),
    count('anomalies', (q) => q.not('status', 'in', '(resolved,closed)').lt('due_at', now)),
    count('reconciliation_items', (q) => q.in('status', ['gap', 'reviewing'])),
    count('field_audits', (q) => q.in('workflow_status', ['synced', 'analysis'])),
    count('field_audits', (q) => q.in('workflow_status', ['non_compliant', 'corrective_action'])),
    count('products', (q) => q.in('lifecycle_status', ['review', 'audit_required', 'audit'])),
    count('work_escalations', (q) => q.neq('status', 'resolved')),
    count('work_tasks', (q) => q.neq('status', 'completed')),
    count('work_validations', (q) => q.eq('status', 'pending')),
    count('contracts', (q) => q.in('status', ['draft', 'pending', 'sent'])),
  ]);
  const k = (id: string, domain: string, label: string, value: number, poles: string[], href: string, alert = false): DashboardKPI =>
    ({ id, domain, label, value, changeType: alert && value > 0 ? 'negative' : 'neutral', poles, href } as DashboardKPI);
  return [
    k('kpi_shops_active', 'Boutiques', 'Boutiques actives', shopsActive, ['ops', 'marketplace', 'support', 'finance', 'direction'], '/pole/ops/shops'),
    k('kpi_shops_test', 'Boutiques', 'Boutiques en test', shopsTest, ['ops', 'marketplace', 'direction'], '/pole/ops/shops'),
    k('kpi_anomalies_open', 'Anomalies', 'Anomalies ouvertes', anomaliesOpen, ['ops', 'finance', 'audit', 'supplier', 'compliance', 'support', 'direction'], '/pole/ops/anomalies', true),
    k('kpi_anomalies_late', 'Anomalies', 'Anomalies en retard', anomaliesOverdue, ['ops', 'finance', 'audit', 'direction'], '/pole/ops/anomalies', true),
    k('kpi_recon_gaps', 'Finance', 'Écarts de rapprochement', reconGaps, ['finance', 'direction'], '/pole/finance/reconciliation', true),
    k('kpi_audits_analyse', 'Audit', 'Audits à analyser', auditsToAnalyse, ['audit', 'compliance', 'supplier', 'direction'], '/pole/audit/missions'),
    k('kpi_audits_nc', 'Audit', 'Non-conformités en cours', auditsNC, ['audit', 'compliance', 'supplier', 'direction'], '/pole/audit/missions', true),
    k('kpi_products_review', 'Produits', 'Produits en validation', productsInReview, ['supplier', 'ops', 'product', 'audit', 'direction'], '/pole/ops/product-lifecycle'),
    k('kpi_contracts_pending', 'Juridique', 'Contrats à signer', contractsPending, ['compliance', 'ops', 'direction'], '/pole/compliance/contracts'),
    k('kpi_escalations', 'Travail', 'Escalades ouvertes', escalationsOpen, ['direction', 'ops', 'finance', 'rh', 'audit', 'supplier', 'data', 'security', 'marketing', 'support', 'compliance', 'rse', 'product', 'marketplace'], '/work/escalations', true),
    k('kpi_tasks', 'Travail', 'Tâches en cours', tasksOpen, ['direction', 'ops', 'finance', 'rh', 'audit', 'supplier', 'data', 'security', 'marketing', 'support', 'compliance', 'rse', 'product', 'marketplace'], '/work/tasks'),
    k('kpi_validations', 'Travail', 'Validations en attente', validationsPending, ['direction', 'ops', 'finance', 'rh', 'audit', 'supplier', 'data', 'security', 'marketing', 'support', 'compliance', 'rse', 'product', 'marketplace'], '/work/validations'),
  ];
};

export function useDashboardKPIs(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard_kpis_real'],
    enabled,
    staleTime: 60_000,

    queryFn: async (): Promise<DashboardKPI[]> => {
      const [
        orders30,
        ordersPrev30,
        ordersOpen,
        suppliersValidated,
        suppliersPending,
        stocks,
        catalogActive,
        kpisActive,
        dashboardsCount,
        cashflows,
        paymentsPending,
        headcount,
        hrPending,
        ticketsOpen,
        incidentsOpen,
        qualityOpen,
        auditOpen,
        docsCount,
        productRequestsPending,
        tripsPending,
        cardTxPending,
      ] = await Promise.all([
        count('orders', (q: any) =>
          q.gte('created_at', iso(30)),
        ),

        count('orders', (q: any) =>
          q
            .gte('created_at', iso(60))
            .lt('created_at', iso(30)),
        ),

        count('orders', (q: any) =>
          q.in('status', [
            'pending',
            'processing',
            'confirmed',
          ]),
        ),

        count('suppliers', (q: any) =>
          q.eq('status', 'validated'),
        ),

        count('suppliers', (q: any) =>
          q.in('status', [
            'pending',
            'under_review',
          ]),
        ),

        db
          .from('partner_stocks')
          .select(
            'quantity, min_threshold, rupture_threshold',
          ),

        count('product_catalog', (q: any) =>
          q.eq('status', 'active'),
        ),

        count('kpi_catalog', (q: any) =>
          q.eq('status', 'active'),
        ),

        count('bi_dashboards'),

        db
          .from('cashflows')
          .select(
            'type, amount, transaction_date',
          )
          .gte(
            'transaction_date',
            iso(30).slice(0, 10),
          ),

        db
          .from('supplier_payments')
          .select('amount')
          .eq('status', 'pending'),

        count('profiles'),

        count('hr_employee_requests', (q: any) =>
          q.in('status', [
            'submitted',
            'hr_validated',
          ]),
        ),

        count('support_tickets', (q: any) =>
          q.in('status', [
            'open',
            'in_progress',
          ]),
        ),

        count('logistics_incidents', (q: any) =>
          q.in('status', [
            'open',
            'investigating',
          ]),
        ),

        count('quality_alerts', (q: any) =>
          q.in('status', [
            'open',
            'investigating',
          ]),
        ),

        count('audit_incidents', (q: any) =>
          q.in('status', [
            'open',
            'under_review',
            'investigating',
          ]),
        ),

        count('documents'),

        count('tech_requests', (q: any) =>
          q.in('status', [
            'submitted',
            'under_review',
          ]),
        ),

        count('business_trips', (q: any) =>
          q.eq('status', 'pending'),
        ),

        count(
          'corporate_card_transactions',
          (q: any) =>
            q.eq('status', 'pending'),
        ),
      ]);

      const stockRows: Array<{
        quantity: number;
        min_threshold: number | null;
        rupture_threshold: number | null;
      }> = stocks.data ?? [];

      const stockUnits = stockRows.reduce(
        (sum, row) =>
          sum + (row.quantity ?? 0),
        0,
      );

      const stockAlerts = stockRows.filter(
        (row) =>
          (row.quantity ?? 0) <=
          (row.min_threshold ??
            row.rupture_threshold ??
            10),
      ).length;

      const cfRows: Array<{
        type: string;
        amount: number;
      }> = cashflows.data ?? [];

      const cashIn = cfRows
        .filter(
          (row) =>
            row.type === 'inflow' ||
            row.type === 'income',
        )
        .reduce(
          (sum, row) =>
            sum + Number(row.amount || 0),
          0,
        );

      const cashOut = cfRows
        .filter(
          (row) =>
            row.type === 'outflow' ||
            row.type === 'expense',
        )
        .reduce(
          (sum, row) =>
            sum + Number(row.amount || 0),
          0,
        );

      const net = cashIn - cashOut;

      const payRows: Array<{
        amount: number;
      }> = paymentsPending.data ?? [];

      const payDue = payRows.reduce(
        (sum, row) =>
          sum + Number(row.amount || 0),
        0,
      );

      const ordersTrend = trend(
        orders30,
        ordersPrev30,
      );

      return [
        {
          id: 'kpi_orders_30d',
          domain: 'Commandes',
          label: 'Commandes 30j',
          value: orders30,
          change: ordersTrend,
          changeType:
            ordersTrend >= 0
              ? 'positive'
              : 'negative',
          poles: [
            'ops',
            'marketplace',
            'finance',
            'direction',
          ],
          href: '/pole/ops/orders',
        },

        {
          id: 'kpi_orders_open',
          domain: 'Commandes',
          label: 'Commandes en cours',
          value: ordersOpen,
          changeType: 'neutral',
          poles: [
            'ops',
            'marketplace',
            'direction',
          ],
          href: '/pole/ops/orders',
        },

        {
          id: 'kpi_suppliers',
          domain: 'Fournisseurs',
          label: 'Fournisseurs validés',
          value: suppliersValidated,
          changeType: 'positive',
          poles: [
            'supplier',
            'audit',
            'direction',
          ],
          href: '/pole/supplier',
        },

        {
          id: 'kpi_suppliers_pending',
          domain: 'Fournisseurs',
          label: 'Candidatures à traiter',
          value: suppliersPending,
          changeType:
            suppliersPending > 0
              ? 'negative'
              : 'positive',
          poles: [
            'supplier',
            'audit',
            'direction',
          ],
          href: '/pole/supplier',
        },

        {
          id: 'kpi_stock_units',
          domain: 'Stocks',
          label: 'Unités en stock',
          value: eur(stockUnits),
          changeType: 'neutral',
          poles: [
            'ops',
            'supplier',
            'direction',
          ],
          href: '/pole/ops',
        },

        {
          id: 'kpi_stock_alerts',
          domain: 'Stocks',
          label: 'Stocks sous seuil',
          value: stockAlerts,
          changeType:
            stockAlerts > 0
              ? 'negative'
              : 'positive',
          poles: [
            'ops',
            'supplier',
            'direction',
          ],
          href: '/pole/ops',
        },

        {
          id: 'kpi_catalog_active',
          domain: 'Produits',
          label: 'Produits actifs',
          value: catalogActive,
          changeType: 'neutral',
          poles: [
            'supplier',
            'marketplace',
            'product',
            'marketing',
            'direction',
          ],
          href: '/pole/supplier/catalog-inbox',
        },

        {
          id: 'kpi_data_kpis',
          domain: 'Data',
          label: 'KPI catalogués',
          value: kpisActive,
          changeType: 'neutral',
          poles: [
            'data',
            'direction',
          ],
          href: '/pole/data/kpi',
        },

        {
          id: 'kpi_data_dashboards',
          domain: 'Data',
          label: 'Dashboards BI',
          value: dashboardsCount,
          changeType: 'neutral',
          poles: [
            'data',
            'direction',
          ],
          href: '/pole/data/bi',
        },

        {
          id: 'kpi_cash_net',
          domain: 'Finance',
          label: 'Cash net 30j',
          value: eur(net),
          unit: ' €',
          changeType:
            net >= 0
              ? 'positive'
              : 'negative',
          poles: [
            'finance',
            'direction',
          ],
          href: '/pole/finance/cashflow',
        },

        {
          id: 'kpi_payments_due',
          domain: 'Finance',
          label: 'Paiements en attente',
          value: eur(payDue),
          unit: ' €',
          changeType:
            payDue > 0
              ? 'negative'
              : 'positive',
          poles: [
            'finance',
            'direction',
          ],
          href: '/pole/finance/payouts',
        },

        {
          id: 'kpi_headcount',
          domain: 'RH',
          label: 'Collaborateurs',
          value: headcount,
          changeType: 'neutral',
          poles: [
            'rh',
            'direction',
          ],
          href: '/pole/rh/employees',
        },

        {
          id: 'kpi_hr_pending',
          domain: 'RH',
          label: 'Dossiers RH en cours',
          value: hrPending,
          changeType:
            hrPending > 0
              ? 'neutral'
              : 'positive',
          poles: [
            'rh',
            'direction',
            'product',
            'security',
          ],
          href: '/pole/rh/onboarding',
        },

        {
          id: 'kpi_tickets',
          domain: 'Support',
          label: 'Tickets ouverts',
          value: ticketsOpen,
          changeType:
            ticketsOpen > 0
              ? 'negative'
              : 'positive',
          poles: [
            'support',
            'marketplace',
            'direction',
          ],
          href: '/pole/support/tickets',
        },

        {
          id: 'kpi_incidents',
          domain: 'Incidents',
          label: 'Incidents logistiques',
          value: incidentsOpen,
          changeType:
            incidentsOpen > 0
              ? 'negative'
              : 'positive',
          poles: [
            'ops',
            'audit',
            'security',
            'direction',
          ],
          href: '/pole/ops/incidents',
        },

        {
          id: 'kpi_quality',
          domain: 'Qualité',
          label: 'Alertes qualité',
          value: qualityOpen,
          changeType:
            qualityOpen > 0
              ? 'negative'
              : 'positive',
          poles: [
            'ops',
            'supplier',
            'audit',
            'compliance',
            'direction',
          ],
          href: '/pole/audit/nonconformities',
        },

        {
          id: 'kpi_audit_incidents',
          domain: 'Conformité',
          label: 'Signalements audit',
          value: auditOpen,
          changeType:
            auditOpen > 0
              ? 'negative'
              : 'positive',
          poles: [
            'audit',
            'compliance',
            'direction',
          ],
          href: '/pole/audit',
        },

        {
          id: 'kpi_docs',
          domain: 'Conformité',
          label: 'Documents',
          value: docsCount,
          changeType: 'neutral',
          poles: [
            'compliance',
            'audit',
            'rh',
            'direction',
          ],
          href: '/documents',
        },

        {
          id: 'kpi_product_requests',
          domain: 'Produit & Engineering',
          label: 'Demandes Produit à traiter',
          value: productRequestsPending,
          changeType:
            productRequestsPending > 0
              ? 'neutral'
              : 'positive',
          poles: [
            'product',
            'security',
            'direction',
          ],
          href: '/pole/product/studio',
        },

        {
          id: 'kpi_trips',
          domain: 'Finance',
          label: 'Déplacements à valider',
          value: tripsPending,
          changeType: 'neutral',
          poles: [
            'finance',
            'rh',
            'direction',
          ],
          href: '/pole/finance',
        },

        {
          id: 'kpi_card_tx',
          domain: 'Finance',
          label: 'Dépenses carte à valider',
          value: cardTxPending,
          changeType: 'neutral',
          poles: [
            'finance',
            'direction',
          ],
          href: '/pole/finance/cards',
        },
        ...(await moduleKPIs()),
      ];
    },
  });
}
