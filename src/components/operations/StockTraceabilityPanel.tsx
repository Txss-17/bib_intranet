import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Movement = {
  id: string; catalog_id: string; movement_type: string; quantity: number;
  source_partner_id: string | null; target_partner_id: string | null;
  reason: string | null; reference: string | null; created_at: string;
};
const movementLabels: Record<string, string> = {
  inbound: 'Entrée confirmée', outbound: 'Sortie confirmée',
  transfer: 'Transfert', adjustment: 'Correction d’inventaire',
  reservation: 'Réservation', release: 'Libération de réservation',
};

/** Read-only stock audit for authorized Ops / Supplier staff; RLS sets scope. */
export default function StockTraceabilityPanel() {
  const movements = useQuery({
    queryKey: ['ops', 'stock_movements', 'recent'],
    staleTime: 30_000,
    queryFn: async (): Promise<Movement[]> => {
      const { data, error } = await supabase.from('stock_movements')
        .select('id,catalog_id,movement_type,quantity,source_partner_id,target_partner_id,reason,reference,created_at')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Movement[];
    },
  });
  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div>
        <CardTitle className="text-base">Traçabilité des mouvements physiques</CardTitle>
        <p className="mt-2 text-xs text-muted-foreground">Journal Intranet des stocks gérés chez les partenaires logistiques, distinct du stock encore détenu par les fournisseurs et des demandes de vente de BIB Platform.</p>
      </div>
      <Button variant="outline" size="sm" disabled={movements.isFetching} onClick={() => void movements.refetch()}>
        {movements.isFetching ? 'Actualisation…' : 'Actualiser'}
      </Button>
    </CardHeader>
    <CardContent>
      {movements.isLoading ? <p role="status" className="text-sm">Chargement du journal…</p> :
       movements.isError ? <p role="alert" className="text-sm text-destructive">Journal indisponible ou non autorisé. Aucun mouvement ne peut être confirmé.</p> :
       !movements.data?.length ? <p className="text-sm text-muted-foreground">Aucun mouvement enregistré dans le périmètre autorisé.</p> :
       <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
        <thead><tr className="border-b">{['Date', 'Nature', 'Référence catalogue', 'Quantité', 'Pièce / motif'].map(title => <th key={title} className="p-2">{title}</th>)}</tr></thead>
        <tbody>{movements.data.map(row => <tr key={row.id} className="border-b last:border-0">
          <td className="p-2">{new Date(row.created_at).toLocaleString('fr-FR')}</td>
          <td className="p-2">{movementLabels[row.movement_type] || row.movement_type}</td>
          <td className="p-2 font-mono text-xs">{row.catalog_id.slice(0, 8)}</td>
          <td className="p-2 tabular-nums">{row.quantity}</td>
          <td className="p-2">{row.reference || row.reason || 'Non renseigné'}</td>
        </tr>)}</tbody></table></div>}
      <p className="mt-3 text-xs text-muted-foreground">Les 50 mouvements les plus récents sont affichés. Aucun changement de stock n’est déclenché depuis ce journal. Une approbation de réapprovisionnement ne remplace pas une preuve de réception.</p>
    </CardContent>
  </Card>;
}
