import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MapPin, Calendar, FileText, Loader2, Eye, RefreshCw } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useFieldAuditRows } from '@/hooks/useFieldAuditRows';
import { auditMetrics, AUDIT_TYPES } from '@/lib/operationsMetrics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SourceBadge, SourceFilter } from '@/components/audit/SourceBadge';

const auditTypeLabels = AUDIT_TYPES;

const auditTypeColors: Record<string, string> = {
  initial: 'bg-blue-500/10 text-blue-500',
  continuous: 'bg-orange-500/10 text-orange-600',
  periodic: 'bg-purple-500/10 text-purple-600',
};

export default function FieldAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const { data: rows = [], isLoading, isError, refetch } = useFieldAuditRows();
  const { can } = usePermissions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find(row => row.id === selectedId);
  const fieldAudits = rows.map(row => ({ ...row, location: row.target_name || 'Cible non renseignée', type: row.target_type, auditType: row.audit_type, scheduledDate: row.scheduled_date || '', app_origin: row.app_origin || 'connect' }));

  const filteredAudits = fieldAudits.filter(a => {
    const matchesSearch = a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || a.auditType === typeFilter;
    const matchesSource = sourceFilter === 'all' || a.app_origin === sourceFilter;
    return matchesSearch && matchesType && matchesSource;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500">Terminé</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'scheduled': return <Badge variant="secondary">Planifié</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const metrics = auditMetrics(rows);
  const { scheduled: scheduledCount, inProgress: inProgressCount, completed: completedCount } = metrics;
  const avgScore = metrics.average == null ? '—' : `${metrics.average.toFixed(1)}%`;

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Terrain</h1>
          <p className="text-muted-foreground">Audits des sites et points de vente — résultats et suivi des missions</p>
        </div>
        <div className="flex gap-2">
          {can('audit.missions', 'read') && can('audit.missions', 'create') && <Button asChild><Link to="/pole/audit/missions?new=1"><Plus className="mr-2 h-4 w-4" />Planifier un audit</Link></Button>}
          <ExportButtons
            filename="audits-terrain"
            title="Audits terrain"
            columns={[
              { header: 'Lieu', accessor: 'location' },
              { header: 'Type', accessor: 'type' },
              { header: 'Niveau', accessor: 'auditType' },
              { header: 'Date', accessor: 'scheduledDate' },
              { header: 'Statut', accessor: 'status' },
              { header: 'Score', accessor: 'score' },
            ]}
            data={filteredAudits}
          />
        </div>
      </div>

      {isError && <p role="alert">Audits indisponibles. <Button variant="link" onClick={() => void refetch()}>Réessayer</Button></p>}
      <p className="text-xs text-muted-foreground">Indicateurs de tous les audits accessibles, indépendamment des filtres ci-dessous. {metrics.samples} score(s) renseigné(s) sur les audits terminés.</p>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{isError ? '—' : scheduledCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{isError ? '—' : inProgressCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{isError ? '—' : completedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgScore}</div></CardContent>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Niveau d'audit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les niveaux</SelectItem>
            {Object.entries(AUDIT_TYPES).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <SourceFilter value={sourceFilter} onChange={setSourceFilter} />
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
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun audit trouvé</TableCell></TableRow>
              ) : (
                filteredAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {audit.location}
                      </div>
                    </TableCell>
                    <TableCell><SourceBadge source={audit.app_origin} /></TableCell>
                    <TableCell><Badge variant="outline">{audit.type}</Badge></TableCell>
                    <TableCell>
                      <Badge className={auditTypeColors[audit.auditType] || 'bg-muted text-muted-foreground'}>
                        {auditTypeLabels[audit.auditType] || audit.auditType}
                      </Badge>
                    </TableCell>
                    <TableCell>{audit.scheduledDate ? new Date(audit.scheduledDate).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>
                      {audit.score !== null ? (
                        <span className={audit.score >= 80 ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                          {audit.score}%
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {can('audit.missions', 'read') ? <Button variant="ghost" size="sm" asChild><Link to={`/pole/audit/missions?mission=${audit.id}`}>Voir la mission</Link></Button> : <Button variant="ghost" size="sm" onClick={() => setSelectedId(audit.id)}>Voir</Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={!!selectedId} onOpenChange={open => !open && setSelectedId(null)}><SheetContent className="overflow-y-auto">{selected && <><SheetHeader><SheetTitle>{selected.target_name || 'Audit terrain'}</SheetTitle></SheetHeader><div className="mt-5 space-y-4 text-sm"><p>{AUDIT_TYPES[selected.audit_type] || selected.audit_type} · {selected.status}</p><p>Date prévue : {selected.scheduled_date || 'Non renseignée'}</p><p>Score : {selected.score == null ? 'Non renseigné' : `${selected.score}/100`}</p><div><h2 className="font-medium">Constats</h2><p className="whitespace-pre-wrap">{selected.findings || 'Non renseignés'}</p></div><div><h2 className="font-medium">Recommandations</h2><p className="whitespace-pre-wrap">{selected.recommendations || 'Non renseignées'}</p></div>{selected.decision_reason && <p className="whitespace-pre-wrap">Décision : {selected.decision_reason}</p>}{selected.corrective_action && <p className="whitespace-pre-wrap">Action corrective : {selected.corrective_action}</p>}</div></>}</SheetContent></Sheet>
    </div>
  );
}
