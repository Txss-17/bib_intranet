import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  MoreHorizontal,
  FileText,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSupplierPayments, useSupplierPaymentStats, useUpdateSupplierPayment } from "@/hooks/useFinance";

const SupplierPayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments, isLoading } = useSupplierPayments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: stats } = useSupplierPaymentStats();
  const updatePayment = useUpdateSupplierPayment();

  const filteredPayments = payments?.filter(payment => {
    const supplier = (payment.suppliers as any)?.name || '';
    const matchesSearch = supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  const pendingAmount = stats?.pendingAmount ?? 0;
  const overdueAmount = stats?.overdueAmount ?? 0;
  const scheduledAmount = stats?.scheduledAmount ?? 0;
  const paidAmount = stats?.paidAmount ?? 0;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Payé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">En attente</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Planifié</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">En retard</Badge>;
      default:
        return <Badge variant="outline">{status || 'N/A'}</Badge>;
    }
  };

  const handleMarkAsPaid = (id: string) => {
    updatePayment.mutate({
      id,
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
    });
  };

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
          <h1 className="text-3xl font-bold text-foreground">Paiements Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">Suivi des règlements et échéances</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Planifier paiement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold">€{pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overdueAmount > 0 ? "border-destructive/50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-xl font-bold text-destructive">€{overdueAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planifiés</p>
                <p className="text-xl font-bold">€{scheduledAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payés (total)</p>
                <p className="text-xl font-bold">€{paidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueAmount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Paiements en retard</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.overdueCount || 0} paiement(s) en retard 
                  pour un total de €{overdueAmount.toLocaleString()}
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Traiter maintenant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par fournisseur ou facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="scheduled">Planifiés</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
                <SelectItem value="paid">Payés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} className={payment.status === 'overdue' ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(payment.suppliers as any)?.name || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{payment.invoice_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>{payment.due_date}</TableCell>
                  <TableCell>{payment.payment_method || 'Virement'}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    €{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {payment.status !== 'paid' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsPaid(payment.id)}
                          disabled={updatePayment.isPending}
                        >
                          Payer
                        </Button>
                      )}
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé
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

export default SupplierPayments;
