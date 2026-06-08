import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

// Mock fallbacks (used when DB is empty)
const MOCK_PRODUCTS = [
  { id: 'mock-1', name: 'Infuseur Thé Zen', category: 'Lifestyle', supplier_name: 'Fournisseur A', status: 'dormant', orders_30d: 2, revenue_30d: 340, adoption: 12, isMock: true },
  { id: 'mock-2', name: 'Carnet Recyclé A5', category: 'Éco', supplier_name: 'Fournisseur B', status: 'active', orders_30d: 124, revenue_30d: 12400, adoption: 78, isMock: true },
  { id: 'mock-3', name: 'Chargeur Solaire Mini', category: 'Tech', supplier_name: 'Fournisseur C', status: 'declining', orders_30d: 18, revenue_30d: 2100, adoption: 35, isMock: true },
  { id: 'mock-4', name: 'Bougie Soja Bio', category: 'Maison', supplier_name: 'Fournisseur A', status: 'active', orders_30d: 187, revenue_30d: 18700, adoption: 92, isMock: true },
  { id: 'mock-5', name: 'Gourde Inox 500ml', category: 'Éco', supplier_name: 'Fournisseur D', status: 'dormant', orders_30d: 1, revenue_30d: 120, adoption: 5, isMock: true },
  { id: 'mock-6', name: 'Étui Phone Liège', category: 'Lifestyle', supplier_name: 'Fournisseur E', status: 'active', orders_30d: 89, revenue_30d: 8900, adoption: 65, isMock: true },
];

const MOCK_SUPPLIERS = [
  { id: 'mock-1', name: 'Fournisseur A', country: 'France', products_count: 45, quality_score: 88, risk_score: 12, status: 'active', last_audit_date: '2026-03-12', isMock: true },
  { id: 'mock-2', name: 'Fournisseur B', country: 'Allemagne', products_count: 32, quality_score: 57, risk_score: 43, status: 'active', last_audit_date: '2026-03-08', isMock: true },
  { id: 'mock-3', name: 'Fournisseur C', country: 'Espagne', products_count: 18, quality_score: 92, risk_score: 8, status: 'active', last_audit_date: '2026-03-15', isMock: true },
  { id: 'mock-4', name: 'Fournisseur D', country: 'Italie', products_count: 27, quality_score: 78, risk_score: 22, status: 'active', last_audit_date: '2026-03-10', isMock: true },
  { id: 'mock-5', name: 'Fournisseur F', country: 'Belgique', products_count: 38, quality_score: 45, risk_score: 65, status: 'at_risk', last_audit_date: '2026-03-05', isMock: true },
];

const MOCK_FRICTIONS = [
  { id: 'mock-1', title: 'Flux de validation commande trop complexe', description: '5 étapes nécessaires, taux abandon élevé', severity: 'high', status: 'open', environment: 'Commandes', created_at: '2026-03-10', isMock: true },
  { id: 'mock-2', title: 'Listing produits lent (>3s)', description: 'Performance dégradée sur catalogue +500 items', severity: 'medium', status: 'in_progress', environment: 'Catalogue', created_at: '2026-03-08', isMock: true },
  { id: 'mock-3', title: 'Erreur réconciliation paiements', description: 'Bug récurrent sur paiements fournisseurs', severity: 'critical', status: 'open', environment: 'Paiements', created_at: '2026-03-12', isMock: true },
  { id: 'mock-4', title: 'Sync inventaire lente', description: 'Délai de synchro entre entrepôts', severity: 'high', status: 'in_progress', environment: 'Stock', created_at: '2026-03-11', isMock: true },
  { id: 'mock-5', title: 'Formulaire onboarding trop long', description: '12 champs obligatoires, friction inscription', severity: 'high', status: 'open', environment: 'Onboarding', created_at: '2026-03-14', isMock: true },
];

export const useRDProductsData = () =>
  useQuery({
    queryKey: ['rd_products_data'],
    queryFn: async () => {
      const { data: products } = await sb
        .from('products')
        .select('id,name,category,status,unit_price,selling_price,supplier_id,created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!products || products.length === 0) return { rows: MOCK_PRODUCTS, isMock: true };

      const supplierIds = Array.from(new Set(products.map((p: any) => p.supplier_id).filter(Boolean)));
      let supplierMap: Record<string, string> = {};
      if (supplierIds.length) {
        const { data: sups } = await sb.from('suppliers').select('id,name').in('id', supplierIds);
        (sups || []).forEach((s: any) => { supplierMap[s.id] = s.name; });
      }

      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data: orders } = await sb
        .from('orders')
        .select('catalog_id,total_amount,created_at')
        .gte('created_at', since)
        .limit(1000);
      const ordersByProduct: Record<string, { count: number; revenue: number }> = {};
      (orders || []).forEach((o: any) => {
        if (!o.catalog_id) return;
        const k = o.catalog_id;
        if (!ordersByProduct[k]) ordersByProduct[k] = { count: 0, revenue: 0 };
        ordersByProduct[k].count += 1;
        ordersByProduct[k].revenue += Number(o.total_amount || 0);
      });
      const maxCount = Math.max(1, ...Object.values(ordersByProduct).map(o => o.count));

      const rows = products.map((p: any) => {
        const o = ordersByProduct[p.id] || { count: 0, revenue: 0 };
        const adoption = Math.round((o.count / maxCount) * 100);
        const lifecycle = o.count === 0 ? 'dormant' : o.count < maxCount * 0.2 ? 'declining' : 'active';
        return {
          id: p.id,
          name: p.name,
          category: p.category || '—',
          supplier_name: supplierMap[p.supplier_id] || '—',
          status: lifecycle,
          orders_30d: o.count,
          revenue_30d: o.revenue,
          adoption,
          isMock: false,
        };
      });
      return { rows, isMock: false };
    },
  });

export const useRDSuppliersData = () =>
  useQuery({
    queryKey: ['rd_suppliers_data'],
    queryFn: async () => {
      const { data: suppliers } = await sb
        .from('suppliers')
        .select('id,name,country,status,risk_score,quality_score,last_audit_date')
        .order('name')
        .limit(200);
      if (!suppliers || suppliers.length === 0) return { rows: MOCK_SUPPLIERS, isMock: true };

      const { data: products } = await sb.from('products').select('id,supplier_id');
      const countMap: Record<string, number> = {};
      (products || []).forEach((p: any) => {
        if (p.supplier_id) countMap[p.supplier_id] = (countMap[p.supplier_id] || 0) + 1;
      });

      const rows = suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        country: s.country || '—',
        products_count: countMap[s.id] || 0,
        quality_score: s.quality_score ?? 50,
        risk_score: s.risk_score ?? 50,
        status: s.status || 'active',
        last_audit_date: s.last_audit_date,
        isMock: false,
      }));
      return { rows, isMock: false };
    },
  });

export const useRDFrictionsData = () =>
  useQuery({
    queryKey: ['rd_frictions_data'],
    queryFn: async () => {
      const { data: bugs } = await sb
        .from('bugs')
        .select('id,title,description,severity,status,environment,created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!bugs || bugs.length === 0) return { rows: MOCK_FRICTIONS, isMock: true };
      return { rows: bugs.map((b: any) => ({ ...b, isMock: false })), isMock: false };
    },
  });
