import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Loader2,
  ArrowRight,
  Users
} from "lucide-react";
import { useOrders, useShipments, useLogisticsIncidents, useLogisticsPartners, calculateOpsKPIs } from "@/hooks/useOps";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from "react-router-dom";

const OpsDashboard = () => {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments();
  const { data: incidents = [], isLoading: incidentsLoading } = useLogisticsIncidents();
  const { data: partners = [] } = useLogisticsPartners();

  const isLoading = ordersLoading || shipmentsLoading || incidentsLoading;
  const kpis = calculateOpsKPIs(orders, shipments, incidents);

  // Chart data
  const orderStatusData = [
    { name: 'En attente', value: kpis.pendingOrders, color: 'hsl(var(--muted-foreground))' },
    { name: 'En traitement', value: kpis.processingOrders, color: 'hsl(var(--primary))' },
    { name: 'Expédiées', value: kpis.shippedOrders, color: 'hsl(var(--chart-1))' },
    { name: 'Livrées', value: kpis.deliveredOrders, color: 'hsl(var(--chart-2))' },
  ];

  const weeklyData = [
    { day: 'Lun', orders: 45, shipments: 38 },
    { day: 'Mar', orders: 52, shipments: 45 },
    { day: 'Mer', orders: 48, shipments: 50 },
    { day: 'Jeu', orders: 61, shipments: 55 },
    { day: 'Ven', orders: 55, shipments: 52 },
    { day: 'Sam', orders: 32, shipments: 48 },
    { day: 'Dim', orders: 18, shipments: 22 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ops & Logistics</h1>
          <p className="text-muted-foreground">Vue temps réel des opérations logistiques</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.pendingOrders} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expéditions en cours</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.shipmentsInTransit}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.deliveredShipments} livrées ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de livraison</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              Objectif: 95%
            </p>
          </CardContent>
        </Card>

        <Card className={kpis.criticalIncidents > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents ouverts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${kpis.criticalIncidents > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.openIncidents}</div>
            <p className="text-xs text-destructive">
              {kpis.criticalIncidents} critiques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Area type="monotone" dataKey="orders" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Commandes" />
                <Area type="monotone" dataKey="shipments" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Expéditions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut des commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/pole/ops/orders">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{kpis.processingOrders} en traitement</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/pole/ops/shipments">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expéditions</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-chart-1" />
                <span className="text-lg font-semibold">{kpis.shipmentsInTransit} en transit</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/pole/ops/incidents">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-lg font-semibold">{kpis.openIncidents} à traiter</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/pole/ops/partners">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-chart-2" />
                <span className="text-lg font-semibold">{partners.filter(p => p.status === 'active').length} actifs</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Incidents récents</CardTitle>
          <Link to="/pole/ops/incidents">
            <Button variant="outline" size="sm">Voir tout</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.slice(0, 4).map((incident) => (
              <div key={incident.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    incident.severity === 'critical' ? 'bg-destructive/10' :
                    incident.severity === 'high' ? 'bg-orange-500/10' :
                    incident.severity === 'medium' ? 'bg-yellow-500/10' :
                    'bg-muted'
                  }`}>
                    <AlertTriangle className={`h-4 w-4 ${
                      incident.severity === 'critical' ? 'text-destructive' :
                      incident.severity === 'high' ? 'text-orange-500' :
                      incident.severity === 'medium' ? 'text-yellow-500' :
                      'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{incident.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {incident.type} • Signalé par {incident.reported_by || 'Système'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    incident.status === 'open' ? 'destructive' :
                    incident.status === 'investigating' ? 'default' :
                    'secondary'
                  }>
                    {incident.status === 'open' ? 'Ouvert' :
                     incident.status === 'investigating' ? 'En cours' :
                     incident.status === 'resolved' ? 'Résolu' : 'Fermé'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpsDashboard;
