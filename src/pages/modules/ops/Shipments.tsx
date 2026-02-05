import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Search, Filter, Loader2, MapPin, ExternalLink } from "lucide-react";
import { ExportButtons } from '@/components/ExportButtons';
import { useShipments, Shipment } from "@/hooks/useOps";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<Shipment['status'], string> = {
  preparing: 'Préparation',
  picked_up: 'Collecté',
  in_transit: 'En transit',
  out_for_delivery: 'En livraison',
  delivered: 'Livré',
  returned: 'Retourné',
};

const statusColors: Record<Shipment['status'], string> = {
  preparing: 'bg-muted text-muted-foreground',
  picked_up: 'bg-blue-500/10 text-blue-500',
  in_transit: 'bg-primary/10 text-primary',
  out_for_delivery: 'bg-orange-500/10 text-orange-500',
  delivered: 'bg-green-500/10 text-green-500',
  returned: 'bg-destructive/10 text-destructive',
};

const Shipments = () => {
  const { data: shipments = [], isLoading } = useShipments();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');

  const carriers = [...new Set(shipments.map(s => s.carrier))];

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shipment.destination_address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || shipment.carrier === carrierFilter;
    return matchesSearch && matchesStatus && matchesCarrier;
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
          <h1 className="text-3xl font-bold tracking-tight">Expéditions</h1>
          <p className="text-muted-foreground">Suivi des colis et livraisons</p>
        </div>
        <Button>
          <Truck className="h-4 w-4 mr-2" />
          Nouvelle expédition
        </Button>
        <ExportButtons
          filename="expeditions"
          title="Liste des expéditions"
          columns={[
            { header: 'N° Suivi', accessor: 'tracking_number' },
            { header: 'Transporteur', accessor: 'carrier' },
            { header: 'Destination', accessor: 'destination_address' },
            { header: 'Poids (kg)', accessor: 'weight_kg' },
            { header: 'Livraison prévue', accessor: 'estimated_delivery' },
            { header: 'Coût', accessor: 'shipping_cost' },
            { header: 'Statut', accessor: 'status' },
          ]}
          data={filteredShipments}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{shipments.filter(s => s.status === 'preparing').length}</div>
            <p className="text-xs text-muted-foreground">En préparation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{shipments.filter(s => s.status === 'in_transit').length}</div>
            <p className="text-xs text-muted-foreground">En transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{shipments.filter(s => s.status === 'out_for_delivery').length}</div>
            <p className="text-xs text-muted-foreground">En livraison</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{shipments.filter(s => s.status === 'delivered').length}</div>
            <p className="text-xs text-muted-foreground">Livrées</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par n° suivi ou destination..."
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
                <SelectItem value="preparing">Préparation</SelectItem>
                <SelectItem value="picked_up">Collecté</SelectItem>
                <SelectItem value="in_transit">En transit</SelectItem>
                <SelectItem value="out_for_delivery">En livraison</SelectItem>
                <SelectItem value="delivered">Livré</SelectItem>
                <SelectItem value="returned">Retourné</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Transporteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {carriers.map(carrier => (
                  <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des expéditions ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Suivi</TableHead>
                <TableHead>Transporteur</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead>Livraison prévue</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-mono text-sm">{shipment.tracking_number || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{shipment.carrier}</Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{shipment.destination_address || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{shipment.weight_kg ? `${shipment.weight_kg} kg` : '-'}</TableCell>
                  <TableCell>
                    {shipment.estimated_delivery 
                      ? format(new Date(shipment.estimated_delivery), 'dd MMM yyyy', { locale: fr })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {shipment.shipping_cost 
                      ? `${shipment.shipping_cost.toFixed(2)} €`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[shipment.status]}`}>
                      {statusLabels[shipment.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Suivre
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredShipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucune expédition trouvée
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

export default Shipments;
