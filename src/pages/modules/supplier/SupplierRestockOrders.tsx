import { useMemo, useState } from 'react';
import { ProtectedScreen } from '@/components/ProtectedScreen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ExportButtons } from '@/components/ExportButtons';
import {
  useSupplierRestockOrders, useCreateRestockOrder, useUpdateRestockOrder,
  useSuppliersList, useDestinationOptions, useCatalogProducts,
  type SupplierRestockOrder,
} from '@/hooks/useSupplierRestockOrders';
import { Plus, Send, Package } from 'lucide-react';

const statusLabels: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyé', acknowledged: 'Accusé', in_production: 'En production',
  shipped: 'Expédié', received: 'Reçu', cancelled: 'Annulé',
};
const priorityLabels: Record<string, string> = { high: '🔥 Haute', standard: '🟡 Standard', low: '⚪ Faible' };

function statusColor(s: string) {
  return s === 'received' ? 'bg-green-500/15 text-green-700 dark:text-green-400'
    : s === 'shipped' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    : s === 'cancelled' ? 'bg-red-500/15 text-red-700 dark:text-red-400'
    : s === 'sent' || s === 'acknowledged' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
    : 'bg-muted text-muted-foreground';
}

function NewOrderDialog() {
  const [open, setOpen] = useState(false);
  const { data: suppliers = [] } = useSuppliersList();
  const { data: dests } = useDestinationOptions();
  const { data: products = [] } = useCatalogProducts();
  const create = useCreateRestockOrder();

  const [form, setForm] = useState<any>({
    supplier_id: '', catalog_id: '', product_name: '', quantity: 1,
    destination_type: 'logistics_partner', destination_id: '', destination_name: '',
    priority: 'standard', customization_notes: '', due_date: '',
  });

  const onProductChange = (id: string) => {
    const p = products.find((x: any) => x.id === id);
    setForm((f: any) => ({ ...f, catalog_id: id, product_name: p?.name ?? '', quantity: p?.moq ?? 1 }));
  };
  const onDestChange = (id: string) => {
    const d = dests?.logistics_partners.find(x => x.id === id);
    setForm((f: any) => ({ ...f, destination_id: id, destination_name: d?.name ?? '' }));
  };

  const submit = async () => {
    if (!form.supplier_id || !form.product_name || !form.destination_name || !form.quantity) return;
    await create.mutateAsync({
      supplier_id: form.supplier_id,
      catalog_id: form.catalog_id || null,
      product_name: form.product_name,
      quantity: Number(form.quantity),
      destination_type: form.destination_type,
      destination_id: form.destination_id || null,
      destination_name: form.destination_name,
      priority: form.priority,
      customization_notes: form.customization_notes || null,
      due_date: form.due_date || null,
    } as any);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvel ordre</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nouvel ordre de restock</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Fournisseur</Label>
            <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Produit</Label>
            <Select value={form.catalog_id} onValueChange={onProductChange}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} {p.shop_sku ? `(${p.shop_sku})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantité (MOQ)</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔥 Haute</SelectItem>
                  <SelectItem value="standard">🟡 Standard</SelectItem>
                  <SelectItem value="low">⚪ Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Destination (partenaire logistique)</Label>
            <Select value={form.destination_id} onValueChange={onDestChange}>
              <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {(dests?.logistics_partners ?? []).map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date souhaitée</Label>
            <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div>
            <Label>Personnalisation / notes</Label>
            <Textarea rows={3} value={form.customization_notes} onChange={(e) => setForm({ ...form, customization_notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending}>Créer en brouillon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SupplierRestockOrders() {
  const { data: orders = [], isLoading } = useSupplierRestockOrders();
  const update = useUpdateRestockOrder();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (status !== 'all' && o.status !== status) return false;
      if (priority !== 'all' && o.priority !== priority) return false;
      if (q && !`${o.product_name} ${o.destination_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, search, status, priority]);

  const exportRows = filtered.map(o => ({
    Produit: o.product_name, Quantité: o.quantity, Destination: o.destination_name,
    Statut: statusLabels[o.status] ?? o.status, Priorité: o.priority,
    Date: new Date(o.created_at).toLocaleDateString('fr-FR'),
  }));
  const exportColumns = ['Produit','Quantité','Destination','Statut','Priorité','Date'].map(h => ({ header: h, accessor: h }));

  return (
    <ProtectedScreen screenId="supplier.restock_orders">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Package className="h-7 w-7" /> Ordres de restock</h1>
            <p className="text-muted-foreground">MOQ à réapprovisionner — envoyés au portail fournisseur</p>
          </div>
          <NewOrderDialog />
        </div>

        <Card>
          <CardHeader><CardTitle>Filtres</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Rechercher produit, destination..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="high">🔥 Haute</SelectItem>
                <SelectItem value="standard">🟡 Standard</SelectItem>
                <SelectItem value="low">⚪ Faible</SelectItem>
              </SelectContent>
            </Select>
            <ExportButtons data={exportRows} columns={exportColumns} filename="restock-orders" title="Ordres de restock" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ordres ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground py-8 text-center">Chargement...</p> :
            filtered.length === 0 ? <p className="text-muted-foreground py-8 text-center">Aucun ordre</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Produit</TableHead><TableHead>Qté (MOQ)</TableHead><TableHead>Destination</TableHead>
                  <TableHead>Priorité</TableHead><TableHead>Statut</TableHead><TableHead>Date souhaitée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.product_name}{o.customization_notes && <Badge variant="outline" className="ml-2">Perso</Badge>}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>{o.destination_name}</TableCell>
                      <TableCell>{priorityLabels[o.priority]}</TableCell>
                      <TableCell><Badge className={statusColor(o.status)}>{statusLabels[o.status]}</Badge></TableCell>
                      <TableCell>{o.due_date ? new Date(o.due_date).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {o.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => update.mutate({ id: o.id, patch: { status: 'sent' } })}>
                              <Send className="h-3 w-3 mr-1" />Envoyer
                            </Button>
                          )}
                          {o.status === 'sent' && (
                            <Button size="sm" variant="outline" onClick={() => update.mutate({ id: o.id, patch: { status: 'in_production' } })}>En prod</Button>
                          )}
                          {o.status === 'in_production' && (
                            <Button size="sm" variant="outline" onClick={() => update.mutate({ id: o.id, patch: { status: 'shipped' } })}>Expédié</Button>
                          )}
                          {o.status === 'shipped' && (
                            <Button size="sm" onClick={() => update.mutate({ id: o.id, patch: { status: 'received' } })}>Reçu</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedScreen>
  );
}
