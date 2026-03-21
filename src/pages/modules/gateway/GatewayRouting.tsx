import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { ArrowRightLeft, CheckCircle2, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const initialRouting = [
  { id: 'GW-2025-107', subject: 'Signalement conditions travail', category: 'Éthique', pole: 'Ethics', routingStatus: 'En attente', routedBy: '-', date: '2025-06-15' },
  { id: 'GW-2025-102', subject: 'Réclamation colis endommagé', category: 'Réclamation', pole: 'Lifecycle', routingStatus: 'Routé', routedBy: 'Pierre Moreau', date: '2025-06-18' },
  { id: 'GW-2025-101', subject: 'Demande certificat Bio', category: 'Certification', pole: 'Supplier', routingStatus: 'En attente', routedBy: '-', date: '2025-06-18' },
  { id: 'GW-2025-105', subject: 'Demande devis volume', category: 'Commercial', pole: 'Marketing', routingStatus: 'En attente', routedBy: '-', date: '2025-06-16' },
  { id: 'GW-2025-104', subject: 'Contrôle conformité étiquetage', category: 'Réglementaire', pole: 'Compliance', routingStatus: 'En attente', routedBy: '-', date: '2025-06-17' },
  { id: 'GW-2025-106', subject: 'Résultats analyse lot #7823', category: 'Qualité', pole: 'Supplier', routingStatus: 'En attente', routedBy: '-', date: '2025-06-16' },
  { id: 'GW-2025-108', subject: 'Confirmation virement fournisseur', category: 'Finance', pole: 'Finance', routingStatus: 'Routé', routedBy: 'Pierre Moreau', date: '2025-06-15' },
  { id: 'GW-2025-110', subject: 'Retour produit périmé', category: 'Réclamation', pole: 'Ops', routingStatus: 'Routé', routedBy: 'Marie Dupont', date: '2025-06-14' },
  { id: 'GW-2025-109', subject: 'Renouvellement licence', category: 'Réglementaire', pole: 'Compliance', routingStatus: 'Routé', routedBy: 'Alice Bernard', date: '2025-06-14' },
];

const routingColors: Record<string, string> = {
  'En attente': 'bg-yellow-500/15 text-yellow-700',
  Routé: 'bg-primary/15 text-primary',
  Confirmé: 'bg-green-500/15 text-green-700',
};

const GatewayRouting = () => {
  const { toast } = useToast();
  const [items, setItems] = useState(initialRouting);

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: items,
    searchFields: ['id', 'subject', 'category', 'pole'],
  });

  const handleRoute = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, routingStatus: 'Routé', routedBy: 'Vous' } : m));
    toast({ title: 'Message routé', description: `${id} a été routé vers le pôle cible.` });
  };

  const handleConfirm = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, routingStatus: 'Confirmé' } : m));
    toast({ title: 'Routage confirmé', description: `${id} — réception confirmée par le pôle.` });
  };

  const pendingCount = items.filter(m => m.routingStatus === 'En attente').length;
  const routedCount = items.filter(m => m.routingStatus === 'Routé').length;
  const confirmedCount = items.filter(m => m.routingStatus === 'Confirmé').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Routage</h1>
        <p className="text-muted-foreground">Attribution des messages validés vers les pôles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ArrowRightLeft className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total messages</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">En attente</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{routedCount}</p><p className="text-xs text-muted-foreground">Routés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{confirmedCount}</p><p className="text-xs text-muted-foreground">Confirmés</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table de routage</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.routingStatus || 'all'} onValueChange={v => setFilter('routingStatus', v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Routé">Routé</SelectItem>
                <SelectItem value="Confirmé">Confirmé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.pole || 'all'} onValueChange={v => setFilter('pole', v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Pôle cible" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Ethics">Ethics</SelectItem>
                <SelectItem value="Lifecycle">Lifecycle</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Ops">Ops</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialRouting[0])}>ID</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialRouting[0])}>Objet</SortableTableHead>
                <SortableTableHead column="pole" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialRouting[0])}>Pôle cible</SortableTableHead>
                <SortableTableHead column="routingStatus" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialRouting[0])}>Statut</SortableTableHead>
                <SortableTableHead column="routedBy" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialRouting[0])}>Routé par</SortableTableHead>
                <SortableTableHead column="id" currentSort={null} direction={null} onSort={() => {}}>Actions</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                  <TableCell><Badge variant="outline">{m.pole}</Badge></TableCell>
                  <TableCell><Badge className={routingColors[m.routingStatus]}>{m.routingStatus}</Badge></TableCell>
                  <TableCell>{m.routedBy}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {m.routingStatus === 'En attente' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleRoute(m.id)}>
                          <Send className="h-3 w-3" /> Router
                        </Button>
                      )}
                      {m.routingStatus === 'Routé' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600" onClick={() => handleConfirm(m.id)}>
                          <CheckCircle2 className="h-3 w-3" /> Confirmer
                        </Button>
                      )}
                      {m.routingStatus === 'Confirmé' && <span className="text-xs text-green-600">Confirmé ✓</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GatewayRouting;
