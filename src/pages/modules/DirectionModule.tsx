import { useState } from 'react';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Leaf,
  Users,
  DollarSign,
  Shield,
  BarChart3,
  Eye,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const globalKPIs = [
  { id: 'kpi_1', label: 'Monthly Revenue', value: '€4.8M', change: 12.5, trend: 'up', icon: DollarSign },
  { id: 'kpi_2', label: 'Active Users', value: '124.5K', change: 8.2, trend: 'up', icon: Users },
  { id: 'kpi_3', label: 'Gross Margin', value: '34.2%', change: 2.1, trend: 'up', icon: TrendingUp },
  { id: 'kpi_4', label: 'Customer Satisfaction', value: '4.6/5', change: 0.2, trend: 'up', icon: Users },
];

const riskHeatmap = [
  { category: 'Financial', level: 'low', score: 22, details: 'Healthy cash reserves, stable revenue' },
  { category: 'Operational', level: 'medium', score: 45, details: '2 shipping delays under investigation' },
  { category: 'Compliance', level: 'low', score: 18, details: 'All markets fully compliant' },
  { category: 'Reputational', level: 'low', score: 15, details: 'Strong Trustpilot ratings maintained' },
  { category: 'Security', level: 'low', score: 12, details: 'No active security incidents' },
  { category: 'Market', level: 'medium', score: 38, details: 'Competitor activity in key segments' },
];

const esgSummary = {
  overallScore: 78,
  environmental: 82,
  social: 75,
  governance: 76,
  trend: 'improving',
  highlights: [
    'CO₂ offset: 2,450 tonnes',
    'Recycling rate: 79.7%',
    'Employee satisfaction: 87%',
    'Board diversity: 42%',
  ],
};

const strategicAlerts = [
  { id: 'alert_1', type: 'opportunity', title: 'Market Expansion', message: 'UK market showing 25% growth potential', priority: 'high', timestamp: '2h ago' },
  { id: 'alert_2', type: 'risk', title: 'Supplier Concentration', message: 'Top 3 suppliers represent 45% of volume', priority: 'medium', timestamp: '1d ago' },
  { id: 'alert_3', type: 'milestone', title: 'Quarterly Target', message: 'Q1 revenue on track to exceed target by 8%', priority: 'info', timestamp: '4h ago' },
];

export default function DirectionModule() {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'risk': return 'border-amber-500/30 bg-amber-500/5';
      case 'milestone': return 'border-blue-500/30 bg-blue-500/5';
      default: return 'border-muted';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'milestone': return <BarChart3 className="h-4 w-4 text-blue-500" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
              <p className="text-sm text-muted-foreground">High-level insights • No operational controls</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          Read-Only View
        </Badge>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {globalKPIs.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.id} className="enterprise-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-sm',
                      kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </div>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Heatmap */}
        <Card className="enterprise-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk Heatmap
            </CardTitle>
            <CardDescription>Enterprise risk overview by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskHeatmap.map((risk) => (
                <div key={risk.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-3 w-3 rounded-full', getRiskColor(risk.level))} />
                      <span className="font-medium">{risk.category}</span>
                    </div>
                    <span className={cn('font-semibold', getRiskTextColor(risk.level))}>
                      {risk.score}/100
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-5">{risk.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ESG Score */}
        <Card className="enterprise-card border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-4 w-4 text-emerald-500" />
              ESG Score
            </CardTitle>
            <CardDescription>Environmental, Social & Governance performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-6">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-emerald-500">{esgSummary.overallScore}</span>
                  <span className="text-muted-foreground">/100</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-500 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Improving trend
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Environmental</span>
                    <span className="font-medium">{esgSummary.environmental}</span>
                  </div>
                  <Progress value={esgSummary.environmental} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Social</span>
                    <span className="font-medium">{esgSummary.social}</span>
                  </div>
                  <Progress value={esgSummary.social} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Governance</span>
                    <span className="font-medium">{esgSummary.governance}</span>
                  </div>
                  <Progress value={esgSummary.governance} className="h-2" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {esgSummary.highlights.map((highlight, i) => (
                <Badge key={i} variant="secondary" className="justify-start text-xs">
                  {highlight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Alerts */}
      <Card className="enterprise-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Strategic Alerts
          </CardTitle>
          <CardDescription>Key developments requiring executive awareness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {strategicAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn('flex items-start gap-3 rounded-lg border p-4', getAlertStyle(alert.type))}
              >
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{alert.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">{alert.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alert.timestamp}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
