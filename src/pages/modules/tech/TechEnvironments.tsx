import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Rocket, RotateCcw, ScrollText, KeyRound, Activity, History, GitCompare, ShieldAlert,
  Snowflake, Stethoscope, Server, BookOpen, Search, CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSandbox } from '@/hooks/useSandbox';

type EnvId = 'production' | 'staging' | 'development' | 'sandbox';

interface EnvState {
  id: EnvId;
  name: string;
  status: 'Actif' | 'En cours' | 'Gelé' | 'Simulation';
  version: string;
  owner: string;
  availability: number;
  lastDeploy: string;
  pipeline: 'success' | 'running' | 'idle';
  servicesHealthy: number;
  servicesTotal: number;
  incidents: number;
  uptime: string;
  lastSync: string;
  frozen: boolean;
  docPath: string;
}

const INITIAL_ENVS: EnvState[] = [
  { id: 'production', name: 'Production', status: 'Actif', version: 'v2.8.1', owner: 'CTO', availability: 99.98, lastDeploy: "Aujourd'hui 07:45", pipeline: 'success', servicesHealthy: 6, servicesTotal: 6, incidents: 0, uptime: '128 j', lastSync: "Aujourd'hui 08:15", frozen: false, docPath: 'deploiement' },
  { id: 'staging', name: 'Staging', status: 'En cours', version: 'v2.8.1-rc.2', owner: 'DevOps', availability: 99.7, lastDeploy: "Aujourd'hui 08:18", pipeline: 'running', servicesHealthy: 6, servicesTotal: 6, incidents: 1, uptime: '32 j', lastSync: "Aujourd'hui 08:14", frozen: false, docPath: 'cicd' },
  { id: 'development', name: 'Développement', status: 'Actif', version: 'v2.9.0-dev', owner: 'Équipe Dev', availability: 98.2, lastDeploy: 'Hier 19:02', pipeline: 'success', servicesHealthy: 5, servicesTotal: 6, incidents: 2, uptime: '9 j', lastSync: 'Hier 19:05', frozen: false, docPath: 'architecture' },
  { id: 'sandbox', name: 'Sandbox', status: 'Simulation', version: 'v2.8.1-sbx', owner: 'Pôle Tech', availability: 100, lastDeploy: 'Hier 22:30', pipeline: 'idle', servicesHealthy: 6, servicesTotal: 6, incidents: 0, uptime: '2 j', lastSync: 'Hier 22:31', frozen: false, docPath: 'exploitation' },
];

interface DeployRow {
  id: number;
  version: string;
  env: string;
  status: 'success' | 'rollback' | 'pending' | 'failed';
  by: string;
  at: string;
  changelog: string;
}

const INITIAL_HISTORY: DeployRow[] = [
  { id: 1, version: 'v2.8.1', env: 'Production', status: 'success', by: 'CTO', at: "Aujourd'hui 07:45", changelog: 'feat: isolation stricte sandbox' },
  { id: 2, version: 'v2.8.1-rc.2', env: 'Staging', status: 'pending', by: 'CI/CD', at: "Aujourd'hui 08:18", changelog: 'chore: pipeline release candidate' },
  { id: 3, version: 'v2.8.0', env: 'Production', status: 'rollback', by: 'DevOps', at: 'Hier 16:40', changelog: 'fix: régression paiements' },
  { id: 4, version: 'v2.9.0-dev', env: 'Développement', status: 'success', by: 'dev_fullstack', at: 'Hier 19:02', changelog: 'feat: documentation technique' },
];

const PIPELINE_STEPS = ['Code', 'Build', 'Tests', 'Staging', 'Production'];

const statusVariant = (s: EnvState['status']) =>
  s === 'Actif' ? 'default' : s === 'En cours' ? 'secondary' : s === 'Simulation' ? 'outline' : 'destructive';

