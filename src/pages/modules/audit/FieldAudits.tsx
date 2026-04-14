import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MapPin, Calendar, FileText, Loader2, Eye, RefreshCw } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useFieldAudits() {
  return useQuery({
    queryKey: ['field_audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_audits')
        .select('*')
        .order('scheduled_date', { ascending: false });
      if (error) throw error;
      return data.map(a => ({
        id: a.id,
        location: a.target_name || 'N/A',
        type: a.target_type,
        auditType: a.audit_type,
        auditor: a.auditor_id || 'Non assigné',
        scheduledDate: a.scheduled_date || '',
        status: a.status || 'scheduled',
        score: a.score,
      }));
    },
  });
}

const auditTypeLabels: Record<string, string> = {
  initial: 'Initial',
  continuous: 'Continu',
  periodic: 'Périodique',
};

const auditTypeColors: Record<string, string> = {
  initial: 'bg-blue-500/10 text-blue-500',
  continuous: 'bg-orange-500/10 text-orange-600',
  periodic: 'bg-purple-500/10 text-purple-600',
};

export default function FieldAudits() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { data: fieldAudits = [], isLoading } = useFieldAudits();

  const filteredAudits = fieldAudits.filter(a => {
    const matchesSearch = a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || a.auditType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-500">Terminé</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500/10 text-blue-500">En cours</Badge>;
      case 'scheduled': return <Badge variant="secondary">Planifié</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const scheduledCount = fieldAudits.filter(a => a.status === 'scheduled').length;
  const inProgressCount = fieldAudits.filter(a => a.status === 'in_progress').length;
  const completedCount = fieldAudits.filter(a => a.status === 'completed').length;
  const completedWithScore = fieldAudits.filter(a => a.score !== null);
  const avgScore = completedWithScore.length > 0
    ? (completedWithScore.reduce((s, a) => s + (a.score || 0), 0) / completedWithScore.length).toFixed(1)
    : '—';

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audits Terrain</h1>
          <p className="text-muted-foreground">Audits des sites et points de vente — 3 niveaux</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Planifier un audit
          </Button>
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{scheduledCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-500">{inProgressCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{completedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgScore}%</div></CardContent>
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
            <SelectItem value="initial"><Eye className="h-3 w-3 inline mr-1" />Initial</SelectItem>
            <SelectItem value="continuous"><RefreshCw className="h-3 w-3 inline mr-1" />Continu</SelectItem>
            <SelectItem value="periodic"><Calendar className="h-3 w-3 inline mr-1" />Périodique</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead>Niveau</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun audit trouvé</TableCell></TableRow>
              ) : (
                filteredAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {audit.location}
                      </div>
                    </TableCell>
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
                      <Button variant="ghost" size="sm">Voir</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
