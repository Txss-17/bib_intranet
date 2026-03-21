import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { useTableInteractions } from "@/hooks/useTableInteractions";
import { 
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Loader2, Eye, Search
} from "lucide-react";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useCashflows, useCashflowStats } from "@/hooks/useFinance";

// Mock Cash In/Out data for enhanced view
const cashInFlows = [
  { id: 'C-218', description: 'Client Monthly Fees', date: 'Apr 25', client: 'Absorz Isabaza', amount: 0 },
  { id: 'C-207', description: 'Vendor Refund', date: 'Apr 25', client: 'TechParts Inc.', amount: 0 },
  { id: 'C-203', description: 'Product Sales', date: 'Apr 24', client: 'EMA Europe', amount: 0 },
  { id: 'C-198', description: 'Application Fees', date: 'Apr 23', client: '550 New Users', amount: 0 },
  { id: 'C-195', description: 'Linked Companies', date: 'Apr 22', client: 'Dubai', amount: 0 },
  { id: 'O-182', description: 'Licensing Fee', date: 'Apr 22', client: '', amount: 98100 },
];

const cashOutFlows = [
  { id: 'O-178', description: 'Warehouse Rent', date: 'Apr 25', supplier: 'Decoisso', amount: 350000 },
  { id: 'O-182', description: 'Partner Payout', date: 'Apr 25', supplier: 'Invecoliay Spa', amount: 142200 },
  { id: 'O-175', description: 'Recycling Fund Allocation', date: 'Apr 24', supplier: 'TREBMIAL', amount: 120000 },
  { id: 'O-169', description: 'Employee Salaries', date: 'Apr 23', supplier: 'RapidLogix', amount: 400000 },
  { id: 'O-156', description: 'Supplier Payment', date: 'Apr 23', supplier: 'RapidLogid', amount: 145000 },
  { id: 'O-148', description: 'Marketing Expense', date: 'Apr 22', supplier: 'Server Fees', amount: 101500 },
];

// Cashflow Breakdown
const breakdownData = [
  { name: 'Salaries', value: 800, color: 'hsl(var(--chart-1))' },
  { name: 'Recycling Fund', value: 430, color: 'hsl(var(--chart-3))' },
  { name: 'Supplier Payments', value: 350, color: 'hsl(var(--destructive))' },
  { name: 'Other Payments', value: 182, color: 'hsl(var(--chart-4))' },
];

// Cash Forecast
const forecastData = [
  { day: 'Day 1', projection1: 2340000, projection2: 1990000 },
  { day: 'Day 5', projection1: 2380000, projection2: 2010000 },
  { day: 'Day 10', projection1: 2400000, projection2: 1950000 },
  { day: 'Day 15', projection1: 2350000, projection2: 1980000 },
  { day: 'Day 20', projection1: 2420000, projection2: 2020000 },
  { day: 'Day 25', projection1: 2500000, projection2: 2050000 },
  { day: 'Day 30', projection1: 2600000, projection2: 2150000 },
];

