import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useCashflows, useCashflowStats } from "@/hooks/useFinance";

const CashflowRealtime = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { data: cashflows, isLoading } = useCashflows({ 
    type: typeFilter !== 'all' ? typeFilter as 'income' | 'expense' : undefined 
  });
  const { data: stats } = useCashflowStats();

  // Group by date for daily trend
  const dailyData = cashflows?.reduce((acc, cf) => {
    const date = new Date(cf.transaction_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const existing = acc.find(a => a.date === date);
    if (existing) {
      if (cf.type === 'income') existing.income += cf.amount;
      else existing.expenses += cf.amount;
    } else {
      acc.push({
        date,
        income: cf.type === 'income' ? cf.amount : 0,
        expenses: cf.type === 'expense' ? cf.amount : 0,
      });
    }
    return acc;
  }, [] as { date: string; income: number; expenses: number }[]).slice(0, 7).reverse() || [];

  // Group by category
  const categoryData = cashflows?.reduce((acc, cf) => {
    const existing = acc.find(a => a.category === cf.category);
    if (existing) {
      existing.amount += cf.amount;
    } else {
      acc.push({
        category: cf.category,
        amount: cf.amount,
        type: cf.type,
      });
    }
    return acc;
  }, [] as { category: string; amount: number; type: string }[]) || [];

  const totalIncome = stats?.monthlyIncome ?? 0;
  const totalExpenses = stats?.monthlyExpense ?? 0;
  const netCashflow = totalIncome - totalExpenses;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cashflow Temps Réel</h1>
          <p className="text-muted-foreground mt-1">Suivi des flux financiers entrées / sorties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les flux</SelectItem>
            <SelectItem value="income">Entrées</SelectItem>
            <SelectItem value="expense">Sorties</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entrées (mois)</p>
                <p className="text-2xl font-bold text-green-500">+€{totalIncome.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sorties (mois)</p>
                <p className="text-2xl font-bold text-destructive">-€{totalExpenses.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flux Net</p>
                <p className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {netCashflow >= 0 ? '+' : ''}€{netCashflow.toLocaleString()}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                netCashflow >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'
              }`}>
                {netCashflow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance Journalière</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
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
                      stroke="hsl(142, 76%, 36%)" 
                      fill="hsl(142, 76%, 36%, 0.3)" 
                      name="Entrées"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive)/0.3)" 
                      name="Sorties"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="category" className="text-xs" width={100} />
                    <Tooltip 
                      formatter={(value: number) => `€${value.toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Flows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flux Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cashflows?.slice(0, 10).map((flow) => (
              <div key={flow.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    flow.type === 'income' ? 'bg-green-500/10' : 'bg-destructive/10'
                  }`}>
                    {flow.type === 'income' ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{flow.description || flow.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{flow.category}</Badge>
                      <span className="text-xs text-muted-foreground">{flow.transaction_date}</span>
                    </div>
                  </div>
                </div>
                <span className={`font-semibold text-lg ${
                  flow.type === 'income' ? 'text-green-500' : 'text-destructive'
                }`}>
                  {flow.type === 'income' ? '+' : '-'}€{flow.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {(!cashflows || cashflows.length === 0) && (
              <p className="text-muted-foreground text-center py-8">
                Aucune transaction trouvée. Les données seront affichées une fois ajoutées à la base.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowRealtime;
