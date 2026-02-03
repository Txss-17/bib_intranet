import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Recycle, TrendingUp, Package, Trash2 } from 'lucide-react';

const stats = [
  { label: 'Taux recyclage global', value: 78, target: 85, icon: Recycle },
  { label: 'Emballages recyclés', value: 12450, unit: 'kg', icon: Package },
  { label: 'Déchets évités', value: 3200, unit: 'kg', icon: Trash2 },
  { label: 'Progression annuelle', value: 12, unit: '%', icon: TrendingUp },
];

const monthlyData = [
  { month: 'Janvier', collected: 1200, recycled: 950, rate: 79 },
  { month: 'Février', collected: 1350, recycled: 1080, rate: 80 },
  { month: 'Mars', collected: 1180, recycled: 920, rate: 78 },
  { month: 'Avril', collected: 1420, recycled: 1135, rate: 80 },
  { month: 'Mai', collected: 1550, recycled: 1270, rate: 82 },
  { month: 'Juin', collected: 1380, recycled: 1075, rate: 78 },
];

export default function RecyclingStats() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistiques Recyclage</h1>
        <p className="text-muted-foreground">Suivi des performances de recyclage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}{stat.unit && <span className="text-lg ml-1">{stat.unit}</span>}
              </div>
              {stat.target && (
                <div className="mt-2">
                  <Progress value={(stat.value / stat.target) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Objectif: {stat.target}%</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{data.month}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.collected} kg collectés → {data.recycled} kg recyclés
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={data.rate} className="w-24 h-2" />
                  <span className="text-sm font-medium w-12">{data.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
