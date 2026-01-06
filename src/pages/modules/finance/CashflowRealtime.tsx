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
  Filter,
  Download
} from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Mock data
const dailyCashflow = [
  { date: '01/01', income: 12500, expenses: 8200 },
  { date: '02/01', income: 8900, expenses: 5600 },
  { date: '03/01', income: 15200, expenses: 12100 },
  { date: '04/01', income: 11800, expenses: 7800 },
  { date: '05/01', income: 21500, expenses: 9400 },
  { date: '06/01', income: 9200, expenses: 6300 },
];

const categoryBreakdown = [
  { category: 'Abonnements', amount: 185000, type: 'income' },
  { category: 'Services Pro', amount: 43000, type: 'income' },
  { category: 'Salaires', amount: 85000, type: 'expense' },
  { category: 'Fournisseurs', amount: 35000, type: 'expense' },
  { category: 'Ops & Logistique', amount: 18000, type: 'expense' },
  { category: 'Marketing', amount: 7000, type: 'expense' },
];

const recentFlows = [
  { id: 1, type: 'income', category: 'Abonnement', description: 'TechCorp - Enterprise', amount: 8900, date: '2026-01-06', time: '14:32' },
  { id: 2, type: 'expense', category: 'Fournisseur', description: 'EcoPackaging - Facture #2891', amount: 12800, date: '2026-01-06', time: '11:15' },
  { id: 3, type: 'income', category: 'Abonnement', description: 'RetailPlus - Premium', amount: 4500, date: '2026-01-06', time: '09:45' },
  { id: 4, type: 'expense', category: 'Ops', description: 'Byrd Logistics - Jan 2026', amount: 6200, date: '2026-01-05', time: '16:20' },
  { id: 5, type: 'income', category: 'Abonnement', description: 'SmallBiz - Standard', amount: 2200, date: '2026-01-05', time: '14:08' },
  { id: 6, type: 'expense', category: 'Marketing', description: 'Campagne LinkedIn Q1', amount: 3500, date: '2026-01-05', time: '10:30' },
];

const CashflowRealtime = () => {
  const [period, setPeriod] = useState('week');
  const [typeFilter, setTypeFilter] = useState('all');

  const totalIncome = categoryBreakdown.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = categoryBreakdown.filter(c => c.type === 'expense').reduce((sum, c) => sum + c.amount, 0);
  const netCashflow = totalIncome - totalExpenses;

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
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
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
                <p className="text-sm font-medium text-muted-foreground">Entrées</p>
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
                <p className="text-sm font-medium text-muted-foreground">Sorties</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyCashflow}>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical">
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
            {recentFlows
              .filter(f => typeFilter === 'all' || f.type === typeFilter)
              .map((flow) => (
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
                    <p className="font-medium">{flow.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{flow.category}</Badge>
                      <span className="text-xs text-muted-foreground">{flow.date} à {flow.time}</span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowRealtime;
