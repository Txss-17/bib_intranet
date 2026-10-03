import { useState } from 'react';
import {
  Check,
  Code2,
  ExternalLink,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Github,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

type CiStatus = 'success' | 'running';

interface Repository {
  name: string;
  branch: string;
  lastCommit: string;
  author: string;
  ci: CiStatus;
  visibility: 'private';
}

interface Branch {
  name: string;
  ahead: number;
  behind: number;
  environment: 'Production' | 'Staging' | 'Development' | 'Sandbox';
  protectedBranch: boolean;
}

interface PullRequest {
  id: number;
  title: string;
  author: string;
  from: string;
  to: string;
  checks: CiStatus;
  reviews: number;
  securityReview: boolean;
}

const REPOSITORIES: Repository[] = [
  {
    name: 'bib_intranet',
    branch: 'main',
    lastCommit: 'feat: sécurisation des accès internes',
    author: 'product-engineering',
    ci: 'success',
    visibility: 'private',
  },
  {
    name: 'bib_platform',
    branch: 'main',
    lastCommit: 'fix: contrôle des permissions',
    author: 'product-engineering',
    ci: 'success',
    visibility: 'private',
  },
  {
    name: 'bib_security',
    branch: 'main',
    lastCommit: 'chore: journalisation sécurité',
    author: 'security-it',
    ci: 'running',
    visibility: 'private',
  },
];

const BRANCHES: Branch[] = [
  {
    name: 'main',
    ahead: 0,
    behind: 0,
    environment: 'Production',
    protectedBranch: true,
  },
  {
    name: 'staging',
    ahead: 12,
    behind: 0,
    environment: 'Staging',
    protectedBranch: true,
  },
  {
    name: 'develop',
    ahead: 27,
    behind: 3,
    environment: 'Development',
    protectedBranch: false,
  },
  {
    name: 'sandbox/security-validation',
    ahead: 5,
    behind: 1,
    environment: 'Sandbox',
    protectedBranch: false,
  },
];

const PULL_REQUESTS: PullRequest[] = [
  {
    id: 214,
    title: 'Renforcement des permissions internes',
    author: 'security-it',
    from: 'feat/access-hardening',
    to: 'develop',
    checks: 'success',
    reviews: 2,
    securityReview: true,
  },
  {
    id: 213,
    title: 'Journalisation des actions sensibles',
    author: 'product-engineering',
    from: 'feat/security-audit-log',
    to: 'develop',
    checks: 'success',
    reviews: 2,
    securityReview: true,
  },
  {
    id: 211,
    title: 'Supervision des services critiques',
    author: 'security-it',
    from: 'feat/service-monitoring',
    to: 'staging',
    checks: 'running',
    reviews: 1,
    securityReview: false,
  },
];

export default function SecurityCode() {
  const [mergedPullRequests, setMergedPullRequests] = useState<number[]>([]);

  const notify = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  const synchronizeRepositories = () => {
    notify(
      'Synchronisation lancée',
      'Les dépôts privés et leurs statuts CI sont en cours de rafraîchissement.',
    );
  };

  const restartCi = (repository: Repository) => {
    notify(
      `Pipeline relancé — ${repository.name}`,
      'Build, tests et contrôles de sécurité en cours.',
    );
  };

  const compareBranch = (branch: Branch) => {
    notify(
      `Comparaison — ${branch.name}`,
      `${branch.ahead} commit(s) en avance · ${branch.behind} commit(s) en retard.`,
    );
  };

  const requestDeployment = (branch: Branch) => {
    notify(
      `Déploiement demandé — ${branch.name}`,
      `Cible : ${branch.environment}. La demande reste soumise aux contrôles et validations requis.`,
    );
  };

  const recordReview = (pullRequest: PullRequest) => {
    notify(
      `Revue enregistrée — PR #${pullRequest.id}`,
      pullRequest.securityReview
        ? 'Revue technique et sécurité enregistrée.'
        : 'Revue technique enregistrée ; une revue sécurité peut encore être requise.',
    );
  };

  const mergePullRequest = (pullRequest: PullRequest) => {
    if (pullRequest.checks !== 'success') {
      return;
    }

    if (!pullRequest.securityReview) {
      notify(
        `Fusion bloquée — PR #${pullRequest.id}`,
        'Une revue sécurité est requise avant la fusion.',
      );
      return;
    }

    setMergedPullRequests((current) =>
      current.includes(pullRequest.id)
        ? current
        : [...current, pullRequest.id],
    );

    notify(
      `PR #${pullRequest.id} fusionnée`,
      pullRequest.title,
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="h-7 w-7" />
            <h1 className="text-3xl font-bold">
              Code & dépôts
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Security & IT — dépôts privés, branches, CI/CD et contrôles
            de sécurité.
          </p>
        </div>

        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Contrôles sécurité actifs
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Dépôts privés</CardTitle>
            <CardDescription>
              Vue de supervision des dépôts utilisés par B.I.B et de
              leurs pipelines.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={synchronizeRepositories}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Synchroniser
          </Button>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dépôt</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Dernier commit
                  </TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>Visibilité</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {REPOSITORIES.map((repository) => (
                  <TableRow key={repository.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-muted-foreground" />

                        <span>{repository.name}</span>

                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {repository.branch}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {repository.lastCommit}
                      {' · '}
                      {repository.author}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          repository.ci === 'success'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {repository.ci === 'success'
                          ? 'CI OK'
                          : 'CI en cours'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        Dépôt privé
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            restartCi(repository)
                          }
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          CI
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a
                            href={`https://github.com/search?q=${encodeURIComponent(
                              repository.name,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Ouvrir
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4" />
              Branches & environnements
            </CardTitle>

            <CardDescription>
              État des branches et contrôles appliqués selon
              l'environnement.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {BRANCHES.map((branch) => (
              <div
                key={branch.name}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">
                      {branch.name}
                    </p>

                    {branch.protectedBranch && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        Protégée
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {branch.environment}
                    {' · '}
                    +{branch.ahead}
                    {' / '}
                    -{branch.behind}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => compareBranch(branch)}
                  >
                    Comparer
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={branch.protectedBranch}
                    onClick={() =>
                      requestDeployment(branch)
                    }
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
            <CardTitle className="flex items-center gap-2 text-base">
              <GitPullRequest className="h-4 w-4" />
              Pull requests
            </CardTitle>

            <CardDescription>
              Revue de code, contrôles CI et validation sécurité.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {PULL_REQUESTS.map((pullRequest) => {
              const isMerged = mergedPullRequests.includes(
                pullRequest.id,
              );

              return (
                <div
                  key={pullRequest.id}
                  className="space-y-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        #{pullRequest.id}{' '}
                        {pullRequest.title}
                      </p>

                      {pullRequest.securityReview && (
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Revue sécurité
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {pullRequest.from}
                      {' → '}
                      {pullRequest.to}
                      {' · '}
                      {pullRequest.author}
                      {' · '}
                      {pullRequest.reviews} revue
                      {pullRequest.reviews > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          pullRequest.checks === 'success'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {pullRequest.checks === 'success'
                          ? 'Checks OK'
                          : 'Checks en cours'}
                      </Badge>

                      {!pullRequest.securityReview && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          Revue sécurité requise
                        </Badge>
                      )}
                    </div>

                    {isMerged ? (
                      <Badge variant="outline">
                        <Check className="mr-1 h-3 w-3" />
                        Fusionnée
                      </Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            recordReview(pullRequest)
                          }
                        >
                          Approuver
                        </Button>

                        <Button
                          size="sm"
                          disabled={
                            pullRequest.checks !== 'success'
                          }
                          onClick={() =>
                            mergePullRequest(pullRequest)
                          }
                        >
                          <GitMerge className="mr-1.5 h-3.5 w-3.5" />
                          Fusionner
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

          <div>
            <p className="font-medium">
              Contrôle de sécurité
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Les branches de production sont protégées. Les
              modifications sensibles peuvent nécessiter une revue
              Security & IT avant déploiement ou fusion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}