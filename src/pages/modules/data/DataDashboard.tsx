import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, GitPullRequest, ListChecks, History, LineChart, ArrowRight, Database, GitBranch, ShieldCheck, Activity, Workflow } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDataSources } from '@/hooks/useBI';
import { useKpiCatalog, usePublicationRequests, useTechBacklog, usePublications } from '@/hooks/useDataQueries';

export default function DataDashboard() {
  const kpiQuery = useKpiCatalog();
  const requestsQuery = usePublicationRequests();
  const backlogQuery = useTechBacklog();
  const pubsQuery = usePublications();
  const sourcesQuery = useDataSources();
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

  const roles = {
    analyst: [
      { title: 'Explorer les indicateurs', desc: 'Définitions, formules, fréquences, propriétaires et séries à valider', href: '/pole/data/kpi', icon: BookOpen },
      { title: 'Analyser et visualiser', desc: 'Créer des vues et tableaux de bord BI pour les décisions métier', href: '/pole/data/bi', icon: BarChart3 },
      { title: 'Rapporter les résultats', desc: 'Comparer les indicateurs et consulter les publications validées', href: '/pole/data/reports', icon: LineChart },
      { title: 'Demander une publication', desc: 'Transmettre les résultats validés au circuit de recette technique', href: '/pole/data/requests', icon: GitPullRequest },
    ],
    engineer: [
      { title: 'Cartographier les sources', desc: 'Inventorier les origines KPI, API, vues SQL et jeux de données', href: '/pole/data/bi/sources', icon: Database },
      { title: 'Contrôler les contrats et versions', desc: 'Traçabilité des schémas, versions et mises à jour des indicateurs', href: '/pole/data/versions', icon: GitBranch },
      { title: 'Suivre les anomalies Data', desc: 'Besoins de fiabilité, correction ou évolution dans le backlog', href: '/pole/data/backlog', icon: ListChecks },
      { title: 'Coordonner les intégrations', desc: 'Contrats de flux et tests d’intégration avec Produit & Engineering', href: '/pole/product/integrations', icon: Workflow },
    ],
  };

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
          <h1 className="text-2xl font-semibold">Data & BI — espace de travail</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deux métiers complémentaires : analyse décisionnelle et ingénierie des données, avec un catalogue et une gouvernance communs.
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

      <Tabs defaultValue="analyst" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="analyst">Espace Data Analyst</TabsTrigger>
          <TabsTrigger value="engineer">Espace Data Engineer</TabsTrigger>
          <TabsTrigger value="quality">Qualité & gouvernance</TabsTrigger>
        </TabsList>
        {(['analyst', 'engineer'] as const).map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold">{role === 'analyst' ? 'Analyse, visualisation et recommandations' : 'Fiabilité, alimentation et transformation des données'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === 'analyst'
                  ? 'Le Data Analyst part d’une question métier, choisit les KPI, explore les données, analyse les écarts et produit un rapport validable.'
                  : 'Le Data Engineer documente les sources, contrôle les contrats de données et les anomalies, puis coordonne les correctifs techniques avec Engineering.'}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {roles[role].map((item) => {
                const Icon = item.icon;
                return <Card key={item.href}>
                  <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4"/>{item.title}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <Button asChild variant="outline" size="sm"><Link to={item.href}>Ouvrir <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
                  </CardContent>
                </Card>;
              })}
            </div>
          </TabsContent>
        ))}
        <TabsContent value="quality" className="space-y-4">
          <div className="rounded-lg border p-4 text-sm">
            <h2 className="font-semibold">Contrôles de qualité et de gouvernance</h2>
            <p className="mt-1 text-muted-foreground">Avant toute publication : définition, source, fraîcheur, complétude, unicité, cohérence des agrégations, confidentialité et traçabilité des changements.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><Database className="mb-2 h-5 w-5"/><p className="text-sm font-medium">Sources BI recensées</p><p className="mt-1 text-xl font-semibold">{sourcesQuery.isLoading || sourcesQuery.isError ? '—' : (sourcesQuery.data ?? []).length}</p><p className="text-xs text-muted-foreground">{sourcesQuery.isError ? 'Source indisponible' : 'Inventaire, pas preuve de connexion active'}</p></CardContent></Card>
            <Card><CardContent className="p-4"><Activity className="mb-2 h-5 w-5"/><p className="text-sm font-medium">Fraîcheur et exécutions de pipelines</p><p className="mt-1 text-xl font-semibold">Non mesurées</p><p className="text-xs text-muted-foreground">Aucune métrique réelle d’orchestration raccordée à cette page.</p></CardContent></Card>
            <Card><CardContent className="p-4"><ShieldCheck className="mb-2 h-5 w-5"/><p className="text-sm font-medium">Tests qualité automatisés</p><p className="mt-1 text-xl font-semibold">Non confirmés</p><p className="text-xs text-muted-foreground">Contrats et preuves d’exécution requis avant tout statut « réussi ».</p></CardContent></Card>
          </div>
          <p className="text-xs text-muted-foreground">
            La définition des contrôles et des KPI relève de Data ; leur exécution dans les pipelines et leur déploiement relèvent de Data Engineering avec Produit & Engineering. Sécurité & IT valide les accès.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/pole/data/bi/sources">Catalogue des sources</Link></Button>
            <Button asChild variant="outline"><Link to="/pole/data/requests">Demandes et validations</Link></Button>
            <Button asChild variant="outline"><Link to="/pole/product/engineering">Recette technique Engineering</Link></Button>
          </div>
        </TabsContent>
      </Tabs>

      <h2 className="text-lg font-semibold">Accès rapides transversaux</h2>
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
