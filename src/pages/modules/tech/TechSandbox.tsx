import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FlaskConical, ShieldAlert, RotateCcw, Database, Copy, Play, Trash2, Users, ShieldCheck, Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { SANDBOX_SPACES, useSandbox } from '@/hooks/useSandbox';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SCENARIOS = [
  { id: 'onboarding', name: 'Onboarding fournisseur complet', poles: 'Supplier → Audit → Ops', steps: 6 },
  { id: 'order', name: 'Commande marketplace → livraison', poles: 'Marketplace → Ops → Finance', steps: 8 },
  { id: 'incident', name: 'Non-conformité & sanction', poles: 'Audit → Éthique → Direction', steps: 5 },
  { id: 'permissions', name: 'Test des permissions par rôle', poles: 'Tous les pôles', steps: 12 },
  { id: 'notifications', name: 'Notifications & alertes critiques', poles: 'Direction → Tech', steps: 4 },
  { id: 'payroll', name: 'Cycle de paie & cartes entreprise', poles: 'RH → Finance', steps: 7 },
];

export default function TechSandbox() {
  const {
    isSandbox, setEnabled, spaces, events, seedSpace, cleanSpace, seedAll, resetAll,
    createDemoCompany, logEvent, totalRecords, demoCompany,
  } = useSandbox();

  const act = (label: string, description?: string) => {
    logEvent(label, description);
    toast({ title: label, description: description ?? 'Action simulée — aucun effet sur les données de production.' });
  };

  const runScenario = (name: string, steps: number) =>
    act(`Scénario exécuté — ${name}`, `${steps} étapes simulées dans l'environnement isolé.`);

  const exportLog = () => {
    const content = events
      .map((e) => `${new Date(e.at).toISOString()} | ${e.label}${e.detail ? ` | ${e.detail}` : ''}`)
      .join('\n');
    const blob = new Blob([content || 'Aucun évènement'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox-journal-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Journal exporté', description: 'Journal des actions de simulation téléchargé.' });
  };

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-[0.05]">
        <span className="absolute left-1/2 top-1/3 -translate-x-1/2 -rotate-12 text-[8rem] font-black uppercase tracking-widest">
          Sandbox
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FlaskConical className="h-7 w-7" /> Sandbox — Simulation
          </h1>
          <p className="text-muted-foreground">
            Environnement autonome réservé au pôle Tech. Aucune donnée ne transite vers la production.
          </p>
        </div>

        <Card className={isSandbox ? 'border-warning/60' : undefined}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              {isSandbox ? <FlaskConical className="h-5 w-5 text-warning" /> : <ShieldCheck className="h-5 w-5 text-success" />}
              <div>
                <p className="font-semibold text-sm">
                  Environnement actif : {isSandbox ? 'Sandbox (simulation)' : 'Production (données réelles)'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isSandbox
                    ? `${totalRecords} enregistrements fictifs isolés — jamais écrits en base de production.`
                    : 'Les données de simulation sont totalement masquées.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sandbox-mode" className="text-sm">Basculer en Sandbox</Label>
              <Switch id="sandbox-mode" checked={isSandbox} onCheckedChange={setEnabled} />
            </div>
          </CardContent>
        </Card>

        <Alert className="border-warning/50 bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle>Cloisonnement strict</AlertTitle>
          <AlertDescription>
            Les comptes, transactions, notifications et KPI de cet espace sont fictifs et stockés séparément. Aucune
            écriture n'est effectuée dans la base de production, et aucune donnée réelle n'est copiée ici.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button onClick={seedAll}>
            <Database className="mr-2 h-4 w-4" /> Charger le jeu de démonstration complet
          </Button>
          <Button variant="outline" onClick={() => createDemoCompany()}>
            <Copy className="mr-2 h-4 w-4" /> Créer une entreprise de démo
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pole/tech/test-accounts">
              <Users className="mr-2 h-4 w-4" /> Comptes de test
            </Link>
          </Button>
          <Button variant="outline" onClick={exportLog}>
            <Download className="mr-2 h-4 w-4" /> Exporter le journal
          </Button>
          <Button variant="destructive" onClick={resetAll}>
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser toute la Sandbox
          </Button>
        </div>

        {demoCompany && (
          <Card>
            <CardContent className="flex items-center justify-between p-4 text-sm">
              <span>
                Entreprise de démonstration : <span className="font-semibold">{demoCompany.name}</span>
              </span>
              <Badge variant="secondary">
                créée {formatDistanceToNow(new Date(demoCompany.createdAt), { addSuffix: true, locale: fr })}
              </Badge>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Espaces isolés par pôle</CardTitle>
            <CardDescription>
              Chaque pôle possède son propre jeu de données fictif. Les espaces restent indépendants.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SANDBOX_SPACES.map((s) => {
              const st = spaces[s.id] ?? { seeded: false, records: 0 };
              return (
                <div key={s.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{s.name}</p>
                    <Badge variant={st.seeded ? 'default' : 'secondary'}>
                      {st.seeded ? `${st.records} enreg.` : 'Vide'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                  {st.seededAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Généré {formatDistanceToNow(new Date(st.seededAt), { addSuffix: true, locale: fr })}
                    </p>
                  )}
                  {st.seeded && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {domainsForSpace(s.id).map((d) => (
                        <Badge key={d} variant="outline" className="text-[10px] font-normal">
                          {DOMAIN_LABELS[d]} · {dataset(d).length}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Separator className="my-3" />

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => seedSpace(s.id)}>
                      <Database className="mr-1.5 h-3.5 w-3.5" /> Générer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cleanSpace(s.id)} disabled={!st.seeded}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Nettoyer
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scénarios de test</CardTitle>
            <CardDescription>Simulation des workflows entre pôles, permissions et notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCENARIOS.map((sc) => (
              <div key={sc.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{sc.name}</p>
                  <p className="text-xs text-muted-foreground">{sc.poles} · {sc.steps} étapes</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => runScenario(sc.name, sc.steps)}>
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Exécuter
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => act(`Scénario dupliqué — ${sc.name}`)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Dupliquer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Journal de simulation</CardTitle>
            <CardDescription>Traçabilité des actions réalisées dans l'environnement isolé.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune action de simulation enregistrée.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden md:table-cell">Détail</TableHead>
                    <TableHead className="text-right">Quand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.slice(0, 15).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-sm">{e.label}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{e.detail ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(e.at), { addSuffix: true, locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
