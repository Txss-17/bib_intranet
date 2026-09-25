import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useShops } from '@/hooks/useShops';
import { CONTRACT_STATUS_LABELS, type Contract, type ContractInput } from '@/hooks/useContracts';

interface ContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract;
  defaultShopId?: string;
  onSubmit: (data: ContractInput) => void;
}

const NONE = '__none__';

export default function ContractForm({ open, onOpenChange, contract, defaultShopId, onSubmit }: ContractFormProps) {
  const { data: shops = [] } = useShops();
  const init = () => ({
    title: contract?.title ?? '',
    type: contract?.type ?? 'Marchand',
    shop_id: contract?.shop_id ?? defaultShopId ?? '',
    party: contract?.party ?? '',
    start_date: contract?.start_date ?? '',
    end_date: contract?.end_date ?? '',
    value: contract?.value ?? '',
    status: (contract?.status ?? 'draft') as Contract['status'],
    document_url: contract?.document_url ?? '',
    notes: contract?.notes ?? '',
  });
  const [f, setF] = useState(init);
  useEffect(() => { if (open) setF(init()); }, [open, contract?.id, defaultShopId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...f, document_url: f.document_url || null, notes: f.notes || null, party: f.party || null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? 'Modifier le contrat' : 'Nouveau contrat'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du contrat</Label>
            <Input id="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Marchand', 'Abonnement', 'Fournisseur', 'Partenariat', 'Service', 'NDA', 'Logistique'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as Contract['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Boutique rattachée</Label>
            <Select value={f.shop_id || NONE} onValueChange={(v) => setF({ ...f, shop_id: v === NONE ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Aucune boutique</SelectItem>
                {shops.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.shop_code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="party">Cocontractant</Label>
            <Input id="party" value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} placeholder="Raison sociale" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sd">Début</Label>
              <Input id="sd" type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ed">Fin</Label>
              <Input id="ed" type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valeur (€)</Label>
            <Input id="value" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc">Lien du document signé</Label>
            <Input id="doc" type="url" value={f.document_url} onChange={(e) => setF({ ...f, document_url: e.target.value })} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">{contract ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
