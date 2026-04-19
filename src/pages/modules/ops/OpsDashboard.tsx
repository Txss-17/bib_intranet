import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Package, Truck, AlertTriangle, Warehouse, RefreshCw, Activity,
  Users, ArrowRight, Sparkles, ShieldCheck,
} from 'lucide-react';
import { useOpsControlKPIs, useSyncEvents, useReplenishment } from '@/hooks/useOpsControl';
import { Progress } from '@/components/ui/progress';

const OpsDashboard = () => {
  const k = useOpsControlKPIs();
  const { data: sync = [] } = useSyncEvents();
  const { data: repl = [] } = useReplenishment();

  const pendingRepl = repl.filter((r) => r.status === 'pending').length;
  const recentErrors = sync.filter((s) => s.status === 'error').slice(0, 5);

  const tiles = [
    { label: 'Référentiel', to: '/pole/ops/catalog', icon: Package, value: 'Produits' },
    { label: 'Stocks distribués', to: '/pole/ops/stocks', icon: Warehouse, value: `${k.stockUnits.toLocaleString()} u.`, alert: k.ruptureCount > 0 },
    { label: 'Cycle commandes', to: '/pole/ops/pipeline', icon: Truck, value: `${k.ordersInPipeline} en cours` },
    { label: 'Partenaires', to: '/pole/ops/partners', icon: Users, value: 'Pilotage' },
    { label: 'Flux & sync', to: '/pole/ops/flows', icon: Activity, value: `${k.syncSuccessRate}% OK`, alert: k.syncErrors24h > 0 },
    { label: 'Réappro', to: '/pole/ops/replenishment', icon: Sparkles, value: `${pendingRepl} suggestions`, alert: pendingRepl > 0 },
    { label: 'Incidents', to: '/pole/ops/incidents', icon: AlertTriangle, value: `${k.openIncidents} ouverts`, alert: k.openIncidents > 0 },
    { label: 'Audit ↔ OPS', to: '/pole/ops/audit-link', icon: ShieldCheck, value: 'Liaison' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OPS — Control Tower</h1>
        <p className="text-muted-foreground">Produits → Stocks → Commandes → Partenaires → Flux → Contrôle</p>
      </div>

      {/* KPIs critiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Commandes en pipeline</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.ordersInPipeline}</div>
            <p className="text-xs text-muted-foreground">{k.ordersDelivered} livrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock total</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.stockUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{k.lowStockCount} faibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{k.ruptureCount}</div>
            <p className="text-xs text-muted-foreground">SKU × partenaire</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sync partenaires</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.syncSuccessRate}%</div>
            <Progress value={k.syncSuccessRate} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{k.syncErrors24h} erreurs 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick access tiles */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.label}</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <t.icon className={`h-5 w-5 ${t.alert ? 'text-destructive' : 'text-primary'}`} />
                  <span className="text-base font-semibold">{t.value}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Erreurs récentes */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Dernières erreurs de synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentErrors.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 py-2">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="text-xs">{e.event_type}</Badge>
                  <span className="text-muted-foreground">{e.logistics_partners?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-md">{e.error_message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpsDashboard;
