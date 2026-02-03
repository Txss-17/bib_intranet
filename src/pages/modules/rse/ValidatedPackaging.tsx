import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, CheckCircle } from 'lucide-react';

const packaging = [
  { id: 'PKG-001', name: 'Carton recyclé 30x20x15', supplier: 'EcoPack SA', material: 'Carton recyclé', recyclable: true, recyclingRate: 95, co2: 0.12, validatedAt: '2024-02-15' },
  { id: 'PKG-002', name: 'Pochette kraft', supplier: 'GreenBox', material: 'Papier kraft', recyclable: true, recyclingRate: 100, co2: 0.05, validatedAt: '2024-02-10' },
  { id: 'PKG-003', name: 'Film biodégradable', supplier: 'BioWrap', material: 'PLA', recyclable: true, recyclingRate: 80, co2: 0.08, validatedAt: '2024-01-28' },
  { id: 'PKG-004', name: 'Boîte carton ondulé', supplier: 'EcoPack SA', material: 'Carton ondulé', recyclable: true, recyclingRate: 90, co2: 0.15, validatedAt: '2024-01-20' },
];

export default function ValidatedPackaging() {
  const [search, setSearch] = useState('');

  const filtered = packaging.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packaging validés</h1>
        <p className="text-muted-foreground">Emballages conformes aux critères RSE</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un packaging..."
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
                <TableHead>Fournisseur</TableHead>
                <TableHead>Matériau</TableHead>
                <TableHead>Taux recyclage</TableHead>
                <TableHead>CO₂ (kg)</TableHead>
                <TableHead>Validé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-mono">{pkg.id}</TableCell>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.supplier}</TableCell>
                  <TableCell>{pkg.material}</TableCell>
                  <TableCell>
                    <Badge variant="default">{pkg.recyclingRate}%</Badge>
                  </TableCell>
                  <TableCell>{pkg.co2}</TableCell>
                  <TableCell>{pkg.validatedAt}</TableCell>
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
