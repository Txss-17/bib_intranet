import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, Plus, FileText, File, FolderOpen, Download, Eye, MoreHorizontal, Grid, List, Loader2, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getPoleById } from '@/data/poles';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import type { PoleId } from '@/types';

const from = (table: string) => (supabase as any).from(table);

interface DocRow {
  id: string;
  name: string;
  type: string;
  pole_id: PoleId | null;
  version: string;
  status: string;
  access_level: string;
  file_url: string | null;
  modified_by: string | null;
  created_at: string;
  updated_at: string;
}

function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await from('documents')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [scope, setScope] = useState<'all' | 'mine' | 'general'>('all');
  const { data: documents = [], isLoading } = useDocuments();
  const { profile, user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const qc = useQueryClient();

  const userPoles = (profile?.poles || []) as PoleId[];
  const canAddDocument = isAdmin || isManager;

  const createDoc = useMutation({
    mutationFn: async (doc: { name: string; type: string; access_level: string; pole_id: PoleId | null }) => {
      const { error } = await from('documents').insert({
        ...doc,
        uploaded_by: user?.id,
        modified_by: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      setCreateOpen(false);
      toast.success('Document ajouté');
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const [newDoc, setNewDoc] = useState<{ name: string; type: string; access_level: string; pole_id: PoleId | 'general' }>({ name: '', type: 'report', access_level: 'public', pole_id: (userPoles[0] as PoleId) || 'general' });

  const handleCreate = () => {
    if (!newDoc.name) { toast.error('Nom requis'); return; }
    createDoc.mutate({ ...newDoc, pole_id: newDoc.pole_id === 'general' ? null : newDoc.pole_id });
    setNewDoc({ name: '', type: 'report', access_level: 'public', pole_id: (userPoles[0] as PoleId) || 'general' });
  };

  // Visible: docs from user's poles + general (pole_id null) docs
  const visible = documents.filter(doc => {
    if (doc.pole_id === null) return true;
    return userPoles.includes(doc.pole_id);
  });

  const scoped = visible.filter(d => {
    if (scope === 'mine') return d.pole_id !== null;
    if (scope === 'general') return d.pole_id === null;
    return true;
  });

  const filtered = scoped.filter(doc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return doc.name.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q);
  });

  const getDocIcon = (type: string) => type === 'contract' ? FileText : File;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default' as const;
      case 'review': return 'secondary' as const;
      case 'draft': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  const getAccessColor = (level: string) => {
    switch (level) {
      case 'public': return 'text-success';
      case 'restricted': return 'text-warning';
      case 'confidential': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const stats = {
    total: visible.length,
    mine: visible.filter(d => d.pole_id !== null).length,
    general: visible.filter(d => d.pole_id === null).length,
    recent: visible.filter(d => {
      const diff = Date.now() - new Date(d.updated_at).getTime();
      return diff < 7 * 86400000;
    }).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Documents de vos pôles ({userPoles.join(', ') || '—'}) et documents généraux (guides, politiques internes…)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline"><FolderOpen className="h-4 w-4 mr-2" />Parcourir</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <div className="flex border border-input rounded-lg">
            <Button variant={scope === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setScope('all')} className="rounded-r-none">Tous</Button>
            <Button variant={scope === 'mine' ? 'default' : 'ghost'} size="sm" onClick={() => setScope('mine')} className="rounded-none border-x">Mes pôles</Button>
            <Button variant={scope === 'general' ? 'default' : 'ghost'} size="sm" onClick={() => setScope('general')} className="rounded-l-none">Général</Button>
          </div>
          <div className="flex border border-input rounded-lg">
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="rounded-r-none"><List className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="rounded-l-none"><Grid className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total visibles</p><p className="mt-2 text-2xl font-semibold text-foreground">{stats.total}</p></div>
        <div className="metric-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mes pôles</p><p className="mt-2 text-2xl font-semibold text-foreground">{stats.mine}</p></div>
        <div className="metric-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Généraux</p><p className="mt-2 text-2xl font-semibold text-foreground">{stats.general}</p></div>
        <div className="metric-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Récents (7j)</p><p className="mt-2 text-2xl font-semibold text-foreground">{stats.recent}</p></div>
      </div>

      {viewMode === 'list' ? (
        <div className="enterprise-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Pôle</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-2">Modifié</div>
            <div className="col-span-1">Actions</div>
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Aucun document trouvé</div>
          ) : filtered.map((doc) => {
            const pole = doc.pole_id ? getPoleById(doc.pole_id) : null;
            const Icon = getDocIcon(doc.type);
            return (
              <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 data-row items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className={cn('text-xs', getAccessColor(doc.access_level))}>{doc.access_level}</p>
                  </div>
                </div>
                <div className="col-span-2"><Badge variant="outline" className="capitalize">{doc.type}</Badge></div>
                <div className="col-span-2">
                  {pole && (
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', pole.color)} />
                      <span className="text-sm text-muted-foreground">{pole.shortName}</span>
                    </div>
                  )}
                </div>
                <div className="col-span-1"><span className="text-sm text-muted-foreground">v{doc.version}</span></div>
                <div className="col-span-2"><p className="text-sm text-muted-foreground">{format(new Date(doc.updated_at), 'd MMM yyyy', { locale: fr })}</p></div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Voir</DropdownMenuItem>
                      <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Télécharger</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3 enterprise-card p-12 text-center text-muted-foreground">Aucun document trouvé</div>
          ) : filtered.map((doc) => {
            const pole = doc.pole_id ? getPoleById(doc.pole_id) : null;
            const Icon = getDocIcon(doc.type);
            return (
              <div key={doc.id} className="enterprise-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Icon className="h-6 w-6 text-muted-foreground" /></div>
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
                </div>
                <h3 className="mt-3 text-sm font-medium text-foreground line-clamp-2">{doc.name}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {pole && (<><span className={cn('h-1.5 w-1.5 rounded-full', pole.color)} /><span>{pole.shortName}</span><span>·</span></>)}
                  <span>v{doc.version}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Modifié {format(new Date(doc.updated_at), 'd MMM yyyy', { locale: fr })}</p>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du document</Label>
              <Input value={newDoc.name} onChange={(e) => setNewDoc(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Rapport Q1 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newDoc.type} onValueChange={(v) => setNewDoc(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="report">Rapport</SelectItem>
                    <SelectItem value="contract">Contrat</SelectItem>
                    <SelectItem value="policy">Politique</SelectItem>
                    <SelectItem value="procedure">Procédure</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Accès</Label>
                <Select value={newDoc.access_level} onValueChange={(v) => setNewDoc(p => ({ ...p, access_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="restricted">Restreint</SelectItem>
                    <SelectItem value="confidential">Confidentiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rattachement</Label>
              <Select value={newDoc.pole_id} onValueChange={(v: any) => setNewDoc(p => ({ ...p, pole_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général (guides, politiques internes…)</SelectItem>
                  {userPoles.map(p => (
                    <SelectItem key={p} value={p}>Pôle {p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={createDoc.isPending}>
              {createDoc.isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
