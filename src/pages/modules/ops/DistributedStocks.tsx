import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePartnerStocks, useUpdateStock } from '@/hooks/useOpsControl';
import { AlertTriangle, Package, Search, Pencil, Check, X } from 'lucide-react';

export default function DistributedStocks() {
  const { data: stocks = [], isLoading } = usePartnerStocks();
  const update = useUpdateStock();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const filtered = stocks.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.product_catalog?.shop_sku.toLowerCase().includes(q) ||
      s.product_catalog?.name.toLowerCase().includes(q) ||
      s.logistics_partners?.name.toLowerCase().includes(q)
    );
  });

  const ruptures = stocks.filter((s) => s.quantity <= s.rupture_threshold).length;
  const lows = stocks.filter((s) => s.quantity > s.rupture_threshold && s.quantity <= s.reorder_threshold).length;
  const totalUnits = stocks.reduce((a, s) => a + s.quantity, 0);

  const statusBadge = (s: typeof stocks[number]) => {
    if (s.quantity <= s.rupture_threshold)
      return <Badge variant="destructive">Rupture</Badge>;
    if (s.quantity <= s.reorder_threshold)
      return <Badge className="bg-warning text-warning-foreground">Faible</Badge>;
    return <Badge variant="secondary">OK</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Stocks distribués</h1>
        <p className="text-muted-foreground">Vue temps réel par produit × partenaire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unités totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{ruptures}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lows}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Inventaire distribué</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="SKU, produit ou partenaire…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU boutique</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Réservé</TableHead>
                  <TableHead className="text-right">Seuils</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.product_catalog?.shop_sku}</TableCell>
                    <TableCell>{s.product_catalog?.name}</TableCell>
                    <TableCell>{s.logistics_partners?.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.region ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {editing === s.id ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value, 10) || 0)}
                          className="h-8 w-20 ml-auto"
                        />
                      ) : (
                        s.quantity
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.reserved_quantity}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {s.rupture_threshold} / {s.reorder_threshold}
                    </TableCell>
                    <TableCell>{statusBadge(s)}</TableCell>
                    <TableCell className="text-right">
                      {editing === s.id ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              update.mutate(
                                { id: s.id, quantity: editValue },
                                { onSuccess: () => setEditing(null) }
                              );
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(s.id);
                            setEditValue(s.quantity);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Aucun stock
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
