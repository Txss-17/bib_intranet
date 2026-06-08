import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Zap, Clock, AlertTriangle, TrendingUp, Lightbulb, Loader2, Database } from 'lucide-react';
import { useRDFrictionsData } from '@/hooks/useRDData';
import CreateRecommendationDialog from '@/components/rd/CreateRecommendationDialog';
import { ExportButtons } from '@/components/ExportButtons';

const sevConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critique', color: 'text-destructive' },
  high: { label: 'Élevée', color: 'text-orange-500' },
  medium: { label: 'Moyenne', color: 'text-yellow-500' },
  low: { label: 'Faible', color: 'text-muted-foreground' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Ouvert', variant: 'destructive' },
  in_progress: { label: 'En cours', variant: 'secondary' },
  resolved: { label: 'Résolu', variant: 'default' },
  closed: { label: 'Clos', variant: 'outline' },
};

export default function RDFrictions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (k: string, v: string) => setFiltersState(p => ({ ...p, [k]: v }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortColumn(null); setSortDirection(null); }
    } else { setSortColumn(col); setSortDirection('asc'); }
  };

  const { data, isLoading } = useRDFrictionsData();
  const rows = data?.rows || [];
  const isMock = data?.isMock;

  const open = rows.filter(r => r.status === 'open').length;
  const critical = rows.filter(r => r.severity === 'critical').length;
  const resolved = rows.filter(r => r.status === 'resolved' || r.status === 'closed').length;

  const kpis = [
    { label: 'Frictions Ouvertes', value: open, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'En cours', value: rows.filter(r => r.status === 'in_progress').length, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Impact Critique', value: critical, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Résolues', value: resolved, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const filtered = rows
    .filter(f => {
      if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(f.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && f.status !== filters.status) return false;
      if (filters.severity && filters.severity !== 'all' && f.severity !== filters.severity) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      const av = a[sortColumn], bv = b[sortColumn];
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Frictions Système</h1>
          <p className="text-muted-foreground">Bugs, UX et performance — synchronisé avec le registre Tech</p>
        </div>
        <div className="flex gap-2">
          {isMock && <Badge variant="outline" className="gap-1"><Database className="h-3 w-3" />Démo</Badge>}
          <ExportButtons data={filtered as any} filename="rd-frictions" title="Frictions Système" columns={[
            { accessor: 'title', header: 'Titre' }, { accessor: 'environment', header: 'Module' },
            { accessor: 'severity', header: 'Sévérité' }, { accessor: 'status', header: 'Statut' },
          ]} />
          <CreateRecommendationDialog defaultCategory="ux" defaultPole="tech" />
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
            <CardTitle>Registre des Frictions ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.severity || 'all'} onValueChange={v => setFilter('severity', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Sévérité" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Clos</SelectItem>
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
                  <SortableTableHead column="title" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Titre</SortableTableHead>
                  <SortableTableHead column="environment" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Module</SortableTableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <SortableTableHead column="created_at" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Date</SortableTableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium">{f.title}</div>
                      {f.description && <div className="text-xs text-muted-foreground max-w-md truncate">{f.description}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{f.environment || '—'}</TableCell>
                    <TableCell><span className={`font-medium text-sm ${sevConfig[f.severity]?.color || 'text-muted-foreground'}`}>{sevConfig[f.severity]?.label || f.severity}</span></TableCell>
                    <TableCell><Badge variant={statusConfig[f.status]?.variant || 'outline'}>{statusConfig[f.status]?.label || f.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <CreateRecommendationDialog
                        trigger={<Button variant="ghost" size="sm"><Lightbulb className="h-4 w-4" /></Button>}
                        defaultDetail={`Friction "${f.title}" (${f.severity}): `}
                        defaultCategory={f.severity === 'critical' || f.severity === 'high' ? 'bug' : 'ux'}
                        defaultPole="tech"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune friction</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
