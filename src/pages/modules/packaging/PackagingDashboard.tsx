import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, PackageCheck, Leaf, AlertTriangle, CheckCircle, Clock, Eye, Plus } from 'lucide-react';

const packagingData = [
  { id: 'PKG-001', name: 'Boîte carton recyclé 30x20', supplier: 'RecycPack SAS', material: 'Carton recyclé', rseScore: 95, status: 'validated', auditStatus: 'passed', opsReady: true, submittedDate: '10/03/2025' },
  { id: 'PKG-002', name: 'Sachet kraft compostable', supplier: 'GreenLeaf SARL', material: 'Kraft bio', rseScore: 88, status: 'rse_review', auditStatus: 'pending', opsReady: false, submittedDate: '15/03/2025' },
  { id: 'PKG-003', name: 'Film étirable biodégradable', supplier: 'BioPack GmbH', material: 'PLA', rseScore: 72, status: 'submitted', auditStatus: 'pending', opsReady: false, submittedDate: '18/03/2025' },
  { id: 'PKG-004', name: 'Coussin air recyclable', supplier: 'AirSafe Ltd', material: 'PE recyclé', rseScore: 60, status: 'rejected', auditStatus: 'failed', opsReady: false, submittedDate: '05/03/2025' },
  { id: 'PKG-005', name: 'Enveloppe matelassée papier', supplier: 'RecycPack SAS', material: 'Papier recyclé', rseScore: 92, status: 'validated', auditStatus: 'passed', opsReady: true, submittedDate: '01/03/2025' },
  { id: 'PKG-006', name: 'Tube carton premium', supplier: 'LuxPack FR', material: 'Carton vierge FSC', rseScore: 78, status: 'rse_review', auditStatus: 'pending', opsReady: false, submittedDate: '12/03/2025' },
];

const kpis = [
  { label: 'Packaging Validés', value: 42, icon: PackageCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Score RSE Moyen', value: '84%', icon: Leaf, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'En attente RSE', value: 8, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Rejetés', value: 3, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  submitted: { label: 'Soumis', variant: 'outline' },
  rse_review: { label: 'Revue RSE', variant: 'secondary' },
  validated: { label: 'Validé', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
};

export default function PackagingDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFiltersState(prev => ({ ...prev, [key]: value }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) { if (sortDirection === 'asc') setSortDirection('desc'); else { setSortColumn(null); setSortDirection(null); } }
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const filtered = packagingData
    .filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.supplier.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && p.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn as keyof typeof a]; const bv = b[sortColumn as keyof typeof b];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packaging Lifecycle</h1>
          <p className="text-muted-foreground">Soumission, validation RSE, audit et transmission Ops des emballages</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Soumettre packaging</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}><CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${k.bgColor} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Catalogue Packaging</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="submitted">Soumis</SelectItem>
                  <SelectItem value="rse_review">Revue RSE</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>ID</SortableTableHead>
                <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Packaging</SortableTableHead>
                <SortableTableHead column="supplier" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Fournisseur</SortableTableHead>
                <TableHead>Matériau</TableHead>
                <SortableTableHead column="rseScore" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Score RSE</SortableTableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Audit</TableHead>
                <TableHead>Ops Ready</TableHead>
                <SortableTableHead column="submittedDate" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Soumis</SortableTableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.supplier}</TableCell>
                  <TableCell className="text-sm">{p.material}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={p.rseScore} className="h-2 w-16" />
                      <span className="text-xs">{p.rseScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusConfig[p.status].variant}>{statusConfig[p.status].label}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={p.auditStatus === 'passed' ? 'default' : p.auditStatus === 'failed' ? 'destructive' : 'outline'}>
                      {p.auditStatus === 'passed' ? 'Réussi' : p.auditStatus === 'failed' ? 'Échoué' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.opsReady ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.submittedDate}</TableCell>
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
