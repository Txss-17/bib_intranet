import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, Plus, ExternalLink } from 'lucide-react';

const services = [
  { id: 1, name: 'API Gateway', type: 'Infrastructure', version: '3.2.1', owner: 'Équipe Core', status: 'active', docs: true },
  { id: 2, name: 'Auth Service', type: 'Service', version: '2.1.0', owner: 'Équipe Sécurité', status: 'active', docs: true },
  { id: 3, name: 'Payment Processor', type: 'Service', version: '1.8.5', owner: 'Équipe Finance', status: 'active', docs: true },
  { id: 4, name: 'Notification Service', type: 'Service', version: '1.4.2', owner: 'Équipe Core', status: 'active', docs: false },
  { id: 5, name: 'Analytics Engine', type: 'Service', version: '2.0.0-beta', owner: 'Équipe Data', status: 'beta', docs: true },
  { id: 6, name: 'Legacy CRM Connector', type: 'Integration', version: '1.0.0', owner: 'Équipe Ops', status: 'deprecated', docs: false },
];

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-500">Actif</Badge>;
      case 'beta': return <Badge className="bg-blue-500/10 text-blue-500">Beta</Badge>;
      case 'deprecated': return <Badge variant="destructive">Déprécié</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catalogue</h1>
          <p className="text-muted-foreground">Services et composants techniques</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un service
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {services.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Beta</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {services.filter(s => s.status === 'beta').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépréciés</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {services.filter(s => s.status === 'deprecated').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue des Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Documentation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.type}</Badge>
                  </TableCell>
                  <TableCell>{service.version}</TableCell>
                  <TableCell>{service.owner}</TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell>
                    {service.docs ? (
                      <Badge className="bg-green-500/10 text-green-500">Disponible</Badge>
                    ) : (
                      <Badge variant="secondary">Manquante</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
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
