import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const stats = [
  { label: 'Campagnes actives', value: 8, icon: Megaphone, trend: '+2' },
  { label: 'Reach total', value: '125K', icon: Users, trend: '+15%' },
  { label: 'Taux engagement', value: '4.2%', icon: TrendingUp, trend: '+0.5%' },
  { label: 'Contenus publiés', value: 45, icon: FileText, trend: '+12' },
];

const activeCampaigns = [
  { name: 'Lancement Printemps 2024', channel: 'Multi-canal', status: 'active', reach: '45K', engagement: '5.2%' },
  { name: 'Newsletter Mensuelle', channel: 'Email', status: 'active', reach: '28K', engagement: '3.8%' },
  { name: 'Podcast Épisode 12', channel: 'Audio', status: 'scheduled', reach: '-', engagement: '-' },
  { name: 'Campagne LinkedIn B2B', channel: 'Social', status: 'active', reach: '18K', engagement: '4.5%' },
];

const monthlyPerformance = [
  { month: 'Jan', reach: 85000, engagement: 3.2, conversions: 420 },
  { month: 'Fév', reach: 92000, engagement: 3.5, conversions: 480 },
  { month: 'Mar', reach: 105000, engagement: 3.8, conversions: 550 },
  { month: 'Avr', reach: 98000, engagement: 4.0, conversions: 510 },
  { month: 'Mai', reach: 115000, engagement: 4.1, conversions: 620 },
  { month: 'Juin', reach: 125000, engagement: 4.2, conversions: 680 },
];

const channelDistribution = [
  { name: 'Email', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'LinkedIn', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'Google Ads', value: 20, color: 'hsl(var(--chart-3))' },
  { name: 'Organic', value: 15, color: 'hsl(var(--chart-4))' },
  { name: 'Autres', value: 5, color: 'hsl(var(--chart-5))' },
];

const budgetByChannel = [
  { channel: 'Google Ads', budget: 15000, spent: 12500 },
  { channel: 'LinkedIn', budget: 8000, spent: 7200 },
  { channel: 'Email', budget: 3000, spent: 2800 },
  { channel: 'Display', budget: 5000, spent: 4200 },
  { channel: 'Influence', budget: 10000, spent: 6000 },
];

export default function MarketingDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing & Media</h1>
        <p className="text-muted-foreground">Gestion des campagnes et contenus</p>
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
              <p className="text-xs text-green-600">{stat.trend} ce mois</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="reach" 
                  name="Reach"
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversions" 
                  name="Conversions"
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
            <CardTitle>Répartition par canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                  labelLine={false}
                >
                  {channelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Part']}
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
          <CardTitle>Budget par canal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetByChannel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="channel" type="category" width={80} className="text-xs" />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} €`, '']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              <Bar dataKey="spent" name="Dépensé" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campagnes en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeCampaigns.map((campaign, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.channel}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.reach}</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{campaign.engagement}</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                    {campaign.status === 'active' ? 'Actif' : 'Planifié'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
