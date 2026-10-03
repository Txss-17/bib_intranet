import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Terminal, Play, Database, GitBranch, Wifi, KeyRound, History, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSandbox } from '@/hooks/useSandbox';

type Line = { at: string; level: 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'SUCCESS'; text: string };

const now = () => new Date().toLocaleTimeString('fr-FR', { hour12: false });

const BOOT: Line[] = [
  { at: '08:24:15', level: 'INFO', text: 'Console Tech Studio démarrée' },
  { at: '08:24:16', level: 'SUCCESS', text: 'Authentification backend réussie' },
  { at: '08:24:17', level: 'OK', text: 'API Gateway ....... OK' },
  { at: '08:24:17', level: 'OK', text: 'Base de données ... OK' },
  { at: '08:24:17', level: 'OK', text: 'Stockage .......... OK' },
  { at: '08:24:18', level: 'INFO', text: '6 services vérifiés, 6 opérationnels' },
];

const SHORTCUTS = [
  { label: 'Vider le cache', out: 'Cache applicatif vidé (128 Mo libérés).' },
  { label: 'Redémarrer les services', out: '6 services redémarrés avec succès.' },
  { label: 'Voir les logs en temps réel', out: 'Flux de logs attaché.' },
  { label: 'Exécuter les migrations', out: 'Dernière migration appliquée : 2026_08_01_docs.' },
  { label: 'Lancer les tests', out: '128 tests passés, 0 échec.' },
];

const levelClass: Record<Line['level'], string> = {
  INFO: 'text-muted-foreground',
  OK: 'text-primary',
  SUCCESS: 'text-primary',
  WARN: 'text-warning',
  ERROR: 'text-destructive',
};

