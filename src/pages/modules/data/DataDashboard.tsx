import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, GitPullRequest, ListChecks, History, LineChart, ArrowRight } from 'lucide-react';
import { useKpiCatalog, usePublicationRequests, useTechBacklog, usePublications } from '@/hooks/useDataQueries';

export default function DataDashboard() {
  const kpiQuery = useKpiCatalog();
  const requestsQuery = usePublicationRequests();
  const backlogQuery = useTechBacklog();
  const pubsQuery = usePublications();
  const kpis = kpiQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const backlog = backlogQuery.data ?? [];
  const pubs = pubsQuery.data ?? [];
  const dataIncomplete = [kpiQuery, requestsQuery, backlogQuery, pubsQuery].some(
    (query) => query.isError || query.isLoading,
  );

  const activeKpis = kpis.filter((k) => k.status === 'active').length;
  const draftKpis = kpis.filter((k) => k.status === 'draft').length;
  const inFlight = requests.filter((r) => !['deployed', 'archived', 'rejected'].includes(r.status)).length;
  const deployed30d = requests.filter((r) => {
    if (!r.deployed_at) return false;
    return (Date.now() - new Date(r.deployed_at).getTime()) < 30 * 24 * 3600 * 1000;
  }).length;
  const backlogOpen = backlog.filter((b) => !['done', 'cancelled'].includes(b.status)).length;
  const pubsPublished = pubs.filter((p) => p.status === 'published').length;

  const tiles = [
    { label: 'KPI actifs', value: kpiQuery.isError || kpiQuery.isLoading ? '—' : activeKpis, hint: kpiQuery.isError ? 'Source indisponible' : `${draftKpis} en brouillon`, icon: BookOpen },
    { label: 'Demandes en cours', value: requestsQuery.isError || requestsQuery.isLoading ? '—' : inFlight, hint: requestsQuery.isError ? 'Source indisponible' : `${deployed30d} déployées (30j)`, icon: GitPullRequest },
    { label: 'Backlog Tech ouvert', value: backlogQuery.isError || backlogQuery.isLoading ? '—' : backlogOpen, hint: backlogQuery.isError ? 'Source indisponible' : `${backlog.length} au total`, icon: ListChecks },
    { label: 'Publications publiées', value: pubsQuery.isError || pubsQuery.isLoading ? '—' : pubsPublished, hint: pubsQuery.isError ? 'Source indisponible' : `${pubs.length} au total`, icon: LineChart },
  ];

  const quickLinks = [
    { title: 'Catalogue KPI', desc: 'Bibliothèque officielle des indicateurs', href: '/pole/data/kpi', icon: BookOpen },
    { title: 'Demandes de publication', desc: 'Workflow Data → Tech', href: '/pole/data/requests', icon: GitPullRequest },
    { title: 'Backlog Tech', desc: 'Priorités, complexité, échéances', href: '/pole/data/backlog', icon: ListChecks },
    { title: 'Historique des versions', desc: 'Traçabilité des évolutions', href: '/pole/data/versions', icon: History },
  ];

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Data & Analytics
          </div>
          <h1 className="text-2xl font-semibold">Dashboard Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gouvernance des indicateurs, workflows de publication et backlog technique.
          </p>
        </div>
      </header>

      {dataIncomplete && (
        <div role="alert" className="rounded-lg border p-3 text-sm text-muted-foreground">
          Une ou plusieurs sources Data sont indisponibles ou en cours de chargement.
          Les chiffres correspondants ne sont pas confirmés.
          <Button type="button" variant="outline" className="ml-3"
            onClick={() => { void kpiQuery.refetch(); void requestsQuery.refetch(); void backlogQuery.refetch(); void pubsQuery.refetch(); }}>
            Actualiser les sources
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{t.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-semibold mt-2">{t.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.hint}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map((l) => {
          const Icon = l.icon;
          return (
            <Card key={l.href} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" /> {l.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{l.desc}</span>
                <Button asChild variant="ghost" size="sm">
                  <Link to={l.href}>Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gouvernance des données</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2"><Badge variant="outline">Data</Badge> Définit les KPI, crée les rapports et interprète les résultats.</div>
          <div className="flex items-start gap-2"><Badge variant="outline">Tech</Badge> Développe, déploie et maintient les fonctionnalités et tableaux de bord.</div>
          <div className="flex items-start gap-2"><Badge variant="outline">Direction</Badge> Valide les indicateurs stratégiques.</div>
          <div className="flex items-start gap-2"><Badge variant="outline">Métiers</Badge> Utilisent les tableaux de bord pour piloter leurs activités.</div>
        </CardContent>
      </Card>
    </div>
  );
}
