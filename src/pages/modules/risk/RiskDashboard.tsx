import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

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

const incidentTrend = [
  { month: 'Jan', critical: 2, high: 5, medium: 8, low: 12 },
  { month: 'Fév', critical: 1, high: 4, medium: 10, low: 15 },
  { month: 'Mar', critical: 3, high: 6, medium: 7, low: 11 },
  { month: 'Avr', critical: 1, high: 3, medium: 9, low: 14 },
  { month: 'Mai', critical: 2, high: 4, medium: 6, low: 10 },
  { month: 'Juin', critical: 1, high: 5, medium: 8, low: 13 },
];

const resolutionTime = [
  { month: 'Jan', avgTime: 5.2 },
  { month: 'Fév', avgTime: 4.8 },
  { month: 'Mar', avgTime: 5.5 },
  { month: 'Avr', avgTime: 4.2 },
  { month: 'Mai', avgTime: 3.8 },
  { month: 'Juin', avgTime: 4.2 },
];

const riskCategories = [
  { category: 'Opérationnel', score: 72, fullMark: 100 },
  { category: 'Financier', score: 58, fullMark: 100 },
  { category: 'Fournisseur', score: 65, fullMark: 100 },
  { category: 'Qualité', score: 78, fullMark: 100 },
  { category: 'Réputationnel', score: 82, fullMark: 100 },
  { category: 'Cyber', score: 70, fullMark: 100 },
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendance des incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="critical" name="Critique" fill="hsl(0, 84%, 60%)" stackId="a" />
                <Bar dataKey="high" name="Élevé" fill="hsl(25, 95%, 53%)" stackId="a" />
                <Bar dataKey="medium" name="Moyen" fill="hsl(48, 96%, 53%)" stackId="a" />
                <Bar dataKey="low" name="Bas" fill="hsl(142, 76%, 36%)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profil de risque</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={riskCategories}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="category" className="text-xs" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                <Radar
                  name="Score de risque"
                  dataKey="score"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temps de résolution moyen (heures)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={resolutionTime}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" domain={[0, 8]} />
              <Tooltip 
                formatter={(value: number) => [`${value}h`, 'Temps moyen']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
