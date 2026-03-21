import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { CheckCircle2, XCircle, Scale, Clock } from 'lucide-react';

const mockClosed = [
  { id: 'ETH-2024-038', type: 'Harcèlement', priority: 'critique', resolution: 'Confirmé', investigator: 'Marie Dupont', duration: '18j', closed: '2025-05-30' },
  { id: 'ETH-2024-035', type: 'Fraude', priority: 'haute', resolution: 'Confirmé', investigator: 'Jean-Marc Leroy', duration: '22j', closed: '2025-05-25' },
  { id: 'ETH-2024-033', type: 'Conflit d\'intérêts', priority: 'moyenne', resolution: 'Classé sans suite', investigator: 'Sophie Martin', duration: '8j', closed: '2025-05-20' },
  { id: 'ETH-2024-030', type: 'Discrimination', priority: 'haute', resolution: 'Médiation', investigator: 'Karim Benzema', duration: '14j', closed: '2025-05-15' },
  { id: 'ETH-2024-028', type: 'Non-conformité', priority: 'basse', resolution: 'Classé sans suite', investigator: 'Marie Dupont', duration: '5j', closed: '2025-05-10' },
  { id: 'ETH-2024-025', type: 'Corruption', priority: 'critique', resolution: 'Confirmé', investigator: 'Jean-Marc Leroy', duration: '30j', closed: '2025-05-05' },
  { id: 'ETH-2024-022', type: 'Violation données', priority: 'haute', resolution: 'Confirmé', investigator: 'Sophie Martin', duration: '16j', closed: '2025-04-28' },
  { id: 'ETH-2024-020', type: 'Harcèlement', priority: 'moyenne', resolution: 'Médiation', investigator: 'Karim Benzema', duration: '10j', closed: '2025-04-20' },
  { id: 'ETH-2024-018', type: 'Fraude', priority: 'haute', resolution: 'Classé sans suite', investigator: 'Marie Dupont', duration: '12j', closed: '2025-04-15' },
  { id: 'ETH-2024-015', type: 'Conflit d\'intérêts', priority: 'moyenne', resolution: 'Confirmé', investigator: 'Jean-Marc Leroy', duration: '9j', closed: '2025-04-10' },
];

const resolutionColors: Record<string, string> = {
  Confirmé: 'bg-destructive/15 text-destructive',
  'Classé sans suite': 'bg-muted text-muted-foreground',
  Médiation: 'bg-primary/15 text-primary',
};

const priorityColors: Record<string, string> = {
  critique: 'bg-destructive text-destructive-foreground',
  haute: 'bg-orange-500/15 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  basse: 'bg-muted text-muted-foreground',
};

const EthicsClosed = () => {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: mockClosed,
    searchFields: ['id', 'type', 'investigator', 'resolution'],
  });

  const confirmedCount = mockClosed.filter(c => c.resolution === 'Confirmé').length;
  const confirmedRate = Math.round((confirmedCount / mockClosed.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dossiers clôturés</h1>
        <p className="text-muted-foreground">Historique des dossiers résolus et leurs issues</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{mockClosed.length}</p><p className="text-xs text-muted-foreground">Total clôturés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{confirmedRate}%</p><p className="text-xs text-muted-foreground">Taux confirmé</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Scale className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">Médiations</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">14.4j</p><p className="text-xs text-muted-foreground">Durée moyenne</p></div></div></CardContent></Card>
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
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>ID</SortableTableHead>
                <SortableTableHead column="type" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Type</SortableTableHead>
                <SortableTableHead column="priority" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Priorité</SortableTableHead>
                <SortableTableHead column="resolution" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Résolution</SortableTableHead>
                <SortableTableHead column="investigator" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Enquêteur</SortableTableHead>
                <SortableTableHead column="duration" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Durée</SortableTableHead>
                <SortableTableHead column="closed" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockClosed[0])}>Clôturé le</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell><Badge className={priorityColors[c.priority]}>{c.priority}</Badge></TableCell>
                  <TableCell><Badge className={resolutionColors[c.resolution]}>{c.resolution}</Badge></TableCell>
                  <TableCell>{c.investigator}</TableCell>
                  <TableCell>{c.duration}</TableCell>
                  <TableCell>{c.closed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EthicsClosed;
