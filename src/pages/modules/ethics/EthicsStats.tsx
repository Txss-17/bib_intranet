import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, TrendingUp, UserX, RotateCcw } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', signalements: 4 },
  { month: 'Fév', signalements: 6 },
  { month: 'Mar', signalements: 3 },
  { month: 'Avr', signalements: 8 },
  { month: 'Mai', signalements: 5 },
  { month: 'Juin', signalements: 10 },
];

const categoryData = [
  { name: 'Harcèlement', value: 12 },
  { name: 'Fraude', value: 8 },
  { name: 'Conflit d\'intérêts', value: 6 },
  { name: 'Corruption', value: 4 },
  { name: 'Discrimination', value: 3 },
  { name: 'Autre', value: 3 },
];

const sourceData = [
  { name: 'Anonyme', value: 22 },
  { name: 'Identifié', value: 14 },
];

const priorityData = [
  { name: 'Critique', value: 6 },
  { name: 'Haute', value: 14 },
  { name: 'Moyenne', value: 10 },
  { name: 'Basse', value: 6 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280'];

const EthicsStats = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistiques anonymisées</h1>
        <p className="text-muted-foreground">Données agrégées — aucune information individuelle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">36</p><p className="text-xs text-muted-foreground">Total signalements YTD</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">78%</p><p className="text-xs text-muted-foreground">Taux de résolution</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><UserX className="h-8 w-8 text-orange-500" /><div><p className="text-2xl font-bold">61%</p><p className="text-xs text-muted-foreground">% Anonyme</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><RotateCcw className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">3</p><p className="text-xs text-muted-foreground">Catégories récurrentes</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Tendance mensuelle</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="signalements" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Par source</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Par priorité</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  <Cell fill="hsl(var(--destructive))" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#eab308" />
                  <Cell fill="hsl(var(--muted-foreground))" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EthicsStats;
