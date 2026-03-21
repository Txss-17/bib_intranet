import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Zap, Clock, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

const frictions = [
  { id: 'FRC-001', module: 'Commandes & Expéditions', type: 'ux', description: 'Flux de validation commande trop complexe (5 étapes)', impact: 'high', frequency: 45, status: 'open', reportedDate: '10/03' },
  { id: 'FRC-002', module: 'Catalogue Produits', type: 'performance', description: 'Temps de chargement > 3s sur listing +500 produits', impact: 'medium', frequency: 120, status: 'in_progress', reportedDate: '08/03' },
  { id: 'FRC-003', module: 'Paiements', type: 'bug', description: 'Erreur récurrente sur réconciliation paiements fournisseurs', impact: 'critical', frequency: 12, status: 'open', reportedDate: '12/03' },
  { id: 'FRC-004', module: 'Dashboard Direction', type: 'ux', description: 'Manque export PDF des rapports consolidés', impact: 'low', frequency: 8, status: 'planned', reportedDate: '05/03' },
  { id: 'FRC-005', module: 'Gestion Stock', type: 'performance', description: 'Sync inventaire lente entre entrepôts', impact: 'high', frequency: 34, status: 'in_progress', reportedDate: '11/03' },
  { id: 'FRC-006', module: 'Support Client', type: 'bug', description: 'Tickets dupliqués lors de réouverture', impact: 'medium', frequency: 22, status: 'resolved', reportedDate: '01/03' },
  { id: 'FRC-007', module: 'Onboarding Boutique', type: 'ux', description: 'Formulaire inscription trop long (12 champs obligatoires)', impact: 'high', frequency: 67, status: 'open', reportedDate: '14/03' },
];

const kpis = [
  { label: 'Frictions Ouvertes', value: 18, icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Temps Résolution Moy.', value: '4.2j', icon: Clock, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Impact Critique', value: 3, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  { label: 'Résolues (30j)', value: 12, icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
];

const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ux: { label: 'UX', variant: 'outline' },
  performance: { label: 'Performance', variant: 'secondary' },
  bug: { label: 'Bug', variant: 'destructive' },
};

const impactConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'text-destructive' },
  high: { label: 'Élevé', color: 'text-orange-500' },
  medium: { label: 'Moyen', color: 'text-yellow-500' },
  low: { label: 'Faible', color: 'text-muted-foreground' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Ouvert', variant: 'destructive' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  planned: { label: 'Planifié', variant: 'outline' },
  resolved: { label: 'Résolu', variant: 'default' },
};

export default function RDFrictions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFiltersState(prev => ({ ...prev, [key]: value }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection(null); }
    } else { setSortColumn(col); setSortDirection('asc'); }
  };

  const filtered = frictions
    .filter(f => {
      if (searchQuery && !f.module.toLowerCase().includes(searchQuery.toLowerCase()) && !f.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && f.status !== filters.status) return false;
      if (filters.type && filters.type !== 'all' && f.type !== filters.type) return false;
      if (filters.impact && filters.impact !== 'all' && f.impact !== filters.impact) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn as keyof typeof a];
      const bv = b[sortColumn as keyof typeof b];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Frictions Système</h1>
        <p className="text-muted-foreground">Points de friction UX, bugs et problèmes de performance identifiés</p>
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
            <CardTitle>Registre des Frictions</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.type || 'all'} onValueChange={v => setFilter('type', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="ux">UX</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.impact || 'all'} onValueChange={v => setFilter('impact', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Impact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous impacts</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="planned">Planifié</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
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
                <SortableTableHead column="module" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Module</SortableTableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Impact</TableHead>
                <SortableTableHead column="frequency" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Fréquence</SortableTableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs">{f.id}</TableCell>
                  <TableCell className="font-medium">{f.module}</TableCell>
                  <TableCell><Badge variant={typeConfig[f.type].variant}>{typeConfig[f.type].label}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{f.description}</TableCell>
                  <TableCell><span className={`font-medium text-sm ${impactConfig[f.impact].color}`}>{impactConfig[f.impact].label}</span></TableCell>
                  <TableCell>{f.frequency}x</TableCell>
                  <TableCell><Badge variant={statusConfig[f.status].variant}>{statusConfig[f.status].label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{f.reportedDate}</TableCell>
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
