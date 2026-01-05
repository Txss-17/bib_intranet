import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, Package, AlertTriangle, 
  DollarSign, Truck, Shield, Leaf, BarChart3, Clock,
  Target, Activity, AlertCircle, CheckCircle2, ArrowUpRight,
  Building2, Briefcase, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data for Executive Dashboard
const globalKPIs = {
  revenue: { value: 2450000, change: 12.5, target: 3000000 },
  activeUsers: { value: 1247, change: 8.3, target: 1500 },
  burnRate: { value: 85000, change: -5.2 },
  cashRunway: { value: 18, unit: 'mois' },
  esgScore: { value: 78, change: 4.5 },
  supplierCompliance: { value: 94, target: 100 }
};

const criticalAlerts = [
  { id: '1', type: 'finance', message: 'Cashflow critique prévu dans 45 jours', severity: 'high', pole: 'Finance' },
  { id: '2', type: 'supplier', message: 'Certification ISO expirée - Fournisseur Alpha', severity: 'critical', pole: 'Fournisseurs' },
  { id: '3', type: 'ops', message: '3 commandes en retard de livraison', severity: 'medium', pole: 'Ops' },
  { id: '4', type: 'risk', message: 'Utilisateur à risque impayé identifié', severity: 'high', pole: 'Lifecycle' },
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

const recentDecisions = [
  { id: '1', title: 'Validation nouveau fournisseur EcoPack', date: '2026-01-04', status: 'approved', by: 'CEO' },
  { id: '2', title: 'Investissement infrastructure Tech Q1', date: '2026-01-03', status: 'pending', by: 'Direction' },
  { id: '3', title: 'Partenariat logistique Byrd Extended', date: '2026-01-02', status: 'approved', by: 'CEO' },
];

const ExecutiveDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Vue consolidée - LINKSY Group</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Mis à jour il y a 5 min
          </Badge>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.filter(a => a.severity === 'critical').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">
                {criticalAlerts.filter(a => a.severity === 'critical').length} alerte(s) critique(s) requièrent votre attention
              </span>
              <Button variant="destructive" size="sm" className="ml-auto">
                Voir les alertes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <Badge variant="outline" className="text-emerald-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{globalKPIs.revenue.change}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">€{(globalKPIs.revenue.value / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-muted-foreground">Revenue YTD</p>
            <Progress value={(globalKPIs.revenue.value / globalKPIs.revenue.target) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-500" />
              <Badge variant="outline" className="text-emerald-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{globalKPIs.activeUsers.change}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{globalKPIs.activeUsers.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Utilisateurs actifs</p>
            <Progress value={(globalKPIs.activeUsers.value / globalKPIs.activeUsers.target) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-orange-500" />
              <Badge variant="outline" className="text-emerald-500">
                <TrendingDown className="h-3 w-3 mr-1" />
                {globalKPIs.burnRate.change}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">€{(globalKPIs.burnRate.value / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Burn Rate / mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{globalKPIs.cashRunway.value}</p>
            <p className="text-xs text-muted-foreground">Runway (mois)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Leaf className="h-5 w-5 text-emerald-500" />
              <Badge variant="outline" className="text-emerald-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{globalKPIs.esgScore.change}
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-2">{globalKPIs.esgScore.value}/100</p>
            <p className="text-xs text-muted-foreground">Score ESG</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{globalKPIs.supplierCompliance.value}%</p>
            <p className="text-xs text-muted-foreground">Conformité fournisseurs</p>
            <Progress value={globalKPIs.supplierCompliance.value} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="decisions">Décisions</TabsTrigger>
          <TabsTrigger value="poles">Performance Pôles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pole Performance Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance des Pôles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {polePerformance.map(pole => (
                    <div key={pole.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(pole.status)} bg-current`} />
                        <span className="font-medium">{pole.name}</span>
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

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes Récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">Pôle: {alert.pole}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les Alertes Critiques</CardTitle>
              <CardDescription>Alertes nécessitant une attention immédiate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {criticalAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">Pôle: {alert.pole}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Ignorer</Button>
                      <Button size="sm">Traiter</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Décisions Récentes</CardTitle>
              <CardDescription>Historique des arbitrages et validations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDecisions.map(decision => (
                  <div key={decision.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {decision.status === 'approved' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{decision.title}</p>
                        <p className="text-sm text-muted-foreground">{decision.date} • Par {decision.by}</p>
                      </div>
                    </div>
                    <Badge variant={decision.status === 'approved' ? 'default' : 'secondary'}>
                      {decision.status === 'approved' ? 'Approuvé' : 'En attente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poles" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {polePerformance.map(pole => (
              <Card key={pole.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{pole.name}</h3>
                    <span className={`h-3 w-3 rounded-full ${getStatusColor(pole.status)} bg-current`} />
                  </div>
                  <div className="text-3xl font-bold mb-2">{pole.score}%</div>
                  <Progress value={pole.score} className="h-2" />
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    {pole.trend === 'up' && <><TrendingUp className="h-4 w-4 text-emerald-500" /> En progression</>}
                    {pole.trend === 'down' && <><TrendingDown className="h-4 w-4 text-destructive" /> En baisse</>}
                    {pole.trend === 'stable' && <>— Stable</>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;
