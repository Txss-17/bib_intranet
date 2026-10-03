import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  AlertTriangle,
  Warehouse,
  RefreshCw,
  Activity,
  Users,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  useOpsControlKPIs,
  useSyncEvents,
  useReplenishment,
} from '@/hooks/useOpsControl';
import { Progress } from '@/components/ui/progress';

const OpsDashboard = () => {
  const k = useOpsControlKPIs();
  const { data: sync = [], isLoading: syncLoading } = useSyncEvents();
  const { data: repl = [], isLoading: replLoading } = useReplenishment();

  const isLoading = k.isLoading || syncLoading || replLoading;

  const pendingRepl = repl.filter((r) => r.status === 'pending').length;

  const recentErrors = sync
    .filter((s) => s.status === 'error' || s.status === 'timeout')
    .slice(0, 5);

  const tiles = [
    {
      label: 'Référentiel',
      to: '/pole/ops/catalog',
      icon: Package,
      value: 'Produits',
    },
    {
      label: 'Stocks distribués',
      to: '/pole/ops/stocks',
      icon: Warehouse,
      value: `${k.stockUnits.toLocaleString()} u.`,
      alert: k.ruptureCount > 0,
    },
    {
      label: 'Cycle commandes',
      to: '/pole/ops/pipeline',
      icon: Truck,
      value: `${k.ordersInPipeline} en cours`,
    },
    {
      label: 'Partenaires',
      to: '/pole/ops/partners',
      icon: Users,
      value: 'Pilotage',
    },
    {
      label: 'Flux & sync',
      to: '/pole/ops/flows',
      icon: Activity,
      value: `${k.syncSuccessRate}% OK`,
      alert: k.syncErrors24h > 0,
    },
    {
      label: 'Réappro',
      to: '/pole/ops/replenishment',
      icon: Sparkles,
      value: `${pendingRepl} suggestions`,
      alert: pendingRepl > 0,
    },
    {
      label: 'Incidents',
      to: '/pole/ops/incidents',
      icon: AlertTriangle,
      value: `${k.openIncidents} ouverts`,
      alert: k.openIncidents > 0,
    },
    {
      label: 'Audit ↔ OPS',
      to: '/pole/ops/audit-link',
      icon: ShieldCheck,
      value: 'Liaison',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement du contrôle opérationnel…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            OPS — Control Tower
          </h1>

          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            Données live
          </Badge>
        </div>

        <p className="mt-1 text-muted-foreground">
          Produits → Stocks → Commandes → Partenaires → Flux → Contrôle
        </p>
      </div>

      {/* KPIs critiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Commandes en pipeline
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {k.ordersInPipeline}
            </div>

            <p className="text-xs text-muted-foreground">
              {k.ordersDelivered} livrées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Stock total
            </CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {k.stockUnits.toLocaleString()}
            </div>

            <p className="text-xs text-muted-foreground">
              {k.lowStockCount} niveaux faibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ruptures
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {k.ruptureCount}
            </div>

            <p className="text-xs text-muted-foreground">
              SKU × partenaire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sync partenaires
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {k.syncSuccessRate}%
            </div>

            <Progress
              value={k.syncSuccessRate}
              className="mt-2 h-1.5"
            />

            <p className="mt-1 text-xs text-muted-foreground">
              {k.syncErrors24h} erreur(s) sur les dernières 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            Contrôle opérationnel
          </h2>
          <p className="text-sm text-muted-foreground">
            Accès direct aux principaux flux OPS.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;

            return (
              <Link key={tile.label} to={tile.to}>
                <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {tile.label}
                    </CardTitle>

                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-5 w-5 ${
                          tile.alert
                            ? 'text-destructive'
                            : 'text-primary'
                        }`}
                      />

                      <span className="text-base font-semibold">
                        {tile.value}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alertes opérationnelles */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alertes stocks
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  Ruptures
                </p>
                <p className="text-xs text-muted-foreground">
                  Stocks sous le seuil critique
                </p>
              </div>

              <Badge
                variant={
                  k.ruptureCount > 0
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {k.ruptureCount}
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  Stocks faibles
                </p>
                <p className="text-xs text-muted-foreground">
                  À surveiller / réapprovisionner
                </p>
              </div>

              <Badge
                variant={
                  k.lowStockCount > 0
                    ? 'outline'
                    : 'secondary'
                }
              >
                {k.lowStockCount}
              </Badge>
            </div>

            <Link
              to="/pole/ops/stocks"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Voir les stocks distribués
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Réapprovisionnement
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">
                  Suggestions en attente
                </p>
                <p className="text-xs text-muted-foreground">
                  Nécessitent une décision OPS
                </p>
              </div>

              <Badge
                variant={
                  pendingRepl > 0
                    ? 'outline'
                    : 'secondary'
                }
              >
                {pendingRepl}
              </Badge>
            </div>

            <Link
              to="/pole/ops/replenishment"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Ouvrir le réapprovisionnement
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Erreurs récentes */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Dernières erreurs de synchronisation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {recentErrors.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 border-b border-border py-3 last:border-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="destructive"
                    className="text-xs"
                  >
                    {event.event_type}
                  </Badge>

                  <span className="text-sm text-muted-foreground">
                    {event.logistics_partners?.name ??
                      'Partenaire inconnu'}
                  </span>
                </div>

                <span className="max-w-md truncate text-xs text-muted-foreground">
                  {event.error_message ??
                    'Erreur de synchronisation sans détail.'}
                </span>
              </div>
            ))}

            <Link
              to="/pole/ops/flows"
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Consulter tous les flux
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* État sain */}
      {recentErrors.length === 0 &&
        k.ruptureCount === 0 &&
        k.openIncidents === 0 &&
        pendingRepl === 0 && (
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <ShieldCheck className="h-5 w-5 text-primary" />

              <div>
                <p className="text-sm font-medium">
                  Aucun signal critique détecté
                </p>

                <p className="text-xs text-muted-foreground">
                  Stocks, incidents, réapprovisionnement et
                  synchronisations ne présentent actuellement
                  aucune alerte remontée par les données OPS.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default OpsDashboard;