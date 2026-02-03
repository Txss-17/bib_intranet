import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, MessageSquare } from 'lucide-react';

const disputes = [
  { id: 'LIT-2024-012', subject: 'Retard de livraison - Commande #45892', party: 'Client Alpha Corp', type: 'Commercial', openDate: '2024-02-15', status: 'open', amount: '12 500 €', priority: 'high' },
  { id: 'LIT-2024-011', subject: 'Produit défectueux - Lot #B789', party: 'Client Beta SA', type: 'Qualité', openDate: '2024-02-10', status: 'negotiation', amount: '5 200 €', priority: 'medium' },
  { id: 'LIT-2024-010', subject: 'Facture contestée', party: 'Fournisseur Delta', type: 'Financier', openDate: '2024-01-28', status: 'resolved', amount: '8 900 €', priority: 'low' },
  { id: 'LIT-2024-009', subject: 'Non-respect des délais contractuels', party: 'Partenaire Gamma', type: 'Contractuel', openDate: '2024-01-15', status: 'open', amount: '25 000 €', priority: 'high' },
];

export default function Disputes() {
  const [search, setSearch] = useState('');

  const filtered = disputes.filter(d => 
    d.subject.toLowerCase().includes(search.toLowerCase()) ||
    d.party.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Litiges</h1>
          <p className="text-muted-foreground">Suivi et gestion des litiges</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouveau litige</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un litige..."
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
                <TableHead>Sujet</TableHead>
                <TableHead>Partie</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono">{dispute.id}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{dispute.subject}</TableCell>
                  <TableCell>{dispute.party}</TableCell>
                  <TableCell>{dispute.type}</TableCell>
                  <TableCell>{dispute.amount}</TableCell>
                  <TableCell>
                    <Badge variant={
                      dispute.priority === 'high' ? 'destructive' :
                      dispute.priority === 'medium' ? 'secondary' : 'outline'
                    }>
                      {dispute.priority === 'high' ? 'Haute' :
                       dispute.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      dispute.status === 'open' ? 'destructive' :
                      dispute.status === 'negotiation' ? 'secondary' : 'default'
                    }>
                      {dispute.status === 'open' ? 'Ouvert' :
                       dispute.status === 'negotiation' ? 'Négociation' : 'Résolu'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>
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
