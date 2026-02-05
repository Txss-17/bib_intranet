import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Search, Filter, Loader2, Eye, MoreHorizontal } from "lucide-react";
import { ExportButtons } from '@/components/ExportButtons';
import { useOrders, Order } from "@/hooks/useOps";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusLabels: Record<Order['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const statusVariants: Record<Order['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'default',
  shipped: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
};

const Orders = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.shipping_address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
          <p className="text-muted-foreground">Gestion et suivi des commandes clients</p>
        </div>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Nouvelle commande
        </Button>
        <ExportButtons
          filename="commandes"
          title="Liste des commandes"
          columns={[
            { header: 'N° Commande', accessor: 'order_number' },
            { header: 'Date', accessor: 'created_at' },
            { header: 'Montant', accessor: 'total_amount' },
            { header: 'Destination', accessor: 'shipping_address' },
            { header: 'Statut', accessor: 'status' },
          ]}
          data={filteredOrders}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell>{order.items_count} articles</TableCell>
                  <TableCell className="font-semibold">
                    {order.total_amount.toLocaleString('fr-FR', { style: 'currency', currency: order.currency })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.shipping_address || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem>Confirmer</DropdownMenuItem>
                        <DropdownMenuItem>Traiter</DropdownMenuItem>
                        <DropdownMenuItem>Créer expédition</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Annuler</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune commande trouvée
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

export default Orders;
