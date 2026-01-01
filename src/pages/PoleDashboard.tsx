import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckSquare,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getPoleById } from '@/data/poles';
import { PoleId } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Crown,
  Wallet,
  Cog,
  Code,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  Leaf,
  Megaphone,
  ShieldAlert,
  RefreshCw,
};

// Mock pole-specific data
const poleMetrics = {
  direction: [
    { label: 'Strategic Initiatives', value: 8, status: 'active' },
    { label: 'Board Decisions Pending', value: 2, status: 'pending' },
    { label: 'Cross-Pole Projects', value: 12, status: 'active' },
    { label: 'Compliance Score', value: '99%', status: 'good' },
  ],
  finance: [
    { label: 'Monthly Revenue', value: '€2.4M', status: 'active' },
    { label: 'Pending Invoices', value: 47, status: 'pending' },
    { label: 'Budget Utilization', value: '78%', status: 'good' },
    { label: 'Cash Flow', value: '+€340K', status: 'good' },
  ],
  tech: [
    { label: 'Active Deployments', value: 3, status: 'active' },
    { label: 'Open Issues', value: 24, status: 'pending' },
    { label: 'System Uptime', value: '99.97%', status: 'good' },
    { label: 'Sprint Velocity', value: 42, status: 'active' },
  ],
};

const poleTasks = [
  { id: 1, title: 'Review Q1 projections', priority: 'high', status: 'in_progress', dueDate: '2026-01-05' },
  { id: 2, title: 'Update documentation', priority: 'medium', status: 'pending', dueDate: '2026-01-10' },
  { id: 3, title: 'Team sync meeting', priority: 'low', status: 'completed', dueDate: '2026-01-02' },
];

const poleDocuments = [
  { id: 1, name: 'Operating Procedures v3.2', type: 'procedure', updated: '2025-12-28', status: 'approved' },
  { id: 2, name: 'Q4 Performance Report', type: 'report', updated: '2025-12-31', status: 'review' },
  { id: 3, name: 'Policy Guidelines 2026', type: 'policy', updated: '2025-12-20', status: 'draft' },
];

export default function PoleDashboard() {
  const { poleId } = useParams<{ poleId: string }>();
  const pole = getPoleById(poleId || '');

  if (!pole) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Pole not found</p>
        <Link to="/" className="mt-4">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const Icon = iconMap[pole.icon] || Crown;
  const metrics = poleMetrics[pole.id as keyof typeof poleMetrics] || poleMetrics.direction;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-secondary')}>
              <Icon className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">{pole.name}</h1>
                <span className={cn('h-2.5 w-2.5 rounded-full', pole.color)} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{pole.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </Button>
          <Button size="sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
            <div className="mt-1 flex items-center gap-1">
              <span className={cn(
                'status-dot',
                metric.status === 'good' ? 'status-active' :
                metric.status === 'pending' ? 'status-pending' : 'bg-accent'
              )} />
              <span className="text-xs text-muted-foreground capitalize">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="enterprise-card p-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Monthly report submitted</p>
                    <p className="text-xs text-muted-foreground">2 hours ago · Marie Dubois</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">KPI targets updated for Q1</p>
                    <p className="text-xs text-muted-foreground">5 hours ago · Pierre Laurent</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Review deadline approaching</p>
                    <p className="text-xs text-muted-foreground">Yesterday · System</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="enterprise-card p-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
                Pole Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Team Members</span>
                  <span className="text-sm font-medium text-foreground">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Projects</span>
                  <span className="text-sm font-medium text-foreground">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Documents</span>
                  <span className="text-sm font-medium text-foreground">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compliance Rate</span>
                  <span className="text-sm font-medium text-success">98.5%</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {poleTasks.map((task) => (
            <div key={task.id} className="enterprise-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className={cn(
                  'h-5 w-5',
                  task.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                )} />
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  task.priority === 'high' ? 'destructive' :
                  task.priority === 'medium' ? 'secondary' : 'outline'
                }>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {poleDocuments.map((doc) => (
            <div key={doc.id} className="enterprise-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated: {format(new Date(doc.updated), 'MMM d, yyyy')} · {doc.type}
                  </p>
                </div>
              </div>
              <Badge variant={
                doc.status === 'approved' ? 'default' :
                doc.status === 'review' ? 'secondary' : 'outline'
              }>
                {doc.status}
              </Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="team" className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Team directory coming soon</p>
        </TabsContent>

        <TabsContent value="workflows" className="text-center py-12">
          <Cog className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Workflow automation coming soon</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
