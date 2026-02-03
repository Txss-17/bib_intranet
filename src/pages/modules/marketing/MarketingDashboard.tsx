import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, TrendingUp, Play, FileText } from 'lucide-react';

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
