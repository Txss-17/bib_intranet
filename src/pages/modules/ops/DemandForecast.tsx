import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDemandForecasts, useRecomputeForecasts } from '@/hooks/useOpsForecast';
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin, Activity } from 'lucide-react';

export default function DemandForecast() {
  const { data: forecasts = [], isLoading } = useDemandForecasts();
  const recompute = useRecomputeForecasts();

  const totalProjected = forecasts.reduce((a, f) => a + Number(f.projected_sales_7d), 0);
  const regions = new Set(forecasts.map((f) => f.region ?? 'unknown')).size;
  const trending = forecasts.filter((f) => Number(f.trend_percent) > 10).length;

  const trendBadge = (trend: number) => {
    if (trend > 10) return <Badge className="bg-success text-success-foreground gap-1"><TrendingUp className="h-3 w-3" />+{trend}%</Badge>;
    if (trend < -10) return <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" />{trend}%</Badge>;
    return <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" />{trend}%</Badge>;
  };

  const confidenceBadge = (level: string) => {
    if (level === 'high') return <Badge className="bg-success text-success-foreground">Élevée</Badge>;
    if (level === 'medium') return <Badge className="bg-warning text-warning-foreground">Moyenne</Badge>;
    return <Badge variant="outline">Faible</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prévision de demande</h1>
          <p className="text-muted-foreground">Anticipation par produit × région — moyenne 7j vs 14j précédents</p>
        </div>
        <Button onClick={() => recompute.mutate()} disabled={recompute.isPending} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${recompute.isPending ? 'animate-spin' : ''}`} />
          Recalculer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projection 7j (unités)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalProjected).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Régions actives</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En forte hausse</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{trending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prévisions par produit × région</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead className="text-right">Vente moy/jour (7j)</TableHead>
                  <TableHead className="text-right">Projection 7j</TableHead>
                  <TableHead>Tendance</TableHead>
                  <TableHead>Confiance</TableHead>
                  <TableHead className="text-right">Échantillon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecasts.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.product_catalog?.shop_sku ?? '—'}</TableCell>
                    <TableCell>{f.product_catalog?.name ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline">{f.region ?? 'inconnue'}</Badge></TableCell>
                    <TableCell className="text-right">{Number(f.avg_daily_sales_7d).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{Math.round(Number(f.projected_sales_7d))}</TableCell>
                    <TableCell>{trendBadge(Number(f.trend_percent))}</TableCell>
                    <TableCell>{confidenceBadge(f.confidence_level)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{f.sample_size}</TableCell>
                  </TableRow>
                ))}
                {forecasts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Aucune prévision. Cliquez sur « Recalculer » pour générer.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
