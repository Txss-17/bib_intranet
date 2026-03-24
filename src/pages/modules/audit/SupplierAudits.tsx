import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Building, Calendar, FileText, Edit, Loader2, Send } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import AuditForm from '@/components/forms/AuditForm';
import { useSupplierAudits, useCreateSupplierAudit, useUpdateSupplierAudit } from '@/hooks/useAudits';
import { useAuditSupplierLiaison } from '@/hooks/useAuditSupplierLiaison';

export default function SupplierAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);

  const { data: audits = [], isLoading } = useSupplierAudits(searchTerm || undefined);
  const createAudit = useCreateSupplierAudit();
  const updateAudit = useUpdateSupplierAudit();
  const { syncSupplierAfterAudit } = useAuditSupplierLiaison();

  const handleSubmit = (data: any) => {
    if (editingAudit) {
      updateAudit.mutate({ id: editingAudit.id, ...data }, {
        onSuccess: (updatedAudit: any) => {
          toast.success('Audit modifié');
          // Auto-sync supplier if audit is now completed with a score
          if (data.status === 'completed' && data.score != null) {
            syncSupplierAfterAudit(data.supplier || editingAudit.supplier, data.score);
          }
        },
      });
    } else {
      createAudit.mutate(data, {
        onSuccess: () => {
          toast.success('Audit planifié');
          if (data.status === 'completed' && data.score != null) {
            syncSupplierAfterAudit(data.supplier, data.score);
          }
        },
      });
    }
    setEditingAudit(null);
  };

  const handleCompleteAudit = (audit: any) => {
    if (audit.score != null) {
      updateAudit.mutate({ id: audit.id, status: 'completed' }, {
        onSuccess: () => {
          toast.success('Audit marqué comme terminé');
          syncSupplierAfterAudit(audit.supplier, audit.score);
        },
      });
    } else {
      toast.error('Impossible de terminer un audit sans score');
    }
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return '';
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-destructive';
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const completed = audits.filter(a => a.status === 'completed');
  const avgScore = completed.length ? Math.round(completed.reduce((s, a) => s + (a.score || 0), 0) / completed.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Fournisseurs</h1>
          <p className="text-muted-foreground">Évaluation et conformité — liaison automatique avec le pôle fournisseur</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons filename="audits-fournisseurs" title="Audits fournisseurs" columns={[
            { header: 'Fournisseur', accessor: 'supplier' }, { header: 'Catégorie', accessor: 'category' },
            { header: 'Auditeur', accessor: 'auditor' }, { header: 'Date', accessor: 'date' },
            { header: 'Statut', accessor: 'status' }, { header: 'Score', accessor: 'score' },
            { header: 'Non-conformités', accessor: 'findings' },
          ]} data={audits} />
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Planifier un audit</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Fournisseurs audités</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{completed.length}</div><p className="text-xs text-muted-foreground">Ce trimestre</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">En cours</CardTitle><Calendar className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-500">{audits.filter(a => a.status === 'in_progress').length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Score moyen</CardTitle><FileText className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-500">{avgScore}%</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Non-conformités</CardTitle><FileText className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{audits.reduce((s, a) => s + (a.findings || 0), 0)}</div></CardContent></Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par fournisseur ou catégorie..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Audits fournisseurs ({audits.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Fournisseur</TableHead><TableHead>Catégorie</TableHead><TableHead>Auditeur</TableHead>
              <TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead>Score</TableHead>
              <TableHead>NC détectées</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{audit.supplier}</div></TableCell>
                  <TableCell><Badge variant="outline">{audit.category}</Badge></TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(audit.status)}</TableCell>
                  <TableCell>{audit.score !== null ? <span className={`font-bold ${getScoreColor(audit.score)}`}>{audit.score}%</span> : '-'}</TableCell>
                  <TableCell>{audit.findings !== null ? audit.findings : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(audit)}><Edit className="h-4 w-4" /></Button>
                      {audit.status !== 'completed' && audit.score !== null && (
                        <Button variant="ghost" size="sm" onClick={() => handleCompleteAudit(audit)} title="Terminer et synchroniser fournisseur">
                          <Send className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {audits.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun audit trouvé</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AuditForm open={formOpen} onOpenChange={setFormOpen} audit={editingAudit} onSubmit={handleSubmit} type="supplier" />
    </div>
  );
}
