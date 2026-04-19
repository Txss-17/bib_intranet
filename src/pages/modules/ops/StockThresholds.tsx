import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStockThresholds, useUpdateStockThresholds, useDetectReplenishment } from '@/hooks/useOpsForecast';
import { AlertTriangle, Pencil, Check, X, Zap, Target } from 'lucide-react';

export default function StockThresholds() {
  const { data: stocks = [], isLoading } = useStockThresholds();
  const update = useUpdateStockThresholds();
  const detect = useDetectReplenishment();
  const [editing, setEditing] = useState<string | null>(null);
  const [vals, setVals] = useState<{ min: number; ideal: number; lead: number }>({ min: 0, ideal: 0, lead: 0 });

  const belowMin = stocks.filter((s) => s.quantity <= s.min_threshold).length;
  const nearMin = stocks.filter((s) => s.quantity > s.min_threshold && s.quantity <= s.min_threshold * 1.5).length;

  const statusBadge = (s: typeof stocks[number]) => {
    if (s.quantity <= s.min_threshold) return <Badge variant="destructive">Sous le seuil</Badge>;
    if (s.quantity <= s.min_threshold * 1.5) return <Badge className="bg-warning text-warning-foreground">Proche seuil</Badge>;
    if (s.quantity >= s.ideal_stock) return <Badge className="bg-success text-success-foreground">Idéal</Badge>;
    return <Badge variant="secondary">OK</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Seuils & alertes prédictives</h1>
          <p className="text-muted-foreground">Pilotage des seuils min / idéal / lead time par produit × partenaire</p>
        </div>
        <Button onClick={() => detect.mutate()} disabled={detect.isPending} className="gap-2">
          <Zap className={`h-4 w-4 ${detect.isPending ? 'animate-pulse' : ''}`} />
          Détecter besoins
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sous le seuil min</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{belowMin}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proche du seuil</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{nearMin}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total suivi</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stocks.length}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Configuration des seuils</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Idéal</TableHead>
                  <TableHead className="text-right">Lead (j)</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.product_catalog?.shop_sku}</TableCell>
                    <TableCell>{s.product_catalog?.name}</TableCell>
                    <TableCell>{s.logistics_partners?.name}</TableCell>
                    <TableCell className="text-right font-medium">{s.quantity}</TableCell>
                    <TableCell className="text-right">
                      {editing === s.id ? (
                        <Input type="number" value={vals.min} onChange={(e) => setVals({ ...vals, min: parseInt(e.target.value) || 0 })} className="h-8 w-20 ml-auto" />
                      ) : (s.min_threshold)}
                    </TableCell>
                    <TableCell className="text-right">
                      {editing === s.id ? (
                        <Input type="number" value={vals.ideal} onChange={(e) => setVals({ ...vals, ideal: parseInt(e.target.value) || 0 })} className="h-8 w-20 ml-auto" />
                      ) : (s.ideal_stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      {editing === s.id ? (
                        <Input type="number" value={vals.lead} onChange={(e) => setVals({ ...vals, lead: parseInt(e.target.value) || 0 })} className="h-8 w-16 ml-auto" />
                      ) : (s.supplier_lead_time_days)}
                    </TableCell>
                    <TableCell>{statusBadge(s)}</TableCell>
                    <TableCell className="text-right">
                      {editing === s.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => update.mutate({ id: s.id, min_threshold: vals.min, ideal_stock: vals.ideal, supplier_lead_time_days: vals.lead }, { onSuccess: () => setEditing(null) })}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(s.id); setVals({ min: s.min_threshold, ideal: s.ideal_stock, lead: s.supplier_lead_time_days }); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {stocks.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucun stock</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
