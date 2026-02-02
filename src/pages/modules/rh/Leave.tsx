import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Calendar, Check, X } from 'lucide-react';

const leaveRequests = [
  { id: 1, employee: 'Marie Dupont', type: 'CP', startDate: '2025-02-10', endDate: '2025-02-15', days: 5, status: 'pending', reason: 'Vacances famille' },
  { id: 2, employee: 'Jean Martin', type: 'RTT', startDate: '2025-02-12', endDate: '2025-02-14', days: 2, status: 'pending', reason: 'Personnel' },
  { id: 3, employee: 'Sophie Bernard', type: 'CP', startDate: '2025-02-20', endDate: '2025-02-28', days: 7, status: 'approved', reason: 'Voyage' },
  { id: 4, employee: 'Pierre Durand', type: 'Maladie', startDate: '2025-02-01', endDate: '2025-02-03', days: 2, status: 'approved', reason: 'Arrêt médical' },
  { id: 5, employee: 'Claire Moreau', type: 'CP', startDate: '2025-03-01', endDate: '2025-03-07', days: 5, status: 'pending', reason: 'Congés scolaires' },
  { id: 6, employee: 'Thomas Petit', type: 'RTT', startDate: '2025-02-08', endDate: '2025-02-08', days: 1, status: 'rejected', reason: 'RDV personnel' },
];

export default function Leave() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = leaveRequests.filter(r =>
    r.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/10 text-green-500">Approuvé</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/10 text-yellow-500">En attente</Badge>;
      case 'rejected': return <Badge variant="destructive">Refusé</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CP': return <Badge variant="outline">CP</Badge>;
      case 'RTT': return <Badge variant="outline" className="border-blue-500 text-blue-500">RTT</Badge>;
      case 'Maladie': return <Badge variant="outline" className="border-red-500 text-red-500">Maladie</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Congés</h1>
          <p className="text-muted-foreground">Gestion des demandes de congés</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {leaveRequests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jours posés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total approuvé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusés</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {leaveRequests.filter(r => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par employé ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de congés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Jours</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.employee}</TableCell>
                  <TableCell>{getTypeBadge(request.type)}</TableCell>
                  <TableCell>
                    {new Date(request.startDate).toLocaleDateString('fr-FR')} - {new Date(request.endDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{request.days}j</TableCell>
                  <TableCell className="max-w-[150px] truncate">{request.reason}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === 'pending' ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-green-500">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm">Détails</Button>
                    )}
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
