import { useState } from 'react';
import {
  Code,
  Bot,
  FlaskConical,
  ToggleRight,
  FileText,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  GitBranch,
  Server,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const agentPerformance = [
  { id: 'agent_1', name: 'Support Agent', type: 'Customer Service', status: 'active', accuracy: 94.5, queries: 12450, avgResponseTime: '1.2s' },
  { id: 'agent_2', name: 'Classification Agent', type: 'Data Processing', status: 'active', accuracy: 97.8, queries: 45200, avgResponseTime: '0.3s' },
  { id: 'agent_3', name: 'Fraud Detection Agent', type: 'Security', status: 'active', accuracy: 99.2, queries: 8900, avgResponseTime: '0.5s' },
  { id: 'agent_4', name: 'Recommendation Agent', type: 'Personalization', status: 'testing', accuracy: 88.3, queries: 2100, avgResponseTime: '0.8s' },
];

const experiments = [
  { id: 'exp_1', name: 'New checkout flow', hypothesis: 'Reduce cart abandonment by 15%', status: 'running', progress: 65, startDate: '2025-12-15', metric: 'conversion_rate' },
  { id: 'exp_2', name: 'AI-powered search', hypothesis: 'Increase search relevance by 20%', status: 'concluded', progress: 100, startDate: '2025-11-01', metric: 'click_through_rate', result: 'positive' },
  { id: 'exp_3', name: 'Dynamic pricing model', hypothesis: 'Optimize margin by 5%', status: 'planned', progress: 0, startDate: '2026-01-15', metric: 'avg_margin' },
];

const featureFlags = [
  { id: 'ff_1', name: 'new_dashboard', description: 'New executive dashboard layout', enabled: true, rollout: 100, createdAt: '2025-12-20' },
  { id: 'ff_2', name: 'ai_recommendations', description: 'AI-powered product recommendations', enabled: true, rollout: 50, createdAt: '2025-12-01' },
  { id: 'ff_3', name: 'beta_checkout', description: 'New checkout experience', enabled: false, rollout: 0, createdAt: '2025-12-28' },
  { id: 'ff_4', name: 'dark_mode_v2', description: 'Enhanced dark mode theme', enabled: true, rollout: 25, createdAt: '2026-01-02' },
];

const rdReports = [
  { id: 'rd_1', title: 'Q4 2025 R&D Summary', type: 'Quarterly', date: '2025-12-31', highlights: ['3 new agents deployed', '15% performance improvement', '2 patents filed'] },
  { id: 'rd_2', title: 'Agent Performance Analysis', type: 'Technical', date: '2025-12-15', highlights: ['99.9% uptime', 'Cost reduction achieved', 'Scaling plan approved'] },
];

const techStats = {
  deployments: 47,
  uptime: '99.97%',
  activeAgents: 4,
  experiments: 3,
};

export default function TechModule() {
  const [activeTab, setActiveTab] = useState('agents');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Active</Badge>;
      case 'testing':
      case 'planned':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">{status}</Badge>;
      case 'concluded':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">Concluded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-emerald-500';
    if (accuracy >= 85) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <Code className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tech & R&D</h1>
              <p className="text-sm text-muted-foreground">Innovation under control • Agent management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deployments (30d)</p>
                <p className="text-2xl font-bold">{techStats.deployments}</p>
              </div>
              <GitBranch className="h-8 w-8 text-cyan-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold text-emerald-500">{techStats.uptime}</p>
              </div>
              <Server className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">{techStats.activeAgents}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Experiments</p>
                <p className="text-2xl font-bold">{techStats.experiments}</p>
              </div>
              <FlaskConical className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="reports">R&D Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Agent Performance
              </CardTitle>
              <CardDescription>Real-time agent metrics and health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div key={agent.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{agent.name}</p>
                          {getStatusBadge(agent.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.type}</p>
                      </div>
                      <div className={cn('text-2xl font-bold', getAccuracyColor(agent.accuracy))}>
                        {agent.accuracy}%
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Queries</p>
                        <p className="font-semibold">{agent.queries.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg. Response</p>
                        <p className="font-semibold">{agent.avgResponseTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Accuracy</p>
                        <Progress value={agent.accuracy} className="h-2 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Experiments
              </CardTitle>
              <CardDescription>A/B tests and feature experiments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.map((exp) => (
                  <div key={exp.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{exp.name}</p>
                          {getStatusBadge(exp.status)}
                          {exp.result && (
                            <Badge className={exp.result === 'positive' ? 'bg-emerald-500' : 'bg-red-500'}>
                              {exp.result}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{exp.hypothesis}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">Started: {exp.startDate}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{exp.progress}%</span>
                      </div>
                      <Progress value={exp.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ToggleRight className="h-4 w-4" />
                Feature Flags
              </CardTitle>
              <CardDescription>Feature rollout management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {featureFlags.map((flag) => (
                  <div key={flag.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        flag.enabled ? 'bg-emerald-500/10' : 'bg-muted'
                      )}>
                        <Zap className={cn('h-4 w-4', flag.enabled ? 'text-emerald-500' : 'text-muted-foreground')} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{flag.name}</p>
                          {flag.enabled ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs">
                              {flag.rollout}% rollout
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{flag.createdAt}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                R&D Reports
              </CardTitle>
              <CardDescription>Research and development documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rdReports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{report.title}</p>
                        <Badge variant="outline">{report.type}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{report.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.highlights.map((highlight, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {highlight}
                        </Badge>
                      ))}
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
