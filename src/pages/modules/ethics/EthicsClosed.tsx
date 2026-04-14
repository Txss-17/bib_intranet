import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { CheckCircle2, XCircle, Scale, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, format } from 'date-fns';

interface ClosedCase {
  id: string;
  type: string;
  priority: string;
  resolution: string;
  investigator: string;
  duration: string;
  closed: string;
}

function useClosedCases() {
  return useQuery({
    queryKey: ['ethics_closed'],
    queryFn: async (): Promise<ClosedCase[]> => {
      const { data, error } = await supabase
        .from('whistleblower_submissions')
        .select('*')
        .eq('status', 'closed')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(s => {
        const created = new Date(s.created_at || '');
        const closed = new Date(s.updated_at || '');
        const days = differenceInDays(closed, created);
        return {
          id: s.submission_code,
          type: s.category,
          priority: s.severity || 'moyenne',
          resolution: s.resolution_notes || 'Classé sans suite',
          investigator: s.assigned_auditor_id ? 'Auditeur assigné' : 'Non assigné',
          duration: `${days}j`,
          closed: format(closed, 'yyyy-MM-dd'),
        };
      });
    },
  });
}

const resolutionColors: Record<string, string> = {
  Confirmé: 'bg-destructive/15 text-destructive',
  'Classé sans suite': 'bg-muted text-muted-foreground',
  Médiation: 'bg-primary/15 text-primary',
};

const priorityColors: Record<string, string> = {
  critique: 'bg-destructive text-destructive-foreground',
  critical: 'bg-destructive text-destructive-foreground',
  haute: 'bg-orange-500/15 text-orange-700 border-orange-200',
  high: 'bg-orange-500/15 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  medium: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  basse: 'bg-muted text-muted-foreground',
  low: 'bg-muted text-muted-foreground',
};

const EthicsClosed = () => {
  const { data: closedCases = [], isLoading } = useClosedCases();

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: closedCases,
    searchFields: ['id', 'type', 'investigator', 'resolution'],
  });

  const confirmedCount = closedCases.filter(c => c.resolution === 'Confirmé').length;
  const confirmedRate = closedCases.length > 0 ? Math.round((confirmedCount / closedCases.length) * 100) : 0;
  const mediationCount = closedCases.filter(c => c.resolution === 'Médiation').length;
  const avgDuration = closedCases.length > 0
    ? (closedCases.reduce((s, c) => s + parseInt(c.duration) || 0, 0) / closedCases.length).toFixed(1)
    : '0';

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dossiers clôturés</h1>
        <p className="text-muted-foreground">Historique des dossiers résolus et leurs issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{closedCases.length}</p><p className="text-xs text-muted-foreground">Total clôturés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{confirmedRate}%</p><p className="text-xs text-muted-foreground">Taux confirmé</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Scale className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{mediationCount}</p><p className="text-xs text-muted-foreground">Médiations</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{avgDuration}j</p><p className="text-xs text-muted-foreground">Durée moyenne</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dossiers résolus</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.resolution || 'all'} onValueChange={v => setFilter('resolution', v)}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Résolution" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Confirmé">Confirmé</SelectItem>
                <SelectItem value="Classé sans suite">Classé sans suite</SelectItem>
                <SelectItem value="Médiation">Médiation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority || 'all'} onValueChange={v => setFilter('priority', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priorité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {processedData.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun dossier clôturé trouvé</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>ID</SortableTableHead>
                  <SortableTableHead column="type" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Type</SortableTableHead>
                  <SortableTableHead column="priority" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Priorité</SortableTableHead>
                  <SortableTableHead column="resolution" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Résolution</SortableTableHead>
                  <SortableTableHead column="investigator" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Enquêteur</SortableTableHead>
                  <SortableTableHead column="duration" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Durée</SortableTableHead>
                  <SortableTableHead column="closed" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof ClosedCase)}>Clôturé le</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell>{c.type}</TableCell>
                    <TableCell><Badge className={priorityColors[c.priority] || 'bg-muted text-muted-foreground'}>{c.priority}</Badge></TableCell>
                    <TableCell><Badge className={resolutionColors[c.resolution] || 'bg-muted text-muted-foreground'}>{c.resolution}</Badge></TableCell>
                    <TableCell>{c.investigator}</TableCell>
                    <TableCell>{c.duration}</TableCell>
                    <TableCell>{c.closed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EthicsClosed;
