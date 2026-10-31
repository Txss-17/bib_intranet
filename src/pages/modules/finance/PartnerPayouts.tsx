import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WalletCards, ShieldCheck, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Payout = {
  id: string;
  reference: string;
  party: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  source: 'merchant' | 'supplier';
};
const PAGE_SIZE = 100;
function money(amount: number, currency: string) {
  if (!/^[A-Z]{3}$/.test(currency)) return `${amount.toLocaleString('fr-FR')} ${currency || '(devise inconnue)'}`;
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toLocaleString('fr-FR')} ${currency}`; }
}

export default function PartnerPayouts() {
  const { canViewPage } = usePermissions();
  const [source, setSource] = useState<'merchant' | 'supplier'>('merchant');
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ['finance', 'partner-payouts', source, page],
    enabled: canViewPage('finance.payouts'),
    queryFn: async (): Promise<{ rows: Payout[]; hasMore: boolean }> => {
      const start = page * PAGE_SIZE;
      if (source === 'merchant') {
        const { data, error } = await supabase.from('merchant_payouts')
          .select('id, shop_id, order_id, amount, currency, status, stripe_payout_id, paid_at, created_at, shops(name)')
          .order('created_at', { ascending: false })
          .range(start, start + PAGE_SIZE);
        if (error) throw error;
        const rows = data ?? [];
        return { hasMore: rows.length > PAGE_SIZE, rows: rows.slice(0, PAGE_SIZE).map(row => ({
          id: row.id, reference: row.stripe_payout_id || row.order_id || row.id,
          party: row.shops?.name || row.shop_id || 'Boutique non renseignée', amount: Number(row.amount || 0),
          currency: String(row.currency || '').toUpperCase(), status: row.status || 'inconnu',
          paidAt: row.paid_at, source: 'merchant',
        })) };
      }
      const { data, error } = await supabase.from('supplier_payments')
        .select('id, supplier_id, invoice_number, amount, currency, status, due_date, paid_date, created_at, suppliers(name)')
        .order('created_at', { ascending: false })
        .range(start, start + PAGE_SIZE);
      if (error) throw error;
      const rows = data ?? [];
      return { hasMore: rows.length > PAGE_SIZE, rows: rows.slice(0, PAGE_SIZE).map(row => ({
        id: row.id, reference: row.invoice_number || row.id,
        party: row.suppliers?.name || row.supplier_id || 'Fournisseur non renseigné', amount: Number(row.amount || 0),
        currency: String(row.currency || '').toUpperCase(), status: row.status || 'inconnu',
        paidAt: row.paid_date, source: 'supplier',
      })) };
    },
  });
  if (!canViewPage('finance.payouts')) return <p role="alert">Accès non autorisé aux paiements partenaires.</p>;

  return <div className="space-y-6">
    <header>
      <h1 className="flex items-center gap-2 text-2xl font-semibold"><WalletCards className="h-6 w-6" />Paiements partenaires BIB</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Suivi séparé des reversements aux marchands issus des commandes BIB et des règlements fournisseurs.
        Une référence Stripe ne prouve pas à elle seule qu'un versement a été reçu : confirmer le type d'identifiant, le statut effectif et les justificatifs. Cette page ne déclenche aucun paiement ni remboursement.
      </p>
    </header>
    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
      <p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="h-4 w-4" />Séparation des responsabilités</p>
      Le marchand reste vendeur juridique vis-à-vis du client ; les règlements commerciaux et les prestations logistiques suivent les contrats correspondants.
      Toute validation financière nécessite une pièce justificative et les autorisations prévues.
    </div>
    <Tabs value={source} onValueChange={(value) => { setSource(value as 'merchant' | 'supplier'); setPage(0); }}>
      <TabsList><TabsTrigger value="merchant"><Banknote className="mr-2 h-4 w-4" />Versements marchands</TabsTrigger>
        <TabsTrigger value="supplier">Règlements fournisseurs</TabsTrigger></TabsList>
      <TabsContent value={source} className="space-y-3">
        {query.isLoading && <p role="status">Chargement des mouvements…</p>}
        {query.isError && <p role="alert" className="rounded border p-3 text-sm text-destructive">
          Les mouvements financiers ne sont pas accessibles. <Button variant="outline" size="sm" onClick={() => void query.refetch()}>Réessayer</Button>
        </p>}
        {!query.isLoading && !query.isError && <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>{source === 'merchant' ? 'Boutique' : 'Fournisseur'}</TableHead><TableHead>Montant</TableHead><TableHead>Statut source</TableHead><TableHead>Date de paiement</TableHead></TableRow></TableHeader>
            <TableBody>
              {(query.data?.rows ?? []).map(item => <TableRow key={item.id}>
                <TableCell className="max-w-56 truncate font-mono text-xs" title={item.reference}>{item.reference}</TableCell>
                <TableCell className="font-mono text-xs">{item.party}</TableCell>
                <TableCell>{money(item.amount, item.currency)}</TableCell>
                <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                <TableCell>{item.paidAt || 'Non confirmé'}</TableCell>
              </TableRow>)}
              {!query.data?.rows.length && <TableRow><TableCell colSpan={5} className="p-6 text-center text-muted-foreground">Aucun mouvement enregistré dans cette vue.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>}
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Page {page + 1} · {PAGE_SIZE} mouvements maximum par page</span>
          <Button variant="outline" size="sm" disabled={page === 0 || query.isLoading || query.isError} onClick={() => setPage(value => Math.max(0, value - 1))}>Précédent</Button>
          <Button variant="outline" size="sm" disabled={!query.data?.hasMore || query.isLoading || query.isError} onClick={() => setPage(value => value + 1)}>Suivant</Button>
        </div>
      </TabsContent>
    </Tabs>
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">Contrôle, justificatifs et décisions</h2>
      <p className="text-sm text-muted-foreground">Registre interne des écarts, responsabilités, échéances et preuves ; indépendant des opérations bancaires.</p>
      <ModuleWorkspace pageId="finance.payouts" />
    </section>
  </div>;
}
