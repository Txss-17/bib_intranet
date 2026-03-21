import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Search, Mail, Inbox, Clock, CheckCircle, AlertTriangle, Eye, MailOpen } from 'lucide-react';

const messages = [
  { id: 'MSG-001', from: 'client@ecostar.fr', subject: 'Demande de partenariat', channel: 'email', category: 'partnership', status: 'new', receivedAt: '21/03 09:15', priority: 'high', assignedTo: null },
  { id: 'MSG-002', from: 'fournisseur@greenpack.de', subject: 'Mise à jour certification ISO', channel: 'email', category: 'compliance', status: 'read', receivedAt: '21/03 08:42', priority: 'medium', assignedTo: 'Audit' },
  { id: 'MSG-003', from: 'contact@bioshop.es', subject: 'Réclamation commande #4521', channel: 'form', category: 'complaint', status: 'routed', receivedAt: '20/03 17:30', priority: 'high', assignedTo: 'Support' },
  { id: 'MSG-004', from: 'press@ecoblog.com', subject: 'Interview demande podcast', channel: 'email', category: 'media', status: 'new', receivedAt: '20/03 14:20', priority: 'low', assignedTo: null },
  { id: 'MSG-005', from: 'legal@partner.co.uk', subject: 'Contrat renouvellement 2025', channel: 'email', category: 'legal', status: 'validated', receivedAt: '20/03 11:00', priority: 'high', assignedTo: 'Compliance' },
  { id: 'MSG-006', from: 'support@carrier.fr', subject: 'Incident livraison lot #892', channel: 'api', category: 'logistics', status: 'routed', receivedAt: '19/03 16:45', priority: 'critical', assignedTo: 'Ops' },
];

const kpis = [
  { label: 'Messages reçus (24h)', value: 47, icon: Inbox, color: 'text-primary', bgColor: 'bg-primary/10' },
  { label: 'Non traités', value: 12, icon: Mail, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'Routés', value: 28, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Urgents', value: 5, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Nouveau', variant: 'destructive' },
  read: { label: 'Lu', variant: 'outline' },
  routed: { label: 'Routé', variant: 'default' },
  validated: { label: 'Validé', variant: 'secondary' },
};

export default function GatewayDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [filters, setFiltersState] = useState<Record<string, string>>({});
  const setFilter = (key: string, value: string) => setFiltersState(prev => ({ ...prev, [key]: value }));
  const toggleSort = (col: string) => {
    if (sortColumn === col) { if (sortDirection === 'asc') setSortDirection('desc'); else { setSortColumn(null); setSortDirection(null); } }
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const filtered = messages
    .filter(m => {
      if (searchQuery && !m.from.toLowerCase().includes(searchQuery.toLowerCase()) && !m.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && m.status !== filters.status) return false;
      if (filters.category && filters.category !== 'all' && m.category !== filters.category) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn || !sortDirection) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      return String(a[sortColumn as keyof typeof a]).localeCompare(String(b[sortColumn as keyof typeof b])) * dir;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Gateways & Messages</h1>
        <p className="text-muted-foreground">Réception, tri et routage des messages externes</p>
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
            <CardTitle>Boîte de Réception</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
              </div>
              <Select value={filters.status || 'all'} onValueChange={v => setFilter('status', v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="read">Lu</SelectItem>
                  <SelectItem value="routed">Routé</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="partnership">Partenariat</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="complaint">Réclamation</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="legal">Juridique</SelectItem>
                  <SelectItem value="logistics">Logistique</SelectItem>
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
                <SortableTableHead column="from" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Expéditeur</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Objet</SortableTableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Assigné à</TableHead>
                <SortableTableHead column="receivedAt" currentSort={sortColumn} direction={sortDirection} onSort={toggleSort}>Reçu</SortableTableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell className="text-sm">{m.from}</TableCell>
                  <TableCell className="font-medium max-w-xs truncate">{m.subject}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{m.channel}</Badge></TableCell>
                  <TableCell className="text-sm capitalize">{m.category}</TableCell>
                  <TableCell><Badge variant={statusConfig[m.status].variant}>{statusConfig[m.status].label}</Badge></TableCell>
                  <TableCell className="text-sm">{m.assignedTo || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{m.receivedAt}</TableCell>
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
