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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plug,
  Plus,
  Pencil,
  Power,
  Trash2,
  Copy,
  FlaskConical,
  RefreshCw,
  ScrollText,
  BarChart3,
  ShieldCheck,
  RotateCcw,
  Search,
  BookOpen,
  Store,
  Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PlatformBridgeCard } from '@/components/tech/PlatformBridgeCard';

type ProjectId =
  | 'marketplace'
  | 'intranet'
  | 'audit-hub'
  | 'business-os'
  | 'global';

const PROJECTS: { id: ProjectId; label: string }[] = [
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'intranet', label: 'Intranet' },
  { id: 'audit-hub', label: 'Audit Hub' },
  { id: 'business-os', label: 'Business OS' },
  { id: 'global', label: 'Intégrations globales' },
];

interface Integration {
  id: string;
  name: string;
  description: string;
  project: ProjectId;
  environments: string[];
  version: string;
  owner: string;
  category: string;
  status: 'connected' | 'disabled' | 'pending' | 'error';
  authType: 'api_key' | 'oauth' | 'jwt';
  url: string;
  timeout: number;
  retry: number;
  autoSync: boolean;
  region: string;
  mode: 'production' | 'sandbox';
  secrets: string[];
  dependencies: string[];
  lastSync: string;
  calls24h: number;
  errorRate: number;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const base = (
  options: Partial<Integration> & {
    name: string;
    project: ProjectId;
    category: string;
  },
): Integration => ({
  id: uid(),
  description: `Connecteur ${options.name}`,
  environments: ['production', 'staging'],
  version: 'v1.0',
  owner: 'Pôle Produit & Engineering',
  status: 'connected',
  authType: 'api_key',
  url: `https://api.${options.name
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.com`,
  timeout: 30,
  retry: 3,
  autoSync: true,
  region: 'eu-west-3',
  mode: 'production',
  secrets: ['API_KEY'],
  dependencies: [],
  lastSync: "Aujourd'hui 08:12",
  calls24h: 1200 + Math.floor(Math.random() * 8000),
  errorRate: Number((Math.random() * 1.4).toFixed(2)),
  ...options,
});

const INITIAL: Integration[] = [
  base({
    name: 'Stripe',
    project: 'marketplace',
    category: 'Paiement',
    secrets: ['SECRET_KEY', 'WEBHOOK_SECRET'],
    status: 'pending',
    dependencies: ['Facturation'],
  }),
  base({
    name: 'Backend Marketplace',
    project: 'marketplace',
    category: 'Stockage',
    secrets: ['SERVICE_ROLE_KEY'],
  }),
  base({
    name: 'Cloudflare',
    project: 'marketplace',
    category: 'Développement',
  }),
  base({
    name: 'API Transporteurs',
    project: 'marketplace',
    category: 'Automatisation',
    dependencies: ['Backend Marketplace'],
  }),
  base({
    name: 'GitHub',
    project: 'intranet',
    category: 'Développement',
    authType: 'oauth',
    secrets: ['CLIENT_ID', 'CLIENT_SECRET'],
  }),
  base({
    name: 'Backend Intranet',
    project: 'intranet',
    category: 'Stockage',
  }),
  base({
    name: 'Lovable',
    project: 'intranet',
    category: 'Développement',
  }),
  base({
    name: 'Google Workspace',
    project: 'intranet',
    category: 'Communication',
    authType: 'oauth',
  }),
  base({
    name: 'IA (Gateway)',
    project: 'intranet',
    category: 'IA',
  }),
  base({
    name: 'BigQuery',
    project: 'intranet',
    category: 'Analytics',
  }),
  base({
    name: 'Google Maps',
    project: 'audit-hub',
    category: 'Analytics',
  }),
  base({
    name: 'Signature électronique',
    project: 'audit-hub',
    category: 'Automatisation',
  }),
  base({
    name: 'Backend Audit Hub',
    project: 'audit-hub',
    category: 'Stockage',
    dependencies: ['Backend Intranet'],
  }),
  base({
    name: 'ERP',
    project: 'business-os',
    category: 'ERP',
  }),
  base({
    name: 'CRM',
    project: 'business-os',
    category: 'CRM',
  }),
  base({
    name: 'Banque',
    project: 'business-os',
    category: 'Paiement',
    status: 'error',
  }),
  base({
    name: 'Facturation',
    project: 'business-os',
    category: 'Paiement',
  }),
  base({
    name: 'SMTP transactionnel',
    project: 'global',
    category: 'Communication',
  }),
  base({
    name: 'SSO',
    project: 'global',
    category: 'Développement',
    authType: 'jwt',
    secrets: ['JWT_SECRET'],
  }),
  base({
    name: 'Monitoring',
    project: 'global',
    category: 'Analytics',
  }),
  base({
    name: 'Gestion des secrets',
    project: 'global',
    category: 'Développement',
  }),
];

const CATEGORIES = [
  'Paiement',
  'Communication',
  'IA',
  'CRM',
  'ERP',
  'Stockage',
  'Analytics',
  'Développement',
  'Automatisation',
];

const MARKETPLACE = [
  {
    name: 'Twilio',
    category: 'Communication',
    prereq: 'Compte Twilio + numéro vérifié',
    compat: 'Compatible',
  },
  {
    name: 'HubSpot',
    category: 'CRM',
    prereq: 'Clé privée app HubSpot',
    compat: 'Compatible',
  },
  {
    name: 'Slack',
    category: 'Communication',
    prereq: 'App Slack + scopes chat:write',
    compat: 'Compatible',
  },
  {
    name: 'Sentry',
    category: 'Analytics',
    prereq: 'DSN projet',
    compat: 'Compatible',
  },
  {
    name: 'OpenAI',
    category: 'IA',
    prereq: 'Clé API',
    compat: 'Via passerelle IA',
  },
  {
    name: 'SAP',
    category: 'ERP',
    prereq: 'Connecteur on-premise',
    compat: 'Compatibilité à valider',
  },
  {
    name: 'AWS S3',
    category: 'Stockage',
    prereq: 'IAM + bucket',
    compat: 'Compatible',
  },
  {
    name: 'Zapier',
    category: 'Automatisation',
    prereq: 'Webhook sortant',
    compat: 'Compatible',
  },
];

const statusMeta: Record<
  Integration['status'],
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  connected: {
    label: '🟢 Connecté',
    variant: 'default',
  },
  pending: {
    label: '🟠 À vérifier',
    variant: 'secondary',
  },
  error: {
    label: '🔴 Erreur',
    variant: 'destructive',
  },
  disabled: {
    label: '⚪ Désactivé',
    variant: 'outline',
  },
};

