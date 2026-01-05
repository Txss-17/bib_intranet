import React from 'react';
import { 
  AlertTriangle, CreditCard, Package, Clock,
  TrendingDown, Bell, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const alerts = [
  { id: '1', type: 'payment', company: 'SkinCare Plus', message: 'Impayé depuis 45 jours', amount: 2400, severity: 'critical', date: '2026-01-05' },
  { id: '2', type: 'payment', company: 'CosmetiCare', message: 'Retard paiement 15 jours', amount: 1200, severity: 'high', date: '2026-01-04' },
  { id: '3', type: 'stock', company: 'Natural Glow', message: 'Stock non écoulé > 90 jours', amount: 0, severity: 'medium', date: '2026-01-03' },
  { id: '4', type: 'inactivity', company: 'Fresh Face', message: 'Aucune commande depuis 60 jours', amount: 0, severity: 'low', date: '2026-01-02' },
  { id: '5', type: 'payment', company: 'Bio Essence', message: 'Échéance prochaine dans 5 jours', amount: 3500, severity: 'medium', date: '2026-01-01' },
];

const RiskAlerts = () => {
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

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

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
        <Card className="border-destructive">
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
            <p className="text-3xl font-bold">€{alerts.filter(a => a.type === 'payment').reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Montant à risque</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-3xl font-bold">{alerts.length}</p>
            <p className="text-sm text-muted-foreground">Total alertes</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Toutes ({alerts.length})</TabsTrigger>
          <TabsTrigger value="payment">Paiements ({alerts.filter(a => a.type === 'payment').length})</TabsTrigger>
          <TabsTrigger value="stock">Stock ({alerts.filter(a => a.type === 'stock').length})</TabsTrigger>
          <TabsTrigger value="inactivity">Inactivité ({alerts.filter(a => a.type === 'inactivity').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {alerts.map(alert => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskAlerts;
