import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Eye, Edit, Loader2, FileText, ExternalLink } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCampaigns, useCreateCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import FileUploadZone from '@/components/FileUploadZone';
import { useMediaAttachments, useSaveMediaAttachments } from '@/hooks/useMediaAttachments';

export default function Campaigns() {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', type: '', start_date: '', end_date: '', budget: '', status: 'planned',
    objective: '', target_audience: '', notes: '',
  });
  const [formFiles, setFormFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);

  const { data: campaigns = [], isLoading } = useCampaigns(search || undefined);
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const { data: allAttachments = [] } = useMediaAttachments('campaign');
  const saveAttachments = useSaveMediaAttachments();

  const openNew = () => {
    setEditingId(null);
    setFormData({ name: '', type: '', start_date: '', end_date: '', budget: '', status: 'planned', objective: '', target_audience: '', notes: '' });
    setFormFiles([]);
    setFormOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      name: c.name, type: c.type, start_date: c.start_date, end_date: c.end_date,
      budget: c.budget || '', status: c.status, objective: c.objective || '',
      target_audience: c.target_audience || '', notes: c.notes || '',
    });
    setFormFiles(campaignFiles[c.id] || []);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateCampaign.mutate({ id: editingId, ...formData }, { onSuccess: () => toast.success('Campagne modifiée') });
      setCampaignFiles(prev => ({ ...prev, [editingId]: formFiles }));
    } else {
      const num = `CMP-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
      createCampaign.mutate({ campaign_number: num, spent: '0 €', ...formData }, {
        onSuccess: (data: any) => {
          toast.success('Campagne créée');
          if (data?.id) setCampaignFiles(prev => ({ ...prev, [data.id]: formFiles }));
        }
      });
    }
    setFormOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Campagnes</h1><p className="text-muted-foreground">Gestion des campagnes marketing</p></div>
        <div className="flex gap-2">
          <ExportButtons filename="campagnes-marketing" title="Liste des campagnes marketing" poleName="Marketing" columns={[
            { header: 'N°', accessor: 'campaign_number' }, { header: 'Nom', accessor: 'name' },
            { header: 'Type', accessor: 'type' }, { header: 'Début', accessor: 'start_date' },
            { header: 'Fin', accessor: 'end_date' }, { header: 'Budget', accessor: 'budget' },
            { header: 'Dépensé', accessor: 'spent' }, { header: 'Statut', accessor: 'status' },
          ]} data={campaigns} />
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nouvelle campagne</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher une campagne..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead><TableHead>Nom</TableHead><TableHead>Type</TableHead>
                <TableHead>Période</TableHead><TableHead>Budget</TableHead><TableHead>Dépensé</TableHead>
                <TableHead>Fichiers</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.campaign_number}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell className="text-sm">{c.start_date} → {c.end_date}</TableCell>
                  <TableCell>{c.budget || '-'}</TableCell>
                  <TableCell>{c.spent || '-'}</TableCell>
                  <TableCell>
                    {(campaignFiles[c.id]?.length || 0) > 0 ? (
                      <Badge variant="secondary" className="text-xs">{campaignFiles[c.id].length} fichier(s)</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'active' ? 'default' : c.status === 'completed' ? 'secondary' : 'outline'}>
                      {c.status === 'active' ? 'Actif' : c.status === 'completed' ? 'Terminé' : 'Planifié'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setViewing(c); setViewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Aucune campagne trouvée</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier la campagne' : 'Nouvelle campagne'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Multi-canal">Multi-canal</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Social">Social Media</SelectItem>
                    <SelectItem value="Display">Display</SelectItem>
                    <SelectItem value="Influence">Influence</SelectItem>
                    <SelectItem value="SEA">SEA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planifié</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (€)</Label>
                <Input value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Audience cible</Label>
                <Input value={formData.target_audience} onChange={e => setFormData({ ...formData, target_audience: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Objectif</Label>
              <Input value={formData.objective} onChange={e => setFormData({ ...formData, objective: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Fichiers de campagne (visuels, documents)</Label>
              <FileUploadZone
                bucket="product-assets"
                folder="marketing/campaigns"
                accept="image/*,video/*,application/pdf,.doc,.docx,.pptx,.xlsx"
                files={formFiles}
                onFilesChange={setFormFiles}
                label="Glissez vos visuels, vidéos ou documents"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
              <Button type="submit">{editingId ? 'Enregistrer' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground uppercase">Type</p><p className="text-foreground">{viewing.type}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Statut</p><p className="text-foreground">{viewing.status}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Début</p><p className="text-foreground">{viewing.start_date}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Fin</p><p className="text-foreground">{viewing.end_date}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Budget</p><p className="text-foreground">{viewing.budget || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground uppercase">Dépensé</p><p className="text-foreground">{viewing.spent || 'N/A'}</p></div>
              </div>
              {viewing.objective && <div><p className="text-xs text-muted-foreground uppercase">Objectif</p><p className="text-sm text-foreground">{viewing.objective}</p></div>}
              {(campaignFiles[viewing.id]?.length || 0) > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Fichiers</p>
                  {campaignFiles[viewing.id].map((f: any, i: number) => (
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
