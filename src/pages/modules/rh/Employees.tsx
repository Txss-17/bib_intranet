import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const initialEmployees = [
  { id: 1, name: 'Marie Dupont', email: 'marie.dupont@example.com', pole: 'Finance', position: 'Manager', status: 'active', startDate: '2022-03-15' },
  { id: 2, name: 'Jean Martin', email: 'jean.martin@example.com', pole: 'Tech', position: 'Développeur Senior', status: 'active', startDate: '2021-06-01' },
  { id: 3, name: 'Sophie Bernard', email: 'sophie.bernard@example.com', pole: 'Ops', position: 'Responsable Logistique', status: 'active', startDate: '2020-09-10' },
  { id: 4, name: 'Pierre Durand', email: 'pierre.durand@example.com', pole: 'RH', position: 'Chargé RH', status: 'leave', startDate: '2023-01-05' },
  { id: 5, name: 'Claire Moreau', email: 'claire.moreau@example.com', pole: 'Marketing', position: 'Chef de projet', status: 'active', startDate: '2022-11-20' },
  { id: 6, name: 'Thomas Petit', email: 'thomas.petit@example.com', pole: 'Tech', position: 'DevOps', status: 'active', startDate: '2023-04-01' },
];

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState(initialEmployees);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof initialEmployees[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pole: '',
    position: '',
    status: 'active',
    startDate: '',
  });

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.pole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleOpenForm = (employee?: typeof initialEmployees[0]) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        email: employee.email,
        pole: employee.pole,
        position: employee.position,
        status: employee.status,
        startDate: employee.startDate,
      });
    } else {
      setEditingEmployee(null);
      setFormData({ name: '', email: '', pole: '', position: '', status: 'active', startDate: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (editingEmployee) {
      setEmployees(employees.map(e => 
        e.id === editingEmployee.id 
          ? { ...e, ...formData }
          : e
      ));
      toast.success('Employé modifié avec succès');
    } else {
      const newEmployee = {
        id: Math.max(...employees.map(e => e.id)) + 1,
        ...formData,
      };
      setEmployees([...employees, newEmployee]);
      toast.success('Employé ajouté avec succès');
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: number) => {
    setEmployees(employees.filter(e => e.id !== id));
    toast.success('Employé supprimé');
  };

  const exportColumns = [
    { header: 'Nom', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Pôle', accessor: 'pole' },
    { header: 'Poste', accessor: 'position' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Date d\'arrivée', accessor: 'startDate' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employés</h1>
          <p className="text-muted-foreground">Gestion de l'annuaire des collaborateurs</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            filename="employes"
            title="Liste des employés"
            columns={exportColumns}
            data={filteredEmployees}
          />
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un employé
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, pôle ou poste..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des employés ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Pôle</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d'arrivée</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.pole}</Badge>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status === 'active' ? 'Actif' : 'En congé'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(employee.startDate).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenForm(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = `mailto:${employee.email}`}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Modifiez les informations de l\'employé' : 'Remplissez les informations du nouvel employé'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pole">Pôle</Label>
                <Select value={formData.pole} onValueChange={(v) => setFormData({ ...formData, pole: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Ops">Ops</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="position">Poste</Label>
                <Input id="position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="leave">En congé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Date d'arrivée</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingEmployee ? 'Modifier' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
