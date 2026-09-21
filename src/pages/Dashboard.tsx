import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Activity,
  Shield,
  FileText,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { IncidentCard } from '@/components/dashboard/IncidentCard';
import { AuditLogItem } from '@/components/dashboard/AuditLogItem';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PoleOverview } from '@/components/dashboard/PoleOverview';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FeedItem } from '@/types';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { usePermissions } from '@/hooks/usePermissions';

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

      return (data || []).map((post) => ({
        id: post.id,
        author: {
          name: post.author_name,
          role: post.author_role,
        },
        poleId: post.pole_id as FeedItem['poleId'],
        title: post.title,
        content: post.content,
        type: (post.type || 'update') as FeedItem['type'],
        visibility: (post.visibility || 'company') as FeedItem['visibility'],
        createdAt: post.created_at || '',
        reactions: post.reactions || 0,
        comments: post.comments || 0,
      }));
    },
  });
}

function useRecentIncidents(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard_incidents'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logistics_incidents')
        .select('*')
        .in('status', ['open', 'investigating'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map((incident) => ({
        id: incident.id,
        title: incident.incident_type,
        description: incident.description,
        severity: (incident.severity || 'medium') as
          | 'low'
          | 'medium'
          | 'high'
          | 'critical',
        status: (incident.status || 'open') as
          | 'open'
          | 'investigating'
          | 'resolved'
          | 'closed',
        poleId: 'ops' as const,
        reportedBy: 'System',
        createdAt: incident.created_at || '',
      }));
    },
  });
}

