import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle,
  DollarSign, Shield, Leaf, BarChart3, Clock,
  Target, Activity, AlertCircle, CheckCircle2, ArrowUpRight,
  Building2, Globe, Lightbulb, FileText, Search, Loader2,
  Package, ShoppingCart, MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { useExecutiveKPIs, useRecentCriticalAlerts, usePolePerformance } from '@/hooks/useExecutiveKPIs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ExecutiveDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: kpis, isLoading: kpisLoading } = useExecutiveKPIs();
  const { data: criticalAlerts = [], isLoading: alertsLoading } = useRecentCriticalAlerts();
  const { data: polePerformance = [], isLoading: polesLoading } = usePolePerformance();

  const alertsTable = useTableInteractions({
    data: criticalAlerts,
    searchFields: ['message', 'pole'],
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} K€`;
    return `${amount.toFixed(0)} €`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const globalKPIs = [
    { label: 'Revenu Total', value: formatCurrency(kpis?.totalRevenue || 0), icon: DollarSign, change: formatCurrency(kpis?.ebitda || 0) + ' EBITDA', color: 'text-emerald-500' },
    { label: 'Clients Actifs', value: String(kpis?.totalUsers || 0), icon: Users, change: `${kpis?.atRiskUsers || 0} à risque`, color: kpis?.atRiskUsers ? 'text-destructive' : 'text-blue-500' },
    { label: 'Commandes', value: String(kpis?.totalOrders || 0), icon: ShoppingCart, change: 'total', color: 'text-primary' },
    { label: 'Fournisseurs', value: String(kpis?.totalSuppliers || 0), icon: Package, change: `Qualité: ${kpis?.avgSupplierQuality || 'N/A'}%`, color: 'text-emerald-500' },
    { label: 'Incidents Ouverts', value: String(kpis?.openIncidents || 0), icon: AlertTriangle, change: `${kpis?.openTickets || 0} tickets`, color: kpis?.openIncidents ? 'text-destructive' : 'text-emerald-500' },
    { label: 'Produits en Attente', value: String(kpis?.pendingProducts || 0), icon: Target, change: 'validation', color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Vue consolidée — LINKSY Group · Données temps réel</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1 text-emerald-500" />
          Live
        </Badge>
      </div>

      {/* Critical alerts banner */}
      {criticalAlerts.filter(a => a.severity === 'critical').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {criticalAlerts.filter(a => a.severity === 'critical').length} alerte(s) critique(s) active(s)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs from real data */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {globalKPIs.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold mt-2">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="financial">Performance Financière</TabsTrigger>
          <TabsTrigger value="alerts">Alertes & Risques</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue chart */}
            <Card>
              <CardHeader><CardTitle>Performance CA & EBITDA (K€)</CardTitle></CardHeader>
              <CardContent>
                {kpis?.chartData && kpis.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={kpis.chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="ca" name="Chiffre d'affaires" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-12">Aucune donnée financière disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Pole Performance */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Performance des Pôles</CardTitle></CardHeader>
              <CardContent>
                {polesLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-3">
                    {polePerformance.map(pole => (
                      <div key={pole.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`h-2 w-2 rounded-full ${getStatusColor(pole.status)} bg-current`} />
                          <span className="font-medium text-sm">{pole.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={pole.score} className="w-24 h-2" />
                          <span className="text-sm font-medium w-10">{pole.score}%</span>
                          {pole.status === 'healthy' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    ))}
                    {polePerformance.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucune donnée</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <DollarSign className="h-5 w-5 text-emerald-500 mb-2" />
                <p className="text-xs text-muted-foreground">Revenus</p>
                <p className="text-xl font-bold text-emerald-500">{formatCurrency(kpis?.totalRevenue || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendingDown className="h-5 w-5 text-destructive mb-2" />
                <p className="text-xs text-muted-foreground">Dépenses</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(kpis?.totalExpenses || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Target className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">EBITDA</p>
                <p className={`text-xl font-bold ${(kpis?.ebitda || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                  {formatCurrency(kpis?.ebitda || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-4 space-y-6">
          <Card>
            <CardHeader><CardTitle>Évolution CA mensuel (K€)</CardTitle></CardHeader>
            <CardContent>
              {kpis?.chartData && kpis.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={kpis.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="ca" name="CA" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ebitda" name="EBITDA" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Ajoutez des cashflows pour voir l'évolution</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alertes Actives</CardTitle>
              <div className="flex gap-2 mt-2">
                <Select value={alertsTable.filters.severity || 'all'} onValueChange={v => alertsTable.setFilter('severity', v)}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Sévérité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={alertsTable.filters.pole || 'all'} onValueChange={v => alertsTable.setFilter('pole', v)}>
                  <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Pôle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pôles</SelectItem>
                    <SelectItem value="Fournisseurs">Fournisseurs</SelectItem>
                    <SelectItem value="Ops">Ops</SelectItem>
                    <SelectItem value="Direction">Direction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-3">
                  {alertsTable.processedData.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pôle: {alert.pole}</p>
                      </div>
                    </div>
                  ))}
                  {alertsTable.processedData.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                      <p className="text-muted-foreground">Aucune alerte active — tout est sous contrôle</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;
