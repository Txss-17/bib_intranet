import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Rocket,
  RotateCcw,
  ScrollText,
  KeyRound,
  Activity,
  History,
  GitCompare,
  ShieldAlert,
  Snowflake,
  Stethoscope,
  Server,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { toast } from '@/hooks/use-toast';
import { useSandbox } from '@/hooks/useSandbox';

type EnvId =
  | 'production'
  | 'staging'
  | 'development'
  | 'sandbox';

type EnvironmentStatus =
  | 'Actif'
  | 'En cours'
  | 'Gelé'
  | 'Simulation';

type PipelineStatus =
  | 'success'
  | 'running'
  | 'idle';

interface EnvState {
  id: EnvId;
  name: string;
  status: EnvironmentStatus;
  version: string;
  owner: string;
  availability: number;
  lastDeploy: string;
  pipeline: PipelineStatus;
  servicesHealthy: number;
  servicesTotal: number;
  incidents: number;
  uptime: string;
  lastSync: string;
  frozen: boolean;
  docPath: string;
}

interface DeployRow {
  id: number;
  version: string;
  env: string;
  status:
    | 'success'
    | 'rollback'
    | 'pending'
    | 'failed';
  by: string;
  at: string;
  changelog: string;
}

interface EnvironmentDetail {
  env: EnvState;
  tab: 'variables' | 'history';
}

const INITIAL_ENVS: EnvState[] = [
  {
    id: 'production',
    name: 'Production',
    status: 'Actif',
    version: 'v2.8.1',
    owner: 'Direction Produit',
    availability: 99.98,
    lastDeploy: "Aujourd'hui 07:45",
    pipeline: 'success',
    servicesHealthy: 6,
    servicesTotal: 6,
    incidents: 0,
    uptime: '128 j',
    lastSync: "Aujourd'hui 08:15",
    frozen: false,
    docPath: 'deploiement',
  },
  {
    id: 'staging',
    name: 'Staging',
    status: 'En cours',
    version: 'v2.8.1-rc.2',
    owner: 'Produit & Engineering',
    availability: 99.7,
    lastDeploy: "Aujourd'hui 08:18",
    pipeline: 'running',
    servicesHealthy: 6,
    servicesTotal: 6,
    incidents: 1,
    uptime: '32 j',
    lastSync: "Aujourd'hui 08:14",
    frozen: false,
    docPath: 'cicd',
  },
  {
    id: 'development',
    name: 'Développement',
    status: 'Actif',
    version: 'v2.9.0-dev',
    owner: 'Engineering',
    availability: 98.2,
    lastDeploy: 'Hier 19:02',
    pipeline: 'success',
    servicesHealthy: 5,
    servicesTotal: 6,
    incidents: 2,
    uptime: '9 j',
    lastSync: 'Hier 19:05',
    frozen: false,
    docPath: 'architecture',
  },
  {
    id: 'sandbox',
    name: 'Sandbox',
    status: 'Simulation',
    version: 'v2.8.1-sbx',
    owner: 'Security & IT',
    availability: 100,
    lastDeploy: 'Hier 22:30',
    pipeline: 'idle',
    servicesHealthy: 6,
    servicesTotal: 6,
    incidents: 0,
    uptime: '2 j',
    lastSync: 'Hier 22:31',
    frozen: false,
    docPath: 'exploitation',
  },
];

const INITIAL_HISTORY: DeployRow[] = [
  {
    id: 1,
    version: 'v2.8.1',
    env: 'Production',
    status: 'success',
    by: 'Direction Produit',
    at: "Aujourd'hui 07:45",
    changelog:
      'feat: isolation stricte sandbox',
  },
  {
    id: 2,
    version: 'v2.8.1-rc.2',
    env: 'Staging',
    status: 'pending',
    by: 'CI/CD',
    at: "Aujourd'hui 08:18",
    changelog:
      'chore: pipeline release candidate',
  },
  {
    id: 3,
    version: 'v2.8.0',
    env: 'Production',
    status: 'rollback',
    by: 'Engineering',
    at: 'Hier 16:40',
    changelog:
      'fix: régression paiements',
  },
  {
    id: 4,
    version: 'v2.9.0-dev',
    env: 'Développement',
    status: 'success',
    by: 'Engineering',
    at: 'Hier 19:02',
    changelog:
      'feat: documentation technique',
  },
];

const PIPELINE_STEPS = [
  'Code',
  'Build',
  'Tests',
  'Staging',
  'Production',
];

const statusVariant = (
  status: EnvironmentStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (status === 'Actif') {
    return 'default';
  }

  if (status === 'En cours') {
    return 'secondary';
  }

  if (status === 'Simulation') {
    return 'outline';
  }

  return 'destructive';
};

