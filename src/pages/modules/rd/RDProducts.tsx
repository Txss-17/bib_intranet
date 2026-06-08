import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Package, TrendingDown, AlertTriangle, BarChart3, Loader2, Lightbulb, Database } from 'lucide-react';
import { useRDProductsData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  dormant: { label: 'Dormant', variant: 'destructive' },
  declining: { label: 'En déclin', variant: 'secondary' },
};

export default function RDProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>('orders_30d');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (k: string, v: string) => setFiltersState(p => ({ ...p, [k]: v }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection(null); }
    } else { setSortColumn(col); setSortDirection('asc'); }
  };

  const { data, isLoading } = useRDProductsData();
  const rows = data?.rows || [];
  const isMock = data?.isMock;

  const dormantCount = rows.filter(r => r.status === 'dormant').length;
  const decliningCount = rows.filter(r => r.status === 'declining').length;
  const avgAdoption = rows.length ? Math.round(rows.reduce((s, r) => s + r.adoption, 0) / rows.length) : 0;
  const totalRevenue = rows.reduce((s, r) => s + (r.revenue_30d || 0), 0);

  const kpis = [
    { label: 'Produits Dormants', value: dormantCount, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'En Déclin', value: decliningCount, icon: TrendingDown, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Adoption Moy.', value: `${avgAdoption}%`, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'CA 30j (€)', value: totalRevenue.toLocaleString(), icon: AlertTriangle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const categories = Array.from(new Set(rows.map((r: any) => r.category as string))).filter((c) => c && c !== '—');

  const filtered = rows
    .filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.category && filters.category !== 'all' && p.category !== filters.category) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn], bv = b[sortColumn];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analyse Produits</h1>
          <p className="text-muted-foreground">Performance, adoption et cycle de vie — basé sur commandes 30j</p>
        </div>
        <div className="flex gap-2">
          {isMock && <Badge variant="outline" className="gap-1"><Database className="h-3 w-3" />Démo</Badge>}
          <ExportButtons data={filtered as any} filename="rd-products" title="Analyse Produits R&D" columns={[
            { accessor: 'name', header: 'Produit' }, { accessor: 'category', header: 'Catégorie' },
            { accessor: 'supplier_name', header: 'Fournisseur' }, { accessor: 'status', header: 'Statut' },
            { accessor: 'orders_30d', header: 'Cmd 30j' }, { accessor: 'revenue_30d', header: 'CA 30j' }, { accessor: 'adoption', header: 'Adoption' },
          ]} />
          <CreateRecommendationDialog defaultCategory="product" defaultPole="ops" />
        </div>
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
                <div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}>
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
            <CardTitle>Catalogue ({filtered.length})</CardTitle>
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
                  <SelectItem value="declining">En déclin</SelectItem>
                  <SelectItem value="dormant">Dormant</SelectItem>
                </SelectContent>
              </Select>
              {categories.length > 0 && (
                <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Produit</SortableTableHead>
                  <SortableTableHead column="category" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Catégorie</SortableTableHead>
                  <SortableTableHead column="supplier_name" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Fournisseur</SortableTableHead>
                  <TableHead>Statut</TableHead>
                  <SortableTableHead column="adoption" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Adoption</SortableTableHead>
                  <SortableTableHead column="orders_30d" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Cmd 30j</SortableTableHead>
                  <SortableTableHead column="revenue_30d" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>CA 30j (€)</SortableTableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.supplier_name}</TableCell>
                    <TableCell><Badge variant={statusConfig[p.status]?.variant || 'outline'}>{statusConfig[p.status]?.label || p.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.adoption} className="h-2 w-16" />
                        <span className="text-xs">{p.adoption}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.orders_30d}</TableCell>
                    <TableCell className="font-medium">{Math.round(p.revenue_30d).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <CreateRecommendationDialog
                        trigger={<Button variant="ghost" size="sm"><Lightbulb className="h-4 w-4" /></Button>}
                        defaultDetail={`Produit "${p.name}" (${p.status}, ${p.orders_30d} cmd 30j): `}
                        defaultCategory="product"
                        defaultPole="ops"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun produit</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
