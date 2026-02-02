import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Mail, Phone } from 'lucide-react';

const employees = [
  { id: 1, name: 'Marie Dupont', email: 'marie.dupont@example.com', pole: 'Finance', position: 'Manager', status: 'active', startDate: '2022-03-15' },
  { id: 2, name: 'Jean Martin', email: 'jean.martin@example.com', pole: 'Tech', position: 'Développeur Senior', status: 'active', startDate: '2021-06-01' },
  { id: 3, name: 'Sophie Bernard', email: 'sophie.bernard@example.com', pole: 'Ops', position: 'Responsable Logistique', status: 'active', startDate: '2020-09-10' },
  { id: 4, name: 'Pierre Durand', email: 'pierre.durand@example.com', pole: 'RH', position: 'Chargé RH', status: 'leave', startDate: '2023-01-05' },
  { id: 5, name: 'Claire Moreau', email: 'claire.moreau@example.com', pole: 'Marketing', position: 'Chef de projet', status: 'active', startDate: '2022-11-20' },
  { id: 6, name: 'Thomas Petit', email: 'thomas.petit@example.com', pole: 'Tech', position: 'DevOps', status: 'active', startDate: '2023-04-01' },
];

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.pole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employés</h1>
          <p className="text-muted-foreground">Gestion de l'annuaire des collaborateurs</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
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
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
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
}
