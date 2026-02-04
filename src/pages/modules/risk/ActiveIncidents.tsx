import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import IncidentForm from '@/components/forms/IncidentForm';

const initialIncidents = [
  { id: 'INC-045', title: 'Retard livraison lot #B789', category: 'Logistique', severity: 'high', assignee: 'Pierre M.', openedAt: '2024-02-18 10:30', status: 'investigating' },
  { id: 'INC-044', title: 'Alerte qualité produit SKU-4521', category: 'Qualité', severity: 'critical', assignee: 'Marie D.', openedAt: '2024-02-18 07:15', status: 'mitigating' },
  { id: 'INC-046', title: 'Problème connexion API partenaire', category: 'Tech', severity: 'medium', assignee: 'Lucas P.', openedAt: '2024-02-18 14:00', status: 'investigating' },
  { id: 'INC-042', title: 'Fournisseur Delta non conforme', category: 'Fournisseur', severity: 'high', assignee: 'Sophie B.', openedAt: '2024-02-17 16:45', status: 'monitoring' },
  { id: 'INC-041', title: 'Réclamation client prioritaire', category: 'Client', severity: 'medium', assignee: 'Emma L.', openedAt: '2024-02-17 11:20', status: 'investigating' },
];

export default function ActiveIncidents() {
  const [search, setSearch] = useState('');
  const [incidents, setIncidents] = useState(initialIncidents);
  const [formOpen, setFormOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<typeof initialIncidents[0] | undefined>();

  const filtered = incidents.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (data: any) => {
    if (editingIncident) {
      setIncidents(incidents.map(i => 
        i.id === editingIncident.id ? { ...i, ...data } : i
      ));
      toast.success('Incident mis à jour');
    } else {
      const newIncident = {
        id: `INC-${String(47 + incidents.length).padStart(3, '0')}`,
        openedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        ...data
      };
      setIncidents([newIncident, ...incidents]);
      toast.success('Incident déclaré avec succès');
    }
    setEditingIncident(undefined);
  };

  const handleEdit = (incident: typeof initialIncidents[0]) => {
    setEditingIncident(incident);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingIncident(undefined);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents actifs</h1>
          <p className="text-muted-foreground">Incidents en cours de traitement</p>
        </div>
        <Button onClick={handleNew} variant="destructive"><Plus className="mr-2 h-4 w-4" /> Déclarer incident</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un incident..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Sévérité</TableHead>
                <TableHead>Assigné à</TableHead>
                <TableHead>Ouvert le</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono">{incident.id}</TableCell>
                  <TableCell className="font-medium">{incident.title}</TableCell>
                  <TableCell>{incident.category}</TableCell>
                  <TableCell>
                    <Badge variant={
                      incident.severity === 'critical' ? 'destructive' :
                      incident.severity === 'high' ? 'destructive' : 'secondary'
                    }>
                      {incident.severity === 'critical' ? 'Critique' :
                       incident.severity === 'high' ? 'Élevé' : 'Moyen'}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.assignee}</TableCell>
                  <TableCell className="text-sm">{incident.openedAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {incident.status === 'investigating' ? 'Investigation' :
                       incident.status === 'mitigating' ? 'Mitigation' : 'Surveillance'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(incident)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IncidentForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        incident={editingIncident}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
