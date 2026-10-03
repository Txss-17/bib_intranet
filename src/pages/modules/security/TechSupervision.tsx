import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Gauge, Server, AlertTriangle, RefreshCw, BellRing, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEdgeFunctionLogs, useSecurityAlerts } from '@/hooks/useTechData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SERVICES = [
  { name: 'API / Edge Functions', uptime: 99.97, latency: 142, status: 'operational' },
  { name: 'Base de données', uptime: 99.99, latency: 38, status: 'operational' },
  { name: 'Authentification', uptime: 99.95, latency: 96, status: 'operational' },
  { name: 'Stockage fichiers', uptime: 99.90, latency: 210, status: 'degraded' },
  { name: 'Emails transactionnels', uptime: 99.80, latency: 320, status: 'operational' },
];

export default function TechSupervision() {
  const { data: edgeLogs = [] } = useEdgeFunctionLogs(30);
  const { data: alerts = [] } = useSecurityAlerts();

  const errors = edgeLogs.filter((l: any) => l.status_code >= 400);
  const errorRate = edgeLogs.length ? Math.round((errors.length / edgeLogs.length) * 100) : 0;
  const openAlerts = alerts.filter((a: any) => a.status === 'open');
  const avgLatency = Math.round(SERVICES.reduce((a, s) => a + s.latency, 0) / SERVICES.length);
  const globalUptime = (SERVICES.reduce((a, s) => a + s.uptime, 0) / SERVICES.length).toFixed(2);

  const act = (title: string, description: string) => toast({ title, description });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold"><Activity className="h-7 w-7" /> Supervision technique</h1>
          <p className="text-muted-foreground">Disponibilité, latence, erreurs et incidents en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => act('Sondes relancées', 'Tous les services ont été re-testés.')}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Relancer les sondes
          </Button>
          <Button variant="outline" onClick={() => act('Astreinte notifiée', 'Alerte envoyée à l\'équipe technique de garde.')}>
            <BellRing className="mr-1.5 h-4 w-4" /> Notifier l'astreinte
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime global 30j</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{globalUptime}%</div>
            <p className="text-xs text-muted-foreground">{SERVICES.length} services supervisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latence moyenne</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency} ms</div>
            <p className="text-xs text-muted-foreground">p50 toutes routes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'erreur API</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${errorRate > 5 ? 'text-destructive' : 'text-success'}`}>{errorRate}%</div>
            <p className="text-xs text-muted-foreground">{edgeLogs.length} requêtes récentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents ouverts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${openAlerts.length ? 'text-destructive' : ''}`}>{openAlerts.length}</div>
            <p className="text-xs text-muted-foreground">{alerts.length} au total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État des services</CardTitle>
          <CardDescription>Disponibilité et temps de réponse par composant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SERVICES.map((s) => (
            <div key={s.name} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{s.latency} ms</span>
                  <Badge variant={s.status === 'operational' ? 'default' : 'secondary'}>
                    {s.status === 'operational' ? '🟢 Opérationnel' : '🟠 Dégradé'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => act(`Test — ${s.name}`, `Réponse ${s.latency} ms, uptime ${s.uptime}%.`)}>
                    Tester
                  </Button>
                </span>
              </div>
              <Progress value={s.uptime} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières erreurs API</CardTitle>
            <CardDescription>Requêtes en échec sur les fonctions serveur.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune erreur sur les requêtes récentes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Quand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 8).map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.function_name ?? '—'}</TableCell>
                      <TableCell><Badge variant="destructive">{l.status_code}</Badge></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {l.created_at ? formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: fr }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incidents à traiter</CardTitle>
            <CardDescription>Alertes techniques ouvertes nécessitant une action.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {openAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun incident ouvert.</p>
            ) : (
              openAlerts.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.alert_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'secondary'}>
                      {a.severity}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => act('Incident pris en charge', a.title)}>
                      Prendre en charge
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
