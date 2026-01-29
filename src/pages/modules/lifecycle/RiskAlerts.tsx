import React from 'react';
import { 
  AlertTriangle, CreditCard, Package, Clock,
  Bell, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRiskAlerts, useUserAccountStats } from '@/hooks/useLifecycle';

const RiskAlerts = () => {
  const { data: alerts, isLoading } = useRiskAlerts();
  const { data: stats } = useUserAccountStats();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'stock': return <Package className="h-5 w-5" />;
      case 'inactivity': return <Clock className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const criticalCount = alerts?.filter(a => a.severity === 'critical').length ?? 0;
  const highCount = alerts?.filter(a => a.severity === 'high').length ?? 0;
  const paymentAlerts = alerts?.filter(a => a.type === 'payment') ?? [];
  const totalAtRisk = paymentAlerts.reduce((sum, a) => sum + (a.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Prévention & Alertes
          </h1>
          <p className="text-muted-foreground mt-1">Impayés imminents, stock non écoulé, inactivité</p>
        </div>
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Configurer alertes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={criticalCount > 0 ? "border-destructive" : ""}>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-destructive">{criticalCount}</p>
            <p className="text-sm text-muted-foreground">Alertes critiques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-orange-500">{highCount}</p>
            <p className="text-sm text-muted-foreground">Alertes hautes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold">€{totalAtRisk.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Montant à risque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold">{alerts?.length ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total alertes</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({alerts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="payment">Paiements ({paymentAlerts.length})</TabsTrigger>
          <TabsTrigger value="stock">Stock ({alerts?.filter(a => a.type === 'stock').length ?? 0})</TabsTrigger>
          <TabsTrigger value="inactivity">Inactivité ({alerts?.filter(a => a.type === 'inactivity').length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {alerts?.map(alert => (
            <Card key={alert.id} className={alert.severity === 'critical' ? 'border-destructive' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${alert.severity === 'critical' ? 'bg-destructive/10' : 'bg-muted'}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{alert.company}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {alert.amount > 0 && (
                      <span className="text-lg font-bold">€{alert.amount.toLocaleString()}</span>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Ignorer</Button>
                      <Button size="sm">Traiter</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!alerts || alerts.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune alerte active - Tous les utilisateurs sont en règle
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payment" className="mt-4 space-y-4">
          {paymentAlerts.map(alert => (
            <Card key={alert.id} className={alert.severity === 'critical' ? 'border-destructive' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${alert.severity === 'critical' ? 'bg-destructive/10' : 'bg-muted'}`}>
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{alert.company}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">€{alert.amount.toLocaleString()}</span>
                    <Button size="sm">Traiter</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stock" className="mt-4 space-y-4">
          {alerts?.filter(a => a.type === 'stock').map(alert => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{alert.company}</h3>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Voir détails</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="inactivity" className="mt-4 space-y-4">
          {alerts?.filter(a => a.type === 'inactivity').map(alert => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{alert.company}</h3>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Contacter</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskAlerts;
