import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCashflows, useCreateCashflow } from '@/hooks/useFinance';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportButtons } from '@/components/ExportButtons';

type SourceFilter = 'all' | 'platform' | 'internal';
type FinancialOverviewProps = { title?: string; mode?: 'transactions' | 'treasury' };
const value = (amount: number) => amount.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const sourceLabel = (source: string | null | undefined) => source === 'platform'
  ? 'BIB Platform (import)' : source ? `Interne / autre : ${source}` : 'Source non identifiée';

export default function FinancialOverview({ title = 'Pilotage financier', mode = 'treasury' }: FinancialOverviewProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<SourceFilter>(mode === 'transactions' ? 'platform' : 'all');
  const { can } = usePermissions();
  const { user } = useAuth();
  const create = useCreateCashflow();
  const mayCreate = can('finance.cashflow', 'create') || can('finance.transactions', 'create');
  const [entryOpen, setEntryOpen] = useState(false);
  const [entry, setEntry] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    currency: 'EUR',
    transaction_date: new Date().toISOString().slice(0, 10),
    reference: '',
    description: '',
  });
  const submitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(entry.amount);
    if (!user || !mayCreate || !entry.category.trim() || !entry.description.trim()
      || !entry.reference.trim() || !entry.transaction_date
      || !Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(entry.currency)) {
      toast.error('Complétez les champs obligatoires avec un montant strictement positif.');
      return;
    }
    try {
      await create.mutateAsync({
        type: entry.type, category: entry.category.trim(), amount,
        currency: entry.currency, transaction_date: entry.transaction_date,
        reference: entry.reference.trim(), description: entry.description.trim(),
        source: 'manual', recorded_by: user.id,
      });
      setEntryOpen(false);
      setSource('internal');
      setEntry(previous => ({ ...previous, amount: '', reference: '', description: '' }));
      toast.success('Écriture manuelle enregistrée');
    } catch (error) {
      toast.error('Enregistrement impossible', { description: error instanceof Error ? error.message : 'Vérifiez les permissions Finance.' });
    }
  };
  const query = useCashflows({ startDate: start || undefined, endDate: end || undefined });
  const rows = useMemo(() => (query.data ?? []).filter(r => {
    if (source === 'platform' && r.source !== 'platform') return false;
    if (source === 'internal' && r.source === 'platform') return false;
    const q = search.toLocaleLowerCase('fr-FR').trim();
    return !q || `${r.reference ?? ''} ${r.description ?? ''} ${r.category} ${r.platform_id ?? ''}`
      .toLocaleLowerCase('fr-FR').includes(q);
  }), [query.data, source, search]);

  const currencies = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    for (const r of rows) {
      const key = r.currency || 'Devise non renseignée';
      const item = map.get(key) ?? { income: 0, expense: 0, count: 0 };
      if (r.type === 'income') item.income += Number(r.amount);
      if (r.type === 'expense') item.expense += Number(r.amount);
      item.count++;
      map.set(key, item);
    }
    return [...map.entries()];
  }, [rows]);

  const columns = [
    { header: 'Date', accessor: 'transaction_date' },
    { header: 'Origine', accessor: 'source' },
    { header: 'Identifiant Platform', accessor: 'platform_id' },
    { header: 'Référence', accessor: 'reference' },
    { header: 'Catégorie', accessor: 'category' },
    { header: 'Type', accessor: 'type' },
    { header: 'Montant', accessor: 'amount' },
    { header: 'Devise', accessor: 'currency' },
    { header: 'Dernière synchro', accessor: 'platform_synced_at' },
  ];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {mode === 'transactions'
            ? 'Registre des opérations reçues de BIB Platform, avec identification de leur origine et date de synchronisation. Il ne remplace pas le journal Stripe.'
            : 'Registre des mouvements financiers par devise. Le net affiché est une somme d’écritures, pas un solde bancaire ou un montant mobilisable.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {mayCreate && <Button type="button" onClick={() => setEntryOpen(open => !open)}>{entryOpen ? 'Fermer la saisie' : 'Nouvelle entrée / sortie manuelle'}</Button>}
        {!query.isLoading && !query.isError && <ExportButtons filename={mode === 'transactions' ? 'transactions-bib' : 'flux-tresorerie-bib'} title={title} columns={columns} data={rows}/>}
      </div>
    </div>

    {entryOpen && mayCreate && <form onSubmit={submitEntry} className="space-y-4 rounded-lg border p-4">
      <div><h3 className="font-semibold">Enregistrer une opération hors plateforme</h3>
        <p className="text-xs text-muted-foreground">Saisie interne uniquement : ne recopiez pas une opération déjà importée de Stripe ou BIB Platform. Un justificatif et une vérification comptable restent nécessaires.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div><Label htmlFor="manual-type">Nature *</Label><select id="manual-type" className="h-10 w-full rounded-md border bg-background px-3" value={entry.type} onChange={event => setEntry(p => ({ ...p, type: event.target.value as 'income' | 'expense' }))}><option value="income">Entrée d’argent</option><option value="expense">Sortie d’argent</option></select></div>
        <div><Label htmlFor="manual-amount">Montant *</Label><Input id="manual-amount" type="number" step="0.01" min="0.01" required value={entry.amount} onChange={event => setEntry(p => ({ ...p, amount: event.target.value }))}/></div>
        <div><Label htmlFor="manual-currency">Devise *</Label><select id="manual-currency" className="h-10 w-full rounded-md border bg-background px-3" value={entry.currency} onChange={event => setEntry(p => ({ ...p, currency: event.target.value }))}><option value="EUR">EUR</option><option value="XAF">XAF</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div>
        <div><Label htmlFor="manual-date">Date de l’opération *</Label><Input id="manual-date" type="date" required value={entry.transaction_date} onChange={event => setEntry(p => ({ ...p, transaction_date: event.target.value }))}/></div>
        <div><Label htmlFor="manual-category">Catégorie *</Label><Input id="manual-category" required maxLength={100} placeholder="Ex. loyer, apport, remboursement de frais" value={entry.category} onChange={event => setEntry(p => ({ ...p, category: event.target.value }))}/></div>
        <div><Label htmlFor="manual-reference">Référence justificative *</Label><Input id="manual-reference" required maxLength={150} placeholder="Ex. facture, virement, reçu" value={entry.reference} onChange={event => setEntry(p => ({ ...p, reference: event.target.value }))}/></div>
      </div>
      <div><Label htmlFor="manual-description">Motif / description *</Label><Input id="manual-description" required maxLength={500} value={entry.description} onChange={event => setEntry(p => ({ ...p, description: event.target.value }))}/></div>
      <Button type="submit" disabled={create.isPending || !user}>{create.isPending ? 'Enregistrement…' : 'Enregistrer l’opération manuelle'}</Button>
    </form>}

    <div className="flex flex-wrap items-end gap-3">
      <div><Label htmlFor={`${mode}-start`}>Du</Label><Input id={`${mode}-start`} type="date" value={start} onChange={e => setStart(e.target.value)}/></div>
      <div><Label htmlFor={`${mode}-end`}>Au</Label><Input id={`${mode}-end`} type="date" value={end} onChange={e => setEnd(e.target.value)}/></div>
      <div className="min-w-48 flex-1"><Label htmlFor={`${mode}-search`}>Recherche</Label><Input id={`${mode}-search`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Commande, référence, catégorie…"/></div>
      <div className="min-w-52">
        <Label htmlFor={`${mode}-source`}>Origine des écritures</Label>
        <select id={`${mode}-source`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={source} onChange={e => setSource(e.target.value as SourceFilter)}>
          <option value="all">Toutes les sources</option>
          <option value="platform">BIB Platform uniquement</option>
          <option value="internal">Internes et autres</option>
        </select>
      </div>
    </div>

    {query.isLoading && <p role="status">Chargement des écritures…</p>}
    {query.isError && <p role="alert" className="text-destructive">Le registre financier est indisponible. Aucun montant n'est confirmé. <Button type="button" variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></p>}

    {!query.isLoading && !query.isError && <>
      <div className="grid gap-3 md:grid-cols-3">
        {currencies.map(([currency, amounts]) => <Card key={currency}><CardContent className="space-y-1 p-4">
          <h3 className="font-semibold">{currency} — {amounts.count} écriture(s)</h3>
          <p className="text-sm">Entrées enregistrées : {value(amounts.income)}</p>
          <p className="text-sm">Sorties enregistrées : {value(amounts.expense)}</p>
          <p className="text-sm font-semibold">Net du registre filtré : {value(amounts.income - amounts.expense)}</p>
        </CardContent></Card>)}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="border-b bg-muted/40"><tr>
            {['Date', 'Origine', 'Référence / opération', 'Catégorie', 'Type', 'Montant', 'Devise', 'Synchronisation'].map(h => <th className="p-3" key={h}>{h}</th>)}
          </tr></thead>
          <tbody>{rows.map(r => <tr className="border-b last:border-0" key={r.id}>
            <td className="p-3">{r.transaction_date}</td>
            <td className="p-3">{sourceLabel(r.source)}</td>
            <td className="p-3"><span className="font-medium">{r.reference || r.description || '—'}</span>{r.platform_id && <span className="block max-w-44 truncate font-mono text-xs text-muted-foreground" title={r.platform_id}>Platform : {r.platform_id}</span>}</td>
            <td className="p-3">{r.category}</td>
            <td className="p-3">{r.type === 'income' ? 'Entrée' : r.type === 'expense' ? 'Sortie' : r.type}</td>
            <td className="p-3 tabular-nums">{value(Number(r.amount))}</td>
            <td className="p-3">{r.currency || 'Non renseignée'}</td>
            <td className="p-3 text-xs">{r.platform_synced_at ? new Date(r.platform_synced_at).toLocaleString('fr-FR') : 'Non renseignée'}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{source === 'platform' ? 'Aucune écriture Platform disponible pour ces filtres. Vérifier la synchronisation avant de conclure à une absence de transactions.' : 'Aucune écriture disponible pour ces filtres.'}</p>}
      <p className="text-xs text-muted-foreground">
        Attention : un import Platform n'est pas une confirmation de règlement bancaire. Les entrées destinées aux marchands et les opérations non dénouées ne doivent pas être assimilées à la trésorerie propre de BIB. Les totaux ne sont pas additionnés entre devises.
      </p>
    </>}
    <div className="flex flex-wrap gap-2">
      {[['/pole/finance/transactions', 'Transactions'], ['/pole/finance/payouts', 'Paiements partenaires'], ['/pole/finance/reconciliation', 'Rapprochement'], ['/pole/finance/guarantee', 'Fonds de garantie']].map(([path, label]) => <Button variant="outline" asChild key={path}><Link to={path}>{label}</Link></Button>)}
    </div>
  </div>;
}
