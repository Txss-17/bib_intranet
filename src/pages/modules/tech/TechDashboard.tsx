import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Shield, Rocket, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TechDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pôle Tech</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'infrastructure et des déploiements</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déploiements</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">99.9%</div>
            <p className="text-xs text-muted-foreground">30 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">3</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Actifs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">En production</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Derniers Déploiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { version: 'v2.4.1', env: 'Production', status: 'success', time: 'Il y a 2h' },
                { version: 'v2.4.0', env: 'Staging', status: 'success', time: 'Il y a 5h' },
                { version: 'v2.3.9', env: 'Production', status: 'rollback', time: 'Hier' },
              ].map((deploy, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {deploy.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">{deploy.version}</p>
                      <p className="text-sm text-muted-foreground">{deploy.time}</p>
                    </div>
                  </div>
                  <Badge variant={deploy.env === 'Production' ? 'default' : 'secondary'}>
                    {deploy.env}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut Infrastructure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'API Gateway', status: 'operational' },
                { name: 'Base de données', status: 'operational' },
                { name: 'CDN', status: 'operational' },
                { name: 'Queue Workers', status: 'degraded' },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <Badge variant={service.status === 'operational' ? 'default' : 'destructive'}>
                    {service.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
