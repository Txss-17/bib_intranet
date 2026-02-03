import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Leaf, TrendingDown, Truck, Factory, Package } from 'lucide-react';

const emissions = [
  { category: 'Transport', value: 485, percentage: 39, icon: Truck, trend: -8 },
  { category: 'Production', value: 312, percentage: 25, icon: Factory, trend: -5 },
  { category: 'Packaging', value: 198, percentage: 16, icon: Package, trend: -15 },
  { category: 'Autres', value: 250, percentage: 20, icon: Leaf, trend: -3 },
];

const monthlyEmissions = [
  { month: 'Jan', emissions: 112, target: 100 },
  { month: 'Fév', emissions: 98, target: 100 },
  { month: 'Mar', emissions: 105, target: 100 },
  { month: 'Avr', emissions: 95, target: 100 },
  { month: 'Mai', emissions: 88, target: 100 },
  { month: 'Juin', emissions: 92, target: 100 },
];

export default function CO2Impact() {
  const totalEmissions = emissions.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impact CO₂</h1>
        <p className="text-muted-foreground">Suivi de l'empreinte carbone</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Émissions totales 2024
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmissions}</div>
            <p className="text-sm text-green-600">tonnes CO₂</p>
            <p className="text-xs text-muted-foreground mt-2">-12% vs 2023</p>
          </CardContent>
        </Card>

        {emissions.map((item) => (
          <Card key={item.category}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.category}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}t</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={item.percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{item.percentage}%</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{item.trend}% vs 2023</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Émissions mensuelles (tonnes CO₂)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyEmissions.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="w-12 text-sm font-medium">{data.month}</span>
                <div className="flex-1 relative">
                  <Progress value={(data.emissions / 150) * 100} className="h-6" />
                  <div 
                    className="absolute top-0 h-6 w-0.5 bg-red-500"
                    style={{ left: `${(data.target / 150) * 100}%` }}
                  />
                </div>
                <span className={`w-16 text-sm font-medium ${data.emissions <= data.target ? 'text-green-600' : 'text-red-600'}`}>
                  {data.emissions}t
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">La ligne rouge indique l'objectif mensuel (100t)</p>
        </CardContent>
      </Card>
    </div>
  );
}
