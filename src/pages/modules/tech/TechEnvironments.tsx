import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  GitBranch, CheckCircle2, AlertCircle, ArrowUpCircle, RotateCcw, Snowflake, Activity, ExternalLink, Lock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type EnvStatus = 'operational' | 'degraded' | 'frozen';

interface EnvItem {
  name: string;
  branch: string;
  url: string;
  status: EnvStatus;
  version: string;
  uptime: string;
  lastDeploy: string;
  protected: boolean;
  dataset: 'Production (données réelles)' | 'Sandbox (données fictives)';
}

const INITIAL: EnvItem[] = [
  { name: 'Production', branch: 'main', url: 'workspace.brand-in-a-box.space', status: 'operational', version: 'v2.4.1', uptime: '99.98%', lastDeploy: "Aujourd'hui 08:42", protected: true, dataset: 'Production (données réelles)' },
  { name: 'Staging', branch: 'staging', url: 'staging.brand-in-a-box.space', status: 'operational', version: 'v2.5.0-rc1', uptime: '99.70%', lastDeploy: 'Hier 19:15', protected: false, dataset: 'Sandbox (données fictives)' },
  { name: 'Development', branch: 'develop', url: 'dev.brand-in-a-box.space', status: 'degraded', version: 'v2.5.0-dev', uptime: '98.20%', lastDeploy: 'Il y a 2 h', protected: false, dataset: 'Sandbox (données fictives)' },
];

const RELEASES = [
  { version: 'v2.5.0-rc1', env: 'Staging', author: 'devops@brand-in-a-box.space', at: 'Hier 19:15', status: 'success' },
  { version: 'v2.4.1', env: 'Production', author: 'cto@brand-in-a-box.space', at: "Aujourd'hui 08:42", status: 'success' },
  { version: 'v2.4.0', env: 'Production', author: 'cto@brand-in-a-box.space', at: 'Lun. 11:04', status: 'success' },
  { version: 'v2.3.9', env: 'Production', author: 'devops@brand-in-a-box.space', at: 'Ven. 16:30', status: 'rollback' },
];

const statusMeta: Record<EnvStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  operational: { label: 'Opérationnel', variant: 'default' },
  degraded: { label: 'Dégradé', variant: 'destructive' },
  frozen: { label: 'Gelé', variant: 'secondary' },
};

export default function TechEnvironments() {
  const [envs, setEnvs] = useState<EnvItem[]>(INITIAL);

  const setStatus = (name: string, status: EnvStatus) =>
    setEnvs((p) => p.map((e) => (e.name === name ? { ...e, status } : e)));

  const promote = (e: EnvItem) => {
    const target = e.name === 'Development' ? 'Staging' : 'Production';
    setEnvs((p) => p.map((x) => (x.name === target ? { ...x, version: e.version, lastDeploy: "À l'instant" } : x)));
    toast({ title: `Promotion ${e.name} → ${target}`, description: `Version ${e.version} déployée sur ${target}.` });
  };

  const rollback = (e: EnvItem) => {
    setEnvs((p) => p.map((x) => (x.name === e.name ? { ...x, version: `${x.version}-prev`, lastDeploy: "À l'instant" } : x)));
    toast({ title: `Rollback — ${e.name}`, description: 'Retour à la version précédente effectué.' });
  };

  const freeze = (e: EnvItem) => {
    const next: EnvStatus = e.status === 'frozen' ? 'operational' : 'frozen';
    setStatus(e.name, next);
    toast({
      title: next === 'frozen' ? `Gel des déploiements — ${e.name}` : `Dégel — ${e.name}`,
      description: next === 'frozen' ? 'Aucun déploiement possible jusqu\'au dégel.' : 'Les déploiements sont de nouveau autorisés.',
    });
  };

  const healthCheck = (e: EnvItem) =>
    toast({ title: `Health check — ${e.name}`, description: `API 200 OK · base accessible · uptime ${e.uptime}.` });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><GitBranch className="h-7 w-7" /> Environnements</h1>
        <p className="text-muted-foreground">Dev / Staging / Production — versions, statuts, promotions et rollbacks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {envs.map((e) => (
          <Card key={e.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {e.name}
                  {e.protected && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </CardTitle>
                {e.status === 'operational' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning" />
                )}
              </div>
              <CardDescription>{e.dataset}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Statut</p><Badge variant={statusMeta[e.status].variant}>{statusMeta[e.status].label}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Branche</p><p className="font-mono">{e.branch}</p></div>
              <div><p className="text-xs text-muted-foreground">URL</p><p className="font-mono text-xs break-all">{e.url}</p></div>
              <div><p className="text-xs text-muted-foreground">Version</p><Badge variant="outline">{e.version}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Uptime 30j</p><p className="font-semibold">{e.uptime}</p></div>
              <div><p className="text-xs text-muted-foreground">Dernier déploiement</p><p>{e.lastDeploy}</p></div>

              <div className="flex flex-wrap gap-2 pt-1">
                {e.name !== 'Production' && (
                  <Button size="sm" variant="outline" onClick={() => promote(e)} disabled={e.status === 'frozen'}>
                    <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" /> Promouvoir
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => rollback(e)}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rollback
                </Button>
                <Button size="sm" variant="ghost" onClick={() => freeze(e)}>
                  <Snowflake className="mr-1.5 h-3.5 w-3.5" /> {e.status === 'frozen' ? 'Dégeler' : 'Geler'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => healthCheck(e)}>
                  <Activity className="mr-1.5 h-3.5 w-3.5" /> Health check
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <a href={`https://${e.url}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ouvrir
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des releases</CardTitle>
          <CardDescription>Promotions et rollbacks par environnement.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Environnement</TableHead>
                <TableHead className="hidden md:table-cell">Auteur</TableHead>
                <TableHead className="hidden md:table-cell">Quand</TableHead>
                <TableHead className="text-right">Résultat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RELEASES.map((r) => (
                <TableRow key={`${r.version}-${r.env}`}>
                  <TableCell className="font-mono text-xs">{r.version}</TableCell>
                  <TableCell>{r.env}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.author}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.at}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={r.status === 'success' ? 'default' : 'secondary'}>
                      {r.status === 'success' ? 'Succès' : 'Rollback'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
