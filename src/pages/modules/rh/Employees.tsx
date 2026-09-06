import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Mail, Phone, Edit, Trash2, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExportButtons } from '@/components/ExportButtons';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', pole: '', position: '', status: 'active', start_date: '' });

  const { data: employees = [], isLoading } = useEmployees(searchTerm || undefined);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const handleOpenForm = (employee?: any) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({ name: employee.name, email: employee.email, pole: employee.pole, position: employee.position, status: employee.status, start_date: employee.start_date || '' });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', email: '', pole: '', position: '', status: 'active', start_date: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const data = { ...formData, start_date: formData.start_date || null, phone: null };
    if (editingEmployee) {
      updateEmployee.mutate({ id: editingEmployee.id, ...data }, { onSuccess: () => toast.success('Employé modifié') });
    } else {
      createEmployee.mutate(data as any, { onSuccess: () => toast.success('Employé ajouté') });
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteEmployee.mutate(id, { onSuccess: () => toast.success('Employé supprimé') });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Employés</h1><p className="text-muted-foreground">Gestion de l'annuaire des collaborateurs</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="employes" title="Liste des employés" columns={[
            { header: 'Nom', accessor: 'name' }, { header: 'Email', accessor: 'email' },
            { header: 'Pôle', accessor: 'pole' }, { header: 'Poste', accessor: 'position' },
            { header: 'Statut', accessor: 'status' }, { header: "Date d'arrivée", accessor: 'start_date' },
          ]} data={employees} />
          <Button variant="outline" asChild><Link to="/pole/rh/onboarding"><UserPlus className="mr-2 h-4 w-4" />Ajouter un dossier</Link></Button>
          <Button onClick={() => handleOpenForm()}><Plus className="mr-2 h-4 w-4" />Ajouter un employé</Button>
        </div>
      </div>
      <div className="flex items-center gap-4"><div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></div>
      <Card><CardHeader><CardTitle>Liste des employés ({employees.length})</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow><TableHead>Employé</TableHead><TableHead>Pôle</TableHead><TableHead>Poste</TableHead><TableHead>Statut</TableHead><TableHead>Date d'arrivée</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{employees.map((e) => (
            <TableRow key={e.id}><TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{e.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback></Avatar><div><p className="font-medium">{e.name}</p><p className="text-sm text-muted-foreground">{e.email}</p></div></div></TableCell>
              <TableCell><Badge variant="outline">{e.pole}</Badge></TableCell><TableCell>{e.position}</TableCell>
              <TableCell><Badge variant={e.status === 'active' ? 'default' : 'secondary'}>{e.status === 'active' ? 'Actif' : 'En congé'}</Badge></TableCell>
              <TableCell>{e.start_date ? new Date(e.start_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
              <TableCell><div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleOpenForm(e)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = `mailto:${e.email}`}><Mail className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
              </div></TableCell></TableRow>
          ))}{employees.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun employé trouvé</TableCell></TableRow>}</TableBody></Table>
      </CardContent></Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent><DialogHeader><DialogTitle>{editingEmployee ? "Modifier l'employé" : 'Ajouter un employé'}</DialogTitle><DialogDescription>{editingEmployee ? "Modifiez les informations" : "Remplissez les informations"}</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2"><Label>Nom complet</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Pôle</Label><Select value={formData.pole} onValueChange={(v) => setFormData({ ...formData, pole: v })}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Tech">Tech</SelectItem><SelectItem value="Ops">Ops</SelectItem><SelectItem value="RH">RH</SelectItem><SelectItem value="Marketing">Marketing</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Poste</Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Statut</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Actif</SelectItem><SelectItem value="leave">En congé</SelectItem></SelectContent></Select></div>
            <div className="grid gap-2"><Label>Date d'arrivée</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button><Button onClick={handleSubmit}>{editingEmployee ? 'Modifier' : 'Ajouter'}</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
