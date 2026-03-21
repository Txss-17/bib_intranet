import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { Search, Store, TrendingDown, TrendingUp, AlertTriangle, Eye } from 'lucide-react';

const shops = [
  { id: 'SHP-001', name: 'EcoStore Paris', region: 'France', status: 'active', revenue: 45200, orders: 312, churnRisk: 5, lastActivity: '1j' },
  { id: 'SHP-002', name: 'GreenBox Lyon', region: 'France', status: 'at_risk', revenue: 8700, orders: 42, churnRisk: 72, lastActivity: '15j' },
  { id: 'SHP-003', name: 'BioMarket Berlin', region: 'Allemagne', status: 'active', revenue: 38900, orders: 287, churnRisk: 8, lastActivity: '2j' },
  { id: 'SHP-004', name: 'NaturShop Madrid', region: 'Espagne', status: 'inactive', revenue: 1200, orders: 5, churnRisk: 95, lastActivity: '45j' },
  { id: 'SHP-005', name: 'EthicBuy London', region: 'UK', status: 'active', revenue: 52100, orders: 401, churnRisk: 3, lastActivity: '1j' },
  { id: 'SHP-006', name: 'VerdeMondo Milano', region: 'Italie', status: 'at_risk', revenue: 12300, orders: 78, churnRisk: 58, lastActivity: '12j' },
  { id: 'SHP-007', name: 'PlanetShop Bruxelles', region: 'Belgique', status: 'active', revenue: 29800, orders: 198, churnRisk: 12, lastActivity: '3j' },
];

const kpis = [
  { label: 'Boutiques Actives', value: 184, icon: Store, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Risque Churn', value: 23, icon: TrendingDown, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { label: 'Nouvelles (30j)', value: 12, icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Inactives (>30j)', value: 8, icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  at_risk: { label: 'À risque', variant: 'secondary' },
  inactive: { label: 'Inactive', variant: 'destructive' },
};

export default function RDShops() {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, handleSort, filters, setFilter } = useTableInteractions();

  const filtered = shops
    .filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn as keyof typeof a];
      const bv = b[sortColumn as keyof typeof b];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analyse Boutiques</h1>
        <p className="text-muted-foreground">Suivi performance, risque churn et activité des boutiques partenaires</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}>
                  <k.icon className={`h-5 w-5 ${k.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Boutiques Partenaires</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at_risk">À risque</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>ID</SortableTableHead>
                <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Boutique</SortableTableHead>
                <SortableTableHead column="region" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Région</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="revenue" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>CA (€)</SortableTableHead>
                <SortableTableHead column="orders" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Commandes</SortableTableHead>
                <SortableTableHead column="churnRisk" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Risque Churn</SortableTableHead>
                <TableHead>Activité</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.region}</TableCell>
                  <TableCell><Badge variant={statusConfig[s.status].variant}>{statusConfig[s.status].label}</Badge></TableCell>
                  <TableCell className="font-medium">{s.revenue.toLocaleString()}</TableCell>
                  <TableCell>{s.orders}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.churnRisk} className="h-2 w-16" />
                      <span className={`text-xs font-medium ${s.churnRisk > 50 ? 'text-destructive' : s.churnRisk > 25 ? 'text-orange-500' : 'text-emerald-500'}`}>{s.churnRisk}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.lastActivity}</TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
