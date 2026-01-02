import { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  PiggyBank,
  Shield,
  FileText,
  Clock,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CashflowItem {
  id: string;
  category: string;
  amount: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: React.ReactNode;
}

const incomingFunds: CashflowItem[] = [
  { id: 'inc_1', category: 'User Subscriptions', amount: 2450000, trend: 'up', change: 12.3, icon: <CreditCard className="h-4 w-4" /> },
  { id: 'inc_2', category: 'Transactions', amount: 1820000, trend: 'up', change: 8.7, icon: <DollarSign className="h-4 w-4" /> },
  { id: 'inc_3', category: 'Recycling Revenue', amount: 340000, trend: 'up', change: 24.5, icon: <TrendingUp className="h-4 w-4" /> },
];

const outgoingFunds: CashflowItem[] = [
  { id: 'out_1', category: 'Salaries', amount: 1250000, trend: 'stable', change: 2.1, icon: <Wallet className="h-4 w-4" /> },
  { id: 'out_2', category: 'Logistics', amount: 420000, trend: 'down', change: -5.3, icon: <TrendingDown className="h-4 w-4" /> },
  { id: 'out_3', category: 'Marketing', amount: 180000, trend: 'up', change: 15.2, icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'out_4', category: 'Infrastructure', amount: 95000, trend: 'stable', change: 1.2, icon: <Shield className="h-4 w-4" /> },
];

const fundAllocations = [
  { name: 'Guarantee Funds', amount: 5200000, percentage: 45, color: 'bg-emerald-500' },
  { name: 'Reserves', amount: 3100000, percentage: 27, color: 'bg-blue-500' },
  { name: 'Operational', amount: 3200000, percentage: 28, color: 'bg-amber-500' },
];

const alerts = [
  { id: 'alt_1', type: 'warning', title: 'Liquidity Risk', message: 'Cash reserves below 60-day threshold', timestamp: '2 hours ago' },
  { id: 'alt_2', type: 'critical', title: 'Unusual Expense', message: 'Marketing spend exceeded monthly budget by 23%', timestamp: '4 hours ago' },
  { id: 'alt_3', type: 'info', title: 'Pending Approval', message: '3 invoices require executive validation', timestamp: '1 day ago' },
];

const auditLog = [
  { id: 'log_1', user: 'Jean-Claude Dupont', action: 'Viewed Q4 Report', timestamp: '10:23 AM', ip: '192.168.1.45' },
  { id: 'log_2', user: 'Marie Leroy', action: 'Exported cashflow data', timestamp: '09:45 AM', ip: '192.168.1.82' },
  { id: 'log_3', user: 'System', action: 'Auto-reconciliation completed', timestamp: '08:00 AM', ip: 'Internal' },
];

export default function FinanceModule() {
  const [activeTab, setActiveTab] = useState('overview');
  const totalIncoming = incomingFunds.reduce((sum, item) => sum + item.amount, 0);
  const totalOutgoing = outgoingFunds.reduce((sum, item) => sum + item.amount, 0);
  const netCashflow = totalIncoming - totalOutgoing;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finance</h1>
              <p className="text-sm text-muted-foreground">Real-time financial visibility • Audit-ready</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Finance Roles Only
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Global Cashflow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Incoming</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalIncoming)}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-emerald-500/50" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-emerald-500">
              <TrendingUp className="h-3 w-3" />
              +14.2% vs last month
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Outgoing</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalOutgoing)}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-500/50" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              +3.1% vs last month
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Cashflow</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(netCashflow)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500/50" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-emerald-500">
              <TrendingUp className="h-3 w-3" />
              Healthy cash position
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Cashflow</TabsTrigger>
          <TabsTrigger value="allocations">Fund Allocation</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Incoming Funds */}
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  Incoming Funds
                </CardTitle>
                <CardDescription>Revenue streams breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomingFunds.map((item) => (
                  <div key={item.id} className="data-row">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-emerald-500">+{item.change}%</span> vs last period
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Outgoing Funds */}
            <Card className="enterprise-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  Outgoing Funds
                </CardTitle>
                <CardDescription>Expense categories breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {outgoingFunds.map((item) => (
                  <div key={item.id} className="data-row">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.category}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className={item.change < 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {item.change > 0 ? '+' : ''}{item.change}%
                          </span> vs last period
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PiggyBank className="h-4 w-4" />
                Fund Allocation
              </CardTitle>
              <CardDescription>Distribution of company reserves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fundAllocations.map((fund) => (
                <div key={fund.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{fund.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(fund.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={fund.percentage} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{fund.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Financial Alerts
              </CardTitle>
              <CardDescription>Liquidity risks and unusual activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    alert.type === 'critical' && 'border-red-500/30 bg-red-500/5',
                    alert.type === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                    alert.type === 'info' && 'border-blue-500/30 bg-blue-500/5'
                  )}
                >
                  <AlertTriangle className={cn(
                    'h-4 w-4 mt-0.5',
                    alert.type === 'critical' && 'text-red-500',
                    alert.type === 'warning' && 'text-amber-500',
                    alert.type === 'info' && 'text-blue-500'
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Audit Trail
              </CardTitle>
              <CardDescription>All actions are logged and immutable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLog.map((log) => (
                  <div key={log.id} className="data-row text-sm">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{log.user}</span>
                        <span className="text-muted-foreground"> — {log.action}</span>
                      </div>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <div>{log.timestamp}</div>
                      <div className="text-xs">{log.ip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
