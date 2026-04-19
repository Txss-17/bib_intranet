import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useOrdersWithLifecycle } from '@/hooks/useOpsControl';

const STAGES = ['created', 'confirmed', 'transmitted', 'accepted', 'prepared', 'shipped', 'delivered'] as const;
const STAGE_FR: Record<string, string> = {
  created: 'Créée',
  confirmed: 'Confirmée',
  transmitted: 'Transmise',
  accepted: 'Acceptée',
  prepared: 'Préparée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
};

export default function OrderPipeline() {
  const { data: orders = [], isLoading } = useOrdersWithLifecycle();

  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (orders as Array<{ current_stage?: string }>).filter((o) => o.current_stage === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Cycle de commande</h1>
        <p className="text-muted-foreground">Pipeline complet : de la création à la livraison</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {STAGES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground">{STAGE_FR[s]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° commande</TableHead>
                  <TableHead>SKU boutique</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Créée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders as Array<{
                  id: string;
                  order_number: string;
                  shop_sku?: string;
                  current_stage?: string;
                  total_amount?: number;
                  currency?: string;
                  created_at: string;
                  logistics_partners?: { name: string } | null;
                }>).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.order_number}</TableCell>
                    <TableCell className="font-mono text-xs">{o.shop_sku ?? '—'}</TableCell>
                    <TableCell>{o.logistics_partners?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{STAGE_FR[o.current_stage ?? 'created'] ?? o.current_stage}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.total_amount?.toFixed(2)} {o.currency ?? 'EUR'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
