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
import { Search, Package, AlertTriangle, CheckCircle, Eye, TrendingDown } from 'lucide-react';

const suppliers = [
  { id: 'FRN-001', name: 'Fournisseur A', country: 'France', products: 45, rejectionRate: 12, dependencyRate: 42, status: 'critical', certifications: 3, lastAudit: '12/03' },
  { id: 'FRN-002', name: 'Fournisseur B', country: 'Allemagne', products: 32, rejectionRate: 43, dependencyRate: 15, status: 'warning', certifications: 2, lastAudit: '08/03' },
  { id: 'FRN-003', name: 'Fournisseur C', country: 'Espagne', products: 18, rejectionRate: 8, dependencyRate: 5, status: 'healthy', certifications: 4, lastAudit: '15/03' },
  { id: 'FRN-004', name: 'Fournisseur D', country: 'Italie', products: 27, rejectionRate: 22, dependencyRate: 8, status: 'warning', certifications: 2, lastAudit: '10/03' },
  { id: 'FRN-005', name: 'Fournisseur E', country: 'Portugal', products: 15, rejectionRate: 5, dependencyRate: 3, status: 'healthy', certifications: 5, lastAudit: '18/03' },
  { id: 'FRN-006', name: 'Fournisseur F', country: 'Belgique', products: 38, rejectionRate: 35, dependencyRate: 28, status: 'critical', certifications: 1, lastAudit: '05/03' },
];

const kpis = [
  { label: 'Fournisseurs Actifs', value: 48, icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Taux Rejet Moyen', value: '21%', icon: TrendingDown, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Alertes Dépendance', value: 5, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { label: 'Certifiés ISO', value: 32, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  healthy: { label: 'Sain', variant: 'default' },
  warning: { label: 'Attention', variant: 'secondary' },
  critical: { label: 'Critique', variant: 'destructive' },
};

export default function RDSuppliers() {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, handleSort, filters, setFilter } = useTableInteractions();

  const filtered = suppliers
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
        <h1 className="text-2xl font-bold">Analyse Fournisseurs</h1>
        <p className="text-muted-foreground">Risques, dépendances et performance fournisseurs</p>
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
            <CardTitle>Fournisseurs</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="healthy">Sain</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
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
                <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Fournisseur</SortableTableHead>
                <SortableTableHead column="country" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Pays</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="products" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Produits</SortableTableHead>
                <SortableTableHead column="rejectionRate" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Taux Rejet</SortableTableHead>
                <SortableTableHead column="dependencyRate" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Dépendance</SortableTableHead>
                <SortableTableHead column="certifications" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Certif.</SortableTableHead>
                <TableHead>Audit</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.country}</TableCell>
                  <TableCell><Badge variant={statusConfig[s.status].variant}>{statusConfig[s.status].label}</Badge></TableCell>
                  <TableCell>{s.products}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${s.rejectionRate > 30 ? 'text-destructive' : s.rejectionRate > 15 ? 'text-orange-500' : 'text-emerald-500'}`}>{s.rejectionRate}%</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={s.dependencyRate} className="h-2 w-16" />
                      <span className="text-xs">{s.dependencyRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{s.certifications}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{s.lastAudit}</TableCell>
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
