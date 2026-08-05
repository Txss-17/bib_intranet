import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Shield, Rocket, Users, Activity, Wifi, AlertTriangle, GitBranch, FlaskConical, UserCog, Plug, Code2, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthLogs, useEdgeFunctionLogs, useVpnAccess, useSecurityAlerts } from '@/hooks/useTechData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TechDashboard() {
  const { data: authLogs = [] } = useAuthLogs(20);
  const { data: edgeLogs = [] } = useEdgeFunctionLogs(20);
  const { data: vpn = [] } = useVpnAccess();
  const { data: alerts = [] } = useSecurityAlerts();

  const failedLogins = authLogs.filter((l: any) => l.event_type === 'login_failure').length;
  const activeVpn = vpn.filter((v: any) => v.status === 'active').length;
  const openAlerts = alerts.filter((a: any) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical' && a.status === 'open').length;
  const errorRate = edgeLogs.length > 0
    ? Math.round((edgeLogs.filter((l: any) => l.status_code >= 400).length / edgeLogs.length) * 100)
    : 0;

  const sections = [
    { to: '/pole/tech/access', label: 'Accès & utilisateurs', icon: Users, desc: 'Auditeurs, droits' },
    { to: '/pole/tech/vpn', label: 'Réseau / VPN', icon: Wifi, desc: 'Connexions sécurisées' },
    { to: '/pole/tech/logs', label: 'Logs & activité', icon: Activity, desc: 'Traces complètes' },
    { to: '/pole/tech/environments', label: 'Environnements & Déploiements', icon: Rocket, desc: 'Cartes, pipelines, rollback' },
    { to: '/pole/tech/documentation', label: 'Documentation', icon: Rocket, desc: 'Base de connaissances technique' },
    { to: '/pole/tech/console', label: 'Console', icon: Rocket, desc: 'Terminal, SQL, Git, API' },
    { to: '/pole/tech/environments', label: 'Environnements', icon: GitBranch, desc: 'Dev / Staging / Prod' },
    { to: '/pole/tech/security', label: 'Sécurité', icon: Shield, desc: 'Alertes & incidents' },
    { to: '/pole/tech/dataflow', label: 'Flux de données', icon: Server, desc: 'Public ↔ Interne' },
    { to: '/pole/tech/sandbox', label: 'Sandbox', icon: FlaskConical, desc: 'Simulation isolée' },
    { to: '/pole/tech/test-accounts', label: 'Comptes de test', icon: UserCog, desc: 'Profils simulés' },
    { to: '/pole/tech/integrations', label: 'Intégrations', icon: Plug, desc: 'Centre de synchro' },
    { to: '/pole/tech/code', label: 'Code & GitHub', icon: Code2, desc: 'Dépôts, branches, PR' },
    { to: '/pole/tech/supervision', label: 'Supervision', icon: Gauge, desc: 'Uptime, latence, erreurs' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pôle Tech</h1>
        <p className="text-muted-foreground">Système de contrôle distribué — infrastructure, accès, sécurité</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échecs de connexion</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${failedLogins > 5 ? 'text-destructive' : ''}`}>{failedLogins}</div>
            <p className="text-xs text-muted-foreground">20 dernières tentatives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accès VPN actifs</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVpn}</div>
            <p className="text-xs text-muted-foreground">{vpn.length} total enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-destructive' : openAlerts > 0 ? 'text-warning' : ''}`}>
              {openAlerts}
            </div>
            <p className="text-xs text-muted-foreground">{criticalAlerts} critiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'erreur API</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${errorRate > 5 ? 'text-destructive' : 'text-success'}`}>{errorRate}%</div>
            <p className="text-xs text-muted-foreground">{edgeLogs.length} requêtes récentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="hover:border-primary transition-colors h-full">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Activité auth récente</CardTitle></CardHeader>
          <CardContent>
            {authLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {authLogs.slice(0, 6).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{log.user_email || 'Inconnu'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })} · {log.ip_address || 'IP inconnue'}
                      </p>
                    </div>
                    <Badge variant={log.event_type === 'login_failure' ? 'destructive' : 'default'}>
                      {log.event_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Alertes sécurité ouvertes</CardTitle></CardHeader>
          <CardContent>
            {alerts.filter((a: any) => a.status === 'open').length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune alerte ouverte.</p>
            ) : (
              <div className="space-y-2">
                {alerts.filter((a: any) => a.status === 'open').slice(0, 6).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.alert_type}</p>
                    </div>
                    <Badge variant={a.severity === 'critical' ? 'destructive' : a.severity === 'high' ? 'destructive' : 'secondary'}>
                      {a.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
