import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit } from 'lucide-react';

const risks = [
  { id: 'RSK-001', name: 'Risque RGPD - Données clients', category: 'Data', probability: 'medium', impact: 'high', level: 'high', owner: 'DPO', mitigation: 'Audit trimestriel' },
  { id: 'RSK-002', name: 'Risque fournisseur unique', category: 'Supply Chain', probability: 'low', impact: 'critical', level: 'high', owner: 'Ops', mitigation: 'Diversification en cours' },
  { id: 'RSK-003', name: 'Risque change EUR/USD', category: 'Finance', probability: 'high', impact: 'medium', level: 'medium', owner: 'Finance', mitigation: 'Couverture hedging' },
  { id: 'RSK-004', name: 'Risque cybersécurité', category: 'Tech', probability: 'medium', impact: 'critical', level: 'critical', owner: 'Tech', mitigation: 'Pentest annuel' },
  { id: 'RSK-005', name: 'Risque réputation', category: 'Brand', probability: 'low', impact: 'high', level: 'medium', owner: 'Marketing', mitigation: 'Monitoring social' },
];

export default function RiskRegister() {
  const [search, setSearch] = useState('');

  const filtered = risks.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registre des risques</h1>
          <p className="text-muted-foreground">Identification et suivi des risques</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouveau risque</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un risque..."
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
                <TableHead>Risque</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Probabilité</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell className="font-mono">{risk.id}</TableCell>
                  <TableCell className="font-medium">{risk.name}</TableCell>
                  <TableCell>{risk.category}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {risk.probability === 'high' ? 'Haute' :
                       risk.probability === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {risk.impact === 'critical' ? 'Critique' :
                       risk.impact === 'high' ? 'Élevé' : 'Moyen'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      risk.level === 'critical' ? 'destructive' :
                      risk.level === 'high' ? 'destructive' :
                      risk.level === 'medium' ? 'secondary' : 'outline'
                    }>
                      {risk.level === 'critical' ? 'Critique' :
                       risk.level === 'high' ? 'Élevé' : 'Moyen'}
                    </Badge>
                  </TableCell>
                  <TableCell>{risk.owner}</TableCell>
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
