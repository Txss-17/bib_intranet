import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Play, Headphones, TrendingUp, Eye, Edit, ExternalLink, Music } from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';

interface Episode {
  id: string;
  title: string;
  guest: string;
  duration: string;
  publishDate: string;
  listens: number | null;
  status: string;
  description: string;
  files: { name: string; url: string; type: string; size: number }[];
}

const initialEpisodes: Episode[] = [
  { id: 'POD-024', title: "L'avenir du B2B durable", guest: 'Jean-Marc Dupont', duration: '45:00', publishDate: '2024-03-10', listens: 2450, status: 'published', description: '', files: [] },
  { id: 'POD-023', title: 'Interview: CEO TechGreen', guest: 'Sophie Martin', duration: '38:00', publishDate: '2024-02-25', listens: 3120, status: 'published', description: '', files: [] },
  { id: 'POD-025', title: 'Logistique verte en 2024', guest: 'Pierre Lefèvre', duration: '42:00', publishDate: '2024-03-25', listens: null, status: 'scheduled', description: '', files: [] },
  { id: 'POD-022', title: 'RSE et performance', guest: 'Marie Bernard', duration: '35:00', publishDate: '2024-02-10', listens: 2890, status: 'published', description: '', files: [] },
];

const stats = [
  { label: 'Épisodes publiés', value: 24, icon: Headphones },
  { label: 'Écoutes totales', value: '45.2K', icon: Play },
  { label: 'Croissance mensuelle', value: '+18%', icon: TrendingUp },
];

export default function Podcasts() {
  const [search, setSearch] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [viewing, setViewing] = useState<Episode | null>(null);
  const [formData, setFormData] = useState({ title: '', guest: '', duration: '', publishDate: '', status: 'scheduled', description: '' });
  const [formFiles, setFormFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);

  const filtered = episodes.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.guest.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setFormData({ title: '', guest: '', duration: '', publishDate: '', status: 'scheduled', description: '' });
    setFormFiles([]);
    setFormOpen(true);
  };

  const openEdit = (ep: Episode) => {
    setEditing(ep);
    setFormData({ title: ep.title, guest: ep.guest, duration: ep.duration, publishDate: ep.publishDate, status: ep.status, description: ep.description });
    setFormFiles(ep.files);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setEpisodes(prev => prev.map(ep => ep.id === editing.id ? { ...ep, ...formData, files: formFiles } : ep));
    } else {
      const num = `POD-${String(episodes.length + 20).padStart(3, '0')}`;
      setEpisodes(prev => [...prev, { id: num, ...formData, listens: null, files: formFiles }]);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Podcasts</h1>
          <p className="text-muted-foreground">Gestion des épisodes podcast</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nouvel épisode</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un épisode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                <TableHead>Fichiers</TableHead>
                <TableHead>Écoutes</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((episode) => (
                <TableRow key={episode.id}>
                  <TableCell className="font-mono text-xs">{episode.id}</TableCell>
                  <TableCell className="font-medium">{episode.title}</TableCell>
                  <TableCell>{episode.guest}</TableCell>
                  <TableCell>{episode.duration}</TableCell>
                  <TableCell>{episode.publishDate}</TableCell>
                  <TableCell>
                    {episode.files.length > 0 ? (
                      <Badge variant="secondary" className="text-xs">{episode.files.length} fichier(s)</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>{episode.listens ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={episode.status === 'published' ? 'default' : 'secondary'}>
                      {episode.status === 'published' ? 'Publié' : 'Planifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setViewing(episode); setViewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(episode)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l\'épisode' : 'Nouvel épisode'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invité</Label>
                <Input value={formData.guest} onChange={e => setFormData({ ...formData, guest: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Durée (mm:ss)</Label>
                <Input value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} placeholder="45:00" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de publication</Label>
                <Input type="date" value={formData.publishDate} onChange={e => setFormData({ ...formData, publishDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Planifié</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Fichiers audio, couverture, documents</Label>
              <FileUploadZone
                bucket="product-assets"
                folder="marketing/podcasts"
                accept="audio/*,image/*,application/pdf"
                files={formFiles}
                onFilesChange={setFormFiles}
                label="Glissez vos fichiers audio, images ou documents"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
              <Button type="submit">{editing ? 'Enregistrer' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground uppercase">Invité</p><p className="text-foreground">{viewing.guest}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Durée</p><p className="text-foreground">{viewing.duration}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Date</p><p className="text-foreground">{viewing.publishDate}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Écoutes</p><p className="text-foreground">{viewing.listens ?? 'N/A'}</p></div>
              </div>
              {viewing.description && <p className="text-sm text-muted-foreground">{viewing.description}</p>}
              {viewing.files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Fichiers</p>
                  {viewing.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted text-sm">
                      <Music className="h-4 w-4 text-primary" />
                      <span className="flex-1 truncate text-foreground">{f.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
