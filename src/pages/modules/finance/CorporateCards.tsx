import { useState } from 'react';
import { CreditCard, Plus, Receipt, Loader2, Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCorporateCards, useCardTransactions, useCreateCardTransaction } from '@/hooks/usePhase4';
import { useUserRole } from '@/hooks/useUserRole';

export default function CorporateCards() {
  const { data: cards = [], isLoading } = useCorporateCards();
  const { data: transactions = [] } = useCardTransactions();
  const create = useCreateCardTransaction();
  const { isAdmin } = useUserRole();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ card_id: '', amount: '', merchant: '', category: 'travel', description: '' });

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
      }
    });
  };

  const totalMonth = transactions
    .filter(t => new Date(t.transaction_date).getMonth() === new Date().getMonth())
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><CreditCard className="h-7 w-7 text-primary" /> Carte entreprise</h1>
          <p className="text-muted-foreground mt-1">Vos cartes, plafonds et transactions récentes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={cards.length === 0}><Plus className="h-4 w-4 mr-1" /> Nouvelle dépense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter une dépense</DialogTitle></DialogHeader>
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
              <Button onClick={submit} disabled={create.isPending}>Enregistrer</Button>
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
                  {c.allowed_categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {c.allowed_categories.map(cat => <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Transactions</CardTitle>
                <div className="text-sm"><span className="text-muted-foreground">Ce mois :</span> <span className="font-semibold">{totalMonth.toFixed(2)} €</span></div>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune transaction.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 30).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t.merchant}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('fr-FR')} · {t.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{Number(t.amount).toFixed(2)} €</p>
                        <Badge variant="outline" className="text-xs">{t.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <p className="text-sm"><span className="font-semibold">Accès Finance :</span> vous voyez toutes les cartes et transactions du groupe.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
