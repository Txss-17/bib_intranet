import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Package, TrendingDown, Eye, AlertTriangle, BarChart3 } from 'lucide-react';
import { Search, Package, TrendingDown, Eye, AlertTriangle, BarChart3 } from 'lucide-react';

const products = [
  { id: 'PRD-001', name: 'Infuseur Thé Zen', category: 'Lifestyle', supplier: 'Fournisseur A', status: 'dormant', lastOrder: '45j', adoptionRate: 12, revenue: 340 },
  { id: 'PRD-002', name: 'Carnet Recyclé A5', category: 'Éco', supplier: 'Fournisseur B', status: 'active', lastOrder: '3j', adoptionRate: 78, revenue: 12400 },
  { id: 'PRD-003', name: 'Chargeur Solaire Mini', category: 'Technologie', supplier: 'Fournisseur C', status: 'declining', lastOrder: '18j', adoptionRate: 35, revenue: 2100 },
  { id: 'PRD-004', name: 'Bougie Soja Bio', category: 'Maison', supplier: 'Fournisseur A', status: 'active', lastOrder: '1j', adoptionRate: 92, revenue: 18700 },
  { id: 'PRD-005', name: 'Gourde Inox 500ml', category: 'Éco', supplier: 'Fournisseur D', status: 'dormant', lastOrder: '62j', adoptionRate: 5, revenue: 120 },
  { id: 'PRD-006', name: 'Lampe LED Bambou', category: 'Maison', supplier: 'Fournisseur B', status: 'declining', lastOrder: '22j', adoptionRate: 28, revenue: 1800 },
  { id: 'PRD-007', name: 'Étui Phone Liège', category: 'Lifestyle', supplier: 'Fournisseur E', status: 'active', lastOrder: '5j', adoptionRate: 65, revenue: 8900 },
  { id: 'PRD-008', name: 'Kit Zéro Déchet', category: 'Éco', supplier: 'Fournisseur A', status: 'active', lastOrder: '2j', adoptionRate: 88, revenue: 15600 },
];

const kpis = [
  { label: 'Produits Dormants', value: 32, icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Taux Déclin', value: '22%', icon: TrendingDown, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { label: 'Adoption Moyenne', value: '54%', icon: BarChart3, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Alertes Produit', value: 8, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  dormant: { label: 'Dormant', variant: 'destructive' },
  declining: { label: 'En déclin', variant: 'secondary' },
};

export default function RDProducts() {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, handleSort, filters, setFilter } = useTableInteractions();

  const filtered = products
    .filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.category && filters.category !== 'all' && p.category !== filters.category) return false;
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
        <h1 className="text-2xl font-bold">Analyse Produits</h1>
        <p className="text-muted-foreground">Performance, adoption et cycle de vie des produits catalogue</p>
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
            <CardTitle>Catalogue Produits</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                  <SelectItem value="declining">En déclin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="Éco">Éco</SelectItem>
                  <SelectItem value="Technologie">Technologie</SelectItem>
                  <SelectItem value="Maison">Maison</SelectItem>
                  <SelectItem value="Lifestyle">Lifestyle</SelectItem>
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
                <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Produit</SortableTableHead>
                <SortableTableHead column="category" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Catégorie</SortableTableHead>
                <SortableTableHead column="supplier" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Fournisseur</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="adoptionRate" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>Adoption</SortableTableHead>
                <SortableTableHead column="revenue" currentSort={sortColumn} direction={sortDirection} onSort={handleSort}>CA (€)</SortableTableHead>
                <TableHead>Dernière Cmd</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell><Badge variant={statusConfig[p.status].variant}>{statusConfig[p.status].label}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={p.adoptionRate} className="h-2 w-16" />
                      <span className="text-xs">{p.adoptionRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{p.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.lastOrder}</TableCell>
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
