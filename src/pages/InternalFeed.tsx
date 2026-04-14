import { useState } from 'react';
import { Search, Plus, Globe, Users, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedCard } from '@/components/dashboard/FeedCard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { FeedItem, PoleId } from '@/types';

const from = (table: string) => (supabase as any).from(table);

function useFeedPosts() {
  const qc = useQueryClient();

  // Realtime subscription for feed_posts
  useState(() => {
    const channel = supabase
      .channel('feed-posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, () => {
        qc.invalidateQueries({ queryKey: ['feed_posts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  });

  return useQuery({
    queryKey: ['feed_posts'],
    queryFn: async () => {
      const { data, error } = await from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        author: { name: p.author_name, role: p.author_role },
        poleId: p.pole_id as PoleId | undefined,
        title: p.title,
        content: p.content,
        type: p.type as FeedItem['type'],
        visibility: p.visibility as FeedItem['visibility'],
        createdAt: p.created_at,
        reactions: p.reactions || 0,
        comments: p.comments || 0,
      })) as FeedItem[];
    },
  });
}

const filterOptions = [
  { id: 'all', label: 'Tous', icon: Globe },
  { id: 'pole', label: 'Mon pôle', icon: Users },
  { id: 'restricted', label: 'Restreint', icon: Lock },
];

export default function InternalFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: feedItems = [], isLoading } = useFeedPosts();
  const { profile, user } = useAuth();
  const qc = useQueryClient();

  const createPost = useMutation({
    mutationFn: async (post: { title: string; content: string; type: string; visibility: string }) => {
      const { error } = await from('feed_posts').insert({
        ...post,
        author_id: user?.id,
        author_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Utilisateur',
        author_role: profile?.position || 'employee',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed_posts'] });
      setCreateOpen(false);
      toast.success('Publication créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'update', visibility: 'company' });

  const handleCreate = () => {
    if (!newPost.title || !newPost.content) { toast.error('Titre et contenu requis'); return; }
    createPost.mutate(newPost);
    setNewPost({ title: '', content: '', type: 'update', visibility: 'company' });
  };

  const filtered = feedItems.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.content.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Feed interne</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Annonces, mises à jour et réalisations</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Publier
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {filterOptions.map((filter) => (
            <Button key={filter.id} variant={activeFilter === filter.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveFilter(filter.id)} className="gap-2">
              <filter.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{filter.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="announcements">Annonces</TabsTrigger>
          <TabsTrigger value="policies">Politiques</TabsTrigger>
          <TabsTrigger value="achievements">Réalisations</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filtered.length === 0 ? (
            <div className="enterprise-card p-12 text-center text-muted-foreground">Aucune publication</div>
          ) : filtered.map((item) => <FeedCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="announcements" className="space-y-4">
          {filtered.filter(i => i.type === 'announcement').map((item) => <FeedCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="policies" className="space-y-4">
          {filtered.filter(i => i.type === 'policy').map((item) => <FeedCard key={item.id} item={item} />)}
        </TabsContent>
        <TabsContent value="achievements" className="space-y-4">
          {filtered.filter(i => i.type === 'achievement').map((item) => <FeedCard key={item.id} item={item} />)}
        </TabsContent>
      </Tabs>

      <div className="enterprise-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visibilité</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-success" /><span className="text-muted-foreground">Entreprise</span></div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" /><span className="text-muted-foreground">Pôle</span></div>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-warning" /><span className="text-muted-foreground">Restreint</span></div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle publication</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={newPost.title} onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="Titre de la publication" />
            </div>
            <div className="space-y-2">
              <Label>Contenu</Label>
              <Textarea value={newPost.content} onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))} placeholder="Rédigez votre message..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newPost.type} onValueChange={(v) => setNewPost(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Mise à jour</SelectItem>
                    <SelectItem value="announcement">Annonce</SelectItem>
                    <SelectItem value="policy">Politique</SelectItem>
                    <SelectItem value="achievement">Réalisation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibilité</Label>
                <Select value={newPost.visibility} onValueChange={(v) => setNewPost(p => ({ ...p, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Entreprise</SelectItem>
                    <SelectItem value="pole">Mon pôle</SelectItem>
                    <SelectItem value="restricted">Restreint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createPost.isPending}>
              {createPost.isPending ? 'Publication...' : 'Publier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
