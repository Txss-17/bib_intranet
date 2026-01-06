import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const transactions = [
  { id: 'TRX-001', date: '2026-01-06', type: 'income', category: 'Abonnement', description: 'TechCorp - Enterprise Plan', amount: 8900, status: 'completed', reference: 'SUB-2891' },
  { id: 'TRX-002', date: '2026-01-06', type: 'expense', category: 'Fournisseur', description: 'EcoPackaging - Facture #2891', amount: 12800, status: 'completed', reference: 'INV-2891' },
  { id: 'TRX-003', date: '2026-01-05', type: 'income', category: 'Abonnement', description: 'RetailPlus - Premium Plan', amount: 4500, status: 'completed', reference: 'SUB-2890' },
  { id: 'TRX-004', date: '2026-01-05', type: 'expense', category: 'Salaires', description: 'Paie Janvier 2026 - Batch', amount: 45000, status: 'completed', reference: 'SAL-0126' },
  { id: 'TRX-005', date: '2026-01-04', type: 'income', category: 'Services', description: 'Formation Premium - BigRetail', amount: 3200, status: 'pending', reference: 'SRV-0412' },
  { id: 'TRX-006', date: '2026-01-04', type: 'expense', category: 'Ops', description: 'Byrd Logistics - Décembre', amount: 6200, status: 'completed', reference: 'OPS-1223' },
  { id: 'TRX-007', date: '2026-01-03', type: 'income', category: 'Abonnement', description: 'SmallBiz Pro - Standard', amount: 2200, status: 'completed', reference: 'SUB-2889' },
  { id: 'TRX-008', date: '2026-01-03', type: 'expense', category: 'Marketing', description: 'Campagne Google Ads', amount: 4500, status: 'completed', reference: 'MKT-0103' },
  { id: 'TRX-009', date: '2026-01-02', type: 'expense', category: 'Fournisseur', description: 'GlobalSupply - Produits Q4', amount: 28500, status: 'pending', reference: 'INV-2888' },
  { id: 'TRX-010', date: '2026-01-02', type: 'income', category: 'Abonnement', description: 'MegaCorp - Enterprise', amount: 12500, status: 'completed', reference: 'SUB-2887' },
];

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Historique complet des opérations financières</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Transactions affichées</p>
            <p className="text-2xl font-bold">{filteredTransactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Entrées</p>
            <p className="text-2xl font-bold text-green-500">+€{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Sorties</p>
            <p className="text-2xl font-bold text-destructive">-€{totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par description, référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="income">Entrées</SelectItem>
                <SelectItem value="expense">Sorties</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Abonnement">Abonnement</SelectItem>
                <SelectItem value="Fournisseur">Fournisseur</SelectItem>
                <SelectItem value="Salaires">Salaires</SelectItem>
                <SelectItem value="Ops">Ops</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-green-500/10' : 'bg-destructive/10'
                      }`}>
                        {tx.type === 'income' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <span className="font-medium">{tx.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{tx.reference}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                      {tx.status === 'completed' ? 'Complété' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    tx.type === 'income' ? 'text-green-500' : 'text-destructive'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}€{tx.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
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
};

export default Transactions;
