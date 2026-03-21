import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { FolderOpen, TrendingUp, Users, Clock } from 'lucide-react';

const mockCases = [
  { id: 'ETH-2025-001', type: 'Harcèlement', priority: 'critique', investigator: 'Marie Dupont', status: 'Investigation', opened: '2025-06-10', lastUpdate: '2025-06-18' },
  { id: 'ETH-2025-003', type: 'Fraude', priority: 'critique', investigator: 'Jean-Marc Leroy', status: 'Escaladé', opened: '2025-06-08', lastUpdate: '2025-06-17' },
  { id: 'ETH-2025-005', type: 'Corruption', priority: 'haute', investigator: 'Sophie Martin', status: 'Due diligence', opened: '2025-06-05', lastUpdate: '2025-06-16' },
  { id: 'ETH-2025-006', type: 'Violation données', priority: 'haute', investigator: 'Marie Dupont', status: 'Investigation', opened: '2025-06-04', lastUpdate: '2025-06-15' },
  { id: 'ETH-2025-009', type: 'Conflit d\'intérêts', priority: 'moyenne', investigator: 'Karim Benzema', status: 'Investigation', opened: '2025-06-01', lastUpdate: '2025-06-14' },
  { id: 'ETH-2024-045', type: 'Discrimination', priority: 'haute', investigator: 'Sophie Martin', status: 'Due diligence', opened: '2025-05-28', lastUpdate: '2025-06-13' },
  { id: 'ETH-2024-042', type: 'Non-conformité', priority: 'moyenne', investigator: 'Jean-Marc Leroy', status: 'Escaladé', opened: '2025-05-20', lastUpdate: '2025-06-12' },
  { id: 'ETH-2024-039', type: 'Fraude', priority: 'haute', investigator: 'Karim Benzema', status: 'Investigation', opened: '2025-05-15', lastUpdate: '2025-06-10' },
];

const priorityColors: Record<string, string> = {
  critique: 'bg-destructive text-destructive-foreground',
  haute: 'bg-orange-500/15 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
};

const statusColors: Record<string, string> = {
  Investigation: 'bg-primary/15 text-primary',
  Escaladé: 'bg-destructive/15 text-destructive',
  'Due diligence': 'bg-yellow-500/15 text-yellow-700',
};

const EthicsOngoing = () => {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: mockCases,
    searchFields: ['id', 'type', 'investigator'],
  });

  const escalatedCount = mockCases.filter(c => c.status === 'Escaladé').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dossiers en cours</h1>
        <p className="text-muted-foreground">Suivi des investigations actives</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FolderOpen className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{mockCases.length}</p><p className="text-xs text-muted-foreground">Dossiers ouverts</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">12.4j</p><p className="text-xs text-muted-foreground">Durée moyenne</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{escalatedCount}</p><p className="text-xs text-muted-foreground">Escaladés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">4</p><p className="text-xs text-muted-foreground">Enquêteurs actifs</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investigations actives</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Investigation">Investigation</SelectItem>
                <SelectItem value="Escaladé">Escaladé</SelectItem>
                <SelectItem value="Due diligence">Due diligence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.priority || 'all'} onValueChange={v => setFilter('priority', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priorité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>ID</SortableTableHead>
                <SortableTableHead column="type" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Type</SortableTableHead>
                <SortableTableHead column="priority" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Priorité</SortableTableHead>
                <SortableTableHead column="investigator" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Enquêteur</SortableTableHead>
                <SortableTableHead column="status" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Statut</SortableTableHead>
                <SortableTableHead column="opened" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Ouvert le</SortableTableHead>
                <SortableTableHead column="lastUpdate" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockCases[0])}>Dernière MAJ</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell><Badge className={priorityColors[c.priority]}>{c.priority}</Badge></TableCell>
                  <TableCell>{c.investigator}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell>{c.opened}</TableCell>
                  <TableCell>{c.lastUpdate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EthicsOngoing;