const pipelineProgress = (
  pipeline: PipelineStatus,
) => {
  if (pipeline === 'running') {
    return 65;
  }

  if (pipeline === 'success') {
    return 100;
  }

  return 10;
};

const formatDeployStatus = (
  status: DeployRow['status'],
) => {
  switch (status) {
    case 'success':
      return 'Succès';
    case 'rollback':
      return 'Rollback';
    case 'pending':
      return 'En cours';
    case 'failed':
      return 'Échec';
  }
};

export default function SecurityEnvironments() {
  const {
    isSandbox,
    logEvent,
  } = useSandbox();

  const [envs, setEnvs] =
    useState<EnvState[]>(
      INITIAL_ENVS,
    );

  const [history, setHistory] =
    useState<DeployRow[]>(
      INITIAL_HISTORY,
    );

  const [search, setSearch] =
    useState('');

  const [compareOpen, setCompareOpen] =
    useState(false);

  const [compareA, setCompareA] =
    useState<EnvId>('staging');

  const [compareB, setCompareB] =
    useState<EnvId>('production');

  const [detail, setDetail] =
    useState<EnvironmentDetail | null>(
      null,
    );

  const act = (
    title: string,
    description: string,
  ) => {
    toast({
      title,
      description,
    });

    logEvent(
      title,
      description,
    );
  };

  const patchEnvironment = (
    id: EnvId,
    patch: Partial<EnvState>,
  ) => {
    setEnvs((current) =>
      current.map((environment) =>
        environment.id === id
          ? {
              ...environment,
              ...patch,
            }
          : environment,
      ),
    );
  };

  const deploy = (
    environment: EnvState,
  ) => {
    if (environment.frozen) {
      toast({
        title:
          'Environnement gelé',
        description: `${environment.name} est gelé : déploiement bloqué.`,
        variant:
          'destructive',
      });

      return;
    }

    const version =
      environment.version.replace(
        /(\d+)$/,
        (match) =>
          String(
            Number(match) + 1,
          ),
      );

    patchEnvironment(
      environment.id,
      {
        version,
        lastDeploy:
          'À l’instant',
        pipeline: 'running',
        status: 'En cours',
      },
    );

    setHistory((current) => [
      {
        id: Date.now(),
        version,
        env: environment.name,
        status: 'pending',
        by: 'Vous',
        at: 'À l’instant',
        changelog:
          'Déploiement lancé depuis Security & IT',
      },
      ...current,
    ]);

    act(
      `Déploiement lancé — ${environment.name}`,
      `Version ${version} en cours de promotion.`,
    );
  };

  const rollback = (
    environment: EnvState,
  ) => {
    setHistory((current) => [
      {
        id: Date.now(),
        version:
          environment.version,
        env: environment.name,
        status: 'rollback',
        by: 'Vous',
        at: 'À l’instant',
        changelog:
          'Retour à la version précédente',
      },
      ...current,
    ]);

    patchEnvironment(
      environment.id,
      {
        pipeline: 'success',
        status:
          environment.id ===
          'sandbox'
            ? 'Simulation'
            : 'Actif',
      },
    );

    act(
      `Rollback effectué — ${environment.name}`,
      `Retour depuis ${environment.version}.`,
    );
  };

  const filteredHistory =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return history;
      }

      return history.filter(
        (deployment) =>
          deployment.version
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          deployment.changelog
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          deployment.env
            .toLowerCase()
            .includes(
              normalizedSearch,
            ),
      );
    }, [history, search]);

  const envA =
    envs.find(
      (environment) =>
        environment.id ===
        compareA,
    ) ?? envs[0];

  const envB =
    envs.find(
      (environment) =>
        environment.id ===
        compareB,
    ) ?? envs[1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Server className="h-7 w-7" />
            Environnements & déploiements
          </h1>

          <p className="text-muted-foreground">
            Supervision des environnements,
            pipelines, déploiements,
            historiques et opérations
            de rollback.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setCompareOpen(true)
            }
          >
            <GitCompare className="mr-1.5 h-4 w-4" />
            Comparer
          </Button>

          <Button
            variant="outline"
            asChild
          >
            <Link to="/pole/product/documentation">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Guide de déploiement
            </Link>
          </Button>
        </div>
      </div>

      {isSandbox && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <ShieldAlert className="h-4 w-4 text-warning" />

            Mode Sandbox actif —
            les actions ci-dessous
            restent simulées.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">
            Environnements
          </TabsTrigger>

          <TabsTrigger value="pipeline">
            Pipeline
          </TabsTrigger>

          <TabsTrigger value="history">
            Historique des déploiements
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="cards"
          className="mt-4"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {envs.map(
              (environment) => (
                <Card
                  key={environment.id}
                  className="overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {environment.name}

                        <Badge
                          variant={statusVariant(
                            environment.status,
                          )}
                        >
                          {environment.status}
                        </Badge>

                        {environment.frozen && (
                          <Badge variant="outline">
                            <Snowflake className="mr-1 h-3 w-3" />
                            Gelé
                          </Badge>
                        )}
                      </CardTitle>

                      <span className="font-mono text-xs text-muted-foreground">
                        {environment.version}
                      </span>
                    </div>

                    <CardDescription>
                      Responsable :{' '}
                      {environment.owner}
                      {' · '}
                      Dernier déploiement :{' '}
                      {environment.lastDeploy}
                      {' · '}
                      Synchro :{' '}
                      {environment.lastSync}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Metric
                        label="Disponibilité"
                        value={`${environment.availability}%`}
                      />

                      <Metric
                        label="Services sains"
                        value={`${environment.servicesHealthy}/${environment.servicesTotal}`}
                      />

                      <Metric
                        label="Incidents"
                        value={String(
                          environment.incidents,
                        )}
                      />

                      <Metric
                        label="Temps de dispo."
                        value={environment.uptime}
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Pipeline
                        </span>

                        <span>
                          {environment.pipeline ===
                          'running'
                            ? 'En cours'
                            : environment.pipeline ===
                                'success'
                              ? 'Vert'
                              : 'Inactif'}
                        </span>
                      </div>

                      <Progress
                        value={pipelineProgress(
                          environment.pipeline,
                        )}
                      />

                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        {PIPELINE_STEPS.map(
                          (step) => (
                            <span
                              key={step}
                              className="rounded border border-border px-1.5 py-0.5"
                            >
                              {step}
                            </span>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          deploy(
                            environment,
                          )
                        }
                      >
                        <Rocket className="mr-1.5 h-3.5 w-3.5" />
                        Déployer
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          rollback(
                            environment,
                          )
                        }
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Rollback
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <Link to="/pole/security/logs">
                          <ScrollText className="mr-1.5 h-3.5 w-3.5" />
                          Logs
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDetail({
                            env: environment,
                            tab: 'variables',
                          })
                        }
                      >
                        <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                        Variables
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                      >
                        <Link to="/pole/security/security">
                          <Activity className="mr-1.5 h-3.5 w-3.5" />
                          Monitoring
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDetail({
                            env: environment,
                            tab: 'history',
                          })
                        }
                      >
                        <History className="mr-1.5 h-3.5 w-3.5" />
                        Historique
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCompareA(
                            environment.id,
                          );

                          setCompareB(
                            environment.id ===
                              'production'
                              ? 'staging'
                              : 'production',
                          );

                          setCompareOpen(
                            true,
                          );
                        }}
                      >
                        <GitCompare className="mr-1.5 h-3.5 w-3.5" />
                        Comparer
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          patchEnvironment(
                            environment.id,
                            {
                              frozen:
                                !environment.frozen,
                            },
                          );

                          act(
                            `${
                              environment.frozen
                                ? 'Dégel'
                                : 'Gel'
                            } — ${environment.name}`,
                            environment.frozen
                              ? 'Déploiements réouverts.'
                              : 'Déploiements bloqués.',
                          );
                        }}
                      >
                        <Snowflake className="mr-1.5 h-3.5 w-3.5" />

                        {environment.frozen
                          ? 'Dégeler'
                          : 'Geler'}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          act(
                            `Health check — ${environment.name}`,
                            `${environment.servicesHealthy}/${environment.servicesTotal} services opérationnels.`,
                          )
                        }
                      >
                        <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                        Health check
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="pipeline"
          className="mt-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Pipeline de déploiement
              </CardTitle>

              <CardDescription>
                Progression du code jusqu’à
                la production.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {PIPELINE_STEPS.map(
                  (step, index) => (
                    <span
                      key={step}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        index < 3
                          ? 'border-border'
                          : 'border-primary/50 bg-primary/5'
                      }`}
                    >
                      {index < 3 ? (
                        <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Clock className="mr-1.5 inline h-3.5 w-3.5" />
                      )}

                      {step}
                    </span>
                  ),
                )}
              </div>

              <Progress value={65} />

              <p className="text-sm text-muted-foreground">
                Déploiement staging en cours —
                65 % · 2 min 14 s restantes.
              </p>

              <Button
                variant="outline"
                onClick={() =>
                  act(
                    'Pipeline relancé',
                    'Build, tests et déploiement relancés.',
                  )
                }
              >
                Relancer le pipeline
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-4 space-y-4"
        >
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-10"
              placeholder="Rechercher version, environnement, changelog…"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Version
                    </TableHead>

                    <TableHead>
                      Environnement
                    </TableHead>

                    <TableHead>
                      Statut
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Par
                    </TableHead>

                    <TableHead className="hidden md:table-cell">
                      Date
                    </TableHead>

                    <TableHead className="hidden lg:table-cell">
                      Changelog
                    </TableHead>

                    <TableHead className="text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredHistory.map(
                    (deployment) => (
                      <TableRow
                        key={deployment.id}
                      >
                        <TableCell className="font-mono text-sm">
                          {deployment.version}
                        </TableCell>

                        <TableCell>
                          {deployment.env}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              deployment.status ===
                              'success'
                                ? 'default'
                                : deployment.status ===
                                    'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {formatDeployStatus(
                              deployment.status,
                            )}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          {deployment.by}
                        </TableCell>

                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {deployment.at}
                        </TableCell>

                        <TableCell className="hidden max-w-[240px] truncate text-sm text-muted-foreground lg:table-cell">
                          {deployment.changelog}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(
                                `Détails — ${deployment.version}`,
                                `${deployment.env} · ${deployment.changelog}`,
                              )
                            }
                          >
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={compareOpen}
        onOpenChange={
          setCompareOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Comparer deux environnements
            </DialogTitle>

            <DialogDescription>
              Écarts de version, pipeline et
              santé des services.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Select
              value={compareA}
              onValueChange={(value) =>
                setCompareA(
                  value as EnvId,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {envs.map(
                  (environment) => (
                    <SelectItem
                      key={environment.id}
                      value={environment.id}
                    >
                      {environment.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            <Select
              value={compareB}
              onValueChange={(value) =>
                setCompareB(
                  value as EnvId,
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {envs.map(
                  (environment) => (
                    <SelectItem
                      key={environment.id}
                      value={environment.id}
                    >
                      {environment.name}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 text-sm">
            <CompareRow
              label="Version"
              a={envA.version}
              b={envB.version}
            />

            <CompareRow
              label="Statut"
              a={envA.status}
              b={envB.status}
            />

            <CompareRow
              label="Disponibilité"
              a={`${envA.availability}%`}
              b={`${envB.availability}%`}
            />

            <CompareRow
              label="Services sains"
              a={`${envA.servicesHealthy}/${envA.servicesTotal}`}
              b={`${envB.servicesHealthy}/${envB.servicesTotal}`}
            />

            <CompareRow
              label="Incidents"
              a={String(
                envA.incidents,
              )}
              b={String(
                envB.incidents,
              )}
            />

            <CompareRow
              label="Dernier déploiement"
              a={envA.lastDeploy}
              b={envB.lastDeploy}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCompareOpen(false)
              }
            >
              Fermer
            </Button>

            <Button
              onClick={() => {
                act(
                  'Promotion demandée',
                  `${envA.name} → ${envB.name}`,
                );

                setCompareOpen(
                  false,
                );
              }}
            >
              Promouvoir{' '}
              {envA.name} →{' '}
              {envB.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {detail?.env.name}
            </DialogTitle>

            <DialogDescription>
              {detail?.tab ===
              'variables'
                ? 'Variables d’environnement. Les valeurs sensibles restent masquées.'
                : 'Historique de l’environnement.'}
            </DialogDescription>
          </DialogHeader>

          {detail?.tab ===
          'variables' ? (
            <div className="space-y-2 text-sm">
              {[
                'SUPABASE_URL',
                'SUPABASE_ANON_KEY',
                'BIB_API_SECRET_KEY',
                'APP_ORIGIN',
              ].map(
                (variable) => (
                  <div
                    key={variable}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <span className="font-mono text-xs">
                      {variable}
                    </span>

                    <span className="font-mono text-xs text-muted-foreground">
                      ••••••••••
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {history
                .filter(
                  (deployment) =>
                    deployment.env ===
                    detail?.env.name,
                )
                .map(
                  (deployment) => (
                    <div
                      key={
                        deployment.id
                      }
                      className="border-b border-border pb-2 last:border-0"
                    >
                      <p className="font-mono text-xs">
                        {
                          deployment.version
                        }{' '}
                        ·{' '}
                        {
                          deployment.at
                        }
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          deployment.changelog
                        }{' '}
                        —{' '}
                        {
                          deployment.by
                        }
                      </p>
                    </div>
                  ),
                )}

              {!history.some(
                (deployment) =>
                  deployment.env ===
                  detail?.env.name,
              ) && (
                <p className="text-sm text-muted-foreground">
                  Aucun déploiement
                  enregistré.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function CompareRow({
  label,
  a,
  b,
}: {
  label: string;
  a: string;
  b: string;
}) {
  const different = a !== b;

  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-border pb-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">
        {label}
      </span>

      <span
        className={
          different
            ? 'font-medium text-warning'
            : ''
        }
      >
        {a}
      </span>

      <span
        className={
          different
            ? 'font-medium text-warning'
            : ''
        }
      >
        {b}
      </span>
    </div>
  );
}