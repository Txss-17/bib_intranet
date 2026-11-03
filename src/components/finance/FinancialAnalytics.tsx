import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCashflows } from '@/hooks/useFinance';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Props = { compact?: boolean };
const value = (amount: number, currency: string) => new Intl.NumberFormat('fr-FR', {
  style: 'currency', currency, maximumFractionDigits: 0,
}).format(amount);

/** Shows the internal ledger, never an approved budget, bank balance or Stripe balance. */
export default function FinancialAnalytics({ compact = false }: Props) {
  const { canViewPage } = usePermissions();
  const allowed = canViewPage('finance.cashflow');
  // Bounded fetch for fast charts; show the sample limitation explicitly.
  const movements = useCashflows({ limit: 500, enabled: allowed });
  const [currency, setCurrency] = useState('');
  const [period, setPeriod] = useState('12');
  const records = movements.data ?? [];
  const availableCurrencies = useMemo(() => [...new Set(records
    .map(row => row.currency?.trim()).filter((v): v is string => !!v))].sort(), [records]);
  const selectedCurrency = availableCurrencies.includes(currency) ? currency : (availableCurrencies[0] ?? '');

  const summary = useMemo(() => {
    const maxMonths = Number(period);
    const now = new Date();
    const months = Array.from({ length: maxMonths }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - maxMonths + index + 1, 1);
      return date.toISOString().slice(0, 7);
    });
    const monthly = new Map(months.map(month => [month, { month, income: 0, expense: 0, net: 0 }]));
    const expenses = new Map<string, number>();
    let matchedCount = 0;
    let ignored = 0;
    for (const row of records) {
      if (row.currency !== selectedCurrency || !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0) continue;
      const month = String(row.transaction_date).slice(0, 7);
      const bucket = monthly.get(month);
      if (!bucket) continue;
      if (row.type !== 'income' && row.type !== 'expense') { ignored++; continue; }
      matchedCount++;
      const amount = Number(row.amount);
      if (row.type === 'income') bucket.income += amount;
      else {
        bucket.expense += amount;
        const category = row.category?.trim() || 'Sans catégorie';
        expenses.set(category, (expenses.get(category) ?? 0) + amount);
      }
    }
    const series = [...monthly.values()].map(row => ({ ...row, net: row.income - row.expense }));
    return {
      series, matchedCount, ignored,
      byCategory: [...expenses].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, amount]) => ({ category, amount })),
      income: series.reduce((total, row) => total + row.income, 0),
      expense: series.reduce((total, row) => total + row.expense, 0),
    };
  }, [records, selectedCurrency, period]);

  if (!allowed) return <p className="text-sm text-muted-foreground">Les graphiques financiers sont réservés aux comptes autorisés à consulter la trésorerie.</p>;
  return <section aria-label="Visualisations financières" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">Pilotage des flux enregistrés</h2>
        <p className="text-xs text-muted-foreground">Données internes accessibles, non assimilables à un budget prévisionnel approuvé ou au solde bancaire.</p>
      </div>
      <div className="flex gap-2">
        {availableCurrencies.length > 0 && <Select value={selectedCurrency} onValueChange={setCurrency}>
          <SelectTrigger className="w-28" aria-label="Devise des graphiques"><SelectValue /></SelectTrigger>
          <SelectContent>{availableCurrencies.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>}
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36" aria-label="Période des graphiques"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="6">6 mois</SelectItem><SelectItem value="12">12 mois</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" disabled={movements.isFetching} onClick={() => void movements.refetch()}>{movements.isFetching ? 'Actualisation…' : 'Actualiser'}</Button>
      </div>
    </div>
    {movements.isLoading && <p role="status">Chargement des données financières…</p>}
    {movements.isError && <p role="alert" className="text-sm text-destructive">Données financières indisponibles. Les montants ne peuvent pas être confirmés.</p>}
    {!movements.isLoading && !movements.isError && records.length === 0 && <p className="text-sm text-muted-foreground">Aucune écriture réelle à représenter.</p>}
    {!movements.isLoading && !movements.isError && records.length > 0 && !selectedCurrency && <p className="text-sm text-muted-foreground">Aucune devise renseignée : impossible de produire des montants comparables.</p>}
    {!movements.isLoading && !movements.isError && selectedCurrency && <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entrées du registre</p><p className="text-xl font-semibold tabular-nums">{value(summary.income, selectedCurrency)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sorties du registre</p><p className="text-xl font-semibold tabular-nums">{value(summary.expense, selectedCurrency)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Net des flux, non bancaire</p><p className="text-xl font-semibold tabular-nums">{value(summary.income - summary.expense, selectedCurrency)}</p></CardContent></Card>
      </div>
      <div className={compact ? 'grid gap-4' : 'grid gap-4 lg:grid-cols-2'}>
        <Card><CardHeader><CardTitle className="text-base">Entrées et sorties par mois</CardTitle></CardHeader><CardContent>
          <div role="img" aria-label="Histogramme des entrées et sorties du registre par mois, dans la devise sélectionnée">
            <ResponsiveContainer width="100%" height={260}><BarChart data={summary.series}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }}/><YAxis tick={{ fontSize: 11 }}/>
              <Tooltip formatter={(n: number) => value(Number(n), selectedCurrency)} /><Legend />
              <Bar dataKey="income" name="Entrées" fill="hsl(var(--chart-1))" />
              <Bar dataKey="expense" name="Sorties" fill="hsl(var(--chart-2))" />
            </BarChart></ResponsiveContainer>
          </div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Évolution du net mensuel</CardTitle></CardHeader><CardContent>
          <div role="img" aria-label="Courbe du net mensuel des écritures du registre">
            <ResponsiveContainer width="100%" height={260}><LineChart data={summary.series}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }}/><YAxis tick={{ fontSize: 11 }}/>
              <Tooltip formatter={(n: number) => value(Number(n), selectedCurrency)} />
              <Line type="monotone" dataKey="net" name="Net des flux" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer>
          </div>
        </CardContent></Card>
        {!compact && <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">Dépenses par catégorie (8 principales)</CardTitle></CardHeader><CardContent>
          {summary.byCategory.length === 0 ? <p className="text-sm text-muted-foreground">Aucune dépense sur cette période.</p> :
            <ResponsiveContainer width="100%" height={Math.max(190, summary.byCategory.length * 38)}><BarChart layout="vertical" data={summary.byCategory} margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 11 }}/><Tooltip formatter={(n: number) => value(Number(n), selectedCurrency)} />
              <Bar dataKey="amount" name="Sorties" fill="hsl(var(--chart-2))" />
            </BarChart></ResponsiveContainer>}
        </CardContent></Card>}
      </div>
      <p className="text-xs text-muted-foreground">Périmètre : {summary.matchedCount} écritures valides de {selectedCurrency} sur {period} mois ; échantillon limité aux 500 dernières lignes du registre accessibles. {summary.ignored > 0 ? `${summary.ignored} type(s) non catégorisé(s) exclus. ` : ''}Si le registre contient plus de 500 mouvements, les graphiques sont partiels. Aucun taux de change n’est appliqué.</p>
      <Card><CardContent className="p-4 text-sm"><strong>Budget prévisionnel vs réalisé :</strong> aucune enveloppe budgétaire approuvée n’est présente dans cette vue. Un écart budget/réel ne peut pas être calculé à partir des seuls mouvements financiers.</CardContent></Card>
    </>}
  </section>;
}
