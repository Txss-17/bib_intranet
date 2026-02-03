import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Eye, Edit, Calendar } from 'lucide-react';

const contents = [
  { id: 'CNT-001', title: 'Article: Tendances 2024', type: 'Blog', author: 'Marie D.', publishDate: '2024-03-15', status: 'published', views: 1250 },
  { id: 'CNT-002', title: 'Vidéo: Behind the scenes', type: 'Vidéo', author: 'Lucas P.', publishDate: '2024-03-12', status: 'published', views: 3400 },
  { id: 'CNT-003', title: 'Infographie RSE', type: 'Visuel', author: 'Sophie B.', publishDate: '2024-03-20', status: 'scheduled', views: null },
  { id: 'CNT-004', title: 'Guide fournisseurs', type: 'PDF', author: 'Pierre M.', publishDate: '2024-03-08', status: 'published', views: 890 },
  { id: 'CNT-005', title: 'Newsletter Avril', type: 'Email', author: 'Marie D.', publishDate: '2024-04-01', status: 'draft', views: null },
];

export default function Content() {
  const [search, setSearch] = useState('');

  const filtered = contents.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contenu</h1>
          <p className="text-muted-foreground">Gestion des contenus marketing</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Nouveau contenu</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un contenu..."
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
                <TableHead>Type</TableHead>
                <TableHead>Auteur</TableHead>
                <TableHead>Date publication</TableHead>
                <TableHead>Vues</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-mono">{content.id}</TableCell>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>{content.type}</TableCell>
                  <TableCell>{content.author}</TableCell>
                  <TableCell>{content.publishDate}</TableCell>
                  <TableCell>{content.views ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      content.status === 'published' ? 'default' :
                      content.status === 'scheduled' ? 'secondary' : 'outline'
                    }>
                      {content.status === 'published' ? 'Publié' :
                       content.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Calendar className="h-4 w-4" /></Button>
                    </div>
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
