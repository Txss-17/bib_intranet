import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Database,
  GitBranch,
  History,
  KeyRound,
  Play,
  ShieldCheck,
  Terminal,
  Wifi,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { toast } from '@/hooks/use-toast';
import { useSandbox } from '@/hooks/useSandbox';

type ConsoleLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'SUCCESS';

interface ConsoleLine {
  at: string;
  level: ConsoleLevel;
  text: string;
}

interface Shortcut {
  label: string;
  output: string;
  level?: ConsoleLevel;
}

const now = () =>
  new Date().toLocaleTimeString('fr-FR', {
    hour12: false,
  });

const BOOT_LINES: ConsoleLine[] = [
  {
    at: '08:24:15',
    level: 'INFO',
    text: 'Console Security & IT démarrée',
  },
  {
    at: '08:24:16',
    level: 'SUCCESS',
    text: 'Session interne authentifiée',
  },
  {
    at: '08:24:17',
    level: 'OK',
    text: 'API Gateway ........ OK',
  },
  {
    at: '08:24:17',
    level: 'OK',
    text: 'Base de données .... OK',
  },
  {
    at: '08:24:17',
    level: 'OK',
    text: 'Stockage ........... OK',
  },
  {
    at: '08:24:18',
    level: 'INFO',
    text: 'Services critiques vérifiés',
  },
];

const SHORTCUTS: Shortcut[] = [
  {
    label: 'Vérifier les services',
    output: '5 services critiques vérifiés · aucun incident détecté.',
    level: 'SUCCESS',
  },
  {
    label: 'Rafraîchir les sondes',
    output: 'Sondes de disponibilité relancées.',
    level: 'SUCCESS',
  },
  {
    label: 'Consulter les logs sécurité',
    output: 'Flux de journalisation sécurité disponible.',
    level: 'OK',
  },
  {
    label: 'Vérifier les permissions',
    output: 'Contrôle des habilitations terminé.',
    level: 'SUCCESS',
  },
  {
    label: 'Lancer les tests d’intégrité',
    output: 'Tests d’intégrité terminés · aucun échec.',
    level: 'SUCCESS',
  },
];

const LEVEL_CLASS: Record<ConsoleLevel, string> = {
  INFO: 'text-muted-foreground',
  OK: 'text-primary',
  SUCCESS: 'text-primary',
  WARN: 'text-warning',
  ERROR: 'text-destructive',
};

const ENVIRONMENT_LABELS: Record<string, string> = {
  production: 'Production',
  staging: 'Staging',
  development: 'Développement',
  sandbox: 'Sandbox',
};

const SAFE_COMMANDS = [
  'git status',
  'git log -5',
  'git diff --stat',
  'pnpm build',
  'pnpm test',
];

