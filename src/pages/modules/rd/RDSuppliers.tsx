import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Package, AlertTriangle, CheckCircle, Lightbulb, TrendingDown, Loader2, Database } from 'lucide-react';
import { useRDSuppliersData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  at_risk: { label: 'À risque', variant: 'secondary' },
  suspended: { label: 'Suspendu', variant: 'destructive' },
  pending: { label: 'En attente', variant: 'outline' },
};

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function RDSuppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>('risk_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (k: string, v: string) => setFiltersState(p => ({ ...p, [k]: v }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection(null); }
    } else { setSortColumn(col); setSortDirection('asc'); }
  };

  const { data, isLoading } = useRDSuppliersData();
  const rows = data?.rows || [];
  const isMock = data?.isMock;

  const atRiskCount = rows.filter(r => r.risk_score > 50).length;
  const healthyCount = rows.filter(r => r.quality_score >= 80).length;
  const avgQuality = rows.length ? Math.round(rows.reduce((s, r) => s + r.quality_score, 0) / rows.length) : 0;

  const kpis = [
    { label: 'Fournisseurs', value: rows.length, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Qualité Moy.', value: `${avgQuality}%`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'À Risque', value: atRiskCount, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Performants', value: healthyCount, icon: TrendingDown, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const filtered = rows
    .filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && s.status !== filters.status) return false;
      if (filters.risk === 'high' && s.risk_score < 50) return false;
      if (filters.risk === 'low' && s.risk_score >= 50) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn], bv = b[sortColumn];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analyse Fournisseurs</h1>
          <p className="text-muted-foreground">Risques, dépendances et qualité fournisseurs — temps réel</p>
        </div>
        <div className="flex gap-2">
          {isMock && <Badge variant="outline" className="gap-1"><Database className="h-3 w-3" />Démo</Badge>}
          <ExportButtons data={filtered as any} filename="rd-suppliers" title="Analyse Fournisseurs R&D" columns={[
            { accessor: 'name', header: 'Fournisseur' }, { accessor: 'country', header: 'Pays' },
            { accessor: 'products_count', header: 'Produits' }, { accessor: 'quality_score', header: 'Qualité' },
            { accessor: 'risk_score', header: 'Risque' }, { accessor: 'status', header: 'Statut' },
          ]} />
          <CreateRecommendationDialog defaultCategory="supplier" defaultPole="supplier" />
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
            <CardTitle>Fournisseurs ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="at_risk">À risque</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.risk || 'all'} onValueChange={v => setFilter('risk', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Risque" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous risques</SelectItem>
                  <SelectItem value="high">Élevé (&gt;50)</SelectItem>
                  <SelectItem value="low">Faible (&lt;50)</SelectItem>
                </SelectContent>
              </Select>
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
                  <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Fournisseur</SortableTableHead>
                  <SortableTableHead column="country" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Pays</SortableTableHead>
                  <TableHead>Statut</TableHead>
                  <SortableTableHead column="products_count" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Produits</SortableTableHead>
                  <SortableTableHead column="quality_score" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Qualité</SortableTableHead>
                  <SortableTableHead column="risk_score" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Risque</SortableTableHead>
                  <TableHead>Dernier audit</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.country}</TableCell>
                    <TableCell><Badge variant={statusConfig[s.status]?.variant || 'outline'}>{statusConfig[s.status]?.label || s.status}</Badge></TableCell>
                    <TableCell>{s.products_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.quality_score} className="h-2 w-16" />
                        <span className={`text-xs font-medium ${s.quality_score >= 80 ? 'text-emerald-500' : s.quality_score >= 50 ? 'text-orange-500' : 'text-destructive'}`}>{s.quality_score}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium text-sm ${s.risk_score > 60 ? 'text-destructive' : s.risk_score > 30 ? 'text-orange-500' : 'text-emerald-500'}`}>{s.risk_score}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{fmtDate(s.last_audit_date)}</TableCell>
                    <TableCell className="text-right">
                      <CreateRecommendationDialog
                        trigger={<Button variant="ghost" size="sm"><Lightbulb className="h-4 w-4" /></Button>}
                        defaultDetail={`Fournisseur "${s.name}" (risque ${s.risk_score}, qualité ${s.quality_score}%): `}
                        defaultCategory="supplier"
                        defaultPole="supplier"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun fournisseur</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
