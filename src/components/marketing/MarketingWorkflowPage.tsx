import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MailCheck, Route, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { usePermissions } from '@/hooks/usePermissions';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'crm' | 'journeys' | 'reputation';
const views = {
  crm: {
    id: 'marketing.crm', title: 'CRM marketing & segmentation', icon: MailCheck,
    intro: 'Pilotage des segments, demandes de contact et actions de communication, distinct du portefeuille Marketplace.',
    subject: 'Segment ou action', detail: 'Audience ciblée',
    link: '/pole/marketplace/customers', linkLabel: 'Consulter les clients Marketplace',
    warning: 'Les données clients de la plateforme restent soumises à autorisation. Ce registre ne crée pas de consentement marketing.',
  },
  journeys: {
    id: 'marketing.journeys', title: 'Parcours & automatisations', icon: Route,
    intro: 'Étapes des parcours client, déclencheurs, messages à valider et preuves de recettes.',
    subject: 'Parcours', detail: 'Étape et audience',
    link: '/pole/marketing/campaigns', linkLabel: 'Campagnes associées',
    warning: 'Aucune automatisation n’est déclarée active avant intégration d’un déclencheur serveur et validation des consentements.',
  },
  reputation: {
    id: 'marketing.reputation', title: 'Réputation & retours publics', icon: Star,
    intro: 'Collecte qualifiée des retours, réponses approuvées et mesures de réputation de BIB Platform.',
    subject: 'Canal de retour', detail: 'Public et réponse préparée',
    link: '/pole/marketing/analytics', linkLabel: 'Mesures marketing',
    warning: 'Une fiche approuvée ne publie pas automatiquement une réponse sur un réseau social ou une marketplace.',
  },
};

export default function MarketingWorkflowPage({ mode }: { mode: Mode }) {
  const def = views[mode];
  const Icon = def.icon;
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const { canViewPage } = usePermissions();
  const query = useIntranetRecords(def.id, search, 'all', offset);
  if (!canViewPage(def.id)) return <p role="alert">Accès non autorisé à cette section.</p>;
  const rows = query.data?.rows ?? [];
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6" />{def.title}</h1>
      <p className="text-sm text-muted-foreground">{def.intro}</p>
      <p className="text-xs text-muted-foreground">{def.warning}</p>
      <Link to={def.link} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        {def.linkLabel}<ArrowUpRight className="h-4 w-4" />
      </Link>
    </header>
    <Tabs defaultValue="view">
      <TabsList>
        <TabsTrigger value="view">{mode === 'journeys' ? 'Étapes planifiées' : mode === 'reputation' ? 'Retours et réponses' : 'Segments et contacts'}</TabsTrigger>
        <TabsTrigger value="records">Actions et validations</TabsTrigger>
      </TabsList>
      <TabsContent value="view" className="space-y-4">
        <Input aria-label="Rechercher dans le module marketing" placeholder="Rechercher…" value={search}
          onChange={e => { setSearch(e.target.value); setOffset(0); }} className="max-w-lg" />
        {query.isLoading && <p role="status">Chargement des dossiers…</p>}
        {query.isError && <p role="alert" className="space-x-2 text-sm text-destructive">
          Données indisponibles. <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>{def.subject} :</strong> {String(row.payload.channel || 'Non renseigné')}</p>
              <p><strong>{def.detail} :</strong> {String(row.payload.audience || 'Non renseigné')}</p>
              <p className="line-clamp-4 whitespace-pre-wrap">{String(row.payload.content || 'Aucun contenu détaillé')}</p>
              <p className="text-xs text-muted-foreground">Date visée : {String(row.payload.publication_date || row.due_date || 'À déterminer')}</p>
              <p className="text-xs text-muted-foreground">Mesure : {row.payload.result == null || row.payload.result === '' ? 'Non confirmée' : String(row.payload.result)}</p>
            </CardContent>
          </Card>)}
          {!rows.length && <p className="text-sm text-muted-foreground">Aucun dossier dans cette section.</p>}
        </div>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={!offset || query.isLoading} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <span className="self-center text-xs">Page {Math.floor(offset / 50) + 1}</span>
          <Button variant="outline" disabled={!query.data?.has_more || query.isLoading} onClick={() => setOffset(offset + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records" className="mt-4">
        <ModuleWorkspace pageId={def.id} />
      </TabsContent>
    </Tabs>
  </div>;
}
