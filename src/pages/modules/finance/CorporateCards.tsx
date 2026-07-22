import { useMemo, useState } from 'react';
import { CreditCard, Plus, Receipt, Loader2, Shield, Lock, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCorporateCards, useCardTransactions, useCreateCardTransaction,
  useApproveTransaction, useRejectTransaction,
} from '@/hooks/usePhase4';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';

const APPROVAL_META: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: 'En attente', className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  approved: { label: 'Approuvée', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Refusée', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

export default function CorporateCards() {
  const { user } = useAuth();
  const { data: cards = [], isLoading } = useCorporateCards();
  const { data: transactions = [] } = useCardTransactions();
  const create = useCreateCardTransaction();
  const approve = useApproveTransaction();
  const reject = useRejectTransaction();
  const { isAdmin, isManager } = useUserRole();
  const canApprove = isAdmin || isManager;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ card_id: '', amount: '', merchant: '', category: 'travel', description: '' });
  const [tab, setTab] = useState<string>('all');
  const [rejectDialog, setRejectDialog] = useState<{ id: string } | null>(null);
  const [reason, setReason] = useState('');

  const submit = () => {
    if (!form.card_id || !form.amount || !form.merchant) return;
    create.mutate({
      card_id: form.card_id,
      amount: Number(form.amount),
      merchant: form.merchant,
      category: form.category,
      description: form.description || null,
      transaction_date: new Date().toISOString(),
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ card_id: '', amount: '', merchant: '', category: 'travel', description: '' });
      },
    });
  };

  const filtered = useMemo(() => {
    if (tab === 'all') return transactions;
    return transactions.filter(t => t.approval_status === tab);
  }, [transactions, tab]);

  const totalMonth = transactions
    .filter(t => new Date(t.transaction_date).getMonth() === new Date().getMonth() && t.approval_status !== 'rejected')
    .reduce((s, t) => s + Number(t.amount), 0);

  const pendingCount = transactions.filter(t => t.approval_status === 'pending').length;

  const confirmReject = () => {
    if (!rejectDialog || !reason.trim()) return;
    reject.mutate({ id: rejectDialog.id, reason }, {
      onSuccess: () => { setRejectDialog(null); setReason(''); },
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><CreditCard className="h-7 w-7 text-primary" /> Carte entreprise</h1>
          <p className="text-muted-foreground mt-1">Dépenses avec workflow d'approbation Finance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={cards.length === 0}><Plus className="h-4 w-4 mr-1" /> Nouvelle dépense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Soumettre une dépense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Carte</Label>
                <select className="w-full border rounded-md h-10 px-3 bg-background" value={form.card_id} onChange={e => setForm({ ...form, card_id: e.target.value })}>
                  <option value="">Choisir…</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.card_number_masked}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Montant (€)</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>Catégorie</Label>
                  <select className="w-full border rounded-md h-10 px-3 bg-background" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="travel">Voyage</option>
                    <option value="meals">Repas</option>
                    <option value="office">Bureau</option>
                    <option value="software">Logiciel</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <div><Label>Commerçant</Label><Input value={form.merchant} onChange={e => setForm({ ...form, merchant: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={create.isPending}>Soumettre pour approbation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : cards.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune carte entreprise activée. Contactez la Finance.</p>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(c => (
              <Card key={c.id} className="border-2 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <CreditCard className="h-8 w-8 text-primary" />
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                  </div>
                  <p className="font-mono text-lg tracking-widest">{c.card_number_masked}</p>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Plafond mensuel</span><span className="font-semibold">{c.monthly_limit} €</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{c.card_type}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Transactions</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  {pendingCount > 0 && <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />{pendingCount} en attente</Badge>}
                  <div><span className="text-muted-foreground">Ce mois :</span> <span className="font-semibold">{totalMonth.toFixed(2)} €</span></div>
                </div>
              </div>
              <Tabs value={tab} onValueChange={setTab} className="mt-3">
                <TabsList>
                  <TabsTrigger value="all">Toutes ({transactions.length})</TabsTrigger>
                  <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
                  <TabsTrigger value="approved">Approuvées</TabsTrigger>
                  <TabsTrigger value="rejected">Refusées</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune transaction.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.slice(0, 50).map(t => {
                    const meta = APPROVAL_META[t.approval_status] ?? APPROVAL_META.pending;
                    const Icon = meta.icon;
                    const isOwn = t.user_id === user?.id;
                    const canDecide = canApprove && t.approval_status === 'pending' && !isOwn;
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 flex-wrap gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <p className="font-medium text-sm">{t.merchant}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.transaction_date).toLocaleDateString('fr-FR')} · {t.category}
                            {t.approval_status === 'rejected' && t.rejection_reason && <> · <span className="text-destructive">{t.rejection_reason}</span></>}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{Number(t.amount).toFixed(2)} €</p>
                            <Badge variant="outline" className={`text-xs ${meta.className}`}><Icon className="h-3 w-3 mr-1" />{meta.label}</Badge>
                          </div>
                          {canDecide && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => setRejectDialog({ id: t.id })}>Refuser</Button>
                              <Button size="sm" onClick={() => approve.mutate({ id: t.id })}>Approuver</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {canApprove && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <p className="text-sm"><span className="font-semibold">Accès Finance :</span> vous validez ou refusez les transactions des collaborateurs.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!rejectDialog} onOpenChange={(o) => { if (!o) { setRejectDialog(null); setReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Motif du refus</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Précisez la raison du refus (obligatoire)" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setReason(''); }}>Annuler</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!reason.trim() || reject.isPending}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
