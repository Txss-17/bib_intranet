import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, Database, Cloud, Cpu, HardDrive, Activity } from 'lucide-react';

const services = [
  { name: 'API Gateway', status: 'operational', uptime: 99.99, cpu: 45, memory: 62, icon: Server },
  { name: 'PostgreSQL Primary', status: 'operational', uptime: 99.95, cpu: 38, memory: 78, icon: Database },
  { name: 'Redis Cache', status: 'operational', uptime: 99.99, cpu: 12, memory: 45, icon: Database },
  { name: 'CDN', status: 'operational', uptime: 100, cpu: 8, memory: 25, icon: Cloud },
  { name: 'Queue Workers', status: 'degraded', uptime: 98.5, cpu: 85, memory: 90, icon: Cpu },
  { name: 'Storage', status: 'operational', uptime: 99.99, cpu: 15, memory: 55, icon: HardDrive },
];

export default function Infrastructure() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Infrastructure</h1>
        <p className="text-muted-foreground">Monitoring et état des services</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6/6</div>
            <p className="text-xs text-muted-foreground">Tous les services sont en ligne</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime Global</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">99.57%</div>
            <p className="text-xs text-muted-foreground">30 derniers jours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">1</div>
            <p className="text-xs text-muted-foreground">Service dégradé</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                  </div>
                  <Badge variant={service.status === 'operational' ? 'default' : 'destructive'}>
                    {service.status === 'operational' ? 'Opérationnel' : 'Dégradé'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{service.uptime}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CPU</span>
                    <span className="font-medium">{service.cpu}%</span>
                  </div>
                  <Progress value={service.cpu} className={service.cpu > 80 ? 'bg-red-100' : ''} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mémoire</span>
                    <span className="font-medium">{service.memory}%</span>
                  </div>
                  <Progress value={service.memory} className={service.memory > 80 ? 'bg-red-100' : ''} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
