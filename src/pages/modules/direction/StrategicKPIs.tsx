import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useExecutiveKPIs } from '@/hooks/useExecutiveKPIs';

export default function StrategicKPIs() {
  const { data, isLoading } = useExecutiveKPIs();

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const kpis = [
    { label: 'Chiffre d\'affaires (30j)', value: data?.revenue30d ?? 0, unit: '€', trend: data?.revenueTrend ?? 0 },
    { label: 'Commandes (30j)', value: data?.orders30d ?? 0, unit: '', trend: data?.ordersTrend ?? 0 },
    { label: 'Fournisseurs actifs', value: data?.activeSuppliers ?? 0, unit: '', trend: 0 },
    { label: 'Taux de conformité', value: data?.complianceRate ?? 0, unit: '%', trend: data?.complianceTrend ?? 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">KPI stratégiques</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Indicateurs clés consolidés des 30 derniers jours.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.trend > 0 ? TrendingUp : kpi.trend < 0 ? TrendingDown : Minus;
          const trendColor = kpi.trend > 0 ? 'text-green-500' : kpi.trend < 0 ? 'text-destructive' : 'text-muted-foreground';
          return (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString('fr-FR') : kpi.value}
                  {kpi.unit && <span className="text-base text-muted-foreground ml-1">{kpi.unit}</span>}
                </div>
                {kpi.trend !== 0 && (
                  <Badge variant="outline" className={`mt-2 gap-1 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(kpi.trend)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Notes de pilotage</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ces KPI sont calculés en temps réel à partir des commandes, fournisseurs et audits.
            Pour la vue globale détaillée, voir le tableau de bord exécutif.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
