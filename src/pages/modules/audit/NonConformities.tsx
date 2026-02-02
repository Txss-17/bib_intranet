import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';

const nonConformities = [
  { id: 1, title: 'Documentation incomplète', source: 'Audit FreshFarm', severity: 'minor', status: 'open', assignee: 'Jean Martin', dueDate: '2025-02-15' },
  { id: 2, title: 'Température stockage hors normes', source: 'Audit Entrepôt Paris', severity: 'major', status: 'in_progress', assignee: 'Sophie Bernard', dueDate: '2025-02-10' },
  { id: 3, title: 'Traçabilité manquante lot #2547', source: 'Audit Ops', severity: 'major', status: 'resolved', assignee: 'Marie Dubois', dueDate: '2025-01-30' },
  { id: 4, title: 'Formation sécurité expirée', source: 'Audit RH', severity: 'minor', status: 'open', assignee: 'Pierre Durand', dueDate: '2025-02-20' },
  { id: 5, title: 'Étiquetage non conforme', source: 'Audit NaturaCosm', severity: 'major', status: 'in_progress', assignee: 'Paul Lefevre', dueDate: '2025-02-08' },
  { id: 6, title: 'Procédure non documentée', source: 'Audit Ops', severity: 'minor', status: 'resolved', assignee: 'Marie Dubois', dueDate: '2025-01-25' },
];

export default function NonConformities() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNCs = nonConformities.filter(nc =>
    nc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nc.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge className="bg-green-500/10 text-green-500">Résolu</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'open': return <Badge variant="destructive">Ouvert</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'major': return <Badge variant="destructive">Majeure</Badge>;
      case 'minor': return <Badge variant="secondary">Mineure</Badge>;
      case 'critical': return <Badge className="bg-red-600 text-white">Critique</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const openCount = nonConformities.filter(nc => nc.status === 'open').length;
  const inProgressCount = nonConformities.filter(nc => nc.status === 'in_progress').length;
  const resolvedCount = nonConformities.filter(nc => nc.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Non-conformités</h1>
          <p className="text-muted-foreground">Suivi et résolution des non-conformités</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Déclarer une NC
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ouvertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{openCount}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedCount}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8j</div>
            <p className="text-xs text-muted-foreground">Résolution</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une NC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des non-conformités</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNCs.map((nc) => (
                <TableRow key={nc.id}>
                  <TableCell className="font-medium">{nc.title}</TableCell>
                  <TableCell>{nc.source}</TableCell>
                  <TableCell>{getSeverityBadge(nc.severity)}</TableCell>
                  <TableCell>{getStatusBadge(nc.status)}</TableCell>
                  <TableCell>{nc.assignee}</TableCell>
                  <TableCell>
                    <span className={new Date(nc.dueDate) < new Date() && nc.status !== 'resolved' ? 'text-red-500' : ''}>
                      {new Date(nc.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Détails</Button>
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
