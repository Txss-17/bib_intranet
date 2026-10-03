import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Eye,
  FileText,
  Lightbulb,
  Package,
  Plus,
  Rocket,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const kpis = [
  {
    label: 'Produits actifs',
    value: 248,
    description: 'Produits actuellement disponibles dans le catalogue',
    icon: Package,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    trend: '+12 ce mois',
  },
  {
    label: 'Frictions ouvertes',
    value: 18,
    description: 'Bugs, problèmes UX et irritants identifiés',
    icon: Zap,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    trend: '+3 cette semaine',
  },
  {
    label: 'Demandes Produit',
    value: 16,
    description: 'Demandes inter-pôles actuellement en attente',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    trend: '-4 cette semaine',
  },
  {
    label: 'Livraisons en cours',
    value: 9,
    description: 'Évolutions et développements actuellement suivis',
    icon: Rocket,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    trend: '+2 cette semaine',
  },
];

const heatmapCategories = [
  'Éco-responsable',
  'Technologie',
  'Maison & Déco',
  'Lifestyle',
  'Santé & Bien-être',
  'Alimentation Bio',
  'Mode Éthique',
];

const heatmapWeeks = [
  'Sem. 10',
  'Sem. 11',
  'Sem. 12',
  'Sem. 13',
  'Sem. 14',
];

const heatmapData: Record<string, number[]> = {
  'Éco-responsable': [85, 72, 90, 65, 78],
  Technologie: [45, 55, 38, 60, 70],
  'Maison & Déco': [30, 42, 50, 35, 45],
  Lifestyle: [65, 80, 75, 88, 92],
  'Santé & Bien-être': [20, 15, 25, 30, 18],
  'Alimentation Bio': [72, 68, 81, 77, 85],
  'Mode Éthique': [55, 60, 48, 52, 63],
};

const getHeatColor = (value: number) => {
  if (value >= 81) return 'bg-emerald-500';
  if (value >= 51) return 'bg-emerald-400/70';
  if (value >= 21) return 'bg-yellow-400/70';
  if (value >= 6) return 'bg-orange-400/70';
  return 'bg-red-400/70';
};

const productAlerts = [
  {
    id: 1,
    source: 'Module Commandes & Expéditions',
    detail:
      '45 frictions UX signalées sur le parcours de traitement des commandes ce mois-ci.',
    severity: 'high',
    date: '2h',
    category: 'UX',
  },
  {
    id: 2,
    source: 'Catalogue produits',
    detail:
      '32 produits validés sans commande depuis plus de 30 jours.',
    severity: 'medium',
    date: '5h',
    category: 'Catalogue',
  },
  {
    id: 3,
    source: 'Parcours boutique',
    detail:
      'Hausse des abandons sur le parcours de configuration initiale.',
    severity: 'medium',
    date: '1j',
    category: 'Produit',
  },
  {
    id: 4,
    source: 'Réconciliation paiements',
    detail:
      '12 erreurs techniques détectées cette semaine sur le traitement des événements de paiement.',
    severity: 'high',
    date: '3h',
    category: 'Engineering',
  },
  {
    id: 5,
    source: 'Performance plateforme',
    detail:
      'Dégradation ponctuelle du temps de réponse sur plusieurs endpoints.',
    severity: 'high',
    date: '1j',
    category: 'Infrastructure',
  },
];

const activeProjects = [
  {
    source: 'Commandes & Expéditions',
    detail:
      'Refonte du parcours de traitement des commandes et amélioration de la visibilité opérationnelle.',
    progress: 72,
    status: 'En cours',
    impact: 'Fort',
    owner: 'Produit',
  },
  {
    source: 'Catalogue marketplace',
    detail:
      'Amélioration de la recherche, des filtres et de la présentation des produits vérifiés.',
    progress: 58,
    status: 'En cours',
    impact: 'Fort',
    owner: 'Produit',
  },
  {
    source: 'Performance plateforme',
    detail:
      'Optimisation des appels API et réduction des temps de réponse sur les parcours critiques.',
    progress: 45,
    status: 'En cours',
    impact: 'Moyen',
    owner: 'Engineering',
  },
  {
    source: 'Observabilité',
    detail:
      'Renforcement du suivi des erreurs, performances et événements techniques.',
    progress: 34,
    status: 'Planifié',
    impact: 'Moyen',
    owner: 'Engineering',
  },
];

