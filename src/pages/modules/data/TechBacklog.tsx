import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListChecks, Plus, Search } from 'lucide-react';
import { useTechBacklog, useCreateBacklogItem } from '@/hooks/useDataQueries';
import { toast } from '@/hooks/use-toast';

const PRIO_STYLE: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-muted text-muted-foreground',
};

export default function TechBacklog() {
  const { data: items = [], isLoading } = useTechBacklog();
  const create = useCreateBacklogItem();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', impact: 'medium', complexity: 'm', due_date: '',
  });

  const filtered = useMemo(() => items.filter((i) => {
    if (status !== 'all' && i.status !== status) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, search, status]);

  const submit = async () => {
    if (!form.title.trim()) { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    await create.mutateAsync({
      title: form.title,
      description: form.description || null,
      priority: form.priority as any,
      impact: form.impact as any,
      complexity: form.complexity as any,
      due_date: form.due_date || null,
      status: 'todo',
    });
    setOpen(false);
    setForm({ title: '', description: '', priority: 'medium', impact: 'medium', complexity: 'm', due_date: '' });
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" /> Data & Analytics
          </div>
          <h1 className="text-2xl font-semibold">Backlog Tech</h1>
          <p className="text-sm text-muted-foreground mt-1">Priorités, impact, complexité et échéances.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nouvel item</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Ajouter au backlog</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Priorité</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['low','medium','high','critical'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Impact</Label>
                  <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['low','medium','high','strategic'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Complexité</Label>
                  <Select value={form.complexity} onValueChange={(v) => setForm({ ...form, complexity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['xs','s','m','l','xl'].map(v => <SelectItem key={v} value={v}>{v.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Échéance</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={create.isPending}>Ajouter</Button>
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
            <SelectItem value="all">Tous statuts</SelectItem>
            {['todo','in_progress','blocked','review','done','cancelled'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{filtered.length} items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Complexité</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Chargement…</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Backlog vide.</TableCell></TableRow>}
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="font-medium">{i.title}</div>
                    {i.description && <div className="text-xs text-muted-foreground line-clamp-1">{i.description}</div>}
                  </TableCell>
                  <TableCell><Badge className={PRIO_STYLE[i.priority]}>{i.priority}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{i.impact}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{i.complexity.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{i.due_date ? new Date(i.due_date).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell><Badge variant="outline">{i.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
