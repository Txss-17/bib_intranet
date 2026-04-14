import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useExecutiveKPIs() {
  return useQuery({
    queryKey: ['executive_kpis'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: atRiskUsers },
        { count: openIncidents },
        { count: totalSuppliers },
        { count: openTickets },
        { count: totalOrders },
        { data: cashflows },
        { data: recentAlerts },
        { count: pendingProducts },
        { data: supplierScores },
      ] = await Promise.all([
        supabase.from('user_accounts').select('*', { count: 'exact', head: true }),
        supabase.from('user_accounts').select('*', { count: 'exact', head: true }).in('risk_level', ['high', 'critical']),
        supabase.from('logistics_incidents').select('*', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('cashflows').select('amount, type, transaction_date, category').order('transaction_date', { ascending: false }).limit(500),
        supabase.from('notifications').select('*').eq('type', 'critical').eq('read', false).limit(10),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('suppliers').select('quality_score').not('quality_score', 'is', null),
      ]);

      // Calculate revenue from cashflows
      const totalRevenue = (cashflows || [])
        .filter(c => c.type === 'income')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const totalExpenses = (cashflows || [])
        .filter(c => c.type === 'expense')
        .reduce((sum, c) => sum + Number(c.amount), 0);

      // Monthly revenue for charts
      const monthlyData: Record<string, { income: number; expense: number }> = {};
      for (const cf of cashflows || []) {
        const month = cf.transaction_date?.substring(0, 7); // YYYY-MM
        if (!month) continue;
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
        if (cf.type === 'income') monthlyData[month].income += Number(cf.amount);
        else monthlyData[month].expense += Number(cf.amount);
      }

      const monthNames: Record<string, string> = {
        '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
        '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
      };

      const chartData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([key, val]) => ({
          month: monthNames[key.split('-')[1]] || key,
          ca: Math.round(val.income / 1000),
          ebitda: Math.round((val.income - val.expense) / 1000),
        }));

      const avgQuality = supplierScores && supplierScores.length > 0
        ? Math.round(supplierScores.reduce((s, v) => s + (v.quality_score || 0), 0) / supplierScores.length)
        : 0;

      return {
        totalUsers: totalUsers || 0,
        atRiskUsers: atRiskUsers || 0,
        openIncidents: openIncidents || 0,
        totalSuppliers: totalSuppliers || 0,
        openTickets: openTickets || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalExpenses,
        ebitda: totalRevenue - totalExpenses,
        chartData,
        criticalAlerts: recentAlerts || [],
        pendingProducts: pendingProducts || 0,
        avgSupplierQuality: avgQuality,
      };
    },
    refetchInterval: 60000,
  });
}

export function useRecentCriticalAlerts() {
  return useQuery({
    queryKey: ['executive_critical_alerts'],
    queryFn: async () => {
      const [
        { data: qualityAlerts },
        { data: incidents },
        { data: notifications },
      ] = await Promise.all([
        supabase.from('quality_alerts').select('id, title, severity, created_at').in('status', ['open']).in('severity', ['critical', 'high']).order('created_at', { ascending: false }).limit(5),
        supabase.from('logistics_incidents').select('id, incident_type, severity, created_at').in('status', ['open', 'investigating']).order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('id, title, message, type, pole_id, created_at').eq('type', 'critical').eq('read', false).order('created_at', { ascending: false }).limit(5),
      ]);

      const alerts = [
        ...(qualityAlerts || []).map(a => ({ id: a.id, message: a.title, severity: a.severity, pole: 'Fournisseurs', created_at: a.created_at })),
        ...(incidents || []).map(i => ({ id: i.id, message: i.incident_type, severity: i.severity || 'medium', pole: 'Ops', created_at: i.created_at })),
        ...(notifications || []).map(n => ({ id: n.id, message: n.title, severity: 'critical', pole: n.pole_id || 'Direction', created_at: n.created_at })),
      ].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      return alerts.slice(0, 10);
    },
    refetchInterval: 30000,
  });
}

export function usePolePerformance() {
  return useQuery({
    queryKey: ['pole_performance'],
    queryFn: async () => {
      const [
        { count: activeSuppliers },
        { count: totalSuppliers },
        { count: openIncidents },
        { count: totalIncidents },
        { count: openTickets },
        { count: totalTickets },
        { data: supplierAudits },
      ] = await Promise.all([
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('logistics_incidents').select('*', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
        supabase.from('logistics_incidents').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('supplier_audits').select('score').not('score', 'is', null).limit(50),
      ]);

      const supplierScore = totalSuppliers ? Math.round(((activeSuppliers || 0) / (totalSuppliers || 1)) * 100) : 80;
      const opsScore = totalIncidents ? Math.round(((1 - (openIncidents || 0) / Math.max(totalIncidents || 1, 1)) * 100)) : 90;
      const lifecycleScore = totalTickets ? Math.round(((1 - (openTickets || 0) / Math.max(totalTickets || 1, 1)) * 100)) : 85;
      const auditAvg = supplierAudits && supplierAudits.length > 0
        ? Math.round(supplierAudits.reduce((s, a) => s + (a.score || 0), 0) / supplierAudits.length)
        : 85;

      return [
        { id: 'supplier', name: 'Fournisseurs', score: Math.min(supplierScore, 100), status: supplierScore >= 80 ? 'healthy' : 'warning' },
        { id: 'ops', name: 'Opérations', score: Math.min(opsScore, 100), status: opsScore >= 80 ? 'healthy' : 'warning' },
        { id: 'lifecycle', name: 'Lifecycle', score: Math.min(lifecycleScore, 100), status: lifecycleScore >= 80 ? 'healthy' : 'warning' },
        { id: 'audit', name: 'Audit', score: Math.min(auditAvg, 100), status: auditAvg >= 80 ? 'healthy' : 'warning' },
      ];
    },
    refetchInterval: 120000,
  });
}
