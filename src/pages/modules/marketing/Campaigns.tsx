import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, BarChart } from 'lucide-react';

const campaigns = [
  { id: 'CMP-001', name: 'Lancement Printemps 2024', type: 'Multi-canal', startDate: '2024-03-01', endDate: '2024-04-30', budget: '15 000 €', spent: '8 500 €', status: 'active' },
  { id: 'CMP-002', name: 'Newsletter Mensuelle Mars', type: 'Email', startDate: '2024-03-15', endDate: '2024-03-15', budget: '500 €', spent: '500 €', status: 'completed' },
  { id: 'CMP-003', name: 'Campagne LinkedIn Q1', type: 'Social', startDate: '2024-01-15', endDate: '2024-03-31', budget: '8 000 €', spent: '7 200 €', status: 'active' },
  { id: 'CMP-004', name: 'Partenariat Influenceurs', type: 'Influence', startDate: '2024-04-01', endDate: '2024-05-31', budget: '25 000 €', spent: '0 €', status: 'planned' },
  { id: 'CMP-005', name: 'Retargeting Q1', type: 'Display', startDate: '2024-01-01', endDate: '2024-03-31', budget: '5 000 €', spent: '4 850 €', status: 'completed' },
];

export default function Campaigns() {
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campagnes</h1>
          <p className="text-muted-foreground">Gestion des campagnes marketing</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouvelle campagne</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une campagne..."
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
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Dépensé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-mono">{campaign.id}</TableCell>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.type}</TableCell>
                  <TableCell className="text-sm">{campaign.startDate} → {campaign.endDate}</TableCell>
                  <TableCell>{campaign.budget}</TableCell>
                  <TableCell>{campaign.spent}</TableCell>
                  <TableCell>
                    <Badge variant={
                      campaign.status === 'active' ? 'default' :
                      campaign.status === 'completed' ? 'secondary' : 'outline'
                    }>
                      {campaign.status === 'active' ? 'Actif' :
                       campaign.status === 'completed' ? 'Terminé' : 'Planifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><BarChart className="h-4 w-4" /></Button>
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
