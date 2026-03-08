import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Settings, Calendar, FileText, Edit, Loader2 } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import AuditForm from '@/components/forms/AuditForm';
import { useOpsAudits, useCreateOpsAudit, useUpdateOpsAudit } from '@/hooks/useAudits';

export default function OpsAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);

  const { data: audits = [], isLoading } = useOpsAudits(searchTerm || undefined);
  const createAudit = useCreateOpsAudit();
  const updateAudit = useUpdateOpsAudit();

  const handleSubmit = (data: any) => {
    if (editingAudit) {
      updateAudit.mutate({ id: editingAudit.id, ...data }, { onSuccess: () => toast.success('Audit modifié') });
    } else {
      createAudit.mutate(data, { onSuccess: () => toast.success('Audit planifié') });
    }
    setEditingAudit(null);
  };

  const handleEdit = (audit: any) => { setEditingAudit(audit); setFormOpen(true); };
  const handleNew = () => { setEditingAudit(null); setFormOpen(true); };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500">Terminé</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'scheduled': return <Badge variant="secondary">Planifié</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const completed = audits.filter(a => a.status === 'completed');
  const avgScore = completed.length ? Math.round(completed.reduce((s, a) => s + (a.score || 0), 0) / completed.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Ops</h1>
          <p className="text-muted-foreground">Audits des processus opérationnels</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons filename="audits-ops" title="Audits opérationnels" columns={[
            { header: 'Processus', accessor: 'process' }, { header: 'Périmètre', accessor: 'scope' },
            { header: 'Auditeur', accessor: 'auditor' }, { header: 'Date', accessor: 'date' },
            { header: 'Statut', accessor: 'status' }, { header: 'Score', accessor: 'score' },
            { header: 'Recommandations', accessor: 'recommendations' },
          ]} data={audits} />
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Planifier un audit</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Processus audités</CardTitle><Settings className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{completed.length}</div><p className="text-xs text-muted-foreground">Ce trimestre</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En cours</CardTitle><Calendar className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{audits.filter(a => a.status === 'in_progress').length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Score moyen</CardTitle><FileText className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{avgScore}%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Recommandations</CardTitle><FileText className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{audits.reduce((s, a) => s + (a.recommendations || 0), 0)}</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par processus ou périmètre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Audits opérationnels ({audits.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Processus</TableHead><TableHead>Périmètre</TableHead><TableHead>Auditeur</TableHead>
              <TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Score</TableHead>
              <TableHead>Recommandations</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Settings className="h-4 w-4 text-muted-foreground" />{audit.process}</div></TableCell>
                  <TableCell><Badge variant="outline">{audit.scope}</Badge></TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>{audit.score !== null ? <span className={`font-bold ${(audit.score || 0) >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{audit.score}%</span> : '-'}</TableCell>
                  <TableCell>{audit.recommendations !== null ? audit.recommendations : '-'}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => handleEdit(audit)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {audits.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun audit trouvé</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AuditForm open={formOpen} onOpenChange={setFormOpen} audit={editingAudit} onSubmit={handleSubmit} type="ops" />
    </div>
  );
}
