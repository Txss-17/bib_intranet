import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const metrics = [
  { label: 'Incidents ce mois', value: 12, previous: 15, icon: AlertTriangle },
  { label: 'Temps résolution moyen', value: '4.2h', previous: '5.1h', icon: Clock },
  { label: 'Taux résolution 24h', value: '92%', previous: '88%', icon: CheckCircle },
  { label: 'Score risque global', value: 72, previous: 68, icon: TrendingDown },
];

const categoryStats = [
  { category: 'Tech', incidents: 4, avgResolution: '2.5h', trend: -20 },
  { category: 'Supply Chain', incidents: 3, avgResolution: '8h', trend: +10 },
  { category: 'Finance', incidents: 2, avgResolution: '3h', trend: -50 },
  { category: 'Client', incidents: 2, avgResolution: '4h', trend: 0 },
  { category: 'Fournisseur', incidents: 1, avgResolution: '12h', trend: -30 },
];

const monthlyTrend = [
  { month: 'Sept', incidents: 18, resolved: 18 },
  { month: 'Oct', incidents: 15, resolved: 15 },
  { month: 'Nov', incidents: 20, resolved: 19 },
  { month: 'Dec', incidents: 14, resolved: 14 },
  { month: 'Jan', incidents: 15, resolved: 15 },
  { month: 'Fév', incidents: 12, resolved: 10 },
];

export default function RiskMetrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Métriques Risques</h1>
        <p className="text-muted-foreground">Indicateurs de performance gestion des risques</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                vs {metric.previous} mois précédent
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incidents par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {cat.incidents} incidents • Résolution moy: {cat.avgResolution}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${
                    cat.trend < 0 ? 'text-green-600' : 
                    cat.trend > 0 ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {cat.trend > 0 ? '+' : ''}{cat.trend}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrend.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-muted-foreground">
                      {month.resolved}/{month.incidents} résolus
                    </span>
                  </div>
                  <Progress value={(month.resolved / month.incidents) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
