import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, Loader2 } from 'lucide-react';
import ContractForm from '@/components/forms/ContractForm';
import { ExportButtons } from '@/components/ExportButtons';
import { useContracts, useCreateContract, useUpdateContract } from '@/hooks/useContracts';

export default function Contracts() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(undefined);

  const { data: contracts = [], isLoading } = useContracts(search || undefined);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const handleSubmit = (data: any) => {
    if (editingContract) {
      updateContract.mutate({ id: editingContract.id, ...data }, { onSuccess: () => toast.success('Contrat modifié') });
    } else {
      const num = `C-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
      createContract.mutate({ contract_number: num, ...data }, { onSuccess: () => toast.success('Contrat créé') });
    }
    setEditingContract(undefined);
  };

  const handleEdit = (c: any) => { setEditingContract({ ...c, startDate: c.start_date, endDate: c.end_date }); setFormOpen(true); };
  const handleNew = () => { setEditingContract(undefined); setFormOpen(true); };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Contrats</h1><p className="text-muted-foreground">Gestion des contrats et accords</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="contrats" title="Liste des contrats" poleName="Compliance" columns={[
            { header: 'N°', accessor: 'contract_number' }, { header: 'Titre', accessor: 'title' },
            { header: 'Type', accessor: 'type' }, { header: 'Début', accessor: 'start_date' },
            { header: 'Fin', accessor: 'end_date' }, { header: 'Valeur', accessor: 'value' },
            { header: 'Statut', accessor: 'status' },
          ]} data={contracts} />
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nouveau contrat</Button>
        </div>
      </div>
      <Card><CardHeader><div className="flex items-center gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher un contrat..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></div></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Type</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Valeur</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{contracts.map((c) => (
            <TableRow key={c.id}><TableCell className="font-mono">{c.contract_number}</TableCell><TableCell className="font-medium">{c.title}</TableCell><TableCell>{c.type}</TableCell><TableCell>{c.start_date}</TableCell><TableCell>{c.end_date}</TableCell><TableCell>{c.value || '-'}</TableCell>
              <TableCell><Badge variant={c.status === 'active' ? 'default' : c.status === 'expiring' ? 'secondary' : 'destructive'}>{c.status === 'active' ? 'Actif' : c.status === 'expiring' ? 'Expire bientôt' : 'Expiré'}</Badge></TableCell>
              <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}{contracts.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun contrat trouvé</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      <ContractForm open={formOpen} onOpenChange={setFormOpen} contract={editingContract} onSubmit={handleSubmit} />
    </div>
  );
}