function useRecentAuditLogs(enabled: boolean) {
  return useQuery({
    queryKey: ['dashboard_audit_logs'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map((log) => ({
        id: log.id,
        userId: log.user_id || '',
        userName: log.user_name || 'System',
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id || '',
        poleId: log.pole_id as any,
        timestamp: log.created_at || '',
      }));
    },
  });
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { poles: permissionPoles, isSuperAdmin } = usePermissions();

  const userPoles = permissionPoles.length
    ? permissionPoles
    : (profile?.poles ?? []);

  const isLeadership =
    isSuperAdmin ||
    userPoles.includes('direction') ||
    profile?.position === 'ceo';

  const canSee = (poles: string[]) =>
    isLeadership || poles.some((pole) => userPoles.includes(pole));

  /*
   * Les incidents restent rattachés aux Opérations.
   *
   * Le pôle Risk ayant été supprimé de l'architecture,
   * la gestion des risques reste transversale entre :
   * - Opérations
   * - Audit
   * - Conformité
   * - Security & IT selon la nature du risque.
   */
  const canSeeIncidents = canSee([
    'ops',
    'audit',
    'compliance',
    'security',
    'direction',
  ]);

  const canSeeAudit = canSee([
    'audit',
    'compliance',
    'direction',
  ]);

  const {
    data: allMetrics = [],
    isLoading: metricsLoading,
  } = useDashboardKPIs(
    userPoles.length > 0 || isLeadership,
  );

  const {
    data: feedData = [],
    isLoading: feedLoading,
  } = useDashboardFeed();

  const {
    data: incidents = [],
    isLoading: incidentsLoading,
  } = useRecentIncidents(canSeeIncidents);

  const {
    data: auditLogs = [],
    isLoading: auditLogsLoading,
  } = useRecentAuditLogs(canSeeAudit);

  /*
   * Moindre privilège :
   * seules les métriques rattachées aux pôles accessibles
   * au collaborateur sont affichées.
   */
  const metrics = allMetrics.filter((metric) =>
    canSee(metric.poles),
  );

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';

    return 'Bonsoir';
  };

  const getRoleMessage = () => {
    switch (profile?.position) {
      case 'ceo':
        return 'Pilotage stratégique · Vue consolidée des 14 pôles';

      case 'finance_manager':
        return 'Suivi financier · Trésorerie, paiements et budgets';

      case 'supplier_manager':
        return 'Gestion fournisseurs · Portefeuilles, audits et qualité';

      case 'ops_logistics_manager':
        return 'Opérations · Commandes, expéditions et logistique';

      case 'customer_success_manager':
        return 'Marketplace & Customer Success · Clients, commandes et support';

      case 'audit_compliance_lead':
        return 'Audit & Conformité · Contrôles, risques et rapports';

      case 'rse_impact_manager':
        return 'RSE & Impact · Recyclage, emballages et indicateurs ESG';

      case 'product_engineering_manager':
        return 'Produit & Engineering · Produit, développement et innovation';

      case 'marketing_communication_manager':
        return 'Marketing & Communication · Campagnes, CRM et contenu';

      case 'rh_manager':
        return 'Ressources Humaines · Collaborateurs, recrutement et intégration';

      case 'data_bi_manager':
        return 'Data & BI · KPIs, reporting et analyse décisionnelle';

      case 'security_it_manager':
        return 'Security & IT · Accès, infrastructure et sécurité';

      default:
        return 'Tableau de bord général';
    }
  };

  const getDashboardLabel = () => {
    switch (profile?.position) {
      case 'ceo':
        return 'Executive Dashboard';

      case 'finance_manager':
        return 'Finance Dashboard';

      case 'supplier_manager':
        return 'Supplier Dashboard';

      case 'ops_logistics_manager':
        return 'Operations Dashboard';

      case 'customer_success_manager':
        return 'Marketplace & Customer Dashboard';

      case 'audit_compliance_lead':
        return 'Audit & Compliance Dashboard';

      case 'rse_impact_manager':
        return 'RSE & Impact Dashboard';

      case 'product_engineering_manager':
        return 'Product & Engineering Dashboard';

      case 'marketing_communication_manager':
        return 'Marketing & Communication Dashboard';

      case 'rh_manager':
        return 'RH Dashboard';

      case 'data_bi_manager':
        return 'Data & BI Dashboard';

      case 'security_it_manager':
        return 'Security & IT Dashboard';

      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting()}, {profile?.first_name || 'Utilisateur'}
          </h1>

          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(new Date(), 'EEEE d MMMM yyyy', {
              locale: fr,
            })}{' '}
            · {getDashboardLabel()}
          </p>

          <p className="mt-1 text-xs text-accent">
            {getRoleMessage()}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot status-active animate-pulse-subtle" />
          <span className="text-muted-foreground">
            All systems operational
          </span>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />

          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Key Metrics
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metricsLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : metrics.length > 0 ? (
            metrics.map((metric) =>
              metric.href ? (
                <Link
                  key={metric.id}
                  to={metric.href}
                  className="block"
                >
                  <MetricCard
                    metric={metric}
                    className="h-full transition-colors hover:border-accent/60"
                  />
                </Link>
              ) : (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                />
              ),
            )
          ) : (
            <p className="col-span-full text-sm text-muted-foreground">
              Aucun indicateur rattaché à vos pôles pour le moment.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />

          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Quick Actions
          </h2>
        </div>

        <QuickActions />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            defaultValue="feed"
            className="w-full"
          >
            <TabsList
              className={`mb-4 grid w-full ${
                canSeeIncidents
                  ? 'grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              <TabsTrigger
                value="feed"
                className="text-sm"
              >
                Company Feed
              </TabsTrigger>

              {canSeeIncidents && (
                <TabsTrigger
                  value="incidents"
                  className="text-sm"
                >
                  Active Incidents
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="feed"
              className="mt-0 space-y-4"
            >
              {feedLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : feedData.length > 0 ? (
                feedData.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />

                  <p className="text-sm">
                    Aucune publication récente
                  </p>
                </div>
              )}
            </TabsContent>

            {canSeeIncidents && (
              <TabsContent
                value="incidents"
                className="mt-0 space-y-4"
              >
                {incidentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Shield className="mx-auto mb-2 h-8 w-8 opacity-50" />

                    <p className="text-sm">
                      Aucun incident actif
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {canSeeAudit && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />

                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Audit Trail
                </h2>
              </div>

              <Link
                to="/pole/audit"
                className="text-xs text-accent hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="enterprise-card p-4">
              {auditLogsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length > 0 ? (
                auditLogs.map((log, index) => (
                  <AuditLogItem
                    key={log.id}
                    log={log}
                    isLast={
                      index === auditLogs.length - 1
                    }
                  />
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Aucune activité récente
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {isLeadership && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />

              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Poles Overview
              </h2>
            </div>

            <span className="text-xs text-muted-foreground">
              14 active poles
            </span>
          </div>

          <PoleOverview />
        </section>
      )}
    </div>
  );
}
