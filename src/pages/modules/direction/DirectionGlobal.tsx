import { Building2, TrendingUp, Users, Package, ShoppingCart, AlertTriangle, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useExecutiveKPIs, usePolePerformance, useRecentCriticalAlerts } from '@/hooks/useExecutiveKPIs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

export default function DirectionGlobal() {
  const { data: kpis, isLoading } = useExecutiveKPIs();
  const { data: poles = [] } = usePolePerformance();
  const { data: alerts = [] } = useRecentCriticalAlerts();

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)} M€` : n >= 1000 ? `${(n / 1000).toFixed(0)} K€` : `${n.toFixed(0)} €`;

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const cards = [
    { label: 'CA consolidé', value: fmt(kpis?.totalRevenue || 0), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'EBITDA', value: fmt(kpis?.ebitda || 0), icon: TrendingUp, color: (kpis?.ebitda || 0) >= 0 ? 'text-emerald-500' : 'text-destructive' },
    { label: 'Commandes', value: String(kpis?.totalOrders || 0), icon: ShoppingCart, color: 'text-primary' },
    { label: 'Clients actifs', value: String(kpis?.totalUsers || 0), icon: Users, color: 'text-blue-500' },
    { label: 'Fournisseurs', value: String(kpis?.totalSuppliers || 0), icon: Package, color: 'text-emerald-500' },
    { label: 'Incidents', value: String(kpis?.openIncidents || 0), icon: AlertTriangle, color: kpis?.openIncidents ? 'text-destructive' : 'text-emerald-500' },
    { label: 'Tickets support', value: String(kpis?.openTickets || 0), icon: Activity, color: 'text-yellow-500' },
    { label: 'Qualité fourn.', value: `${kpis?.avgSupplierQuality || 'N/A'}%`, icon: BarChart3, color: 'text-primary' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="h-7 w-7 text-primary" /> Direction — Vue Groupe</h1>
          <p className="text-muted-foreground mt-1">Consolidation temps réel de tous les pôles LINKSY.</p>
        </div>
        <Badge variant="outline"><Activity className="h-3 w-3 mr-1 text-emerald-500" /> Live</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className={`h-5 w-5 ${c.color} mb-2`} />
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Performance financière (K€)</CardTitle></CardHeader>
          <CardContent>
            {kpis?.chartData && kpis.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={kpis.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="ca" name="CA" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">Pas encore de données</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Santé des pôles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {poles.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.name}</span>
                <div className="flex items-center gap-2">
                  <Progress value={p.score} className="w-32 h-2" />
                  <span className="text-sm w-10 text-right">{p.score}%</span>
                </div>
              </div>
            ))}
            {poles.length === 0 && <p className="text-muted-foreground text-sm">Aucune donnée</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alertes récentes</CardTitle></CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Aucune alerte active</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <Badge className={a.severity === 'critical' ? 'bg-destructive text-destructive-foreground' : 'bg-orange-500 text-white'}>{a.severity}</Badge>
                  <p className="text-sm flex-1">{a.message}</p>
                  <span className="text-xs text-muted-foreground">{a.pole}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
