import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const risks = [
  { id: 'RSK-001', name: 'Dépendance fournisseur unique', category: 'Supply Chain', probability: 40, impact: 90, score: 36, owner: 'Ops', status: 'monitoring', mitigation: 'Diversification en cours' },
  { id: 'RSK-002', name: 'Risque cyber attaque', category: 'Tech', probability: 30, impact: 95, score: 28.5, owner: 'Tech', status: 'mitigated', mitigation: 'Audit sécurité trimestriel' },
  { id: 'RSK-003', name: 'Volatilité prix matières', category: 'Finance', probability: 70, impact: 60, score: 42, owner: 'Finance', status: 'monitoring', mitigation: 'Contrats à terme' },
  { id: 'RSK-004', name: 'Non-conformité réglementaire', category: 'Compliance', probability: 20, impact: 85, score: 17, owner: 'Legal', status: 'mitigated', mitigation: 'Veille juridique active' },
  { id: 'RSK-005', name: 'Perte collaborateur clé', category: 'RH', probability: 35, impact: 70, score: 24.5, owner: 'RH', status: 'accepted', mitigation: 'Plan de succession' },
];

export default function RiskRegisterModule() {
  const [search, setSearch] = useState('');

  const filtered = risks.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  const getRiskColor = (score: number) => {
    if (score >= 40) return 'text-red-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registre des risques</h1>
          <p className="text-muted-foreground">Cartographie et suivi des risques</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouveau risque</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Risques critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.filter(r => r.score >= 40).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Risques modérés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.filter(r => r.score >= 25 && r.score < 40).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Risques faibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{risks.filter(r => r.score < 25).length}</div>
          </CardContent>
        </Card>
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
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
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
                    <div className="flex items-center gap-2">
                      <Progress value={risk.probability} className="w-16 h-2" />
                      <span className="text-xs">{risk.probability}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={risk.impact} className="w-16 h-2" />
                      <span className="text-xs">{risk.impact}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-bold ${getRiskColor(risk.score)}`}>{risk.score}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      risk.status === 'monitoring' ? 'secondary' :
                      risk.status === 'mitigated' ? 'default' : 'outline'
                    }>
                      {risk.status === 'monitoring' ? 'Surveillance' :
                       risk.status === 'mitigated' ? 'Atténué' : 'Accepté'}
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
