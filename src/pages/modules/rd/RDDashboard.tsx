import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, AlertTriangle, TrendingDown, BarChart3, Search, Plus, Eye, 
  FileText, Lightbulb, ChevronRight, TrendingUp, Zap, Users
} from 'lucide-react';

// KPIs réalistes
const kpis = [
  { label: 'Produits Dormants', value: 32, description: 'Produits validés sans commande depuis +30 jours', icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10', trend: '+4 vs mois dernier' },
  { label: 'Taux Rejet Fournisseur', value: '36%', description: 'Moyenne de rejet sur les 90 derniers jours', icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', trend: '+8% vs trimestre' },
  { label: 'Taux Échec Précoce', value: '22%', description: 'Boutiques inactives dans les 30j après inscription', icon: TrendingDown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', trend: '-3% vs mois dernier' },
  { label: 'Concentration Top 5', value: '48%', description: 'Part du CA générée par les 5 meilleurs produits', icon: BarChart3, color: 'text-primary', bgColor: 'bg-primary/10', trend: 'Stable' },
];

// Heatmap data - adoption produits par catégorie et semaine
const heatmapCategories = ['Éco-responsable', 'Technologie', 'Maison & Déco', 'Lifestyle', 'Santé & Bien-être', 'Alimentation Bio', 'Mode Éthique'];
const heatmapWeeks = ['Sem. 10', 'Sem. 11', 'Sem. 12', 'Sem. 13', 'Sem. 14'];
const heatmapData: Record<string, number[]> = {
  'Éco-responsable': [85, 72, 90, 65, 78],
  'Technologie': [45, 55, 38, 60, 70],
  'Maison & Déco': [30, 42, 50, 35, 45],
  'Lifestyle': [65, 80, 75, 88, 92],
  'Santé & Bien-être': [20, 15, 25, 30, 18],
  'Alimentation Bio': [72, 68, 81, 77, 85],
  'Mode Éthique': [55, 60, 48, 52, 63],
};

const getHeatColor = (val: number) => {
  if (val >= 81) return 'bg-emerald-500';
  if (val >= 51) return 'bg-emerald-400/70';
  if (val >= 21) return 'bg-yellow-400/70';
  if (val >= 6) return 'bg-orange-400/70';
  return 'bg-red-400/70';
};

// Alertes critiques
const criticalAlerts = [
  { id: 1, source: 'EcoTextile Pro', detail: 'Taux de rejet à 43% sur les soumissions produits des 90 derniers jours — seuil critique dépassé', severity: 'high', date: '2h', category: 'Fournisseur' },
  { id: 2, source: 'RecycPack SAS', detail: 'Dépendance critique : 42% du carton recyclé total provient d\'un seul fournisseur', severity: 'high', date: '5h', category: 'Fournisseur' },
  { id: 3, source: 'NaturShop Madrid', detail: 'Risque churn élevé : aucune commande passée depuis 15 jours, compte en phase d\'inactivité', severity: 'medium', date: '1j', category: 'Boutique' },
  { id: 4, source: 'Infuseur Thé Zen', detail: 'Produit dormant depuis 45 jours — aucune commande enregistrée, candidat au retrait catalogue', severity: 'medium', date: '1j', category: 'Produit' },
  { id: 5, source: 'Module Paiements', detail: 'Erreur récurrente de réconciliation sur les paiements fournisseurs (12 occurrences/semaine)', severity: 'high', date: '3h', category: 'Système' },
];

// Top Risques Actifs avec données détaillées
const topRisks = [
  { source: 'EcoTextile Pro', detail: 'Taux de rejet fournisseur à 43% — audit qualité déclenché, livraisons en cours suspendues', date: '2h', progress: 85, color: 'bg-destructive', impact: '€12.4K CA bloqué', owner: 'Sarah M.' },
  { source: 'RecycPack SAS', detail: 'Dépendance mono-fournisseur sur carton recyclé — plan diversification en cours', date: '5h', progress: 70, color: 'bg-orange-500', impact: '42% supply chain', owner: 'Marc L.' },
  { source: 'Boutiques inactives', detail: '8 boutiques sans activité depuis +30 jours — risque de churn groupé détecté', date: '1j', progress: 55, color: 'bg-yellow-500', impact: '€23.8K CA annuel', owner: 'Julie D.' },
  { source: 'Concentration catalogue', detail: 'Top 5 produits = 48% du CA — vulnérabilité en cas de rupture ou retrait', date: '3j', progress: 45, color: 'bg-blue-500', impact: '€156K CA concentré', owner: 'Pierre K.' },
];

// Recommandations R&D
const recommendations = [
  { category: 'Produits', detail: "Retirer 'Infuseur Thé Zen' et 'Gourde Inox 500ml' du catalogue actif — 0 commande en 45j+", action: 'Retirer', color: 'text-destructive', bgColor: 'bg-destructive/10', date: 'Aujourd\'hui', priority: 'Haute' },
  { category: 'Boutiques', detail: "Déclencher campagne email prévention churn pour 8 boutiques à risque (inactivité >15j)", action: 'Dispatcher', color: 'text-orange-500', bgColor: 'bg-orange-500/10', date: 'Aujourd\'hui', priority: 'Haute' },
  { category: 'Fournisseurs', detail: "Lancer sourcing alternatif carton recyclé — objectif : réduire dépendance RecycPack de 42% à 25%", action: 'Planifier', color: 'text-primary', bgColor: 'bg-primary/10', date: 'Cette semaine', priority: 'Critique' },
  { category: 'Système', detail: "Prioriser refonte UX du module 'Commandes & Expéditions' — 45 frictions/mois signalées", action: 'Sprint Q2', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', date: 'Ce mois', priority: 'Moyenne' },
  { category: 'Catalogue', detail: "Élargir la catégorie 'Alimentation Bio' — taux d'adoption en hausse de +18% sur 4 semaines", action: 'Investiguer', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', date: 'Ce mois', priority: 'Moyenne' },
];

// Métriques secondaires
const secondaryMetrics = [
  { label: 'Produits actifs', value: '248', trend: '+12', trendUp: true },
  { label: 'Boutiques actives', value: '184', trend: '+8', trendUp: true },
  { label: 'Fournisseurs actifs', value: '48', trend: '-2', trendUp: false },
  { label: 'Frictions ouvertes', value: '18', trend: '+3', trendUp: false },
  { label: 'Rapports publiés (Q1)', value: '24', trend: '+6', trendUp: true },
  { label: 'Recomm. en attente', value: '16', trend: '-4', trendUp: true },
];

// Rapport Express
const rapportExpress = {
  date: '21/03/2026',
  title: 'Rapport R&D Hebdo — Semaine 12',
  risques: 4,
  recommandations: 5,
  actions: ['Audit Fournisseur B lancé', 'Retrait 2 produits validé', 'Campagne anti-churn préparée'],
};

export default function RDDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');

  const filteredAlerts = criticalAlerts.filter(a => {
    if (alertFilter !== 'all' && a.severity !== alertFilter) return false;
    if (searchQuery && !a.source.toLowerCase().includes(searchQuery.toLowerCase()) && !a.detail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard R&D</h1>
          <p className="text-muted-foreground">Analyse produits, risques fournisseurs, performance boutiques et recommandations</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau rapport</Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{k.description}</p>
                  <p className="text-xs mt-1 font-medium text-muted-foreground">{k.trend}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métriques secondaires */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {secondaryMetrics.map(m => (
          <Card key={m.label}>
            <CardContent className="py-4 px-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold">{m.value}</span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${m.trendUp ? 'text-emerald-500' : 'text-destructive'}`}>
                  {m.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Heatmap + Alertes Critiques */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Heatmap d'Adoption Produits</CardTitle>
              <Button variant="outline" size="sm">Voir détails <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">Catégorie</th>
                    {heatmapWeeks.map(w => (
                      <th key={w} className="text-center text-sm font-medium text-muted-foreground pb-3 px-2">{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapCategories.map((cat) => (
                    <tr key={cat}>
                      <td className="text-sm font-medium py-1.5 pr-4 whitespace-nowrap">{cat}</td>
                      {heatmapData[cat].map((val, i) => (
                        <td key={i} className="px-1 py-1">
                          <div className={`h-9 rounded ${getHeatColor(val)} flex items-center justify-center`}>
                            <span className="text-[11px] font-semibold text-white">{val}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 mt-4 text-xs">
              {[
                { label: '0–5%', color: 'bg-red-400/70' },
                { label: '6–20%', color: 'bg-orange-400/70' },
                { label: '21–50%', color: 'bg-yellow-400/70' },
                { label: '51–80%', color: 'bg-emerald-400/70' },
                { label: '81–100%', color: 'bg-emerald-500' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`h-3 w-6 rounded ${l.color}`} />
                  <span className="text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Alertes Critiques</CardTitle>
              <Badge variant="destructive" className="text-xs">{criticalAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.slice(0, 4).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${a.severity === 'high' ? 'bg-destructive/10' : 'bg-orange-500/10'}`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${a.severity === 'high' ? 'text-destructive' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{a.source}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{a.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.detail}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{a.category}</Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs">
                Voir toutes les alertes ({criticalAlerts.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Risques + Recommandations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Risques Actifs</CardTitle>
              <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" />Ouvrir Alerte</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRisks.map((r, i) => (
                <div key={i} className="space-y-2 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${r.color}`} />
                      <span className="font-semibold text-sm">{r.source}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Progress value={r.progress} className="h-2 w-24" />
                      <span className="text-xs font-medium">{r.progress}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{r.impact}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{r.owner}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières Recommandations</CardTitle>
              <Button size="sm"><Plus className="h-3 w-3 mr-1" />Nouvelle analyse</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${r.bgColor} shrink-0`}>
                      <Lightbulb className={`h-3.5 w-3.5 ${r.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{r.category}</p>
                        <Badge variant="outline" className="text-[10px]">{r.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      {r.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapport R&D Express */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{rapportExpress.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rapportExpress.date}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" />{rapportExpress.risques} risques détectés</span>
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3 text-yellow-500" />{rapportExpress.recommandations} recommandations</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {rapportExpress.actions.map(a => (
                    <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm"><Eye className="h-3 w-3 mr-1" />Consulter</Button>
              <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Nouveau Rapport</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}