const recommendations = [
  {
    category: 'Produit',
    detail:
      'Prioriser la refonte du parcours Commandes & Expéditions compte tenu du volume de frictions observées.',
    action: 'Prioriser',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    date: "Aujourd'hui",
    priority: 'Haute',
  },
  {
    category: 'Catalogue',
    detail:
      'Analyser les 32 produits dormants avant toute décision de retrait ou de repositionnement.',
    action: 'Analyser',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    date: "Aujourd'hui",
    priority: 'Haute',
  },
  {
    category: 'Engineering',
    detail:
      'Planifier la réduction des erreurs de réconciliation sur les flux de paiement.',
    action: 'Planifier',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    date: 'Cette semaine',
    priority: 'Critique',
  },
  {
    category: 'UX',
    detail:
      'Étudier les abandons du parcours de configuration boutique et identifier les principaux points de friction.',
    action: 'Investiguer',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    date: 'Ce mois',
    priority: 'Moyenne',
  },
  {
    category: 'Performance',
    detail:
      'Étendre la supervision aux parcours critiques de la marketplace et du back-office.',
    action: 'Planifier',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    date: 'Ce mois',
    priority: 'Moyenne',
  },
];

const secondaryMetrics = [
  {
    label: 'Produits actifs',
    value: '248',
    trend: '+12',
    trendUp: true,
  },
  {
    label: 'Boutiques actives',
    value: '184',
    trend: '+8',
    trendUp: true,
  },
  {
    label: 'Demandes Produit',
    value: '16',
    trend: '-4',
    trendUp: true,
  },
  {
    label: 'Frictions ouvertes',
    value: '18',
    trend: '+3',
    trendUp: false,
  },
  {
    label: 'Livraisons ce mois',
    value: '24',
    trend: '+6',
    trendUp: true,
  },
  {
    label: 'Incidents techniques',
    value: '7',
    trend: '-2',
    trendUp: true,
  },
];

const reportExpress = {
  date: '03/10/2026',
  title: 'Rapport Produit & Engineering — Semaine 40',
  risks: 5,
  recommendations: 5,
  actions: [
    'Refonte commandes priorisée',
    'Analyse produits dormants lancée',
    'Supervision technique renforcée',
  ],
};

