import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, FileText, Download, Eye, Check, Clock } from 'lucide-react';

const reports = [
  { id: 1, title: 'Rapport audit FreshFarm Bio', type: 'Fournisseur', author: 'Paul Lefevre', date: '2025-02-01', status: 'pending_validation', pages: 12 },
  { id: 2, title: 'Rapport audit Entrepôt Paris', type: 'Terrain', author: 'Marie Dubois', date: '2025-01-28', status: 'validated', pages: 18 },
  { id: 3, title: 'Rapport processus livraison', type: 'Ops', author: 'Marie Dubois', date: '2025-01-28', status: 'pending_validation', pages: 15 },
  { id: 4, title: 'Rapport audit NaturaCosm', type: 'Fournisseur', author: 'Jean Martin', date: '2025-01-25', status: 'validated', pages: 10 },
  { id: 5, title: 'Rapport gestion stocks', type: 'Ops', author: 'Marie Dubois', date: '2025-01-15', status: 'validated', pages: 8 },
  { id: 6, title: 'Rapport trimestriel Q4 2024', type: 'Consolidé', author: 'Direction Audit', date: '2025-01-10', status: 'validated', pages: 45 },
];

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated': return <Badge className="bg-green-500/10 text-green-500">Validé</Badge>;
      case 'pending_validation': return <Badge className="bg-yellow-500/10 text-yellow-500">En attente</Badge>;
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Fournisseur': return <Badge variant="outline" className="border-blue-500 text-blue-500">{type}</Badge>;
      case 'Terrain': return <Badge variant="outline" className="border-green-500 text-green-500">{type}</Badge>;
      case 'Ops': return <Badge variant="outline" className="border-purple-500 text-purple-500">{type}</Badge>;
      case 'Consolidé': return <Badge variant="outline" className="border-orange-500 text-orange-500">{type}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pendingCount = reports.filter(r => r.status === 'pending_validation').length;
  const validatedCount = reports.filter(r => r.status === 'validated').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rapports d'Audit</h1>
        <p className="text-muted-foreground">Bibliothèque des rapports d'audit</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total rapports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">À valider</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validés</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{validatedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Nouveaux rapports</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un rapport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bibliothèque des rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {report.title}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(report.type)}</TableCell>
                  <TableCell>{report.author}</TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{report.pages}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {report.status === 'pending_validation' && (
                        <Button variant="ghost" size="sm" className="text-green-500">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
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
