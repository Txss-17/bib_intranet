import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Search, Plus, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
 import ContractForm from '@/components/forms/ContractForm';
 import { ExportButtons } from '@/components/ExportButtons';
 
 const contractColumns = [
   { header: 'ID', accessor: 'id' },
   { header: 'Titre', accessor: 'title' },
   { header: 'Type', accessor: 'type' },
   { header: 'Date début', accessor: 'startDate' },
   { header: 'Date fin', accessor: 'endDate' },
   { header: 'Valeur', accessor: 'value' },
   { header: 'Statut', accessor: 'status' },
 ];

const initialContracts = [
  { id: 'C-2024-089', title: 'Contrat fournisseur ABC', type: 'Fournisseur', startDate: '2024-01-15', endDate: '2025-01-14', status: 'active', value: '45 000 €' },
  { id: 'C-2024-088', title: 'Accord de partenariat XYZ', type: 'Partenariat', startDate: '2024-02-01', endDate: '2026-01-31', status: 'active', value: '120 000 €' },
  { id: 'C-2024-087', title: 'Contrat de service IT', type: 'Service', startDate: '2024-01-01', endDate: '2024-12-31', status: 'expiring', value: '35 000 €' },
  { id: 'C-2024-086', title: 'NDA Partenaire Delta', type: 'NDA', startDate: '2024-03-01', endDate: '2027-02-28', status: 'active', value: '-' },
  { id: 'C-2024-085', title: 'Contrat logistique Express', type: 'Logistique', startDate: '2023-06-01', endDate: '2024-05-31', status: 'expired', value: '89 000 €' },
];

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [contracts, setContracts] = useState(initialContracts);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<typeof initialContracts[0] | undefined>();

  const filtered = contracts.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data: any) => {
    if (editingContract) {
      setContracts(contracts.map(c => 
        c.id === editingContract.id ? { ...c, ...data } : c
      ));
      toast.success('Contrat modifié avec succès');
    } else {
      const newContract = {
        id: `C-2024-${String(90 + contracts.length).padStart(3, '0')}`,
        ...data
      };
      setContracts([newContract, ...contracts]);
      toast.success('Contrat créé avec succès');
    }
    setEditingContract(undefined);
  };

  const handleEdit = (contract: typeof initialContracts[0]) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingContract(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contrats</h1>
          <p className="text-muted-foreground">Gestion des contrats et accords</p>
        </div>
        <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" /> Nouveau contrat</Button>
         <ExportButtons
           filename="contrats"
           title="Liste des contrats"
           columns={contractColumns}
           data={filtered}
         />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un contrat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono">{contract.id}</TableCell>
                  <TableCell className="font-medium">{contract.title}</TableCell>
                  <TableCell>{contract.type}</TableCell>
                  <TableCell>{contract.startDate}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>{contract.value}</TableCell>
                  <TableCell>
                    <Badge variant={
                      contract.status === 'active' ? 'default' :
                      contract.status === 'expiring' ? 'secondary' : 'destructive'
                    }>
                      {contract.status === 'active' ? 'Actif' :
                       contract.status === 'expiring' ? 'Expire bientôt' : 'Expiré'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContractForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        contract={editingContract}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