export default function TechConsole() {
  const { isSandbox } = useSandbox();
  const [env, setEnv] = useState(isSandbox ? 'sandbox' : 'staging');
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [cmd, setCmd] = useState('');
  const [history, setHistory] = useState<string[]>(['pnpm build', 'db push', 'git status']);
  const [sql, setSql] = useState('select count(*) from public.orders;');
  const [sqlOut, setSqlOut] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('/functions/v1/send-transactional-email');
  const [apiOut, setApiOut] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [lines]);

  const push = (level: Line['level'], text: string) => setLines((l) => [...l, { at: now(), level, text }].slice(-200));

  const run = (command: string) => {
    if (!command.trim()) return;
    setHistory((h) => [command, ...h.filter((c) => c !== command)].slice(0, 20));
    push('INFO', `${env}@tech-studio:~$ ${command}`);
    if (/^git\b/.test(command)) push('OK', 'Branche develop à jour · 0 fichier modifié');
    else if (/build/.test(command)) push('SUCCESS', 'Build terminé avec succès (23.4 s) · bundle 2.45 MB');
    else if (/test/.test(command)) push('SUCCESS', '128 tests passés, 0 échec');
    else if (/^env|secret/.test(command)) push('WARN', 'Valeurs masquées : utilisez l’onglet Variables');
    else push('OK', 'Commande exécutée.');
    setCmd('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><Terminal className="h-7 w-7" /> Console</h1>
          <p className="text-muted-foreground">
            Terminal, SQL Runner, Git, tests d'API, logs temps réel et variables — sans quitter le Tech Studio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={env} onValueChange={setEnv}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Développement</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link to="/pole/tech/documentation"><BookOpen className="mr-1.5 h-4 w-4" /> Procédures</Link>
          </Button>
        </div>
      </div>

      {env === 'production' && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-3 text-sm">
            Environnement <strong>Production</strong> : les commandes destructives sont bloquées et toutes les actions sont journalisées.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Tabs defaultValue="terminal">
            <TabsList className="flex-wrap">
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="sql"><Database className="mr-1.5 h-3.5 w-3.5" /> SQL Runner</TabsTrigger>
              <TabsTrigger value="git"><GitBranch className="mr-1.5 h-3.5 w-3.5" /> Git</TabsTrigger>
              <TabsTrigger value="api"><Wifi className="mr-1.5 h-3.5 w-3.5" /> Tests API</TabsTrigger>
              <TabsTrigger value="vars"><KeyRound className="mr-1.5 h-3.5 w-3.5" /> Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="terminal" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Session {env}</CardTitle>
                  <CardDescription>Logs temps réel et exécution de commandes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-72 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">
                    {lines.map((l, i) => (
                      <p key={i} className={levelClass[l.level]}>
                        {l.at} [{l.level}] {l.text}
                      </p>
                    ))}
                    <div ref={endRef} />
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => { e.preventDefault(); run(cmd); }}
                  >
                    <Input placeholder="Tapez une commande…" value={cmd} onChange={(e) => setCmd(e.target.value)} className="font-mono text-xs" />
                    <Button type="submit"><Play className="mr-1.5 h-3.5 w-3.5" /> Exécuter</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sql" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">SQL Runner</CardTitle>
                  <CardDescription>Requêtes en lecture. Les écritures nécessitent une validation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea rows={5} value={sql} onChange={(e) => setSql(e.target.value)} className="font-mono text-xs" />
                  <Button
                    onClick={() => {
                      if (/drop|delete|truncate/i.test(sql) && env === 'production') {
                        toast({ title: 'Requête bloquée', description: 'Opération destructive interdite en production.', variant: 'destructive' });
                        return;
                      }
                      setSqlOut('count\n-----\n1 284\n\n(1 ligne · 42 ms)');
                      push('SUCCESS', 'Requête SQL exécutée (42 ms)');
                    }}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Exécuter la requête
                  </Button>
                  {sqlOut && <pre className="overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">{sqlOut}</pre>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="git" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Git Console</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {['git status', 'git pull', 'git log -5', 'git diff --stat'].map((c) => (
                    <Button key={c} size="sm" variant="outline" onClick={() => run(c)} className="font-mono text-xs">{c}</Button>
                  ))}
                  <Button size="sm" variant="ghost" asChild><Link to="/pole/tech/code">Ouvrir Code & GitHub</Link></Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Tests API</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="font-mono text-xs" />
                  <Button
                    onClick={() => {
                      setApiOut(`200 OK · 128 ms\n{\n  "endpoint": "${apiUrl}",\n  "environment": "${env}",\n  "status": "healthy"\n}`);
                      push('SUCCESS', `Appel API ${apiUrl} → 200`);
                    }}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Envoyer la requête
                  </Button>
                  {apiOut && <pre className="overflow-auto rounded-md bg-muted/40 p-3 font-mono text-xs">{apiOut}</pre>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vars" className="mt-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Variables d'environnement — {env}</CardTitle>
                  <CardDescription>Valeurs chiffrées et masquées.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {['APP_ORIGIN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'LINKSY_API_SECRET_KEY', 'LOVABLE_API_KEY'].map((k) => (
                    <div key={k} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                      <span className="font-mono text-xs">{k}</span>
                      <span className="font-mono text-xs text-muted-foreground">••••••••••••</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Raccourcis</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {SHORTCUTS.map((s) => (
                <Button key={s.label} variant="outline" className="w-full justify-start" size="sm"
                  onClick={() => { push('SUCCESS', s.out); toast({ title: s.label, description: s.out }); }}>
                  {s.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Historique des commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {history.map((h) => (
                <button key={h} onClick={() => run(h)} className="block w-full truncate rounded px-2 py-1 text-left font-mono text-xs hover:bg-muted">
                  {h}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Statut des services</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[['API Gateway', '99.9%'], ['Base de données', '99.8%'], ['Stockage', '99.9%'], ['Authentification', '99.9%'], ['Webhooks', '99.6%']].map(([n, v]) => (
                <div key={n} className="flex items-center justify-between border-b border-border pb-1.5 last:border-0">
                  <span>{n}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="default">Opérationnel</Badge>
                    <span className="text-xs text-muted-foreground">{v}</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
