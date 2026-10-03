import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Server,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Activity,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

type ServiceStatus = 'operational' | 'degraded';

interface InfrastructureService {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  cpu: number;
  memory: number;
  icon: typeof Server;
}

const services: InfrastructureService[] = [
  {
    name: 'API Gateway',
    description: 'Point d’entrée des services applicatifs',
    status: 'operational',
    uptime: 99.99,
    cpu: 45,
    memory: 62,
    icon: Server,
  },
  {
    name: 'PostgreSQL Primary',
    description: 'Base de données principale',
    status: 'operational',
    uptime: 99.95,
    cpu: 38,
    memory: 78,
    icon: Database,
  },
  {
    name: 'Redis Cache',
    description: 'Cache applicatif et sessions',
    status: 'operational',
    uptime: 99.99,
    cpu: 12,
    memory: 45,
    icon: Database,
  },
  {
    name: 'CDN',
    description: 'Distribution des ressources statiques',
    status: 'operational',
    uptime: 100,
    cpu: 8,
    memory: 25,
    icon: Cloud,
  },
  {
    name: 'Queue Workers',
    description: 'Traitement des tâches asynchrones',
    status: 'degraded',
    uptime: 98.5,
    cpu: 85,
    memory: 90,
    icon: Cpu,
  },
  {
    name: 'Storage',
    description: 'Stockage des fichiers et ressources',
    status: 'operational',
    uptime: 99.99,
    cpu: 15,
    memory: 55,
    icon: HardDrive,
  },
];

function getResourceStatus(value: number) {
  if (value >= 90) {
    return 'Critique';
  }

  if (value >= 80) {
    return 'Élevé';
  }

  return 'Normal';
}

function getProgressClass(value: number) {
  if (value >= 90) {
    return 'bg-red-100';
  }

  if (value >= 80) {
    return 'bg-yellow-100';
  }

  return '';
}

export default function SecurityInfrastructure() {
  const degradedServices = services.filter(
    (service) => service.status === 'degraded',
  ).length;

  const operationalServices = services.filter(
    (service) => service.status === 'operational',
  ).length;

  const averageUptime =
    services.reduce((total, service) => total + service.uptime, 0) /
    services.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Infrastructure
              </h1>
              <p className="text-muted-foreground">
                Supervision de l’infrastructure et des services IT
              </p>
            </div>
          </div>
        </div>

        <Badge variant={degradedServices > 0 ? 'destructive' : 'default'}>
          {degradedServices > 0
            ? `${degradedServices} service${degradedServices > 1 ? 's' : ''} dégradé${degradedServices > 1 ? 's' : ''}`
            : 'Infrastructure opérationnelle'}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services opérationnels
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {operationalServices}/{services.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Services actuellement disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Uptime moyen
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {averageUptime.toFixed(2)}%
            </div>

            <p className="text-xs text-muted-foreground">
              Sur les services supervisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services dégradés
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {degradedServices}
            </div>

            <p className="text-xs text-muted-foreground">
              Nécessitent une surveillance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services supervisés
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {services.length}
            </div>

            <p className="text-xs text-muted-foreground">
              Périmètre Security & IT
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Services d’infrastructure
          </h2>

          <p className="text-sm text-muted-foreground">
            État opérationnel, disponibilité et consommation des ressources.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            const cpuStatus = getResourceStatus(service.cpu);
            const memoryStatus = getResourceStatus(service.memory);

            return (
              <Card key={service.name}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div>
                        <CardTitle className="text-base">
                          {service.name}
                        </CardTitle>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {service.description}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        service.status === 'operational'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {service.status === 'operational'
                        ? 'Opérationnel'
                        : 'Dégradé'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Uptime */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Uptime
                    </span>

                    <span className="font-medium">
                      {service.uptime}%
                    </span>
                  </div>

                  {/* CPU */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        CPU
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {service.cpu}%
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {cpuStatus}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={service.cpu}
                      className={getProgressClass(service.cpu)}
                    />
                  </div>

                  {/* Memory */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Mémoire
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {service.memory}%
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {memoryStatus}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={service.memory}
                      className={getProgressClass(service.memory)}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        service.status === 'operational'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />

                    <span>
                      {service.status === 'operational'
                        ? 'Service disponible'
                        : 'Surveillance requise'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Monitoring note */}
      <Card>
        <CardContent className="flex items-start gap-3 pt-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

          <div>
            <p className="font-medium">
              Supervision Security & IT
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Cette vue centralise l’état de l’infrastructure. Les
              incidents de sécurité, les accès, les environnements,
              le VPN et les journaux sont suivis dans leurs écrans
              Security & IT dédiés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}