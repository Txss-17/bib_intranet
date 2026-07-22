import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Square, BarChart3, LineChart, PieChart, Table as TableIcon, Gauge, Map,
  Clock, Type, Image as ImageIcon, Minus, Filter, MousePointerClick,
  AlertTriangle, Target, Grid3x3, Library,
} from 'lucide-react';

const WIDGETS = [
  { type: 'kpi_card', label: 'KPI Card', icon: Square, desc: 'Indicateur clé avec valeur, tendance et sparkline' },
  { type: 'line_chart', label: 'Courbe', icon: LineChart, desc: 'Évolution temporelle d\'une ou plusieurs séries' },
  { type: 'bar_chart', label: 'Histogramme', icon: BarChart3, desc: 'Comparaison de valeurs en barres verticales/horizontales' },
  { type: 'donut_chart', label: 'Donut', icon: PieChart, desc: 'Répartition avec centre libre pour un total' },
  { type: 'pie_chart', label: 'Camembert', icon: PieChart, desc: 'Répartition classique en secteurs' },
  { type: 'table', label: 'Tableau', icon: TableIcon, desc: 'Données tabulaires triables et filtrables' },
  { type: 'gauge', label: 'Jauge', icon: Gauge, desc: 'Progression vers un objectif' },
  { type: 'map', label: 'Carte géographique', icon: Map, desc: 'Distribution géographique des données' },
  { type: 'heatmap', label: 'Heatmap', icon: Grid3x3, desc: 'Densité par croisement de deux dimensions' },
  { type: 'timeline', label: 'Timeline', icon: Clock, desc: 'Chronologie d\'événements' },
  { type: 'scorecard', label: 'Scorecard', icon: Gauge, desc: 'Score composite multi-critères' },
  { type: 'objective', label: 'Objectif vs Réel', icon: Target, desc: 'Comparaison performance vs cible' },
  { type: 'alerts', label: 'Alertes', icon: AlertTriangle, desc: 'Anomalies détectées automatiquement' },
  { type: 'text', label: 'Texte', icon: Type, desc: 'Bloc de contenu enrichi' },
  { type: 'image', label: 'Image', icon: ImageIcon, desc: 'Illustration statique ou dynamique' },
  { type: 'separator', label: 'Séparateur', icon: Minus, desc: 'Ligne de séparation visuelle' },
  { type: 'filter', label: 'Filtre', icon: Filter, desc: 'Contrôle interactif pour le dashboard' },
  { type: 'button', label: 'Bouton', icon: MousePointerClick, desc: 'Action ou navigation' },
];

export default function BIWidgetLibrary() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Library className="h-3.5 w-3.5" /> BI · Bibliothèque
        </div>
        <h1 className="text-2xl font-semibold">Bibliothèque de widgets</h1>
        <p className="text-sm text-muted-foreground mt-1">{WIDGETS.length} composants disponibles dans le Designer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WIDGETS.map(w => {
          const Icon = w.icon;
          return (
            <Card key={w.type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {w.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{w.desc}</p>
                <Badge variant="outline" className="font-mono text-xs">{w.type}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
