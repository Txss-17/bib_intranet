import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Rocket, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';

const deployments = [
  { id: 1, version: 'v2.4.1', environment: 'Production', status: 'success', deployedBy: 'Jean Dupont', deployedAt: '2025-02-02 14:30', changelog: 'Fix: Correction bug paiement' },
  { id: 2, version: 'v2.4.0', environment: 'Staging', status: 'success', deployedBy: 'Marie Martin', deployedAt: '2025-02-02 10:15', changelog: 'Feature: Nouveau dashboard' },
  { id: 3, version: 'v2.3.9', environment: 'Production', status: 'rollback', deployedBy: 'Jean Dupont', deployedAt: '2025-02-01 16:00', changelog: 'Feature: Intégration API externe' },
  { id: 4, version: 'v2.3.8', environment: 'Production', status: 'success', deployedBy: 'Pierre Durand', deployedAt: '2025-01-31 11:00', changelog: 'Perf: Optimisation requêtes DB' },
  { id: 5, version: 'v2.3.7', environment: 'Development', status: 'pending', deployedBy: 'Sophie Bernard', deployedAt: '2025-02-02 16:00', changelog: 'WIP: Nouvelle fonctionnalité' },
];

export default function Deployments() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeployments = deployments.filter(d =>
    d.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.changelog.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rollback': return <RotateCcw className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/10 text-green-500">Succès</Badge>;
      case 'rollback': return <Badge className="bg-yellow-500/10 text-yellow-500">Rollback</Badge>;
      case 'pending': return <Badge className="bg-blue-500/10 text-blue-500">En attente</Badge>;
      default: return <Badge variant="destructive">Échec</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Déploiements</h1>
          <p className="text-muted-foreground">Historique et gestion des déploiements</p>
        </div>
        <Button>
          <Rocket className="mr-2 h-4 w-4" />
          Nouveau déploiement
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par version ou changelog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des déploiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Environnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Déployé par</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Changelog</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeployments.map((deploy) => (
                <TableRow key={deploy.id}>
                  <TableCell className="font-medium">{deploy.version}</TableCell>
                  <TableCell>
                    <Badge variant={deploy.environment === 'Production' ? 'default' : 'secondary'}>
                      {deploy.environment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(deploy.status)}
                      {getStatusBadge(deploy.status)}
                    </div>
                  </TableCell>
                  <TableCell>{deploy.deployedBy}</TableCell>
                  <TableCell>{deploy.deployedAt}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{deploy.changelog}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Détails</Button>
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
