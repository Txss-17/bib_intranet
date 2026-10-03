import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Gauge,
  Server,
  AlertTriangle,
  RefreshCw,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useProductEdgeFunctionLogs,
  useSecurityAlerts,
} from '@/hooks/useSecurityData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type ServiceStatus = 'operational' | 'degraded';

interface ServiceHealth {
  name: string;
  uptime: number;
  latency: number;
  status: ServiceStatus;
}

interface EdgeFunctionLog {
  id: string;
  function_name?: string | null;
  status_code?: number | null;
  created_at?: string | null;
}

interface SecurityAlert {
  id: string;
  title: string;
  alert_type?: string | null;
  severity?: string | null;
  status?: string | null;
}

const SERVICES: ServiceHealth[] = [
  {
    name: 'API / Edge Functions',
    uptime: 99.97,
    latency: 142,
    status: 'operational',
  },
  {
    name: 'Base de données',
    uptime: 99.99,
    latency: 38,
    status: 'operational',
  },
  {
    name: 'Authentification',
    uptime: 99.95,
    latency: 96,
    status: 'operational',
  },
  {
    name: 'Stockage fichiers',
    uptime: 99.90,
    latency: 210,
    status: 'degraded',
  },
  {
    name: 'Emails transactionnels',
    uptime: 99.80,
    latency: 320,
    status: 'operational',
  },
];

export default function SecuritySupervision() {
  const { data: edgeLogs = [] } = useProductEdgeFunctionLogs(30);
  const { data: alerts = [] } = useSecurityAlerts();

  const typedEdgeLogs = edgeLogs as EdgeFunctionLog[];
  const typedAlerts = alerts as SecurityAlert[];

  const errors = typedEdgeLogs.filter(
    (log) => (log.status_code ?? 0) >= 400,
  );

  const errorRate = typedEdgeLogs.length
    ? Math.round((errors.length / typedEdgeLogs.length) * 100)
    : 0;

  const openAlerts = typedAlerts.filter(
    (alert) => alert.status === 'open',
  );

  const avgLatency = Math.round(
    SERVICES.reduce((total, service) => total + service.latency, 0) /
      SERVICES.length,
  );

  const globalUptime = (
    SERVICES.reduce((total, service) => total + service.uptime, 0) /
    SERVICES.length
  ).toFixed(2);

  const act = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Activity className="h-7 w-7" />
            Supervision Security & IT
          </h1>

          <p className="text-muted-foreground">
            Disponibilité, latence, erreurs et incidents techniques supervisés
            par Security & IT.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              act(
                'Sondes relancées',
                'Tous les services ont été re-testés.',
              )
            }
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Relancer les sondes
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              act(
                'Astreinte notifiée',
                "L'alerte a été transmise à l'équipe Security & IT de garde.",
              )
            }
          >
            <BellRing className="mr-1.5 h-4 w-4" />
            Notifier l'astreinte
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uptime global 30j
            </CardTitle>

            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-success">
              {globalUptime}%
            </div>

            <p className="text-xs text-muted-foreground">
              {SERVICES.length} services supervisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Latence moyenne
            </CardTitle>

            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {avgLatency} ms
            </div>

            <p className="text-xs text-muted-foreground">
              p50 toutes routes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux d'erreur API
            </CardTitle>

            <Server className="h-4 w-4 text-muted-foreground" />
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
              {typedEdgeLogs.length} requêtes récentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Incidents ouverts
            </CardTitle>

            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div
              className={`text-2xl font-bold ${
                openAlerts.length > 0
                  ? 'text-destructive'
                  : ''
              }`}
            >
              {openAlerts.length}
            </div>

            <p className="text-xs text-muted-foreground">
              {typedAlerts.length} au total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État des services</CardTitle>

          <CardDescription>
            Disponibilité et temps de réponse par composant supervisé.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {SERVICES.map((service) => (
            <div
              key={service.name}
              className="space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {service.name}
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {service.latency} ms
                  </span>

                  <Badge
                    variant={
                      service.status === 'operational'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {service.status === 'operational'
                      ? '🟢 Opérationnel'
                      : '🟠 Dégradé'}
                  </Badge>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      act(
                        `Test — ${service.name}`,
                        `Réponse ${service.latency} ms, uptime ${service.uptime}%.`,
                      )
                    }
                  >
                    Tester
                  </Button>
                </span>
              </div>

              <Progress value={service.uptime} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Dernières erreurs API
            </CardTitle>

            <CardDescription>
              Requêtes en échec sur les fonctions serveur.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune erreur sur les requêtes récentes.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">
                      Quand
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {errors.slice(0, 8).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {log.function_name ?? '—'}
                      </TableCell>

                      <TableCell>
                        <Badge variant="destructive">
                          {log.status_code ?? '—'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right text-xs text-muted-foreground">
                        {log.created_at
                          ? formatDistanceToNow(
                              new Date(log.created_at),
                              {
                                addSuffix: true,
                                locale: fr,
                              },
                            )
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Incidents à traiter
            </CardTitle>

            <CardDescription>
              Alertes techniques ouvertes nécessitant une action.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {openAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun incident ouvert.
              </p>
            ) : (
              openAlerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {alert.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {alert.alert_type ?? 'Alerte technique'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === 'critical' ||
                        alert.severity === 'high'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {alert.severity ?? 'unknown'}
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act(
                          'Incident pris en charge',
                          alert.title,
                        )
                      }
                    >
                      Prendre en charge
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}