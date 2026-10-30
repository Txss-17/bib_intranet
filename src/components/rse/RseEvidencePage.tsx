import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Leaf, PackageCheck, Recycle, Star, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'packaging' | 'recycling' | 'esg' | 'points';
const views = {
  packaging: {
    id: 'rse.packaging', title: 'Qualification des emballages', Icon: PackageCheck,
    intro: 'Matériaux, fournisseurs, certifications et décisions d’homologation avant usage par les partenaires logistiques.',
    main: 'Matériau', field: 'material', extra: 'Fournisseur', extraField: 'supplier_reference',
    next: '/pole/ops/partners', nextLabel: 'Partenaires logistiques',
    warning: 'La validation de cette fiche ne commande pas de stock ni n’homologue automatiquement un emballage sur Platform.',
  },
  recycling: {
    id: 'rse.recycling', title: 'Traçabilité du recyclage', Icon: Recycle,
    intro: 'Flux effectivement collectés, mesures, destination, partenaire de traitement et justificatifs de valorisation.',
    main: 'Filière', field: 'category', extra: 'Partenaire', extraField: 'partner',
    next: '/pole/ops/shipments', nextLabel: 'Flux logistiques',
    warning: 'Sans bon de collecte et pesée vérifiée, la quantité reste une déclaration interne non certifiée.',
  },
  esg: {
    id: 'rse.esg', title: 'Indicateurs ESG et publication', Icon: BarChart3,
    intro: 'Référentiel extra-financier, méthode, sources, qualité des données et validation préalable à la publication.',
    main: 'Indicateur', field: 'category', extra: 'Cadre de reporting', extraField: 'framework',
    next: '/pole/data/reports', nextLabel: 'Rapports Data & BI',
    warning: 'Une décision interne ne constitue pas un audit externe, une publication officielle ou une attestation ESG.',
  },
  points: {
    id: 'rse.points', title: 'Programme de points circulaires', Icon: Star,
    intro: 'Expérimentation de récompenses écoresponsables, contrôles anti-fraude, dépendances produit et conditions d’activation.',
    main: 'Programme', field: 'category', extra: 'Stade pilote', extraField: 'pilot_stage',
    next: '/pole/product/roadmap', nextLabel: 'Roadmap BIB Platform',
    warning: 'Le programme n’est pas activé : une fiche ne crédite aucun compte client sur BIB Platform.',
  },
} as const;

const show = (value: unknown) => value === null || value === undefined || value === '' ? 'Non renseigné' : String(value);

export default function RseEvidencePage({ mode }: { mode: Mode }) {
  const d = views[mode];
  const { canViewPage } = usePermissions();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(d.id, search, 'all', offset);
  if (!canViewPage(d.id)) return <p role="alert">Accès à ce module RSE non autorisé.</p>;
  const Icon = d.Icon;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6" />{d.title}</h1>
      <p className="text-sm text-muted-foreground">{d.intro}</p>
      <p className="rounded-md border p-3 text-xs text-muted-foreground">{d.warning}</p>
      <Link to={d.next} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{d.nextLabel}<ArrowUpRight className="h-4 w-4" /></Link>
    </header>
    <Tabs defaultValue="evidence">
      <TabsList>
        <TabsTrigger value="evidence">Mesures et preuves</TabsTrigger>
        <TabsTrigger value="decisions">Dossiers et validations</TabsTrigger>
      </TabsList>
      <TabsContent value="evidence" className="space-y-4">
        <Input aria-label="Rechercher une mesure RSE" className="max-w-xl" placeholder="Rechercher une référence ou une activité…"
          value={search} onChange={event => { setSearch(event.target.value); setOffset(0); }} />
        {query.isLoading && <p role="status">Lecture des mesures et preuves…</p>}
        {query.isError && <div role="alert" className="rounded-lg border p-3 text-sm text-destructive">
          Mesures indisponibles : aucune valeur n’est confirmée.
          <Button variant="outline" size="sm" className="ml-2" onClick={() => void query.refetch()}>Réessayer</Button>
        </div>}
        {!query.isError && !query.isLoading && <div className="grid gap-3 md:grid-cols-2">
          {rows.map(row => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap items-start justify-between gap-2 text-base">
              <span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>{d.main} :</strong> {show(row.payload[d.field])}</p>
              <p><strong>{d.extra} :</strong> {show(row.payload[d.extraField])}</p>
              <p><strong>Période :</strong> {show(row.payload.period)}</p>
              <p><strong>Quantité documentée :</strong> {row.payload.quantity == null || row.payload.quantity === '' ? 'Non confirmée' : String(row.payload.quantity)} {show(row.payload.unit)}</p>
              <p><strong>Méthode :</strong> {show(row.payload.method)}</p>
              <p><strong>Source :</strong> {show(row.payload.source)}</p>
              <p className="text-xs text-muted-foreground">Les totaux ne sont pas additionnés entre unités, méthodes et périmètres différents.</p>
            </CardContent>
          </Card>)}
          {!rows.length && <p className="text-sm text-muted-foreground">Aucun résultat documenté dans cette vue.</p>}
        </div>}
        <div className="flex justify-end gap-2">
          <span className="self-center text-xs text-muted-foreground">Page {Math.floor(offset / 50) + 1} · résultats de la page uniquement</span>
          <Button variant="outline" size="sm" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button variant="outline" size="sm" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(v => v + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="decisions" className="mt-4"><ModuleWorkspace pageId={d.id} /></TabsContent>
    </Tabs>
  </div>;
}