export default function RDDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');

  const filteredAlerts = productAlerts.filter((alert) => {
    if (
      alertFilter !== 'all' &&
      alert.severity !== alertFilter
    ) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    const query = searchQuery.toLowerCase();

    return (
      alert.source.toLowerCase().includes(query) ||
      alert.detail.toLowerCase().includes(query) ||
      alert.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />

            <h1 className="text-2xl font-bold">
              Produit & Engineering
            </h1>
          </div>

          <p className="mt-1 text-muted-foreground">
            Pilotage produit, performance plateforme, frictions,
            recommandations et delivery.
          </p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle analyse
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>

                    <p
                      className={`mt-1 text-3xl font-bold ${kpi.color}`}
                    >
                      {kpi.value}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {kpi.description}
                    </p>

                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {kpi.trend}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bgColor}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${kpi.color}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {secondaryMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="px-4 py-4">
              <p className="text-xs text-muted-foreground">
                {metric.label}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold">
                  {metric.value}
                </span>

                <span
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    metric.trendUp
                      ? 'text-emerald-500'
                      : 'text-destructive'
                  }`}
                >
                  {metric.trendUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}

                  {metric.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                Adoption du catalogue
              </CardTitle>

              <Button
                variant="outline"
                size="sm"
              >
                Voir détails
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="pb-3 pr-4 text-left text-sm font-medium text-muted-foreground">
                      Catégorie
                    </th>

                    {heatmapWeeks.map((week) => (
                      <th
                        key={week}
                        className="px-2 pb-3 text-center text-sm font-medium text-muted-foreground"
                      >
                        {week}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {heatmapCategories.map((category) => (
                    <tr key={category}>
                      <td className="whitespace-nowrap py-1.5 pr-4 text-sm font-medium">
                        {category}
                      </td>

                      {heatmapData[category].map(
                        (value, index) => (
                          <td
                            key={`${category}-${index}`}
                            className="px-1 py-1"
                          >
                            <div
                              className={`flex h-9 items-center justify-center rounded ${getHeatColor(
                                value,
                              )}`}
                            >
                              <span className="text-[11px] font-semibold text-white">
                                {value}%
                              </span>
                            </div>
                          </td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              {[
                {
                  label: '0–5%',
                  color: 'bg-red-400/70',
                },
                {
                  label: '6–20%',
                  color: 'bg-orange-400/70',
                },
                {
                  label: '21–50%',
                  color: 'bg-yellow-400/70',
                },
                {
                  label: '51–80%',
                  color: 'bg-emerald-400/70',
                },
                {
                  label: '81–100%',
                  color: 'bg-emerald-500',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1"
                >
                  <div
                    className={`h-3 w-6 rounded ${item.color}`}
                  />

                  <span className="text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Alertes Produit
              </CardTitle>

              <Badge
                variant="destructive"
                className="text-xs"
              >
                {filteredAlerts.length}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {filteredAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                      alert.severity === 'high'
                        ? 'bg-destructive/10'
                        : 'bg-orange-500/10'
                    }`}
                  >
                    <AlertTriangle
                      className={`h-3.5 w-3.5 ${
                        alert.severity === 'high'
                          ? 'text-destructive'
                          : 'text-orange-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {alert.source}
                      </p>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {alert.date}
                      </span>
                    </div>

                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {alert.detail}
                    </p>

                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px]"
                    >
                      {alert.category}
                    </Badge>
                  </div>
                </div>
              ))}

              {filteredAlerts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aucune alerte correspondant aux critères.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Voir toutes les alertes
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>
              Projets Produit & Engineering
            </CardTitle>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />

                <Input
                  className="w-56 pl-9"
                  placeholder="Rechercher…"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                />
              </div>

              <Select
                value={alertFilter}
                onValueChange={setAlertFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    Toutes les priorités
                  </SelectItem>

                  <SelectItem value="high">
                    Haute
                  </SelectItem>

                  <SelectItem value="medium">
                    Moyenne
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {activeProjects.map((project) => (
              <div
                key={project.source}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />

                      <p className="text-sm font-semibold">
                        {project.source}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.detail}
                    </p>
                  </div>

                  <Badge variant="outline">
                    {project.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-3">
                    <Progress
                      value={project.progress}
                      className="h-2"
                    />

                    <span className="text-xs font-medium">
                      {project.progress}%
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px]"
                  >
                    {project.impact}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Responsable : {project.owner}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Risques Produit & Engineering
              </CardTitle>

              <Button
                variant="outline"
                size="sm"
              >
                <Plus className="mr-1 h-3 w-3" />
                Déclarer
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {productAlerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          alert.severity === 'high'
                            ? 'text-destructive'
                            : 'text-orange-500'
                        }`}
                      />

                      <span className="text-sm font-semibold">
                        {alert.source}
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {alert.date}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {alert.detail}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={
                        alert.severity === 'high'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {alert.severity === 'high'
                        ? 'Haute'
                        : 'Moyenne'}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {alert.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Dernières recommandations
              </CardTitle>

              <Button size="sm">
                <Plus className="mr-1 h-3 w-3" />
                Nouvelle analyse
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {recommendations.map((recommendation) => (
                <div
                  key={`${recommendation.category}-${recommendation.detail}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${recommendation.bgColor}`}
                    >
                      <Lightbulb
                        className={`h-3.5 w-3.5 ${recommendation.color}`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {recommendation.category}
                        </p>

                        <Badge
                          variant="outline"
                          className="text-[10px]"
                        >
                          {recommendation.priority}
                        </Badge>
                      </div>

                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {recommendation.detail}
                      </p>
                    </div>
                  </div>

                  <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {recommendation.date}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                    >
                      {recommendation.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  {reportExpress.title}
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {reportExpress.date}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    {reportExpress.risks} risques détectés
                  </span>

                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-yellow-500" />
                    {reportExpress.recommendations}{' '}
                    recommandations
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {reportExpress.actions.map((action) => (
                    <Badge
                      key={action}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm">
                <Eye className="mr-1 h-3 w-3" />
                Consulter
              </Button>

              <Button
                size="sm"
                variant="outline"
              >
                <Plus className="mr-1 h-3 w-3" />
                Nouveau rapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}