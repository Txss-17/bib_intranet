import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpen, CheckCircle2, Code2, DatabaseBackup, ExternalLink, KeyRound, Layers3, Search, Server, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

export type ControlKind = 'infrastructure' | 'environments' | 'vpn' | 'code' | 'console' | 'documentation';
const descriptions: Record<ControlKind, { page: string; name: string; summary: string; warning: string }> = {
  infrastructure: {
    page: 'security.infrastructure', name: 'Infrastructure & continuité',
    summary: 'Services, hébergement, sauvegardes, responsables et tests de reprise.',
    warning: 'Cette page documente les contrôles : elle ne modifie pas les sauvegardes ni les services hébergés.',
  },
  environments: {
    page: 'security.environments', name: 'Environnements & livraisons',
    summary: 'Développement, préproduction, production et contrôle des changements.',
    warning: 'Une revue approuvée ne déploie aucun changement sur BIB Platform.',
  },
  vpn: {
    page: 'security.vpn', name: 'Accès VPN & réseau',
    summary: 'Demandes d’accès temporaires, durée, bénéficiaire et preuves de révocation.',
    warning: 'L’accès réseau réel reste géré par le fournisseur VPN et les autorisations serveur.',
  },
  code: {
    page: 'security.code', name: 'Code & revue applicative',
    summary: 'Commits, demandes de fusion, détection de secrets et contrôles CI.',
    warning: 'Une fiche interne ne lance pas les tests CI et ne fusionne aucune Pull Request.',
  },
  console: {
    page: 'security.console', name: 'Interventions privilégiées',
    summary: 'Changements sensibles, opérations autorisées et preuves de retour arrière.',
    warning: 'Aucune commande privilégiée n’est exécutée depuis cette interface.',
  },
  documentation: {
    page: 'security.documentation', name: 'Documentation & runbooks',
    summary: 'Procédures techniques, classification, revue et références Drive BIB.',
    warning: 'Une référence documentaire ne donne pas accès à un fichier Drive confidentiel.',
  },
};
const value = (data: Record<string, unknown>, field: string): string => {
  const found = data[field];
  return found === undefined || found === null || found === '' ? 'Non renseigné' : String(found);
};

type Item = { id: string; title: string; status: string; payload: Record<string, unknown>; due_date?: string | null };

function Status({ status }: { status: string }) {
  return <Badge variant="outline">{RECORD_STATUS[status as keyof typeof RECORD_STATUS] ?? status}</Badge>;
}

function InfrastructureView({ rows }: { rows: Item[] }) {
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: 'Services documentés (page)', count: rows.length, icon: Server },
        { label: 'Sauvegardes renseignées', count: rows.filter(r => r.payload.backup_policy).length, icon: DatabaseBackup },
        { label: 'Tests de reprise renseignés', count: rows.filter(r => r.payload.recovery_test).length, icon: CheckCircle2 },
      ].map(item => <Card key={item.label}><CardContent className="flex items-center gap-3 p-4">
        <item.icon className="h-5 w-5 text-muted-foreground" />
        <div><p className="text-2xl font-semibold">{item.count}</p><p className="text-xs text-muted-foreground">{item.label}</p></div>
      </CardContent></Card>)}
    </div>
    <Card><CardHeader><CardTitle className="text-base">Inventaire de continuité</CardTitle></CardHeader><CardContent>
      <Table><TableHeader><TableRow><TableHead>Service / actif</TableHead><TableHead>Prestataire</TableHead><TableHead>Responsable</TableHead><TableHead>Plan de sauvegarde</TableHead><TableHead>Test de reprise</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map(r => <TableRow key={r.id}><TableCell className="font-medium">{value(r.payload, 'asset')}</TableCell><TableCell>{value(r.payload, 'provider')}</TableCell><TableCell>{value(r.payload, 'service_owner')}</TableCell><TableCell>{value(r.payload, 'backup_policy')}</TableCell><TableCell>{value(r.payload, 'recovery_test')}</TableCell></TableRow>)}
        {!rows.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Aucun service inventorié sur cette page.</TableCell></TableRow>}</TableBody>
      </Table>
    </CardContent></Card>
    <Link to="/pole/security/supervision" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Consulter la supervision technique<ArrowRight className="h-4 w-4" /></Link>
  </div>;
}

