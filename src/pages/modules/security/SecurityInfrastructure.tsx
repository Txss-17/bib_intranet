import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Database, DatabaseBackup, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { useSecurityBridgeRuns, useSecurityFunctionObservations, isFunctionFailure, readableDate } from '@/hooks/useSecurityOperations';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

const architecture = [
  { name: 'BIB Platform', scope: 'Vente, boutiques, clients et commandes', source: 'Base et authentification Platform', link: '/pole/security/dataflow' },
  { name: 'BIB Intranet', scope: 'Gestion des pôles, collaborateurs et décisions', source: 'Base et authentification Intranet', link: '/pole/security/access' },
  { name: 'BIB Audit Hub', scope: 'Audits et décisions indépendantes', source: 'Service et intégration à vérifier', link: '/pole/audit' },
] as const;
const show = (value: unknown) => value == null || value === '' ? 'Non renseigné' : String(value);

export default function SecurityInfrastructure() {
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const functions = useSecurityFunctionObservations();
  const runs = useSecurityBridgeRuns();
  const inventory = useIntranetRecords('security.infrastructure', search, 'all', offset);
  const rows = inventory.data?.rows ?? [];
  const observed = functions.data ?? [];
  const functionsByName = useMemo(() => {
    const grouped = new Map<string, { name: string; origin: string; last: string; calls: number; errors: number; lastStatus: string; lastDuration: number | null }>();
    for (const event of observed) {
      const key = `${event.app_origin ?? 'origine inconnue'}::${event.function_name}`;
      const previous = grouped.get(key);
      if (previous) {
        previous.calls += 1;
        if (isFunctionFailure(event)) previous.errors += 1;
      } else {
        grouped.set(key, {
          name: event.function_name,
          origin: event.app_origin ?? 'Non renseignée',
          last: event.created_at,
          calls: 1,
          errors: isFunctionFailure(event) ? 1 : 0,
          lastStatus: event.status || (event.http_status == null ? 'Non renseigné' : String(event.http_status)),
          lastDuration: event.duration_ms,
        });
      }
    }
    return [...grouped.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [observed]);

  if (!canViewPage('security.infrastructure')) return <p role="alert">Accès à l'infrastructure non autorisé.</p>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Server className="h-6 w-6" />Infrastructure & continuité</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">Architecture BIB, services observables, responsabilités et plans de sauvegarde ou de reprise.</p>
        <p className="text-xs text-muted-foreground">Les contrôles techniques restent séparés des opérations réelles chez les hébergeurs et partenaires. Aucune donnée de disponibilité n'est simulée.</p>
      </div>
      <Button variant="outline" disabled={inventory.isFetching || functions.isFetching || runs.isFetching}
        onClick={() => { void inventory.refetch(); void functions.refetch(); void runs.refetch(); }}>
        <RefreshCw className="mr-2 h-4 w-4" />Actualiser
      </Button>
    </header>
    <Tabs defaultValue="architecture">
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="architecture">Architecture BIB</TabsTrigger>
        <TabsTrigger value="services">Services & journaux</TabsTrigger>
        <TabsTrigger value="continuity">Sauvegarde & continuité</TabsTrigger>
        <TabsTrigger value="controls">Dossiers de contrôle</TabsTrigger>
      </TabsList>
      <TabsContent value="architecture" className="space-y-5">
        <p className="text-sm text-muted-foreground">Cartographie logique des composants. Les environnements, contrats d'hébergement et états réels doivent être vérifiés auprès des fournisseurs.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {architecture.map((item, idx) => <Card key={item.name}>
            <CardHeader><CardTitle className="flex items-center justify-between gap-2 text-base"><span>{item.name}</span><Badge variant="outline">{idx + 1}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{item.scope}</p>
              <p className="flex items-start gap-2 text-xs text-muted-foreground"><Database className="h-4 w-4 shrink-0" />{item.source}</p>
              <p className="text-xs text-muted-foreground">Disponibilité et sauvegarde : <strong>Non vérifiées</strong></p>
              <Link to={item.link} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Consulter le périmètre<ArrowRight className="h-4 w-4" /></Link>
            </CardContent>
          </Card>)}
        </div>
        <div className="rounded-lg border p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4" />Points de contrôle obligatoires</p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            {[
              'Isoler les données Platform des données Intranet et d’Audit Hub.',
              'Contrôler les droits RLS et les secrets des fonctions serveur.',
              'Vérifier les sauvegardes et restaurations auprès des hébergeurs.',
              'Suivre les échanges, erreurs et reprises de synchronisation.',
            ].map((text, i) => <div key={text} className="flex gap-2 rounded bg-muted/40 p-3"><span className="font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>{text}</div>)}
          </div>
        </div>
        {runs.isError ? <p role="alert" className="text-sm text-destructive">La source des synchronisations Platform est indisponible.</p> :
          <div className="text-sm text-muted-foreground">Dernière synchronisation enregistrée : {runs.isLoading ? 'Chargement…' : readableDate(runs.data?.[0]?.started_at)}. Ce journal ne constitue pas un test de bout en bout.</div>}
      </TabsContent>
      <TabsContent value="services" className="space-y-4">
        <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-semibold"><Activity className="h-4 w-4" />Activité des fonctions serveur</h2><Badge variant="secondary">Échantillon : 200 derniers événements</Badge></div>
        {functions.isLoading && <p role="status">Chargement des événements techniques…</p>}
        {functions.isError && <div role="alert" className="rounded border p-3 text-sm text-destructive">Observabilité indisponible. <Button size="sm" variant="outline" onClick={() => void functions.refetch()}>Réessayer</Button></div>}
        {!functions.isLoading && !functions.isError &&
          <div className="overflow-x-auto rounded-lg border">
            <Table><TableHeader><TableRow><TableHead>Fonction</TableHead><TableHead>Application</TableHead><TableHead>Événements</TableHead><TableHead>Erreurs observées</TableHead><TableHead>Dernier événement</TableHead><TableHead>Durée dernière exécution</TableHead></TableRow></TableHeader>
              <TableBody>{functionsByName.map(item => <TableRow key={`${item.origin}::${item.name}`}>
                <TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.origin}</TableCell>
                <TableCell>{item.calls}</TableCell>
                <TableCell><Badge variant={item.errors > 0 ? 'destructive' : 'outline'}>{item.errors}</Badge></TableCell>
                <TableCell>{readableDate(item.last)}</TableCell><TableCell>{item.lastDuration == null ? 'Non mesurée' : `${item.lastDuration} ms`}</TableCell>
              </TableRow>)}
              {!functionsByName.length && <TableRow><TableCell colSpan={6} className="p-6 text-center text-muted-foreground">Aucun événement observé. L’absence de journal ne garantit pas le bon fonctionnement des services.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>}
        <p className="text-xs text-muted-foreground">Cet échantillon ne mesure pas l'uptime, ne contient pas tous les appels et ne remplace pas une sonde d'infrastructure.</p>
        <Link to="/pole/security/logs" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Voir les journaux détaillés<ArrowRight className="h-4 w-4" /></Link>
      </TabsContent>
      <TabsContent value="continuity" className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold"><DatabaseBackup className="h-4 w-4" />Registre des sauvegardes et tests de reprise</h2>
        <p className="text-sm text-muted-foreground">La présence d’une politique ou d’un test déclarés ne prouve pas qu’une sauvegarde ou une restauration a réellement réussi. Vérifier les pièces probantes et les dates.</p>
        <Input value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }} className="max-w-lg" aria-label="Rechercher un service inventorié" placeholder="Service, propriétaire ou fournisseur…" />
        {inventory.isLoading && <p role="status">Chargement de l'inventaire…</p>}
        {inventory.isError && <div role="alert" className="rounded border p-3 text-sm text-destructive">
          Registre des contrôles indisponible : la base des dossiers techniques doit être installée ou accessible.
          <Button size="sm" variant="outline" onClick={() => void inventory.refetch()}>Réessayer</Button>
        </div>}
        {!inventory.isLoading && !inventory.isError &&
          <div className="overflow-x-auto rounded-lg border">
            <Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Prestataire</TableHead><TableHead>Responsable</TableHead><TableHead>Politique de sauvegarde</TableHead><TableHead>Test de reprise déclaré</TableHead></TableRow></TableHeader>
              <TableBody>{rows.map(row => <TableRow key={row.id}>
                <TableCell className="font-medium">{show(row.payload.asset)}</TableCell>
                <TableCell>{show(row.payload.provider)}</TableCell>
                <TableCell>{show(row.payload.service_owner)}</TableCell>
                <TableCell>{show(row.payload.backup_policy)}</TableCell>
                <TableCell>{show(row.payload.recovery_test)}</TableCell>
              </TableRow>)}
                {!rows.length && <TableRow><TableCell colSpan={5} className="p-6 text-center text-muted-foreground">Aucun contrôle de continuité documenté.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>}
        <div className="flex justify-end gap-2">
          <span className="self-center text-xs text-muted-foreground">Page {Math.floor(offset / 50) + 1}</span>
          <Button size="sm" variant="outline" disabled={!offset || inventory.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button size="sm" variant="outline" disabled={!inventory.data?.has_more || inventory.isLoading} onClick={() => setOffset(n => n + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="controls" className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border p-4 text-sm"><AlertTriangle className="h-5 w-5 shrink-0" /><p>Documentez chaque actif et ses dépendances, l'accès administrateur, les preuves de sauvegarde, les tests de restauration et les décisions de continuité. L'approbation ne modifie pas l'infrastructure.</p></div>
        <ModuleWorkspace pageId="security.infrastructure" />
      </TabsContent>
    </Tabs>
  </div>;
}
