import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Check, X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const initialValidation = [
  { id: 'GW-2025-101', sender: 'Fournisseur Maroc S.A.', subject: 'Demande certificat Bio', category: 'Certification', validator: 'Non assigné', validation: 'En attente', date: '2025-06-18' },
  { id: 'GW-2025-104', sender: 'DGCCRF', subject: 'Contrôle conformité étiquetage', category: 'Réglementaire', validator: 'Non assigné', validation: 'En attente', date: '2025-06-17' },
  { id: 'GW-2025-107', sender: 'Salarié anonyme', subject: 'Signalement conditions travail', category: 'Éthique', validator: 'Marie Dupont', validation: 'En attente', date: '2025-06-15' },
  { id: 'GW-2025-102', sender: 'Client Leclerc #412', subject: 'Réclamation colis endommagé', category: 'Réclamation', validator: 'Pierre Moreau', validation: 'En attente', date: '2025-06-18' },
  { id: 'GW-2025-106', sender: 'Laboratoire TÜV', subject: 'Résultats analyse lot #7823', category: 'Qualité', validator: 'Alice Bernard', validation: 'En attente', date: '2025-06-16' },
  { id: 'GW-2025-109', sender: 'Mairie Rungis', subject: 'Renouvellement licence', category: 'Réglementaire', validator: 'Pierre Moreau', validation: 'En attente', date: '2025-06-14' },
  { id: 'GW-2025-103', sender: 'Partenaire DHL', subject: 'Mise à jour tarifs Q3', category: 'Logistique', validator: 'Marie Dupont', validation: 'En attente', date: '2025-06-17' },
  { id: 'GW-2025-105', sender: 'Client Carrefour #887', subject: 'Demande devis volume', category: 'Commercial', validator: 'Alice Bernard', validation: 'En attente', date: '2025-06-16' },
];

const validationColors: Record<string, string> = {
  'En attente': 'bg-yellow-500/15 text-yellow-700',
  Approuvé: 'bg-green-500/15 text-green-700',
  Rejeté: 'bg-destructive/15 text-destructive',
  Signalé: 'bg-orange-500/15 text-orange-700',
};

const GatewayValidation = () => {
  const { toast } = useToast();
  const [items, setItems] = useState(initialValidation);

  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: items,
    searchFields: ['id', 'sender', 'subject', 'category', 'validator'],
  });

  const handleApprove = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, validation: 'Approuvé' } : m));
    toast({ title: 'Message approuvé', description: `${id} est prêt pour le routage.` });
  };

  const handleReject = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, validation: 'Rejeté' } : m));
    toast({ title: 'Message rejeté', description: `${id} a été rejeté.`, variant: 'destructive' });
  };

  const handleFlag = (id: string) => {
    setItems(prev => prev.map(m => m.id === id ? { ...m, validation: 'Signalé' } : m));
    toast({ title: 'Message signalé', description: `${id} a été signalé pour revue.` });
  };

  const pendingCount = items.filter(m => m.validation === 'En attente').length;
  const approvedCount = items.filter(m => m.validation === 'Approuvé').length;
  const rejectedCount = items.filter(m => m.validation === 'Rejeté').length;
  const flaggedCount = items.filter(m => m.validation === 'Signalé').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validation</h1>
        <p className="text-muted-foreground">Approbation des messages avant routage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">En attente</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{approvedCount}</p><p className="text-xs text-muted-foreground">Approuvés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{rejectedCount}</p><p className="text-xs text-muted-foreground">Rejetés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">{flaggedCount}</p><p className="text-xs text-muted-foreground">Signalés</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File de validation</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <Input placeholder="Rechercher…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
            <Select value={filters.validation || 'all'} onValueChange={v => setFilter('validation', v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
                <SelectItem value="Approuvé">Approuvé</SelectItem>
                <SelectItem value="Rejeté">Rejeté</SelectItem>
                <SelectItem value="Signalé">Signalé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialValidation[0])}>ID</SortableTableHead>
                <SortableTableHead column="sender" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialValidation[0])}>Expéditeur</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialValidation[0])}>Objet</SortableTableHead>
                <SortableTableHead column="category" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialValidation[0])}>Catégorie</SortableTableHead>
                <SortableTableHead column="validation" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof initialValidation[0])}>Statut</SortableTableHead>
                <SortableTableHead column="id" currentSort={null} direction={null} onSort={() => {}}>Actions</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell>{m.sender}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                  <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                  <TableCell><Badge className={validationColors[m.validation]}>{m.validation}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {m.validation === 'En attente' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600 hover:text-green-700" onClick={() => handleApprove(m.id)}>
                            <Check className="h-3 w-3" /> Approuver
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => handleReject(m.id)}>
                            <X className="h-3 w-3" /> Rejeter
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleFlag(m.id)}>
                            <Flag className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {m.validation === 'Approuvé' && <span className="text-xs text-green-600">Approuvé ✓</span>}
                      {m.validation === 'Rejeté' && <span className="text-xs text-destructive">Rejeté ✗</span>}
                      {m.validation === 'Signalé' && <span className="text-xs text-orange-600">Signalé ⚑</span>}
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

export default GatewayValidation;
