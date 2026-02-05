import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Settings, Calendar, FileText } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';

const opsAudits = [
  { id: 1, process: 'Processus livraison', scope: 'National', auditor: 'Marie Dubois', date: '2025-01-28', status: 'completed', score: 78, recommendations: 4 },
  { id: 2, process: 'Gestion des retours', scope: 'Entrepôt Paris', auditor: 'Jean Martin', date: '2025-02-05', status: 'scheduled', score: null, recommendations: null },
  { id: 3, process: 'Préparation commandes', scope: 'Tous sites', auditor: 'Paul Lefevre', date: '2025-01-20', status: 'completed', score: 85, recommendations: 2 },
  { id: 4, process: 'Contrôle qualité réception', scope: 'Entrepôt Lyon', auditor: 'Sophie Bernard', date: '2025-02-02', status: 'in_progress', score: null, recommendations: null },
  { id: 5, process: 'Gestion stocks', scope: 'National', auditor: 'Marie Dubois', date: '2025-01-15', status: 'completed', score: 91, recommendations: 1 },
];

export default function OpsAudits() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAudits = opsAudits.filter(a =>
    a.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.scope.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Audits Ops</h1>
          <p className="text-muted-foreground">Audits des processus opérationnels</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Planifier un audit
        </Button>
        <ExportButtons
          filename="audits-ops"
          title="Audits opérationnels"
          columns={[
            { header: 'Processus', accessor: 'process' },
            { header: 'Périmètre', accessor: 'scope' },
            { header: 'Auditeur', accessor: 'auditor' },
            { header: 'Date', accessor: 'date' },
            { header: 'Statut', accessor: 'status' },
            { header: 'Score', accessor: 'score' },
            { header: 'Recommandations', accessor: 'recommendations' },
          ]}
          data={filteredAudits}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processus audités</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opsAudits.filter(a => a.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Ce trimestre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {opsAudits.filter(a => a.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">85%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommandations</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">7</div>
            <p className="text-xs text-muted-foreground">En cours d'implémentation</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par processus ou périmètre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audits opérationnels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processus</TableHead>
                <TableHead>Périmètre</TableHead>
                <TableHead>Auditeur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recommandations</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      {audit.process}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{audit.scope}</Badge>
                  </TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>
                    {audit.score !== null ? (
                      <span className={`font-bold ${audit.score >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {audit.score}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {audit.recommendations !== null ? audit.recommendations : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Rapport</Button>
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
