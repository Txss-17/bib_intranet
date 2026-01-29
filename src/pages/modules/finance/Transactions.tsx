import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCashflows } from "@/hooks/useFinance";

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: transactions, isLoading } = useCashflows({
    type: typeFilter !== 'all' ? typeFilter as 'income' | 'expense' : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });

  const filteredTransactions = transactions?.filter(tx => {
    const matchesSearch = (tx.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (tx.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Get unique categories
  const categories = [...new Set(transactions?.map(t => t.category) || [])];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
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
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.transaction_date}</TableCell>
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
                      <span className="font-medium">{tx.description || tx.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {tx.reference || '-'}
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
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune transaction trouvée. Les données seront affichées une fois ajoutées.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
