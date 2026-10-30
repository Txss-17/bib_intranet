import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Cable, BookOpenCheck, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'integrations' | 'documentation' | 'innovation';
const configs = {
  integrations: {
    page: 'product.integrations',
    title: 'Intégrations BIB Platform ↔ Intranet ↔ Audit Hub',
    intro: 'Contrats de synchronisation, schémas de données, idempotence, gestion des échecs et tests de bout en bout.',
    related: '/pole/ops/flows', relatedLabel: 'Surveillance des flux opérationnels',
    warning: 'Une fiche approuvée ne modifie aucun service de synchronisation ni la base de production.',
    items: [
      ['Système source', 'source_system'], ['Destination', 'target_system'],
      ['Version du contrat', 'version'], ['Idempotence', 'idempotency_key'],
      ['Politique de reprise', 'retry_policy'], ['Tests / résultat', 'result'],
    ],
  },
  documentation: {
    page: 'product.documentation',
    title: 'Documentation Produit & Engineering',
    intro: 'Références documentaires, mainteneurs, version, classification et revue continue des procédures.',
    related: '/pole/security/documentation', relatedLabel: 'Documentation Sécurité & IT',
    warning: 'Les droits Drive BIB s’appliquent indépendamment des droits d’accès à la fiche Intranet.',
    items: [
      ['Produit', 'area'], ['Version couverte', 'version'],
      ['Référence du document', 'document_url'], ['Mainteneur', 'document_owner'],
      ['Public autorisé', 'audience'], ['Cycle de revue', 'review_cycle'],
    ],
  },
  innovation: {
    page: 'product.innovation',
    title: 'Laboratoire Innovation & R&D',
    intro: 'Hypothèses, expérimentations, méthodologies, seuils de succès et décisions fondées sur les résultats.',
    related: '/pole/product/roadmap', relatedLabel: 'Roadmap produit',
    warning: 'Une expérimentation validée ne devient pas automatiquement une fonctionnalité déployée.',
    items: [
      ['Opportunité', 'area'], ['Hypothèse', 'acceptance'],
      ['Méthode de recherche', 'research_method'], ['Échantillon', 'test_population'],
      ['Risques et limites', 'risk_assessment'], ['Décision proposée', 'next_decision'],
    ],
  },
} as const;
const show = (v: unknown) => v === null || v === undefined || v === '' ? 'Non renseigné' : String(v);

export default function ProductTechnicalReviewPage({ mode }: { mode: Mode }) {
  const config = configs[mode];
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(config.page, search, 'all', offset);
  if (!canViewPage(config.page)) return <p role="alert">Vous ne disposez pas de l’accès à cette section.</p>;
  const Icon = mode === 'integrations' ? Cable : mode === 'documentation' ? BookOpenCheck : FlaskConical;
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6" />{config.title}</h1>
      <p className="text-sm text-muted-foreground">{config.intro}</p>
      <p className="rounded-md border p-3 text-xs text-muted-foreground">{config.warning}</p>
      <Link to={config.related} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        {config.relatedLabel}<ArrowUpRight className="h-4 w-4" />
      </Link>
    </header>
    <Tabs defaultValue="trace">
      <TabsList>
        <TabsTrigger value="trace">{mode === 'integrations' ? 'Contrats et tests' : mode === 'documentation' ? 'Versions documentaires' : 'Expérimentations'}</TabsTrigger>
        <TabsTrigger value="records">Dossiers et décisions</TabsTrigger>
      </TabsList>
      <TabsContent value="trace" className="space-y-4">
        <Input className="max-w-lg" value={search} aria-label="Rechercher les dossiers techniques" placeholder="Référence, produit ou hypothèse…"
          onChange={e => { setSearch(e.target.value); setOffset(0); }} />
        {query.isLoading && <p role="status">Lecture des dossiers techniques…</p>}
        {query.isError && <p role="alert" className="rounded-lg border p-3 text-sm text-destructive">
          Référentiel indisponible. <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className="grid gap-4 md:grid-cols-2">
          {(query.data?.rows ?? []).map(row => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap justify-between gap-2 text-base">
              <span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {config.items.map(([label, key]) => <p key={key}><strong>{label} :</strong> {show(row.payload[key])}</p>)}
              <p className="text-xs text-muted-foreground">Décision et preuves conservées dans le dossier d’origine, sans exécution automatique.</p>
            </CardContent>
          </Card>)}
          {!query.data?.rows?.length && <p className="text-sm text-muted-foreground">Aucun élément documenté sur cette page.</p>}
        </div>}
        <div className="flex justify-end gap-2">
          <span className="self-center text-xs text-muted-foreground">Page {Math.floor(offset / 50) + 1}</span>
          <Button size="sm" variant="outline" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button size="sm" variant="outline" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(v => v + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records"><ModuleWorkspace pageId={config.page} /></TabsContent>
    </Tabs>
  </div>;
}
