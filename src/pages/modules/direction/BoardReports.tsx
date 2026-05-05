import React, { useState } from 'react';
import { FileBarChart, Plus, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBoardReports, useCreateBoardReport } from '@/hooks/useNewModules';
import { exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';
import ProtectedScreen from '@/components/ProtectedScreen';

const Page = () => {
  const { data, isLoading } = useBoardReports();
  const create = useCreateBoardReport();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'monthly', period: '', summary: '' });

  const submit = async () => {
    try {
      await create.mutateAsync(form);
      toast.success('Rapport créé');
      setOpen(false);
      setForm({ title: '', type: 'monthly', period: '', summary: '' });
    } catch (e: any) { toast.error(e.message); }
  };

  const exportBoardPack = () => {
    try {
      exportToPDF({
        filename: 'board-pack',
        title: 'Board Pack — Rapports consolidés',
        poleName: 'Direction',
        columns: [
          { header: 'Titre', accessor: 'title' },
          { header: 'Type', accessor: 'type' },
          { header: 'Période', accessor: 'period' },
          { header: 'Statut', accessor: 'status' },
          { header: 'Date', accessor: 'date' },
        ],
        data: (data ?? []).map((r: any) => ({
          title: r.title,
          type: r.type,
          period: r.period || '-',
          status: r.status,
          date: new Date(r.created_at).toLocaleDateString(),
        })),
      });
      toast.success('PDF Board Pack généré');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><FileBarChart className="h-8 w-8" /> Rapports consolidés</h1>
          <p className="text-muted-foreground mt-1">Board pack & reporting Direction</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportBoardPack}><Download className="h-4 w-4 mr-2" />Export Board Pack PDF</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nouveau rapport</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un rapport</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Titre</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="quarterly">Trimestriel</SelectItem>
                        <SelectItem value="annual">Annuel</SelectItem>
                        <SelectItem value="board">Board</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Période</Label><Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="Q1 2026" /></div>
                </div>
                <div><Label>Résumé</Label><Textarea rows={4} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={submit} disabled={!form.title || create.isPending}>Créer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
        <Card>
          <CardHeader><CardTitle>Rapports ({data?.length ?? 0})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(data ?? []).map((r: any) => (
              <div key={r.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="flex items-center gap-2"><span className="font-semibold">{r.title}</span><Badge variant="outline">{r.type}</Badge><Badge>{r.status}</Badge></div>
                  <p className="text-sm text-muted-foreground">{r.period} — {r.summary}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
            {(!data || data.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Aucun rapport</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function DirectionReportsPage() {
  return <ProtectedScreen screenId="direction.reports"><Page /></ProtectedScreen>;
}
