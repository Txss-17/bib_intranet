import { useState } from 'react';
import {
  Headphones,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Mail,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  userId: string;
  status: 'active' | 'at_risk' | 'churning' | 'new';
  totalRevenue: number;
  revenueChange: number;
  productUsage: number;
  lastActivity: string;
  riskScore: number;
}

const userProfiles: UserProfile[] = [
  { id: 'up_1', userId: 'USR-12450', status: 'active', totalRevenue: 45200, revenueChange: 12.5, productUsage: 85, lastActivity: '2h ago', riskScore: 15 },
  { id: 'up_2', userId: 'USR-9823', status: 'at_risk', totalRevenue: 12800, revenueChange: -23.4, productUsage: 35, lastActivity: '5d ago', riskScore: 72 },
  { id: 'up_3', userId: 'USR-15678', status: 'churning', totalRevenue: 8500, revenueChange: -45.2, productUsage: 12, lastActivity: '2w ago', riskScore: 89 },
  { id: 'up_4', userId: 'USR-18901', status: 'new', totalRevenue: 2400, revenueChange: 0, productUsage: 45, lastActivity: '1d ago', riskScore: 28 },
];

const supportTickets = [
  { id: 'tkt_1', subject: 'Order delivery issue', user: 'USR-12450', priority: 'high', status: 'open', createdAt: '2h ago', assignee: 'Marie D.' },
  { id: 'tkt_2', subject: 'Payment refund request', user: 'USR-9823', priority: 'medium', status: 'in_progress', createdAt: '4h ago', assignee: 'Jean P.' },
  { id: 'tkt_3', subject: 'Account verification', user: 'USR-18901', priority: 'low', status: 'resolved', createdAt: '1d ago', assignee: 'Sophie B.' },
];

const riskAlerts = [
  { id: 'alert_1', user: 'USR-9823', type: 'Churn Risk', message: 'Activity dropped 60% in last 30 days', severity: 'high' },
  { id: 'alert_2', user: 'USR-15678', type: 'Engagement Drop', message: 'No product usage in 14 days', severity: 'critical' },
  { id: 'alert_3', user: 'USR-12450', type: 'Support Volume', message: '3 tickets in last 7 days', severity: 'medium' },
];

const emailCampaigns = [
  { id: 'camp_1', name: 'Re-engagement Campaign', status: 'active', sent: 1250, opened: 485, clicked: 142, conversionRate: 11.4 },
  { id: 'camp_2', name: 'New Feature Announcement', status: 'scheduled', sent: 0, opened: 0, clicked: 0, conversionRate: 0, scheduledFor: '2026-01-10' },
  { id: 'camp_3', name: 'Holiday Promotion', status: 'completed', sent: 8500, opened: 3200, clicked: 890, conversionRate: 10.5 },
];

const supportStats = {
  totalUsers: 12450,
  atRiskUsers: 342,
  openTickets: 28,
  avgResolutionTime: '4.2h',
};

export default function SupportModule() {
  const [activeTab, setActiveTab] = useState('profiles');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Active</Badge>;
      case 'at_risk':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">At Risk</Badge>;
      case 'churning':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">Churning</Badge>;
      case 'new':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">New</Badge>;
      case 'open':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Resolved</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500">Critical</Badge>;
      case 'high':
        return <Badge className="bg-amber-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
              <Headphones className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Support & User Intelligence</h1>
              <p className="text-sm text-muted-foreground">User visibility • Guidance & prevention</p>
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
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{supportStats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-rose-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At-Risk Users</p>
                <p className="text-2xl font-bold text-amber-500">{supportStats.atRiskUsers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold">{supportStats.openTickets}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Resolution</p>
                <p className="text-2xl font-bold">{supportStats.avgResolutionTime}</p>
              </div>
              <Clock className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profiles">User Profiles</TabsTrigger>
          <TabsTrigger value="revenue">CA Evolution</TabsTrigger>
          <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Profiles
              </CardTitle>
              <CardDescription>Customer intelligence and engagement data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfiles.map((profile) => (
                  <div key={profile.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono">{profile.userId}</p>
                          {getStatusBadge(profile.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">Last activity: {profile.lastActivity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(profile.totalRevenue)}</p>
                        <p className={cn(
                          'text-sm',
                          profile.revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {profile.revenueChange >= 0 ? '+' : ''}{profile.revenueChange}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Product Usage</p>
                        <div className="flex items-center gap-2">
                          <Progress value={profile.productUsage} className="h-2 flex-1" />
                          <span className="font-medium">{profile.productUsage}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={profile.riskScore} className="h-2 flex-1" />
                          <span className={cn(
                            'font-medium',
                            profile.riskScore <= 30 ? 'text-emerald-500' : profile.riskScore <= 60 ? 'text-amber-500' : 'text-red-500'
                          )}>{profile.riskScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Revenue Evolution
              </CardTitle>
              <CardDescription>Customer revenue trends and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProfiles.map((profile) => (
                  <div key={profile.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        profile.revenueChange >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      )}>
                        {profile.revenueChange >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-mono">{profile.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.revenueChange >= 0 ? 'Growing' : 'Declining'} account
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(profile.totalRevenue)}</p>
                      <p className={cn(
                        'text-sm',
                        profile.revenueChange >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {profile.revenueChange >= 0 ? '+' : ''}{profile.revenueChange}% change
                      </p>
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
                Risk Alerts
              </CardTitle>
              <CardDescription>Proactive user risk monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      alert.severity === 'critical' && 'border-red-500/30 bg-red-500/5',
                      alert.severity === 'high' && 'border-amber-500/30 bg-amber-500/5',
                      alert.severity === 'medium' && 'border-blue-500/30 bg-blue-500/5'
                    )}
                  >
                    <AlertTriangle className={cn(
                      'h-4 w-4 mt-0.5',
                      alert.severity === 'critical' && 'text-red-500',
                      alert.severity === 'high' && 'text-amber-500',
                      alert.severity === 'medium' && 'text-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{alert.user}</p>
                          <Badge variant="outline">{alert.type}</Badge>
                        </div>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Support Tickets
              </CardTitle>
              <CardDescription>Customer support requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportTickets.map((ticket) => (
                  <div key={ticket.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ticket.subject}</p>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ticket.user} • Assigned: {ticket.assignee} • {ticket.createdAt}
                        </p>
                      </div>
                    </div>
                    {getSeverityBadge(ticket.priority)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Campaign Builder
              </CardTitle>
              <CardDescription>User engagement campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailCampaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{campaign.name}</p>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.scheduledFor && (
                        <span className="text-sm text-muted-foreground">Scheduled: {campaign.scheduledFor}</span>
                      )}
                    </div>
                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sent</p>
                          <p className="font-semibold">{campaign.sent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Opened</p>
                          <p className="font-semibold">{campaign.opened.toLocaleString()} ({Math.round((campaign.opened / campaign.sent) * 100)}%)</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clicked</p>
                          <p className="font-semibold">{campaign.clicked.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversion</p>
                          <p className="font-semibold text-emerald-500">{campaign.conversionRate}%</p>
                        </div>
                      </div>
                    )}
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