export default function TechEnvironments() {
  const { isSandbox, logEvent } = useSandbox();
  const [envs, setEnvs] = useState<EnvState[]>(INITIAL_ENVS);
  const [history, setHistory] = useState<DeployRow[]>(INITIAL_HISTORY);
  const [search, setSearch] = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareA, setCompareA] = useState<EnvId>('staging');
  const [compareB, setCompareB] = useState<EnvId>('production');
  const [detail, setDetail] = useState<{ env: EnvState; tab: string } | null>(null);

  const act = (title: string, description: string) => {
    toast({ title, description });
    logEvent(title, description);
  };

  const patch = (id: EnvId, p: Partial<EnvState>) =>
    setEnvs((list) => list.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const deploy = (env: EnvState) => {
    if (env.frozen) {
      toast({ title: 'Environnement gelé', description: `${env.name} est gelé : déploiement bloqué.`, variant: 'destructive' });
      return;
    }
    const version = env.version.replace(/(\d+)$/, (m) => String(Number(m) + 1));
    patch(env.id, { version, lastDeploy: 'À l’instant', pipeline: 'running', status: 'En cours' });
    setHistory((h) => [
      { id: Date.now(), version, env: env.name, status: 'pending', by: 'Vous', at: 'À l’instant', changelog: 'Déploiement lancé depuis le Tech Studio' },
      ...h,
    ]);
    act(`Déploiement lancé — ${env.name}`, `Version ${version} en cours de promotion.`);
  };

  const rollback = (env: EnvState) => {
    setHistory((h) => [
      { id: Date.now(), version: env.version, env: env.name, status: 'rollback', by: 'Vous', at: 'À l’instant', changelog: 'Retour à la version précédente' },
      ...h,
    ]);
    patch(env.id, { pipeline: 'success', status: env.id === 'sandbox' ? 'Simulation' : 'Actif' });
    act(`Rollback effectué — ${env.name}`, `Retour depuis ${env.version}.`);
  };

  const filteredHistory = useMemo(
    () =>
      history.filter(
        (d) =>
          d.version.toLowerCase().includes(search.toLowerCase()) ||
          d.changelog.toLowerCase().includes(search.toLowerCase()) ||
          d.env.toLowerCase().includes(search.toLowerCase())
      ),
    [history, search]
  );

  const envA = envs.find((e) => e.id === compareA)!;
  const envB = envs.find((e) => e.id === compareB)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Server className="h-7 w-7" /> Environnements & Déploiements
          </h1>
          <p className="text-muted-foreground">
            Point central du cycle de vie applicatif : environnements, pipelines, historique et rollback.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCompareOpen(true)}>
            <GitCompare className="mr-1.5 h-4 w-4" /> Comparer
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pole/tech/documentation">
              <BookOpen className="mr-1.5 h-4 w-4" /> Guide de déploiement
            </Link>
          </Button>
        </div>
      </div>

      {isSandbox && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-2 py-3 text-sm">
            <ShieldAlert className="h-4 w-4 text-warning" /> Mode Sandbox actif — les actions ci-dessous restent simulées.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Environnements</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="history">Historique des déploiements</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {envs.map((env) => (
              <Card key={env.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {env.name}
                      <Badge variant={statusVariant(env.status)}>{env.status}</Badge>
                      {env.frozen && <Badge variant="outline"><Snowflake className="mr-1 h-3 w-3" /> Gelé</Badge>}
                    </CardTitle>
                    <span className="font-mono text-xs text-muted-foreground">{env.version}</span>
                  </div>
                  <CardDescription>
                    Responsable : {env.owner} · Dernier déploiement : {env.lastDeploy} · Synchro : {env.lastSync}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric label="Disponibilité" value={`${env.availability}%`} />
                    <Metric label="Services sains" value={`${env.servicesHealthy}/${env.servicesTotal}`} />
                    <Metric label="Incidents" value={String(env.incidents)} />
                    <Metric label="Temps de dispo." value={env.uptime} />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Pipeline</span>
                      <span>
                        {env.pipeline === 'running' ? 'En cours' : env.pipeline === 'success' ? 'Vert' : 'Inactif'}
                      </span>
                    </div>
                    <Progress value={env.pipeline === 'running' ? 65 : env.pipeline === 'success' ? 100 : 10} />
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {PIPELINE_STEPS.map((s) => (
                        <span key={s} className="rounded border border-border px-1.5 py-0.5">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => deploy(env)}>
                      <Rocket className="mr-1.5 h-3.5 w-3.5" /> Déployer
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rollback(env)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rollback
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/pole/tech/logs"><ScrollText className="mr-1.5 h-3.5 w-3.5" /> Logs</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDetail({ env, tab: 'variables' })}>
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Variables
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to="/pole/tech/supervision"><Activity className="mr-1.5 h-3.5 w-3.5" /> Monitoring</Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDetail({ env, tab: 'history' })}>
                      <History className="mr-1.5 h-3.5 w-3.5" /> Historique
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCompareA(env.id);
                        setCompareB(env.id === 'production' ? 'staging' : 'production');
                        setCompareOpen(true);
                      }}
                    >
                      <GitCompare className="mr-1.5 h-3.5 w-3.5" /> Comparer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        patch(env.id, { frozen: !env.frozen });
                        act(`${env.frozen ? 'Dégel' : 'Gel'} — ${env.name}`, env.frozen ? 'Déploiements réouverts.' : 'Déploiements bloqués.');
                      }}
                    >
                      <Snowflake className="mr-1.5 h-3.5 w-3.5" /> {env.frozen ? 'Dégeler' : 'Geler'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => act(`Health check — ${env.name}`, `${env.servicesHealthy}/${env.servicesTotal} services opérationnels.`)}
                    >
                      <Stethoscope className="mr-1.5 h-3.5 w-3.5" /> Health check
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de déploiement</CardTitle>
              <CardDescription>Progression du code jusqu'à la production.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {PIPELINE_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className={`rounded-lg border px-3 py-2 text-sm ${i < 3 ? 'border-border' : 'border-primary/50 bg-primary/5'}`}
                  >
                    {i < 3 ? <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-primary" /> : <Clock className="mr-1.5 inline h-3.5 w-3.5" />}
                    {s}
                  </span>
                ))}
              </div>
              <Progress value={65} />
              <p className="text-sm text-muted-foreground">Déploiement staging en cours — 65 % · 2 min 14 s restantes.</p>
              <Button variant="outline" onClick={() => act('Pipeline relancé', 'Build, tests et déploiement relancés.')}>
                Relancer le pipeline
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Rechercher version, environnement, changelog…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Environnement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Par</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Changelog</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">{d.version}</TableCell>
                      <TableCell>{d.env}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === 'success' ? 'default' : d.status === 'failed' ? 'destructive' : 'secondary'}>
                          {d.status === 'success' ? 'Succès' : d.status === 'rollback' ? 'Rollback' : d.status === 'pending' ? 'En cours' : 'Échec'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{d.by}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{d.at}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[240px] truncate text-sm text-muted-foreground">{d.changelog}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => act(`Détails — ${d.version}`, `${d.env} · ${d.changelog}`)}>
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comparer deux environnements</DialogTitle>
            <DialogDescription>Écarts de version, pipeline et santé des services.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Select value={compareA} onValueChange={(v) => setCompareA(v as EnvId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {envs.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={compareB} onValueChange={(v) => setCompareB(v as EnvId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {envs.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 text-sm">
            <CompareRow label="Version" a={envA.version} b={envB.version} />
            <CompareRow label="Statut" a={envA.status} b={envB.status} />
            <CompareRow label="Disponibilité" a={`${envA.availability}%`} b={`${envB.availability}%`} />
            <CompareRow label="Services sains" a={`${envA.servicesHealthy}/${envA.servicesTotal}`} b={`${envB.servicesHealthy}/${envB.servicesTotal}`} />
            <CompareRow label="Incidents" a={String(envA.incidents)} b={String(envB.incidents)} />
            <CompareRow label="Dernier déploiement" a={envA.lastDeploy} b={envB.lastDeploy} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompareOpen(false)}>Fermer</Button>
            <Button onClick={() => { act('Promotion demandée', `${envA.name} → ${envB.name}`); setCompareOpen(false); }}>
              Promouvoir {envA.name} → {envB.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.env.name}</DialogTitle>
            <DialogDescription>
              {detail?.tab === 'variables' ? 'Variables d’environnement (valeurs masquées).' : 'Historique de l’environnement.'}
            </DialogDescription>
          </DialogHeader>
          {detail?.tab === 'variables' ? (
            <div className="space-y-2 text-sm">
              {['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'LINKSY_API_SECRET_KEY', 'APP_ORIGIN'].map((k) => (
                <div key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <span className="font-mono text-xs">{k}</span>
                  <span className="font-mono text-xs text-muted-foreground">••••••••••</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {history.filter((h) => h.env === detail?.env.name).map((h) => (
                <div key={h.id} className="border-b border-border pb-2 last:border-0">
                  <p className="font-mono text-xs">{h.version} · {h.at}</p>
                  <p className="text-xs text-muted-foreground">{h.changelog} — {h.by}</p>
                </div>
              ))}
              {!history.some((h) => h.env === detail?.env.name) && (
                <p className="text-sm text-muted-foreground">Aucun déploiement enregistré.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-border pb-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={a !== b ? 'font-medium text-warning' : ''}>{a}</span>
      <span className={a !== b ? 'font-medium text-warning' : ''}>{b}</span>
    </div>
  );
}
