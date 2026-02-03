import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Gift, TrendingUp, Users } from 'lucide-react';

const stats = [
  { label: 'Points distribués (total)', value: '245,890', icon: Gift },
  { label: 'Clients actifs', value: '3,245', icon: Users },
  { label: 'Points utilisés ce mois', value: '12,450', icon: TrendingUp },
];

const customers = [
  { id: 'USR-001', name: 'Marie Dupont', email: 'marie.dupont@email.com', points: 1250, level: 'gold', lastActivity: '2024-02-18' },
  { id: 'USR-002', name: 'Pierre Martin', email: 'p.martin@company.fr', points: 890, level: 'silver', lastActivity: '2024-02-17' },
  { id: 'USR-003', name: 'Sophie Bernard', email: 'sophie.b@mail.com', points: 2100, level: 'platinum', lastActivity: '2024-02-18' },
  { id: 'USR-004', name: 'Lucas Petit', email: 'lucas.petit@pro.com', points: 450, level: 'bronze', lastActivity: '2024-02-15' },
  { id: 'USR-005', name: 'Emma Leroy', email: 'emma.leroy@mail.fr', points: 1680, level: 'gold', lastActivity: '2024-02-18' },
];

export default function CustomerPoints() {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Points clients finaux</h1>
        <p className="text-muted-foreground">Programme de fidélité et récompenses RSE</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
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
                <TableHead>Email</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Dernière activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono">{customer.id}</TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell className="font-semibold">{customer.points}</TableCell>
                  <TableCell>
                    <Badge variant={
                      customer.level === 'platinum' ? 'default' :
                      customer.level === 'gold' ? 'secondary' : 'outline'
                    }>
                      {customer.level.charAt(0).toUpperCase() + customer.level.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
