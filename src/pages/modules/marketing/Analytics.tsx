import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Eye, MousePointer, Share2 } from 'lucide-react';

const kpis = [
  { label: 'Visiteurs uniques', value: '45,230', trend: '+12%', icon: Users },
  { label: 'Pages vues', value: '128,450', trend: '+8%', icon: Eye },
  { label: 'Taux de clic', value: '3.8%', trend: '+0.5%', icon: MousePointer },
  { label: 'Partages sociaux', value: '2,340', trend: '+25%', icon: Share2 },
];

const channelPerformance = [
  { channel: 'Email', visits: 12500, conversions: 450, rate: 3.6 },
  { channel: 'LinkedIn', visits: 8900, conversions: 320, rate: 3.6 },
  { channel: 'Google Ads', visits: 15200, conversions: 580, rate: 3.8 },
  { channel: 'Organic', visits: 22400, conversions: 890, rate: 4.0 },
  { channel: 'Referral', visits: 5200, conversions: 210, rate: 4.0 },
];

const topContent = [
  { title: 'Guide fournisseurs 2024', views: 4500, engagement: 85 },
  { title: 'Article: Tendances B2B', views: 3200, engagement: 72 },
  { title: 'Vidéo: Behind the scenes', views: 2800, engagement: 91 },
  { title: 'Podcast: CEO Interview', views: 2100, engagement: 68 },
];

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytiques</h1>
        <p className="text-muted-foreground">Performance marketing et engagement</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {kpi.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance par canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelPerformance.map((channel) => (
                <div key={channel.channel} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{channel.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {channel.visits.toLocaleString()} visites • {channel.conversions} conversions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{channel.rate}%</span>
                    <p className="text-xs text-muted-foreground">Taux conv.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top contenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContent.map((content) => (
                <div key={content.title} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{content.title}</span>
                    <span className="text-sm text-muted-foreground">{content.views} vues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={content.engagement} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{content.engagement}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