function EnvironmentView({ rows }: { rows: Item[] }) {
  const stages = ['development', 'staging', 'production'];
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Le circuit sépare les environnements. Les fiches ne certifient pas l’existence d’une préproduction indépendante.</p>
    <div className="grid gap-4 lg:grid-cols-3">
      {stages.map((stage, idx) => {
        const group = rows.filter(r => {
          const env = String(r.payload.environment ?? '').toLowerCase();
          return stage === 'development' ? ['dev', 'development', 'développement'].includes(env)
            : stage === 'staging' ? ['staging', 'preproduction', 'préproduction', 'test'].includes(env)
            : ['production', 'prod'].includes(env);
        });
        return <Card key={stage}>
          <CardHeader><CardTitle className="flex items-center justify-between text-base">
            <span>{idx + 1}. {['Développement', 'Préproduction', 'Production'][idx]}</span><Badge variant="secondary">{group.length}</Badge>
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">{group.map(r => <div key={r.id} className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">{r.title}</p><Status status={r.status} />
            <p className="text-xs">Version : {value(r.payload, 'release_reference')}</p>
            <p className="text-xs">Fenêtre : {value(r.payload, 'deployment_window')}</p>
            <p className="text-xs">Retour arrière : {value(r.payload, 'rollback_plan')}</p>
          </div>)}
          {!group.length && <p className="text-sm text-muted-foreground">Aucun changement documenté.</p>}</CardContent>
        </Card>;
      })}
    </div>
    {rows.some(r => !stages.some(stage => String(r.payload.environment ?? '').toLowerCase().includes(stage))) &&
      <p className="text-xs text-muted-foreground">Les environnements non reconnus restent consultables dans l'onglet Dossiers.</p>}
    <Link to="/pole/security/code" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Revoir les changements de code <ArrowRight className="h-4 w-4" /></Link>
  </div>;
}

function VpnView({ rows }: { rows: Item[] }) {
  return <div className="space-y-4">
    <div className="flex items-center gap-2 rounded-lg border p-4"><KeyRound className="h-5 w-5" /><p className="text-sm">Un accès doit porter un bénéficiaire, une durée, une référence d'autorisation et une preuve de révocation.</p></div>
    <div className="divide-y overflow-hidden rounded-lg border">
      {rows.map(r => <article key={r.id} className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
        <div><h3 className="font-medium">{r.title}</h3><p className="mt-1 text-sm">Bénéficiaire : {value(r.payload, 'beneficiary')}</p><p className="text-xs text-muted-foreground">Ticket : {value(r.payload, 'ticket_reference')}</p></div>
        <div className="text-sm"><p>Ressource : {value(r.payload, 'asset')}</p><p>Durée : {value(r.payload, 'access_duration')}</p><p>Révocation : {value(r.payload, 'revocation_evidence')}</p></div>
        <div className="self-start"><Status status={r.status} /></div>
      </article>)}
      {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">Aucune demande d’accès réseau documentée.</p>}
    </div>
    <Link className="inline-flex items-center gap-2 text-sm text-primary hover:underline" to="/pole/security/access">Vérifier les identités et habilitations <ArrowRight className="h-4 w-4" /></Link>
  </div>;
}

function CodeView({ rows }: { rows: Item[] }) {
  return <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map(r => <Card key={r.id}>
        <CardHeader><CardTitle className="flex items-start justify-between gap-2 text-base"><span>{r.title}</span><Status status={r.status} /></CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded bg-muted/40 p-2 font-mono text-xs">Commit : {value(r.payload, 'commit_sha')}</div>
          <p>Pull Request : {value(r.payload, 'pull_request_url')}</p>
          <p>Détection de secrets : {value(r.payload, 'secret_scanning')}</p>
          <p>Version cible : {value(r.payload, 'release_reference')}</p>
          <p className="text-xs text-muted-foreground">Vérifier la CI et les droits de fusion dans GitHub avant livraison.</p>
        </CardContent>
      </Card>)}
      {!rows.length && <p className="text-sm text-muted-foreground">Aucune revue applicative documentée.</p>}
    </div>
    <Link className="inline-flex items-center gap-2 text-sm text-primary hover:underline" to="/pole/security/environments">Contrôler l’environnement cible <ArrowRight className="h-4 w-4" /></Link>
  </div>;
}

