import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart3, CalendarDays, ArrowUpRight, Mic2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useIntranetRecords } from '@/hooks/useIntranetRecords';
import { RECORD_STATUS } from '@/lib/intranet';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Mode = 'analytics' | 'podcasts';
const config = {
  analytics: {
    id: 'marketing.analytics', title: 'Analyse des performances marketing',
    description: 'Mesures documentées par canal, campagne et période, avec contrôle de l’attribution et des sources.',
    next: '/pole/data/bi', nextLabel: 'Tableaux de bord Data & BI',
  },
  podcasts: {
    id: 'marketing.podcasts', title: 'Studio des podcasts BIB',
    description: 'Préproduction, conducteurs, droits des intervenants, fichiers masters et preuves de publication des épisodes.',
    next: '/pole/marketing/content', nextLabel: 'Production éditoriale',
  },
} as const;
const show = (value: unknown) => value == null || value === '' ? 'Non renseigné' : String(value);

export default function MarketingEvidencePage({ mode }: { mode: Mode }) {
  const d = config[mode];
  const { canViewPage } = usePermissions();
  const allowed = canViewPage(d.id);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('record') ? 'records' : 'view');
  const openRecord = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('record', id);
    setParams(next, { replace: true });
    setTab('records');
  };
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = useIntranetRecords(d.id, search, 'all', offset, allowed);
  if (!allowed) return <p role="alert">Accès non autorisé à cette section Marketing.</p>;
  const rows = query.data?.rows ?? [];
  const Icon = mode === 'analytics' ? BarChart3 : Mic2;
  return <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><Icon className="h-6 w-6" />{d.title}</h1>
      <p className="text-sm text-muted-foreground">{d.description}</p>
      <Link to={d.next} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{d.nextLabel}<ArrowUpRight className="h-4 w-4" /></Link>
    </header>
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="view">{mode === 'analytics' ? 'Mesures et sources' : 'Calendrier des épisodes'}</TabsTrigger>
        <TabsTrigger value="records">{mode === 'analytics' ? 'Validation des mesures' : 'Préproduction et droits'}</TabsTrigger>
      </TabsList>
      <TabsContent value="view" className="space-y-4">
        <Input aria-label="Rechercher dans les mesures marketing" value={search}
          placeholder={mode === 'analytics' ? 'Campagne, canal, indicateur…' : 'Titre, épisode, invité…'}
          onChange={event => { setSearch(event.target.value); setOffset(0); }} className="max-w-lg" />
        {query.isLoading && <p role="status">Chargement du référentiel…</p>}
        {query.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
          Données indisponibles. <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className={mode === 'podcasts' ? 'space-y-3' : 'grid gap-4 md:grid-cols-2'}>
          {rows.map(row => <Card key={row.id}>
            <CardHeader><CardTitle className="flex flex-wrap justify-between gap-2 text-base"><span>{row.title}</span><Badge variant="outline">{RECORD_STATUS[row.status]}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {mode === 'analytics' ? <>
                <p><strong>Indicateur :</strong> {show(row.payload.indicator)}</p>
                <p><strong>Canal/campagne :</strong> {show(row.payload.channel)}</p>
                <p><strong>Période :</strong> {show(row.payload.period)}</p>
                <p><strong>Valeur :</strong> {row.payload.value == null || row.payload.value === '' ? 'Non confirmée' : String(row.payload.value)} {show(row.payload.unit)}</p>
                <p><strong>Source :</strong> {show(row.payload.source)}</p>
                <p><strong>Fenêtre d'attribution :</strong> {show(row.payload.attribution_window)}</p>
                <p><strong>Limites :</strong> {show(row.payload.analysis)}</p>
                <p className="text-xs text-muted-foreground">Pas d'addition automatique entre unités et fenêtres d'attribution hétérogènes.</p>
              </> : <>
                <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /><strong>Diffusion prévue :</strong> {show(row.payload.publication_date)}</p>
                <p><strong>Épisode :</strong> {show(row.payload.episode_number)}</p>
                <p><strong>Plateforme prévue :</strong> {show(row.payload.channel)}</p>
                <p><strong>Synopsis :</strong> {show(row.payload.content)}</p>
                <p><strong>Consentements invités :</strong> {show(row.payload.guest_consent)}</p>
                <p><strong>Fichier master :</strong> {show(row.payload.audio_master)}</p>
                <p><strong>Diffusion vérifiée :</strong> {show(row.payload.published_url)}</p>
                <p className="text-xs text-muted-foreground">L'enregistrement du dossier ne déclenche ni diffusion ni hébergement audio.</p>
              </>}
              <Button size="sm" variant="outline" onClick={() => openRecord(row.id)}>Ouvrir la fiche et ses validations</Button>
            </CardContent>
          </Card>)}
          {!rows.length && <p className="text-sm text-muted-foreground">Aucun dossier documenté dans cette vue.</p>}
        </div>}
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Page {Math.floor(offset / 50) + 1}</span>
          <Button size="sm" variant="outline" disabled={!offset || query.isFetching || query.isError} onClick={() => setOffset(Math.max(0, offset - 50))}>Précédent</Button>
          <Button size="sm" variant="outline" disabled={!query.data?.has_more || query.isFetching || query.isError} onClick={() => setOffset(offset + 50)}>Suivant</Button>
        </div>
      </TabsContent>
      <TabsContent value="records"><ModuleWorkspace pageId={d.id} /></TabsContent>
    </Tabs>
  </div>;
}
