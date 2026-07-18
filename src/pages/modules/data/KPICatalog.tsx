import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, BookOpen, GitPullRequest } from 'lucide-react';
import { useKpiCatalog, useCreateKpi, useCreateRequest } from '@/hooks/useDataQueries';
import { toast } from '@/hooks/use-toast';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  deprecated: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  archived: 'bg-muted text-muted-foreground',
};

export default function KPICatalog() {
  const { data: kpis = [], isLoading } = useKpiCatalog();
  const createKpi = useCreateKpi();
  const createRequest = useCreateRequest();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', formula: '', source: '',
    frequency: 'daily', tags: '',
  });

  const filtered = useMemo(() => {
    return kpis.filter((k) => {
      if (status !== 'all' && k.status !== status) return false;
      if (search && !k.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [kpis, search, status]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' });
      return;
    }
    await createKpi.mutateAsync({
      name: form.name,
      description: form.description || null,
      formula: form.formula || null,
      source: form.source || null,
      frequency: form.frequency as any,
      status: 'draft',
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
      pole_access: ['data'],
    });
    setOpen(false);
    setForm({ name: '', description: '', formula: '', source: '', frequency: 'daily', tags: '' });
  };

  const requestPublication = async (id: string, name: string) => {
    await createRequest.mutateAsync({
      title: `Publier KPI: ${name}`,
      description: 'Demande de publication depuis le catalogue.',
      request_type: 'kpi',
      related_kpi_id: id,
      status: 'draft',
      priority: 'medium',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Data & Analytics
          </div>
          <h1 className="text-2xl font-semibold">Catalogue KPI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bibliothèque officielle : définition, formule, source, responsable et version.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nouveau KPI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un KPI</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Taux de conversion boutique" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>Formule</Label>
                <Input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="Ex: commandes / visites × 100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Source</Label>
                  <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="orders, analytics..." />
                </div>
                <div>
                  <Label>Fréquence</Label>
                  <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Temps réel</SelectItem>
                      <SelectItem value="hourly">Horaire</SelectItem>
                      <SelectItem value="daily">Journalier</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tags (séparés par virgule)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="commerce, conversion" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={createKpi.isPending}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="deprecated">Dépréciés</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{filtered.length} KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Chargement…</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Aucun KPI. Créez-en un pour démarrer.</TableCell></TableRow>
              )}
              {filtered.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <div className="font-medium">{k.name}</div>
                    {k.description && <div className="text-xs text-muted-foreground line-clamp-1">{k.description}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{k.frequency ?? '—'}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">v{k.version}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[k.status] ?? ''} variant="outline">{k.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => requestPublication(k.id, k.name)}>
                      <GitPullRequest className="h-3.5 w-3.5 mr-1" /> Demander publication
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
