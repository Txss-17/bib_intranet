import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Boxes, ClipboardList, Code2, TestTube2, GitBranch,
  Activity, Cable, BookOpen, FlaskConical, AlertTriangle, FileText,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useProductRequests } from '@/hooks/useProductRequests';
import type { LucideIcon } from 'lucide-react';

type ProductArea = {
  label: string; path: string; pageId: string;
  icon: LucideIcon; description: string;
};
const sections: Array<{ title: string; description: string; links: ProductArea[] }> = [
  {
    title: '1. Stratégie, conception & planification',
    description: 'Transformer les besoins métier en spécifications, priorités et jalons de livraison.',
    links: [
      { label: 'Gestion produit', path: '/pole/product/product', pageId: 'product.product', icon: Boxes, description: 'Besoin utilisateur, critères d’acceptation et périmètre fonctionnel' },
      { label: 'Studio & demandes', path: '/pole/product/studio', pageId: 'product.studio', icon: ClipboardList, description: 'Demandes des pôles, cadrage et dossiers de conception' },
      { label: 'Roadmap', path: '/pole/product/roadmap', pageId: 'product.roadmap', icon: CalendarDays, description: 'Versions prévues, dépendances et jalons à valider' },
      { label: 'Backlog', path: '/pole/product/backlog', pageId: 'product.backlog', icon: GitBranch, description: 'Priorités, impacts, responsables et avancement métier' },
    ],
  },
  {
    title: '2. Engineering & assurance qualité logicielle',
    description: 'Préparer les développements, organiser les vérifications et conserver les preuves de recette.',
    links: [
      { label: 'Engineering', path: '/pole/product/engineering', pageId: 'product.engineering', icon: Code2, description: 'Implémentations, dépendances et dossier de livraison' },
      { label: 'Frictions & anomalies', path: '/pole/product/frictions', pageId: 'product.frictions', icon: AlertTriangle, description: 'Signaux utilisateurs et anomalies à qualifier' },
    ],
  },
  {
    title: '3. Intégrations, livraisons & exploitation',
    description: 'Coordonner les changements entre Platform, Intranet et Audit Hub, sans confondre validation et déploiement.',
    links: [
      { label: 'Intégrations et contrats', path: '/pole/product/integrations', pageId: 'product.integrations', icon: Cable, description: 'API, schémas, idempotence et reprises de synchronisation' },
      { label: 'Performance du catalogue produit', path: '/pole/product/performance', pageId: 'product.performance', icon: Activity, description: 'Analyse commerciale et adoption des produits ; ne mesure pas la disponibilité des applications' },
      { label: 'Rapports & recommandations', path: '/pole/product/reports', pageId: 'product.reports', icon: FileText, description: 'Bilans, arbitrages et actions correctives' },
    ],
  },
  {
    title: '4. Architecture, documentation & innovation',
    description: 'Capitaliser les choix techniques et expérimenter sans intervenir directement en production.',
    links: [
      { label: 'Documentation technique', path: '/pole/product/documentation', pageId: 'product.documentation', icon: BookOpen, description: 'Architecture, décisions, contrats et documentation versionnée' },
      { label: 'Innovation & R&D', path: '/pole/product/innovation', pageId: 'product.innovation', icon: FlaskConical, description: 'Hypothèses, prototypes, preuves et décisions de poursuite' },
    ],
  },
];

export default function ProductEngineeringDashboard() {
  const { canViewPage } = usePermissions();
  const requestsQuery = useProductRequests();
  const requests = requestsQuery.data ?? [];
  const openRequests = requests.filter((request) =>
    !['done', 'rejected'].includes(request.status)).length;

  return <div className="space-y-6 p-6">
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <Code2 className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Produit & Engineering</h1>
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground">
        Pilotage de BIB Platform, de BIB Intranet et de BIB Audit Hub, depuis le besoin utilisateur
        jusqu'aux tests, à la mise en production et à l'amélioration continue.
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">3 produits à piloter</Badge>
        <Badge variant="secondary">Dossiers ≠ tests exécutés ≠ versions déployées</Badge>
      </div>
    </header>

    {canViewPage('product.studio') && <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-muted-foreground">Demandes produit non clôturées</p>
          <p className="text-2xl font-semibold">
            {requestsQuery.isLoading || requestsQuery.isError ? '—' : openRequests}
          </p>
          {requestsQuery.isError && <p role="alert" className="text-xs text-destructive">Le registre des demandes est indisponible.</p>}
        </div>
        <Button asChild variant="outline"><Link to="/pole/product/studio">
          Suivre les demandes <ArrowUpRight className="ml-2 h-4 w-4" />
        </Link></Button>
      </CardContent>
    </Card>}

    <div role="note" className="flex items-start gap-3 rounded-lg border p-4 text-sm text-muted-foreground">
      <TestTube2 className="mt-0.5 h-5 w-5 shrink-0" />
      Les registres génériques de roadmap, backlog, engineering et intégrations dépendent
      de fonctions de données qui ne sont pas encore confirmées opérationnelles.
      Les statuts de compilation, de recette et de déploiement ne sont pas déduits de fiches administratives.
      Les vraies exécutions devront être raccordées aux preuves CI/CD et aux environnements.
    </div>

    {sections.map((section) => {
      const visible = section.links.filter((item) => canViewPage(item.pageId));
      if (!visible.length) return null;
      return <section key={section.title} className="space-y-3">
        <div><h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{section.description}</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
            const Icon = item.icon;
            return <Card key={item.path} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />{item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="min-h-10 text-sm text-muted-foreground">{item.description}</p>
                <Button variant="outline" asChild size="sm">
                  <Link to={item.path}>Ouvrir <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>;
          })}
        </div>
      </section>;
    })}

    <Card><CardHeader><CardTitle className="text-base">Responsabilités transversales</CardTitle></CardHeader>
      <CardContent className="grid gap-2 text-sm md:grid-cols-2">
        <p><strong>Produit & Engineering :</strong> développement, intégrations, tests logiciels et mise en production.</p>
        <p><strong>Security & IT :</strong> sécurité, habilitations, revue des vulnérabilités et supervision.</p>
        <p><strong>Data & BI :</strong> fiabilité et qualité des flux de données, KPI et analyses transverses.</p>
        <p><strong>Pôles métier :</strong> validation des besoins et recette fonctionnelle des processus.</p>
      </CardContent>
    </Card>
  </div>;
}
