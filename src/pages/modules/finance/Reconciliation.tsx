import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GitCompare, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const db = supabase as any;

export const GAP_LABELS: Record<string, string> = {
  stripe_manquant: 'Paiement Stripe absent', ecart_stripe: 'Écart montant Stripe',
  facture_manquante: 'Facture absente', ecart_facture: 'Écart montant facture',
  boutique_manquante: 'Boutique non rattachée', ecart_reversement: 'Écart reversement',
  reversement_manquant: 'Reversement absent', litige: 'Litige Stripe',
};
const STATUS_LABELS: Record<string, string> = {
  matched: 'Rapproché', gap: 'Écart à examiner', reviewing: 'En examen', resolved: 'Résolu', ignored: 'Justifié / ignoré',
};

interface Item {
  id: string; order_id: string; shop_id: string | null; order_amount: number; stripe_amount: number | null;
  stripe_fee: number | null; invoice_amount: number | null; payout_amount: number | null; expected_payout: number | null;
  commission_amount: number | null; gaps: string[]; status: string; review_note: string | null; reviewed_at: string | null;
  anomaly_id: string | null; computed_at: string;
  orders?: { order_number: string; status: string; ordered_at: string | null } | null;
  shops?: { name: string } | null;
}

const eur = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n));

export default function Reconciliation() {
  const { user } = useAuth() as any;
  const qc = useQueryClient();
  const [status, setStatus] = useState('open');
  const [gap, setGap] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Item | null>(null);
  const [note, setNote] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['reconciliation'],
    queryFn: async () => {
      const { data, error } = await db.from('reconciliation_items')
        .select('*, orders(order_number, status, ordered_at), shops(name)').order('computed_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Item[];
    },
  });

  const run = useMutation({
    mutationFn: async () => { const { data, error } = await db.rpc('run_reconciliation'); if (error) throw error; return data as number; },
    onSuccess: (n) => { toast.success('Rapprochement recalculé', { description: `${n} commande(s) analysée(s)` }); qc.invalidateQueries({ queryKey: ['reconciliation'] }); },
    onError: (e: Error) => toast.error('Rapprochement', { description: e.message }),
  });

  const review = useMutation({
    mutationFn: async ({ it, next, escalate }: { it: Item; next: string; escalate?: boolean }) => {
      let anomaly_id = it.anomaly_id;
      if (escalate && !anomaly_id) {
        const { data, error } = await db.from('anomalies').insert({
          source: it.gaps.some((g) => g.includes('stripe') || g === 'litige') ? 'stripe' : it.gaps.some((g) => g.includes('facture')) ? 'invoices' : 'payments',
          type: 'Écart de rapprochement', severity: it.gaps.includes('litige') ? 'high' : 'medium',
          title: `Écart rapprochement — commande ${it.orders?.order_number ?? it.order_id.slice(0, 8)}`,
          description: `${it.gaps.map((g) => GAP_LABELS[g] ?? g).join(', ')}.${note ? ` Note Finance : ${note}` : ''}`,
          object_type: 'commande', object_id: it.order_id, owner_id: user?.id ?? null,
        }).select('id').single();
        if (error) throw error;
        anomaly_id = data.id;
      }
      const { error } = await db.from('reconciliation_items').update({
        status: next, review_note: note || it.review_note, reviewed_by: user?.id, reviewed_at: new Date().toISOString(), anomaly_id,
      }).eq('id', it.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Écart mis à jour'); setNote(''); setSel(null); qc.invalidateQueries({ queryKey: ['reconciliation'] }); qc.invalidateQueries({ queryKey: ['anomalies'] }); },
    onError: (e: Error) => toast.error('Écart', { description: e.message }),
  });

  const filtered = useMemo(() => items.filter((i) =>
    (status === 'all' || (status === 'open' ? ['gap', 'reviewing'].includes(i.status) : i.status === status)) &&
    (gap === 'all' || i.gaps.includes(gap)) &&
    (!q || `${i.orders?.order_number ?? ''} ${i.shops?.name ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [items, status, gap, q]);

  const count = (fn: (i: Item) => boolean) => items.filter(fn).length;
  const gapTotal = items.filter((i) => ['gap', 'reviewing'].includes(i.status))
    .reduce((s, i) => s + Math.abs(Number(i.order_amount) - Number(i.stripe_amount ?? 0)), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><GitCompare className="h-5 w-5" />Rapprochement</h1>
          <p className="text-sm text-muted-foreground">Commande B.I.B ↔ paiement Stripe ↔ facture ↔ reversement marchand. La commande B.I.B fait foi.</p>
        </div>
        <Button onClick={() => run.mutate()} disabled={run.isPending}><RefreshCw className={`mr-2 h-4 w-4 ${run.isPending ? 'animate-spin' : ''}`} />Recalculer</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Commandes analysées', items.length],
          ['Rapprochées', count((i) => i.status === 'matched')],
          ['Écarts à examiner', count((i) => i.status === 'gap')],
          ['En examen', count((i) => i.status === 'reviewing')],
          ['Écart Stripe cumulé', eur(gapTotal)],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Commande ou boutique…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">À traiter</SelectItem>
            <SelectItem value="all">Tous</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={gap} onValueChange={setGap}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types d'écart</SelectItem>
            {Object.entries(GAP_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Chargement…</p> : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {items.length === 0 ? 'Aucune donnée : cliquez sur « Recalculer » une fois les commandes, paiements et factures reçus.' : 'Aucun écart pour ces filtres.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>{['Commande', 'Boutique', 'Commande', 'Stripe', 'Facture', 'Reversement', 'Écarts', 'Statut'].map((h, i) => <th key={i} className="p-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((i) => (
                  <tr key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSel(i); setNote(i.review_note ?? ''); }}>
                    <td className="p-3 font-medium">{i.orders?.order_number ?? i.order_id.slice(0, 8)}</td>
                    <td className="p-3">{i.shops?.name ?? '—'}</td>
                    <td className="p-3">{eur(i.order_amount)}</td>
                    <td className="p-3">{eur(i.stripe_amount)}</td>
                    <td className="p-3">{eur(i.invoice_amount)}</td>
                    <td className="p-3">{eur(i.payout_amount)}</td>
                    <td className="p-3"><div className="flex flex-wrap gap-1">{i.gaps.map((g) => <Badge key={g} variant="destructive">{GAP_LABELS[g] ?? g}</Badge>)}</div></td>
                    <td className="p-3"><Badge variant="outline">{STATUS_LABELS[i.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader><SheetTitle>Commande {sel.orders?.order_number ?? sel.order_id.slice(0, 8)}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {[
                    ['Montant commande (référence)', eur(sel.order_amount)],
                    ['Encaissé Stripe (net des remboursements)', eur(sel.stripe_amount)],
                    ['Frais Stripe', eur(sel.stripe_fee)],
                    ['Factures (moins avoirs)', eur(sel.invoice_amount)],
                    ['Commission B.I.B', eur(sel.commission_amount)],
                    ['Reversement attendu', eur(sel.expected_payout)],
                    ['Reversement enregistré', eur(sel.payout_amount)],
                    ['Calculé le', format(new Date(sel.computed_at), 'dd MMM yyyy HH:mm', { locale: fr })],
                  ].map(([l, v]) => (<div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v}</p></div>))}
                </div>
                <div className="flex flex-wrap gap-1">{sel.gaps.length ? sel.gaps.map((g) => <Badge key={g} variant="destructive">{GAP_LABELS[g] ?? g}</Badge>) : <Badge variant="outline">Aucun écart</Badge>}</div>
                {sel.anomaly_id && <p className="text-xs text-muted-foreground">Une anomalie est liée à cet écart (Opérations → Anomalies).</p>}
                <Textarea placeholder="Note d'examen (obligatoire pour résoudre ou justifier)" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={review.isPending} onClick={() => review.mutate({ it: sel, next: 'reviewing' })}>Prendre en examen</Button>
                  <Button size="sm" disabled={review.isPending || !note} onClick={() => review.mutate({ it: sel, next: 'resolved' })}>Marquer résolu</Button>
                  <Button size="sm" variant="outline" disabled={review.isPending || !note} onClick={() => review.mutate({ it: sel, next: 'ignored' })}>Justifier / ignorer</Button>
                  {!sel.anomaly_id && sel.gaps.length > 0 && (
                    <Button size="sm" variant="destructive" disabled={review.isPending} onClick={() => review.mutate({ it: sel, next: 'reviewing', escalate: true })}>Créer une anomalie</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
