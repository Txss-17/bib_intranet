import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Download } from 'lucide-react';

const incidents = [
  { id: 'INC-043', title: 'Problème système paiement', category: 'Finance', severity: 'medium', resolvedAt: '2024-02-17 18:30', resolution: '8h', rootCause: 'Erreur configuration API' },
  { id: 'INC-040', title: 'Rupture stock produit phare', category: 'Supply Chain', severity: 'high', resolvedAt: '2024-02-15 14:00', resolution: '24h', rootCause: 'Retard fournisseur' },
  { id: 'INC-039', title: 'Incident sécurité réseau', category: 'Tech', severity: 'critical', resolvedAt: '2024-02-14 09:45', resolution: '4h', rootCause: 'Tentative intrusion bloquée' },
  { id: 'INC-038', title: 'Erreur facturation client', category: 'Finance', severity: 'low', resolvedAt: '2024-02-13 16:20', resolution: '2h', rootCause: 'Erreur humaine' },
  { id: 'INC-037', title: 'Panne serveur production', category: 'Tech', severity: 'critical', resolvedAt: '2024-02-10 23:15', resolution: '3h', rootCause: 'Défaillance hardware' },
];

export default function IncidentHistory() {
  const [search, setSearch] = useState('');

  const filtered = incidents.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historique des incidents</h1>
          <p className="text-muted-foreground">Incidents résolus et analyses post-mortem</p>
        </div>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exporter</Button>
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
                <TableHead>Résolu le</TableHead>
                <TableHead>Durée résolution</TableHead>
                <TableHead>Cause racine</TableHead>
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
                      incident.severity === 'high' ? 'destructive' :
                      incident.severity === 'medium' ? 'secondary' : 'outline'
                    }>
                      {incident.severity === 'critical' ? 'Critique' :
                       incident.severity === 'high' ? 'Élevé' :
                       incident.severity === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{incident.resolvedAt}</TableCell>
                  <TableCell>{incident.resolution}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{incident.rootCause}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
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
