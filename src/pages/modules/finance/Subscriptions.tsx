import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  DollarSign
} from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock data
const mrrHistory = [
  { month: 'Juil', mrr: 152000 },
  { month: 'Août', mrr: 165000 },
  { month: 'Sept', mrr: 178000 },
  { month: 'Oct', mrr: 195000 },
  { month: 'Nov', mrr: 210000 },
  { month: 'Déc', mrr: 228000 },
];

const planDistribution = [
  { plan: 'Standard', count: 124, revenue: 68200 },
  { plan: 'Premium', count: 86, revenue: 107500 },
  { plan: 'Enterprise', count: 28, revenue: 52300 },
];

const recentSubscriptions = [
  { id: 1, company: 'TechCorp International', plan: 'Enterprise', mrr: 8900, status: 'active', startDate: '2026-01-05', trend: 'stable' },
  { id: 2, company: 'RetailPlus GmbH', plan: 'Premium', mrr: 4500, status: 'active', startDate: '2025-11-15', trend: 'up' },
  { id: 3, company: 'SmallBiz Solutions', plan: 'Standard', mrr: 550, status: 'at_risk', startDate: '2025-08-20', trend: 'down' },
  { id: 4, company: 'BigRetail SA', plan: 'Enterprise', mrr: 12500, status: 'active', startDate: '2025-06-01', trend: 'up' },
  { id: 5, company: 'StartupHub', plan: 'Premium', mrr: 1250, status: 'churned', startDate: '2025-04-10', trend: 'down' },
  { id: 6, company: 'EcoStore Online', plan: 'Standard', mrr: 550, status: 'active', startDate: '2025-12-01', trend: 'stable' },
  { id: 7, company: 'MegaDistrib', plan: 'Enterprise', mrr: 15000, status: 'active', startDate: '2025-03-15', trend: 'up' },
];

const Subscriptions = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const totalMRR = 228000;
  const activeUsers = 238;
  const churnRate = 2.3;
  const growthRate = 8.5;

  const filteredSubscriptions = recentSubscriptions.filter(sub =>
    sub.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500">Actif</Badge>;
      case 'at_risk':
        return <Badge className="bg-orange-500/10 text-orange-500">À risque</Badge>;
      case 'churned':
        return <Badge className="bg-destructive/10 text-destructive">Résilié</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'Enterprise':
        return <Badge className="bg-purple-500/10 text-purple-500">{plan}</Badge>;
      case 'Premium':
        return <Badge className="bg-blue-500/10 text-blue-500">{plan}</Badge>;
      case 'Standard':
        return <Badge variant="outline">{plan}</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Abonnements</h1>
          <p className="text-muted-foreground mt-1">Revenus récurrents et analyse des utilisateurs</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR Total</p>
                <p className="text-2xl font-bold">€{totalMRR.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+{growthRate}%</span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+12</span>
              <span className="text-muted-foreground ml-1">ce mois</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{churnRate}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <span>Objectif: &lt;3%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ARPU</p>
                <p className="text-2xl font-bold">€{Math.round(totalMRR / activeUsers)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">+5%</span>
              <span className="text-muted-foreground ml-1">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrHistory}>
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
                  <Line 
                    type="monotone" 
                    dataKey="mrr" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="MRR"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="plan" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `€${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenus' : 'Clients'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Abonnements Récents</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Depuis</TableHead>
                <TableHead>Tendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.company}</TableCell>
                  <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                  <TableCell className="font-semibold">€{sub.mrr.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{sub.startDate}</TableCell>
                  <TableCell>
                    {sub.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {sub.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                    {sub.trend === 'stable' && <span className="text-muted-foreground">→</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
