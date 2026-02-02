import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MapPin, Calendar, FileText } from 'lucide-react';

const fieldAudits = [
  { id: 1, location: 'Entrepôt Lyon', type: 'Stockage', auditor: 'Paul Lefevre', scheduledDate: '2025-02-05', status: 'scheduled', score: null },
  { id: 2, location: 'Entrepôt Paris', type: 'Sécurité', auditor: 'Marie Dubois', scheduledDate: '2025-02-02', status: 'in_progress', score: null },
  { id: 3, location: 'Point relais Marseille', type: 'Qualité', auditor: 'Jean Martin', scheduledDate: '2025-01-28', status: 'completed', score: 85 },
  { id: 4, location: 'Entrepôt Bordeaux', type: 'Hygiène', auditor: 'Sophie Bernard', scheduledDate: '2025-01-20', status: 'completed', score: 92 },
  { id: 5, location: 'Point relais Lille', type: 'Stockage', auditor: 'Paul Lefevre', scheduledDate: '2025-02-10', status: 'scheduled', score: null },
];

export default function FieldAudits() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAudits = fieldAudits.filter(a =>
    a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500">Terminé</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'scheduled': return <Badge variant="secondary">Planifié</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Terrain</h1>
          <p className="text-muted-foreground">Audits des sites et points de vente</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Planifier un audit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fieldAudits.filter(a => a.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {fieldAudits.filter(a => a.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {fieldAudits.filter(a => a.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88.5%</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par lieu ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des audits terrain</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lieu</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Auditeur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {audit.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{audit.type}</Badge>
                  </TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.scheduledDate).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>
                    {audit.score !== null ? (
                      <span className={audit.score >= 80 ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                        {audit.score}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Voir</Button>
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
