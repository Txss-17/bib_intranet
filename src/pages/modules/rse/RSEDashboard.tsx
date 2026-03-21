import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf, Package, Recycle, Users, TrendingDown, Award, Heart, Star, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const stats = [
  { label: 'Score ESG', value: '82/100', icon: Leaf, trend: '+4.5', color: 'text-emerald-500' },
  { label: 'Taux Recyclage', value: '76%', icon: Recycle, trend: '+3%', color: 'text-emerald-500' },
  { label: 'Points Fidélité', value: '880K', icon: Users, trend: '+12K', color: 'text-primary' },
  { label: 'Projets ONGs', value: '4', icon: Heart, trend: '+1', color: 'text-pink-500' },
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

const esgBreakdown = [
  { label: 'Taux Recyclage', value: 76, target: 85 },
  { label: 'Empreinte CO₂', value: 68, target: 80 },
  { label: 'Énergie Renouvelable', value: 52, target: 70 },
  { label: 'Diversité & Inclusion', value: 88, target: 90 },
];

const certifications = [
  { name: 'Amfori BSCI', status: 'active', expiry: '2027-06-15' },
  { name: 'Global Recycled Standard', status: 'active', expiry: '2027-01-20' },
  { name: 'Norme ISO 14001', status: 'renewal', expiry: '2026-09-30' },
  { name: 'B-Corp', status: 'pending', expiry: 'En cours' },
];

const ongProjects = [
  { name: 'Reforestation Sénégal', partner: 'TreeAid', impact: '2,500 arbres plantés', status: 'active' },
  { name: 'Formation artisans Madagascar', partner: 'Artisan du Monde', impact: '45 artisans formés', status: 'active' },
  { name: 'Clean Ocean Initiative', partner: 'Surfrider', impact: '12T déchets collectés', status: 'active' },
  { name: 'Inclusion numérique', partner: 'Emmaüs Connect', impact: '200 bénéficiaires', status: 'planning' },
];

const testimonials = [
  { name: 'PoissonVert', score: 4.8, comment: 'Engagement RSE exemplaire, packaging 100% recyclé' },
  { name: 'GreenCampaign', score: 4.6, comment: 'Transparence et traçabilité des produits irréprochables' },
  { name: 'TerroirBio', score: 4.5, comment: 'Partenariat RSE solide et impact mesurable' },
];

const recyclingData = [
  { name: 'Carton', recycled: 85, target: 95 },
  { name: 'Plastique', recycled: 62, target: 80 },
  { name: 'Verre', recycled: 91, target: 95 },
  { name: 'Textile', recycled: 45, target: 60 },
  { name: 'Métal', recycled: 78, target: 90 },
];

const rseRapport = [
  { label: 'Recyclage Total', value: '321 KT', icon: Recycle },
  { label: 'Personnes Impactées', value: '2,800', icon: Users },
  { label: 'Budget RSE Annuel', value: '185 K€', icon: Globe },
];

export default function RSEDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RSE & Développement Durable</h1>
        <p className="text-muted-foreground">Impact environnemental et responsabilité sociale</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.color}`}>{stat.trend} vs année précédente</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score ESG détaillé + CO2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-emerald-500" /> Score ESG Détaillé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="hsl(var(--chart-2))" strokeWidth="3" strokeDasharray="82, 100" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">82</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {esgBreakdown.map(e => (
                <div key={e.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{e.label}</span>
                    <span className="text-muted-foreground">{e.value}% / {e.target}%</span>
                  </div>
                  <Progress value={e.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Évolution des émissions CO₂</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={co2Evolution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="emissions" name="Émissions réelles" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="target" name="Objectif" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Répartition émissions + Emballages recyclés */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Répartition des émissions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={emissionsByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {emissionsByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} tonnes`, 'CO₂']} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Emballages Recyclés</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recyclingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="recycled" name="Recyclé %" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="target" name="Objectif %" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Certifications + ONGs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Certifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certifications.map(c => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Expiration: {c.expiry}</p>
                  </div>
                  <Badge variant={c.status === 'active' ? 'default' : c.status === 'renewal' ? 'secondary' : 'outline'}>
                    {c.status === 'active' ? 'Actif' : c.status === 'renewal' ? 'Renouvellement' : 'En cours'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-pink-500" /> Engagement Social — ONGs</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ongProjects.map(p => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.partner} • {p.impact}</p>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'outline'}>{p.status === 'active' ? 'Actif' : 'Planifié'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Témoignages + RSE Rapport */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Témoignages Clients</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testimonials.map(t => (
                <div key={t.name} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{t.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{t.score}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> RSE Rapport Annuel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rseRapport.map(r => (
                <div key={r.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <r.icon className="h-6 w-6 text-emerald-500" />
                    <span className="text-sm">{r.label}</span>
                  </div>
                  <span className="text-xl font-bold">{r.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
