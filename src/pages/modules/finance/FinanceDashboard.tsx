import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useTableInteractions } from "@/hooks/useTableInteractions";
import {
  TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet, Building2, Loader2, Target, Search
} from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useCashflowStats, useCashflows, useSupplierPaymentStats } from "@/hooks/useFinance";
import { TechRequestButton } from "@/components/tech/TechRequestButton";

const incomeBreakdown = [
  { name: 'Abonnements', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'Ventes Produits', value: 35, color: 'hsl(var(--chart-2))' },
  { name: 'Traditionnels', value: 20, color: 'hsl(var(--chart-3))' },
];

const fundingObjectives = [
  { name: 'Levée Série A', target: 2000000, current: 1200000 },
  { name: 'Fonds Garantie Fournisseurs', target: 500000, current: 380000 },
];

const invoicesData = [
  { id: 'FAC-2024-112', type: 'Facture', pole: 'Ops', amount: '12,500 €', due: '2026-03-25', status: 'pending' },
  { id: 'FAC-2024-111', type: 'Salaire', pole: 'RH', amount: '45,200 €', due: '2026-03-30', status: 'validated' },
  { id: 'FAC-2024-110', type: 'Facture', pole: 'Marketing', amount: '8,900 €', due: '2026-03-20', status: 'overdue' },
  { id: 'FAC-2024-109', type: 'Fournisseur', pole: 'Supplier', amount: '22,300 €', due: '2026-04-01', status: 'pending' },
  { id: 'FAC-2024-108', type: 'Salaire', pole: 'Tech', amount: '38,600 €', due: '2026-03-30', status: 'validated' },
];

const budgetData = { monthly: 185000, surplus: 12500, primeTeams: 8200 };

const FinanceDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useCashflowStats();
  const { data: recentCashflows, isLoading: cashflowsLoading } = useCashflows({ limit: 5 });
  const { data: paymentStats } = useSupplierPaymentStats();

  const invoicesTable = useTableInteractions({
    data: invoicesData,
    searchFields: ['id', 'pole'],
  });

  const displayChartData = [
    { month: 'Jan', income: 145000, expenses: 98000 },
    { month: 'Fév', income: 162000, expenses: 105000 },
    { month: 'Mar', income: 178000, expenses: 112000 },
    { month: 'Avr', income: 195000, expenses: 118000 },
    { month: 'Mai', income: 210000, expenses: 125000 },
    { month: 'Juin', income: 228000, expenses: 130000 },
  ];

  const currentBalance = stats?.balance ?? 1245000;
  const monthlyIncome = stats?.monthlyIncome ?? 228000;
  const monthlyExpenses = stats?.burnRate ?? 145000;
  const isLoading = statsLoading || cashflowsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance & Cashflow</h1>
          <p className="text-muted-foreground mt-1">Vue temps réel des indicateurs financiers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TechRequestButton
            pole="finance"
            category="data"
            defaultTitle="Tableau financier : "
            defaultDescription={'Tableau / indicateur demandé :\nDonnées et périmètre :\nFréquence de mise à jour :'}
            label="Demander un tableau"
          />
          <Button variant="outline" asChild><Link to="/pole/finance/transactions">Voir transactions</Link></Button>
          <Button asChild><Link to="/pole/finance/cashflow">Cashflow détaillé</Link></Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solde Actuel</p>
                <p className="text-2xl font-bold">€{currentBalance.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Wallet className="h-6 w-6 text-primary" /></div>
            </div>
            <div className="flex items-center mt-4 text-sm"><TrendingUp className="h-4 w-4 text-emerald-500 mr-1" /><span className="text-emerald-500 font-medium">+12.5%</span><span className="text-muted-foreground ml-1">vs mois dernier</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entrées du mois</p>
                <p className="text-2xl font-bold text-emerald-500">€{monthlyIncome.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><ArrowDownRight className="h-6 w-6 text-emerald-500" /></div>
            </div>
            <div className="flex items-center mt-4 text-sm"><TrendingUp className="h-4 w-4 text-emerald-500 mr-1" /><span className="text-emerald-500 font-medium">+8%</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorties du mois</p>
                <p className="text-2xl font-bold text-destructive">€{monthlyExpenses.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"><ArrowUpRight className="h-6 w-6 text-destructive" /></div>
            </div>
            <div className="flex items-center mt-4 text-sm"><TrendingDown className="h-4 w-4 text-destructive mr-1" /><span className="text-destructive font-medium">+3%</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Mensuel</p>
                <p className="text-2xl font-bold">€{budgetData.monthly.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center"><CreditCard className="h-6 w-6 text-blue-500" /></div>
            </div>
            <div className="flex items-center mt-4 text-sm text-muted-foreground">Surplus: €{budgetData.surplus.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trésorerie + Entrées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Trésorerie — 6 derniers mois</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="income" name="Revenus" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.3)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Entrées du Mois</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {incomeBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Objectifs de financement */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Objectifs de Financement</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-6">
            {fundingObjectives.map(obj => (
              <div key={obj.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{obj.name}</span>
                  <span className="text-muted-foreground">€{(obj.current / 1000).toFixed(0)}K / €{(obj.target / 1000).toFixed(0)}K</span>
                </div>
                <Progress value={(obj.current / obj.target) * 100} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Factures & Salaires with search/filter/sort */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Factures & Salaires</CardTitle>
          <Button variant="outline" size="sm" asChild><Link to="/pole/finance/transactions">Voir tout</Link></Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par ID ou pôle..." value={invoicesTable.searchQuery} onChange={e => invoicesTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
            </div>
            <Select value={invoicesTable.filters.type || 'all'} onValueChange={v => invoicesTable.setFilter('type', v)}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="Facture">Facture</SelectItem>
                <SelectItem value="Salaire">Salaire</SelectItem>
                <SelectItem value="Fournisseur">Fournisseur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={invoicesTable.filters.status || 'all'} onValueChange={v => invoicesTable.setFilter('status', v)}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="overdue">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="id" currentSort={invoicesTable.sortColumn as string} direction={invoicesTable.sortDirection} onSort={c => invoicesTable.toggleSort(c as keyof typeof invoicesData[0])}>ID</SortableTableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pôle</TableHead>
                <SortableTableHead column="amount" currentSort={invoicesTable.sortColumn as string} direction={invoicesTable.sortDirection} onSort={c => invoicesTable.toggleSort(c as keyof typeof invoicesData[0])}>Montant</SortableTableHead>
                <SortableTableHead column="due" currentSort={invoicesTable.sortColumn as string} direction={invoicesTable.sortDirection} onSort={c => invoicesTable.toggleSort(c as keyof typeof invoicesData[0])}>Échéance</SortableTableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesTable.processedData.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.type}</TableCell>
                  <TableCell>{inv.pole}</TableCell>
                  <TableCell className="font-medium">{inv.amount}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.due}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === 'validated' ? 'default' : inv.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {inv.status === 'validated' ? 'Validé' : inv.status === 'overdue' ? 'En retard' : 'En attente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {invoicesTable.processedData.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucun résultat</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Budget & Primes + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Budget & Primes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Budget Mensuel', value: `€${budgetData.monthly.toLocaleString()}`, icon: CreditCard },
                { label: 'Surplus Disponible', value: `€${budgetData.surplus.toLocaleString()}`, icon: PiggyBank },
                { label: 'Prime Teams', value: `€${budgetData.primeTeams.toLocaleString()}`, icon: TrendingUp },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accès Rapides</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Cashflow', icon: DollarSign, to: '/pole/finance/cashflow' },
                { label: 'Paiements', icon: Building2, to: '/pole/finance/supplier-payments' },
                { label: 'Abonnements', icon: CreditCard, to: '/pole/finance/subscriptions' },
                { label: 'Salaires', icon: Wallet, to: '/pole/finance/salaries' },
              ].map(a => (
                <Button key={a.label} variant="outline" className="h-20 flex-col gap-2" asChild>
                  <Link to={a.to}><a.icon className="h-5 w-5" /><span className="text-xs">{a.label}</span></Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
