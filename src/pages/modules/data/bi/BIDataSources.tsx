import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Database, Code, Zap, Package, FileDown, Sigma } from 'lucide-react';
import { useDataSources, useCreateDataSource, BIDataSource } from '@/hooks/useBI';

const TYPE_ICON: Record<string, any> = {
  kpi: Database, sql_view: Code, api: Zap, dataset: Package, export: FileDown, custom: Sigma,
};

const TYPE_LABEL: Record<string, string> = {
  kpi: 'KPI Catalog', sql_view: 'Vue SQL', api: 'API', dataset: 'Dataset', export: 'Export', custom: 'Calcul personnalisé',
};

export default function BIDataSources() {
  const { data: sources = [] } = useDataSources();
  const create = useCreateDataSource();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; type: BIDataSource['type']; description: string }>({ name: '', type: 'kpi', description: '' });

  const submit = async () => {
    if (!form.name.trim()) return;
    await create.mutateAsync(form);
    setOpen(false);
    setForm({ name: '', type: 'kpi', description: '' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Database className="h-3.5 w-3.5" /> BI · Sources
          </div>
          <h1 className="text-2xl font-semibold">Sources de données</h1>
          <p className="text-sm text-muted-foreground mt-1">KPI, vues SQL, API, datasets, exports et calculs personnalisés.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nouvelle source</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajouter une source de données</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={create.isPending}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-muted-foreground">Aucune source configurée. Le catalogue KPI est disponible par défaut dans le Designer.</CardContent></Card>
        )}
        {sources.map(s => {
          const Icon = TYPE_ICON[s.type] ?? Database;
          return (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4" /> {s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant="outline">{TYPE_LABEL[s.type]}</Badge>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
