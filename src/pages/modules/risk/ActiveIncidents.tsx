import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, Loader2 } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import IncidentForm from '@/components/forms/IncidentForm';
import { useRiskIncidents, useCreateRiskIncident, useUpdateRiskIncident } from '@/hooks/useRiskIncidents';

export default function ActiveIncidents() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(undefined);

  const { data: incidents = [], isLoading } = useRiskIncidents(search || undefined);
  const createIncident = useCreateRiskIncident();
  const updateIncident = useUpdateRiskIncident();

  const handleSubmit = (data: any) => {
    if (editingIncident) {
      updateIncident.mutate({ id: editingIncident.id, ...data }, { onSuccess: () => toast.success('Incident mis à jour') });
    } else {
      const num = `INC-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
      createIncident.mutate({ incident_number: num, opened_at: new Date().toISOString(), resolved_at: null, ...data }, { onSuccess: () => toast.success('Incident déclaré') });
    }
    setEditingIncident(undefined);
  };

  const handleEdit = (i: any) => { setEditingIncident(i); setFormOpen(true); };
  const handleNew = () => { setEditingIncident(undefined); setFormOpen(true); };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Incidents actifs</h1><p className="text-muted-foreground">Incidents en cours de traitement</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="incidents-actifs" title="Incidents actifs" columns={[
            { header: 'N°', accessor: 'incident_number' }, { header: 'Titre', accessor: 'title' },
            { header: 'Catégorie', accessor: 'category' }, { header: 'Sévérité', accessor: 'severity' },
            { header: 'Assigné', accessor: 'assignee' }, { header: 'Statut', accessor: 'status' },
          ]} data={incidents} />
          <Button onClick={handleNew} variant="destructive"><Plus className="mr-2 h-4 w-4" />Déclarer incident</Button>
        </div>
      </div>
      <Card><CardHeader><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Rechercher un incident..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead><TableHead>Sévérité</TableHead><TableHead>Assigné à</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{incidents.map((i) => (
            <TableRow key={i.id}><TableCell className="font-mono">{i.incident_number}</TableCell><TableCell className="font-medium">{i.title}</TableCell><TableCell>{i.category}</TableCell>
              <TableCell><Badge variant={i.severity === 'critical' || i.severity === 'high' ? 'destructive' : 'secondary'}>{i.severity === 'critical' ? 'Critique' : i.severity === 'high' ? 'Élevé' : 'Moyen'}</Badge></TableCell>
              <TableCell>{i.assignee || '-'}</TableCell>
              <TableCell><Badge variant="outline">{i.status === 'investigating' ? 'Investigation' : i.status === 'mitigating' ? 'Mitigation' : 'Surveillance'}</Badge></TableCell>
              <TableCell><div className="flex gap-2"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(i)}><Edit className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}{incidents.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucun incident trouvé</TableCell></TableRow>}</TableBody></Table>
        </CardContent></Card>
      <IncidentForm open={formOpen} onOpenChange={setFormOpen} incident={editingIncident} onSubmit={handleSubmit} />
    </div>
  );
}
