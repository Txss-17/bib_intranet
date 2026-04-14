import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { Users, Package, AlertTriangle, ShoppingCart, Star, TrendingUp, Truck, BarChart3, Search, FolderOpen, Building2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { SupplierOrgChart } from '@/components/supplier/SupplierOrgChart';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useSupplierStats() {
  return useQuery({
    queryKey: ['supplier_dashboard_stats'],
    queryFn: async () => {
      const [suppliersRes, productsRes, alertsRes, ordersRes] = await Promise.all([
        supabase.from('suppliers').select('id, name, country, quality_score, status', { count: 'exact' }),
        supabase.from('products').select('id, category, status', { count: 'exact' }),
        supabase.from('quality_alerts').select('id, severity, status', { count: 'exact' }).in('status', ['open', 'investigating']),
        supabase.from('orders').select('id, order_number, status, total_amount, ordered_at, user_account_id', { count: 'exact' }).neq('status', 'delivered'),
      ]);

      const suppliers = suppliersRes.data || [];
      const products = productsRes.data || [];
      const alerts = alertsRes.data || [];
      const orders = ordersRes.data || [];

      const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
      const pendingOrders = orders.length;
      const openIncidents = alerts.length;

      // Category distribution from products
      const catCounts: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.category || 'Autre';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
      const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
      const categoryData = Object.entries(catCounts).map(([name, value], i) => ({
        name,
        value,
        color: chartColors[i % chartColors.length],
      }));

      // Top suppliers by quality_score
      const topSuppliers = [...suppliers]
        .filter(s => s.status === 'active')
        .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
        .slice(0, 5)
        .map(s => ({
          name: s.name,
          country: s.country || '🌍',
          rating: ((s.quality_score || 70) / 20).toFixed(1),
          status: (s.quality_score || 0) >= 70 ? 'active' : 'warning',
        }));

      // Avg quality
      const avgQuality = suppliers.length > 0
        ? (suppliers.reduce((sum, s) => sum + (s.quality_score || 0), 0) / suppliers.length).toFixed(1)
        : '0';

      return {
        stats: [
          { label: 'Fournisseurs actifs', value: activeSuppliers, icon: Users, color: 'text-primary' },
          { label: 'Commandes en cours', value: pendingOrders, icon: ShoppingCart, color: 'text-blue-500' },
          { label: 'Produits catalogue', value: products.length, icon: Package, color: 'text-emerald-500' },
          { label: 'Incidents ouverts', value: openIncidents, icon: AlertTriangle, color: 'text-destructive' },
        ],
        topSuppliers,
        categoryData,
        avgQuality,
      };
    },
  });
}

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    production: { label: 'En production', variant: 'default' },
    shipped: { label: 'Expédié', variant: 'secondary' },
    quality_check: { label: 'Contrôle qualité', variant: 'outline' },
    delivered: { label: 'Livré', variant: 'secondary' },
    pending: { label: 'En attente', variant: 'outline' },
  };
  const s = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function SupplierDashboard() {
  const { data, isLoading } = useSupplierStats();
  const [dashTab, setDashTab] = useState('overview');

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const stats = data?.stats || [];
  const topSuppliers = data?.topSuppliers || [];
  const categoryData = data?.categoryData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pôle Fournisseurs</h1>
          <p className="text-muted-foreground">Gestion des fournisseurs, stocks et commandes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/pole/supplier/portfolios"><FolderOpen className="h-4 w-4 mr-2" />Portefeuilles</Link></Button>
          <Button variant="outline" asChild><Link to="/pole/supplier/pending">Produits en attente</Link></Button>
          <Button asChild><Link to="/pole/supplier/suppliers">Fiches fournisseurs</Link></Button>
        </div>
      </div>

      <Tabs value={dashTab} onValueChange={setDashTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="org"><Building2 className="h-4 w-4 mr-1" />Organisation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Fournisseurs + Catégories */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Top Fournisseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSuppliers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucun fournisseur</p>
                  ) : topSuppliers.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{s.country}</span>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">{s.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={s.status === 'active' ? 'secondary' : 'destructive'}>
                        {s.status === 'active' ? 'Actif' : 'Alerte'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Produits par Catégorie</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Métriques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Métriques Clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Qualité Moyenne</p>
                  <p className="text-xl font-bold">{data?.avgQuality}%</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Fournisseurs Actifs</p>
                  <p className="text-xl font-bold">{stats[0]?.value || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Incidents Ouverts</p>
                  <p className="text-xl font-bold">{stats[3]?.value || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="mt-4">
          <SupplierOrgChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