const CashflowRealtime = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [forecastRange, setForecastRange] = useState('30-days');
  
  const { data: cashflows, isLoading } = useCashflows({ 
    type: typeFilter !== 'all' ? typeFilter as 'income' | 'expense' : undefined 
  });
  const { data: stats } = useCashflowStats();

  const cashInTable = useTableInteractions({ data: cashInFlows, searchFields: ['id', 'description', 'client'] });
  const cashOutTable = useTableInteractions({ data: cashOutFlows, searchFields: ['id', 'description', 'supplier'] });

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

  const totalIncome = stats?.monthlyIncome ?? 2345780;
  const totalExpenses = stats?.monthlyExpense ?? 1762150;
  const balance = 12388540;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cashflow Dashboard</h1>
          <p className="text-muted-foreground mt-1">Suivi des flux financiers en temps réel</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exporter</Button>
      </div>

      {/* Top KPIs */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-emerald-500 text-white p-4">
              <p className="text-sm opacity-80">Solde Actuel</p>
              <p className="text-2xl font-bold">€{balance.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-emerald-600 text-white p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                <p className="text-sm opacity-80">Entrées</p>
              </div>
              <p className="text-2xl font-bold">€{totalIncome.toLocaleString()}</p>
              <p className="text-xs opacity-70">+1.7% this month</p>
            </div>
            <div className="rounded-lg bg-destructive text-destructive-foreground p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4" />
                <p className="text-sm opacity-80">Sorties</p>
              </div>
              <p className="text-2xl font-bold">€{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Cashflow Breakdown</p>
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={2} dataKey="value">
                    {breakdownData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Cashflow Overview + Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Cashflow Overview</CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs h-7">Week</Button>
                <Button size="sm" className="text-xs h-7">Month</Button>
                <Button variant="outline" size="sm" className="text-xs h-7">Quarter</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="income" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.3)" name="Entrées" />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.3)" name="Sorties" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Aucune donnée disponible</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cashflow Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {breakdownData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4 text-sm">
              {breakdownData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-semibold">€{d.value}k</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash In + Cash Out Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cash In Flow</CardTitle>
              <Tabs defaultValue="all">
                <TabsList className="h-7">
                  <TabsTrigger value="all" className="text-xs h-6">All</TabsTrigger>
                  <TabsTrigger value="today" className="text-xs h-6">Today</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs h-6">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" currentSort={cashInTable.sortColumn as string} direction={cashInTable.sortDirection} onSort={c => cashInTable.toggleSort(c as keyof typeof cashInFlows[0])}>ID</SortableTableHead>
                  <TableHead>Description</TableHead>
                  <SortableTableHead column="date" currentSort={cashInTable.sortColumn as string} direction={cashInTable.sortDirection} onSort={c => cashInTable.toggleSort(c as keyof typeof cashInFlows[0])}>Date</SortableTableHead>
                  <TableHead>Client / Supplier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashInTable.processedData.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">{f.id}</TableCell>
                    <TableCell className="text-sm">{f.description}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{f.date}</TableCell>
                    <TableCell className="text-sm">{f.client}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Cash Out Flow</CardTitle>
              <Tabs defaultValue="all">
                <TabsList className="h-7">
                  <TabsTrigger value="all" className="text-xs h-6">All</TabsTrigger>
                  <TabsTrigger value="today" className="text-xs h-6">Today</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs h-6">Weekly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" currentSort={cashOutTable.sortColumn as string} direction={cashOutTable.sortDirection} onSort={c => cashOutTable.toggleSort(c as keyof typeof cashOutFlows[0])}>ID</SortableTableHead>
                  <TableHead>Description</TableHead>
                  <SortableTableHead column="date" currentSort={cashOutTable.sortColumn as string} direction={cashOutTable.sortDirection} onSort={c => cashOutTable.toggleSort(c as keyof typeof cashOutFlows[0])}>Date</SortableTableHead>
                  <TableHead>Supplier</TableHead>
                  <SortableTableHead column="amount" currentSort={cashOutTable.sortColumn as string} direction={cashOutTable.sortDirection} onSort={c => cashOutTable.toggleSort(c as keyof typeof cashOutFlows[0])} className="text-right">Amount</SortableTableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashOutTable.processedData.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-sm">{f.id}</TableCell>
                    <TableCell className="text-sm">{f.description}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{f.date}</TableCell>
                    <TableCell className="text-sm">{f.supplier}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">€{f.amount.toLocaleString()}</TableCell>
                    <TableCell><Button variant="outline" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Details</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cash Forecast */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cash Forecast</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs h-7">7 days</Button>
                <Button variant="outline" size="sm" className="text-xs h-7">30-6lijs</Button>
                <Button size="sm" className="text-xs h-7">30-days</Button>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">30-Day Projection <span className="text-emerald-500">€1.5 M (▲6%)</span></p>
                <p className="text-xs text-muted-foreground">Short-Term Liabilities: €4M</p>
                <p className="text-xs text-muted-foreground">Long-Term Liabilities: €1.2M</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `€${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="projection1" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Projection 1" dot={false} />
                <Line type="monotone" dataKey="projection2" stroke="hsl(var(--primary))" strokeWidth={2} name="Projection 2" dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashflowRealtime;
