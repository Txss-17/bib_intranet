import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ExportButtons } from "@/components/ExportButtons";
import { useOrders, Order } from "@/hooks/useOps";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusLabels: Record<Order["status"], string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En traitement",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusVariants: Record<
  Order["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "secondary",
  processing: "default",
  shipped: "default",
  delivered: "secondary",
  cancelled: "destructive",
};

function formatAmount(order: Order) {
  return order.total_amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: order.currency || "EUR",
  });
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return format(date, "dd MMM yyyy", {
    locale: fr,
  });
}

function getShopName(order: Order & Record<string, any>) {
  return (
    order.shop_name ??
    order.shop?.name ??
    order.store_name ??
    order.store?.name ??
    "Boutique non renseignée"
  );
}

function getShopCode(order: Order & Record<string, any>) {
  return (
    order.shop_code ??
    order.shop?.shop_code ??
    order.store_code ??
    "—"
  );
}

const Orders = () => {
  const { data: orders = [], isLoading, error } = useOrders();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");

  const typedOrders = orders as (Order & Record<string, any>)[];

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return typedOrders.filter((order) => {
      const shopName = getShopName(order);
      const shopCode = getShopCode(order);

      const matchesSearch =
        !query ||
        order.order_number
          .toLowerCase()
          .includes(query) ||
        (order.shipping_address ?? "")
          .toLowerCase()
          .includes(query) ||
        shopName.toLowerCase().includes(query) ||
        shopCode.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [typedOrders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: typedOrders.length,
      pending: typedOrders.filter(
        (order) => order.status === "pending",
      ).length,
      processing: typedOrders.filter(
        (order) => order.status === "processing",
      ).length,
      shipped: typedOrders.filter(
        (order) => order.status === "shipped",
      ).length,
      delivered: typedOrders.filter(
        (order) => order.status === "delivered",
      ).length,
    };
  }, [typedOrders]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Commandes
          </h1>

          <p className="text-muted-foreground">
            Supervision des commandes marketplace BIB
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />

            <p className="font-medium">
              Impossible de charger les commandes
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Vérifiez la connexion aux données
              marketplace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Commandes
              </h1>

              <p className="text-muted-foreground">
                Supervision et suivi des commandes
                marketplace BIB
              </p>
            </div>
          </div>
        </div>

        <ExportButtons
          filename="commandes"
          title="Liste des commandes BIB"
          columns={[
            {
              header: "N° Commande",
              accessor: "order_number",
            },
            {
              header: "Boutique",
              accessor: "shop_name",
            },
            {
              header: "Code boutique",
              accessor: "shop_code",
            },
            {
              header: "Date",
              accessor: "created_at",
            },
            {
              header: "Montant",
              accessor: "total_amount",
            },
            {
              header: "Destination",
              accessor: "shipping_address",
            },
            {
              header: "Statut",
              accessor: "status",
            },
          ]}
          data={filteredOrders.map((order) => ({
            ...order,
            shop_name: getShopName(order),
            shop_code: getShopCode(order),
          }))}
        />
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Commandes
              </span>

              <Package className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-2xl font-semibold">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                En attente
              </span>

              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-2xl font-semibold">
              {stats.pending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                En traitement
              </span>

              <Package className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-2xl font-semibold">
              {stats.processing}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Expédiées
              </span>

              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-2xl font-semibold">
              {stats.shipped}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Rechercher par commande, boutique, code ou adresse..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full lg:w-[210px]">
                <Filter className="mr-2 h-4 w-4" />

                <SelectValue placeholder="Statut" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  Tous les statuts
                </SelectItem>

                <SelectItem value="pending">
                  En attente
                </SelectItem>

                <SelectItem value="confirmed">
                  Confirmée
                </SelectItem>

                <SelectItem value="processing">
                  En traitement
                </SelectItem>

                <SelectItem value="shipped">
                  Expédiée
                </SelectItem>

                <SelectItem value="delivered">
                  Livrée
                </SelectItem>

                <SelectItem value="cancelled">
                  Annulée
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Commandes ({filteredOrders.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>

                  <TableHead>Boutique</TableHead>

                  <TableHead>Date</TableHead>

                  <TableHead>Articles</TableHead>

                  <TableHead>Montant</TableHead>

                  <TableHead>Destination</TableHead>

                  <TableHead>Statut</TableHead>

                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => {
                  const shopName = getShopName(order);
                  const shopCode = getShopCode(order);

                  return (
                    <TableRow key={order.id}>
                      {/* Order */}
                      <TableCell className="font-medium">
                        <div>
                          <span>
                            {order.order_number}
                          </span>

                          <p className="text-xs text-muted-foreground">
                            Commande BIB
                          </p>
                        </div>
                      </TableCell>

                      {/* Shop */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />

                          <div>
                            <p className="text-sm font-medium">
                              {shopName}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {shopCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>

                      {/* Items */}
                      <TableCell>
                        {order.items_count} article
                        {order.items_count > 1
                          ? "s"
                          : ""}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="font-semibold">
                        {formatAmount(order)}
                      </TableCell>

                      {/* Destination */}
                      <TableCell className="max-w-[220px]">
                        <span
                          className="block truncate"
                          title={
                            order.shipping_address ||
                            undefined
                          }
                        >
                          {order.shipping_address || "—"}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant={
                            statusVariants[order.status]
                          }
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir les détails
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {order.status ===
                              "pending" && (
                              <DropdownMenuItem>
                                Confirmer la commande
                              </DropdownMenuItem>
                            )}

                            {(
                              [
                                "confirmed",
                                "processing",
                              ] as Order["status"][]
                            ).includes(order.status) && (
                              <DropdownMenuItem>
                                Préparer l'expédition
                              </DropdownMenuItem>
                            )}

                            {order.status ===
                              "processing" && (
                              <DropdownMenuItem>
                                Créer l'expédition
                              </DropdownMenuItem>
                            )}

                            {order.status !==
                              "delivered" &&
                              order.status !==
                                "cancelled" && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem className="text-destructive">
                                    Annuler la commande
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center"
                    >
                      <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />

                      <p className="font-medium">
                        Aucune commande trouvée
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Modifiez les critères de recherche
                        ou de filtrage.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;