import {
  Copy,
  Database,
  Download,
  FlaskConical,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { toast } from '@/hooks/use-toast';
import {
  SANDBOX_SPACES,
  domainsForSpace,
  DOMAIN_LABELS,
} from '@/data/sandboxSeed';
import { useSandbox } from '@/hooks/useSandbox';

interface Scenario {
  id: string;
  name: string;
  poles: string;
  steps: number;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'supplier-onboarding',
    name: 'Onboarding fournisseur complet',
    poles: 'Fournisseurs & Produits → Qualité & Audit → Opérations & Logistique',
    steps: 6,
  },
  {
    id: 'marketplace-order',
    name: 'Commande marketplace → livraison',
    poles: 'Marketplace & Customer → Opérations & Logistique → Finance',
    steps: 8,
  },
  {
    id: 'non-compliance',
    name: 'Non-conformité & traitement',
    poles: 'Qualité & Audit → Conformité & Juridique → Direction',
    steps: 5,
  },
  {
    id: 'permissions',
    name: 'Test des permissions par rôle',
    poles: 'Security & IT → RH → tous les périmètres concernés',
    steps: 12,
  },
  {
    id: 'security-alerts',
    name: 'Alertes de sécurité & notifications',
    poles: 'Security & IT → Direction',
    steps: 4,
  },
  {
    id: 'payroll',
    name: 'Cycle RH & Finance',
    poles: 'RH → Finance',
    steps: 7,
  },
  {
    id: 'incident',
    name: 'Incident technique → résolution',
    poles: 'Security & IT → Produit & Engineering → Direction',
    steps: 9,
  },
];

