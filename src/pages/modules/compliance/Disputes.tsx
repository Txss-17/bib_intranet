import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, MessageSquare, Edit, Loader2 } from 'lucide-react';
import DisputeForm from '@/components/forms/DisputeForm';
import { ExportButtons } from '@/components/ExportButtons';
import { useDisputes, useCreateDispute, useUpdateDispute } from '@/hooks/useDisputes';

export default function Disputes() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState<any>(undefined);

  const { data: disputes = [], isLoading } = useDisputes(search || undefined);
  const createDispute = useCreateDispute();
  const updateDispute = useUpdateDispute();

  const handleSubmit = (data: any) => {
    if (editingDispute) {
      updateDispute.mutate({ id: editingDispute.id, ...data }, { onSuccess: () => toast.success('Litige modifié') });
    } else {
      const num = `LIT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
      createDispute.mutate({ dispute_number: num, open_date: new Date().toISOString().split('T')[0], resolved_date: null, ...data }, { onSuccess: () => toast.success('Litige créé') });
    }
    setEditingDispute(undefined);
  };

  const handleEdit = (d: any) => { setEditingDispute(d); setFormOpen(true); };
  const handleNew = () => { setEditingDispute(undefined); setFormOpen(true); };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Litiges</h1><p className="text-muted-foreground">Suivi et gestion des litiges</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="litiges" title="Liste des litiges" poleName="Compliance" columns={[
            { header: 'N°', accessor: 'dispute_number' }, { header: 'Sujet', accessor: 'subject' },
            { header: 'Partie', accessor: 'party' }, { header: 'Type', accessor: 'type' },
            { header: 'Montant', accessor: 'amount' }, { header: 'Priorité', accessor: 'priority' },
            { header: 'Statut', accessor: 'status' },
          ]} data={disputes} />
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Nouveau litige</Button>
        </div>
      </div>
      <Card><CardHeader><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher un litige..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Sujet</TableHead><TableHead>Partie</TableHead><TableHead>Type</TableHead><TableHead>Montant</TableHead><TableHead>Priorité</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{disputes.map((d) => (
            <TableRow key={d.id}><TableCell className="font-mono">{d.dispute_number}</TableCell><TableCell className="font-medium max-w-[200px] truncate">{d.subject}</TableCell><TableCell>{d.party}</TableCell><TableCell>{d.type}</TableCell><TableCell>{d.amount || '-'}</TableCell>
              <TableCell><Badge variant={d.priority === 'high' ? 'destructive' : d.priority === 'medium' ? 'secondary' : 'outline'}>{d.priority === 'high' ? 'Haute' : d.priority === 'medium' ? 'Moyenne' : 'Basse'}</Badge></TableCell>
              <TableCell><Badge variant={d.status === 'open' ? 'destructive' : d.status === 'negotiation' ? 'secondary' : 'default'}>{d.status === 'open' ? 'Ouvert' : d.status === 'negotiation' ? 'Négociation' : 'Résolu'}</Badge></TableCell>
              <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Edit className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}{disputes.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun litige trouvé</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      <DisputeForm open={formOpen} onOpenChange={setFormOpen} dispute={editingDispute} onSubmit={handleSubmit} />
    </div>
  );
}
