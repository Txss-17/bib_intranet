import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, GitBranch, Layers3, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useSecurityBridgeRuns, useSecurityDeployments, classifyEnvironment, readableDate } from '@/hooks/useSecurityOperations';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

const stages = [
  { id: 'dev', title: 'Développement', subtitle: 'Préparer et tester les changements' },
  { id: 'stage', title: 'Préproduction', subtitle: 'Recette isolée, migrations et contrôles d’accès' },
  { id: 'prod', title: 'Production', subtitle: 'Livraison autorisée et procédure de retour arrière' },
] as const;

const normalize = (value: string | null | undefined) => (value || 'Non renseigné').trim();

export default function SecurityEnvironments() {
  const { canViewPage } = usePermissions();
  const deployments = useSecurityDeployments();
  const bridge = useSecurityBridgeRuns();
  const [filter, setFilter] = useState('');
  const [stage, setStage] = useState('all');
  const rows = deployments.data ?? [];
  const runs = bridge.data ?? [];
  const grouped = useMemo(() => stages.map(item => ({
    ...item,
    records: rows.filter(row => classifyEnvironment(row.environment) === item.id),
  })), [rows]);
  const visible = rows.filter(row =>
    (stage === 'all' || classifyEnvironment(row.environment) === stage) &&
    [row.environment, row.version, row.status ?? '', row.changelog ?? ''].join(' ').toLowerCase().includes(filter.trim().toLowerCase()),
  );

  if (!canViewPage('security.environments')) return <p role="alert">Accès aux environnements non autorisé.</p>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Layers3 className="h-6 w-6" />Environnements & livraisons</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">Historique réel des déploiements, promotion des versions et suivi des échanges BIB Platform ↔ Intranet.</p>
        <p className="text-xs text-muted-foreground">Les données affichées sont des événements enregistrés ; elles ne prouvent ni la disponibilité instantanée, ni l’existence d’une préproduction indépendante.</p>
      </div>
      <Button variant="outline" disabled={deployments.isFetching || bridge.isFetching} onClick={() => { void deployments.refetch(); void bridge.refetch(); }}>
        <RefreshCw className="mr-2 h-4 w-4" />Actualiser
      </Button>
    </header>
    <Tabs defaultValue="environments">
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="environments">Environnements</TabsTrigger>
        <TabsTrigger value="deployments">Versions & déploiements</TabsTrigger>
        <TabsTrigger value="bridge">Échanges Platform</TabsTrigger>
        <TabsTrigger value="controls">Validation des changements</TabsTrigger>
      </TabsList>
      <TabsContent value="environments" className="space-y-4">
        {deployments.isLoading && <p role="status" className="text-sm">Chargement de l'historique des déploiements…</p>}
        {deployments.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
          Historique de déploiement indisponible. <Button variant="outline" size="sm" onClick={() => void deployments.refetch()}>Réessayer</Button>
        </p>}
        {!deployments.isLoading && !deployments.isError &&
          <div className="grid gap-4 xl:grid-cols-3">
            {grouped.map((item, index) => {
              const recent = item.records[0];
              return <Card key={item.id} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span>{index + 1}. {item.title}</span><Badge variant="outline">{item.records.length} historique(s)</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Dernière version enregistrée</p>
                    <p className="mt-1 break-all font-mono text-sm font-medium">{recent?.version ?? 'Non documentée'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Statut enregistré : {normalize(recent?.status)}</p>
                    <p className="text-xs text-muted-foreground">Événement : {readableDate(recent?.deployed_at ?? recent?.created_at)}</p>
                    {recent?.rollback_at && <p className="mt-2 flex items-center gap-1 text-xs text-destructive"><RotateCcw className="h-3 w-3" />Retour arrière enregistré : {readableDate(recent.rollback_at)}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground">Disponibilité actuelle : <strong>Non mesurée</strong></p>
                </CardContent>
              </Card>;
            })}
          </div>}
        <div className="rounded-lg border p-4 text-sm">
          <p className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Portes de validation avant production</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {['Tests & qualité', 'Contrôles RBAC/RLS', 'Recette en préproduction isolée', 'Approbation et rollback'].map((label, i) =>
              <div key={label} className="rounded-md bg-muted/40 p-3"><span className="text-xs text-muted-foreground">Contrôle {i + 1}</span><p className="font-medium">{label}</p><p className="mt-1 text-xs text-muted-foreground">Validation non automatisée</p></div>)}
          </div>
        </div>
        <Link className="inline-flex items-center gap-1 text-sm text-primary hover:underline" to="/pole/security/code">Revue des changements de code<ArrowRight className="h-4 w-4" /></Link>
      </TabsContent>
      <TabsContent value="deployments" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Input className="min-w-48 max-w-md flex-1" value={filter} aria-label="Rechercher une version" placeholder="Version, environnement ou statut…" onChange={e => setFilter(e.target.value)} />
          <select aria-label="Environnement" className="h-10 rounded-md border bg-background px-3 text-sm" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="all">Tous les environnements</option>
            <option value="dev">Développement</option><option value="stage">Préproduction</option><option value="prod">Production</option><option value="unknown">Non classé</option>
          </select>
        </div>
        {deployments.isLoading && <p role="status">Chargement des versions…</p>}
        {deployments.isError && <p role="alert" className="text-destructive">Impossible de lire les versions enregistrées.</p>}
        {!deployments.isLoading && !deployments.isError && <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Environnement</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead>Rollback</TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.map(row => <TableRow key={row.id}>
                <TableCell className="font-mono text-xs">{row.version}</TableCell>
                <TableCell>{row.environment}</TableCell>
                <TableCell><Badge variant="outline">{normalize(row.status)}</Badge></TableCell>
                <TableCell>{readableDate(row.deployed_at ?? row.created_at)}</TableCell>
                <TableCell>{row.rollback_at ? readableDate(row.rollback_at) : 'Non enregistré'}</TableCell>
              </TableRow>)}
              {!visible.length && <TableRow><TableCell className="p-6 text-center text-muted-foreground" colSpan={5}>Aucune version correspondante dans les 150 derniers enregistrements.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>}
        <p className="text-xs text-muted-foreground">Historique limité aux 150 derniers enregistrements, sans déploiement ni rollback depuis l’interface.</p>
      </TabsContent>
      <TabsContent value="bridge" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">Synchronisations Platform ↔ Intranet</h2><Badge variant="secondary">100 dernières exécutions maximum</Badge></div>
        {bridge.isLoading && <p role="status">Chargement des synchronisations…</p>}
        {bridge.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">Les exécutions de synchronisation sont indisponibles. <Button variant="outline" size="sm" onClick={() => void bridge.refetch()}>Réessayer</Button></p>}
        {!bridge.isLoading && !bridge.isError && <div className="overflow-x-auto rounded-md border">
          <Table><TableHeader><TableRow><TableHead>Direction</TableHead><TableHead>Action</TableHead><TableHead>Statut</TableHead><TableHead>Objets déclarés</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead></TableRow></TableHeader>
            <TableBody>{runs.map(row => <TableRow key={row.id}><TableCell>{row.direction}</TableCell><TableCell>{row.action}</TableCell><TableCell><Badge variant="outline">{row.status}</Badge></TableCell><TableCell>{row.items_count}</TableCell><TableCell>{readableDate(row.started_at)}</TableCell><TableCell>{readableDate(row.finished_at)}</TableCell></TableRow>)}
              {!runs.length && <TableRow><TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Aucune exécution enregistrée. Ce constat ne démontre pas que le bridge fonctionne.</TableCell></TableRow>}</TableBody>
          </Table>
        </div>}
        <p className="text-xs text-muted-foreground">La présence d'un journal ne garantit pas la synchronisation complète ni l'identité des bases source et cible.</p>
      </TabsContent>
      <TabsContent value="controls" className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0" /><p>Les approbations documentaires sont distinctes de l’exécution. Une version n’est publiable qu’après tests, contrôle de sécurité, validation des dépendances et autorisation d’exploitation.</p></div>
        <ModuleWorkspace pageId="security.environments" />
      </TabsContent>
    </Tabs>
  </div>;
}
