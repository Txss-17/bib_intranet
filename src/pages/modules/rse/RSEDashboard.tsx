import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Package, Recycle, Users, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const stats = [
  { label: 'Empreinte CO₂ (tonnes)', value: '1,245', icon: TrendingDown, trend: '-12%', color: 'text-green-600' },
  { label: 'Packaging validés', value: 89, icon: Package, trend: '+5' },
  { label: 'Taux recyclage', value: '78%', icon: Recycle, trend: '+3%' },
  { label: 'Points clients distribués', value: '45,230', icon: Users, trend: '+2,100' },
];

const objectives = [
  { name: 'Réduction CO₂ 2024', target: 20, current: 12, unit: '%' },
  { name: 'Packaging recyclable', target: 100, current: 89, unit: '%' },
  { name: 'Fournisseurs certifiés', target: 50, current: 38, unit: '' },
  { name: 'Score ESG', target: 85, current: 72, unit: '/100' },
];

export default function RSEDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RSE & Développement Durable</h1>
        <p className="text-muted-foreground">Impact environnemental et responsabilité sociale</p>
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
              <p className={`text-xs ${stat.color || 'text-green-600'}`}>
                {stat.trend} vs année précédente
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Objectifs RSE 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {objectives.map((obj) => (
              <div key={obj.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{obj.name}</span>
                  <span className="text-muted-foreground">
                    {obj.current}{obj.unit} / {obj.target}{obj.unit}
                  </span>
                </div>
                <Progress value={(obj.current / obj.target) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
