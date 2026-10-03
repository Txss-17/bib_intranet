import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Github, GitBranch, GitPullRequest, GitMerge, RefreshCw, ExternalLink, Check, Code2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const REPOS = [
  { name: 'bib-intranet', branch: 'main', lastCommit: 'feat: sandbox isolée pôle Tech', author: 'cto', ci: 'success' },
  { name: 'bib-business-os', branch: 'main', lastCommit: 'fix: pipeline commandes', author: 'dev_fullstack', ci: 'success' },
  { name: 'bib-audit-hub', branch: 'main', lastCommit: 'chore: mirror intake', author: 'devops', ci: 'running' },
];

const BRANCHES = [
  { name: 'main', ahead: 0, behind: 0, env: 'Production', protectedBranch: true },
  { name: 'staging', ahead: 12, behind: 0, env: 'Staging', protectedBranch: false },
  { name: 'develop', ahead: 27, behind: 3, env: 'Development', protectedBranch: false },
  { name: 'feat/sandbox-isolation', ahead: 5, behind: 1, env: '—', protectedBranch: false },
];

const PRS = [
  { id: 214, title: 'Isolation stricte des données sandbox', author: 'cto', from: 'feat/sandbox-isolation', to: 'develop', checks: 'success', reviews: 1 },
  { id: 213, title: 'Centre de synchronisation des intégrations', author: 'devops', from: 'feat/integrations', to: 'develop', checks: 'success', reviews: 2 },
  { id: 211, title: 'Supervision temps réel', author: 'sre', from: 'feat/monitoring', to: 'staging', checks: 'running', reviews: 0 },
];

export default function TechCode() {
  const [merged, setMerged] = useState<number[]>([]);

  const act = (title: string, description: string) => toast({ title, description });

  const mergePr = (id: number, title: string) => {
    setMerged((p) => [...p, id]);
    act(`PR #${id} fusionnée`, title);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><Code2 className="h-7 w-7" /> Code & GitHub</h1>
        <p className="text-muted-foreground">Dépôts, branches, pull requests et CI de la plateforme</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dépôts</CardTitle>
            <CardDescription>Synchronisation bidirectionnelle GitHub ↔ plateforme.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => act('Synchronisation lancée', 'Dépôts en cours de rafraîchissement.')}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Synchroniser
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dépôt</TableHead>
                <TableHead className="hidden md:table-cell">Dernier commit</TableHead>
                <TableHead>CI</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REPOS.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-muted-foreground" /> {r.name}
                      <Badge variant="outline" className="font-mono text-xs">{r.branch}</Badge>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {r.lastCommit} · {r.author}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.ci === 'success' ? 'default' : 'secondary'}>
                      {r.ci === 'success' ? '🟢 Vert' : '🟠 En cours'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => act(`Pipeline relancé — ${r.name}`, 'Build et tests en cours.')}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Relancer CI
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`https://github.com/search?q=${r.name}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ouvrir
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><GitBranch className="h-4 w-4" /> Branches</CardTitle>
            <CardDescription>Correspondance branche ↔ environnement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {BRANCHES.map((b) => (
              <div key={b.name} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="font-mono text-sm">{b.name}{b.protectedBranch && ' 🔒'}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.env} · +{b.ahead} / -{b.behind}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => act(`Comparaison — ${b.name}`, `${b.ahead} commits en avance, ${b.behind} en retard.`)}>
                    Comparer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={b.protectedBranch}
                    onClick={() => act(`Déploiement demandé — ${b.name}`, `Cible : ${b.env}.`)}
                  >
                    Déployer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><GitPullRequest className="h-4 w-4" /> Pull requests</CardTitle>
            <CardDescription>Revue de code et fusion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRS.map((pr) => (
              <div key={pr.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">#{pr.id} {pr.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {pr.from} → {pr.to} · {pr.author} · {pr.reviews} revue(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={pr.checks === 'success' ? 'default' : 'secondary'}>
                    {pr.checks === 'success' ? 'Checks OK' : 'Checks en cours'}
                  </Badge>
                  {merged.includes(pr.id) ? (
                    <Badge variant="outline"><Check className="mr-1 h-3 w-3" /> Fusionnée</Badge>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => act(`Revue enregistrée — PR #${pr.id}`, 'Approbation ajoutée.')}>
                        Approuver
                      </Button>
                      <Button size="sm" disabled={pr.checks !== 'success'} onClick={() => mergePr(pr.id, pr.title)}>
                        <GitMerge className="mr-1.5 h-3.5 w-3.5" /> Fusionner
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
