import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ModuleWorkspace from '@/components/operations/ModuleWorkspace';

type Invoice = {
  id: string; direction: 'incoming'|'outgoing'; origin: string; invoice_number: string;
  counterparty: string; issue_date: string; due_date: string|null; currency: string;
  amount_excl_tax: number; tax_amount: number; total_amount: number;
  description: string; document_reference: string; status: string;
  payment_reference: string|null; payment_date: string|null; recorded_by: string; created_at: string;
};
const db = supabase as unknown as { from(table: string): any };
const cash = (v: number, currency: string) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(v));
const statuses: Record<string, string> = {
  recorded: 'Enregistrée', reviewing: 'En examen', approved: 'Validée',
  paid: 'Règlement justifié', cancelled: 'Annulée',
};
const initial = {
  direction: 'incoming' as Invoice['direction'], invoice_number: '', counterparty: '',
  issue_date: new Date().toISOString().slice(0, 10), due_date: '', currency: 'EUR',
  amount_excl_tax: '', tax_amount: '0', description: '', document_reference: '',
};

function ManualInvoiceRegistry() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const mayRead = can('finance.billing', 'read');
  const mayCreate = can('finance.billing', 'create');
  const mayValidate = can('finance.billing', 'validate');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [direction, setDirection] = useState('all');
  const [payment, setPayment] = useState<Record<string, { reference: string; date: string }>>({});

  const query = useQuery({
    queryKey: ['finance-invoice-register', user?.id], enabled: !!user && mayRead,
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await db.from('finance_invoice_register')
        .select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!user || !mayCreate) throw new Error('Autorisation de création indisponible.');
      const net = Number(form.amount_excl_tax);
      const tax = Number(form.tax_amount);
      if (!Number.isFinite(net) || !Number.isFinite(tax) || net < 0 || tax < 0 || net + tax <= 0
        || !form.invoice_number.trim() || !form.counterparty.trim() || !form.issue_date
        || !form.description.trim() || !form.document_reference.trim()
        || (form.due_date && form.due_date < form.issue_date)) {
        throw new Error('Vérifiez les montants, les dates et les champs obligatoires.');
      }
      const { error } = await db.from('finance_invoice_register').insert({
        direction: form.direction, origin: 'manual', invoice_number: form.invoice_number.trim(),
        counterparty: form.counterparty.trim(), issue_date: form.issue_date,
        due_date: form.due_date || null, currency: form.currency,
        amount_excl_tax: net, tax_amount: tax, description: form.description.trim(),
        document_reference: form.document_reference.trim(), recorded_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Facture enregistrée dans le registre interne');
      setFormOpen(false); setForm(initial);
      void qc.invalidateQueries({ queryKey: ['finance-invoice-register'] });
    },
    onError: (err: Error) => toast.error('Facture non enregistrée', { description: err.message }),
  });
  const transition = useMutation({
    mutationFn: async ({ invoice, status }: { invoice: Invoice; status: string }) => {
      if (!mayValidate || !user || invoice.recorded_by === user.id) {
        throw new Error('Une validation par une autre personne habilitée est nécessaire.');
      }
      const details = payment[invoice.id];
      const updates: Record<string, unknown> = { status };
      if (status === 'paid') {
        if (!details?.reference.trim() || !details.date) throw new Error('Référence et date du règlement requises.');
        updates.payment_reference = details.reference.trim();
        updates.payment_date = details.date;
      }
      const { data, error } = await db.from('finance_invoice_register').update(updates)
        .eq('id', invoice.id).eq('status', invoice.status).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('La facture a été modifiée. Actualisez puis réessayez.');
    },
    onSuccess: () => {
      toast.success('Statut documentaire mis à jour');
      void qc.invalidateQueries({ queryKey: ['finance-invoice-register'] });
    },
    onError: (err: Error) => toast.error('Modification refusée', { description: err.message }),
  });
  if (!mayRead) return <p role="alert">Accès au registre des factures non autorisé.</p>;
  return <div className="space-y-4">
    <Card><CardContent className="space-y-2 p-4 text-sm">
      <h2 className="font-semibold">Registre des factures hors BIB Platform</h2>
      <p className="text-muted-foreground">Enregistrez ici les factures fournisseurs, dépenses d'entreprise et factures commerciales établies hors plateforme. Les documents émis automatiquement par BIB Platform ou Stripe ne doivent pas être ressaisis pour éviter les doublons.</p>
      <p className="text-muted-foreground">Il s'agit d'un registre documentaire interne, pas d'un service d'émission de factures fiscales. La validation d'un règlement n'initie aucun paiement.</p>
      <div className="flex flex-wrap gap-2">
        {mayCreate && <Button onClick={() => setFormOpen(v => !v)}>{formOpen ? 'Fermer' : 'Enregistrer une facture'}</Button>}
        <Button variant="outline" asChild><Link to="/pole/finance/transactions">Transactions</Link></Button>
        <Button variant="outline" asChild><Link to="/pole/finance/reconciliation">Rapprochement</Link></Button>
      </div>
    </CardContent></Card>
    {formOpen && mayCreate && <form className="space-y-3 rounded-lg border p-4" onSubmit={e => { e.preventDefault(); create.mutate(); }}>
      <h3 className="font-semibold">Nouvelle facture hors plateforme</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div><Label htmlFor="invoice-direction">Nature *</Label><select id="invoice-direction" className="h-10 w-full rounded-md border bg-background px-3" value={form.direction} onChange={e => setForm(v => ({ ...v, direction: e.target.value as Invoice['direction'] }))}><option value="incoming">Facture reçue (achat/dépense)</option><option value="outgoing">Facture émise (vente/recette)</option></select></div>
        <div><Label htmlFor="invoice-number">Numéro de facture *</Label><Input id="invoice-number" required maxLength={100} value={form.invoice_number} onChange={e => setForm(v => ({ ...v, invoice_number: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-party">Tiers (fournisseur/client) *</Label><Input id="invoice-party" required maxLength={250} value={form.counterparty} onChange={e => setForm(v => ({ ...v, counterparty: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-issue">Date de facture *</Label><Input id="invoice-issue" type="date" required value={form.issue_date} onChange={e => setForm(v => ({ ...v, issue_date: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-due">Échéance</Label><Input id="invoice-due" type="date" min={form.issue_date} value={form.due_date} onChange={e => setForm(v => ({ ...v, due_date: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-currency">Devise</Label><select id="invoice-currency" className="h-10 w-full rounded-md border bg-background px-3" value={form.currency} onChange={e => setForm(v => ({ ...v, currency: e.target.value }))}><option value="EUR">EUR</option><option value="XAF">XAF</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div>
        <div><Label htmlFor="invoice-net">Montant HT *</Label><Input id="invoice-net" type="number" step="0.01" min="0" required value={form.amount_excl_tax} onChange={e => setForm(v => ({ ...v, amount_excl_tax: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-tax">Montant TVA / taxes *</Label><Input id="invoice-tax" type="number" step="0.01" min="0" required value={form.tax_amount} onChange={e => setForm(v => ({ ...v, tax_amount: e.target.value }))}/></div>
        <div><Label htmlFor="invoice-ref">Référence documentaire *</Label><Input id="invoice-ref" required maxLength={500} placeholder="Identifiant du justificatif conservé dans Drive BIB" value={form.document_reference} onChange={e => setForm(v => ({ ...v, document_reference: e.target.value }))}/></div>
      </div>
      <div><Label htmlFor="invoice-desc">Objet / prestation *</Label><Input id="invoice-desc" required maxLength={2000} value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))}/></div>
      <p className="text-sm">Total TTC : <strong>{Number(form.amount_excl_tax || 0) + Number(form.tax_amount || 0)} {form.currency}</strong> (calcul de saisie, pas une détermination automatique de TVA)</p>
      <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Enregistrement…' : 'Enregistrer la facture'}</Button>
    </form>}
    {query.isLoading && <p role="status">Chargement du registre…</p>}
    {query.isError && <p role="alert">Registre de factures indisponible. La migration de base et les permissions doivent être vérifiées. <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></p>}
    {!query.isLoading && !query.isError && <>
      <div className="flex flex-wrap gap-2"><Label htmlFor="invoice-filter">Type</Label><select id="invoice-filter" value={direction} onChange={e => setDirection(e.target.value)} className="h-10 rounded-md border bg-background px-3"><option value="all">Toutes</option><option value="incoming">Reçues</option><option value="outgoing">Émises</option></select></div>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1100px] text-left text-sm">
        <thead className="border-b bg-muted/40"><tr>{['Type','Facture','Tiers','Émission / échéance','Montants','Référence justificative','Statut','Validation / règlement'].map(v => <th key={v} className="p-3">{v}</th>)}</tr></thead>
        <tbody>{(query.data ?? []).filter(v => direction === 'all' || v.direction === direction).map(invoice => <tr key={invoice.id} className="border-b align-top last:border-0">
          <td className="p-3">{invoice.direction === 'incoming' ? 'Reçue' : 'Émise'}</td>
          <td className="p-3 font-mono">{invoice.invoice_number}</td>
          <td className="p-3">{invoice.counterparty}<p className="text-xs text-muted-foreground">{invoice.description}</p></td>
          <td className="p-3">{invoice.issue_date}<p className="text-xs text-muted-foreground">Échéance : {invoice.due_date ?? '—'}</p></td>
          <td className="p-3">{cash(invoice.total_amount, invoice.currency)}<p className="text-xs text-muted-foreground">HT {cash(invoice.amount_excl_tax, invoice.currency)} · Taxes {cash(invoice.tax_amount, invoice.currency)}</p></td>
          <td className="p-3 max-w-56 break-all text-xs">{invoice.document_reference}</td>
          <td className="p-3">{statuses[invoice.status] ?? invoice.status}{invoice.payment_reference && <p className="text-xs text-muted-foreground">Preuve : {invoice.payment_reference}</p>}</td>
          <td className="p-3">
            {mayValidate && invoice.recorded_by !== user?.id && invoice.status === 'recorded' && <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ invoice, status: 'reviewing' })}>Examiner</Button><Button size="sm" variant="outline" disabled={transition.isPending} onClick={() => transition.mutate({ invoice, status: 'cancelled' })}>Annuler</Button></div>}
            {mayValidate && invoice.recorded_by !== user?.id && invoice.status === 'reviewing' && <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate({ invoice, status: 'approved' })}>Valider</Button>}
            {mayValidate && invoice.recorded_by !== user?.id && invoice.status === 'approved' && <div className="space-y-2">
              <Input aria-label="Référence du règlement" placeholder="Référence règlement" value={payment[invoice.id]?.reference ?? ''} onChange={e => setPayment(v => ({ ...v, [invoice.id]: { reference: e.target.value, date: v[invoice.id]?.date ?? '' } }))}/>
              <Input aria-label="Date du règlement" type="date" value={payment[invoice.id]?.date ?? ''} onChange={e => setPayment(v => ({ ...v, [invoice.id]: { reference: v[invoice.id]?.reference ?? '', date: e.target.value } }))}/>
              <Button size="sm" disabled={transition.isPending} onClick={() => transition.mutate({ invoice, status: 'paid' })}>Justifier règlement</Button>
            </div>}
          </td>
        </tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">Registre limité aux 200 dernières factures manuelles. Le statut « Règlement justifié » repose sur une référence et une date déclarées ; il n'atteste pas d'un rapprochement bancaire. Les corrections de factures exigent un processus documentaire distinct.</p>
    </>}
  </div>;
}

export default function Billing() {
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-semibold">Facturation BIB</h1><p className="text-sm text-muted-foreground">Suivi des factures reçues et émises hors plateforme, distinct des contrôles de facturation commerciale BIB Platform.</p></header>
    <Tabs defaultValue="register" className="space-y-4">
      <TabsList><TabsTrigger value="register">Registre des factures</TabsTrigger><TabsTrigger value="checks">Contrôles de facturation Platform</TabsTrigger></TabsList>
      <TabsContent value="register"><ManualInvoiceRegistry/></TabsContent>
      <TabsContent value="checks"><ModuleWorkspace pageId="finance.billing"/></TabsContent>
    </Tabs>
  </div>;
}
