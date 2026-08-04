import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, ShieldAlert, RotateCcw, Database, Copy, Play, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

type SpaceStatus = 'idle' | 'seeded';

const SANDBOX_SPACES = [
  { id: 'finance', name: 'Finance Test', desc: 'Fausses factures, paiements, remboursements' },
  { id: 'audit', name: 'Audit Test', desc: 'Faux audits, fournisseurs, non-conformités' },
  { id: 'data', name: 'Data Test', desc: 'Faux KPI, publications, rapports BI' },
  { id: 'rh', name: 'RH Test', desc: 'Faux collaborateurs, congés, déplacements' },
  { id: 'supplier', name: 'Supplier Test', desc: 'Faux fournisseurs, catalogues, réassorts' },
  { id: 'tech', name: 'Tech Test', desc: 'Faux logs, déploiements, alertes sécurité' },
];

const SCENARIOS = [
  { id: 'onboarding', name: 'Onboarding fournisseur complet', poles: 'Supplier → Audit → Ops' },
  { id: 'order', name: 'Commande marketplace → livraison', poles: 'Marketplace → Ops → Finance' },
  { id: 'incident', name: 'Non-conformité & sanction', poles: 'Audit → Éthique → Direction' },
  { id: 'permissions', name: 'Test des permissions par rôle', poles: 'Tous les pôles' },
];

export default function TechSandbox() {
  const [spaces, setSpaces] = useState<Record<string, SpaceStatus>>(
    Object.fromEntries(SANDBOX_SPACES.map((s) => [s.id, 'idle'])) as Record<string, SpaceStatus>
  );

  const act = (label: string, description?: string) => {
    toast({ title: label, description: description ?? 'Action simulée — aucun effet sur les données de production.' });
  };

  const seed = (id: string, name: string) => {
    setSpaces((p) => ({ ...p, [id]: 'seeded' }));
    act(`Données fictives générées — ${name}`, 'Jeu de démonstration chargé dans l’espace de simulation.');
  };

  const reset = (id: string, name: string) => {
    setSpaces((p) => ({ ...p, [id]: 'idle' }));
    act(`Espace réinitialisé — ${name}`, 'Toutes les données de simulation ont été supprimées.');
  };

  const resetAll = () => {
    setSpaces(Object.fromEntries(SANDBOX_SPACES.map((s) => [s.id, 'idle'])) as Record<string, SpaceStatus>);
    act('Sandbox réinitialisée', 'État initial restauré pour tous les espaces de simulation.');
  };

  return (
    <div className="relative space-y-6">
      {/* Filigrane Sandbox */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-[0.05]"
      >
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

        <Alert className="border-warning/50 bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle>Environnement de simulation</AlertTitle>
          <AlertDescription>
            Les comptes, transactions, notifications et KPI de cet espace sont fictifs. Aucune action réalisée ici n’a
            d’effet réel.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => act('Jeu de démonstration rechargé')}>
            <Database className="mr-2 h-4 w-4" /> Recharger le jeu de démonstration
          </Button>
          <Button variant="outline" onClick={() => act('Entreprise de démonstration créée')}>
            <Copy className="mr-2 h-4 w-4" /> Créer une entreprise de démo
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pole/tech/test-accounts">
              <Users className="mr-2 h-4 w-4" /> Comptes de test
            </Link>
          </Button>
          <Button variant="destructive" onClick={resetAll}>
            <RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser toute la Sandbox
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Espaces isolés par pôle</CardTitle>
            <CardDescription>
              Chaque pôle possède son propre jeu de données fictif. Les espaces restent indépendants.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {SANDBOX_SPACES.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <Badge variant={spaces[s.id] === 'seeded' ? 'default' : 'secondary'}>
                    {spaces[s.id] === 'seeded' ? 'Données chargées' : 'Vide'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => seed(s.id, s.name)}>
                    <Database className="mr-1.5 h-3.5 w-3.5" /> Générer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => reset(s.id, s.name)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Nettoyer
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scénarios de test</CardTitle>
            <CardDescription>Simulation des workflows entre pôles, permissions et notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCENARIOS.map((sc) => (
              <div key={sc.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{sc.name}</p>
                  <p className="text-xs text-muted-foreground">{sc.poles}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => act(`Scénario exécuté — ${sc.name}`)}>
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
      </div>
    </div>
  );
}
