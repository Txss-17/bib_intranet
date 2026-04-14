import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, Shield, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { IncidentCard } from '@/components/dashboard/IncidentCard';
import { AuditLogItem } from '@/components/dashboard/AuditLogItem';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PoleOverview } from '@/components/dashboard/PoleOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Metric, FeedItem } from '@/types';

function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard_metrics'],
    queryFn: async (): Promise<Metric[]> => {
      const [ordersRes, usersRes, suppliersRes, incidentsRes, ticketsRes, docsRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('user_accounts').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'validated'),
        supabase.from('logistics_incidents').select('id', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('documents').select('id', { count: 'exact', head: true }),
      ]);

      return [
        { id: 'met_orders', label: 'Commandes', value: ordersRes.count ?? 0, change: 0, changeType: 'neutral' as const },
        { id: 'met_users', label: 'Comptes clients', value: usersRes.count ?? 0, change: 0, changeType: 'neutral' as const },
        { id: 'met_suppliers', label: 'Fournisseurs validés', value: suppliersRes.count ?? 0, change: 0, changeType: 'positive' as const },
        { id: 'met_incidents', label: 'Incidents actifs', value: incidentsRes.count ?? 0, change: 0, changeType: (incidentsRes.count ?? 0) > 0 ? 'negative' as const : 'positive' as const },
        { id: 'met_tickets', label: 'Tickets ouverts', value: ticketsRes.count ?? 0, change: 0, changeType: 'neutral' as const },
        { id: 'met_docs', label: 'Documents', value: docsRes.count ?? 0, change: 0, changeType: 'neutral' as const },
      ];
    },
    staleTime: 60_000,
  });
}

function useDashboardFeed() {
  return useQuery({
    queryKey: ['dashboard_feed'],
    queryFn: async (): Promise<FeedItem[]> => {
      const { data, error } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        author: { name: p.author_name, role: p.author_role },
        poleId: p.pole_id as FeedItem['poleId'],
        title: p.title,
        content: p.content,
        type: (p.type || 'update') as FeedItem['type'],
        visibility: (p.visibility || 'company') as FeedItem['visibility'],
        createdAt: p.created_at || '',
        reactions: p.reactions || 0,
        comments: p.comments || 0,
      }));
    },
  });
}

function useRecentIncidents() {
  return useQuery({
    queryKey: ['dashboard_incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_incidents')
        .select('*')
        .in('status', ['open', 'investigating'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data.map(i => ({
        id: i.id,
        title: i.incident_type,
        description: i.description,
        severity: (i.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        status: (i.status || 'open') as 'open' | 'investigating' | 'resolved' | 'closed',
        poleId: 'ops' as const,
        reportedBy: 'System',
        createdAt: i.created_at || '',
      }));
    },
  });
}

function useRecentAuditLogs() {
  return useQuery({
    queryKey: ['dashboard_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data.map(l => ({
        id: l.id,
        userId: l.user_id || '',
        userName: l.user_name || 'System',
        action: l.action,
        resource: l.resource,
        resourceId: l.resource_id || '',
        poleId: l.pole_id as any,
        timestamp: l.created_at || '',
      }));
    },
  });
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: metrics = [], isLoading: metricsLoading } = useDashboardMetrics();
  const { data: feedData = [], isLoading: feedLoading } = useDashboardFeed();
  const { data: incidents = [], isLoading: incLoading } = useRecentIncidents();
  const { data: auditLogs = [], isLoading: logLoading } = useRecentAuditLogs();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleMessage = () => {
    switch (profile?.position) {
      case 'ceo': return 'Pilotage stratégique · Vue consolidée de tous les pôles';
      case 'finance_manager': return 'Suivi financier · Trésorerie, paiements et budgets';
      case 'supplier_manager': return 'Gestion fournisseurs · Portefeuilles, audits et qualité';
      case 'ops_logistics_manager': return 'Opérations · Commandes, expéditions et logistique';
      case 'user_success_manager': return 'Succès client · Comptes utilisateurs, support et risques';
      case 'audit_compliance_lead': return 'Audit & Conformité · Contrôles, sanctions et rapports';
      case 'rse_packaging_manager': return 'RSE & Packaging · Impact CO₂, recyclage et emballages';
      case 'tech_platform_manager': return 'Tech & Plateforme · Infrastructure, déploiements et sécurité';
      case 'marketing_manager': return 'Marketing · Campagnes, analytics et communication';
      case 'rh_manager': return 'Ressources Humaines · Employés, formation et congés';
      case 'risk_manager': return 'Risques · Incidents actifs, registre et métriques';
      case 'rd_manager': return 'R&D · Études produits, frictions et rapports terrain';
      default: return 'Tableau de bord général';
    }
  };

  const getDashboardLabel = () => {
    switch (profile?.position) {
      case 'ceo': return 'Executive Dashboard';
      case 'finance_manager': return 'Finance Dashboard';
      case 'supplier_manager': return 'Supplier Dashboard';
      case 'ops_logistics_manager': return 'Operations Dashboard';
      case 'user_success_manager': return 'Lifecycle Dashboard';
      case 'audit_compliance_lead': return 'Audit Dashboard';
      case 'rse_packaging_manager': return 'RSE Dashboard';
      case 'tech_platform_manager': return 'Tech Dashboard';
      case 'marketing_manager': return 'Marketing Dashboard';
      case 'rh_manager': return 'RH Dashboard';
      case 'risk_manager': return 'Risk Dashboard';
      case 'rd_manager': return 'R&D Dashboard';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting()}, {profile?.first_name || 'Utilisateur'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })} · {getDashboardLabel()}
          </p>
          <p className="text-xs text-accent mt-1">{getRoleMessage()}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot status-active animate-pulse-subtle" />
          <span className="text-muted-foreground">All systems operational</span>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Key Metrics</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metricsLoading ? (
            <div className="col-span-full flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            metrics.map((metric) => (<MetricCard key={metric.id} metric={metric} />))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Quick Actions</h2>
        </div>
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="feed" className="text-sm">Company Feed</TabsTrigger>
              <TabsTrigger value="incidents" className="text-sm">Active Incidents</TabsTrigger>
            </TabsList>
            <TabsContent value="feed" className="space-y-4 mt-0">
              {feedLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : feedData.length > 0 ? (
                feedData.map((item) => (<FeedCard key={item.id} item={item} />))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune publication récente</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="incidents" className="space-y-4 mt-0">
              {incLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : incidents.length > 0 ? (
                incidents.map((incident) => (<IncidentCard key={incident.id} incident={incident} />))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active incidents</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Audit Trail</h2>
            </div>
            <Link to="/pole/audit" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="enterprise-card p-4">
            {logLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (<AuditLogItem key={log.id} log={log} isLast={index === auditLogs.length - 1} />))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente</p>
            )}
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Poles Overview</h2>
          </div>
          <span className="text-xs text-muted-foreground">12 active poles</span>
        </div>
        <PoleOverview />
      </section>
    </div>
  );
}