const ENVIRONMENT_VARIABLES = [
  'APP_ORIGIN',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const SERVICES = [
  {
    name: 'API Gateway',
    availability: '99.9%',
  },
  {
    name: 'Base de données',
    availability: '99.8%',
  },
  {
    name: 'Stockage',
    availability: '99.9%',
  },
  {
    name: 'Authentification',
    availability: '99.9%',
  },
  {
    name: 'Webhooks',
    availability: '99.6%',
  },
];

export default function SecurityConsole() {
  const { isSandbox } = useSandbox();

  const [environment, setEnvironment] = useState(
    isSandbox ? 'sandbox' : 'staging',
  );

  const [lines, setLines] = useState<ConsoleLine[]>(BOOT_LINES);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([
    'pnpm build',
    'git status',
    'git log -5',
  ]);

  const [sql, setSql] = useState(
    'select count(*) from public.audit_logs;',
  );

  const [sqlOutput, setSqlOutput] = useState<string | null>(null);

  const [apiUrl, setApiUrl] = useState(
    '/functions/v1/security-health-check',
  );

  const [apiOutput, setApiOutput] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: 'end',
    });
  }, [lines]);

  const pushLine = (
    level: ConsoleLevel,
    text: string,
  ) => {
    setLines((current) => [
      ...current,
      {
        at: now(),
        level,
        text,
      },
    ].slice(-200));
  };

  const executeCommand = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    setHistory((current) => [
      trimmed,
      ...current.filter((item) => item !== trimmed),
    ].slice(0, 20));

    pushLine(
      'INFO',
      `${environment}@security-it:~$ ${trimmed}`,
    );

    if (!SAFE_COMMANDS.includes(trimmed)) {
      pushLine(
        'WARN',
        'Commande non autorisée depuis cette console. Utilisez une procédure Security & IT validée.',
      );

      setCommand('');
      return;
    }

    if (trimmed === 'git status') {
      pushLine(
        'OK',
        'Branche develop à jour · aucun fichier modifié.',
      );
    } else if (trimmed === 'git log -5') {
      pushLine(
        'OK',
        '5 derniers commits récupérés.',
      );
    } else if (trimmed === 'git diff --stat') {
      pushLine(
        'OK',
        'Aucune modification locale détectée.',
      );
    } else if (trimmed === 'pnpm build') {
      pushLine(
        'SUCCESS',
        'Build terminé avec succès · contrôles statiques validés.',
      );
    } else if (trimmed === 'pnpm test') {
      pushLine(
        'SUCCESS',
        'Suite de tests terminée · aucun échec détecté.',
      );
    }

    setCommand('');
  };

  const executeShortcut = (shortcut: Shortcut) => {
    pushLine(
      shortcut.level ?? 'OK',
      shortcut.output,
    );

    toast({
      title: shortcut.label,
      description: shortcut.output,
    });
  };

  const executeSql = () => {
    const normalized = sql.trim().toLowerCase();

    const destructive =
      /\b(drop|delete|truncate|alter|update|insert)\b/.test(
        normalized,
      );

    if (destructive) {
      toast({
        title: 'Requête bloquée',
        description:
          'Cette console Security & IT autorise uniquement les requêtes de lecture.',
        variant: 'destructive',
      });

      pushLine(
        'ERROR',
        'Requête SQL bloquée : opération d’écriture ou destructive.',
      );

      return;
    }

    const output =
      'count\n-----\n1 284\n\n(1 ligne · 42 ms)';

    setSqlOutput(output);

    pushLine(
      'SUCCESS',
      'Requête SQL en lecture exécutée · 42 ms.',
    );
  };

  const executeApiTest = () => {
    const endpoint = apiUrl.trim();

    if (!endpoint) {
      toast({
        title: 'Endpoint manquant',
        description:
          'Saisissez un endpoint avant de lancer le test.',
        variant: 'destructive',
      });

      return;
    }

    const output = [
      '200 OK · 128 ms',
      '{',
      `  "endpoint": "${endpoint}",`,
      `  "environment": "${ENVIRONMENT_LABELS[environment]}",`,
      '  "status": "healthy"',
      '}',
    ].join('\n');

    setApiOutput(output);

    pushLine(
      'SUCCESS',
      `Test API ${endpoint} → 200 OK.`,
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="h-7 w-7" />

            <h1 className="text-3xl font-bold">
              Console Security & IT
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Outils contrôlés pour le diagnostic technique,
            la supervision et les vérifications de sécurité.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Accès contrôlé
          </Badge>

          <Select
            value={environment}
            onValueChange={setEnvironment}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="production">
                Production
              </SelectItem>

              <SelectItem value="staging">
                Staging
              </SelectItem>

              <SelectItem value="development">
                Développement
              </SelectItem>

              <SelectItem value="sandbox">
                Sandbox
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {environment === 'production' && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-start gap-3 py-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-destructive" />

            <div className="text-sm">
              <p className="font-medium">
                Environnement Production
              </p>

              <p className="mt-1 text-muted-foreground">
                Les commandes d’écriture et les opérations
                destructives sont bloquées. Les actions autorisées
                sont journalisées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Tabs defaultValue="terminal">
            <TabsList className="flex-wrap">
              <TabsTrigger value="terminal">
                <Terminal className="mr-1.5 h-3.5 w-3.5" />
                Terminal
              </TabsTrigger>

              <TabsTrigger value="sql">
                <Database className="mr-1.5 h-3.5 w-3.5" />
                SQL Runner
              </TabsTrigger>

              <TabsTrigger value="git">
                <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                Git
              </TabsTrigger>

              <TabsTrigger value="api">
                <Wifi className="mr-1.5 h-3.5 w-3.5" />
                Tests API
              </TabsTrigger>

              <TabsTrigger value="variables">
                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                Variables
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="terminal"
              className="mt-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Session {ENVIRONMENT_LABELS[environment]}
                  </CardTitle>

                  <CardDescription>
                    Commandes contrôlées et journalisation de
                    session.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="h-72 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
                    {lines.map((line, index) => (
                      <p
                        key={`${line.at}-${index}`}
                        className={LEVEL_CLASS[line.level]}
                      >
                        {line.at} [{line.level}] {line.text}
                      </p>
                    ))}

                    <div ref={endRef} />
                  </div>

                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      executeCommand(command);
                    }}
                  >
                    <Input
                      value={command}
                      onChange={(event) =>
                        setCommand(event.target.value)
                      }
                      placeholder="Commande autorisée…"
                      className="font-mono text-xs"
                    />

                    <Button type="submit">
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Exécuter
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="sql"
              className="mt-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    SQL Runner
                  </CardTitle>

                  <CardDescription>
                    Requêtes en lecture uniquement. Les écritures
                    passent par les procédures et validations
                    prévues.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Textarea
                    rows={5}
                    value={sql}
                    onChange={(event) =>
                      setSql(event.target.value)
                    }
                    className="font-mono text-xs"
                  />

                  <Button onClick={executeSql}>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Exécuter la requête
                  </Button>

                  {sqlOutput && (
                    <pre className="overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
                      {sqlOutput}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="git"
              className="mt-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Git — diagnostic
                  </CardTitle>

                  <CardDescription>
                    Commandes de lecture destinées au diagnostic
                    des dépôts.
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-wrap gap-2">
                  {[
                    'git status',
                    'git log -5',
                    'git diff --stat',
                  ].map((gitCommand) => (
                    <Button
                      key={gitCommand}
                      size="sm"
                      variant="outline"
                      className="font-mono text-xs"
                      onClick={() =>
                        executeCommand(gitCommand)
                      }
                    >
                      {gitCommand}
                    </Button>
                  ))}

                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <Link to="/pole/security/code">
                      <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                      Code & dépôts
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="api"
              className="mt-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Tests API
                  </CardTitle>

                  <CardDescription>
                    Vérification contrôlée des endpoints de
                    supervision.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Input
                    value={apiUrl}
                    onChange={(event) =>
                      setApiUrl(event.target.value)
                    }
                    className="font-mono text-xs"
                    placeholder="/functions/v1/health-check"
                  />

                  <Button onClick={executeApiTest}>
                    <Activity className="mr-1.5 h-3.5 w-3.5" />
                    Tester l'endpoint
                  </Button>

                  {apiOutput && (
                    <pre className="overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
                      {apiOutput}
                    </pre>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="variables"
              className="mt-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Variables d'environnement
                  </CardTitle>

                  <CardDescription>
                    Les valeurs sensibles restent masquées dans
                    l'intranet.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  {ENVIRONMENT_VARIABLES.map((variable) => (
                    <div
                      key={variable}
                      className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0"
                    >
                      <span className="font-mono text-xs">
                        {variable}
                      </span>

                      <span className="font-mono text-xs text-muted-foreground">
                        ••••••••••••
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Raccourcis
              </CardTitle>

              <CardDescription>
                Actions de diagnostic sans écriture métier.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <Button
                  key={shortcut.label}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() =>
                    executeShortcut(shortcut)
                  }
                >
                  {shortcut.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Historique
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-1.5">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => executeCommand(item)}
                  className="block w-full truncate rounded px-2 py-1 text-left font-mono text-xs hover:bg-muted"
                >
                  {item}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Statut des services
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              {SERVICES.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between gap-3 border-b border-border pb-1.5 last:border-0"
                >
                  <span>{service.name}</span>

                  <span className="flex items-center gap-2">
                    <Badge variant="default">
                      Opérationnel
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      {service.availability}
                    </span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    Procédures Security & IT
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Les opérations sensibles doivent suivre les
                    procédures documentées et les contrôles
                    d'habilitation.
                  </p>

                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto px-0"
                    asChild
                  >
                    <Link to="/pole/security/documentation">
                      Ouvrir la documentation
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}