export default function ProductIntegrations() {
  const [items, setItems] = useState<Integration[]>(INITIAL);
  const [project, setProject] = useState<ProjectId | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Integration | null>(null);
  const [logsFor, setLogsFor] = useState<Integration | null>(null);
  const [marketCat, setMarketCat] = useState('all');
  const [marketSearch, setMarketSearch] = useState('');

  const act = (title: string, description: string) =>
    toast({
      title,
      description,
    });

  const filtered = useMemo(
    () =>
      items.filter(
        (integration) =>
          (project === 'all' || integration.project === project) &&
          (integration.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
            integration.category
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [items, project, search],
  );

  const upsert = (integration: Integration) =>
    setItems((list) =>
      list.some((item) => item.id === integration.id)
        ? list.map((item) =>
            item.id === integration.id ? integration : item,
          )
        : [integration, ...list],
    );

  const newIntegration = (): Integration =>
    base({
      name: 'Nouvelle intégration',
      project: project === 'all' ? 'global' : project,
      category: 'Développement',
      status: 'pending',
    });

  const toggleStatus = (integration: Integration) => {
    const next: Integration['status'] =
      integration.status === 'disabled' ? 'connected' : 'disabled';

    upsert({
      ...integration,
      status: next,
    });

    act(
      `${next === 'disabled' ? 'Désactivée' : 'Réactivée'} — ${
        integration.name
      }`,
      'État de l’intégration mis à jour.',
    );
  };

  return (
    <div className="space-y-6">
      <PlatformBridgeCard />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Plug className="h-7 w-7" />
            Intégrations Produit & Engineering
          </h1>

          <p className="text-muted-foreground">
            Centre d’administration des connecteurs : configuration,
            secrets, synchronisation et tests — classés par projet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/pole/product/documentation">
              <BookOpen className="mr-1.5 h-4 w-4" />
              Documentation
            </Link>
          </Button>

          <Button onClick={() => setEditing(newIntegration())}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter une intégration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin">Administration</TabsTrigger>

          <TabsTrigger value="market">
            <Store className="mr-1.5 h-3.5 w-3.5" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Rechercher une intégration…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select
              value={project}
              onValueChange={(value) =>
                setProject(value as ProjectId | 'all')
              }
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>

                {PROJECTS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {PROJECTS.filter(
            (item) => project === 'all' || item.id === project,
          ).map((item) => {
            const list = filtered.filter(
              (integration) => integration.project === item.id,
            );

            if (!list.length) return null;

            return (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {item.label}
                  </CardTitle>

                  <CardDescription>
                    {list.length} intégration(s) · clés chiffrées,
                    masquées et versionnées.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {list.map((integration) => (
                    <div
                      key={integration.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-2 font-medium">
                            {integration.name}

                            <Badge
                              variant={
                                statusMeta[integration.status].variant
                              }
                            >
                              {statusMeta[integration.status].label}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {integration.version}
                            </Badge>
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {integration.category} · Responsable{' '}
                            {integration.owner} · Env. :{' '}
                            {integration.environments.join(', ')} · Synchro{' '}
                            {integration.lastSync}
                            {integration.dependencies.length > 0 &&
                              ` · Dépend de : ${integration.dependencies.join(
                                ', ',
                              )}`}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditing(integration)}
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Modifier
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(
                                `Test de connexion — ${integration.name}`,
                                `Réponse 200 en ${
                                  80 + Math.floor(Math.random() * 300)
                                } ms.`,
                              )
                            }
                          >
                            <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                            Tester
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              upsert({
                                ...integration,
                                lastSync: 'À l’instant',
                              });

                              act(
                                `Synchronisation — ${integration.name}`,
                                'Synchronisation immédiate lancée.',
                              );
                            }}
                          >
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Synchroniser
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLogsFor(integration)}
                          >
                            <ScrollText className="mr-1.5 h-3.5 w-3.5" />
                            Logs
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(
                                `Statistiques — ${integration.name}`,
                                `${integration.calls24h} appels / 24 h · ${integration.errorRate}% d'erreurs.`,
                              )
                            }
                          >
                            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                            Stats
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              act(
                                `Permissions — ${integration.name}`,
                                `Auth ${integration.authType.toUpperCase()} · secrets : ${integration.secrets.join(
                                  ', ',
                                )}.`,
                              )
                            }
                          >
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Permissions
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleStatus(integration)}
                          >
                            <Power className="mr-1.5 h-3.5 w-3.5" />
                            {integration.status === 'disabled'
                              ? 'Réactiver'
                              : 'Désactiver'}
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              upsert({
                                ...base({
                                  ...integration,
                                  name: `${integration.name} (copie)`,
                                  project: integration.project,
                                  category: integration.category,
                                }),
                                id: uid(),
                                status: 'pending',
                              });

                              act(
                                `Clonée — ${integration.name}`,
                                'Copie créée en état « à vérifier ».',
                              );
                            }}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Cloner
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              upsert({
                                ...integration,
                                timeout: 30,
                                retry: 3,
                                autoSync: true,
                                mode: 'production',
                              });

                              act(
                                `Configuration réinitialisée — ${integration.name}`,
                                'Paramètres remis aux valeurs par défaut.',
                              );
                            }}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Réinitialiser
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setItems((list) =>
                                list.filter(
                                  (item) => item.id !== integration.id,
                                ),
                              );

                              act(
                                `Supprimée — ${integration.name}`,
                                'Intégration retirée du projet.',
                              );
                            }}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {!filtered.length && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucune intégration ne correspond à la recherche.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="market" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Rechercher un connecteur…"
                value={marketSearch}
                onChange={(event) =>
                  setMarketSearch(event.target.value)
                }
              />
            </div>

            <Select
              value={marketCat}
              onValueChange={setMarketCat}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Toutes catégories
                </SelectItem>

                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {MARKETPLACE.filter(
              (item) =>
                (marketCat === 'all' ||
                  item.category === marketCat) &&
                item.name
                  .toLowerCase()
                  .includes(marketSearch.toLowerCase()),
            ).map((item) => (
              <Card key={item.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {item.name}

                    <Badge variant="outline">
                      {item.category}
                    </Badge>
                  </CardTitle>

                  <CardDescription>
                    Prérequis : {item.prereq}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.compat}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => {
                      upsert(
                        base({
                          name: item.name,
                          project:
                            project === 'all' ? 'global' : project,
                          category: item.category,
                          status: 'pending',
                        }),
                      );

                      act(
                        `Connecteur installé — ${item.name}`,
                        'Configurez les secrets pour l’activer.',
                      );
                    }}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Installer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <IntegrationDialog
        integration={editing}
        onClose={() => setEditing(null)}
        onSave={(integration) => {
          upsert(integration);
          setEditing(null);

          act(
            `Intégration enregistrée — ${integration.name}`,
            'Configuration et secrets versionnés.',
          );
        }}
      />

      <Dialog
        open={!!logsFor}
        onOpenChange={(open) => !open && setLogsFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Logs — {logsFor?.name}
            </DialogTitle>

            <DialogDescription>
              Dernières requêtes du connecteur.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-1 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
            <p>
              [INFO] 08:24:15 Connexion établie ({logsFor?.url})
            </p>
            <p>
              [OK] 08:24:16 Handshake auth{' '}
              {logsFor?.authType.toUpperCase()}
            </p>
            <p>
              [INFO] 08:24:18 Synchronisation : 128 enregistrements
            </p>
            <p>
              [WARN] 08:24:20 Latence élevée (642 ms)
            </p>
            <p>
              [OK] 08:24:22 Terminé — {logsFor?.errorRate}% d'erreurs
              sur 24 h
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationDialog({
  integration,
  onClose,
  onSave,
}: {
  integration: Integration | null;
  onClose: () => void;
  onSave: (integration: Integration) => void;
}) {
  const [draft, setDraft] = useState<Integration | null>(
    integration,
  );

  const current =
    draft?.id === integration?.id ? draft : integration;

  if (!integration || !current) return null;

  const set = (patch: Partial<Integration>) =>
    setDraft({
      ...current,
      ...patch,
    });

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{current.name}</DialogTitle>

          <DialogDescription>
            Configuration, authentification, paramètres et outils.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config">
          <TabsList className="flex-wrap">
            <TabsTrigger value="config">
              Configuration
            </TabsTrigger>

            <TabsTrigger value="auth">
              Authentification
            </TabsTrigger>

            <TabsTrigger value="params">
              Paramètres
            </TabsTrigger>

            <TabsTrigger value="tools">
              Outils
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="config"
            className="mt-4 space-y-3"
          >
            <Field label="Nom">
              <Input
                value={current.name}
                onChange={(event) =>
                  set({
                    name: event.target.value,
                  })
                }
              />
            </Field>

            <Field label="Description">
              <Textarea
                value={current.description}
                onChange={(event) =>
                  set({
                    description: event.target.value,
                  })
                }
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Projet">
                <Select
                  value={current.project}
                  onValueChange={(value) =>
                    set({
                      project: value as ProjectId,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {PROJECTS.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Environnement principal">
                <Select
                  value={current.environments[0]}
                  onValueChange={(value) =>
                    set({
                      environments: [
                        value,
                        ...current.environments.slice(1),
                      ],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {[
                      'production',
                      'staging',
                      'development',
                      'sandbox',
                    ].map((environment) => (
                      <SelectItem
                        key={environment}
                        value={environment}
                      >
                        {environment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Version">
                <Input
                  value={current.version}
                  onChange={(event) =>
                    set({
                      version: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Responsable">
                <Input
                  value={current.owner}
                  onChange={(event) =>
                    set({
                      owner: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Catégorie">
                <Select
                  value={current.category}
                  onValueChange={(value) =>
                    set({
                      category: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem
                        key={category}
                        value={category}
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </TabsContent>

          <TabsContent
            value="auth"
            className="mt-4 space-y-3"
          >
            <Field label="Type d'authentification">
              <Select
                value={current.authType}
                onValueChange={(value) =>
                  set({
                    authType:
                      value as Integration['authType'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="api_key">
                    API Key / Secret Key
                  </SelectItem>

                  <SelectItem value="oauth">
                    OAuth (Client ID / Secret)
                  </SelectItem>

                  <SelectItem value="jwt">
                    JWT
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Secrets (chiffrés, masqués, versionnés)
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                {(current.authType === 'oauth'
                  ? [
                      'CLIENT_ID',
                      'CLIENT_SECRET',
                      'CALLBACK_URL',
                    ]
                  : current.authType === 'jwt'
                    ? ['JWT_SECRET', 'CALLBACK_URL']
                    : ['API_KEY', 'SECRET_KEY']
                ).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <span className="font-mono text-xs">
                      {key}
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        ••••••••••••
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          toast({
                            title: `Rotation demandée — ${key}`,
                            description:
                              'Nouvelle version du secret créée.',
                          })
                        }
                      >
                        Rotationner
                      </Button>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="params"
            className="mt-4 space-y-3"
          >
            <Field label="URL">
              <Input
                value={current.url}
                onChange={(event) =>
                  set({
                    url: event.target.value,
                  })
                }
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Timeout (s)">
                <Input
                  type="number"
                  value={current.timeout}
                  onChange={(event) =>
                    set({
                      timeout: Number(event.target.value),
                    })
                  }
                />
              </Field>

              <Field label="Retry">
                <Input
                  type="number"
                  value={current.retry}
                  onChange={(event) =>
                    set({
                      retry: Number(event.target.value),
                    })
                  }
                />
              </Field>

              <Field label="Région">
                <Input
                  value={current.region}
                  onChange={(event) =>
                    set({
                      region: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Mode">
                <Select
                  value={current.mode}
                  onValueChange={(value) =>
                    set({
                      mode: value as Integration['mode'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="production">
                      Production
                    </SelectItem>

                    <SelectItem value="sandbox">
                      Sandbox
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label
                htmlFor="autosync"
                className="text-sm"
              >
                Synchronisation automatique
              </Label>

              <Switch
                id="autosync"
                checked={current.autoSync}
                onCheckedChange={(value) =>
                  set({
                    autoSync: value,
                  })
                }
              />
            </div>
          </TabsContent>

          <TabsContent
            value="tools"
            className="mt-4 space-y-3"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    title: 'Connexion testée',
                    description: 'Réponse 200 OK.',
                  })
                }
              >
                <FlaskConical className="mr-1.5 h-4 w-4" />
                Tester la connexion
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    title: 'Synchronisation lancée',
                    description: 'Traitement immédiat.',
                  })
                }
              >
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Synchroniser
              </Button>

              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    title: 'Permissions vérifiées',
                    description: 'Scopes conformes.',
                  })
                }
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" />
                Vérifier les permissions
              </Button>

              <Button variant="outline" asChild>
                <Link to="/pole/product/documentation">
                  <BookOpen className="mr-1.5 h-4 w-4" />
                  Documentation
                </Link>
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicateur</TableHead>
                  <TableHead className="text-right">
                    Valeur
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <TableRow>
                  <TableCell>Appels 24 h</TableCell>
                  <TableCell className="text-right">
                    {current.calls24h}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Taux d'erreur</TableCell>
                  <TableCell className="text-right">
                    {current.errorRate}%
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Dernière synchro</TableCell>
                  <TableCell className="text-right">
                    {current.lastSync}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>Dépendances</TableCell>
                  <TableCell className="text-right">
                    {current.dependencies.join(', ') || '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuler
          </Button>

          <Button onClick={() => onSave(current)}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}
      </Label>

      {children}
    </div>
  );
}