import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, UserPlus, Clock, CheckCircle, AlertTriangle, Eye, Plus } from 'lucide-react';

const onboardingData = [
  { id: 'ONB-001', name: 'EcoStore Nantes', type: 'boutique', step: 'documents', progress: 40, startDate: '10/03/2025', assignee: 'Marie L.', status: 'in_progress', daysElapsed: 11 },
  { id: 'ONB-002', name: 'GreenLeaf SARL', type: 'supplier', step: 'validation_rse', progress: 75, startDate: '05/03/2025', assignee: 'Pierre K.', status: 'in_progress', daysElapsed: 16 },
  { id: 'ONB-003', name: 'BioConnect GmbH', type: 'supplier', step: 'contract', progress: 90, startDate: '01/03/2025', assignee: 'Julie D.', status: 'pending_review', daysElapsed: 20 },
  { id: 'ONB-004', name: 'NaturBoutique Lyon', type: 'boutique', step: 'integration', progress: 60, startDate: '12/03/2025', assignee: 'Marc R.', status: 'in_progress', daysElapsed: 9 },
  { id: 'ONB-005', name: 'EthicSupply Ltd', type: 'supplier', step: 'completed', progress: 100, startDate: '20/02/2025', assignee: 'Sarah M.', status: 'completed', daysElapsed: 29 },
  { id: 'ONB-006', name: 'PlanetShop Bordeaux', type: 'boutique', step: 'kyc', progress: 20, startDate: '15/03/2025', assignee: 'Marie L.', status: 'blocked', daysElapsed: 6 },
  { id: 'ONB-007', name: 'RecycPack SAS', type: 'supplier', step: 'audit', progress: 55, startDate: '08/03/2025', assignee: 'Pierre K.', status: 'in_progress', daysElapsed: 13 },
];

const kpis = [
  { label: 'En cours', value: 14, icon: UserPlus, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Temps moyen', value: '12j', icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Complétés (30j)', value: 8, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Bloqués', value: 3, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

const stepLabels: Record<string, string> = {
  kyc: 'KYC / Vérification', documents: 'Documents', validation_rse: 'Validation RSE',
  audit: 'Audit initial', contract: 'Contrat', integration: 'Intégration', completed: 'Terminé',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  in_progress: { label: 'En cours', variant: 'secondary' },
  pending_review: { label: 'En revue', variant: 'outline' },
  completed: { label: 'Terminé', variant: 'default' },
  blocked: { label: 'Bloqué', variant: 'destructive' },
};

export default function LifecycleOnboarding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFiltersState(prev => ({ ...prev, [key]: value }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) { if (sortDirection === 'asc') setSortDirection('desc'); else { setSortColumn(null); setSortDirection(null); } }
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const filtered = onboardingData
    .filter(o => {
      if (searchQuery && !o.name.toLowerCase().includes(searchQuery.toLowerCase()) && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.type && filters.type !== 'all' && o.type !== filters.type) return false;
      if (filters.status && filters.status !== 'all' && o.status !== filters.status) return false;
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
          <h1 className="text-2xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">Suivi de l'intégration des boutiques et fournisseurs</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvel onboarding</Button>
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
            <CardTitle>Parcours d'Onboarding</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.type || 'all'} onValueChange={v => setFilter('type', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="boutique">Boutique</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="pending_review">En revue</SelectItem>
                  <SelectItem value="blocked">Bloqué</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
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
                <SortableTableHead column="name" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Entité</SortableTableHead>
                <TableHead>Type</TableHead>
                <TableHead>Étape</TableHead>
                <SortableTableHead column="progress" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Progression</SortableTableHead>
                <TableHead>Statut</TableHead>
                <SortableTableHead column="daysElapsed" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Durée</SortableTableHead>
                <SortableTableHead column="assignee" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Assigné</SortableTableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell><Badge variant="outline">{o.type === 'boutique' ? 'Boutique' : 'Fournisseur'}</Badge></TableCell>
                  <TableCell className="text-sm">{stepLabels[o.step]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={o.progress} className="h-2 w-20" />
                      <span className="text-xs">{o.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={statusConfig[o.status].variant}>{statusConfig[o.status].label}</Badge></TableCell>
                  <TableCell className="text-sm">{o.daysElapsed}j</TableCell>
                  <TableCell className="text-sm">{o.assignee}</TableCell>
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