function ConsoleView({ rows }: { rows: Item[] }) {
  return <div className="space-y-4">
    <div className="rounded-lg border bg-muted/20 p-5">
      <p className="flex items-center gap-2 font-medium"><Terminal className="h-5 w-5" />Circuit d’autorisation d’intervention</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">{['Demande et justification', 'Validation habilitée', 'Intervention contrôlée', 'Preuve et rollback'].map((step, index) =>
        <div key={step} className="rounded border bg-background p-3 text-sm"><span className="text-xs text-muted-foreground">Étape {index + 1}</span><p className="mt-1 font-medium">{step}</p></div>)}</div>
    </div>
    <div className="space-y-3">{rows.map(r => <div key={r.id} className="rounded-lg border-l-4 border-l-primary bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h3 className="font-medium">{r.title}</h3><Status status={r.status} /></div>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <p>Changement : {value(r.payload, 'change_ticket')}</p><p>Opérateur : {value(r.payload, 'authorized_operator')}</p>
        <p>Autorisation : {value(r.payload, 'approval_reference')}</p><p>Retour arrière : {value(r.payload, 'rollback_reference')}</p>
      </div>
    </div>)}
    {!rows.length && <p className="text-sm text-muted-foreground">Aucune intervention à examiner sur cette page.</p>}</div>
    <p className="text-xs text-muted-foreground">Cette interface n’est pas un terminal et n’exécute aucune commande.</p>
  </div>;
}

function DocumentationView({ rows }: { rows: Item[] }) {
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{[
      ['Runbooks documentés', rows.length], ['Classification indiquée', rows.filter(r => r.payload.classification).length],
      ['Relecteur identifié', rows.filter(r => r.payload.technical_reviewer).length],
    ].map(([label, amount]) => <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{amount}</p></CardContent></Card>)}</div>
    <div className="grid gap-4 md:grid-cols-2">{rows.map(r => <Card key={r.id}>
      <CardHeader><CardTitle className="flex items-start justify-between gap-2 text-base"><span><BookOpen className="mr-2 inline h-4 w-4" />{r.title}</span><Status status={r.status} /></CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Document : {value(r.payload, 'document_reference')}</p>
        <p>Classification : {value(r.payload, 'classification')}</p>
        <p>Relecteur : {value(r.payload, 'technical_reviewer')}</p>
        <p>Référence runbook : {value(r.payload, 'runbook_url')}</p>
        <p className="text-xs text-muted-foreground">Les fichiers restent soumis aux permissions Drive BIB.</p>
      </CardContent>
    </Card>)}
    {!rows.length && <p className="text-sm text-muted-foreground">Aucun runbook documenté.</p>}</div>
    <Link to="/pole/security/dataflow" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Consulter les flux documentés <ArrowRight className="h-4 w-4" /></Link>
  </div>;
}

export default function SecurityControlWorkspace({ kind }: { kind: ControlKind }) {
  const d = descriptions[kind];
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(d.page, search, 'all', offset);
  if (!canViewPage(d.page)) return <p role="alert">Accès non autorisé à cette section.</p>;
  const rows = query.data?.rows ?? [];
  const icons = { infrastructure: Server, environments: Layers3, vpn: KeyRound, code: Code2, console: Terminal, documentation: BookOpen };
  const Icon = icons[kind];
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6 text-primary" />{d.name}</h1>
      <p className="text-sm text-muted-foreground">{d.summary}</p>
      <p className="text-xs text-muted-foreground">{d.warning}</p>
    </header>
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">{kind === 'infrastructure' ? 'Parc & sauvegardes' : kind === 'environments' ? 'Circuit de livraison' : kind === 'vpn' ? 'Accès & révocations' : kind === 'code' ? 'Revue des commits' : kind === 'console' ? 'Autorisations d’interventions' : 'Bibliothèque de runbooks'}</TabsTrigger>
        <TabsTrigger value="records">Dossiers & décisions</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-lg"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Rechercher les contrôles" placeholder="Rechercher un service, un dossier, une référence…" value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} /></div>
          <span className="text-xs text-muted-foreground">Dossiers de la page {Math.floor(offset / 50) + 1}</span>
        </div>
        {query.isLoading && <p role="status" className="text-sm text-muted-foreground">Chargement des contrôles…</p>}
        {query.isError && <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
          <p className="font-medium text-destructive">Registre de sécurité indisponible. Aucun contrôle n’est confirmé.</p>
          <Button className="mt-2" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>}
        {!query.isLoading && !query.isError && <>
          {kind === 'infrastructure' && <InfrastructureView rows={rows} />}
          {kind === 'environments' && <EnvironmentView rows={rows} />}
          {kind === 'vpn' && <VpnView rows={rows} />}
          {kind === 'code' && <CodeView rows={rows} />}
          {kind === 'console' && <ConsoleView rows={rows} />}
          {kind === 'documentation' && <DocumentationView rows={rows} />}
        </>}
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button size="sm" variant="outline" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(n => n + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records" className="mt-4">
        <ModuleWorkspace pageId={d.page} />
      </TabsContent>
    </Tabs>
  </div>;
}
