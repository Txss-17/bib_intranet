import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupplierLeadTimes, useUpsertSupplierLeadTime, useDeleteSupplierLeadTime } from '@/hooks/useOpsForecast';
import { useProductCatalog } from '@/hooks/useOpsControl';
import { Plus, Trash2, Star, Pencil, Truck } from 'lucide-react';

interface FormState {
  id?: string;
  catalog_id: string;
  supplier_name: string;
  supplier_contact: string;
  lead_time_days: number;
  moq: number;
  unit_price: number;
  reliability_score: number;
  is_primary: boolean;
  notes: string;
}

const empty: FormState = {
  catalog_id: '',
  supplier_name: '',
  supplier_contact: '',
  lead_time_days: 7,
  moq: 1,
  unit_price: 0,
  reliability_score: 80,
  is_primary: false,
  notes: '',
};

export default function SupplierLeadTimes() {
  const { data: rows = [], isLoading } = useSupplierLeadTimes();
  const { data: catalog = [] } = useProductCatalog();
  const upsert = useUpsertSupplierLeadTime();
  const remove = useDeleteSupplierLeadTime();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const reliable = rows.filter((r) => r.reliability_score >= 90).length;
  const avgLead = rows.length === 0 ? 0 : Math.round(rows.reduce((a, r) => a + r.lead_time_days, 0) / rows.length);

  const reliabilityBadge = (s: number) => {
    if (s >= 90) return <Badge className="bg-success text-success-foreground">{s}% — Auto-exec</Badge>;
    if (s >= 70) return <Badge className="bg-warning text-warning-foreground">{s}%</Badge>;
    return <Badge variant="destructive">{s}%</Badge>;
  };

  const submit = () => {
    if (!form.catalog_id || !form.supplier_name) return;
    upsert.mutate(form, { onSuccess: () => { setOpen(false); setForm(empty); } });
  };

  const edit = (r: typeof rows[number]) => {
    setForm({
      id: r.id,
      catalog_id: r.catalog_id,
      supplier_name: r.supplier_name,
      supplier_contact: r.supplier_contact ?? '',
      lead_time_days: r.lead_time_days,
      moq: r.moq,
      unit_price: r.unit_price ?? 0,
      reliability_score: r.reliability_score,
      is_primary: r.is_primary,
      notes: r.notes ?? '',
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs logistiques</h1>
          <p className="text-muted-foreground">Délais, MOQ et fiabilité — alimente la boucle de réappro automatique</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? 'Modifier' : 'Nouveau fournisseur'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Produit</Label>
                <Select value={form.catalog_id} onValueChange={(v) => setForm({ ...form, catalog_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger>
                  <SelectContent>
                    {catalog.map((c) => <SelectItem key={c.id} value={c.id}>{c.shop_sku} — {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nom fournisseur</Label>
                <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Contact</Label>
                <Input value={form.supplier_contact} onChange={(e) => setForm({ ...form, supplier_contact: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>Lead (j)</Label><Input type="number" value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 0 })} /></div>
                <div className="grid gap-2"><Label>MOQ</Label><Input type="number" value={form.moq} onChange={(e) => setForm({ ...form, moq: parseInt(e.target.value) || 1 })} /></div>
                <div className="grid gap-2"><Label>Prix unit.</Label><Input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid gap-2">
                <Label>Fiabilité (%) — ≥ 90 active l'auto-exécution</Label>
                <Input type="number" min={0} max={100} value={form.reliability_score} onChange={(e) => setForm({ ...form, reliability_score: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Fournisseur principal</Label>
                <Switch checked={form.is_primary} onCheckedChange={(v) => setForm({ ...form, is_primary: v })} />
              </div>
              <div className="grid gap-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={upsert.isPending}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{rows.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Auto-exec éligibles</CardTitle>
            <Star className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-success">{reliable}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lead time moyen</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{avgLead} j</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Catalogue fournisseurs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Lead</TableHead>
                  <TableHead className="text-right">MOQ</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead>Fiabilité</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      <div className="font-mono">{r.product_catalog?.shop_sku}</div>
                      <div className="text-muted-foreground">{r.product_catalog?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.supplier_name}</div>
                      <div className="text-xs text-muted-foreground">{r.supplier_contact ?? '—'}</div>
                    </TableCell>
                    <TableCell className="text-right">{r.lead_time_days} j</TableCell>
                    <TableCell className="text-right">{r.moq}</TableCell>
                    <TableCell className="text-right">{r.unit_price ? `${r.unit_price} ${r.currency}` : '—'}</TableCell>
                    <TableCell>{reliabilityBadge(Number(r.reliability_score))}</TableCell>
                    <TableCell>{r.is_primary ? <Star className="h-4 w-4 text-warning fill-warning" /> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => edit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucun fournisseur configuré</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
