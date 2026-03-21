import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { AlertTriangle, Clock, Eye, ShieldAlert, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockReports = [
  { id: 'ETH-2025-001', type: 'Harcèlement', priority: 'critique', source: 'Anonyme', channel: 'Formulaire web', date: '2025-06-18', status: 'Nouveau' },
  { id: 'ETH-2025-002', type: 'Conflit d\'intérêts', priority: 'haute', source: 'Identifié', channel: 'Email', date: '2025-06-17', status: 'En attente' },
  { id: 'ETH-2025-003', type: 'Fraude', priority: 'critique', source: 'Anonyme', channel: 'Hotline', date: '2025-06-16', status: 'Nouveau' },
  { id: 'ETH-2025-004', type: 'Discrimination', priority: 'moyenne', source: 'Anonyme', channel: 'Formulaire web', date: '2025-06-15', status: 'En attente' },
  { id: 'ETH-2025-005', type: 'Corruption', priority: 'haute', source: 'Identifié', channel: 'Courrier', date: '2025-06-14', status: 'Nouveau' },
  { id: 'ETH-2025-006', type: 'Violation données', priority: 'haute', source: 'Anonyme', channel: 'Hotline', date: '2025-06-13', status: 'En attente' },
  { id: 'ETH-2025-007', type: 'Harcèlement', priority: 'moyenne', source: 'Identifié', channel: 'Email', date: '2025-06-12', status: 'Nouveau' },
  { id: 'ETH-2025-008', type: 'Non-conformité', priority: 'basse', source: 'Anonyme', channel: 'Formulaire web', date: '2025-06-11', status: 'Nouveau' },
  { id: 'ETH-2025-009', type: 'Conflit d\'intérêts', priority: 'moyenne', source: 'Identifié', channel: 'Email', date: '2025-06-10', status: 'En attente' },
  { id: 'ETH-2025-010', type: 'Fraude', priority: 'haute', source: 'Anonyme', channel: 'Hotline', date: '2025-06-09', status: 'Nouveau' },
];

const priorityColors: Record<string, string> = {
  critique: 'bg-destructive text-destructive-foreground',
  haute: 'bg-orange-500/15 text-orange-700 border-orange-200',
  moyenne: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
  basse: 'bg-muted text-muted-foreground',
};

const statusColors: Record<string, string> = {
  Nouveau: 'bg-primary/15 text-primary',
  'En attente': 'bg-yellow-500/15 text-yellow-700',
};

const EthicsReceived = () => {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: mockReports,
    searchFields: ['id', 'type', 'source', 'channel'],
  });

  const totalReceived = mockReports.length;
  const anonymousRate = Math.round((mockReports.filter(r => r.source === 'Anonyme').length / totalReceived) * 100);
  const newCount = mockReports.filter(r => r.status === 'Nouveau').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Signalements reçus</h1>
        <p className="text-muted-foreground">Triage et attribution des signalements entrants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ShieldAlert className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{totalReceived}</p><p className="text-xs text-muted-foreground">Total reçus (30j)</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{newCount}</p><p className="text-xs text-muted-foreground">Nouveaux (non triés)</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><UserX className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{anonymousRate}%</p><p className="text-xs text-muted-foreground">Signalements anonymes</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">4.2h</p><p className="text-xs text-muted-foreground">Temps moyen de réponse</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signalements entrants</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
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
            <Select value={filters.source || 'all'} onValueChange={v => setFilter('source', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Anonyme">Anonyme</SelectItem>
                <SelectItem value="Identifié">Identifié</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>ID</SortableTableHead>
                <SortableTableHead column="type" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Type</SortableTableHead>
                <SortableTableHead column="priority" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Priorité</SortableTableHead>
                <SortableTableHead column="source" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Source</SortableTableHead>
                <SortableTableHead column="channel" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Canal</SortableTableHead>
                <SortableTableHead column="date" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Date</SortableTableHead>
                <SortableTableHead column="status" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockReports[0])}>Statut</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell><Badge className={priorityColors[r.priority]}>{r.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                  <TableCell>{r.channel}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell><Badge className={statusColors[r.status]}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EthicsReceived;
