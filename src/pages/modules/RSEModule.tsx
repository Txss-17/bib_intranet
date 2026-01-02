import { useState } from 'react';
import {
  Leaf,
  Recycle,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Globe,
  CheckCircle,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const packagingStats = [
  { id: 'pkg_1', month: 'January', submitted: 12500, validated: 11800, recycled: 9400, rate: 79.7 },
  { id: 'pkg_2', month: 'December', submitted: 11200, validated: 10500, recycled: 8200, rate: 78.1 },
  { id: 'pkg_3', month: 'November', submitted: 10800, validated: 10100, recycled: 7800, rate: 77.2 },
];

const recyclingStats = {
  daily: { value: 312, change: 5.2 },
  monthly: { value: 8420, change: 12.3 },
  annual: { value: 98500, change: 18.7 },
};

const esgScore = {
  current: 78,
  previous: 72,
  target: 85,
  breakdown: [
    { category: 'Environmental', score: 82, weight: 40 },
    { category: 'Social', score: 75, weight: 35 },
    { category: 'Governance', score: 76, weight: 25 },
  ],
};

const supplierCompliance = [
  { supplier: 'Supplier Group A', compliance: 94, status: 'compliant' },
  { supplier: 'Supplier Group B', compliance: 87, status: 'compliant' },
  { supplier: 'Supplier Group C', compliance: 68, status: 'warning' },
  { supplier: 'Supplier Group D', compliance: 92, status: 'compliant' },
];

const userParticipation = {
  activeUsers: 12450,
  participatingUsers: 8920,
  participationRate: 71.6,
  monthlyGrowth: 4.3,
};

const co2Offset = {
  totalOffset: 2450,
  unit: 'tonnes CO₂',
  equivalents: [
    { label: 'Trees planted equivalent', value: '112,000' },
    { label: 'Cars off road for a year', value: '530' },
    { label: 'Flights Paris-NYC avoided', value: '4,200' },
  ],
};

export default function RSEModule() {
  const [activeTab, setActiveTab] = useState('overview');

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return 'text-emerald-500';
    if (compliance >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Leaf className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">RSE / ESG</h1>
              <p className="text-sm text-muted-foreground">Environmental & Social Impact • Real-time tracking</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3" />
            Data Verified
          </Badge>
        </div>
      </div>

      {/* ESG Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="enterprise-card md:col-span-2 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Global ESG Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-emerald-500">{esgScore.current}</p>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-emerald-500">
                  <TrendingUp className="h-3 w-3" />
                  +{esgScore.current - esgScore.previous} pts vs last quarter
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-2xl font-semibold">{esgScore.target}</p>
                <Progress value={(esgScore.current / esgScore.target) * 100} className="w-24 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Offset</p>
                <p className="text-2xl font-bold">{co2Offset.totalOffset.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{co2Offset.unit}</p>
              </div>
              <Cloud className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="enterprise-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">User Participation</p>
                <p className="text-2xl font-bold">{userParticipation.participationRate}%</p>
                <p className="text-xs text-emerald-500">+{userParticipation.monthlyGrowth}% this month</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Packaging Lifecycle</TabsTrigger>
          <TabsTrigger value="recycling">Recycling Stats</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier ESG</TabsTrigger>
          <TabsTrigger value="carbon">CO₂ Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                Packaging Lifecycle Tracking
              </CardTitle>
              <CardDescription>From submission to recycling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packagingStats.map((stat) => (
                  <div key={stat.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.month}</span>
                      <span className="text-emerald-500 font-semibold">{stat.rate}% recycled</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">Submitted: {stat.submitted.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Validated: {stat.validated.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Recycled: {stat.recycled.toLocaleString()}</span>
                      </div>
                    </div>
                    <Progress value={stat.rate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ESG Breakdown */}
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                ESG Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {esgScore.breakdown.map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-xs text-muted-foreground">({item.weight}% weight)</span>
                      </div>
                      <span className={cn('font-semibold', item.score >= 75 ? 'text-emerald-500' : 'text-amber-500')}>
                        {item.score}/100
                      </span>
                    </div>
                    <Progress value={item.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recycling" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="enterprise-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Recycling</p>
                    <p className="text-2xl font-bold">{recyclingStats.daily.value}</p>
                    <p className="text-xs text-emerald-500">+{recyclingStats.daily.change}% vs avg</p>
                  </div>
                  <Recycle className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Total</p>
                    <p className="text-2xl font-bold">{recyclingStats.monthly.value.toLocaleString()}</p>
                    <p className="text-xs text-emerald-500">+{recyclingStats.monthly.change}% vs last month</p>
                  </div>
                  <Recycle className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="enterprise-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Total</p>
                    <p className="text-2xl font-bold">{recyclingStats.annual.value.toLocaleString()}</p>
                    <p className="text-xs text-emerald-500">+{recyclingStats.annual.change}% vs last year</p>
                  </div>
                  <Recycle className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Supplier ESG Compliance
              </CardTitle>
              <CardDescription>Aggregated compliance scores (anonymized)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierCompliance.map((supplier) => (
                  <div key={supplier.supplier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{supplier.supplier}</span>
                        {supplier.status === 'warning' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs Improvement
                          </Badge>
                        )}
                      </div>
                      <span className={cn('font-semibold', getComplianceColor(supplier.compliance))}>
                        {supplier.compliance}%
                      </span>
                    </div>
                    <Progress value={supplier.compliance} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carbon" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                CO₂ Offset Estimation
              </CardTitle>
              <CardDescription>Environmental impact equivalents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-4xl font-bold text-emerald-500">{co2Offset.totalOffset.toLocaleString()}</p>
                <p className="text-muted-foreground">{co2Offset.unit} offset this year</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {co2Offset.equivalents.map((equiv) => (
                  <Card key={equiv.label} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <p className="text-2xl font-bold">{equiv.value}</p>
                      <p className="text-sm text-muted-foreground">{equiv.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
