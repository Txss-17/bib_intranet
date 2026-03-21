import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

const mockValidation = [
  { id: 'GW-2025-101', sender: 'Fournisseur Maroc S.A.', subject: 'Demande certificat Bio', category: 'Certification', validator: 'Alice Bernard', validation: 'En attente', date: '2025-06-18' },
  { id: 'GW-2025-104', sender: 'DGCCRF', subject: 'Contrôle conformité étiquetage', category: 'Réglementaire', validator: 'Non assigné', validation: 'En attente', date: '2025-06-17' },
  { id: 'GW-2025-107', sender: 'Salarié anonyme', subject: 'Signalement conditions travail', category: 'Éthique', validator: 'Marie Dupont', validation: 'Approuvé', date: '2025-06-15' },
  { id: 'GW-2025-102', sender: 'Client Leclerc #412', subject: 'Réclamation colis endommagé', category: 'Réclamation', validator: 'Pierre Moreau', validation: 'Approuvé', date: '2025-06-18' },
  { id: 'GW-2025-106', sender: 'Laboratoire TÜV', subject: 'Résultats analyse lot #7823', category: 'Qualité', validator: 'Alice Bernard', validation: 'En attente', date: '2025-06-16' },
  { id: 'GW-2025-109', sender: 'Mairie Rungis', subject: 'Renouvellement licence', category: 'Réglementaire', validator: 'Pierre Moreau', validation: 'Signalé', date: '2025-06-14' },
  { id: 'GW-2025-103', sender: 'Partenaire DHL', subject: 'Mise à jour tarifs Q3', category: 'Logistique', validator: 'Marie Dupont', validation: 'Rejeté', date: '2025-06-17' },
  { id: 'GW-2025-105', sender: 'Client Carrefour #887', subject: 'Demande devis volume', category: 'Commercial', validator: 'Alice Bernard', validation: 'Approuvé', date: '2025-06-16' },
];

const validationColors: Record<string, string> = {
  'En attente': 'bg-yellow-500/15 text-yellow-700',
  Approuvé: 'bg-green-500/15 text-green-700',
  Rejeté: 'bg-destructive/15 text-destructive',
  Signalé: 'bg-orange-500/15 text-orange-700',
};

const GatewayValidation = () => {
  const { searchQuery, setSearchQuery, sortColumn, sortDirection, toggleSort, filters, setFilter, processedData } = useTableInteractions({
    data: mockValidation,
    searchFields: ['id', 'sender', 'subject', 'category', 'validator'],
  });

  const pendingCount = mockValidation.filter(m => m.validation === 'En attente').length;
  const approvedCount = mockValidation.filter(m => m.validation === 'Approuvé').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Validation</h1>
        <p className="text-muted-foreground">Approbation des messages avant routage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">En attente</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{approvedCount}</p><p className="text-xs text-muted-foreground">Approuvés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Rejetés</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertTriangle className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">Signalés</p></div></div></CardContent></Card>
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
            <Select value={filters.category || 'all'} onValueChange={v => setFilter('category', v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Certification">Certification</SelectItem>
                <SelectItem value="Réglementaire">Réglementaire</SelectItem>
                <SelectItem value="Éthique">Éthique</SelectItem>
                <SelectItem value="Réclamation">Réclamation</SelectItem>
                <SelectItem value="Qualité">Qualité</SelectItem>
                <SelectItem value="Logistique">Logistique</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>ID</SortableTableHead>
                <SortableTableHead column="sender" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>Expéditeur</SortableTableHead>
                <SortableTableHead column="subject" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>Objet</SortableTableHead>
                <SortableTableHead column="category" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>Catégorie</SortableTableHead>
                <SortableTableHead column="validator" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>Valideur</SortableTableHead>
                <SortableTableHead column="validation" currentSort={sortColumn as string} direction={sortDirection} onSort={c => toggleSort(c as keyof typeof mockValidation[0])}>Statut</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.id}</TableCell>
                  <TableCell>{m.sender}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.subject}</TableCell>
                  <TableCell><Badge variant="secondary">{m.category}</Badge></TableCell>
                  <TableCell>{m.validator}</TableCell>
                  <TableCell><Badge className={validationColors[m.validation]}>{m.validation}</Badge></TableCell>
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
