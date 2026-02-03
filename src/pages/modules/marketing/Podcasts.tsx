import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Play, Headphones, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Épisodes publiés', value: 24, icon: Headphones },
  { label: 'Écoutes totales', value: '45.2K', icon: Play },
  { label: 'Croissance mensuelle', value: '+18%', icon: TrendingUp },
];

const episodes = [
  { id: 'POD-024', title: 'L\'avenir du B2B durable', guest: 'Jean-Marc Dupont', duration: '45:00', publishDate: '2024-03-10', listens: 2450, status: 'published' },
  { id: 'POD-023', title: 'Interview: CEO TechGreen', guest: 'Sophie Martin', duration: '38:00', publishDate: '2024-02-25', listens: 3120, status: 'published' },
  { id: 'POD-025', title: 'Logistique verte en 2024', guest: 'Pierre Lefèvre', duration: '42:00', publishDate: '2024-03-25', listens: null, status: 'scheduled' },
  { id: 'POD-022', title: 'RSE et performance', guest: 'Marie Bernard', duration: '35:00', publishDate: '2024-02-10', listens: 2890, status: 'published' },
];

export default function Podcasts() {
  const [search, setSearch] = useState('');

  const filtered = episodes.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.guest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Podcasts</h1>
          <p className="text-muted-foreground">Gestion des épisodes podcast</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouvel épisode</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un épisode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Invité</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Écoutes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="font-mono">{episode.id}</TableCell>
                  <TableCell className="font-medium">{episode.title}</TableCell>
                  <TableCell>{episode.guest}</TableCell>
                  <TableCell>{episode.duration}</TableCell>
                  <TableCell>{episode.publishDate}</TableCell>
                  <TableCell>{episode.listens ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                      {episode.status === 'published' ? 'Publié' : 'Planifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
