import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { 
  Package, AlertTriangle, TrendingDown, BarChart3, Search, Plus, Eye, 
  FileText, Lightbulb, ChevronRight
} from 'lucide-react';

// KPIs
const kpis = [
  { label: 'Produits Dormants', value: 32, description: 'Produits approuvés, no commande +30j (règle)', icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Taux Rejet Fournisseur', value: '36%', description: 'Taux élevé amène le mois, stable à l\'année sectit', icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { label: 'Taux Échec Précoce', value: '22%', description: 'Taux décès web boutiques, boutiques vite rejetés 30 dos', icon: TrendingDown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { label: 'Concentration Produit', value: '48%', description: 'Top 5 produits génèrent 48% art sols au disproportioné (crcturs)', icon: BarChart3, color: 'text-primary', bgColor: 'bg-primary/10' },
];

// Heatmap data
const heatmapCategories = ['Éco', 'Technologie', 'Maison', 'Lifestyle', 'Santé'];
const heatmapWeeks = ['Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18'];
const heatmapData: Record<string, number[]> = {
  'Éco': [85, 72, 90, 65, 78],
  'Technologie': [45, 55, 38, 60, 70],
  'Maison': [30, 42, 50, 35, 45],
  'Lifestyle': [65, 80, 75, 88, 92],
  'Santé': [20, 15, 25, 30, 18],
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
  { id: 1, source: 'Fournisseur B', detail: 'Rejet: 43% validation produits sur les 90 derniers jours', severity: 'high', date: '2 jours' },
  { id: 2, source: 'Fournisseur A', detail: 'Dépendance: 42% carton recyclé total basé STARTER', severity: 'high', date: "aujourd'hui" },
  { id: 3, source: 'Boutique C', detail: 'Risque Churn: 15 jours sans vente', severity: 'medium', date: 'today' },
];

// Top Risques Actifs
const topRisks = [
  { source: 'Fournisseur B', detail: 'Rejet: 43% validation du produits résumés des newsletters recyclés', date: "aujourd'hui", progress: 85, color: 'bg-destructive' },
  { source: 'Fournisseur A', detail: 'Dépendance: 42% carton recyclé total basé, PARTNER', date: "aujourd'hui", progress: 70, color: 'bg-orange-500' },
  { source: 'Boutique C', detail: 'Risque Churn: 15 jours sans vente', date: '36 min', progress: 45, color: 'bg-blue-500' },
];

// Recommandations
const recommendations = [
  { category: 'Produits', detail: "Retrait 'Infuseur de the Zen Solution' du catalogue", action: 'Retrait', color: 'bg-destructive', date: '12 Settlas' },
  { category: 'Boutiques', detail: "Envoi email prévention impayé 'Boutiques à risque'", action: 'Dispatcher', color: 'bg-orange-500', date: '6estabu' },
  { category: 'Système', detail: "Reporter refonte UX module 'Commande & Expéditions'", action: 'Repousé', color: 'bg-primary', date: "Aujourd'hui" },
];

// R&D Rapport Express
const rapportExpress = {
  date: '12/04',
  risques: 3,
  actions: ['Décassion', 'Faire Analyse'],
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
          <p className="text-muted-foreground">Analyse produits, risques fournisseurs et recommandations</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouveau rapport</Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{k.description}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
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
              <Button variant="outline" size="sm">Analyses Produits <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">Catégories</th>
                    {heatmapWeeks.map(w => (
                      <th key={w} className="text-center text-sm font-medium text-muted-foreground pb-3 px-2">{w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapCategories.map((cat) => (
                    <tr key={cat}>
                      <td className="text-sm font-medium py-1 pr-4">{cat}</td>
                      {heatmapData[cat].map((val, i) => (
                        <td key={i} className="px-1 py-1">
                          <div className={`h-8 rounded ${getHeatColor(val)} flex items-center justify-center`}>
                            <span className="text-[10px] font-semibold text-white">{val}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
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
              <Button variant="outline" size="sm" className="text-xs">Analyses Produits</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${a.severity === 'high' ? 'bg-destructive/10' : 'bg-orange-500/10'}`}>
                    <AlertTriangle className={`h-3.5 w-3.5 ${a.severity === 'high' ? 'text-destructive' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{a.source}</p>
                      <span className="text-xs text-muted-foreground">{a.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.detail}</p>
                  </div>
                </div>
              ))}
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
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded flex items-center justify-center ${r.color}/10`}>
                        <AlertTriangle className={`h-3 w-3 ${r.color === 'bg-destructive' ? 'text-destructive' : r.color === 'bg-orange-500' ? 'text-orange-500' : 'text-blue-500'}`} />
                      </div>
                      <span className="font-semibold text-sm">{r.source}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                  <Progress value={r.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières Recommandations</CardTitle>
              <Button size="sm"><Plus className="h-3 w-3 mr-1" />Faire analyse</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${r.color}/10 shrink-0`}>
                      <Lightbulb className={`h-3.5 w-3.5 ${r.color === 'bg-destructive' ? 'text-destructive' : r.color === 'bg-orange-500' ? 'text-orange-500' : 'text-primary'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.category}</p>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                    <Button size="sm" variant="outline" className={`text-xs h-7 ${r.color === 'bg-destructive' ? 'text-destructive border-destructive/30' : r.color === 'bg-orange-500' ? 'text-orange-500 border-orange-500/30' : 'text-primary border-primary/30'}`}>
                      {r.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rapport R&D Express + Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Rapport R&D Express {rapportExpress.date}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{rapportExpress.risques} Risques détectés</span>
                  {rapportExpress.actions.map(a => (
                    <span key={a} className="flex items-center gap-1"><Eye className="h-3 w-3" />{a}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm"><Plus className="h-3 w-3 mr-1" />Créer Nouveau Rapport</Button>
              <Button size="sm" variant="outline">Ouvrir Alerte</Button>
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30">Rejetée</Button>
              <Button size="sm" variant="outline" className="text-orange-500 border-orange-500/30">Faire Analyse</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
