import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lightbulb } from 'lucide-react';
import { useCreateRDRecommendation, useRDReports } from '@/hooks/useRD';
import { toast } from 'sonner';

interface Props {
  trigger?: React.ReactNode;
  defaultDetail?: string;
  defaultCategory?: string;
  defaultPole?: 'tech' | 'ops' | 'supplier' | 'rse';
}

export default function CreateRecommendationDialog({ trigger, defaultDetail = '', defaultCategory = '', defaultPole = 'ops' }: Props) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(defaultDetail);
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [pole, setPole] = useState<'tech' | 'ops' | 'supplier' | 'rse'>(defaultPole);
  const [reportId, setReportId] = useState<string>('none');
  const { data: reports } = useRDReports();
  const create = useCreateRDRecommendation();

  const reset = () => {
    setDetail(defaultDetail);
    setCategory(defaultCategory);
    setPriority('medium');
    setPole(defaultPole);
    setReportId('none');
  };

  const submit = async () => {
    if (!detail.trim()) { toast.error('Détail requis'); return; }
    try {
      await create.mutateAsync({
        detail: detail.trim(),
        category: category || null,
        priority,
        target_pole: pole,
        status: 'proposed',
        report_id: reportId === 'none' ? null : reportId,
      });
      toast.success('Recommandation R&D créée');
      setOpen(false);
      reset();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDetail(defaultDetail); }}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm" variant="outline"><Lightbulb className="h-4 w-4 mr-1" />Créer reco</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouvelle recommandation R&D</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Détail</Label>
            <Textarea rows={3} value={detail} onChange={e => setDetail(e.target.value)} placeholder="Description de la recommandation..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Catégorie</Label>
              <Select value={category || 'none'} onValueChange={v => setCategory(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="product">Produit</SelectItem>
                  <SelectItem value="supplier">Fournisseur</SelectItem>
                  <SelectItem value="ux">UX</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pôle cible</Label>
              <Select value={pole} onValueChange={(v: any) => setPole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ops">Ops</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="rse">RSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rapport associé</Label>
              <Select value={reportId} onValueChange={setReportId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {(reports ?? []).map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
