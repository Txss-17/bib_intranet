import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  GitBranch,
  Layers3,
  Server,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface EngineeringMetric {
  label: string;
  value: string;
  description: string;
  icon: typeof Code2;
}

interface EngineeringProject {
  name: string;
  status: 'En cours' | 'Planifié' | 'Terminé';
  progress: number;
  owner: string;
  environment: string;
}

interface EngineeringAlert {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  target: string;
}

const metrics: EngineeringMetric[] = [
  {
    label: 'Projets actifs',
    value: '8',
    description: 'Projets Produit & Engineering',
    icon: Layers3,
  },
  {
    label: 'Déploiements',
    value: '24',
    description: 'Déploiements sur les 30 derniers jours',
    icon: GitBranch,
  },
  {
    label: 'Services supervisés',
    value: '6',
    description: 'Services applicatifs et infrastructure',
    icon: Server,
  },
  {
    label: 'Disponibilité',
    value: '99,57%',
    description: 'Uptime moyen des services',
    icon: Activity,
  },
];

const projects: EngineeringProject[] = [
  {
    name: 'Plateforme BIB',
    status: 'En cours',
    progress: 82,
    owner: 'Produit & Engineering',
    environment: 'Production',
  },
  {
    name: 'Marketplace',
    status: 'En cours',
    progress: 68,
    owner: 'Produit & Engineering',
    environment: 'Staging',
  },
  {
    name: 'BIB Circular',
    status: 'Planifié',
    progress: 34,
    owner: 'Produit & Engineering',
    environment: 'Development',
  },
  {
    name: 'Observabilité & sécurité',
    status: 'En cours',
    progress: 76,
    owner: 'Security & IT',
    environment: 'Production',
  },
];

const alerts: EngineeringAlert[] = [
  {
    title: 'Worker Queue',
    description:
      'Consommation CPU et mémoire élevée sur les workers asynchrones.',
    severity: 'high',
    target: '/pole/security/infrastructure',
  },
  {
    title: 'Intégration Marketplace',
    description:
      'Une intégration attend une validation avant passage en production.',
    severity: 'medium',
    target: '/pole/product/integrations',
  },
  {
    title: 'Documentation technique',
    description:
      'Plusieurs documents doivent être révisés avant publication.',
    severity: 'medium',
    target: '/pole/product/documentation',
  },
];

function severityLabel(severity: EngineeringAlert['severity']) {
  switch (severity) {
    case 'critical':
      return 'Critique';
    case 'high':
      return 'Élevée';
    default:
      return 'Moyenne';
  }
}

function severityVariant(
  severity: EngineeringAlert['severity'],
): 'destructive' | 'secondary' {
  return severity === 'critical' || severity === 'high'
    ? 'destructive'
    : 'secondary';
}

export default function ProductEngineeringDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
              <Code2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Produit & Engineering
              </h1>

              <p className="text-muted-foreground">
                Pilotage du produit, du développement et de la plateforme BIB
              </p>
            </div>
          </div>
        </div>

        <Badge variant="secondary">
          Pôle Produit & Engineering
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>

                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value}
                </div>

                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Projets Produit & Engineering</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  État d’avancement des principaux chantiers.
                </p>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link to="/pole/product/roadmap">
                  Roadmap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {projects.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {project.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {project.owner} · {project.environment}
                    </p>
                  </div>

                  <Badge
                    variant={
                      project.status === 'Terminé'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {project.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <Progress
                    value={project.progress}
                    className="flex-1"
                  />

                  <span className="w-10 text-right text-xs font-medium">
                    {project.progress}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Engineering quick access */}
        <Card>
          <CardHeader>
            <CardTitle>Accès Engineering</CardTitle>

            <p className="text-sm text-muted-foreground">
              Espaces opérationnels du pôle.
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link to="/pole/product/studio">
                Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link to="/pole/product/integrations">
                Intégrations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link to="/pole/product/documentation">
                Documentation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full justify-between"
            >
              <Link to="/pole/security/infrastructure">
                Infrastructure
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Points de vigilance</CardTitle>
          </div>

          <p className="text-sm text-muted-foreground">
            Éléments nécessitant un suivi Produit, Engineering ou Security & IT.
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.title}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.severity === 'critical' ||
                  alert.severity === 'high' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Wrench className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {alert.title}
                    </p>

                    <Badge variant={severityVariant(alert.severity)}>
                      {severityLabel(alert.severity)}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm">
                <Link to={alert.target}>
                  Ouvrir
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Operational status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5" />

            <div>
              <p className="font-medium">
                Produit
              </p>

              <p className="text-sm text-muted-foreground">
                Roadmap et backlog actifs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Code2 className="h-5 w-5" />

            <div>
              <p className="font-medium">
                Engineering
              </p>

              <p className="text-sm text-muted-foreground">
                Développement et plateforme
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ShieldCheck className="h-5 w-5" />

            <div>
              <p className="font-medium">
                Security & IT
              </p>

              <p className="text-sm text-muted-foreground">
                Infrastructure et sécurité
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}