import { useState } from 'react';
import { Search, Filter, Plus, Globe, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { feedItems } from '@/data/mockData';
import { cn } from '@/lib/utils';

const filterOptions = [
  { id: 'all', label: 'All Updates', icon: Globe },
  { id: 'pole', label: 'My Poles', icon: Users },
  { id: 'restricted', label: 'Restricted', icon: Lock },
];

export default function InternalFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Internal Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Company announcements, updates, and achievements
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {filterOptions.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className="gap-2"
            >
              <filter.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{filter.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Feed Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {feedItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          {feedItems
            .filter((item) => item.type === 'announcement')
            .map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          {feedItems
            .filter((item) => item.type === 'policy')
            .map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {feedItems
            .filter((item) => item.type === 'achievement')
            .map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
        </TabsContent>
      </Tabs>

      {/* Visibility Legend */}
      <div className="enterprise-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Post Visibility Guide
        </h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-success" />
            <span className="text-muted-foreground">Company-wide</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">Pole-specific</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-warning" />
            <span className="text-muted-foreground">Restricted access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
