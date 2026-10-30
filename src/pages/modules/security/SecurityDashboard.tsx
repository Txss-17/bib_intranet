import {
  Activity,
  AlertTriangle,
  Code2,
  FlaskConical,
  Gauge,
  Plug,
  Rocket,
  Server,
  Shield,
  UserCog,
  Users,
  Wifi,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  useSecurityAuthLogs,
  useProductEdgeFunctionLogs,
  useSecurityVpnAccess,
  useSecurityAlerts,
} from '@/hooks/useSecurityData';

export default function SecurityDashboard() {
  const authQuery = useSecurityAuthLogs(20);
  const edgeQuery = useProductEdgeFunctionLogs(20);
  const vpnQuery = useSecurityVpnAccess();
  const alertQuery = useSecurityAlerts();
  const authLogs = authQuery.data ?? [];
  const edgeLogs = edgeQuery.data ?? [];
  const vpn = vpnQuery.data ?? [];
  const alerts = alertQuery.data ?? [];
  const missingSources = [authQuery, edgeQuery, vpnQuery, alertQuery].some(
    (query) => query.isError || query.isLoading,
  );

  const failedLogins = authLogs.filter(
    (log) => log.app_origin === 'connect' && log.event_type === 'login_failure',
  ).length;

  const activeVpn = vpn.filter(
    (access) => access.status === 'active',
  ).length;

  const openAlerts = alerts.filter(
    (alert) => alert.status === 'open',
  ).length;

  const criticalAlerts = alerts.filter(
    (alert) =>
      alert.severity === 'critical' &&
      alert.status === 'open',
  ).length;

  const errorRate =
    edgeLogs.length > 0
      ? Math.round(
          (edgeLogs.filter(
            (log) => Number(log.http_status ?? 0) >= 400 || log.status === 'error' || log.level === 'error',
          ).length /
            edgeLogs.length) *
            100,
        )
      : null;

  const sections = [
    {
      to: '/pole/security/access',
      label: 'Accès & identités',
      icon: Users,
      desc: 'Utilisateurs, droits et habilitations',
    },
    {
      to: '/pole/security/vpn',
      label: 'Réseau & VPN',
      icon: Wifi,
      desc: 'Connexions et accès sécurisés',
    },
    {
      to: '/pole/security/logs',
      label: 'Logs & activité',
      icon: Activity,
      desc: 'Traçabilité des événements',
    },
    {
      to: '/pole/security/environments',
      label: 'Environnements',
      icon: Rocket,
      desc: 'Déploiements, pipelines et rollback',
    },
    {
      to: '/pole/security/documentation',
      label: 'Documentation IT',
      icon: Code2,
      desc: 'Runbooks, revues et procédures contrôlées',
    },
    {
      to: '/pole/security/console',
      label: 'Interventions techniques',
      icon: Server,
      desc: 'Demandes d’intervention, autorisations et preuves',
    },
    {
      to: '/pole/security/security',
      label: 'Sécurité',
      icon: Shield,
      desc: 'Alertes, incidents et contrôles',
    },
    {
      to: '/pole/security/dataflow',
      label: 'Flux de données',
      icon: Server,
      desc: 'Flux entre services et environnements',
    },
    {
      to: '/pole/security/platform',
      label: 'Sécurité BIB Platform & RLS',
      icon: Shield,
      desc: 'Marchands, clients, fournisseurs, logistique et politiques RLS',
    },
    {
      to: '/pole/security/sandbox',
      label: 'Sandbox',
      icon: FlaskConical,
      desc: 'Simulation isolée',
    },
    {
      to: '/pole/security/test-accounts',
      label: 'Comptes de test',
      icon: UserCog,
      desc: 'Profils et environnements de test',
    },
    {
      to: '/pole/product/integrations',
      label: 'Intégrations',
      icon: Plug,
      desc: 'Services et connexions externes',
    },
    {
      to: '/pole/security/code',
      label: 'Revue de code',
      icon: Code2,
      desc: 'Contrôles des changements, tests CI et sécurité',
    },
    {
      to: '/pole/security/supervision',
      label: 'Supervision',
      icon: Gauge,
      desc: 'Disponibilité, latence et erreurs',
    },
  ];

  const workspaces = [
    {
      title: '1. Surveillance & incidents',
      description: 'Détection, alertes, investigations, suivi des événements',
      links: ['/pole/security/security','/pole/security/supervision','/pole/security/logs'],
    },
    {
      title: '2. Identités & sécurité BIB Platform',
      description: 'Personnel interne, comptes de test, marchands, clients, fournisseurs, logistique et RLS',
      links: ['/pole/security/access','/pole/security/platform','/pole/security/vpn','/pole/security/test-accounts','/pole/security/dataflow'],
    },
    {
      title: '3. Infrastructure & sécurité applicative',
      description: 'Environnements, services, code, intégrations et essais isolés',
      links: ['/pole/security/environments','/pole/security/code','/pole/security/sandbox','/pole/product/integrations'],
    },
    {
      title: '4. Exploitation & gouvernance IT',
      description: 'Continuité, intervention autorisée et procédures de reprise',
      links: ['/pole/security/infrastructure','/pole/security/console','/pole/security/documentation'],
    },
  ] as const;

  const openSecurityAlerts = alerts
    .filter((alert) => alert.status === 'open')
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />

          <h1 className="text-3xl font-bold">
            Security & IT
          </h1>
        </div>

        <p className="mt-1 text-muted-foreground">
          Sécurité interne BIB, identités, infrastructure, supervision et
          contrôles des données de BIB Platform.
        </p>
      </div>

      {missingSources && (
        <div role="alert" className="rounded-lg border border-warning/40 p-3 text-sm">
          Certaines sources de sécurité ne sont pas disponibles ou sont encore en cours de chargement.
          Les indicateurs concernés ne doivent pas être interprétés comme des valeurs nulles.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Échecs de connexion
            </CardTitle>

            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold ${
                failedLogins > 5
                  ? 'text-destructive'
                  : ''
              }`}
            >
              {authQuery.isError || authQuery.isLoading ? '—' : failedLogins}
            </div>

            <p className="text-xs text-muted-foreground">
              Sur les 20 derniers événements, hors données BOS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accès VPN déclarés actifs
            </CardTitle>

            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {vpnQuery.isError || vpnQuery.isLoading ? '—' : activeVpn}
            </div>

            <p className="text-xs text-muted-foreground">
              {vpnQuery.isError || vpnQuery.isLoading ? '—' : vpn.length} entrées enregistrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertes sécurité
            </CardTitle>

            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold ${
                criticalAlerts > 0
                  ? 'text-destructive'
                  : openAlerts > 0
                    ? 'text-warning'
                    : ''
              }`}
            >
              {alertQuery.isError || alertQuery.isLoading ? '—' : openAlerts}
            </div>

            <p className="text-xs text-muted-foreground">
              {alertQuery.isError || alertQuery.isLoading ? '—' : criticalAlerts} critique
              {criticalAlerts > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux d'erreur API
            </CardTitle>

            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold ${
                errorRate == null ? 'text-muted-foreground' : errorRate > 5
                  ? 'text-destructive'
                  : 'text-success'
              }`}
            >
              {edgeQuery.isError || edgeQuery.isLoading || errorRate == null ? '—' : `${errorRate}%`}
            </div>

            <p className="text-xs text-muted-foreground">
              {edgeQuery.isError || edgeQuery.isLoading ? '—' : edgeLogs.length} événement
              {edgeLogs.length > 1 ? 's' : ''} sur les 20 derniers journaux
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {workspaces.map((workspace) => <section key={workspace.title} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{workspace.title}</h2>
            <p className="text-sm text-muted-foreground">{workspace.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workspace.links.map((to) => {
              const section = sections.find(item => item.to === to);
              if (!section) return null;
              const Icon = section.icon;
              return <Link key={to} to={to}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>;
            })}
          </div>
        </section>)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Activité d'authentification récente
            </CardTitle>
          </CardHeader>

          <CardContent>
            {authQuery.isError || authQuery.isLoading ? (
              <p role="status" className="text-sm text-muted-foreground">Journaux d’authentification indisponibles ou en chargement.</p>
            ) : authLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune activité enregistrée.
              </p>
            ) : (
              <div className="space-y-2">
                {authLogs
                  .slice(0, 6)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                    >
                      <div>
                        <p className="font-medium">
                          {String(log.user_email ??
                            'Utilisateur inconnu')}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(log.created_at),
                            {
                              addSuffix: true,
                              locale: fr,
                            },
                          )}{' '}
                          ·{' '}
                          {log.ip_address ??
                            'IP inconnue'}
                        </p>
                      </div>

                      <Badge
                        variant={
                          log.event_type ===
                          'login_failure'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {String(log.event_type ?? '')}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Alertes sécurité ouvertes
            </CardTitle>
          </CardHeader>

          <CardContent>
            {alertQuery.isError || alertQuery.isLoading ? (
              <p role="status" className="text-sm text-muted-foreground">Alertes de sécurité indisponibles ou en chargement.</p>
            ) : openSecurityAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune alerte ouverte.
              </p>
            ) : (
              <div className="space-y-2">
                {openSecurityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {alert.title}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {String(alert.alert_type ?? '')}
                      </p>
                    </div>

                    <Badge
                      variant={
                        alert.severity === 'critical' ||
                        alert.severity === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {alert.severity}
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