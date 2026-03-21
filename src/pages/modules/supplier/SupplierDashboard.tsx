import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Package, AlertTriangle, ShoppingCart, Star, TrendingUp, Truck, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Fournisseurs actifs', value: 31, icon: Users, color: 'text-primary' },
  { label: 'Commandes en cours', value: 14, icon: ShoppingCart, color: 'text-blue-500' },
  { label: 'Stock réservé', value: '120K', icon: Package, color: 'text-emerald-500' },
  { label: 'Incidents signalés', value: 2, icon: AlertTriangle, color: 'text-destructive' },
];

const topSuppliers = [
  { name: 'BioCosmetics SAS', country: '🇫🇷', rating: 4.8, ca: '245K €', orders: 28, status: 'active' },
  { name: 'NaturaCare', country: '🇩🇪', rating: 4.6, ca: '198K €', orders: 22, status: 'active' },
  { name: 'GreenBeauty', country: '🇮🇹', rating: 4.5, ca: '156K €', orders: 18, status: 'active' },
  { name: 'EcoPack Solutions', country: '🇪🇸', rating: 4.3, ca: '134K €', orders: 15, status: 'warning' },
  { name: 'OrganicLab', country: '🇫🇷', rating: 4.7, ca: '112K €', orders: 12, status: 'active' },
];

const stockByCategory = [
  { name: 'Mode', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'Accessoires', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Maison', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'Hygiène', value: 10, color: 'hsl(var(--chart-4))' },
];

const stockReserved = [
  { name: 'Mode Femme', reserved: 35000, available: 12000 },
  { name: 'Accessoires', reserved: 28000, available: 8000 },
  { name: 'Mode Homme', reserved: 22000, available: 6000 },
  { name: 'Maison & Déco', reserved: 18000, available: 5000 },
  { name: 'Hygiène', reserved: 12000, available: 4000 },
];

const activeOrders = [
  { id: 'CMD-2024-089', supplier: 'BioCosmetics SAS', items: 450, status: 'production', date: '2026-03-15', amount: '12,500 €' },
  { id: 'CMD-2024-088', supplier: 'NaturaCare', items: 320, status: 'shipped', date: '2026-03-12', amount: '8,900 €' },
  { id: 'CMD-2024-087', supplier: 'GreenBeauty', items: 180, status: 'quality_check', date: '2026-03-10', amount: '5,200 €' },
  { id: 'CMD-2024-086', supplier: 'EcoPack Solutions', items: 600, status: 'production', date: '2026-03-08', amount: '15,800 €' },
  { id: 'CMD-2024-085', supplier: 'OrganicLab', items: 250, status: 'delivered', date: '2026-03-05', amount: '7,100 €' },
];

const incidents = [
  { id: 'INC-034', supplier: 'EcoPack Solutions', issue: 'Retard livraison lot #B456', severity: 'high', date: 'Il y a 2j' },
  { id: 'INC-033', supplier: 'NaturaCare', issue: 'Non-conformité packaging', severity: 'medium', date: 'Il y a 5j' },
];

const metrics = [
  { label: 'MOQ Moyenne', value: '350 unités', trend: '+5%' },
  { label: 'Qualité Fournisseurs', value: '94.2%', trend: '+1.3%' },
  { label: 'Montant Moyen / Commande', value: '9,800 €', trend: '+8%' },
];

const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    production: { label: 'En production', variant: 'default' },
    shipped: { label: 'Expédié', variant: 'secondary' },
    quality_check: { label: 'Contrôle qualité', variant: 'outline' },
    delivered: { label: 'Livré', variant: 'secondary' },
  };
  const s = map[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default function SupplierDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pôle Fournisseurs</h1>
          <p className="text-muted-foreground">Gestion des fournisseurs, stocks et commandes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/pole/supplier/pending">Produits en attente</Link></Button>
          <Button asChild><Link to="/pole/supplier/suppliers">Fiches fournisseurs</Link></Button>
        </div>
      </div>

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

      {/* Top Fournisseurs + Stock Catégorie */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Top Fournisseurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSuppliers.map((s) => (
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
                  <div className="flex items-center gap-6 text-sm">
                    <span className="font-medium">{s.ca}</span>
                    <span className="text-muted-foreground">{s.orders} cmd</span>
                    <Badge variant={s.status === 'active' ? 'secondary' : 'destructive'}>
                      {s.status === 'active' ? 'Actif' : 'Alerte'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stockByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stockByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stock Réservé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Stock Réservé & Disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockReserved} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="name" className="text-xs" width={120} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="reserved" name="Réservé" fill="hsl(var(--chart-1))" stackId="a" />
              <Bar dataKey="available" name="Disponible" fill="hsl(var(--chart-2))" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commandes en Cours */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Commandes en Cours</CardTitle>
          <Button variant="outline" size="sm" asChild><Link to="/pole/supplier/pending">Voir tout</Link></Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.supplier}</TableCell>
                  <TableCell>{o.items}</TableCell>
                  <TableCell>{getStatusBadge(o.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{o.date}</TableCell>
                  <TableCell className="text-right font-medium">{o.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incidents + Métriques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Incidents & Litiges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant={inc.severity === 'high' ? 'destructive' : 'secondary'}>
                      {inc.severity === 'high' ? 'Élevé' : 'Moyen'}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{inc.issue}</p>
                      <p className="text-xs text-muted-foreground">{inc.id} • {inc.supplier} • {inc.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Détails</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Métriques Logistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-bold">{m.value}</p>
                  </div>
                  <Badge variant="outline" className="text-emerald-500">
                    <TrendingUp className="h-3 w-3 mr-1" />{m.trend}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
