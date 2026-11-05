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
import {MerchantSupplyWorkspace} from '@/components/supply/MerchantSupplyWorkspace';
import {useMerchantSupply} from '@/hooks/useMerchantSupply';

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

interface NewOrderForm {
  supplier_id: string;
  catalog_id: string;
  product_name: string;
  quantity: number | string;
  destination_type: 'warehouse' | 'logistics_partner';
  destination_id: string;
  destination_name: string;
  priority: 'high' | 'standard' | 'low';
  customization_notes: string;
  due_date: string;
}

function NewOrderDialog() {
  const [open,setOpen]=useState(false),[quoteId,setQuoteId]=useState(''),[destinationId,setDestinationId]=useState(''),[notes,setNotes]=useState('');
  const {data:supply}=useMerchantSupply();
  const {data:dests}=useDestinationOptions();
  const create=useCreateRestockOrder();
  const quotes=supply?.quotes.filter(q=>q.state==='accepted')??[];
  const quote=quotes.find(q=>q.id===quoteId),destination=dests?.logistics_partners.find(d=>d.id===destinationId);
  async function submit(){
    if(!quote||!destination)return;
    await create.mutateAsync({supply_quote_id:quote.id,supplier_id:quote.payload.supplier_id,product_name:quote.product_name,quantity:quote.payload.quantity,
      destination_type:'logistics_partner',destination_id:destination.id,destination_name:destination.name,customization_notes:notes||null});
    setOpen(false);
  }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Nouvel ordre</Button></DialogTrigger><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Approvisionnement rattaché à un devis accepté</DialogTitle></DialogHeader><div className="space-y-4">
    <p className="text-sm text-muted-foreground">Le marchand est l’acheteur. Le fournisseur conserve son rôle de vendeur. Le stock n’est crédité qu’après réception validée ; la production exige une couverture financière.</p>
    <Label className="block space-y-2"><span>Devis accepté par le marchand</span><select className="h-10 w-full rounded-md border bg-background px-3" value={quoteId} onChange={e=>setQuoteId(e.target.value)}><option value="">Choisir un devis</option>{quotes.map(q=><option key={q.id} value={q.id}>{q.reference??q.id.slice(0,8)} · {q.product_name} × {q.payload.quantity} · {q.payload.parties.merchant.legal_name}</option>)}</select></Label>
    <Label className="block space-y-2"><span>Destination logistique BIB</span><select className="h-10 w-full rounded-md border bg-background px-3" value={destinationId} onChange={e=>setDestinationId(e.target.value)}><option value="">Choisir un partenaire</option>{dests?.logistics_partners.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></Label>
    <Label className="block space-y-2"><span>Instructions complémentaires</span><Textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000}/></Label>
  </div><DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Annuler</Button><Button disabled={!quote||!destination||create.isPending} onClick={submit}>Créer le brouillon</Button></DialogFooter></DialogContent></Dialog>;
}

export default function SupplierRestockOrders() {
  const { data: orders = [], isLoading, isError, refetch } = useSupplierRestockOrders();
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
        <MerchantSupplyWorkspace />
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
            {!isLoading && !isError && <ExportButtons data={exportRows} columns={exportColumns} filename="restock-orders" title="Ordres de restock" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ordres ({isError ? "—" : filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-muted-foreground py-8 text-center">Chargement...</p> :
            isError ? <div role="alert" className="p-4 text-sm text-destructive">Ordres indisponibles. <Button size="sm" variant="outline" onClick={() => void refetch()}>Réessayer</Button></div> :
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
