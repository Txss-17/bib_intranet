import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Scale, AlertTriangle, Shield } from 'lucide-react';

const stats = [
  { label: 'Contrats actifs', value: 156, icon: FileText, trend: '+8' },
  { label: 'Politiques en vigueur', value: 24, icon: Scale, trend: '0' },
  { label: 'Litiges en cours', value: 3, icon: AlertTriangle, trend: '-1' },
  { label: 'Risques identifiés', value: 12, icon: Shield, trend: '+2' },
];

const recentActivity = [
  { type: 'contract', action: 'Contrat fournisseur #C-2024-089 signé', time: 'Il y a 2h', status: 'success' },
  { type: 'dispute', action: 'Nouveau litige ouvert - Client XYZ', time: 'Il y a 5h', status: 'warning' },
  { type: 'policy', action: 'Politique RGPD mise à jour', time: 'Hier', status: 'info' },
  { type: 'risk', action: 'Risque #R-045 réévalué à "Moyen"', time: 'Hier', status: 'info' },
];

export default function ComplianceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compliance & Legal</h1>
        <p className="text-muted-foreground">Gestion des contrats, politiques et conformité juridique</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.trend.startsWith('+') ? (
                  <span className="text-green-600">{stat.trend}</span>
                ) : stat.trend.startsWith('-') ? (
                  <span className="text-red-600">{stat.trend}</span>
                ) : (
                  <span>{stat.trend}</span>
                )} ce mois
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant={
                  activity.status === 'success' ? 'default' :
                  activity.status === 'warning' ? 'destructive' : 'secondary'
                }>
                  {activity.status === 'success' ? 'Complété' :
                   activity.status === 'warning' ? 'Attention' : 'Info'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
