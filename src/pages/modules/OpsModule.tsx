import { useState } from 'react';
import {
  Cog,
  Package,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  Users,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const stockStatus = [
  { category: 'Electronics', available: 12450, reserved: 2300, incoming: 5000, status: 'healthy' },
  { category: 'Fashion', available: 8920, reserved: 1500, incoming: 3200, status: 'healthy' },
  { category: 'Home & Living', available: 4200, reserved: 800, incoming: 1500, status: 'low' },
  { category: 'Sports', available: 6100, reserved: 1200, incoming: 2800, status: 'healthy' },
];

const moqEngagements = [
  { id: 'moq_1', partner: 'Partner A', product: 'Category Electronics', quantity: 5000, deadline: '2026-01-15', status: 'on_track' },
  { id: 'moq_2', partner: 'Partner B', product: 'Category Fashion', quantity: 3200, deadline: '2026-01-20', status: 'on_track' },
  { id: 'moq_3', partner: 'Partner C', product: 'Category Home', quantity: 1500, deadline: '2026-01-10', status: 'at_risk' },
];

const shippingTimelines = [
  { id: 'ship_1', route: 'Asia → EU Hub', avgDays: 18, currentDays: 17, status: 'on_time' },
  { id: 'ship_2', route: 'EU Hub → FR', avgDays: 3, currentDays: 3, status: 'on_time' },
  { id: 'ship_3', route: 'EU Hub → DE', avgDays: 2, currentDays: 4, status: 'delayed' },
  { id: 'ship_4', route: 'EU Hub → ES', avgDays: 4, currentDays: 4, status: 'on_time' },
];

const incidents = [
  { id: 'inc_1', title: 'Shipment delay - Route DE', severity: 'medium', status: 'investigating', createdAt: '2h ago' },
  { id: 'inc_2', title: 'Stock discrepancy - Home category', severity: 'low', status: 'resolved', createdAt: '1d ago' },
  { id: 'inc_3', title: 'Partner sync failure', severity: 'high', status: 'open', createdAt: '3h ago' },
];

const slaMetrics = [
  { metric: 'Order Fulfillment', target: 98, current: 96.5, status: 'warning' },
  { metric: 'Shipping On-Time', target: 95, current: 94.2, status: 'warning' },
  { metric: 'Return Processing', target: 48, current: 42, unit: 'hours', status: 'healthy' },
  { metric: 'Partner Response', target: 24, current: 18, unit: 'hours', status: 'healthy' },
];

export default function OpsModule() {
  const [activeTab, setActiveTab] = useState('stock');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'on_time':
      case 'on_track':
      case 'resolved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Healthy</Badge>;
      case 'low':
      case 'delayed':
      case 'at_risk':
      case 'warning':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">At Risk</Badge>;
      case 'critical':
      case 'open':
      case 'investigating':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">{status === 'open' ? 'Open' : 'Investigating'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <Cog className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Operations</h1>
              <p className="text-sm text-muted-foreground">Logistics, stock, and fulfillment coordination</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            No Financial Access
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Units</p>
                <p className="text-2xl font-bold">{stockStatus.reduce((sum, s) => sum + s.available, 0).toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active MOQs</p>
                <p className="text-2xl font-bold">{moqEngagements.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Incidents</p>
                <p className="text-2xl font-bold">{incidents.filter(i => i.status !== 'resolved').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold">94.8%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="stock">Stock Status</TabsTrigger>
          <TabsTrigger value="moq">MOQ Engagements</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Status (Aggregated)
              </CardTitle>
              <CardDescription>Real-time inventory levels by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockStatus.map((stock) => (
                  <div key={stock.category} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{stock.category}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Available: {stock.available.toLocaleString()}</span>
                          <span>Reserved: {stock.reserved.toLocaleString()}</span>
                          <span className="text-emerald-500">Incoming: +{stock.incoming.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(stock.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moq" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                MOQ Engagements
              </CardTitle>
              <CardDescription>Minimum order quantity commitments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {moqEngagements.map((moq) => (
                  <div key={moq.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{moq.partner}</p>
                          {getStatusBadge(moq.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {moq.product} • {moq.quantity.toLocaleString()} units • Due: {moq.deadline}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Timelines
              </CardTitle>
              <CardDescription>Current transit times vs averages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shippingTimelines.map((route) => (
                  <div key={route.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{route.route}</span>
                        {route.status === 'delayed' && (
                          <Badge className="bg-amber-500 text-xs">Delayed</Badge>
                        )}
                      </div>
                      <span className={cn(
                        'font-semibold',
                        route.status === 'delayed' ? 'text-amber-500' : 'text-emerald-500'
                      )}>
                        {route.currentDays} / {route.avgDays} days
                      </span>
                    </div>
                    <Progress value={(route.avgDays / route.currentDays) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incident Tracking
              </CardTitle>
              <CardDescription>Operational issues and resolution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-4',
                      incident.status === 'open' && 'border-red-500/30 bg-red-500/5',
                      incident.status === 'investigating' && 'border-amber-500/30 bg-amber-500/5',
                      incident.status === 'resolved' && 'border-emerald-500/30 bg-emerald-500/5'
                    )}
                  >
                    <AlertTriangle className={cn(
                      'h-4 w-4 mt-0.5',
                      incident.severity === 'high' && 'text-red-500',
                      incident.severity === 'medium' && 'text-amber-500',
                      incident.severity === 'low' && 'text-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{incident.title}</p>
                          {getSeverityBadge(incident.severity)}
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{incident.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                SLA Monitoring
              </CardTitle>
              <CardDescription>Service level agreement compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slaMetrics.map((sla) => (
                  <div key={sla.metric} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sla.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-semibold',
                          sla.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'
                        )}>
                          {sla.current}{sla.unit ? ` ${sla.unit}` : '%'}
                        </span>
                        <span className="text-muted-foreground">/ {sla.target}{sla.unit ? ` ${sla.unit}` : '%'}</span>
                      </div>
                    </div>
                    <Progress value={sla.unit ? (sla.target / sla.current) * 100 : (sla.current / sla.target) * 100} className="h-2" />
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
