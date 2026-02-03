import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit } from 'lucide-react';

const policies = [
  { id: 'POL-001', name: 'Politique RGPD', category: 'Data Privacy', version: '3.2', lastUpdate: '2024-01-15', status: 'active', owner: 'DPO' },
  { id: 'POL-002', name: 'Code de conduite', category: 'Ethics', version: '2.0', lastUpdate: '2023-11-01', status: 'active', owner: 'RH' },
  { id: 'POL-003', name: 'Politique anti-corruption', category: 'Compliance', version: '1.5', lastUpdate: '2024-02-20', status: 'active', owner: 'Legal' },
  { id: 'POL-004', name: 'Politique RSE', category: 'RSE', version: '2.1', lastUpdate: '2024-01-10', status: 'active', owner: 'RSE' },
  { id: 'POL-005', name: 'Politique de sécurité IT', category: 'Security', version: '4.0', lastUpdate: '2024-03-01', status: 'review', owner: 'Tech' },
];

export default function Policies() {
  const [search, setSearch] = useState('');

  const filtered = policies.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Politiques</h1>
          <p className="text-muted-foreground">Gestion des politiques et procédures internes</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouvelle politique</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une politique..."
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
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Dernière MAJ</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-mono">{policy.id}</TableCell>
                  <TableCell className="font-medium">{policy.name}</TableCell>
                  <TableCell>{policy.category}</TableCell>
                  <TableCell>v{policy.version}</TableCell>
                  <TableCell>{policy.lastUpdate}</TableCell>
                  <TableCell>{policy.owner}</TableCell>
                  <TableCell>
                    <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                      {policy.status === 'active' ? 'En vigueur' : 'En révision'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </div>
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
