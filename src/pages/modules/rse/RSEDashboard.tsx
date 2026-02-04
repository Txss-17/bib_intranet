import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Package, Recycle, Users, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const co2Evolution = [
  { month: 'Jan', emissions: 145, target: 130 },
  { month: 'Fév', emissions: 138, target: 128 },
  { month: 'Mar', emissions: 125, target: 125 },
  { month: 'Avr', emissions: 118, target: 122 },
  { month: 'Mai', emissions: 110, target: 120 },
  { month: 'Juin', emissions: 102, target: 118 },
];

const emissionsByCategory = [
  { name: 'Transport', value: 485, color: 'hsl(var(--chart-1))' },
  { name: 'Production', value: 312, color: 'hsl(var(--chart-2))' },
  { name: 'Packaging', value: 198, color: 'hsl(var(--chart-3))' },
  { name: 'Bureaux', value: 150, color: 'hsl(var(--chart-4))' },
  { name: 'Autres', value: 100, color: 'hsl(var(--chart-5))' },
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des émissions CO₂</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={co2Evolution}>
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
                <Area 
                  type="monotone" 
                  dataKey="emissions" 
                  name="Émissions réelles"
                  stroke="hsl(var(--chart-1))" 
                  fill="hsl(var(--chart-1))" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  name="Objectif"
                  stroke="hsl(var(--chart-2))" 
                  fill="hsl(var(--chart-2))" 
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des émissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={emissionsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {emissionsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} tonnes`, 'CO₂']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
