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
  const { data: authLogs = [] } = useSecurityAuthLogs(20);
  const { data: edgeLogs = [] } = useProductEdgeFunctionLogs(20);
  const { data: vpn = [] } = useSecurityVpnAccess();
  const { data: alerts = [] } = useSecurityAlerts();

  const failedLogins = authLogs.filter(
    (log) => log.event_type === 'login_failure',
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
            (log) => log.status_code >= 400,
          ).length /
            edgeLogs.length) *
            100,
        )
      : 0;

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
      to: '/pole/product/documentation',
      label: 'Documentation',
      icon: Code2,
      desc: 'Documentation Produit & Engineering',
    },
    {
      to: '/pole/product/console',
      label: 'Console Produit',
      icon: Server,
      desc: 'Outils techniques et opérations',
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
      to: '/pole/product/code',
      label: 'Code & GitHub',
      icon: Code2,
      desc: 'Dépôts, branches et PR',
    },
    {
      to: '/pole/security/supervision',
      label: 'Supervision',
      icon: Gauge,
      desc: 'Disponibilité, latence et erreurs',
    },
  ];

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
          Accès, infrastructure, sécurité, environnements et
          supervision technique.
        </p>
      </div>

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
              {failedLogins}
            </div>

            <p className="text-xs text-muted-foreground">
              20 dernières tentatives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accès VPN actifs
            </CardTitle>

            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {activeVpn}
            </div>

            <p className="text-xs text-muted-foreground">
              {vpn.length} accès enregistrés
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
              {openAlerts}
            </div>

            <p className="text-xs text-muted-foreground">
              {criticalAlerts} critique
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
                errorRate > 5
                  ? 'text-destructive'
                  : 'text-success'
              }`}
            >
              {errorRate}%
            </div>

            <p className="text-xs text-muted-foreground">
              {edgeLogs.length} requête
              {edgeLogs.length > 1 ? 's' : ''} récentes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.to}
              to={section.to}
            >
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      {section.label}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {section.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Activité d'authentification récente
            </CardTitle>
          </CardHeader>

          <CardContent>
            {authLogs.length === 0 ? (
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
                          {log.user_email ??
                            'Utilisateur inconnu'}
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
                        {log.event_type}
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
            {openSecurityAlerts.length === 0 ? (
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
                        {alert.alert_type}
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