import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Building, Calendar, FileText } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';

const supplierAudits = [
  { id: 1, supplier: 'FreshFarm Bio', category: 'Produits frais', auditor: 'Paul Lefevre', date: '2025-02-01', status: 'completed', score: 92, findings: 2 },
  { id: 2, supplier: 'BioMarket France', category: 'Épicerie', auditor: 'Marie Dubois', date: '2025-02-08', status: 'scheduled', score: null, findings: null },
  { id: 3, supplier: 'NaturaCosm', category: 'Cosmétiques', auditor: 'Jean Martin', date: '2025-01-25', status: 'completed', score: 78, findings: 5 },
  { id: 4, supplier: 'EcoPackaging', category: 'Emballages', auditor: 'Sophie Bernard', date: '2025-02-03', status: 'in_progress', score: null, findings: null },
  { id: 5, supplier: 'GreenLogistics', category: 'Transport', auditor: 'Paul Lefevre', date: '2025-01-18', status: 'completed', score: 88, findings: 3 },
];

export default function SupplierAudits() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAudits = supplierAudits.filter(a =>
    a.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500">Terminé</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'scheduled': return <Badge variant="secondary">Planifié</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return '';
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Fournisseurs</h1>
          <p className="text-muted-foreground">Évaluation et conformité des fournisseurs</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Planifier un audit
        </Button>
        <ExportButtons
          filename="audits-fournisseurs"
          title="Audits fournisseurs"
          columns={[
            { header: 'Fournisseur', accessor: 'supplier' },
            { header: 'Catégorie', accessor: 'category' },
            { header: 'Auditeur', accessor: 'auditor' },
            { header: 'Date', accessor: 'date' },
            { header: 'Statut', accessor: 'status' },
            { header: 'Score', accessor: 'score' },
            { header: 'Non-conformités', accessor: 'findings' },
          ]}
          data={filteredAudits}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs audités</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplierAudits.filter(a => a.status === 'completed').length}
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
              {supplierAudits.filter(a => a.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">86%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">10</div>
            <p className="text-xs text-muted-foreground">Total détectées</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par fournisseur ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audits fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Auditeur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>NC détectées</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {audit.supplier}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{audit.category}</Badge>
                  </TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>
                    {audit.score !== null ? (
                      <span className={`font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {audit.findings !== null ? audit.findings : '-'}
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
