import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Eye, Edit, Calendar, FileText, Image as ImageIcon, Film, ExternalLink } from 'lucide-react';
import FileUploadZone from '@/components/FileUploadZone';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  author: string;
  publishDate: string;
  status: string;
  views: number | null;
  description: string;
  files: { name: string; url: string; type: string; size: number }[];
}

const initialContents: ContentItem[] = [
  { id: 'CNT-001', title: 'Article: Tendances 2024', type: 'Blog', author: 'Marie D.', publishDate: '2024-03-15', status: 'published', views: 1250, description: '', files: [] },
  { id: 'CNT-002', title: 'Vidéo: Behind the scenes', type: 'Vidéo', author: 'Lucas P.', publishDate: '2024-03-12', status: 'published', views: 3400, description: '', files: [] },
  { id: 'CNT-003', title: 'Infographie RSE', type: 'Visuel', author: 'Sophie B.', publishDate: '2024-03-20', status: 'scheduled', views: null, description: '', files: [] },
  { id: 'CNT-004', title: 'Guide fournisseurs', type: 'PDF', author: 'Pierre M.', publishDate: '2024-03-08', status: 'published', views: 890, description: '', files: [] },
  { id: 'CNT-005', title: 'Newsletter Avril', type: 'Email', author: 'Marie D.', publishDate: '2024-04-01', status: 'draft', views: null, description: '', files: [] },
];

export default function Content() {
  const [search, setSearch] = useState('');
  const [contents, setContents] = useState<ContentItem[]>(initialContents);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [viewing, setViewing] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({ title: '', type: 'Blog', author: '', publishDate: '', status: 'draft', description: '' });
  const [formFiles, setFormFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);

  const filtered = contents.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setFormData({ title: '', type: 'Blog', author: '', publishDate: '', status: 'draft', description: '' });
    setFormFiles([]);
    setFormOpen(true);
  };

  const openEdit = (c: ContentItem) => {
    setEditing(c);
    setFormData({ title: c.title, type: c.type, author: c.author, publishDate: c.publishDate, status: c.status, description: c.description });
    setFormFiles(c.files);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setContents(prev => prev.map(c => c.id === editing.id ? { ...c, ...formData, files: formFiles } : c));
    } else {
      const num = `CNT-${String(contents.length + 1).padStart(3, '0')}`;
      setContents(prev => [...prev, { id: num, ...formData, views: null, files: formFiles }]);
    }
    setFormOpen(false);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'Vidéo') return <Film className="h-3 w-3" />;
    if (type === 'Visuel') return <ImageIcon className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contenu</h1>
          <p className="text-muted-foreground">Gestion des contenus marketing</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nouveau contenu</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un contenu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                <TableHead>Date</TableHead>
                <TableHead>Fichiers</TableHead>
                <TableHead>Vues</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-mono text-xs">{content.id}</TableCell>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell><div className="flex items-center gap-1">{getTypeIcon(content.type)}{content.type}</div></TableCell>
                  <TableCell>{content.author}</TableCell>
                  <TableCell>{content.publishDate}</TableCell>
                  <TableCell>
                    {content.files.length > 0 ? (
                      <Badge variant="secondary" className="text-xs">{content.files.length} fichier(s)</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>{content.views ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={content.status === 'published' ? 'default' : content.status === 'scheduled' ? 'secondary' : 'outline'}>
                      {content.status === 'published' ? 'Publié' : content.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setViewing(content); setViewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(content)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucun contenu trouvé</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le contenu' : 'Nouveau contenu'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Blog">Blog</SelectItem>
                    <SelectItem value="Vidéo">Vidéo</SelectItem>
                    <SelectItem value="Visuel">Visuel</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="scheduled">Planifié</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auteur</Label>
                <Input value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date de publication</Label>
                <Input type="date" value={formData.publishDate} onChange={e => setFormData({ ...formData, publishDate: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Fichiers (images, vidéos, documents)</Label>
              <FileUploadZone
                bucket="product-assets"
                folder="marketing/content"
                accept="image/*,video/*,application/pdf,.doc,.docx,.pptx"
                files={formFiles}
                onFilesChange={setFormFiles}
                label="Glissez vos images, vidéos ou documents ici"
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
                <div><p className="text-xs text-muted-foreground uppercase">Type</p><p className="text-foreground">{viewing.type}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Auteur</p><p className="text-foreground">{viewing.author}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Date</p><p className="text-foreground">{viewing.publishDate}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Vues</p><p className="text-foreground">{viewing.views ?? 'N/A'}</p></div>
              </div>
              {viewing.description && <p className="text-sm text-muted-foreground">{viewing.description}</p>}
              {viewing.files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Fichiers associés</p>
                  {viewing.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted text-sm">
                      <FileText className="h-4 w-4 text-primary" />
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
