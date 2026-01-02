import { useState } from 'react';
import {
  Megaphone,
  Star,
  Calendar,
  Mic,
  MessageCircle,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const successStories = [
  { id: 'story_1', title: 'From startup to €1M revenue', user: 'Entrepreneur anonymized', category: 'Growth', status: 'approved', views: 12500, date: '2026-01-01' },
  { id: 'story_2', title: 'Sustainable sourcing journey', user: 'Supplier anonymized', category: 'ESG', status: 'approved', views: 8200, date: '2025-12-28' },
  { id: 'story_3', title: 'Building trust in e-commerce', user: 'User testimonial', category: 'Trust', status: 'pending_review', views: 0, date: '2026-01-02' },
];

const podcastEpisodes = [
  { id: 'pod_1', title: 'The Future of Sustainable Commerce', guest: 'Industry Expert', status: 'published', duration: '45 min', releaseDate: '2025-12-20', listens: 4500 },
  { id: 'pod_2', title: 'Building Trust in Digital Marketplaces', guest: 'Product Team', status: 'scheduled', duration: '38 min', releaseDate: '2026-01-15', listens: 0 },
  { id: 'pod_3', title: 'Behind the Scenes: Operations', guest: 'Operations Lead', status: 'in_production', duration: '~40 min', releaseDate: '2026-01-22', listens: 0 },
];

const trustpilotInsights = {
  overallScore: 4.6,
  totalReviews: 12450,
  recentTrend: 'positive',
  breakdown: [
    { stars: 5, count: 8200, percentage: 66 },
    { stars: 4, count: 2800, percentage: 22 },
    { stars: 3, count: 900, percentage: 7 },
    { stars: 2, count: 350, percentage: 3 },
    { stars: 1, count: 200, percentage: 2 },
  ],
  topThemes: ['Fast shipping', 'Quality products', 'Great support', 'Easy returns'],
};

const contentCalendar = [
  { id: 'cal_1', title: 'New Year Campaign Launch', type: 'campaign', date: '2026-01-05', status: 'approved', channel: 'Multi-channel' },
  { id: 'cal_2', title: 'ESG Impact Report', type: 'content', date: '2026-01-10', status: 'in_review', channel: 'Website, Email' },
  { id: 'cal_3', title: 'Partner Spotlight Series', type: 'series', date: '2026-01-15', status: 'approved', channel: 'Social, Blog' },
  { id: 'cal_4', title: 'Customer Success Webinar', type: 'event', date: '2026-01-20', status: 'planning', channel: 'Live Stream' },
];

const approvedMessaging = [
  { id: 'msg_1', category: 'Value Proposition', message: 'Trust-first commerce for sustainable growth', approved: true, lastUpdated: '2025-12-15' },
  { id: 'msg_2', category: 'ESG Commitment', message: 'Real impact, measurable sustainability', approved: true, lastUpdated: '2025-12-20' },
  { id: 'msg_3', category: 'User Promise', message: 'Your success is our priority', approved: true, lastUpdated: '2025-12-10' },
];

export default function MarketingModule() {
  const [activeTab, setActiveTab] = useState('stories');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">Approved</Badge>;
      case 'pending_review':
      case 'in_review':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">In Review</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">Scheduled</Badge>;
      case 'in_production':
      case 'planning':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">In Production</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20">
              <Megaphone className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Marketing & Media</h1>
              <p className="text-sm text-muted-foreground">Brand narrative • Content control</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Brand Aligned
        </Badge>
      </div>

      {/* Trustpilot Overview */}
      <Card className="enterprise-card border-emerald-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-emerald-500 fill-emerald-500" />
                  <span className="text-3xl font-bold">{trustpilotInsights.overallScore}</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{trustpilotInsights.totalReviews.toLocaleString()} reviews</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                Trending positive
              </div>
            </div>
            <div className="flex gap-2">
              {trustpilotInsights.topThemes.map((theme) => (
                <Badge key={theme} variant="secondary" className="text-xs">{theme}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="stories">Success Stories</TabsTrigger>
          <TabsTrigger value="podcast">Podcast</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="messaging">Approved Messaging</TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Success Stories
              </CardTitle>
              <CardDescription>Customer and partner success narratives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {successStories.map((story) => (
                  <div key={story.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{story.title}</p>
                          {getStatusBadge(story.status)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{story.user}</span>
                          <Badge variant="outline" className="text-xs">{story.category}</Badge>
                          <span>{story.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {story.views.toLocaleString()} views
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="podcast" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Podcast Planning
              </CardTitle>
              <CardDescription>Episode management and scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {podcastEpisodes.map((episode) => (
                  <div key={episode.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{episode.title}</p>
                          {getStatusBadge(episode.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Guest: {episode.guest} • Duration: {episode.duration}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{episode.releaseDate}</p>
                        {episode.listens > 0 && (
                          <p className="text-emerald-500">{episode.listens.toLocaleString()} listens</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Content Calendar
              </CardTitle>
              <CardDescription>Upcoming content and campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contentCalendar.map((item) => (
                  <div key={item.id} className="data-row">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold">{item.date.split('-')[2]}</p>
                        <p className="text-xs text-muted-foreground">Jan</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                          <span>{item.channel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <Card className="enterprise-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Approved Messaging
              </CardTitle>
              <CardDescription>Brand-aligned communication guidelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedMessaging.map((msg) => (
                  <div key={msg.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{msg.category}</Badge>
                      {msg.approved && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-medium">"{msg.message}"</p>
                    <p className="text-xs text-muted-foreground mt-2">Last updated: {msg.lastUpdated}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
