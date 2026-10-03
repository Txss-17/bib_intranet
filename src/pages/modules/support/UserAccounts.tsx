import React, { useState } from 'react';
import { 
  Users, Search, Building2, DollarSign,
  Package, CreditCard, MoreVertical, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { ExportButtons } from '@/components/ExportButtons';
import { useUserAccounts, useUserAccountStats } from '@/hooks/useLifecycle';

const UserAccounts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: accounts, isLoading } = useUserAccounts({
    paymentStatus: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
  });
  const { data: stats } = useUserAccountStats();

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case 'ok': 
      case 'current': return <Badge className="bg-emerald-500">OK</Badge>;
      case 'late': return <Badge className="bg-yellow-500">Retard</Badge>;
      case 'overdue':
      case 'critical': return <Badge className="bg-destructive">Critique</Badge>;
      default: return <Badge variant="secondary">{status || 'N/A'}</Badge>;
    }
  };

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case 'low': return <Badge variant="outline" className="text-emerald-500">Faible</Badge>;
      case 'medium': return <Badge variant="outline" className="text-yellow-500">Moyen</Badge>;
      case 'high': 
      case 'critical': return <Badge variant="outline" className="text-destructive">Élevé</Badge>;
      default: return <Badge variant="outline">{level || 'N/A'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <ExportButtons
          filename="comptes-utilisateurs"
          title="Comptes Utilisateurs"
          poleName="Lifecycle"
          columns={[
            { header: 'Entreprise', accessor: 'company_name' },
            { header: 'Contact', accessor: 'contact_name' },
            { header: 'Email', accessor: 'contact_email' },
            { header: 'CA', accessor: 'revenue' },
            { header: 'Stock engagé', accessor: 'stock_engaged' },
            { header: 'Paiement', accessor: 'payment_status' },
            { header: 'Risque', accessor: 'risk_level' },
            { header: 'Dernière commande', accessor: 'last_order_date' },
          ]}
          data={accounts || []}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Building2 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
              <p className="text-sm text-muted-foreground">Comptes actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">€{((stats?.totalRevenue ?? 0) / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">CA Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">€{((stats?.mrr ?? 0) / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">MRR</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats?.unpaidUsers ?? 0}</p>
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
            <SelectItem value="current">OK</SelectItem>
            <SelectItem value="late">Retard</SelectItem>
            <SelectItem value="overdue">Critique</SelectItem>
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
            {accounts?.map(account => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.company_name}</TableCell>
                <TableCell>
                  <div>
                    <p>{account.contact_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{account.contact_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">€{(account.revenue || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">€{(account.stock_engaged || 0).toLocaleString()}</TableCell>
                <TableCell>{getPaymentBadge(account.payment_status)}</TableCell>
                <TableCell>{getRiskBadge(account.risk_level)}</TableCell>
                <TableCell>{account.last_order_date || 'N/A'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!accounts || accounts.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun compte trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default UserAccounts;
