import { useState } from 'react';
import {
  RefreshCw,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  DollarSign,
  BarChart3,
  ArrowRight,
  Lock,
  History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LifecycleEntity {
  id: string;
  type: 'user' | 'supplier';
  name: string;
  status: 'active' | 'restricted' | 'exiting' | 'suspended';
  financialExposure: number;
  stockEngagement: number;
  riskScore: number;
  lastActivity: string;
  joinedAt: string;
}

const entities: LifecycleEntity[] = [
  { id: 'ent_1', type: 'user', name: 'User #USR-12450', status: 'active', financialExposure: 2500, stockEngagement: 12, riskScore: 15, lastActivity: '2h ago', joinedAt: '2024-03-15' },
  { id: 'ent_2', type: 'supplier', name: 'Supplier #SUP-445', status: 'restricted', financialExposure: 125000, stockEngagement: 450, riskScore: 68, lastActivity: '1d ago', joinedAt: '2023-06-20' },
  { id: 'ent_3', type: 'user', name: 'User #USR-9823', status: 'exiting', financialExposure: 0, stockEngagement: 0, riskScore: 5, lastActivity: '5d ago', joinedAt: '2024-01-10' },
  { id: 'ent_4', type: 'supplier', name: 'Supplier #SUP-221', status: 'active', financialExposure: 89000, stockEngagement: 280, riskScore: 22, lastActivity: '4h ago', joinedAt: '2023-09-05' },
  { id: 'ent_5', type: 'user', name: 'User #USR-15678', status: 'suspended', financialExposure: 1200, stockEngagement: 3, riskScore: 85, lastActivity: '2w ago', joinedAt: '2024-08-22' },
];

const exitProcedures = [
  { id: 'exit_1', entity: 'User #USR-9823', type: 'user', reason: 'Account closure request', initiatedAt: '2026-01-01', status: 'pending_verification', steps: 3, completedSteps: 1 },
  { id: 'exit_2', entity: 'Supplier #SUP-102', type: 'supplier', reason: 'Contract termination', initiatedAt: '2025-12-28', status: 'in_progress', steps: 5, completedSteps: 3 },
];

const riskAlerts = [
  { id: 'alert_1', entity: 'Supplier #SUP-445', type: 'High risk score', message: 'Risk score increased to 68 - compliance issues detected', timestamp: '2h ago' },
  { id: 'alert_2', entity: 'User #USR-15678', type: 'Account suspended', message: 'Multiple policy violations - manual review required', timestamp: '2w ago' },
  { id: 'alert_3', entity: 'Supplier #SUP-221', type: 'Stock engagement', message: 'Stock levels below minimum threshold', timestamp: '6h ago' },
];

const lifecycleStats = {
  activeUsers: 12450,
  activeSuppliers: 342,
  restrictedEntities: 23,
  exitingEntities: 8,
  avgRiskScore: 24,
};

export default function LifecycleModule() {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Active</Badge>;
      case 'restricted':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Restricted</Badge>;
      case 'exiting':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Exiting</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Suspended</Badge>;
      case 'pending_verification':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Pending Verification</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-emerald-500';
    if (score <= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <RefreshCw className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">User & Supplier Lifecycle</h1>
              <p className="text-sm text-muted-foreground">Onboarding to exit • Historical retention</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            No Manual Deletion
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{lifecycleStats.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="h-6 w-6 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold">{lifecycleStats.activeSuppliers}</p>
              </div>
              <Package className="h-6 w-6 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Restricted</p>
                <p className="text-2xl font-bold">{lifecycleStats.restrictedEntities}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exiting</p>
                <p className="text-2xl font-bold">{lifecycleStats.exitingEntities}</p>
              </div>
              <ArrowRight className="h-6 w-6 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Risk Score</p>
                <p className={cn('text-2xl font-bold', getRiskColor(lifecycleStats.avgRiskScore))}>{lifecycleStats.avgRiskScore}</p>
              </div>
              <Shield className="h-6 w-6 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Entity Status</TabsTrigger>
          <TabsTrigger value="exposure">Financial Exposure</TabsTrigger>
          <TabsTrigger value="risk">Risk Profiles</TabsTrigger>
          <TabsTrigger value="exit">Exit Procedures</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Entity Status Overview
              </CardTitle>
              <CardDescription>Users and suppliers lifecycle status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entities.map((entity) => (
                  <div key={entity.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        entity.type === 'user' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                      )}>
                        {entity.type === 'user' ? (
                          <Users className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Package className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entity.name}</p>
                          {getStatusBadge(entity.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined: {entity.joinedAt} • Last activity: {entity.lastActivity}
                        </p>
                      </div>
                    </div>
                    <div className={cn('font-medium', getRiskColor(entity.riskScore))}>
                      Risk: {entity.riskScore}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exposure" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Exposure
              </CardTitle>
              <CardDescription>Outstanding balances and stock engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entities.filter(e => e.financialExposure > 0).map((entity) => (
                  <div key={entity.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{entity.name}</p>
                        {getStatusBadge(entity.status)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Financial Exposure</p>
                        <p className="text-lg font-semibold">{formatCurrency(entity.financialExposure)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock Engagement</p>
                        <p className="text-lg font-semibold">{entity.stockEngagement} units</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Risk Profiles
              </CardTitle>
              <CardDescription>Entity risk assessment scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {entities.sort((a, b) => b.riskScore - a.riskScore).map((entity) => (
                  <div key={entity.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entity.name}</span>
                        {getStatusBadge(entity.status)}
                      </div>
                      <span className={cn('font-bold', getRiskColor(entity.riskScore))}>
                        {entity.riskScore}/100
                      </span>
                    </div>
                    <Progress value={entity.riskScore} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-4 w-4" />
                Exit Procedures
              </CardTitle>
              <CardDescription>Ongoing offboarding processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exitProcedures.map((exit) => (
                  <div key={exit.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{exit.entity}</p>
                        {getStatusBadge(exit.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">Initiated: {exit.initiatedAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{exit.reason}</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{exit.completedSteps} / {exit.steps} steps</span>
                      </div>
                      <Progress value={(exit.completedSteps / exit.steps) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Automated Alerts
              </CardTitle>
              <CardDescription>Risk and compliance notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.entity}</p>
                          <Badge variant="outline" className="text-xs">{alert.type}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
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
