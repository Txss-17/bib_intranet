import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building, Calendar, FileText, Loader2 } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import SupplierAuditWorkflow from '@/components/supplier/SupplierAuditWorkflow';
import { useSupplierAudits } from '@/hooks/useAudits';
import { SourceBadge, SourceFilter } from '@/components/audit/SourceBadge';
import { measuredAverage } from '@/lib/operationsMetrics';

export default function SupplierAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data: audits = [], isLoading, isError, refetch } = useSupplierAudits(searchTerm || undefined, sourceFilter);
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
    return 'text-destructive';
  };

  if (isLoading) return <div className="space-y-4"><SupplierAuditWorkflow/><div className="flex items-center justify-center h-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></div>;

  const completed = audits.filter(a => a.status === 'completed');
  const { average: avgScore, samples: scoredAudits } = measuredAverage(completed.map(a => a.score));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Fournisseurs</h1>
          <p className="text-muted-foreground">Dossiers transmis depuis Fournisseurs, audit documentaire, contre-audit et historique des contrôles</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons filename="audits-fournisseurs" title="Audits fournisseurs" poleName="Audit" columns={[
            { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
            { header: 'Auditeur', accessor: 'auditor' }, { header: 'Date', accessor: 'date' },
            { header: 'Statut', accessor: 'status' }, { header: 'Score', accessor: 'score' },
            { header: 'Non-conformités', accessor: 'findings' },
          ]} data={audits} />
        </div>
      </div>

      <SupplierAuditWorkflow auditInbox />
      <h2 className="text-xl font-semibold">Historique des audits antérieurs</h2>
      {isError && <div role="alert" className="rounded-md border p-3 text-sm text-destructive">Audits indisponibles. <Button size="sm" variant="outline" onClick={() => void refetch()}>Réessayer</Button></div>}
      {!isError && <p className="text-xs text-muted-foreground">Indicateurs des audits accessibles correspondant aux filtres. {scoredAudits} audit(s) terminé(s) avec score valide ; un score absent ne vaut pas zéro.</p>}
      {!isError && <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Fournisseurs audités</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{completed.length}</div><p className="text-xs text-muted-foreground">Toutes dates (filtres actifs)</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En cours</CardTitle><Calendar className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{audits.filter(a => a.status === 'in_progress').length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Score moyen</CardTitle><FileText className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{avgScore === null ? "—" : `${avgScore.toFixed(1)}%`}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Non-conformités</CardTitle><FileText className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{audits.reduce((s, a) => s + (a.findings || 0), 0)}</div></CardContent></Card>
      </div>}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par fournisseur ou catégorie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
      </div>

      {!isError && <Card>
        <CardHeader><CardTitle>Audits fournisseurs ({audits.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fournisseur</TableHead><TableHead>Source</TableHead><TableHead>Catégorie</TableHead><TableHead>Auditeur</TableHead>
              <TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Score</TableHead>
              <TableHead>NC détectées</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{audit.supplier}</div></TableCell>
                  <TableCell><SourceBadge source={audit.app_origin} /></TableCell>
                  <TableCell><Badge variant="outline">{audit.category}</Badge></TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>{audit.score !== null ? <span className={`font-bold ${getScoreColor(audit.score)}`}>{audit.score}%</span> : '-'}</TableCell>
                  <TableCell>{audit.findings !== null ? audit.findings : '-'}</TableCell>

                </TableRow>
              ))}
              {audits.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun audit trouvé</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}

    </div>
  );
}
