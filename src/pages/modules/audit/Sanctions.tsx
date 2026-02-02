import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Ban, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const sanctions = [
  { id: 1, target: 'FreshFarm Bio', targetType: 'Fournisseur', type: 'Avertissement', reason: 'Retards répétés de livraison', date: '2025-01-28', status: 'active', validUntil: '2025-04-28' },
  { id: 2, target: 'LogiTrans', targetType: 'Partenaire', type: 'Suspension', reason: 'Non-conformité majeure', date: '2025-01-15', status: 'active', validUntil: '2025-02-15' },
  { id: 3, target: 'BioMarket', targetType: 'Fournisseur', type: 'Avertissement', reason: 'Documentation incomplète', date: '2024-12-10', status: 'expired', validUntil: '2025-01-10' },
  { id: 4, target: 'EcoPackaging', targetType: 'Fournisseur', type: 'Pénalité financière', reason: 'Qualité non conforme', date: '2025-01-20', status: 'active', validUntil: null },
  { id: 5, target: 'TransportExpress', targetType: 'Partenaire', type: 'Exclusion', reason: 'Incidents répétés', date: '2024-11-15', status: 'active', validUntil: null },
];

export default function Sanctions() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSanctions = sanctions.filter(s =>
    s.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Avertissement': return <Badge className="bg-yellow-500/10 text-yellow-500">{type}</Badge>;
      case 'Suspension': return <Badge className="bg-orange-500/10 text-orange-500">{type}</Badge>;
      case 'Pénalité financière': return <Badge className="bg-red-500/10 text-red-500">{type}</Badge>;
      case 'Exclusion': return <Badge variant="destructive">{type}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="destructive">Active</Badge>;
      case 'expired': return <Badge variant="secondary">Expirée</Badge>;
      case 'lifted': return <Badge className="bg-green-500/10 text-green-500">Levée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeCount = sanctions.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historique des Sanctions</h1>
        <p className="text-muted-foreground">Sanctions et mesures disciplinaires</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sanctions actives</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {sanctions.filter(s => s.type === 'Avertissement').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspensions</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {sanctions.filter(s => s.type === 'Suspension').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exclusions</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {sanctions.filter(s => s.type === 'Exclusion').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par entité ou type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des sanctions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entité</TableHead>
                <TableHead>Type d'entité</TableHead>
                <TableHead>Sanction</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSanctions.map((sanction) => (
                <TableRow key={sanction.id}>
                  <TableCell className="font-medium">{sanction.target}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{sanction.targetType}</Badge>
                  </TableCell>
                  <TableCell>{getTypeBadge(sanction.type)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{sanction.reason}</TableCell>
                  <TableCell>{new Date(sanction.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{getStatusBadge(sanction.status)}</TableCell>
                  <TableCell>
                    {sanction.validUntil 
                      ? new Date(sanction.validUntil).toLocaleDateString('fr-FR')
                      : 'Permanent'
                    }
                  </TableCell>
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
