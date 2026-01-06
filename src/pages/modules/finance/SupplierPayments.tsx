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
  FileText
} from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const supplierPayments = [
  { id: 'PAY-001', supplier: 'EcoPackaging SAS', invoice: 'INV-2891', amount: 12800, dueDate: '2026-01-10', status: 'pending', paymentMethod: 'Virement' },
  { id: 'PAY-002', supplier: 'GlobalSupply Ltd', invoice: 'INV-2888', amount: 28500, dueDate: '2026-01-02', status: 'overdue', paymentMethod: 'Virement' },
  { id: 'PAY-003', supplier: 'BioPack Industries', invoice: 'INV-2875', amount: 8400, dueDate: '2026-01-15', status: 'scheduled', paymentMethod: 'Prélèvement' },
  { id: 'PAY-004', supplier: 'GreenMaterials Co', invoice: 'INV-2870', amount: 15200, dueDate: '2025-12-28', status: 'paid', paymentMethod: 'Virement', paidDate: '2025-12-27' },
  { id: 'PAY-005', supplier: 'EuroDistrib SA', invoice: 'INV-2865', amount: 22100, dueDate: '2025-12-20', status: 'paid', paymentMethod: 'Virement', paidDate: '2025-12-18' },
  { id: 'PAY-006', supplier: 'AsiaSupply Corp', invoice: 'INV-2890', amount: 45000, dueDate: '2026-01-20', status: 'pending', paymentMethod: 'Virement' },
  { id: 'PAY-007', supplier: 'EcoPackaging SAS', invoice: 'INV-2850', amount: 9600, dueDate: '2025-12-15', status: 'paid', paymentMethod: 'Virement', paidDate: '2025-12-14' },
];

const SupplierPayments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = supplierPayments.filter(payment => {
    const matchesSearch = payment.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.invoice.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingAmount = supplierPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = supplierPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  const scheduledAmount = supplierPayments.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0);

  const getStatusBadge = (status: string) => {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

        <Card className="border-destructive/50">
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
                <p className="text-sm text-muted-foreground">Payés ce mois</p>
                <p className="text-xl font-bold">€46,900</p>
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
                  {supplierPayments.filter(p => p.status === 'overdue').length} paiement(s) en retard 
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
                <TableHead>ID</TableHead>
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
                  <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{payment.supplier}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{payment.invoice}</span>
                    </div>
                  </TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    €{payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {payment.status !== 'paid' && (
                        <Button variant="outline" size="sm">
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierPayments;