export default function SecuritySandbox() {
  const {
    isSandbox,
    setEnabled,
    spaces,
    events,
    seedSpace,
    cleanSpace,
    seedAll,
    resetAll,
    dataset,
    createDemoCompany,
    logEvent,
    totalRecords,
    demoCompany,
  } = useSandbox();

  const notify = (
    title: string,
    description?: string,
  ) => {
    logEvent(title, description);

    toast({
      title,
      description:
        description ??
        'Action simulée — aucune donnée de production affectée.',
    });
  };

  const runScenario = (
    scenario: Scenario,
  ) => {
    notify(
      `Scénario exécuté — ${scenario.name}`,
      `${scenario.steps} étapes simulées dans l’environnement isolé.`,
    );
  };

  const duplicateScenario = (
    scenario: Scenario,
  ) => {
    notify(
      `Scénario dupliqué — ${scenario.name}`,
      'Une copie de simulation a été préparée dans l’environnement Sandbox.',
    );
  };

  const exportLog = () => {
    const content =
      events.length > 0
        ? events
            .map(
              (event) =>
                `${new Date(event.at).toISOString()} | ${event.label}${
                  event.detail
                    ? ` | ${event.detail}`
                    : ''
                }`,
            )
            .join('\n')
        : 'Aucun évènement';

    const blob = new Blob(
      [content],
      {
        type: 'text/plain;charset=utf-8',
      },
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `sandbox-journal-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`;

    anchor.click();

    URL.revokeObjectURL(url);

    toast({
      title: 'Journal exporté',
      description:
        'Journal des actions de simulation téléchargé.',
    });
  };

  const handleSandboxToggle = (
    enabled: boolean,
  ) => {
    setEnabled(enabled);

    if (enabled) {
      toast({
        title: 'Sandbox activée',
        description:
          'Les prochaines actions sont exécutées dans l’environnement de simulation.',
      });
    } else {
      toast({
        title: 'Sandbox désactivée',
        description:
          'Retour à l’environnement de production.',
      });
    }
  };

  return (
    <div className="relative space-y-6 animate-fade-in">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-[0.05]"
      >
        <span className="absolute left-1/2 top-1/3 -translate-x-1/2 -rotate-12 text-[8rem] font-black uppercase tracking-widest">
          Sandbox
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-7 w-7" />

              <h1 className="text-3xl font-bold">
                Sandbox Security & IT
              </h1>
            </div>

            <p className="mt-1 text-muted-foreground">
              Environnement isolé destiné aux simulations,
              tests techniques, contrôles d'accès et scénarios
              inter-pôles.
            </p>
          </div>

          <Badge
            variant="outline"
            className="gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Données simulées
          </Badge>
        </div>

        <Card
          className={
            isSandbox
              ? 'border-warning/60'
              : undefined
          }
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              {isSandbox ? (
                <FlaskConical className="h-5 w-5 text-warning" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-success" />
              )}

              <div>
                <p className="text-sm font-semibold">
                  Environnement actif :{' '}
                  {isSandbox
                    ? 'Sandbox — simulation'
                    : 'Production — données réelles'}
                </p>

                <p className="text-xs text-muted-foreground">
                  {isSandbox
                    ? `${totalRecords} enregistrement${
                        totalRecords > 1
                          ? 's'
                          : ''
                      } fictif${
                        totalRecords > 1
                          ? 's'
                          : ''
                      } isolé${
                        totalRecords > 1
                          ? 's'
                          : ''
                      }.`
                    : 'Les données de simulation sont désactivées.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label
                htmlFor="sandbox-mode"
                className="text-sm"
              >
                Activer la Sandbox
              </Label>

              <Switch
                id="sandbox-mode"
                checked={isSandbox}
                onCheckedChange={handleSandboxToggle}
              />
            </div>
          </CardContent>
        </Card>

        <Alert className="border-warning/50 bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />

          <AlertTitle>
            Cloisonnement strict
          </AlertTitle>

          <AlertDescription>
            Les comptes, transactions, notifications,
            événements et KPI utilisés dans cet espace sont
            fictifs. Les scénarios Sandbox ne doivent pas
            recopier de données personnelles ou opérationnelles
            réelles.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button onClick={seedAll}>
            <Database className="mr-2 h-4 w-4" />
            Charger le jeu de démonstration
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              createDemoCompany();

              notify(
                'Entreprise de démonstration créée',
                'Une organisation fictive a été ajoutée à la Sandbox.',
              );
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Créer une entreprise de démo
          </Button>

          <Button
            variant="outline"
            asChild
          >
            <Link to="/pole/security/access">
              <Users className="mr-2 h-4 w-4" />
              Accès & identités
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={exportLog}
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter le journal
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              resetAll();

              toast({
                title: 'Sandbox réinitialisée',
                description:
                  'Les données et scénarios simulés ont été réinitialisés.',
              });
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {demoCompany && (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span>
                Entreprise de démonstration :{' '}
                <span className="font-semibold">
                  {demoCompany.name}
                </span>
              </span>

              <Badge variant="secondary">
                créée{' '}
                {formatDistanceToNow(
                  new Date(
                    demoCompany.createdAt,
                  ),
                  {
                    addSuffix: true,
                    locale: fr,
                  },
                )}
              </Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Espaces isolés par pôle
            </CardTitle>

            <CardDescription>
              Chaque périmètre dispose de données fictives
              indépendantes. Aucun espace Sandbox ne doit
              modifier les données de production.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SANDBOX_SPACES.map((space) => {
              const state = spaces[space.id] ?? {
                seeded: false,
                records: 0,
              };

              return (
                <div
                  key={space.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {space.name}
                    </p>

                    <Badge
                      variant={
                        state.seeded
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {state.seeded
                        ? `${state.records} enreg.`
                        : 'Vide'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {space.desc}
                  </p>

                  {state.seededAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Généré{' '}
                      {formatDistanceToNow(
                        new Date(
                          state.seededAt,
                        ),
                        {
                          addSuffix: true,
                          locale: fr,
                        },
                      )}
                    </p>
                  )}

                  {state.seeded && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {domainsForSpace(
                        space.id,
                      ).map((domain) => (
                        <Badge
                          key={domain}
                          variant="outline"
                          className="text-[10px] font-normal"
                        >
                          {DOMAIN_LABELS[domain]}
                          {' · '}
                          {dataset(domain).length}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Separator className="my-3" />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        seedSpace(space.id);

                        notify(
                          `Jeu de données généré — ${space.name}`,
                          'Les données fictives ont été préparées dans cet espace isolé.',
                        );
                      }}
                    >
                      <Database className="mr-1.5 h-3.5 w-3.5" />
                      Générer
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!state.seeded}
                      onClick={() => {
                        cleanSpace(space.id);

                        notify(
                          `Espace nettoyé — ${space.name}`,
                          'Les données simulées de cet espace ont été supprimées.',
                        );
                      }}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Nettoyer
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Scénarios de test
            </CardTitle>

            <CardDescription>
              Simulation de workflows, permissions, incidents
              et échanges entre les pôles B.I.B.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            {SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {scenario.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {scenario.poles}
                    {' · '}
                    {scenario.steps} étapes
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runScenario(
                        scenario,
                      )
                    }
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Exécuter
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      duplicateScenario(
                        scenario,
                      )
                    }
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Dupliquer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Journal de simulation
            </CardTitle>

            <CardDescription>
              Traçabilité des actions réalisées dans
              l'environnement isolé.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune action de simulation enregistrée.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Action
                      </TableHead>

                      <TableHead className="hidden md:table-cell">
                        Détail
                      </TableHead>

                      <TableHead className="text-right">
                        Quand
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {events
                      .slice(0, 15)
                      .map((event) => (
                        <TableRow
                          key={event.id}
                        >
                          <TableCell className="font-medium text-sm">
                            {event.label}
                          </TableCell>

                          <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                            {event.detail ??
                              '—'}
                          </TableCell>

                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(
                                event.at,
                              ),
                              {
                                addSuffix: true,
                                locale: fr,
                              },
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Alert>
          <ShieldCheck className="h-4 w-4" />

          <AlertTitle>
            Règle d'utilisation
          </AlertTitle>

          <AlertDescription>
            La Sandbox sert à tester les comportements de
            l'intranet, les permissions, les workflows et les
            intégrations avec des données fictives. Toute
            opération nécessitant une donnée réelle doit être
            réalisée dans les procédures et environnements
            appropriés.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}