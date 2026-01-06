import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

// Mock data for finance dashboard
const cashflowData = [
  { month: 'Jan', income: 145000, expenses: 98000, net: 47000 },
  { month: 'Feb', income: 162000, expenses: 105000, net: 57000 },
  { month: 'Mar', income: 178000, expenses: 112000, net: 66000 },
  { month: 'Apr', income: 195000, expenses: 125000, net: 70000 },
  { month: 'May', income: 210000, expenses: 132000, net: 78000 },
  { month: 'Jun', income: 228000, expenses: 145000, net: 83000 },
];

const recentTransactions = [
  { id: 1, type: 'income', description: 'Abonnement Premium - TechCorp', amount: 4500, date: '2026-01-05' },
  { id: 2, type: 'expense', description: 'Paiement fournisseur - EcoPackaging', amount: -12800, date: '2026-01-05' },
  { id: 3, type: 'income', description: 'Abonnement Standard - RetailPlus', amount: 2200, date: '2026-01-04' },
  { id: 4, type: 'expense', description: 'Salaires Janvier 2026', amount: -45000, date: '2026-01-03' },
  { id: 5, type: 'income', description: 'Abonnement Enterprise - BigRetail', amount: 8900, date: '2026-01-02' },
];

const alerts = [
  { id: 1, type: 'warning', message: 'Paiement fournisseur en retard - GlobalSupply', dueDate: '2026-01-02' },
  { id: 2, type: 'critical', message: 'Burn rate élevé ce mois (+15%)', value: '€145,000' },
  { id: 3, type: 'info', message: 'Levée de fonds Series A - Clôture dans 12 jours', progress: '78%' },
];

const FinanceDashboard = () => {
  const currentBalance = 1245000;
  const burnRate = 145000;
  const runway = Math.floor(currentBalance / burnRate);
  const mrr = 228000;
  const mrrGrowth = 8.5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance & Cashflow</h1>
          <p className="text-muted-foreground mt-1">Vue temps réel des indicateurs financiers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/pole/finance/transactions">Voir transactions</Link>
          </Button>
          <Button asChild>
            <Link to="/pole/finance/reports">Générer rapport</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Solde Actuel</p>
                <p className="text-2xl font-bold text-foreground">
                  €{currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Burn Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  €{burnRate.toLocaleString()}/mois
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-orange-500 font-medium">+15%</span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Runway</p>
                <p className="text-2xl font-bold text-foreground">
                  {runway} mois
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-muted-foreground">
              <span>Basé sur le burn rate actuel</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold text-foreground">
                  €{mrr.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500 font-medium">+{mrrGrowth}%</span>
              <span className="text-muted-foreground ml-1">croissance mensuelle</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cashflow - 6 derniers mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => `€${value.toLocaleString()}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary)/0.3)" 
                    name="Revenus"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive)/0.3)" 
                    name="Dépenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes Financières
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'critical'
                      ? 'bg-destructive/10 border-destructive/20'
                      : alert.type === 'warning'
                      ? 'bg-orange-500/10 border-orange-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  {alert.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">Échéance: {alert.dueDate}</p>
                  )}
                  {alert.value && (
                    <p className="text-xs font-medium mt-1">{alert.value}</p>
                  )}
                  {alert.progress && (
                    <p className="text-xs text-muted-foreground mt-1">Avancement: {alert.progress}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions Récentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pole/finance/transactions">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-500/10' : 'bg-destructive/10'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowDownRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    tx.type === 'income' ? 'text-green-500' : 'text-destructive'
                  }`}>
                    {tx.type === 'income' ? '+' : ''}€{Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Accès Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/pole/finance/cashflow">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Cashflow</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/pole/finance/supplier-payments">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Paiements</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/pole/finance/subscriptions">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-xs">Abonnements</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2" asChild>
                <Link to="/pole/finance/salaries">
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Salaires</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceDashboard;
