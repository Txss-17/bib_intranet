import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { Inbox, Mail, MailOpen, Clock, UserPlus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const initialMessages = [
  { id: 'GW-2025-101', sender: 'Fournisseur Maroc S.A.', subject: 'Demande certificat Bio', channel: 'Email', category: 'Certification', date: '2025-06-18', status: 'Nouveau' },
  { id: 'GW-2025-102', sender: 'Client Leclerc #412', subject: 'Réclamation colis endommagé', channel: 'Formulaire', category: 'Réclamation', date: '2025-06-18', status: 'Nouveau' },
  { id: 'GW-2025-103', sender: 'Partenaire DHL', subject: 'Mise à jour tarifs Q3', channel: 'Email', category: 'Logistique', date: '2025-06-17', status: 'Lu' },
  { id: 'GW-2025-104', sender: 'DGCCRF', subject: 'Contrôle conformité étiquetage', channel: 'Courrier', category: 'Réglementaire', date: '2025-06-17', status: 'Nouveau' },
  { id: 'GW-2025-105', sender: 'Client Carrefour #887', subject: 'Demande de devis volume', channel: 'Formulaire', category: 'Commercial', date: '2025-06-16', status: 'Lu' },
  { id: 'GW-2025-106', sender: 'Laboratoire TÜV', subject: 'Résultats analyse lot #7823', channel: 'Email', category: 'Qualité', date: '2025-06-16', status: 'Nouveau' },
  { id: 'GW-2025-107', sender: 'Salarié anonyme', subject: 'Signalement conditions travail', channel: 'Hotline', category: 'Éthique', date: '2025-06-15', status: 'Nouveau' },
  { id: 'GW-2025-108', sender: 'Banque BNP', subject: 'Confirmation virement fournisseur', channel: 'Email', category: 'Finance', date: '2025-06-15', status: 'Lu' },
  { id: 'GW-2025-109', sender: 'Mairie Rungis', subject: 'Renouvellement licence exploitation', channel: 'Courrier', category: 'Réglementaire', date: '2025-06-14', status: 'Nouveau' },
  { id: 'GW-2025-110', sender: 'Client Bio c\' Bon', subject: 'Retour produit périmé', channel: 'Formulaire', category: 'Réclamation', date: '2025-06-14', status: 'Lu' },
];

const statusColors: Record<string, string> = {
  Nouveau: 'bg-primary/15 text-primary',
  Lu: 'bg-muted text-muted-foreground',
  Assigné: 'bg-green-500/15 text-green-700',
};

const GatewayInbox = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState(initialMessages);

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: messages,
    searchFields: ['id', 'sender', 'subject', 'category'],
  });

  const handleMarkRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Lu' } : m));
    toast({ title: 'Marqué comme lu', description: `${id} a été marqué comme lu.` });
  };

  const handleAssign = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'Assigné' } : m));
    toast({ title: 'Message assigné', description: `${id} a été assigné pour validation.` });
  };

  const newCount = messages.filter(m => m.status === 'Nouveau').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Réception</h1>
        <p className="text-muted-foreground">Messages entrants non traités</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Inbox className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{messages.length}</p><p className="text-xs text-muted-foreground">Total en boîte</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{newCount}</p><p className="text-xs text-muted-foreground">Non lus</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MailOpen className="h-8 w-8 text-muted-foreground" /><div><p className="text-2xl font-bold">{messages.filter(m => m.status === 'Lu').length}</p><p className="text-xs text-muted-foreground">Lus (non traités)</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">2.1h</p><p className="text-xs text-muted-foreground">Temps moyen lecture</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boîte de réception</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.channel || 'all'} onValueChange={v => setFilter('channel', v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Formulaire">Formulaire</SelectItem>
                <SelectItem value="Courrier">Courrier</SelectItem>
                <SelectItem value="Hotline">Hotline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Certification">Certification</SelectItem>
                <SelectItem value="Réclamation">Réclamation</SelectItem>
                <SelectItem value="Logistique">Logistique</SelectItem>
                <SelectItem value="Réglementaire">Réglementaire</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Qualité">Qualité</SelectItem>
                <SelectItem value="Éthique">Éthique</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>ID</SortableTableHead>
                <SortableTableHead column="sender" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>Expéditeur</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>Objet</SortableTableHead>
                <SortableTableHead column="channel" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>Canal</SortableTableHead>
                <SortableTableHead column="category" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>Catégorie</SortableTableHead>
                <SortableTableHead column="status" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialMessages[0])}>Statut</SortableTableHead>
                <SortableTableHead column="id" currentSort={null} direction={null} onSort={() => {}}>Actions</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell>{m.sender}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                  <TableCell><Badge variant="outline">{m.channel}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                  <TableCell><Badge className={statusColors[m.status] || 'bg-muted text-muted-foreground'}>{m.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {m.status === 'Nouveau' && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleMarkRead(m.id)}>
                          <Eye className="h-3 w-3" /> Lire
                        </Button>
                      )}
                      {(m.status === 'Nouveau' || m.status === 'Lu') && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleAssign(m.id)}>
                          <UserPlus className="h-3 w-3" /> Assigner
                        </Button>
                      )}
                      {m.status === 'Assigné' && <span className="text-xs text-green-600">Assigné ✓</span>}
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

export default GatewayInbox;
