import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useTableInteractions } from "@/hooks/useTableInteractions";
import {
  Package, Truck, AlertTriangle, TrendingUp, Loader2, ArrowRight, Users,
  Warehouse, HeadphonesIcon, CheckCircle2, RotateCcw, Star, Search
} from "lucide-react";
import { useOrders, useShipments, useLogisticsIncidents, useLogisticsPartners, calculateOpsKPIs } from "@/hooks/useOps";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from "react-router-dom";

const pendingOrdersMock = [
  { id: 'CMD-4521', client: 'Marie Dupont', date: '2026-03-19', amount: '89,90 €', status: 'pending' },
  { id: 'CMD-4520', client: 'Jean Leroy', date: '2026-03-19', amount: '145,00 €', status: 'processing' },
  { id: 'CMD-4519', client: 'Claire Martin', date: '2026-03-18', amount: '67,50 €', status: 'pending' },
  { id: 'CMD-4518', client: 'Lucas Bernard', date: '2026-03-18', amount: '210,00 €', status: 'processing' },
  { id: 'CMD-4517', client: 'Sophie Petit', date: '2026-03-17', amount: '55,00 €', status: 'pending' },
];

const satisfactionData = [
  { name: 'Satisfait', value: 78, color: 'hsl(var(--chart-2))' },
  { name: 'Neutre', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Insatisfait', value: 7, color: 'hsl(var(--destructive))' },
];

const performanceMetrics = [
  { label: 'Satisfaction Client', value: '92%', icon: Star, color: 'text-yellow-500' },
  { label: 'Retour Produit', value: '2.1%', icon: RotateCcw, color: 'text-orange-500' },
  { label: 'Produits Expédiés', value: '85K', icon: Warehouse, color: 'text-primary' },
  { label: 'Tickets Résolus', value: '94%', icon: CheckCircle2, color: 'text-emerald-500' },
];

const supportTicketsMock = [
  { id: 'TK-891', pole: 'Livraison', subject: 'Colis endommagé', amount: '89,90 €', due: '2026-03-22', status: 'open' },
  { id: 'TK-890', pole: 'Retour', subject: 'Produit non conforme', amount: '145,00 €', due: '2026-03-21', status: 'in_progress' },
  { id: 'TK-889', pole: 'SAV', subject: 'Remboursement demandé', amount: '67,50 €', due: '2026-03-20', status: 'resolved' },
];

const OpsDashboard = () => {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: shipments = [], isLoading: shipmentsLoading } = useShipments();
  const { data: incidents = [], isLoading: incidentsLoading } = useLogisticsIncidents();
  const { data: partners = [] } = useLogisticsPartners();

  const ordersTable = useTableInteractions({
    data: pendingOrdersMock,
    searchFields: ['id', 'client'],
  });

  const ticketsTable = useTableInteractions({
    data: supportTicketsMock,
    searchFields: ['id', 'subject'],
  });

  const isLoading = ordersLoading || shipmentsLoading || incidentsLoading;
  const kpis = calculateOpsKPIs(orders, shipments, incidents);

  const orderStatusData = [
    { name: 'En attente', value: kpis.pendingOrders || 12, color: 'hsl(var(--muted-foreground))' },
    { name: 'En traitement', value: kpis.processingOrders || 8, color: 'hsl(var(--primary))' },
    { name: 'Expédiées', value: kpis.shippedOrders || 25, color: 'hsl(var(--chart-1))' },
    { name: 'Livrées', value: kpis.deliveredOrders || 45, color: 'hsl(var(--chart-2))' },
  ];

  const weeklyData = [
    { day: 'Lun', orders: 45, shipments: 38 }, { day: 'Mar', orders: 52, shipments: 45 },
    { day: 'Mer', orders: 48, shipments: 50 }, { day: 'Jeu', orders: 61, shipments: 55 },
    { day: 'Ven', orders: 55, shipments: 52 }, { day: 'Sam', orders: 32, shipments: 48 },
    { day: 'Dim', orders: 18, shipments: 22 },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ops & Logistics</h1>
          <p className="text-muted-foreground">Vue temps réel des opérations logistiques</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Commandes en attente', value: kpis.pendingOrders || 12, icon: Package, sub: `${kpis.totalOrders || 90} total` },
          { label: 'En cours de livraison', value: kpis.shipmentsInTransit || 18, icon: Truck, sub: `${kpis.deliveredShipments || 45} livrées ce mois` },
          { label: 'Taux de livraison', value: `${kpis.deliveryRate || 94}%`, icon: TrendingUp, sub: 'Objectif: 95%' },
          { label: 'Stock utilisable', value: '85K', icon: Warehouse, sub: '12K réservé' },
        ].map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
              <p className="text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Activité hebdomadaire</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="orders" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Commandes" />
                <Area type="monotone" dataKey="shipments" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Expéditions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Statut des commandes</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {orderStatusData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map(m => (
          <Card key={m.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <m.icon className={`h-8 w-8 ${m.color}`} />
                <div>
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commandes en Attente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commandes en Attente</CardTitle>
          <Button variant="outline" size="sm" asChild><Link to="/pole/ops/orders">Voir tout</Link></Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par ID ou client..." value={ordersTable.searchQuery} onChange={e => ordersTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={ordersTable.filters.status || 'all'} onValueChange={v => ordersTable.setFilter('status', v)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={ordersTable.sortColumn as string} direction={ordersTable.sortDirection} onSort={c => ordersTable.toggleSort(c as keyof typeof pendingOrdersMock[0])}>ID</SortableTableHead>
                <SortableTableHead column="client" currentSort={ordersTable.sortColumn as string} direction={ordersTable.sortDirection} onSort={c => ordersTable.toggleSort(c as keyof typeof pendingOrdersMock[0])}>Client</SortableTableHead>
                <SortableTableHead column="date" currentSort={ordersTable.sortColumn as string} direction={ordersTable.sortDirection} onSort={c => ordersTable.toggleSort(c as keyof typeof pendingOrdersMock[0])}>Date</SortableTableHead>
                <SortableTableHead column="amount" currentSort={ordersTable.sortColumn as string} direction={ordersTable.sortDirection} onSort={c => ordersTable.toggleSort(c as keyof typeof pendingOrdersMock[0])}>Montant</SortableTableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersTable.processedData.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.client}</TableCell>
                  <TableCell className="text-muted-foreground">{o.date}</TableCell>
                  <TableCell className="font-medium">{o.amount}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === 'processing' ? 'default' : 'secondary'}>
                      {o.status === 'processing' ? 'En traitement' : 'En attente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {ordersTable.processedData.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Support Clients */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HeadphonesIcon className="h-5 w-5" /> Support Clients</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Demandes ouvertes</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={satisfactionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {satisfactionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets Support</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={ticketsTable.searchQuery} onChange={e => ticketsTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
              </div>
              <Select value={ticketsTable.filters.status || 'all'} onValueChange={v => ticketsTable.setFilter('status', v)}>
                <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pôle</TableHead>
                  <TableHead>Sujet</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsTable.processedData.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell>{t.pole}</TableCell>
                    <TableCell>{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'open' ? 'destructive' : t.status === 'in_progress' ? 'default' : 'secondary'}>
                        {t.status === 'open' ? 'Ouvert' : t.status === 'in_progress' ? 'En cours' : 'Résolu'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {ticketsTable.processedData.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Commandes', icon: Package, to: '/pole/ops/orders', value: `${kpis.processingOrders || 8} en traitement` },
          { label: 'Expéditions', icon: Truck, to: '/pole/ops/shipments', value: `${kpis.shipmentsInTransit || 18} en transit` },
          { label: 'Incidents', icon: AlertTriangle, to: '/pole/ops/incidents', value: `${kpis.openIncidents || 3} à traiter`, destructive: true },
          { label: 'Partenaires', icon: Users, to: '/pole/ops/partners', value: `${partners.filter(p => p.status === 'active').length || 5} actifs` },
        ].map(item => (
          <Link key={item.label} to={item.to}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <item.icon className={`h-5 w-5 ${item.destructive ? 'text-destructive' : 'text-primary'}`} />
                  <span className="text-lg font-semibold">{item.value}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OpsDashboard;
