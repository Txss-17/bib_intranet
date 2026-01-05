import React, { useState } from 'react';
import { 
  Users, Search, Filter, Building2, DollarSign,
  Package, CreditCard, TrendingUp, TrendingDown, MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const mockAccounts = [
  { id: '1', company: 'BeautyBox Pro', contact: 'Marie Dupont', email: 'marie@beautybox.fr', revenue: 45000, stockEngaged: 12000, paymentStatus: 'ok', riskLevel: 'low', lastOrder: '2026-01-03' },
  { id: '2', company: 'CosmetiCare SARL', contact: 'Jean Martin', email: 'jean@cosmeticare.fr', revenue: 78000, stockEngaged: 25000, paymentStatus: 'late', riskLevel: 'medium', lastOrder: '2025-12-28' },
  { id: '3', company: 'Natural Glow', contact: 'Sophie Bernard', email: 'sophie@naturalglow.fr', revenue: 32000, stockEngaged: 8000, paymentStatus: 'ok', riskLevel: 'low', lastOrder: '2026-01-05' },
  { id: '4', company: 'SkinCare Plus', contact: 'Pierre Durand', email: 'pierre@skincare.fr', revenue: 15000, stockEngaged: 45000, paymentStatus: 'critical', riskLevel: 'high', lastOrder: '2025-11-15' },
  { id: '5', company: 'Bio Beauty', contact: 'Claire Petit', email: 'claire@biobeauty.fr', revenue: 92000, stockEngaged: 18000, paymentStatus: 'ok', riskLevel: 'low', lastOrder: '2026-01-04' },
];

const UserAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'ok': return <Badge className="bg-emerald-500">OK</Badge>;
      case 'late': return <Badge className="bg-yellow-500">Retard</Badge>;
      case 'critical': return <Badge className="bg-destructive">Critique</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low': return <Badge variant="outline" className="text-emerald-500">Faible</Badge>;
      case 'medium': return <Badge variant="outline" className="text-yellow-500">Moyen</Badge>;
      case 'high': return <Badge variant="outline" className="text-destructive">Élevé</Badge>;
      default: return <Badge variant="outline">{level}</Badge>;
    }
  };

  const filteredAccounts = mockAccounts.filter(account => {
    const matchesSearch = account.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         account.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || account.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Comptes Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">CA, stock engagé, historique paiements</p>
        </div>
        <Button>Exporter CSV</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{mockAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Comptes actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">€{(mockAccounts.reduce((sum, a) => sum + a.revenue, 0) / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">CA Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">€{(mockAccounts.reduce((sum, a) => sum + a.stockEngaged, 0) / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Stock Engagé</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{mockAccounts.filter(a => a.paymentStatus !== 'ok').length}</p>
              <p className="text-sm text-muted-foreground">Paiements à surveiller</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Statut paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="late">Retard</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entreprise</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">CA</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Risque</TableHead>
              <TableHead>Dernière commande</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.map(account => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.company}</TableCell>
                <TableCell>
                  <div>
                    <p>{account.contact}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">€{account.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">€{account.stockEngaged.toLocaleString()}</TableCell>
                <TableCell>{getPaymentBadge(account.paymentStatus)}</TableCell>
                <TableCell>{getRiskBadge(account.riskLevel)}</TableCell>
                <TableCell>{account.lastOrder}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default UserAccounts;
