import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react';

const stats = [
  { label: 'Incidents actifs', value: 5, icon: AlertTriangle, severity: 'critical' },
  { label: 'Risques surveillés', value: 23, icon: Shield, severity: 'warning' },
  { label: 'Score risque global', value: '72/100', icon: Activity, severity: 'info' },
  { label: 'Temps résolution moy.', value: '4.2h', icon: Clock, severity: 'info' },
];

const recentIncidents = [
  { id: 'INC-045', title: 'Retard livraison lot #B789', severity: 'high', status: 'investigating', time: 'Il y a 2h' },
  { id: 'INC-044', title: 'Alerte qualité produit', severity: 'critical', status: 'mitigating', time: 'Il y a 5h' },
  { id: 'INC-043', title: 'Problème système paiement', severity: 'medium', status: 'resolved', time: 'Hier' },
  { id: 'INC-042', title: 'Fournisseur non conforme', severity: 'high', status: 'monitoring', time: 'Hier' },
];

export default function RiskDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Risques & Incidents</h1>
        <p className="text-muted-foreground">Surveillance et gestion des risques opérationnels</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${
                stat.severity === 'critical' ? 'text-red-600' :
                stat.severity === 'warning' ? 'text-yellow-600' : 'text-muted-foreground'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incidents récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    incident.severity === 'critical' ? 'destructive' :
                    incident.severity === 'high' ? 'destructive' : 'secondary'
                  }>
                    {incident.severity === 'critical' ? 'Critique' :
                     incident.severity === 'high' ? 'Élevé' : 'Moyen'}
                  </Badge>
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{incident.id} • {incident.time}</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {incident.status === 'investigating' ? 'Investigation' :
                   incident.status === 'mitigating' ? 'Mitigation' :
                   incident.status === 'monitoring' ? 'Surveillance' : 'Résolu'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
