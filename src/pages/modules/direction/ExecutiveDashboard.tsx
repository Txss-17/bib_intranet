import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle,
  DollarSign, Shield, Leaf, BarChart3, Clock,
  Target, Activity, AlertCircle, CheckCircle2, ArrowUpRight,
  Building2, Globe, Lightbulb, FileText, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const globalKPIs = [
  { label: 'Revenu Annuel', value: '2,85 M€', icon: DollarSign, change: '+18%', color: 'text-emerald-500' },
  { label: 'Croissance', value: '+18%', icon: TrendingUp, change: 'vs N-1', color: 'text-emerald-500' },
  { label: 'EBITDA', value: '450 K€', icon: Target, change: '+22%', color: 'text-primary' },
  { label: 'Rétention Clients', value: '86%', icon: Users, change: '+3pts', color: 'text-blue-500' },
  { label: 'Score ESG', value: '78/100', icon: Leaf, change: '+4.5', color: 'text-emerald-500' },
  { label: 'Conformité', value: '94%', icon: Shield, change: 'stable', color: 'text-primary' },
];

const caEbitdaEvolution = [
  { month: 'Jan', ca: 210, ebitda: 32 }, { month: 'Fév', ca: 225, ebitda: 35 },
  { month: 'Mar', ca: 248, ebitda: 40 }, { month: 'Avr', ca: 235, ebitda: 38 },
  { month: 'Mai', ca: 260, ebitda: 42 }, { month: 'Juin', ca: 275, ebitda: 48 },
  { month: 'Jul', ca: 252, ebitda: 44 }, { month: 'Aoû', ca: 240, ebitda: 41 },
  { month: 'Sep', ca: 268, ebitda: 46 }, { month: 'Oct', ca: 285, ebitda: 50 },
  { month: 'Nov', ca: 295, ebitda: 52 }, { month: 'Déc', ca: 310, ebitda: 55 },
];

const salesByMarket = [
  { name: 'National', value: 55, color: 'hsl(var(--chart-1))' },
  { name: 'EU & US', value: 30, color: 'hsl(var(--chart-2))' },
  { name: 'Global', value: 15, color: 'hsl(var(--chart-3))' },
];

const criticalAlerts = [
  { id: '1', message: 'Cashflow critique prévu dans 45 jours', severity: 'critical', pole: 'Finance' },
  { id: '2', message: 'Certification ISO expirée - Fournisseur Alpha', severity: 'critical', pole: 'Fournisseurs' },
  { id: '3', message: '3 commandes en retard de livraison', severity: 'high', pole: 'Ops' },
  { id: '4', message: 'Utilisateur à risque impayé identifié', severity: 'high', pole: 'Lifecycle' },
];

const polePerformance = [
  { id: 'finance', name: 'Finance', score: 92, trend: 'up', status: 'healthy' },
  { id: 'supplier', name: 'Fournisseurs', score: 88, trend: 'up', status: 'healthy' },
  { id: 'ops', name: 'Opérations', score: 76, trend: 'down', status: 'warning' },
  { id: 'lifecycle', name: 'Lifecycle', score: 85, trend: 'stable', status: 'healthy' },
  { id: 'tech', name: 'Tech', score: 95, trend: 'up', status: 'healthy' },
  { id: 'rse', name: 'RSE', score: 78, trend: 'up', status: 'healthy' },
  { id: 'audit', name: 'Audit', score: 91, trend: 'stable', status: 'healthy' },
  { id: 'rh', name: 'RH', score: 82, trend: 'up', status: 'healthy' },
];

const strategicActivities = [
  { title: 'IA Produit — Scoring automatique', status: 'active', progress: 65 },
  { title: 'Expansion marché UK/US', status: 'planning', progress: 30 },
  { title: 'Certification B-Corp', status: 'active', progress: 50 },
  { title: 'Plateforme marketplace V2', status: 'active', progress: 80 },
];

