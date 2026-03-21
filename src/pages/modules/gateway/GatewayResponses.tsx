import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { MessageSquareReply, Send, FileEdit, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const initialResponses = [
  { id: 'GW-2025-102', subject: 'Réclamation colis endommagé', sender: 'Client Leclerc #412', respondedBy: 'Pierre Moreau', pole: 'Lifecycle', responseDate: '2025-06-18', responseStatus: 'Envoyé' },
  { id: 'GW-2025-107', subject: 'Signalement conditions travail', sender: 'Salarié anonyme', respondedBy: 'Marie Dupont', pole: 'Ethics', responseDate: '2025-06-17', responseStatus: 'Accusé réception' },
  { id: 'GW-2025-108', subject: 'Confirmation virement fournisseur', sender: 'Banque BNP', respondedBy: 'Alice Bernard', pole: 'Finance', responseDate: '2025-06-16', responseStatus: 'Envoyé' },
  { id: 'GW-2025-105', subject: 'Demande devis volume', sender: 'Client Carrefour #887', respondedBy: 'Sophie Martin', pole: 'Marketing', responseDate: '2025-06-16', responseStatus: 'Brouillon' },
  { id: 'GW-2025-110', subject: 'Retour produit périmé', sender: 'Client Bio c\' Bon', respondedBy: 'Pierre Moreau', pole: 'Ops', responseDate: '2025-06-15', responseStatus: 'Envoyé' },
  { id: 'GW-2025-103', subject: 'Mise à jour tarifs Q3', sender: 'Partenaire DHL', respondedBy: 'Marie Dupont', pole: 'Ops', responseDate: '2025-06-15', responseStatus: 'Accusé réception' },
  { id: 'GW-2025-109', subject: 'Renouvellement licence', sender: 'Mairie Rungis', respondedBy: 'Alice Bernard', pole: 'Compliance', responseDate: '2025-06-14', responseStatus: 'Brouillon' },
  { id: 'GW-2025-101', subject: 'Demande certificat Bio', sender: 'Fournisseur Maroc S.A.', respondedBy: 'Sophie Martin', pole: 'Supplier', responseDate: '2025-06-14', responseStatus: 'Envoyé' },
];

const responseColors: Record<string, string> = {
  Brouillon: 'bg-muted text-muted-foreground',
  Envoyé: 'bg-primary/15 text-primary',
  'Accusé réception': 'bg-green-500/15 text-green-700',
};

const GatewayResponses = () => {
  const { toast } = useToast();
  const [items, setItems] = useState(initialResponses);

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: items,
    searchFields: ['id', 'subject', 'sender', 'respondedBy', 'pole'],
  });

  const handleSend = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, responseStatus: 'Envoyé' } : m));
    toast({ title: 'Réponse envoyée', description: `${id} — la réponse a été envoyée au destinataire.` });
  };

  const sentCount = items.filter(m => m.responseStatus === 'Envoyé').length;
  const draftCount = items.filter(m => m.responseStatus === 'Brouillon').length;
  const ackedCount = items.filter(m => m.responseStatus === 'Accusé réception').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réponses</h1>
        <p className="text-muted-foreground">Suivi des réponses envoyées et brouillons</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MessageSquareReply className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{items.length}</p><p className="text-xs text-muted-foreground">Total réponses</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Send className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{sentCount}</p><p className="text-xs text-muted-foreground">Envoyées</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><FileEdit className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{draftCount}</p><p className="text-xs text-muted-foreground">Brouillons</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCheck className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{ackedCount}</p><p className="text-xs text-muted-foreground">Accusés réception</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des réponses</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.responseStatus || 'all'} onValueChange={v => setFilter('responseStatus', v)}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Brouillon">Brouillon</SelectItem>
                <SelectItem value="Envoyé">Envoyé</SelectItem>
                <SelectItem value="Accusé réception">Accusé réception</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.pole || 'all'} onValueChange={v => setFilter('pole', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Pôle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Lifecycle">Lifecycle</SelectItem>
                <SelectItem value="Ethics">Ethics</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Ops">Ops</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
                <SelectItem value="Supplier">Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialResponses[0])}>ID</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialResponses[0])}>Objet</SortableTableHead>
                <SortableTableHead column="sender" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialResponses[0])}>Destinataire</SortableTableHead>
                <SortableTableHead column="pole" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialResponses[0])}>Pôle</SortableTableHead>
                <SortableTableHead column="responseStatus" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialResponses[0])}>Statut</SortableTableHead>
                <SortableTableHead column="id" currentSort={null} direction={null} onSort={() => {}}>Actions</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                  <TableCell>{m.sender}</TableCell>
                  <TableCell><Badge variant="outline">{m.pole}</Badge></TableCell>
                  <TableCell><Badge className={responseColors[m.responseStatus]}>{m.responseStatus}</Badge></TableCell>
                  <TableCell>
                    {m.responseStatus === 'Brouillon' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSend(m.id)}>
                        <Send className="h-3 w-3" /> Envoyer
                      </Button>
                    )}
                    {m.responseStatus === 'Envoyé' && <span className="text-xs text-primary">Envoyé ✓</span>}
                    {m.responseStatus === 'Accusé réception' && <span className="text-xs text-green-600">Reçu ✓✓</span>}
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

export default GatewayResponses;
