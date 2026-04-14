import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, Shield, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { IncidentCard } from '@/components/dashboard/IncidentCard';
import { AuditLogItem } from '@/components/dashboard/AuditLogItem';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PoleOverview } from '@/components/dashboard/PoleOverview';
import { 
  executiveMetrics, 
  feedItems, 
  recentIncidents,
  recentAuditLogs,
} from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Dashboard() {
  const { profile } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getRoleMessage = () => {
    switch (profile?.position) {
      case 'ceo':
        return 'Pilotage stratégique · Vue consolidée de tous les pôles';
      case 'finance_manager':
        return 'Suivi financier · Trésorerie, paiements et budgets';
      case 'supplier_manager':
        return 'Gestion fournisseurs · Portefeuilles, audits et qualité';
      case 'ops_logistics_manager':
        return 'Opérations · Commandes, expéditions et logistique';
      case 'user_success_manager':
        return 'Succès client · Comptes utilisateurs, support et risques';
      case 'audit_compliance_lead':
        return 'Audit & Conformité · Contrôles, sanctions et rapports';
      case 'rse_packaging_manager':
        return 'RSE & Packaging · Impact CO₂, recyclage et emballages';
      case 'tech_platform_manager':
        return 'Tech & Plateforme · Infrastructure, déploiements et sécurité';
      default:
        return 'Tableau de bord général';
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
      default: return 'Dashboard';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting()}, {profile?.first_name || 'Utilisateur'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "EEEE d MMMM yyyy")} · {getDashboardLabel()}
          </p>
          <p className="text-xs text-accent mt-1">{getRoleMessage()}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="status-dot status-active animate-pulse-subtle" />
          <span className="text-muted-foreground">All systems operational</span>
        </div>
      </div>

      {/* Key Metrics */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Key Metrics
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {executiveMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>
        <QuickActions />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed & Incidents */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="feed" className="text-sm">
                Company Feed
              </TabsTrigger>
              <TabsTrigger value="incidents" className="text-sm">
                Active Incidents
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="space-y-4 mt-0">
              {feedItems.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </TabsContent>
            
            <TabsContent value="incidents" className="space-y-4 mt-0">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active incidents</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Audit Trail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Audit Trail
              </h2>
            </div>
            <Link to="/pole/audit" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="enterprise-card p-4">
            {recentAuditLogs.map((log, index) => (
              <AuditLogItem 
                key={log.id} 
                log={log} 
                isLast={index === recentAuditLogs.length - 1} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Poles Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Poles Overview
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">12 active poles</span>
        </div>
        <PoleOverview />
      </section>
    </div>
  );
}