const opportunities = [
  { title: 'Partenariat distributeur Allemagne', impact: 'high', status: 'Négociation' },
  { title: 'Subvention innovation BPI', impact: 'medium', status: 'Soumis' },
  { title: 'Contrat grossiste bio Paris', impact: 'high', status: 'Closing' },
];

const recentDecisions = [
  { id: '1', title: 'Validation nouveau fournisseur EcoPack', date: '2026-03-18', status: 'approved', by: 'CEO' },
  { id: '2', title: 'Investissement infrastructure Tech Q1', date: '2026-03-16', status: 'pending', by: 'Direction' },
  { id: '3', title: 'Partenariat logistique Byrd Extended', date: '2026-03-14', status: 'approved', by: 'CEO' },
];

const commissaireAlerts = [
  { title: 'Rapport trimestriel Q1 2026', status: 'En attente', dueDate: '2026-04-15' },
  { title: 'Audit conformité RGPD', status: 'Validé', dueDate: '2026-03-01' },
  { title: 'Revue comptes annuels', status: 'En cours', dueDate: '2026-06-30' },
];

const ExecutiveDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const alertsTable = useTableInteractions({
    data: criticalAlerts,
    searchFields: ['message', 'pole'],
  });

  const commissaireTable = useTableInteractions({
    data: commissaireAlerts,
    searchFields: ['title'],
  });

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Vue consolidée — LINKSY Group</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="h-3 w-3 mr-1" />
          Mis à jour il y a 5 min
        </Badge>
      </div>

      {criticalAlerts.filter(a => a.severity === 'critical').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {criticalAlerts.filter(a => a.severity === 'critical').length} alerte(s) critique(s)
              </span>
              <Button variant="destructive" size="sm" className="ml-auto">Voir les alertes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {globalKPIs.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                <Badge variant="outline" className={kpi.color}><TrendingUp className="h-3 w-3 mr-1" />{kpi.change}</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="commercial">Résultats Commerciaux</TabsTrigger>
          <TabsTrigger value="intelligence">🔒 Intelligence</TabsTrigger>
          <TabsTrigger value="strategic">Activités Stratégiques</TabsTrigger>
          <TabsTrigger value="reports">Rapports & Commissaire</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Performance CA & EBITDA (K€)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={caEbitdaEvolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="ca" name="Chiffre d'affaires" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Performance des Pôles</CardTitle></CardHeader>
              <CardContent>
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
                        {pole.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                        {pole.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                        {pole.trend === 'stable' && <span className="h-4 w-4 text-muted-foreground">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts + Decisions with filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alertes Récentes</CardTitle>
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
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Fournisseurs">Fournisseurs</SelectItem>
                      <SelectItem value="Ops">Ops</SelectItem>
                      <SelectItem value="Lifecycle">Lifecycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertsTable.processedData.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pôle: {alert.pole}</p>
                      </div>
                      <Button variant="ghost" size="sm"><ArrowUpRight className="h-4 w-4" /></Button>
                    </div>
                  ))}
                  {alertsTable.processedData.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Aucune alerte</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Décisions Récentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDecisions.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {d.status === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-yellow-500" />}
                        <div>
                          <p className="text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">{d.date} • {d.by}</p>
                        </div>
                      </div>
                      <Badge variant={d.status === 'approved' ? 'default' : 'secondary'}>{d.status === 'approved' ? 'Approuvé' : 'En attente'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="commercial" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Ventes par Marché</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={salesByMarket} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {salesByMarket.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Évolution CA mensuel (K€)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={caEbitdaEvolution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="ca" name="CA" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Segmentation Marché</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ name: 'National', value: '1,57 M€', pct: 55 }, { name: 'EU & US', value: '855 K€', pct: 30 }, { name: 'Global', value: '428 K€', pct: 15 }].map(s => (
                  <div key={s.name} className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">{s.name}</p>
                    <p className="text-xl font-bold mt-1">{s.value}</p>
                    <Progress value={s.pct} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{s.pct}% du CA total</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="mt-4 space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Données stratégiques internes — non visibles par les vendeurs</span>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Top Produit', value: 'Sérum Bio Rose', sub: '2,340 ventes', color: 'text-primary' },
              { label: 'Marge Moyenne', value: '34.2%', sub: '+2.1pts vs N-1', color: 'text-emerald-500' },
              { label: 'Produit + Rentable', value: 'Crème Nuit Pro', sub: 'Marge: 52%', color: 'text-emerald-500' },
              { label: 'Catégorie #1', value: 'Hygiène Bio', sub: '38% du CA', color: 'text-blue-500' },
            ].map(kpi => (
              <Card key={kpi.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-lg font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top 10 Produits (ventes)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Sérum Bio Rose', ventes: 2340 },
                    { name: 'Crème Nuit Pro', ventes: 1890 },
                    { name: 'Shampoing Solide', ventes: 1650 },
                    { name: 'Huile Argan', ventes: 1420 },
                    { name: 'Baume Lèvres', ventes: 1280 },
                    { name: 'Gel Douche Coco', ventes: 1150 },
                    { name: 'Masque Argile', ventes: 980 },
                    { name: 'Dentifrice Bio', ventes: 870 },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs" width={130} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="ventes" name="Ventes" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Rentabilité par Catégorie</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Hygiène Bio', marge: 42, ca: 380 },
                    { name: 'Mode Femme', marge: 35, ca: 456 },
                    { name: 'Mode Homme', marge: 31, ca: 312 },
                    { name: 'Accessoires', marge: 38, ca: 198 },
                    { name: 'Maison', marge: 28, ca: 145 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="marge" name="Marge (%)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ca" name="CA (K€)" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Best Sellers — Tendance mensuelle</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={[
                  { month: 'Jan', serum: 180, creme: 150, shampoing: 120 },
                  { month: 'Fév', serum: 195, creme: 160, shampoing: 135 },
                  { month: 'Mar', serum: 210, creme: 175, shampoing: 140 },
                  { month: 'Avr', serum: 200, creme: 165, shampoing: 155 },
                  { month: 'Mai', serum: 225, creme: 180, shampoing: 148 },
                  { month: 'Juin', serum: 240, creme: 190, shampoing: 160 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="serum" name="Sérum Bio Rose" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="creme" name="Crème Nuit Pro" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="shampoing" name="Shampoing Solide" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategic" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" /> Activités Stratégiques</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategicActivities.map(a => (
                    <div key={a.title} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{a.title}</span>
                        <Badge variant={a.status === 'active' ? 'default' : 'secondary'}>{a.status === 'active' ? 'Actif' : 'Planification'}</Badge>
                      </div>
                      <Progress value={a.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{a.progress}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" /> Opportunités & Risques</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map(o => (
                    <div key={o.title} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant={o.impact === 'high' ? 'default' : 'secondary'}>{o.impact === 'high' ? 'Impact élevé' : 'Impact moyen'}</Badge>
                        <p className="text-sm font-medium">{o.title}</p>
                      </div>
                      <Badge variant="outline">{o.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Rapports & Suivi Commissaire</CardTitle>
              <CardDescription>Suivi des obligations réglementaires et rapports aux commissaires</CardDescription>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher..." value={commissaireTable.searchQuery} onChange={e => commissaireTable.setSearchQuery(e.target.value)} className="pl-8 h-9" />
                </div>
                <Select value={commissaireTable.filters.status || 'all'} onValueChange={v => commissaireTable.setFilter('status', v)}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Validé">Validé</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commissaireTable.processedData.map(r => (
                  <div key={r.title} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-sm text-muted-foreground">Échéance: {r.dueDate}</p>
                    </div>
                    <Badge variant={r.status === 'Validé' ? 'default' : r.status === 'En cours' ? 'secondary' : 'outline'}>{r.status}</Badge>
                  </div>
                ))}
                {commissaireTable.processedData.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">Aucun résultat</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;
