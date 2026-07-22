import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, ShieldCheck, Archive, Puzzle, CalendarClock, Plus, FolderOpen, Library, Eye, Rocket, ArrowRight } from 'lucide-react';
import { useDashboards } from '@/hooks/useBI';

export default function BIOverview() {
  const { data: dashboards = [] } = useDashboards();
  const counts = {
    published: dashboards.filter(d => d.status === 'published').length,
    draft: dashboards.filter(d => d.status === 'draft').length,
    validation: dashboards.filter(d => d.status === 'validation').length,
    archived: dashboards.filter(d => d.status === 'archived').length,
  };
  const scheduled = dashboards.filter(d => d.publish_at && new Date(d.publish_at) > new Date()).length;

  const tiles = [
    { label: 'Publiés', value: counts.published, icon: ShieldCheck, hint: 'Actifs' },
    { label: 'Brouillons', value: counts.draft, icon: FileText, hint: 'En cours de conception' },
    { label: 'En validation', value: counts.validation, icon: Eye, hint: 'Revue Data' },
    { label: 'Archivés', value: counts.archived, icon: Archive, hint: 'Historique' },
    { label: 'Widgets personnalisés', value: '—', icon: Puzzle, hint: 'Bibliothèque' },
    { label: 'Déploiements prévus', value: scheduled, icon: CalendarClock, hint: 'Planifiés' },
  ];

  const quick = [
    { title: 'Nouveau tableau de bord', desc: 'Créer depuis zéro', href: '/pole/data/bi/designer/new', icon: Plus, primary: true },
    { title: 'Ouvrir un modèle', desc: '6 templates métier', href: '/pole/data/bi/templates', icon: FolderOpen },
    { title: 'Bibliothèque de widgets', desc: 'KPI, charts, tableaux…', href: '/pole/data/bi/library', icon: Library },
    { title: 'Sources de données', desc: 'KPI, SQL, API, datasets', href: '/pole/data/bi/sources', icon: Puzzle },
    { title: 'Mes tableaux de bord', desc: 'Liste complète', href: '/pole/data/bi/dashboards', icon: LayoutDashboard },
    { title: 'Envoyer en publication', desc: 'Cycle de validation', href: '/pole/data/requests', icon: Rocket },
  ];

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <LayoutDashboard className="h-3.5 w-3.5" /> Data & Analytics · BI
          </div>
          <h1 className="text-2xl font-semibold">Business Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Concevez, validez et publiez des tableaux de bord métier reliés au catalogue KPI.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/pole/data/bi/designer/new"><Plus className="h-4 w-4 mr-2" /> Nouveau tableau</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map(t => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quick.map(l => {
          const Icon = l.icon;
          return (
            <Card key={l.href} className={l.primary ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50 transition-colors'}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-4 w-4" /> {l.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{l.desc}</span>
                <Button asChild variant="ghost" size="sm"><Link to={l.href}>Ouvrir <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Flux BI</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
{`Catalogue KPI  →  Sélection KPI  →  Dashboard Designer  →  Prévisualisation
       ↓
   Validation  →  Demande de publication  →  Backlog Tech  →  Déploiement`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
